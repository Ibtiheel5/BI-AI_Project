from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Form
from fastapi.responses import StreamingResponse, Response
from app.services.inference import run_inference, get_inference_service
from app.models.prediction import PredictionResponse, HealthResponse
import os, json, asyncio, httpx, uuid, base64
from pathlib import Path
from dotenv import load_dotenv

# Force le chargement du .env avec chemin absolu
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)
print(f"🔑 GEMINI_API_KEY : {'OK' if os.getenv('GEMINI_API_KEY') else 'MANQUANTE'} — {_ENV_PATH}")

# ── Rotation de clés API Gemini ───────────────────────────────────────────────
# Ajoute autant de clés que tu veux dans .env :
#   GEMINI_API_KEY=cle1
#   GEMINI_API_KEY_2=cle2
#   GEMINI_API_KEY_3=cle3
# Quand une cle est epuisee (429), on passe automatiquement a la suivante.

import time as _time

def _load_api_keys():
    keys = []
    for var in ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3",
                "GEMINI_API_KEY_4", "GEMINI_API_KEY_5"]:
        k = os.getenv(var, "").strip()
        if k:
            keys.append(k)
    print(f"🔑 Cles Gemini disponibles : {len(keys)}")
    return keys

_API_KEYS = _load_api_keys()
_key_index = 0
_key_exhausted = {}  # {key_prefix: retry_timestamp}

def _get_active_key():
    """Retourne la cle active non epuisee. Round-robin sur 429."""
    global _key_index
    if not _API_KEYS:
        return None
    now = _time.time()
    for _ in range(len(_API_KEYS)):
        key = _API_KEYS[_key_index % len(_API_KEYS)]
        kprefix = key[:8]
        if now >= _key_exhausted.get(kprefix, 0):
            return key
        _key_index = (_key_index + 1) % len(_API_KEYS)
    # Toutes en cooldown → retourner quand meme la premiere
    return _API_KEYS[0]

def _mark_key_exhausted(key):
    """Marque la cle comme epuisee 60s et passe a la suivante."""
    global _key_index
    kprefix = key[:8]
    _key_exhausted[kprefix] = _time.time() + 60
    _key_index = (_key_index + 1) % max(len(_API_KEYS), 1)
    active = _API_KEYS[_key_index % len(_API_KEYS)][:8] if _API_KEYS else "none"
    print(f"[KeyRotation] Cle ...{kprefix} epuisee (60s cooldown) → rotation vers ...{active}")

router = APIRouter()
VALID_MODELS = ["chest", "lung", "brain"]

MODEL_LABELS = {
    "chest": "Radiographie thoracique (Chest X-Ray)",
    "lung":  "Scanner CT pulmonaire (Lung CT Scan)",
    "brain": "IRM cérébrale (Brain MRI)",
}

MODEL_CONTEXT = {
    "chest": "radiologie thoracique, incluant pathologies pulmonaires, cardiaques et pleurales visibles sur radiographie standard face",
    "lung":  "oncologie thoracique, spécifiquement la détection et caractérisation des lésions pulmonaires sur scanner CT",
    "brain": "neuro-oncologie, spécifiquement la classification des tumeurs cérébrales sur IRM avec séquences T1, T2 et gadolinium",
}


