# routes.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Form
from fastapi.responses import StreamingResponse, Response
from app.services.inference import run_inference, get_inference_service
from app.models.prediction import PredictionResponse, HealthResponse
import os, json, asyncio, httpx, uuid, base64
from pathlib import Path
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)
print(f"🔑 GEMINI_API_KEY : {'OK' if os.getenv('GEMINI_API_KEY') else 'MANQUANTE'} — {_ENV_PATH}")

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

_API_KEYS      = _load_api_keys()
_key_index     = 0
_key_exhausted = {}

def _get_active_key():
    global _key_index
    if not _API_KEYS:
        return None
    now = _time.time()
    for _ in range(len(_API_KEYS)):
        key     = _API_KEYS[_key_index % len(_API_KEYS)]
        kprefix = key[:8]
        if now >= _key_exhausted.get(kprefix, 0):
            return key
        _key_index = (_key_index + 1) % len(_API_KEYS)
    return _API_KEYS[0]

def _mark_key_exhausted(key):
    global _key_index
    kprefix = key[:8]
    _key_exhausted[kprefix] = _time.time() + 60
    _key_index = (_key_index + 1) % max(len(_API_KEYS), 1)
    active = _API_KEYS[_key_index % len(_API_KEYS)][:8] if _API_KEYS else "none"
    print(f"[KeyRotation] Cle ...{kprefix} epuisee → rotation vers ...{active}")

router = APIRouter()

VALID_MODELS = ["chest", "lung", "brain", "retina"]

MODEL_LABELS = {
    "chest":  "Radiographie thoracique (Chest X-Ray)",
    "lung":   "Scanner CT pulmonaire (Lung CT Scan)",
    "brain":  "IRM cérébrale (Brain MRI)",
    "retina": "Fond d'œil — Rétinopathie diabétique (Fundus Photography)",
}

MODEL_CONTEXT = {
    "chest":  "radiologie thoracique, incluant pathologies pulmonaires, cardiaques et pleurales visibles sur radiographie standard face",
    "lung":   "oncologie thoracique, spécifiquement la détection et caractérisation des lésions pulmonaires sur scanner CT",
    "brain":  "neuro-oncologie, spécifiquement la classification des tumeurs cérébrales sur IRM avec séquences T1, T2 et gadolinium",
    "retina": "ophtalmologie, spécifiquement la détection et gradation de la rétinopathie diabétique (DR) sur photographie du fond d'œil couleur",
}

MODEL_TYPE_LABELS = {
    "chest":  "une radiographie thoracique (chest X-ray), en niveaux de gris, montrant les poumons, le cœur et la cage thoracique",
    "lung":   "un scanner CT pulmonaire (coupe axiale), en niveaux de gris, montrant les poumons en coupe transversale",
    "brain":  "une IRM cérébrale (coupe axiale, sagittale ou coronale), en niveaux de gris, montrant le cerveau",
    "retina": "une photographie couleur du fond d'œil (rétinographie / fundus photography), montrant la rétine, la papille optique, les vaisseaux rétiniens et la macula",
}

MODEL_SUGGESTIONS = {
    "chest": {
        "irm":               "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cerveau":           "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cérébrale":         "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "scanner ct":        "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "scanner":           "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "fond d'œil":        "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "rétine":            "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "rétinographie":     "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "fundus":            "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "ophtalmologie":     "👉 Utilisez le modèle **Rétinopathie (Retina)**",
    },
    "lung": {
        "radiographie thoracique": "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "radiographie":            "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "irm":                     "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cerveau":                 "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "fond d'œil":              "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "rétine":                  "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "fundus":                  "👉 Utilisez le modèle **Rétinopathie (Retina)**",
    },
    "brain": {
        "radiographie":   "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "thorax":         "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "scanner ct":     "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "scanner":        "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "fond d'œil":     "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "rétine":         "👉 Utilisez le modèle **Rétinopathie (Retina)**",
        "fundus":         "👉 Utilisez le modèle **Rétinopathie (Retina)**",
    },
    "retina": {
        "radiographie":   "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "thorax":         "👉 Utilisez le modèle **Thorax complet (Chest X-Ray)**",
        "irm":            "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "cerveau":        "👉 Utilisez le modèle **Tumeur cérébrale (Brain MRI)**",
        "scanner ct":     "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "scanner":        "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
        "coupe axiale":   "👉 Utilisez le modèle **Cancer pulmonaire (Lung CT)**",
    },
}


