# backend/app/api/routes/cim11.py
import os
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx

from app.api.auth import get_current_user

# ── Import du système de rotation de clés depuis routes.py ──────────
# On réutilise _get_active_key et _mark_key_exhausted au lieu de
# recréer une logique séparée qui ignore les clés 4 et 5.
try:
    from app.api.routes.routes import _get_active_key, _mark_key_exhausted, _API_KEYS
    _USE_ROUTES_ROTATION = True
except ImportError:
    try:
        from routes import _get_active_key, _mark_key_exhausted, _API_KEYS
        _USE_ROUTES_ROTATION = True
    except ImportError:
        _get_active_key      = None
        _mark_key_exhausted  = None
        _API_KEYS            = []
        _USE_ROUTES_ROTATION = False

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cim11", tags=["cim11"])

# ── Modèles Gemini à essayer dans l'ordre ───────────────────────────
GEMINI_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

SYSTEM_PROMPT = (
    "Tu es un assistant medical specialise exclusivement dans la CIM-11 "
    "(Classification Internationale des Maladies, 11e revision) publiee par l'OMS.\n\n"
    "Regles strictes :\n"
    "1. Reponds UNIQUEMENT aux questions relatives a la CIM-11 : codes diagnostiques, "
    "categories nosologiques, criteres de classification, definitions cliniques, "
    "regroupements de maladies, et comparaisons avec la CIM-10 si pertinent.\n"
    "2. Si la question n'est pas liee a la CIM-11, reponds poliment.\n"
    "3. Adresse-toi a un medecin qualifie avec un langage medical precis.\n"
    "4. Formate les codes CIM-11 entre crochets : [5A10], [CA01.0], etc.\n"
    "5. Structure tes reponses avec des listes ou categories quand c'est utile.\n"
    "6. N'invente jamais de codes. Si tu n'es pas certain, dis-le explicitement.\n"
    "7. Reponds toujours en francais."
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    doctor_name: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


# ── Système de clés local (fallback si import routes.py échoue) ─────
_local_keys: List[str] = []
_local_key_index: int = 0


def _load_all_gemini_keys() -> List[str]:
    """Charge toutes les clés GEMINI_API_KEY, GEMINI_API_KEY_2 ... GEMINI_API_KEY_10."""
    keys = []
    k = os.getenv("GEMINI_API_KEY", "").strip()
    if k:
        keys.append(k)
    for i in range(2, 11):
        k = os.getenv(f"GEMINI_API_KEY_{i}", "").strip()
        if k:
            keys.append(k)
    logger.info("CIM-11: %d cle(s) Gemini chargee(s)", len(keys))
    return keys


def _next_key() -> Optional[str]:
    """Retourne la prochaine clé disponible (rotation de routes.py ou locale)."""
    global _local_keys, _local_key_index

    if _USE_ROUTES_ROTATION and _API_KEYS:
        key = _get_active_key()
        if key:
            return key

    # Fallback local
    if not _local_keys:
        _local_keys = _load_all_gemini_keys()
    if not _local_keys:
        return None
    key = _local_keys[_local_key_index % len(_local_keys)]
    return key


def _exhaust_key(key: str):
    """Marque une clé comme épuisée et passe à la suivante."""
    global _local_key_index

    if _USE_ROUTES_ROTATION and _API_KEYS:
        _mark_key_exhausted(key)
        return

    # Fallback local
    if _local_keys:
        _local_key_index = (_local_key_index + 1) % len(_local_keys)
    logger.warning("CIM-11 [local]: cle ...%s epuisee -> rotation", key[:8])


def _count_available_keys() -> int:
    if _USE_ROUTES_ROTATION and _API_KEYS:
        return len(_API_KEYS)
    global _local_keys
    if not _local_keys:
        _local_keys = _load_all_gemini_keys()
    return len(_local_keys)


@router.post("", response_model=ChatResponse)
async def chat_with_cim11(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Assistant CIM-11 avec rotation automatique sur toutes les clés Gemini."""

    # ── Vérification des droits ──────────────────────────────────────
    user_role = (current_user.get("role") or "").strip().lower()
    is_admin  = bool(current_user.get("is_admin"))
    if user_role not in ["medecin", "médecin", "administrateur"] and not is_admin:
        raise HTTPException(status_code=403, detail="Acces reserve aux medecins")

    # ── Vérification des clés disponibles ───────────────────────────
    total_keys = _count_available_keys()
    if total_keys == 0:
        logger.error("CIM-11: aucune cle Gemini configuree")
        raise HTTPException(
            status_code=500,
            detail="Configuration API manquante. Veuillez configurer GEMINI_API_KEY.",
        )

    logger.info(
        "CIM-11: requete | user=%s | %d cle(s) disponible(s)",
        current_user.get("username"), total_keys,
    )

    # ── Construction du prompt ───────────────────────────────────────
    last_message = request.messages[-1].content if request.messages else ""

    history_lines = []
    for msg in request.messages[:-1]:
        role_label = "Utilisateur" if msg.role == "user" else "Assistant"
        history_lines.append(f"{role_label}: {msg.content}")
    history_text = "\n".join(history_lines[-6:])

    full_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Historique de la conversation :\n{history_text}\n\n"
        f"Utilisateur: {last_message}\n\n"
        f"Assistant:"
    )

    request_body = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1000,
            "topP": 0.9,
        },
    }

    # ── Boucle de tentatives : modèle × clé ─────────────────────────
    # Pour chaque modèle, on tente toutes les clés.
    # Sur 429 → on rotate la clé et réessaie.
    # Sur autre erreur → on passe au modèle suivant.
    exhausted_keys: set = set()

    for model_name in GEMINI_MODELS:
        attempts = 0

        while attempts < total_keys:
            attempts += 1

            api_key = _next_key()
            if not api_key:
                break

            # Si toutes les clés sont épuisées pour ce modèle, passe au suivant
            if api_key in exhausted_keys:
                logger.info(
                    "CIM-11: toutes les cles epuisees pour %s, modele suivant", model_name
                )
                break

            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model_name}:generateContent?key={api_key}"
            )
            logger.info(
                "CIM-11: essai %s | cle=...%s | tentative %d/%d",
                model_name, api_key[:8], attempts, total_keys,
            )

            try:
                async with httpx.AsyncClient(timeout=45.0) as client:
                    response = await client.post(
                        url,
                        headers={"Content-Type": "application/json"},
                        json=request_body,
                    )

                # ── 200 : succès ────────────────────────────────────
                if response.status_code == 200:
                    data = response.json()
                    reply_text = (
                        data.get("candidates", [{}])[0]
                            .get("content", {})
                            .get("parts", [{}])[0]
                            .get("text", "Desole, je n'ai pas pu generer une reponse.")
                    )
                    logger.info(
                        "CIM-11 OK | model=%s | cle=...%s | user=%s",
                        model_name, api_key[:8], current_user.get("username"),
                    )
                    return ChatResponse(reply=reply_text)

                # ── 429 : quota épuisé → rotate clé ────────────────
                elif response.status_code == 429:
                    logger.warning(
                        "CIM-11: 429 rate limit | model=%s | cle=...%s -> rotation",
                        model_name, api_key[:8],
                    )
                    exhausted_keys.add(api_key)
                    _exhaust_key(api_key)
                    continue  # Essaie la prochaine clé

                # ── 403 : clé invalide → rotate ─────────────────────
                elif response.status_code == 403:
                    logger.error(
                        "CIM-11: 403 cle invalide | cle=...%s", api_key[:8]
                    )
                    exhausted_keys.add(api_key)
                    _exhaust_key(api_key)
                    continue

                # ── Autre erreur → modèle suivant ───────────────────
                else:
                    logger.error(
                        "CIM-11: erreur HTTP %s | model=%s",
                        response.status_code, model_name,
                    )
                    break

            except HTTPException:
                raise  # Ne jamais avaler les HTTPException

            except httpx.TimeoutException:
                logger.error(
                    "CIM-11: timeout | model=%s | cle=...%s", model_name, api_key[:8]
                )
                break  # Passe au modèle suivant

            except httpx.ConnectError:
                logger.error("CIM-11: impossible de joindre Gemini")
                raise HTTPException(
                    status_code=503,
                    detail="Impossible de joindre le service IA. Verifiez la connexion.",
                )

            except Exception as e:
                logger.exception("CIM-11: erreur inattendue | %s", e)
                break

    # ── Toutes les clés et tous les modèles épuisés ─────────────────
    logger.error(
        "CIM-11: quota total epuise | %d cles x %d modeles | user=%s",
        total_keys, len(GEMINI_MODELS), current_user.get("username"),
    )
    return ChatResponse(
        reply=(
            "Tous les quotas Gemini sont momentanement atteints sur l'ensemble "
            f"des {total_keys} cle(s) configuree(s). "
            "Veuillez patienter 1 a 2 minutes avant de reessayer."
        )
    )