def build_prompt(prediction, confidence, probabilities, model_key):
    """Prompt pour Gemini Vision — analyse visuelle + scores combinés."""
    all_probs = sorted(probabilities.items(), key=lambda x: -x[1])
    top2 = all_probs[1] if len(all_probs) > 1 else None
    top3 = all_probs[2] if len(all_probs) > 2 else None
    conf  = confidence * 100
    margin = (all_probs[0][1] - top2[1]) * 100 if top2 else 100

    img_label = MODEL_LABELS.get(model_key, model_key)
    arch_info = {
        "chest": "ResNet-50 (85 000 Rx thoraciques, 10 classes)",
        "lung":  "EfficientNet (42 000 CT pulmonaires, 3 classes)",
        "brain": "EfficientNet-B3 (31 000 IRM cérébrales, 4 classes)",
    }.get(model_key, "CNN médical")

    dist_lines = "\n".join(
        f"  {'>' if cls == prediction else ' '} {cls:<22} {p*100:>6.1f}%"
        for cls, p in all_probs
    )

    if margin >= 50:
        margin_interp = f"TRÈS LARGE ({margin:.1f}%) — décision nette"
    elif margin >= 25:
        margin_interp = f"LARGE ({margin:.1f}%) — prédiction fiable"
    elif margin >= 10:
        margin_interp = f"MODÉRÉ ({margin:.1f}%) — différentiel non négligeable"
    else:
        margin_interp = f"FAIBLE ({margin:.1f}%) — ambiguïté, corrélation clinique impérative"

    top2_str = f"{top2[0]} ({top2[1]*100:.1f}%)" if top2 else "aucun"
    top3_str = f"{top3[0]} ({top3[1]*100:.1f}%)" if top3 else "aucun"
    conf_str   = f"{conf:.1f}"
    margin_str = f"{margin:.1f}"

    return (
        f"Tu es un radiologue expert en IA médicale. Tu t'adresses à un MÉDECIN.\n"
        f"Tu reçois UNE IMAGE MÉDICALE ({img_label}) ET les résultats d'un modèle IA ({arch_info}).\n"
        f"Ton rôle : analyser VISUELLEMENT cette image ET expliquer pourquoi le modèle a prédit cette classe.\n"
        f"Réponds en français. Vocabulaire médical technique. Pair-à-pair entre spécialistes.\n"
        f"\n"
        f"══════════════════════════════════════════════\n"
        f"RÉSULTATS DU MODÈLE IA\n"
        f"  Classe retenue    : {prediction}\n"
        f"  Confiance         : {conf_str}%\n"
        f"  Marge décisionnelle: {margin_interp}\n"
        f"  2e hypothèse      : {top2_str}\n"
        f"  3e hypothèse      : {top3_str}\n"
        f"  Distribution softmax:\n{dist_lines}\n"
        f"══════════════════════════════════════════════\n"
        f"\n"
        f"Génère EXACTEMENT ces 4 sections. 4-5 phrases chacune. 100% ancré dans l'image et les scores.\n"
        f"INTERDIT : généralités sur la maladie non liées à CE QUE TU VOIS dans cette image.\n"
        f"\n"
        f"## 🔍 Signes radiologiques observés sur cette image\n"
        f"Décris précisément CE QUE TU VOIS dans cette image {img_label} qui justifie {prediction}.\n"
        f"Identifie les signes radiologiques visibles : localisation, forme, densité, contours, distribution.\n"
        f"Quels éléments visuels spécifiques concordent avec {prediction} sur cette image précise ?\n"
        f"Quels signes permettent d'écarter visuellement {top2_str} sur cette image ?\n"
        f"\n"
        f"## 🤖 Corrélation signes visuels / décision du modèle ({conf_str}%)\n"
        f"Explique comment les features visuelles que tu observes ont conduit le CNN à {conf_str}% pour {prediction}.\n"
        f"Quels patterns visuels dans cette image ont activé {prediction} plutôt que {top2_str} ({margin_str}% d'écart) ?\n"
        f"Le score de {conf_str}% est-il cohérent avec la qualité et la clarté des signes visibles sur cette image ?\n"
        f"Y a-t-il des zones de l'image qui pourraient introduire une ambiguïté avec {top2_str} ?\n"
        f"\n"
        f"## ⚕️ Conduite clinique basée sur cette image\n"
        f"Compte tenu des signes visibles sur cette image ET du score {conf_str}%, quels examens complémentaires prioriser ?\n"
        f"Recommandations concrètes et hiérarchisées : examens de 1re/2e intention, seuils décisionnels, délais.\n"
        f"Quels éléments cliniques (anamnèse, examen physique) doivent être croisés avec ce que montre l'image ?\n"
        f"Guidelines applicables (HAS, SPLF, ATS/ERS, ESMO) selon le diagnostic suspecté.\n"
        f"\n"
        f"## ⚠️ Limites de cette analyse sur cette image\n"
        f"Y a-t-il des artefacts, variations de positionnement ou problèmes de qualité visibles sur CETTE image ?\n"
        f"Quels éléments visuels pourraient avoir biaisé le modèle vers {prediction} (faux positif potentiel) ?\n"
        f"Avec {margin_str}% d'écart sur {top2_str} : quels signes sur cette image permettraient de trancher formellement ?\n"
        f"Rappel médico-légal : score {conf_str}% = aide à la décision, responsabilité diagnostique = clinicien."
    )