def _model_label(model_key: str) -> str:
    return {
        "chest":  "une radiographie thoracique (Chest X-Ray)",
        "lung":   "un scanner CT pulmonaire (Lung CT)",
        "brain":  "une IRM cérébrale (Brain MRI)",
        "retina": "une photographie couleur du fond d'œil (Fundus Photography)",
    }.get(model_key, "une image médicale")


def build_prompt(prediction, confidence, probabilities, model_key):
    all_probs  = sorted(probabilities.items(), key=lambda x: -x[1])
    top2       = all_probs[1] if len(all_probs) > 1 else None
    top3       = all_probs[2] if len(all_probs) > 2 else None
    conf       = confidence * 100
    margin     = (all_probs[0][1] - top2[1]) * 100 if top2 else 100
    img_label  = MODEL_LABELS.get(model_key, model_key)

    # MODIFIÉ : description du modèle retina mise à jour pour refléter
    # le nouveau pipeline EfficientNet-B3 APTOS (sans GNN/BERT/TDA)
    arch_info  = {
        "chest":  "ResNet-50 (85 000 Rx thoraciques, 10 classes)",
        "lung":   "EfficientNet-B2 (42 000 CT pulmonaires, 3 classes)",
        "brain":  "EfficientNet-B3 (31 000 IRM cérébrales, 4 classes)",
        "retina": (
            "EfficientNet-B3 fine-tuné APTOS 2019 "
            "(3 662 fonds d'œil, 5 stades DR, "
            "class weights + WeightedRandomSampler, "
            "Quadratic Weighted Kappa)"
        ),
    }.get(model_key, "CNN médical")

    dist_lines = "\n".join(
        f"  {'>' if cls == prediction else ' '} {cls:<22} {p*100:>6.1f}%"
        for cls, p in all_probs
    )
    if margin >= 50:   margin_interp = f"TRÈS LARGE ({margin:.1f}%) — décision nette"
    elif margin >= 25: margin_interp = f"LARGE ({margin:.1f}%) — prédiction fiable"
    elif margin >= 10: margin_interp = f"MODÉRÉ ({margin:.1f}%) — différentiel non négligeable"
    else:              margin_interp = f"FAIBLE ({margin:.1f}%) — ambiguïté, corrélation clinique impérative"

    top2_str   = f"{top2[0]} ({top2[1]*100:.1f}%)" if top2 else "aucun"
    top3_str   = f"{top3[0]} ({top3[1]*100:.1f}%)" if top3 else "aucun"
    conf_str   = f"{conf:.1f}"

    # Contexte clinique spécifique à la rétinopathie pour guider Gemini
    retina_context = ""
    if model_key == "retina":
        retina_context = (
            "\nÉCHELLE DR (APTOS / ICDR) :\n"
            "  Grade 0 No_DR          : Pas de rétinopathie\n"
            "  Grade 1 Mild           : Microanévrismes isolés\n"
            "  Grade 2 Moderate       : Microanévrismes, hémorragies, exsudats, nodules cotonneux\n"
            "  Grade 3 Severe         : >20 hémorragies / 4 quadrants, AMIR, veines en chapelet\n"
            "  Grade 4 Proliferate_DR : Néovaisseaux, hémorragie prérétinienne ou vitréenne\n"
        )

    return (
        f"Tu es un médecin expert en IA médicale. Tu t'adresses à un MÉDECIN.\n"
        f"Tu reçois UNE IMAGE MÉDICALE ({img_label}) ET les résultats d'un modèle IA ({arch_info}).\n"
        f"Réponds en français. Vocabulaire médical technique. Pair-à-pair entre spécialistes.\n"
        f"{retina_context}"
        f"\n"
        f"══════════════════════════════════════════════\n"
        f"RÉSULTATS DU MODÈLE IA\n"
        f"  Classe retenue     : {prediction}\n"
        f"  Confiance          : {conf_str}%\n"
        f"  Marge décisionnelle: {margin_interp}\n"
        f"  2e hypothèse       : {top2_str}\n"
        f"  3e hypothèse       : {top3_str}\n"
        f"  Distribution softmax:\n{dist_lines}\n"
        f"══════════════════════════════════════════════\n"
        f"\n"
        f"Génère EXACTEMENT ces 4 sections. 4-5 phrases chacune.\n"
        f"\n"
        f"## 🔍 Signes observés sur cette image\n"
        f"Décris précisément CE QUE TU VOIS dans cette image qui justifie {prediction}.\n"
        f"\n"
        f"## 🤖 Corrélation signes visuels / décision du modèle ({conf_str}%)\n"
        f"Explique comment les features visuelles ont conduit le CNN à {conf_str}% pour {prediction}.\n"
        f"\n"
        f"## ⚕️ Conduite clinique basée sur cette image\n"
        f"Recommandations concrètes selon les guidelines (AAO/HAS pour rétinopathie).\n"
        f"\n"
        f"## ⚠️ Limites de cette analyse\n"
        f"Rappel médico-légal : score {conf_str}% = aide à la décision, responsabilité = clinicien."
    )


