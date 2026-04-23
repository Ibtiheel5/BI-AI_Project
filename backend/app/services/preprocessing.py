"""
app/services/preprocessing.py

Prétraitement des images médicales pour l'inférence.

NORMALISATION PAR MODÈLE :
- chest / lung / brain : normalisation ImageNet (mean/std standard)
- retina               : normalisation ImageNet (mean/std standard)
                         ← CHANGEMENT : l'ancien pipeline MultiModal utilisait /255 uniquement,
                           mais le nouveau pipeline APTOS (EfficientNet-B3 fine-tuné) utilise
                           Albumentations A.Normalize(mean=[0.485,0.456,0.406],
                                                       std=[0.229,0.224,0.225])
                           identique aux autres modèles → _MODELS_DIV255_ONLY est vide.

AUGMENTATIONS À L'INFÉRENCE :
- Uniquement Resize + Normalize (pas d'augmentations aléatoires)
- Identique à val_transform du notebook APTOS
"""
import io
import torch
import numpy as np
from PIL import Image
from typing import Tuple

# ── Constantes de normalisation ────────────────────────────────────────────────

_IMAGENET_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
_IMAGENET_STD  = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)

# MODIFIÉ : retina utilise maintenant la normalisation ImageNet comme tous les autres modèles.
# L'ancien pipeline MultiModal avait /255 uniquement — ce n'est plus le cas avec EfficientNet-B3.
# Ce set est conservé vide pour compatibilité future si un nouveau modèle sans ImageNet est ajouté.
_MODELS_DIV255_ONLY: set = set()   # ← était {"retina"}, maintenant vide

# Tailles max acceptées
_MAX_FILE_SIZE  = 50 * 1024 * 1024   # 50 MB
_MIN_IMG_SIZE   = 32                  # pixels
_MAX_IMG_SIZE   = 8192                # pixels


# ── Prétraitement principal ────────────────────────────────────────────────────

def preprocess_image(image_bytes: bytes, img_size: int = 224,
                     model_key: str = "chest") -> torch.Tensor:
    """
    Prétraite une image pour l'inférence.

    Reproduit exactement val_transform du notebook APTOS pour 'retina' :
        A.Resize(img_size, img_size)
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ToTensorV2()

    Identique pour chest / lung / brain (normalisation ImageNet).

    Args:
        image_bytes : contenu brut du fichier image
        img_size    : taille cible carrée (hauteur = largeur)
        model_key   : clé du modèle ("chest", "lung", "brain", "retina")

    Returns:
        Tensor float32 [1, 3, img_size, img_size], normalisé ImageNet
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((img_size, img_size), Image.LANCZOS)

    arr    = np.array(img, dtype=np.float32) / 255.0          # [0, 1]
    tensor = torch.from_numpy(arr).permute(2, 0, 1)           # [3, H, W]

    # Tous les modèles utilisent la normalisation ImageNet
    # (le set _MODELS_DIV255_ONLY est vide depuis la migration APTOS → EfficientNet-B3)
    if model_key not in _MODELS_DIV255_ONLY:
        tensor = (tensor - _IMAGENET_MEAN) / _IMAGENET_STD

    return tensor.unsqueeze(0)                                 # [1, 3, H, W]


# ── Validation d'image ────────────────────────────────────────────────────────

def validate_image(image_bytes: bytes, model_key: str = "chest") -> Tuple[bool, str]:
    """
    Valide qu'une image est acceptable pour le modèle spécifié.

    Règles :
    - chest / lung / brain : image en niveaux de gris attendue
    - retina               : image COULEUR attendue (fundus photography)

    Args:
        image_bytes : contenu brut du fichier image
        model_key   : clé du modèle

    Returns:
        (is_valid: bool, error_message: str)
        error_message est vide si is_valid=True
    """
    # Vérification taille fichier
    if len(image_bytes) == 0:
        return False, "Fichier vide."
    if len(image_bytes) > _MAX_FILE_SIZE:
        return False, f"Fichier trop volumineux ({len(image_bytes) // (1024*1024)} MB). Max : 50 MB."

    # Vérification image PIL
    try:
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
    except Exception as e:
        return False, f"Impossible d'ouvrir l'image : {e}"

    if w < _MIN_IMG_SIZE or h < _MIN_IMG_SIZE:
        return False, f"Image trop petite ({w}×{h} px). Minimum : {_MIN_IMG_SIZE}×{_MIN_IMG_SIZE} px."

    if w > _MAX_IMG_SIZE or h > _MAX_IMG_SIZE:
        return False, f"Image trop grande ({w}×{h} px). Maximum : {_MAX_IMG_SIZE}×{_MAX_IMG_SIZE} px."

    # Vérification couleur selon le modèle
    try:
        img_rgb   = img.convert("RGB").resize((64, 64), Image.LANCZOS)
        arr       = np.array(img_rgb, dtype=np.float32)
        r, g, b   = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        max_diff  = float(max(
            np.mean(np.abs(r - g)),
            np.mean(np.abs(r - b)),
            np.mean(np.abs(g - b)),
        ))

        if model_key == "retina":
            # Fond d'œil → image COULEUR attendue (photographie rétinienne couleur)
            if max_diff < 5:
                return False, (
                    "Image en niveaux de gris détectée. "
                    "Ce modèle attend une photographie couleur du fond d'œil (rétinographie)."
                )
        else:
            # chest / lung / brain → niveaux de gris attendus
            if max_diff > 25:
                return False, (
                    "Image colorée détectée. "
                    f"Ce modèle attend une image médicale en niveaux de gris "
                    f"(radiographie, IRM ou scanner)."
                )

    except Exception:
        pass  # fail-open : laisser passer si l'analyse couleur échoue

    return True, ""


# ── Utilitaire : lire les dimensions d'une image sans la charger entièrement ──

def get_image_info(image_bytes: bytes) -> dict:
    """Retourne les infos basiques d'une image (format, taille, mode couleur)."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        arr = np.array(img.convert("RGB").resize((64, 64)))
        r, g, b = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float)
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