# Modèles Gemini — ordre par quota (le plus généreux en premier)
# gemini-2.0-flash-lite : quota le plus élevé sur tier gratuit
# gemini-2.5-flash-lite : quota élevé
# gemini-2.5-flash      : quota plus limité mais meilleure qualité
GEMINI_MODELS = [
    "gemini-2.0-flash-lite",   # Quota max gratuit → toujours essayer en 1er
    "gemini-2.5-flash-lite",   # Fallback rapide
    "gemini-2.5-flash",        # Dernier recours (quota plus bas)
]

# Pour Vision (avec image) : même ordre
GEMINI_VISION_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

import hashlib
from collections import OrderedDict

# ── Cache en mémoire (MD5 image + model_key) ─────────────────────────────────
# Stocke le résultat Gemini pour éviter de rappeler l'API pour la même image
# LRU simple : max 50 entrées (évite la fuite mémoire)
_MAX_CACHE = 50
_gemini_cache: OrderedDict = OrderedDict()

def _cache_key(image_bytes: bytes, model_key: str) -> str:
    h = hashlib.md5(image_bytes).hexdigest()
    return f"{model_key}:{h}"

def _cache_get(key: str):
    if key in _gemini_cache:
        _gemini_cache.move_to_end(key)  # LRU : marquer comme récent
        print(f"[Cache] HIT → {key[:24]}...")
        return _gemini_cache[key]
    return None

def _cache_set(key: str, value):
    if len(_gemini_cache) >= _MAX_CACHE:
        oldest = next(iter(_gemini_cache))
        del _gemini_cache[oldest]
        print(f"[Cache] EVICT → {oldest[:24]}...")
    _gemini_cache[key] = value
    print(f"[Cache] SET → {key[:24]}... (total={len(_gemini_cache)})")


# ── Prompt fusionné : validation + explication en 1 seul appel ───────────────
def build_fused_prompt(prediction, confidence, probabilities, model_key):
    """
    Prompt unique qui fait 2 choses en 1 appel :
      PARTIE 1 : valide que l'image est du bon type médical
      PARTIE 2 : génère l'explication clinique complète
    Économise 1 appel Gemini sur 2.
    """
    expected   = MODEL_TYPE_LABELS.get(model_key, "une image médicale")
    expl_prompt = build_prompt(prediction, confidence, probabilities, model_key)

    return (
        f"## ÉTAPE 1 — VALIDATION DE L'IMAGE\n"
        f"Avant tout, vérifie que cette image est bien : {expected}\n"
        f"Si ce n'est PAS le bon type, réponds UNIQUEMENT avec cette ligne JSON et STOP :\n"
        f'INVALID:{{"image_type":"type détecté","reason":"explication courte"}}\n'
        f"Si c'est bien le bon type, continue à l'étape 2 SANS écrire de JSON.\n\n"
        f"## ÉTAPE 2 — ANALYSE CLINIQUE (seulement si image valide)\n"
        f"{expl_prompt}"
    )


