"""
app/services/preprocessing.py

Prétraitement des images médicales pour l'inférence.

PIPELINE DRNet (retina — NOUVEAU) :
=====================================
Remplace l'ancien pipeline APTOS (EfficientNet-B3).
Le nouveau modèle est DRNet (EfficientNetV2-S + Swin-T, best_retina_model.pth).

CHANGEMENTS vs ancien preprocessing APTOS :
  1. Ben Graham preprocessing ajouté pour 'retina'
       → soustraction gaussienne (σ=10) + masque circulaire
       → identique à ben_graham() de la cellule 5 du notebook DRNet
       → appliqué AVANT le resize (sur l'image en taille originale)

  2. Taille cible : 224px (inchangé)

  3. Normalisation : ImageNet mean/std (inchangé)
       mean=[0.485, 0.456, 0.406] / std=[0.229, 0.224, 0.225]

NORMALISATION PAR MODÈLE (inchangé) :
  - chest / lung / brain / retina : normalisation ImageNet
  - _MODELS_DIV255_ONLY reste vide
"""

import io
import cv2
import torch
import numpy as np
from PIL import Image
from typing import Tuple

# ── Constantes de normalisation ───────────────────────────────────────────────

_IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
_IMAGENET_STD  = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)

# Vide : tous les modèles utilisent la normalisation ImageNet
_MODELS_DIV255_ONLY: set = set()

# Limites
_MAX_FILE_SIZE = 50 * 1024 * 1024   # 50 MB
_MIN_IMG_SIZE  = 32
_MAX_IMG_SIZE  = 8192

# Modèles qui nécessitent le preprocessing Ben Graham
_MODELS_BEN_GRAHAM: set = {"retina"}


# ── Ben Graham preprocessing (NOUVEAU pour retina) ────────────────────────────

def _ben_graham(img_rgb: np.ndarray, sigma: int = 10) -> np.ndarray:
    """
    Ben Graham preprocessing pour images de fond d'œil.
    Identique à ben_graham() du notebook DRNet (cellule 5) :

        blurred = cv2.GaussianBlur(arr, (0, 0), sigma)
        result  = cv2.addWeighted(arr, 4, blurred, -4, 128)

    - Amplifie les structures locales (microanévrysmes, vaisseaux)
    - Normalise l'éclairage inhomogène des rétinographies
    - Appliqué sur l'image AVANT le resize (résolution native)

    Args:
        img_rgb : np.ndarray uint8 RGB [H, W, 3]
        sigma   : écart-type du flou gaussien (défaut 10, identique notebook)

    Returns:
        np.ndarray uint8 RGB [H, W, 3]
    """
    if img_rgb.ndim == 2:
        # Niveaux de gris → RGB
        img_rgb = np.stack([img_rgb] * 3, axis=2)

    blurred = cv2.GaussianBlur(img_rgb, (0, 0), sigma)
    result  = cv2.addWeighted(img_rgb, 4, blurred, -4, 128)
    return np.clip(result, 0, 255).astype(np.uint8)


# ── Prétraitement principal ────────────────────────────────────────────────────

def preprocess_image(image_bytes: bytes, img_size: int = 224,
                     model_key: str = "chest") -> torch.Tensor:
    """
    Prétraite une image pour l'inférence.

    Pipeline pour 'retina' (DRNet) — identique au notebook :
        1. Decode → RGB np.ndarray
        2. Ben Graham (sigma=10)          ← NOUVEAU vs ancien APTOS
        3. Resize (224×224, LANCZOS)
        4. /255 → [0,1]
        5. Normalize ImageNet mean/std

    Pipeline pour chest / lung / brain (inchangé) :
        1. Decode → RGB PIL
        2. Resize (img_size, LANCZOS)
        3. /255 → [0,1]
        4. Normalize ImageNet mean/std

    Args:
        image_bytes : contenu brut du fichier image
        img_size    : taille cible carrée
        model_key   : "chest" | "lung" | "brain" | "retina"

    Returns:
        Tensor float32 [1, 3, img_size, img_size], normalisé ImageNet
    """
    if model_key in _MODELS_BEN_GRAHAM:
        # ── Chemin retina : Ben Graham avant resize ─────────────────────────
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np  = np.array(img_pil, dtype=np.uint8)

        # 1. Ben Graham preprocessing (sur résolution native)
        img_np = _ben_graham(img_np, sigma=10)

        # 2. Resize
        img_pil = Image.fromarray(img_np).resize(
            (img_size, img_size), Image.LANCZOS
        )
        arr = np.array(img_pil, dtype=np.float32)

    else:
        # ── Chemin standard : chest / lung / brain ──────────────────────────
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_pil = img_pil.resize((img_size, img_size), Image.LANCZOS)
        arr     = np.array(img_pil, dtype=np.float32)

    # /255 → [0, 1]
    arr    = arr / 255.0
    tensor = torch.from_numpy(arr).permute(2, 0, 1)   # [3, H, W]

    # Normalisation ImageNet (tous les modèles)
    if model_key not in _MODELS_DIV255_ONLY:
        tensor = (tensor - _IMAGENET_MEAN) / _IMAGENET_STD

    return tensor.unsqueeze(0)   # [1, 3, H, W]