GEMINI_VISION_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

import hashlib
from collections import OrderedDict

_MAX_CACHE = 50
_gemini_cache: OrderedDict = OrderedDict()

def _cache_key(image_bytes: bytes, model_key: str) -> str:
    return f"{model_key}:{hashlib.md5(image_bytes).hexdigest()}"

def _cache_get(key: str):
    if key in _gemini_cache:
        _gemini_cache.move_to_end(key)
        return _gemini_cache[key]
    return None

def _cache_set(key: str, value):
    if len(_gemini_cache) >= _MAX_CACHE:
        del _gemini_cache[next(iter(_gemini_cache))]
    _gemini_cache[key] = value


def build_fused_prompt(prediction, confidence, probabilities, model_key):
    expected    = MODEL_TYPE_LABELS.get(model_key, "une image médicale")
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


async def stream_gemini_fused(prediction, confidence, probabilities, model_key,
                               image_bytes=None, cache_key=None):
    if cache_key:
        cached = _cache_get(cache_key)
        if cached is not None:
            cached_type, cached_data = cached
            if cached_type == "invalid":
                yield json.dumps({"type": "invalid_image", "warning": cached_data})
            else:
                yield json.dumps({"type": "explain_chunk", "text": cached_data, "from_cache": True})
            return

    if not _API_KEYS:
        yield json.dumps({"type": "explain_error", "error": "Aucune clé GEMINI_API_KEY configurée"})
        return

    prompt     = build_fused_prompt(prediction, confidence, probabilities, model_key)
    parts_list = []
    if image_bytes:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        parts_list.append({"inline_data": {"mime_type": "image/jpeg", "data": b64}})
    parts_list.append({"text": prompt})

    request_body = {
        "contents": [{"role": "user", "parts": parts_list}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 3200},
        "systemInstruction": {"parts": [{"text": (
            "Tu es un médecin expert en IA médicale. "
            "Réponds UNIQUEMENT en français, vocabulaire médical précis, ton pair-à-pair. "
            "Respecte EXACTEMENT le format demandé."
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
        print(f"[Gemini] Trying {model_name} | key=...{api_key[:8]}")
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                async with client.stream("POST", url,
                    headers={"Content-Type": "application/json"},
                    json=request_body) as resp:
                    print(f"[Gemini] {model_name} → HTTP {resp.status_code}")
                    if resp.status_code == 429:
                        _mark_key_exhausted(api_key)
                        await asyncio.sleep(0.5)
                        continue
                    if resp.status_code != 200:
                        await resp.aread()
                        continue

                    full_text = ""
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "): continue
                        data = line[6:].strip()
                        if not data or data == "[DONE]": continue
                        try:
                            parsed = json.loads(data)
                            parts  = parsed.get("candidates",[{}])[0].get("content",{}).get("parts",[])
                            text   = "".join(p.get("text","") for p in parts)
                            if text:
                                full_text += text
                                if full_text.lstrip().startswith("INVALID:"):
                                    try:
                                        json_part = full_text.strip()[8:].strip()
                                        if json_part.endswith("}"):
                                            inv      = json.loads(json_part)
                                            img_type = inv.get("image_type","type inconnu")
                                            sug      = ""
                                            for kw, s in MODEL_SUGGESTIONS.get(model_key,{}).items():
                                                if kw.lower() in img_type.lower():
                                                    sug = f" {s}"; break
                                            warning = (f"Image détectée : **{img_type}**. "
                                                       f"Ce modèle attend {_model_label(model_key)}.{sug}")
                                            if cache_key: _cache_set(cache_key, ("invalid", warning))
                                            yield json.dumps({"type": "invalid_image", "warning": warning})
                                            return
                                    except Exception: pass
                                    continue
                                yield json.dumps({"type": "explain_chunk", "text": text})
                        except Exception: continue

                    if cache_key and full_text and not full_text.lstrip().startswith("INVALID:"):
                        _cache_set(cache_key, ("explain", full_text))
                    return
        except Exception as e:
            print(f"[Gemini] {model_name} exception: {e}")
            continue

    yield json.dumps({"type": "explain_error", "error": "Quota Gemini dépassé. Réessayez dans 1 minute."})


def validate_image_locally(image_bytes: bytes, model_key: str) -> tuple:
    """
    Validation locale sans API.

    Règle de base : images médicales radiologiques (chest/lung/brain) → niveaux de gris.
    Exception : rétinopathie (retina) → images COULEUR (fundus photography).

    Seuil max_diff > 10 = couleurs détectées.
    """
    import numpy as np
    from PIL import Image as PILImage
    import io as _io

    try:
        img       = PILImage.open(_io.BytesIO(image_bytes)).convert("RGB")
        img_small = img.resize((128, 128))
        arr       = np.array(img_small, dtype=np.float32)
        r, g, b   = arr[:,:,0], arr[:,:,1], arr[:,:,2]
        max_diff  = max(float(np.mean(np.abs(r-g))),
                        float(np.mean(np.abs(r-b))),
                        float(np.mean(np.abs(g-b))))

        print(f"[LocalValidator] model={model_key} | max_diff={max_diff:.2f}")

        if model_key == "retina":
            # Fond d'œil → image COULEUR attendue
            if max_diff < 5:
                return False, (
                    "Image en **niveaux de gris** détectée. "
                    "Ce modèle attend une photographie couleur du fond d'œil (rétinographie). "
                    "Ces images montrent la rétine avec ses vaisseaux rouges/orangés sur fond sombre."
                )
            return True, ""
        else:
            # chest / lung / brain → niveaux de gris attendus
            if max_diff > 10:
                return False, (
                    f"Image **colorée** détectée. "
                    f"Les images médicales (radio, IRM, scanner) sont en niveaux de gris. "
                    f"Ce modèle attend {_model_label(model_key)}."
                )
            return True, ""

    except Exception as e:
        print(f"[LocalValidator] Erreur : {e}")
        return True, ""


async def validate_image_with_gemini(image_bytes: bytes, model_key: str) -> tuple:
    if not _API_KEYS:
        return validate_image_locally(image_bytes, model_key)

    expected = MODEL_TYPE_LABELS.get(model_key, "une image médicale")
    prompt   = (
        f"Tu es un validateur d'images médicales.\n"
        f"Le modèle attend : {expected}\n\n"
        f"Réponds UNIQUEMENT avec un JSON sur une seule ligne :\n"
        f'{{"is_valid": true/false, "image_type": "type détecté", "reason": "explication"}}\n\n'
        f"is_valid = true SEULEMENT si c'est exactement le bon type. En cas de doute → false.\n"
        f"Réponds UNIQUEMENT avec le JSON."
    )

    b64          = base64.b64encode(image_bytes).decode("utf-8")
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
        if not api_key: break
        url = ("https://generativelanguage.googleapis.com/v1beta/models/"
               + model_name + ":generateContent?key=" + api_key)
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(url, headers={"Content-Type": "application/json"},
                                         json=request_body)
                if resp.status_code == 429:
                    _mark_key_exhausted(api_key)
                    await asyncio.sleep(0.5)
                    continue
                all_429 = False
                if resp.status_code != 200: continue

                text = (resp.json().get("candidates",[{}])[0]
                            .get("content",{}).get("parts",[{}])[0]
                            .get("text","").strip()
                            .replace("```json","").replace("```","").strip())
                parsed   = json.loads(text)
                is_valid = bool(parsed.get("is_valid", True))
                img_type = parsed.get("image_type","").lower()
                print(f"[ImageValidator] {model_name} → valid={is_valid} type='{img_type}'")

                if is_valid: return True, ""

                sug = ""
                for kw, s in MODEL_SUGGESTIONS.get(model_key, {}).items():
                    if kw.lower() in img_type:
                        sug = f" {s}"; break
                return False, (f"Image détectée : **{parsed.get('image_type','inconnu')}**. "
                               f"Ce modèle attend {_model_label(model_key)}.{sug}")
        except Exception as e:
            print(f"[ImageValidator] {model_name} error: {e}")
            continue

    if all_429:
        return validate_image_locally(image_bytes, model_key)
    return True, ""


@router.post("/predict")
async def predict(
    file:    UploadFile = File(...),
    gradcam: bool = Query(False),
    model:   str  = Query("chest"),
    explain: bool = Query(True),
):
    if model not in VALID_MODELS:
        raise HTTPException(400, detail={
            "error": f"Modèle '{model}' invalide.",
            "available_models": VALID_MODELS,
        })

    allowed = ["image/jpeg","image/png","image/jpg","image/webp","application/octet-stream"]
    if file.content_type and file.content_type not in allowed:
        ext = (file.filename or "").lower().rsplit(".", 1)[-1]
        if ext not in ["jpg","jpeg","png","webp"]:
            raise HTTPException(400, detail=f"Format non supporté: {file.content_type}.")

    image_bytes = await file.read()
    from app.core.config import settings
    if len(image_bytes) > settings.MAX_FILE_SIZE:
        raise HTTPException(413, detail="Fichier trop volumineux.")

    # Validation locale
    is_valid_local, local_reason = validate_image_locally(image_bytes, model)
    if not is_valid_local:
        async def rejected_local():
            yield "data: " + json.dumps({
                "type":"prediction","filename":file.filename,
                "prediction":"—","confidence":0.0,"probabilities":{},
                "num_classes":None,"gradcam_image":None,
                "out_of_domain":True,"warning":"⛔ "+local_reason,"entropy_ratio":1.0,
            }) + "\n\n"
            yield 'data: {"type":"done"}\n\n'
        return StreamingResponse(rejected_local(), media_type="text/event-stream",
                                 headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

    ck = _cache_key(image_bytes, model)

    # Validation Gemini
    is_valid_g, g_rejection = await validate_image_with_gemini(image_bytes, model)
    if not is_valid_g:
        async def rejected_gemini():
            yield "data: " + json.dumps({
                "type":"prediction","filename":file.filename,
                "prediction":"—","confidence":0.0,"probabilities":{},
                "num_classes":None,"gradcam_image":None,
                "out_of_domain":True,
                "warning":"⛔ Mauvaise image pour ce modèle. "+g_rejection,
                "entropy_ratio":1.0,
            }) + "\n\n"
            yield 'data: {"type":"done"}\n\n'
        return StreamingResponse(rejected_gemini(), media_type="text/event-stream",
                                 headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

    # Inférence
    try:
        result = run_inference(image_bytes, with_gradcam=gradcam, model_key=model)
    except RuntimeError as e:
        raise HTTPException(503, detail=str(e))
    except Exception as e:
        raise HTTPException(500, detail=f"Inférence échouée : {str(e)}")

    async def event_stream():
        yield "data: " + json.dumps({
            "type":          "prediction",
            "filename":      file.filename,
            "prediction":    result["prediction"],
            "confidence":    result["confidence"],
            "probabilities": result["probabilities"],
            "num_classes":   result.get("num_classes"),
            "gradcam_image": result.get("gradcam_image"),
            "out_of_domain": result.get("out_of_domain"),
            "warning":       result.get("warning"),
            "entropy_ratio": result.get("entropy_ratio"),
        }) + "\n\n"

        if not result.get("out_of_domain") and explain:
            async for chunk in stream_gemini_fused(
                result["prediction"], result["confidence"],
                result["probabilities"], model,
                image_bytes=image_bytes, cache_key=ck,
            ):
                yield "data: " + chunk + "\n\n"
                await asyncio.sleep(0)

        yield 'data: {"type":"done"}\n\n'

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})


@router.post("/report")
async def generate_report(
    file:          UploadFile = File(...),
    model:         str   = Query("chest"),
    patient_id:    str   = Query("PATIENT-INCONNU"),
    prediction:    str   = Query(...),
    confidence:    float = Query(...),
    probabilities: str   = Query("{}"),
    explain_text:  str   = Form(""),
    gradcam_image: str   = Form(""),
    report_id:     str   = Query(""),
):
    if model not in VALID_MODELS:
        raise HTTPException(400, detail=f"Modèle '{model}' invalide.")
    image_bytes = await file.read()
    image_b64   = base64.b64encode(image_bytes).decode("utf-8") if image_bytes else None
    try:
        probs_dict = json.loads(probabilities)
    except Exception:
        probs_dict = {}
    if not report_id:
        report_id = f"CHX-{uuid.uuid4().hex[:8].upper()}"
    try:
        from app.services.report_generator import generate_report_pdf
    except ImportError:
        try:
            from report_generator import generate_report_pdf
        except ImportError:
            raise HTTPException(500, detail="Module report_generator introuvable.")
    try:
        pdf_bytes = generate_report_pdf(
            patient_id=patient_id, model_key=model,
            filename=file.filename or "image.jpg",
            prediction=prediction, confidence=confidence,
            probabilities=probs_dict, explain_text=explain_text,
            image_b64=image_b64,
            gradcam_b64=gradcam_image if gradcam_image else None,
            report_id=report_id,
        )
    except Exception as e:
        raise HTTPException(500, detail=f"Erreur PDF : {str(e)}")
    return Response(
        content=pdf_bytes, media_type="application/pdf",
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
        message="ChestAI API is running" if svc.is_loaded else "Model not loaded",
        model_loaded=svc.is_loaded,
        num_classes=svc.num_classes,
        class_names=svc.class_names,
        device=None,
    )