async def stream_gemini_fused(
    prediction, confidence, probabilities, model_key,
    image_bytes=None, cache_key=None
):
    """
    Appel Gemini UNIQUE qui :
    1. Valide l'image (bon type médical ?)
    2. Si valide → stream l'explication clinique complète
    3. Si invalide → envoie un event 'invalid' avec le message d'erreur

    Utilise le cache : si même image déjà analysée → replay depuis cache.
    """
    # ── Vérifier le cache d'abord ─────────────────────────────────────────────
    if cache_key:
        cached = _cache_get(cache_key)
        if cached is not None:
            # Replay depuis le cache
            cached_type, cached_data = cached
            if cached_type == "invalid":
                yield json.dumps({"type": "invalid_image", "warning": cached_data})
            else:
                # Replay du texte en chunks
                yield json.dumps({"type": "explain_chunk", "text": cached_data, "from_cache": True})
            return

    if not _API_KEYS:
        yield json.dumps({"type": "explain_error", "error": "Aucune clé GEMINI_API_KEY configurée"})
        return

    prompt = build_fused_prompt(prediction, confidence, probabilities, model_key)

    parts_list = []
    if image_bytes:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        parts_list.append({"inline_data": {"mime_type": "image/jpeg", "data": b64}})
    parts_list.append({"text": prompt})

    request_body = {
        "contents": [{"role": "user", "parts": parts_list}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 3200},
        "systemInstruction": {"parts": [{"text": (
            "Tu es un radiologue expert en IA médicale. "
            "Analyse l'image médicale fournie avec précision. "
            "Réponds UNIQUEMENT en français, vocabulaire médical précis, ton pair-à-pair. "
            "Respecte EXACTEMENT le format demandé dans le prompt."
        )}]}
    }

    for model_name in GEMINI_VISION_MODELS:
        api_key = _get_active_key()
        if not api_key:
            break
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            + model_name + ":streamGenerateContent?alt=sse&key=" + api_key
        )
        print(f"[Gemini Fused] Trying {model_name} | image={'yes' if image_bytes else 'no'} | key=...{api_key[:8]}")

        try:
            async with httpx.AsyncClient(timeout=90) as client:
                async with client.stream(
                    "POST", url,
                    headers={"Content-Type": "application/json"},
                    json=request_body,
                ) as resp:
                    print(f"[Gemini Fused] {model_name} → HTTP {resp.status_code}")

                    if resp.status_code == 429:
                        print(f"[Gemini Fused] {model_name} → 429, rotation de clé...")
                        _mark_key_exhausted(api_key)
                        await asyncio.sleep(0.5)
                        continue

                    if resp.status_code != 200:
                        body = await resp.aread()
                        print(f"[Gemini Fused] Error: {body.decode()[:200]}")
                        continue

                    full_text = ""
                    chunks_sent = 0

                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:].strip()
                        if not data or data == "[DONE]":
                            continue
                        try:
                            parsed = json.loads(data)
                            parts  = parsed.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                            text   = "".join(p.get("text", "") for p in parts)
                            if text:
                                full_text += text

                                # Détecter si Gemini signale image invalide (INVALID:{...})
                                if full_text.lstrip().startswith("INVALID:"):
                                    # Extraire le JSON d'invalidation
                                    try:
                                        json_part = full_text.strip()[8:].strip()
                                        # Attendre d'avoir le JSON complet
                                        if json_part.endswith("}"):
                                            inv = json.loads(json_part)
                                            img_type = inv.get("image_type", "type inconnu")
                                            # Construire message avec suggestion
                                            suggestions = MODEL_SUGGESTIONS.get(model_key, {})
                                            suggestion_msg = ""
                                            for kw, sug in suggestions.items():
                                                if kw.lower() in img_type.lower():
                                                    suggestion_msg = f" {sug}"
                                                    break
                                            warning = (
                                                f"Image détectée : **{img_type}**. "
                                                f"Ce modèle attend {_model_label(model_key)}.{suggestion_msg}"
                                            )
                                            if cache_key:
                                                _cache_set(cache_key, ("invalid", warning))
                                            yield json.dumps({"type": "invalid_image", "warning": warning})
                                            return
                                    except Exception:
                                        pass
                                    continue  # Attendre la suite du JSON

                                # Stream normal de l'explication
                                chunks_sent += 1
                                yield json.dumps({"type": "explain_chunk", "text": text})

                        except Exception:
                            continue

                    print(f"[Gemini Fused] {model_name} → {chunks_sent} chunks ✅")

                    # Mettre en cache le texte complet (hors cas invalide)
                    if cache_key and full_text and not full_text.lstrip().startswith("INVALID:"):
                        _cache_set(cache_key, ("explain", full_text))
                    return

        except Exception as e:
            print(f"[Gemini Fused] {model_name} exception: {e}")
            continue

    yield json.dumps({"type": "explain_error", "error": "Quota Gemini dépassé. Réessayez dans 1 minute."})



