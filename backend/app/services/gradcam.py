"""
Service Grad-CAM pour visualisation des zones d'attention du modèle
Génère une heatmap superposée sur l'image originale
Supporte ResNet50 et EfficientNet (timm)
"""
import io
import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
import base64
from typing import Optional


class GradCAM:
    """
    Grad-CAM : Gradient-weighted Class Activation Mapping
    Ref: Selvaraju et al. 2017 (https://arxiv.org/abs/1610.02391)

    Supporte :
      - ResNet50  → cible backbone.layer4 ou layer4
      - EfficientNet (timm) → cible conv_head ou dernier bloc disponible
    """

    def __init__(self, model, target_layer_name: str = "layer4", arch: str = "resnet50"):
        self.model       = model
        self.gradients   = None
        self.activations = None
        self._hooks      = []
        self._register_hooks(target_layer_name, arch)

    def _register_hooks(self, layer_name: str, arch: str):
        """Enregistre les hooks forward et backward sur la couche cible."""
        target      = None
        target_name = None

        if "efficientnet" in arch.lower():
            # Ordre de préférence pour EfficientNet (timm)
            candidates = [
                "conv_head",     # sortie convolutive avant pooling global
                "blocks.6",      # dernier stage EfficientNet B0-B3
                "blocks.5",
                "blocks.4",
                "blocks.3",
            ]
            named = list(self.model.named_modules())
            for cand in candidates:
                for name, module in named:
                    if name == cand or name.endswith(f".{cand}"):
                        target      = module
                        target_name = name
                        break
                if target is not None:
                    break

            # Fallback : dernier module avec des paramètres (hors BatchNorm/Linear)
            if target is None:
                for name, module in reversed(named):
                    if hasattr(module, "weight") and module.weight is not None:
                        if len(module.weight.shape) == 4:  # couche conv
                            target      = module
                            target_name = name
                            break

        else:
            # ResNet : chercher layer4 avec ou sans préfixe backbone
            for name, module in self.model.named_modules():
                if name in (f"backbone.{layer_name}", layer_name):
                    target      = module
                    target_name = name
                    break

        if target is None:
            available = [n for n, _ in self.model.named_modules() if n]
            raise ValueError(
                f"Couche GradCAM introuvable pour arch='{arch}'.\n"
                f"Couches disponibles (20 premières) : {available[:20]}"
            )

        print(f"   GradCAM → couche cible : '{target_name}' (arch={arch})")

        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        self._hooks.append(target.register_forward_hook(forward_hook))
        self._hooks.append(target.register_full_backward_hook(backward_hook))

    def remove_hooks(self):
        for hook in self._hooks:
            hook.remove()

    def generate(self, tensor: torch.Tensor, class_idx: Optional[int] = None) -> np.ndarray:
        """
        Génère la heatmap Grad-CAM.

        Args:
            tensor      : image prétraitée [1, 3, H, W]
            class_idx   : index de la classe cible (None = classe prédite)

        Returns:
            heatmap normalisée [0, 1] de taille (H, W)
        """
        self.model.eval()
        tensor = tensor.clone().requires_grad_(True)

        # Forward pass
        logits = self.model(tensor)

        # Classe cible
        if class_idx is None:
            class_idx = logits.argmax(dim=1).item()

        # Backward sur la classe cible uniquement
        self.model.zero_grad()
        score = logits[0, class_idx]
        score.backward()

        if self.gradients is None or self.activations is None:
            raise RuntimeError(
                "Les gradients ou activations sont None après backward. "
                "Vérifiez que les hooks sont correctement enregistrés."
            )

        # Grad-CAM : moyenne des gradients sur les dimensions spatiales
        weights     = self.gradients.mean(dim=(2, 3), keepdim=True)  # [1, C, 1, 1]
        cam         = (weights * self.activations).sum(dim=1).squeeze()  # [H, W]
        cam         = F.relu(cam)

        # Normalisation [0, 1]
        cam -= cam.min()
        if cam.max() > 0:
            cam /= cam.max()

        return cam.cpu().numpy()


def generate_gradcam_overlay(
    image_bytes: bytes,
    model,
    tensor: torch.Tensor,
    class_idx: int,
    device: str = "cpu",
    alpha: float = 0.4,
    arch: str = "resnet50",
) -> str:
    """
    Génère l'image originale avec la heatmap Grad-CAM superposée.

    Args:
        image_bytes : image originale en bytes
        model       : modèle PyTorch chargé
        tensor      : image prétraitée [1, 3, H, W]
        class_idx   : index de la classe prédite
        device      : 'cpu' ou 'cuda'
        alpha       : transparence de la heatmap (0=invisible, 1=opaque)
        arch        : architecture du modèle ('resnet50' ou variante 'efficientnet_b*')

    Returns:
        Image encodée en base64 (JPEG) pour envoi via API
    """
    # ── 1. Générer la heatmap ─────────────────────────────────────────
    gradcam = GradCAM(model, arch=arch)
    try:
        cam = gradcam.generate(tensor.to(device), class_idx=class_idx)
    finally:
        gradcam.remove_hooks()

    # ── 2. Charger et redimensionner l'image originale ────────────────
    original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    orig_w, orig_h = original.size
    orig_np = np.array(original)

    # ── 3. Redimensionner la heatmap à la taille originale ────────────
    # cam peut être scalaire si la couche retourne 1x1 → on gère ce cas
    if cam.ndim == 0:
        cam = np.ones((orig_h, orig_w), dtype=np.float32) * float(cam)
    cam_resized = cv2.resize(cam, (orig_w, orig_h))

    # ── 4. Convertir en colormap JET (bleu → rouge) ───────────────────
    cam_uint8   = (cam_resized * 255).astype(np.uint8)
    heatmap     = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    # ── 5. Superposer sur l'image originale ───────────────────────────
    overlay = (orig_np * (1 - alpha) + heatmap_rgb * alpha).astype(np.uint8)

    # ── 6. Ajouter une barre de légende colorée ───────────────────────
    overlay = _add_colorbar(overlay)

    # ── 7. Encoder en base64 ──────────────────────────────────────────
    overlay_pil = Image.fromarray(overlay)
    buf = io.BytesIO()
    overlay_pil.save(buf, format="JPEG", quality=90)
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")

    return encoded


def _add_colorbar(image: np.ndarray, bar_height: int = 20) -> np.ndarray:
    """
    Ajoute une barre de légende colorée en bas de l'image.
    Bleu = faible attention, Rouge = forte attention
    """
    h, w = image.shape[:2]

    gradient    = np.linspace(0, 255, w, dtype=np.uint8).reshape(1, w)
    gradient    = np.repeat(gradient, bar_height, axis=0)
    colorbar    = cv2.applyColorMap(gradient, cv2.COLORMAP_JET)
    colorbar_rgb = cv2.cvtColor(colorbar, cv2.COLOR_BGR2RGB)

    font       = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.35
    cv2.putText(colorbar_rgb, "Faible", (2, bar_height - 4),
                font, font_scale, (255, 255, 255), 1)
    cv2.putText(colorbar_rgb, "Forte", (w - 38, bar_height - 4),
                font, font_scale, (255, 255, 255), 1)

    return np.vstack([image, colorbar_rgb])