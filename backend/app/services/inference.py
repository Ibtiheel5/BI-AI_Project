"""
Service d'inférence multi-modèles — chest / lung / brain
Architectures reconstruites exactement depuis les checkpoints.
"""
import torch
import torch.nn.functional as F
import torch.nn as nn
import torchvision.models as tvm
from collections import OrderedDict
from pathlib import Path
from typing import Dict

from app.core.config import settings
from app.services.preprocessing import preprocess_image


# ── Classes par défaut ─────────────────────────────────────────────────────────

CLASSES_CHEST = [
    'COVID', 'Lung_Opacity', 'Viral Pneumonia', 'Cardiomegaly',
    'Pneumothorax', 'Pneumonia', 'Edema', 'Emphysema', 'Nodule', 'Mass'
]
CLASSES_LUNG  = ['Benign', 'Malignant', 'Normal']
# Noms exacts tels que sauvegardés dans le checkpoint entraîné
CLASSES_BRAIN = ['glioma', 'meningioma', 'notumor', 'pituitary']

MODEL_FILES = {
    "chest": "final_model_10classes.pth",
    "lung":  "final_lung_cancer_model.pth",
    "brain": "final_brain_tumor_model.pth",
}
MODEL_DEFAULT_CLASSES = {
    "chest": CLASSES_CHEST,
    "lung":  CLASSES_LUNG,
    "brain": CLASSES_BRAIN,
}
MODEL_IMG_SIZES = {
    "chest": 224,
    "lung":  260,
    "brain": 224,
}


# ── Architecture chest : ResNet50 ─────────────────────────────────────────────

class ChestXrayClassifier(nn.Module):
    def __init__(self, num_classes, dropout=0.0):
        super().__init__()
        self.backbone = tvm.resnet50(weights=None)
        in_f = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(in_f, num_classes)
        )
    def forward(self, x):
        return self.backbone(x)


# ── Architecture lung : EfficientNet-B2 + classifier custom ───────────────────
# Indices dans le checkpoint :
#   classifier.0 → BatchNorm1d(1408)
#   classifier.2 → Linear(1408, 256)
#   classifier.5 → Linear(256, 3)
# Indices 1=ReLU, 3=ReLU, 4=Dropout → pas de poids

class LungCancerModel(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        import timm
        self.backbone = timm.create_model(
            'efficientnet_b2', pretrained=False, num_classes=0
        )
        in_f = self.backbone.num_features  # 1408
        # OrderedDict pour forcer les bons indices 0,1,2,3,4,5
        self.classifier = nn.Sequential(OrderedDict([
            ('0', nn.BatchNorm1d(in_f)),   # classifier.0
            ('1', nn.ReLU()),              # classifier.1 (pas de poids)
            ('2', nn.Linear(in_f, 256)),   # classifier.2
            ('3', nn.ReLU()),              # classifier.3 (pas de poids)
            ('4', nn.Dropout(p=0.5)),      # classifier.4 (pas de poids)
            ('5', nn.Linear(256, num_classes)),  # classifier.5
        ]))

    def forward(self, x):
        return self.classifier(self.backbone(x))


# ── Architecture brain : EfficientNet-B3 + classifier custom ──────────────────
# Indices RÉELS dans le checkpoint entraîné (inspectés via state_dict) :
#   classifier.0 → AdaptiveAvgPool2d       (pas de poids)
#   classifier.1 → Flatten                 (pas de poids)
#   classifier.2 → BatchNorm1d(1536)       ✅
#   classifier.3 → ReLU                    (pas de poids)
#   classifier.4 → Linear(1536, 512)       ✅
#   classifier.5 → ReLU                    (pas de poids)
#   classifier.6 → BatchNorm1d(512)        ✅
#   classifier.7 → Dropout(p=0.4)          (pas de poids)
#   classifier.8 → Linear(512, 4)          ✅
# Le backbone retourne une feature map [B, 1536, H, W]
# → forward_features() pour garder les dimensions spatiales

# ── Architecture brain : EfficientNet-B3 + classifier custom ──────────────────
class BrainTumorModel(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        import timm
        self.backbone = timm.create_model(
            'efficientnet_b3', pretrained=False, num_classes=0, global_pool=''
        )
        # backbone retourne [B, 1536, H, W] → on pool + flatten dans le classifier

        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),     # 0 — [B, 1536, 1, 1]
            nn.Flatten(),                # 1 — [B, 1536]
            nn.BatchNorm1d(1536),        # 2 ✅
            nn.ReLU(),                   # 3
            nn.Linear(1536, 512),        # 4 ✅
            nn.ReLU(),                   # 5
            nn.BatchNorm1d(512),         # 6 ✅
            nn.Dropout(p=0.4),           # 7
            nn.Linear(512, num_classes), # 8 ✅
        )

    def forward(self, x):
        x = self.backbone(x)
        return self.classifier(x)
# ── Construction selon la clé ─────────────────────────────────────────────────

def _build_model(model_key: str, num_classes: int, checkpoint: dict) -> nn.Module:
    if model_key == 'chest':
        dropout = 0.0
        cfg = checkpoint.get('config', {})
        if isinstance(cfg, dict):
            dropout = cfg.get('dropout', 0.0)
        return ChestXrayClassifier(num_classes=num_classes, dropout=dropout)
    if model_key == 'lung':
        return LungCancerModel(num_classes=num_classes)
    if model_key == 'brain':
        return BrainTumorModel(num_classes=num_classes)
    raise ValueError(f"Modèle inconnu : '{model_key}'")


# ── Service d'inférence ────────────────────────────────────────────────────────