# ── Validation d'image ────────────────────────────────────────────────────────

def validate_image(image_bytes: bytes,
                   model_key: str = "chest") -> Tuple[bool, str]:
    """
    Valide qu'une image est acceptable pour le modèle spécifié.

    Règles :
      - retina               : image COULEUR attendue (rétinographie couleur)
      - chest / lung / brain : niveaux de gris attendus

    Args:
        image_bytes : contenu brut du fichier image
        model_key   : clé du modèle

    Returns:
        (is_valid: bool, error_message: str)
    """
    if len(image_bytes) == 0:
        return False, "Fichier vide."
    if len(image_bytes) > _MAX_FILE_SIZE:
        sz_mb = len(image_bytes) // (1024 * 1024)
        return False, f"Fichier trop volumineux ({sz_mb} MB). Max : 50 MB."

    try:
        img  = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
    except Exception as e:
        return False, f"Impossible d'ouvrir l'image : {e}"

    if w < _MIN_IMG_SIZE or h < _MIN_IMG_SIZE:
        return False, (
            f"Image trop petite ({w}×{h} px). "
            f"Minimum : {_MIN_IMG_SIZE}×{_MIN_IMG_SIZE} px."
        )
    if w > _MAX_IMG_SIZE or h > _MAX_IMG_SIZE:
        return False, (
            f"Image trop grande ({w}×{h} px). "
            f"Maximum : {_MAX_IMG_SIZE}×{_MAX_IMG_SIZE} px."
        )

    # Analyse couleur
    try:
        thumb    = img.convert("RGB").resize((64, 64), Image.LANCZOS)
        arr      = np.array(thumb, dtype=np.float32)
        r, g, b  = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        max_diff = float(max(
            np.mean(np.abs(r - g)),
            np.mean(np.abs(r - b)),
            np.mean(np.abs(g - b)),
        ))

        if model_key == "retina":
            if max_diff < 5:
                return False, (
                    "Image en niveaux de gris détectée. "
                    "Ce modèle attend une photographie couleur du fond d'œil "
                    "(rétinographie couleur)."
                )
        else:
            if max_diff > 25:
                return False, (
                    "Image colorée détectée. "
                    "Ce modèle attend une image médicale en niveaux de gris "
                    "(radiographie, IRM ou scanner)."
                )

    except Exception:
        pass   # fail-open : laisser passer si l'analyse couleur échoue

    return True, ""


# ── Utilitaire : infos image ──────────────────────────────────────────────────

def get_image_info(image_bytes: bytes) -> dict:
    """Retourne les infos basiques d'une image (format, taille, mode couleur)."""
    try:
        img  = Image.open(io.BytesIO(image_bytes))
        thumb = img.convert("RGB").resize((64, 64))
        arr   = np.array(thumb, dtype=np.float32)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        max_diff = float(max(
            np.mean(np.abs(r - g)),
            np.mean(np.abs(r - b)),
            np.mean(np.abs(g - b)),
        ))
        return {
            "format":     img.format,
            "size":       img.size,
            "mode":       img.mode,
            "is_color":   max_diff > 10,
            "color_diff": round(max_diff, 2),
        }
    except Exception as e:
        return {"error": str(e)}