"""
Service d'inférence pour le modèle de classification
Supporte dynamiquement N classes selon le checkpoint
+ Grad-CAM intégré
"""
import io
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
from typing import Dict, Optional

from app.core.config import settings
from app.services.preprocessing import preprocess_image


# Classes NIH par défaut (fallback si le checkpoint ne les contient pas)
NIH_DEFAULT_CLASSES = [
    'Atelectasis', 'COVID', 'Cardiomegaly', 'Consolidation',
    'Edema', 'Effusion', 'Emphysema', 'Fibrosis', 'Hernia',
    'Infiltration', 'Lung_Opacity', 'Mass', 'No Finding',
    'Nodule', 'Normal', 'Pleural_Thickening', 'Pneumonia',
    'Pneumothorax', 'Viral Pneumonia'
]


class InferenceService:
    """
    Service d'inférence — chargement paresseux, N classes dynamiques.
    Pattern : instance module-level créée une seule fois via get_inference_service().
    """

    def __init__(self):
        self._model       = None
        self._class_names = NIH_DEFAULT_CLASSES
        self._num_classes = len(NIH_DEFAULT_CLASSES)
        self._load_model()

    # ------------------------------------------------------------------
    # Chargement du modèle
    # ------------------------------------------------------------------
    def _load_model(self):
        """Charger le checkpoint PyTorch et reconstruire le modèle."""
        try:
            print(f"⏳ Chargement du modèle : {settings.MODEL_PATH}")

            checkpoint = torch.load(
                settings.MODEL_PATH,
                map_location=settings.DEVICE,
                weights_only=False
            )

            # ── Métadonnées depuis le checkpoint ──────────────────────
            self._class_names = checkpoint.get('class_names', NIH_DEFAULT_CLASSES)
            self._num_classes  = checkpoint.get('num_classes', len(self._class_names))

            # Sécurité : cohérence
            if self._num_classes != len(self._class_names):
                print(f"⚠️  Incohérence num_classes={self._num_classes} "
                      f"vs len(class_names)={len(self._class_names)} "
                      f"→ on utilise len(class_names)")
                self._num_classes = len(self._class_names)

            # ── Détecter l'architecture depuis le checkpoint ──────────
            architecture = checkpoint.get('architecture', 'resnet50')

            if 'efficientnet' in str(architecture).lower():
                try:
                    import timm
                    self._model = timm.create_model(
                        architecture,
                        pretrained=False,
                        num_classes=self._num_classes,
                        drop_rate=0.0
                    )
                    print(f"   Architecture : {architecture} (timm)")
                except ImportError:
                    raise RuntimeError(
                        "timm requis pour EfficientNet. "
                        "Installe-le : pip install timm"
                    )
            else:
                # ResNet50 (défaut)
                import torchvision.models as _models
                import torch.nn as _nn

                class ChestXrayClassifier(_nn.Module):
                    def __init__(self, num_classes, pretrained=False, dropout=0.0):
                        super().__init__()
                        self.backbone = _models.resnet50(weights=None)
                        in_f = self.backbone.fc.in_features
                        self.backbone.fc = _nn.Sequential(
                            _nn.Dropout(p=dropout),
                            _nn.Linear(in_f, num_classes)
                        )
                    def forward(self, x):
                        return self.backbone(x)

                self._model = ChestXrayClassifier(
                    num_classes=self._num_classes,
                    pretrained=False,
                    dropout=0.0
                )
                print(f"   Architecture : ResNet50 (ChestXrayClassifier)")

            self._model.load_state_dict(checkpoint['model_state_dict'])
            self._model.to(settings.DEVICE)
            self._model.eval()

            print(f"✅ Modèle chargé avec succès")
            print(f"   Nombre de classes : {self._num_classes}")
            print(f"   Classes           : {self._class_names}")
            print(f"   Device            : {settings.DEVICE}")

        except FileNotFoundError:
            print(f"❌ Fichier modèle introuvable : {settings.MODEL_PATH}")
            self._model = None

        except Exception as e:
            print(f"❌ Erreur chargement modèle : {e}")
            self._model = None

    # ------------------------------------------------------------------
    # Propriétés publiques
    # ------------------------------------------------------------------
    @property
    def class_names(self):
        return self._class_names

    @property
    def num_classes(self):
        return self._num_classes

    @property
    def is_loaded(self):
        return self._model is not None

    # ------------------------------------------------------------------
    # Inférence
    # ------------------------------------------------------------------
    def predict(self, image_bytes: bytes, with_gradcam: bool = False) -> Dict:
        """
        Prédire la pathologie sur une image.

        Args:
            image_bytes  : image en bytes
            with_gradcam : si True, génère et retourne la heatmap Grad-CAM

        Returns
        -------
        dict avec prediction, confidence, probabilities, class_index, num_classes
        + gradcam_image (base64) si with_gradcam=True
        """
        if self._model is None:
            raise RuntimeError(
                f"Modèle non chargé. "
                f"Vérifiez que le fichier existe : {settings.MODEL_PATH}"
            )

        tensor = preprocess_image(image_bytes).to(settings.DEVICE)

        with torch.no_grad():
            logits        = self._model(tensor)
            probabilities = F.softmax(logits, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

        pred_idx   = predicted.item()
        pred_class = self._class_names[pred_idx]

        probs     = probabilities[0].cpu().numpy()
        prob_dict = {
            cls: round(float(prob), 6)
            for cls, prob in zip(self._class_names, probs)
        }

        result = {
            "prediction"   : pred_class,
            "confidence"   : round(float(confidence.item()), 6),
            "probabilities": prob_dict,
            "class_index"  : pred_idx,
            "num_classes"  : self._num_classes,
            "gradcam_image": None,
        }

        # ── Grad-CAM (optionnel) ──────────────────────────────────────
        if with_gradcam:
            try:
                from app.services.gradcam import generate_gradcam_overlay
                # Recréer le tensor avec grad (torch.no_grad() désactivé)
                tensor_grad = preprocess_image(image_bytes).to(settings.DEVICE)
                gradcam_b64 = generate_gradcam_overlay(
                    image_bytes=image_bytes,
                    model=self._model,
                    tensor=tensor_grad,
                    class_idx=pred_idx,
                    device=settings.DEVICE,
                )
                result["gradcam_image"] = gradcam_b64
                print(f"✅ Grad-CAM généré pour la classe '{pred_class}'")
            except Exception as e:
                print(f"⚠️  Grad-CAM échoué (inférence OK) : {e}")
                result["gradcam_image"] = None

        return result

    # ------------------------------------------------------------------
    # Top-K utilitaire
    # ------------------------------------------------------------------
    def predict_topk(self, image_bytes: bytes, k: int = 3) -> Dict:
        """Retourne les k classes les plus probables."""
        result = self.predict(image_bytes)
        sorted_probs = sorted(
            result["probabilities"].items(),
            key=lambda x: x[1],
            reverse=True
        )
        result["top_k"] = [
            {"class": cls, "probability": prob}
            for cls, prob in sorted_probs[:k]
        ]
        return result


# ---------------------------------------------------------------------------
# Singleton module-level
# ---------------------------------------------------------------------------
_service_instance: InferenceService = None


def get_inference_service() -> InferenceService:
    global _service_instance
    if _service_instance is None:
        _service_instance = InferenceService()
    return _service_instance


def run_inference(image_bytes: bytes, with_gradcam: bool = False) -> Dict:
    """Point d'entrée principal utilisé par routes.py."""
    return get_inference_service().predict(image_bytes, with_gradcam=with_gradcam)