async def stream_grok(prediction, confidence, probabilities, model_key):
    """Grok (xAI) — fallback si Gemini indisponible."""
    api_key = os.getenv("XAI_API_KEY", "")
    if not api_key:
        yield json.dumps({"type": "explain_error", "error": "Aucune clé API configurée (GEMINI_API_KEY ou XAI_API_KEY)"})
        return

    prompt = build_prompt(prediction, confidence, probabilities, model_key)
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            async with client.stream(
                "POST", "https://api.x.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "grok-3-mini", "stream": True,
                    "messages": [
                        {"role": "system", "content": "Tu es un médecin radiologue expert en IA médicale. Réponds uniquement en français avec un vocabulaire médical précis."},
                        {"role": "user", "content": prompt}
                    ],
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "): continue
                    data = line[6:].strip()
                    if data == "[DONE]": break
                    try:
                        text = json.loads(data)["choices"][0]["delta"].get("content", "")
                        if text:
                            yield json.dumps({"type": "explain_chunk", "text": text})
                    except: continue
    except Exception as e:
        yield json.dumps({"type": "explain_error", "error": str(e)})


MODEL_TYPE_LABELS = {
    "chest": "une radiographie thoracique (chest X-ray), en niveaux de gris, montrant les poumons, le cœur et la cage thoracique",
    "lung":  "un scanner CT pulmonaire (coupe axiale), en niveaux de gris, montrant les poumons en coupe transversale",
    "brain": "une IRM cérébrale (coupe axiale, sagittale ou coronale), en niveaux de gris, montrant le cerveau",
}

# Mots-clés détectés par Gemini → suggestion du bon modèle
# Couvre tous les cas croisés entre les 3 modèles
MODEL_SUGGESTIONS = {
    # Modèle chest sélectionné mais mauvaise image
    "chest": {
        "irm":                    "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cerveau":                "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cérébrale":              "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "brain":                  "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "scanner ct":             "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "scanner":                "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "ct scan":                "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "tomodensitométrie":      "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "coupe axiale":           "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "poumon":                 "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
    },
    # Modèle lung sélectionné mais mauvaise image
    "lung": {
        "radiographie thoracique":"👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "radiographie":           "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "rx thorax":              "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "chest x-ray":            "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "irm":                    "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cérébrale":              "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cerveau":                "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "brain":                  "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
    },
    # Modèle brain sélectionné mais mauvaise image
    "brain": {
        "radiographie thoracique":"👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "radiographie":           "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "rx thorax":              "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "chest x-ray":            "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "thorax":                 "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "scanner ct":             "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "scanner":                "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "ct scan":                "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "tomodensitométrie":      "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "coupe axiale":           "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "poumon":                 "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
    },
}

def validate_image_locally(image_bytes: bytes, model_key: str) -> tuple[bool, str]:
    """
    Validation locale SANS API.
    Règle simple et fiable : une image médicale (radio/IRM/CT) est TOUJOURS
    en niveaux de gris. Si l'image a des couleurs → rejet immédiat.
    """
    import numpy as np
    from PIL import Image as PILImage
    import io as _io

    try:
        img = PILImage.open(_io.BytesIO(image_bytes)).convert("RGB")
        img_small = img.resize((128, 128))
        arr = np.array(img_small, dtype=np.float32)

        r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

        # Écart moyen pixel par pixel entre les canaux R, G, B
        # Image grise  : R=G=B pour chaque pixel → diff_per_pixel ≈ 0
        # Image colorée: R≠G≠B pour chaque pixel → diff_per_pixel > seuil
        diff_rg = float(np.mean(np.abs(r - g)))
        diff_rb = float(np.mean(np.abs(r - b)))
        diff_gb = float(np.mean(np.abs(g - b)))
        max_diff = max(diff_rg, diff_rb, diff_gb)

        print(f"[LocalValidator] model={model_key} | diff_rg={diff_rg:.2f} diff_rb={diff_rb:.2f} diff_gb={diff_gb:.2f} | max={max_diff:.2f}")

        # Seuil : > 10 = couleurs détectées = pas une image médicale
        if max_diff > 10:
            return False, (
                f"Image **colorée** détectée (ce n'est pas une image en niveaux de gris). "
                f"Les images médicales (radio, IRM, scanner) sont toujours en noir et blanc. "
                f"Ce modèle attend {_model_label(model_key)}."
            )

        # Image en niveaux de gris → semble médicale
        print(f"[LocalValidator] Image en niveaux de gris → OK")
        return True, ""

    except Exception as e:
        print(f"[LocalValidator] Erreur : {e}")
        return True, ""  # fail-open si erreur inattendue


def _model_label(model_key: str) -> str:
    return {
        "chest": "une radiographie thoracique (Chest X-Ray)",
        "lung":  "un scanner CT pulmonaire (Lung CT)",
        "brain": "une IRM cérébrale (Brain MRI)",
    }.get(model_key, "une image médicale")


async def validate_image_with_gemini(image_bytes: bytes, model_key: str) -> tuple[bool, str]:
    """
    Validation Gemini Vision — détecte le type exact d'image.
    Si Gemini indisponible (429 ou pas de clé) → bascule sur validate_image_locally().
    """
    if not _API_KEYS:
        print("[ImageValidator] Aucune clé API → fallback local")
        return validate_image_locally(image_bytes, model_key)
    api_key = _get_active_key()  # sera mis à jour à chaque tentative

    expected = MODEL_TYPE_LABELS.get(model_key, "une image médicale")

    prompt = (
        f"Tu es un validateur d'images médicales. Analyse cette image.\n\n"
        f"Le modèle d'IA sélectionné attend : {expected}\n\n"
        f"Réponds UNIQUEMENT avec un JSON sur une seule ligne, sans markdown :\n"
        f'{{"is_valid": true/false, "image_type": "type détecté en français", "reason": "explication courte"}}\n\n'
        f"Règles STRICTES :\n"
        f"- is_valid = true SEULEMENT si l'image est EXACTEMENT du type attendu\n"
        f"- is_valid = false si c'est une autre modalité médicale (ex: radio au lieu d'IRM)\n"
        f"- is_valid = false si ce n'est pas une image médicale du tout\n"
        f"- image_type : décris précisément ce que tu vois (ex: 'radiographie thoracique', 'IRM cérébrale', 'boîte de médicament', 'photo', etc.)\n"
        f"- En cas de doute → is_valid: false\n"
        f"Réponds UNIQUEMENT avec le JSON, rien d'autre."
    )

    b64 = base64.b64encode(image_bytes).decode("utf-8")
    request_body = {
        "contents": [{"role": "user", "parts": [
            {"inline_data": {"mime_type": "image/jpeg", "data": b64}},
            {"text": prompt}
        ]}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 120},
    }

    all_429 = True
    for model_name in GEMINI_VISION_MODELS:
        api_key = _get_active_key()
        if not api_key:
            break
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            + model_name + ":generateContent?key=" + api_key
        )
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json=request_body,
                )
                if resp.status_code == 429:
                    print(f"[ImageValidator] {model_name} → 429, rotation de clé...")
                    _mark_key_exhausted(api_key)
                    await asyncio.sleep(0.5)
                    continue

                all_429 = False  # Au moins un modèle a répondu (même erreur)

                if resp.status_code != 200:
                    continue

                data = resp.json()
                text = (data.get("candidates", [{}])[0]
                            .get("content", {})
                            .get("parts", [{}])[0]
                            .get("text", "").strip())
                text = text.replace("```json", "").replace("```", "").strip()

                parsed   = json.loads(text)
                is_valid = bool(parsed.get("is_valid", True))
                img_type = parsed.get("image_type", "").lower()

                print(f"[ImageValidator] {model_name} → valid={is_valid} | type='{img_type}'")

                if is_valid:
                    return True, ""

                # Chercher suggestion de modèle dans img_type
                suggestions = MODEL_SUGGESTIONS.get(model_key, {})
                suggestion_msg = ""
                for keyword, suggestion in suggestions.items():
                    if keyword.lower() in img_type:
                        suggestion_msg = f" {suggestion}"
                        break

                rejection = (
                    f"Image détectée : **{parsed.get('image_type', 'type inconnu')}**. "
                    f"Ce modèle attend {_model_label(model_key)}.{suggestion_msg}"
                )
                return False, rejection

        except Exception as e:
            print(f"[ImageValidator] {model_name} error: {e}")
            continue

    # Tous les modèles ont retourné 429 → quota épuisé → fallback local
    if all_429:
        print("[ImageValidator] Quota Gemini épuisé → fallback validation locale")
        return validate_image_locally(image_bytes, model_key)

    # Autre erreur → fail-open
    return True, ""


