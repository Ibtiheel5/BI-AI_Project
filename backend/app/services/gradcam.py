"""
app/services/gradcam.py

Service Grad-CAM pour visualisation des zones d'attention du modèle.
Génère une heatmap superposée sur l'image originale.

Architectures supportées :
  - ResNet50        (chest)  : target = "backbone.layer4"
  - EfficientNet-B2 (lung)   : target = "backbone.blocks"
  - EfficientNet-B3 (brain)  : target = "backbone.blocks"
  - DRNet           (retina) : target = "cnn_backbone"
                               ↑ NOUVEAU : branche CNN (EfficientNetV2-S) de DRNet.
                               On cible le DERNIER bloc de cnn_backbone (index -2,
                               car le dernier enfant est le pool/flatten).

CHANGEMENT vs ancienne version :
  - Ancienne : cherchait "backbone.{layer_name}" ou une correspondance exacte/suffixe
    → ne trouvait rien pour DRNet car la branche s'appelle "cnn_backbone" et
      son contenu est un nn.Sequential sans sous-nom "blocks" ou "layer4"
  - Nouvelle : résolution en 3 passes ordonnées par priorité + fallback
      1. Correspondance exacte du nom complet  (ex: "cnn_backbone")
      2. Suffixe du nom                        (ex: "backbone.layer4")
      3. Dernier sous-module de cnn_backbone   (fallback DRNet uniquement)
"""

import io
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import base64
from typing import Optional


# ── Résolution de la couche cible ─────────────────────────────────────────────

def _resolve_target_layer(model: torch.nn.Module,
                           target_layer_name: str) -> torch.nn.Module:
    """
    Résout la couche cible en 3 passes :

    Passe 1 — Correspondance exacte du nom complet
        "cnn_backbone"   → model.cnn_backbone          (DRNet)
        "backbone.layer4"→ model.backbone.layer4        (ResNet50)
        "backbone.blocks"→ model.backbone.blocks        (EfficientNet)

    Passe 2 — Le nom est un suffixe d'un nom complet
        "layer4" matche "backbone.layer4"

    Passe 3 — Fallback spécifique DRNet
        Si target="cnn_backbone" et qu'on n'a pas trouvé exactement,
        on prend le dernier sous-module convolutif de cnn_backbone
        (avant le AdaptiveAvgPool2d final).

    Returns:
        nn.Module — la couche cible
    Raises:
        ValueError si aucune correspondance trouvée
    """
    named = dict(model.named_modules())

    # ── Passe 1 : nom exact ───────────────────────────────────────────────────
    if target_layer_name in named:
        layer = named[target_layer_name]
        print(f"[GradCAM] ✅ Couche trouvée (exact) : '{target_layer_name}' "
              f"→ {type(layer).__name__}")
        return layer

    # ── Passe 2 : suffixe ─────────────────────────────────────────────────────
    for full_name, module in model.named_modules():
        if full_name.endswith(target_layer_name) or full_name == target_layer_name:
            print(f"[GradCAM] ✅ Couche trouvée (suffixe) : '{full_name}' "
                  f"→ {type(module).__name__}")
            return module

    # ── Passe 3 : fallback DRNet — dernier bloc convolutif de cnn_backbone ────
    # EfficientNetV2-S dans nn.Sequential : les enfants sont des MBConv/FusedMBConv blocks.
    # On prend le dernier enfant qui n'est pas un pool/flatten.
    if target_layer_name == "cnn_backbone" and hasattr(model, "cnn_backbone"):
        cnn_seq = model.cnn_backbone   # nn.Sequential
        # Parcourir à l'envers pour trouver le dernier module convolutif
        children = list(cnn_seq.children())
        for child in reversed(children):
            if not isinstance(child, (
                torch.nn.AdaptiveAvgPool2d,
                torch.nn.Flatten,
                torch.nn.Identity,
            )):
                print(f"[GradCAM] ✅ Couche trouvée (fallback DRNet cnn_backbone) : "
                      f"{type(child).__name__}")
                return child

    # ── Aucune correspondance ─────────────────────────────────────────────────
    available = [n for n, _ in model.named_modules() if n][:30]
    raise ValueError(
        f"[GradCAM] Couche '{target_layer_name}' introuvable.\n"
        f"Couches disponibles (30 premières) :\n"
        + "\n".join(f"  - {n}" for n in available)
    )