class InferenceService:
    def __init__(self, model_path: str, model_key: str):
        self._model       = None
        self._model_key   = model_key
        self._model_path  = model_path
        self._class_names = MODEL_DEFAULT_CLASSES.get(model_key, [])
        self._num_classes = len(self._class_names)
        self._img_size    = MODEL_IMG_SIZES.get(model_key, 224)
        self._load_model()

    def _load_model(self):
        try:
            print(f"⏳ Chargement du modèle [{self._model_key}] : {self._model_path}")

            checkpoint = torch.load(
                self._model_path,
                map_location=settings.DEVICE,
                weights_only=False
            )

            # Métadonnées depuis le checkpoint
            if 'class_names' in checkpoint:
                self._class_names = checkpoint['class_names']
            if 'num_classes' in checkpoint:
                self._num_classes = int(checkpoint['num_classes'])
            if 'img_size' in checkpoint:
                self._img_size = int(checkpoint['img_size'])
            if self._num_classes != len(self._class_names):
                self._num_classes = len(self._class_names)

            # Construire le modèle
            self._model = _build_model(self._model_key, self._num_classes, checkpoint)

            # Charger les poids
            state_dict = checkpoint.get('model_state_dict', checkpoint)
            missing, unexpected = self._model.load_state_dict(state_dict, strict=True)

            self._model.to(settings.DEVICE)
            self._model.eval()

            print(f"✅ Modèle [{self._model_key}] chargé — {self._num_classes} classes — {self._img_size}px")
            print(f"   Classes : {self._class_names}")
            print(f"   Device  : {settings.DEVICE}")

        except FileNotFoundError as e:
            print(f"❌ [{self._model_key}] Fichier introuvable : {e}")
            self._model = None
        except Exception as e:
            print(f"❌ [{self._model_key}] Erreur chargement : {e}")
            self._model = None

    @property
    def class_names(self): return self._class_names
    @property
    def num_classes(self): return self._num_classes
    @property
    def img_size(self):    return self._img_size
    @property
    def is_loaded(self):   return self._model is not None

    def predict(self, image_bytes: bytes, with_gradcam: bool = False) -> Dict:
        if self._model is None:
            raise RuntimeError(
                f"Modèle [{self._model_key}] non chargé. "
                f"Vérifiez que '{MODEL_FILES[self._model_key]}' existe dans saved_models/"
            )

        tensor = preprocess_image(image_bytes, img_size=self._img_size).to(settings.DEVICE)

        with torch.no_grad():
            logits        = self._model(tensor)
            probabilities = F.softmax(logits, dim=1)
            confidence, predicted = torch.max(probabilities, 1)

        pred_idx   = predicted.item()
        pred_class = self._class_names[pred_idx]
        probs      = probabilities[0].cpu().numpy()
        prob_dict  = {
            cls: round(float(p), 6)
            for cls, p in zip(self._class_names, probs)
        }

        result = {
            "prediction"   : pred_class,
            "confidence"   : round(float(confidence.item()), 6),
            "probabilities": prob_dict,
            "class_index"  : pred_idx,
            "num_classes"  : self._num_classes,
            "gradcam_image": None,
        }

        if with_gradcam:
            try:
                from app.services.gradcam import generate_gradcam_overlay
                tensor_grad = preprocess_image(
                    image_bytes, img_size=self._img_size
                ).to(settings.DEVICE)
                # Couche cible selon le modèle
                target_layer = "blocks.6" if self._model_key == "brain" else "layer4"
                result["gradcam_image"] = generate_gradcam_overlay(
                    image_bytes=image_bytes,
                    model=self._model,
                    tensor=tensor_grad,
                    class_idx=pred_idx,
                    device=settings.DEVICE,
                    target_layer_name=target_layer,
                )
                print(f"✅ Grad-CAM généré pour la classe '{pred_class}'")
            except Exception as e:
                print(f"⚠️  Grad-CAM échoué : {e}")

        return result

    def predict_topk(self, image_bytes: bytes, k: int = 3) -> Dict:
        result = self.predict(image_bytes)
        sorted_probs = sorted(
            result["probabilities"].items(), key=lambda x: x[1], reverse=True
        )
        result["top_k"] = [
            {"class": c, "probability": p} for c, p in sorted_probs[:k]
        ]
        return result


# ── Cache ──────────────────────────────────────────────────────────────────────

_services: Dict[str, InferenceService] = {}


def _load_single_model(model_key: str) -> InferenceService:
    models_dir = Path(settings.MODEL_PATH).resolve().parent
    filename   = MODEL_FILES.get(model_key)
    if not filename:
        raise ValueError(f"Modèle inconnu : '{model_key}'")
    model_path = models_dir / filename
    if not model_path.exists():
        raise FileNotFoundError(
            f"Fichier introuvable : {model_path}\n"
            f"Placez '{filename}' dans saved_models/"
        )
    return InferenceService(model_path=str(model_path), model_key=model_key)


def get_inference_service(model_key: str = "chest") -> InferenceService:
    global _services
    if model_key not in _services:
        print(f"[InferenceCache] Premier appel pour '{model_key}' → chargement...")
        _services[model_key] = _load_single_model(model_key)
    return _services[model_key]


def run_inference(image_bytes: bytes, with_gradcam: bool = False,
                  model_key: str = "chest") -> Dict:
    return get_inference_service(model_key).predict(
        image_bytes, with_gradcam=with_gradcam
    )


def preload_all_models():
    for key in MODEL_FILES:
        try:
            get_inference_service(key)
        except Exception as e:
            print(f"⚠️  Préchargement [{key}] échoué : {e}")