@router.post("/predict")
async def predict(
    file:    UploadFile = File(...),
    gradcam: bool = Query(False),
    model:   str  = Query("chest"),
    explain: bool = Query(True),
):
    if model not in VALID_MODELS:
        raise HTTPException(400, detail=f"Modèle '{model}' invalide.")
    # Accept any image content type (browsers sometimes send application/octet-stream)
    allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/octet-stream"]
    if file.content_type and file.content_type not in allowed:
        # Also allow if filename ends with image extension
        ext = (file.filename or "").lower().rsplit(".", 1)[-1]
        if ext not in ["jpg", "jpeg", "png", "webp"]:
            raise HTTPException(400, detail=f"Format non supporté: {file.content_type}. Utilisez JPEG ou PNG.")

    image_bytes = await file.read()
    from app.core.config import settings
    if len(image_bytes) > settings.MAX_FILE_SIZE:
        raise HTTPException(413, detail="Fichier trop volumineux.")

    # ── Validation locale (sans API) : image colorée → rejet immédiat ─────────
    is_valid_local, local_reason = validate_image_locally(image_bytes, model)
    if not is_valid_local:
        async def rejected_local_stream():
            warning_local = "⛔ " + local_reason
            yield "data: " + json.dumps({'type':'prediction','filename':file.filename,'prediction':'—','confidence':0.0,'probabilities':{},'num_classes':None,'gradcam_image':None,'out_of_domain':True,'warning':warning_local,'entropy_ratio':1.0}) + "\n\n"
            yield 'data: {"type":"done"}\n\n'
        return StreamingResponse(rejected_local_stream(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # ── Clé de cache (MD5 image + modèle) ────────────────────────────────────
    ck = _cache_key(image_bytes, model)


    # ── Validation Gemini AVANT inférence ────────────────────────────────────
    # Vérifie que l'image correspond au bon modèle — AVANT de prédire quoi que ce soit
    is_valid_gemini, gemini_rejection = await validate_image_with_gemini(image_bytes, model)
    if not is_valid_gemini:
        async def rejected_gemini_stream():
            warning_gemini = "⛔ Mauvaise image pour ce modèle. " + gemini_rejection
            payload = json.dumps({
                "type": "prediction", "filename": file.filename,
                "prediction": "—", "confidence": 0.0, "probabilities": {},
                "num_classes": None, "gradcam_image": None,
                "out_of_domain": True, "warning": warning_gemini, "entropy_ratio": 1.0,
            })
            yield "data: " + payload + "\n\n"
            yield 'data: {"type":"done"}\n\n'
        return StreamingResponse(rejected_gemini_stream(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # ── Inférence ─────────────────────────────────────────────────────────────
    try:
        result = run_inference(image_bytes, with_gradcam=gradcam, model=model)
    except RuntimeError as e:
        raise HTTPException(503, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=f"Inférence échouée : {str(e)}")

    async def event_stream():
        # 1. Prédiction immédiate
        yield f"data: {json.dumps({'type':'prediction','filename':file.filename,'prediction':result['prediction'],'confidence':result['confidence'],'probabilities':result['probabilities'],'num_classes':result.get('num_classes'),'gradcam_image':result.get('gradcam_image'),'out_of_domain':result.get('out_of_domain'),'warning':result.get('warning'),'entropy_ratio':result.get('entropy_ratio')})}\n\n"

        # 2. Explication Gemini streamée (image déjà validée avant l'inférence)
        if not result.get("out_of_domain") and explain:
            async for chunk in stream_gemini_fused(
                result["prediction"], result["confidence"],
                result["probabilities"], model,
                image_bytes=image_bytes, cache_key=ck
            ):
                yield "data: " + chunk + "\n\n"
                await asyncio.sleep(0)

        yield 'data: {"type":"done"}\n\n'

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/report")
async def generate_report(
    file:          UploadFile = File(...),
    model:         str  = Query("chest"),
    patient_id:    str  = Query("PATIENT-INCONNU"),
    prediction:    str  = Query(...),
    confidence:    float = Query(...),
    probabilities: str  = Query("{}"),
    explain_text:  str  = Form(""),
    gradcam_image: str  = Form(""),
    report_id:     str  = Query(""),
):
    """Génère et retourne un rapport PDF médical complet."""
    if model not in VALID_MODELS:
        raise HTTPException(400, detail=f"Modèle '{model}' invalide.")

    # Lire l'image uploadée
    image_bytes = await file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8") if image_bytes else None

    # Parser les probabilités
    try:
        probs_dict = json.loads(probabilities)
    except Exception:
        probs_dict = {}

    # Générer un report_id si absent
    if not report_id:
        report_id = f"CHX-{uuid.uuid4().hex[:8].upper()}"

    # Importer et appeler le générateur PDF
    try:
        from app.services.report_generator import generate_report_pdf
    except ImportError:
        try:
            from report_generator import generate_report_pdf
        except ImportError:
            raise HTTPException(500, detail="Module report_generator introuvable.")

    try:
        pdf_bytes = generate_report_pdf(
            patient_id=patient_id,
            model_key=model,
            filename=file.filename or "image.jpg",
            prediction=prediction,
            confidence=confidence,
            probabilities=probs_dict,
            explain_text=explain_text,
            image_b64=image_b64,
            gradcam_b64=gradcam_image if gradcam_image else None,
            report_id=report_id,
        )
    except Exception as e:
        raise HTTPException(500, detail=f"Erreur génération PDF : {str(e)}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="rapport_ia_{patient_id}_{report_id}.pdf"',
            "X-Report-ID": report_id,
        },
    )


@router.get("/health", response_model=HealthResponse)
def health_check():
    svc = get_inference_service()
    return HealthResponse(
        status="ok" if svc.is_loaded else "degraded",
        message="ChestAI API is running" if svc.is_loaded else "API running but model not loaded",
        model_loaded=svc.is_loaded, num_classes=svc.num_classes,
        class_names=svc.class_names, device=None,
    )