# ── Classe GradCAM ────────────────────────────────────────────────────────────

class GradCAM:
    """
    Grad-CAM : Gradient-weighted Class Activation Mapping
    Ref: Selvaraju et al. 2017 (https://arxiv.org/abs/1610.02391)

    Architectures supportées :
      ResNet50        (chest)  : target_layer_name = "backbone.layer4"
      EfficientNet-B2 (lung)   : target_layer_name = "backbone.blocks"
      EfficientNet-B3 (brain)  : target_layer_name = "backbone.blocks"
      DRNet           (retina) : target_layer_name = "cnn_backbone"
    """

    def __init__(self, model: torch.nn.Module,
                 target_layer_name: str = "backbone.layer4"):
        self.model       = model
        self.gradients   = None
        self.activations = None
        self._hooks      = []
        self._register_hooks(target_layer_name)

    def _register_hooks(self, target_layer_name: str):
        """Résout la couche cible et enregistre les hooks forward/backward."""
        target = _resolve_target_layer(self.model, target_layer_name)

        def forward_hook(module, input, output):
            # Pour les modules qui retournent un tuple (certains blocs timm)
            self.activations = (output[0] if isinstance(output, tuple)
                                else output).detach()

        def backward_hook(module, grad_input, grad_output):
            g = grad_output[0]
            self.gradients = (g[0] if isinstance(g, tuple) else g).detach()

        self._hooks.append(target.register_forward_hook(forward_hook))
        self._hooks.append(target.register_full_backward_hook(backward_hook))

    def remove_hooks(self):
        for hook in self._hooks:
            hook.remove()

    def generate(self, tensor: torch.Tensor,
                 class_idx: Optional[int] = None) -> np.ndarray:
        """
        Génère la heatmap Grad-CAM.

        Args:
            tensor    : image prétraitée [1, 3, H, W]
            class_idx : index de la classe cible (None = classe prédite)

        Returns:
            heatmap normalisée [0, 1] de taille (H, W)
        """
        self.model.eval()
        tensor = tensor.clone().requires_grad_(True)

        # Forward pass
        logits = self.model(tensor)

        if class_idx is None:
            class_idx = logits.argmax(dim=1).item()

        # Backward sur la classe cible uniquement
        self.model.zero_grad()
        score = logits[0, class_idx]
        score.backward()

        if self.gradients is None or self.activations is None:
            raise RuntimeError(
                "[GradCAM] Gradients ou activations non capturés. "
                "Vérifiez que la couche cible produit bien une sortie spatiale [B,C,H,W]."
            )

        # Grad-CAM : pondération des activations par les gradients moyennés
        # gradients  : [B, C, H, W]  ou  [C, H, W]
        # activations: [B, C, H, W]  ou  [C, H, W]
        acts = self.activations
        grads = self.gradients

        # Assurer la forme [C, H, W]
        if acts.dim() == 4:
            acts  = acts.squeeze(0)
        if grads.dim() == 4:
            grads = grads.squeeze(0)

        # Cas particulier : sortie 1D (certains pooling globaux) → pas de CAM spatiale
        if acts.dim() == 1:
            print("[GradCAM] ⚠️  Activations 1D détectées — "
                  "la couche est après le pooling global. "
                  "Choisissez une couche convolutive antérieure.")
            # Retourner une heatmap uniforme plutôt que planter
            return np.ones((7, 7), dtype=np.float32)

        weights = grads.mean(dim=(1, 2), keepdim=True)   # [C, 1, 1]
        cam     = (weights * acts).sum(dim=0)             # [H, W]
        cam     = F.relu(cam)

        # Normalisation [0, 1]
        cam -= cam.min()
        if cam.max() > 1e-8:
            cam /= cam.max()

        return cam.cpu().numpy()


# ── Overlay principal ─────────────────────────────────────────────────────────

def generate_gradcam_overlay(
    image_bytes: bytes,
    model: torch.nn.Module,
    tensor: torch.Tensor,
    class_idx: int,
    device: str = "cpu",
    alpha: float = 0.4,
    target_layer_name: str = "backbone.layer4",
) -> str:
    """
    Génère l'image originale avec la heatmap Grad-CAM superposée.

    Pour DRNet (retina), passer target_layer_name="cnn_backbone".
    Le preprocessing Ben Graham est appliqué en amont dans preprocessing.py.

    Args:
        image_bytes       : image originale en bytes (pour l'affichage)
        model             : modèle PyTorch chargé en eval mode
        tensor            : image prétraitée [1, 3, H, W] (déjà sur device)
        class_idx         : index de la classe prédite
        device            : 'cpu' ou 'cuda'
        alpha             : transparence de la heatmap (0=invisible, 1=opaque)
        target_layer_name : nom de la couche cible
            chest  → "backbone.layer4"
            lung   → "backbone.blocks"
            brain  → "backbone.blocks"
            retina → "cnn_backbone"      ← DRNet (branche CNN EfficientNetV2-S)

    Returns:
        Image encodée en base64 (JPEG) pour envoi via API
    """
    # ── 1. Générer la heatmap ─────────────────────────────────────────────────
    gradcam = GradCAM(model, target_layer_name=target_layer_name)
    try:
        cam = gradcam.generate(tensor.to(device), class_idx=class_idx)
    finally:
        gradcam.remove_hooks()

    # ── 2. Charger l'image originale ──────────────────────────────────────────
    original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_w, orig_h = original.size
    orig_np = np.array(original)

    # ── 3. Redimensionner la heatmap à la taille originale ───────────────────
    cam_resized = cv2.resize(cam, (orig_w, orig_h),
                             interpolation=cv2.INTER_LINEAR)

    # ── 4. Colormap JET (bleu=faible, rouge=forte attention) ─────────────────
    cam_uint8   = (cam_resized * 255).astype(np.uint8)
    heatmap     = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    # ── 5. Superposer sur l'image originale ──────────────────────────────────
    overlay = (orig_np * (1 - alpha) + heatmap_rgb * alpha).astype(np.uint8)

    # ── 6. Barre de légende ───────────────────────────────────────────────────
    overlay = _add_colorbar(overlay)

    # ── 7. Encoder en base64 ─────────────────────────────────────────────────
    buf = io.BytesIO()
    Image.fromarray(overlay).save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ── Barre de légende ──────────────────────────────────────────────────────────

def _add_colorbar(image: np.ndarray, bar_height: int = 20) -> np.ndarray:
    """Ajoute une barre de légende Grad-CAM en bas de l'image."""
    h, w = image.shape[:2]
    gradient     = np.linspace(0, 255, w, dtype=np.uint8).reshape(1, w)
    gradient     = np.repeat(gradient, bar_height, axis=0)
    colorbar     = cv2.applyColorMap(gradient, cv2.COLORMAP_JET)
    colorbar_rgb = cv2.cvtColor(colorbar, cv2.COLOR_BGR2RGB)

    font  = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.35
    cv2.putText(colorbar_rgb, "Faible", (2, bar_height - 4),
                font, scale, (255, 255, 255), 1)
    cv2.putText(colorbar_rgb, "Forte",  (w - 38, bar_height - 4),
                font, scale, (255, 255, 255), 1)

    return np.vstack([image, colorbar_rgb])