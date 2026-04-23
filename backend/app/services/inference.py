"""
app/services/inference.py

Service d'inférence multi-modèles — chest / lung / brain / retina

RETINA — NOUVEAU PIPELINE (EfficientNet-B3 APTOS) :
=====================================================
Remplace l'ancien pipeline MultiModal (EfficientNet-B4 + GAT + BERT + TDA).
Le nouveau checkpoint final_aptos_model.pth contient :

  model_state_dict : poids EfficientNet-B3 + tête FC custom
  class_names      : ['No_DR', 'Mild', 'Moderate', 'Severe', 'Proliferate_DR']
  num_classes      : 5
  img_size         : 224
  class_weights    : liste des poids utilisés à l'entraînement (pour info)
  val_metrics      : {'accuracy': ..., 'loss': ..., 'kappa_quad': ...}
  model_info       : {'backbone': 'efficientnet_b3', 'in_features': 1536,
                      'hidden': 512, 'dropout': 0.4, 'label_smoothing': 0.1,
                      'weighted_sampler': True, 'class_weights': True}

Architecture AptosModel (identique au notebook) :
  backbone : timm EfficientNet-B3 (num_classes=0, global_pool='avg') → [B, 1536]
  head     : Linear(1536→512) → BN → SiLU → Dropout(0.4) → Linear(512→5)

NORMALISATION : ImageNet mean/std (identique aux autres modèles)
  ← CHANGEMENT vs l'ancien pipeline qui faisait /255 uniquement
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

CLASSES_CHEST  = [
    'COVID', 'Lung_Opacity', 'Viral Pneumonia', 'Cardiomegaly',
    'Pneumothorax', 'Pneumonia', 'Edema', 'Emphysema', 'Nodule', 'Mass'
]
CLASSES_LUNG   = ['Benign', 'Malignant', 'Normal']
CLASSES_BRAIN  = ['glioma', 'meningioma', 'notumor', 'pituitary']
CLASSES_RETINA = ['No_DR', 'Mild', 'Moderate', 'Severe', 'Proliferate_DR']

MODEL_FILES = {
    "chest":  "final_model_10classes.pth",
    "lung":   "final_lung_cancer_model.pth",
    "brain":  "final_brain_tumor_model.pth",
    "retina": "final_aptos_model.pth",     # ← MODIFIÉ : était best_retina_model.pth
}
MODEL_DEFAULT_CLASSES = {
    "chest":  CLASSES_CHEST,
    "lung":   CLASSES_LUNG,
    "brain":  CLASSES_BRAIN,
    "retina": CLASSES_RETINA,
}
MODEL_IMG_SIZES = {
    "chest":  224,
    "lung":   260,
    "brain":  224,
    "retina": 224,   # ← inchangé
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

class LungCancerModel(nn.Module):
    def __init__(self, num_classes=3):
        super().__init__()
        import timm
        self.backbone = timm.create_model(
            'efficientnet_b2', pretrained=False, num_classes=0
        )
        in_f = self.backbone.num_features  # 1408
        self.classifier = nn.Sequential(OrderedDict([
            ('0', nn.BatchNorm1d(in_f)),
            ('1', nn.ReLU()),
            ('2', nn.Linear(in_f, 256)),
            ('3', nn.ReLU()),
            ('4', nn.Dropout(p=0.5)),
            ('5', nn.Linear(256, num_classes)),
        ]))

    def forward(self, x):
        return self.classifier(self.backbone(x))


# ── Architecture brain : EfficientNet-B3 + classifier custom ──────────────────

class BrainTumorModel(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        import timm
        self.backbone = timm.create_model(
            'efficientnet_b3', pretrained=False, num_classes=0, global_pool=''
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.BatchNorm1d(1536),
            nn.ReLU(),
            nn.Linear(1536, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(p=0.4),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        x = self.backbone(x)
        return self.classifier(x)


# ── Architecture retina : EfficientNet-B3 APTOS (NOUVEAU) ─────────────────────
#
# Remplace entièrement l'ancien RetinaInference (MultiModal + GAT + BERT + TDA).
# Architecture identique à AptosModel dans le notebook d'entraînement.
#
#   Input  : [B, 3, 224, 224]  — normalisé ImageNet
#   Backbone: EfficientNet-B3 (global_pool='avg', num_classes=0) → [B, 1536]
#   Head   : Linear(1536→512) → BN1d → SiLU → Dropout(0.4) → Linear(512→5)
#   Output : [B, 5]  logits

class AptosModel(nn.Module):
    """
    EfficientNet-B3 fine-tuné sur APTOS 2019 avec class weights + WeightedRandomSampler.
    Tête de classification custom identique au notebook d'entraînement.
    """
    def __init__(self, num_classes: int = 5, dropout: float = 0.4):
        super().__init__()
        import timm
        self.backbone = timm.create_model(
            'efficientnet_b3',
            pretrained=False,
            num_classes=0,        # supprime la tête timm
            global_pool='avg'     # → sortie [B, 1536]
        )
        in_features = self.backbone.num_features   # 1536 pour B3
        self.head = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.SiLU(),
            nn.Dropout(dropout),
            nn.Linear(512, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)   # [B, 1536]
        return self.head(features)    # [B, num_classes]


# ── Construction du modèle ────────────────────────────────────────────────────

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

    if model_key == 'retina':
        return _build_retina_model(num_classes, checkpoint)

    raise ValueError(f"Modèle inconnu : '{model_key}'")


def _build_retina_model(num_classes: int, checkpoint: dict) -> nn.Module:
    """
    Instancie AptosModel et charge les poids depuis final_aptos_model.pth.

    Format du checkpoint (sauvegardé par le notebook APTOS) :
      checkpoint['model_state_dict'] → poids backbone + head
      checkpoint['model_info']['dropout'] → valeur du dropout (défaut 0.4)
      checkpoint['num_classes']      → 5
      checkpoint['img_size']         → 224
      checkpoint['class_names']      → ['No_DR', 'Mild', ...]
      checkpoint['val_metrics']      → {'accuracy', 'loss', 'kappa_quad'}
      checkpoint['class_weights']    → liste des poids (info uniquement)
    """
    # Lire le dropout depuis les métadonnées du checkpoint
    model_info = checkpoint.get('model_info', {})
    dropout    = float(model_info.get('dropout', 0.4))

    model = AptosModel(num_classes=num_classes, dropout=dropout)

    # Charger les poids
    state_dict = checkpoint.get('model_state_dict', checkpoint)
    if not isinstance(state_dict, dict):
        raise RuntimeError(
            "[RetinaModel] model_state_dict absent ou invalide dans le checkpoint. "
            "Vérifiez que final_aptos_model.pth a été généré par le notebook APTOS."
        )

    # Chargement strict — l'architecture est exactement celle du notebook
    try:
        model.load_state_dict(state_dict, strict=True)
        print(f"[RetinaModel] ✅ Chargement strict OK — {len(state_dict)} clés")
    except RuntimeError as e:
        print(f"[RetinaModel] strict=True échoué → tentative strict=False")
        print(f"[RetinaModel] Erreur : {e}")
        missing, unexpected = model.load_state_dict(state_dict, strict=False)
        if missing:
            print(f"[RetinaModel] ⚠️  Clés manquantes ({len(missing)}) : {missing[:5]}")
        if unexpected:
            print(f"[RetinaModel] ⚠️  Clés inattendues ({len(unexpected)}) : {unexpected[:5]}")

    # Log des métriques d'entraînement si disponibles
    val_metrics = checkpoint.get('val_metrics', {})
    if val_metrics:
        acc   = val_metrics.get('accuracy', 0) * 100
        kappa = val_metrics.get('kappa_quad', 0)
        print(f"[RetinaModel] Val Accuracy={acc:.2f}% | Kappa quadratique={kappa:.4f}")

    class_weights = checkpoint.get('class_weights', [])
    if class_weights:
        print(f"[RetinaModel] Class weights utilisés à l'entraînement : "
              f"{[round(w, 4) for w in class_weights]}")

    return model


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
            print(f"\n⏳ [{self._model_key}] Chargement depuis : {self._model_path}")

            checkpoint = torch.load(
                self._model_path,
                map_location=settings.DEVICE,
                weights_only=False,
            )

            # ── Lire les métadonnées du checkpoint ──────────────────────────
            # Le notebook APTOS sauvegarde les clés directement à la racine du dict
            # (pas sous 'metadata' comme l'ancien pipeline MultiModal).
            if isinstance(checkpoint, dict):
                # Nouveau format APTOS (racine plate)
                if 'class_names' in checkpoint:
                    self._class_names = checkpoint['class_names']
                if 'num_classes' in checkpoint:
                    self._num_classes = int(checkpoint['num_classes'])
                if 'img_size' in checkpoint:
                    self._img_size = int(checkpoint['img_size'])

                # Ancien format MultiModal (métadonnées sous 'metadata')
                # Conservé pour compatibilité avec chest/lung/brain s'ils utilisent ce format
                meta = checkpoint.get('metadata', {})
                if isinstance(meta, dict):
                    if 'classes' in meta:
                        self._class_names = meta['classes']
                    if 'num_classes' in meta:
                        self._num_classes = int(meta['num_classes'])
                    if 'img_size' in meta:
                        self._img_size = int(meta['img_size'])

            # Cohérence num_classes / class_names
            if self._class_names and self._num_classes != len(self._class_names):
                self._num_classes = len(self._class_names)

            # ── Construire et charger le modèle ─────────────────────────────
            self._model = _build_model(self._model_key, self._num_classes, checkpoint)

            # Pour chest/lung/brain : chargement standard (retina géré dans _build_retina_model)
            if self._model_key != 'retina':
                state_dict = checkpoint.get('model_state_dict', checkpoint)
                if not isinstance(state_dict, dict):
                    state_dict = checkpoint
                try:
                    self._model.load_state_dict(state_dict, strict=True)
                    print(f"[{self._model_key}] ✅ Chargement strict OK")
                except RuntimeError as e:
                    print(f"[{self._model_key}] strict=True échoué → strict=False")
                    missing, unexpected = self._model.load_state_dict(state_dict, strict=False)
                    print(f"[{self._model_key}] missing={len(missing)} unexpected={len(unexpected)}")

            self._model.to(settings.DEVICE)
            self._model.eval()

            print(f"✅ [{self._model_key}] prêt — {self._num_classes} classes — {self._img_size}px")
            print(f"   Classes : {self._class_names}")
            print(f"   Device  : {settings.DEVICE}\n")

        except FileNotFoundError as e:
            print(f"❌ [{self._model_key}] Fichier introuvable : {e}")
            self._model = None
        except Exception as e:
            print(f"❌ [{self._model_key}] Erreur : {e}")
            import traceback; traceback.print_exc()
            self._model = None

    @property
    def class_names(self): return self._class_names

    @property
    def num_classes(self): return self._num_classes

    @property
    def img_size(self): return self._img_size

    @property
    def is_loaded(self): return self._model is not None

    def predict(self, image_bytes: bytes, with_gradcam: bool = False) -> Dict:
        if self._model is None:
            raise RuntimeError(
                f"Modèle [{self._model_key}] non chargé. "
                f"Vérifiez que '{MODEL_FILES[self._model_key]}' existe dans saved_models/"
            )

        # Tous les modèles utilisent maintenant la normalisation ImageNet
        # (retina inclus — cf. preprocessing.py, _MODELS_DIV255_ONLY est vide)
        tensor = preprocess_image(
            image_bytes,
            img_size=self._img_size,
            model_key=self._model_key,
        ).to(settings.DEVICE)

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
            "prediction":    pred_class,
            "confidence":    round(float(confidence.item()), 6),
            "probabilities": prob_dict,
            "class_index":   pred_idx,
            "num_classes":   self._num_classes,
            "gradcam_image": None,
        }

        if with_gradcam:
            result["gradcam_image"] = self._generate_gradcam(image_bytes, pred_idx)

        return result

    def _generate_gradcam(self, image_bytes: bytes, pred_idx: int):
        try:
            from app.services.gradcam import generate_gradcam_overlay
            tensor_grad = preprocess_image(
                image_bytes,
                img_size=self._img_size,
                model_key=self._model_key,
            ).to(settings.DEVICE)
            # MODIFIÉ : retina pointe maintenant sur backbone.blocks (EfficientNet-B3)
            # comme brain et lung, et non plus sur un module CNN spécifique à MultiModal.
            target = {
                "chest":  "backbone.layer4",
                "lung":   "backbone.blocks",
                "brain":  "backbone.blocks",
                "retina": "backbone.blocks",   # EfficientNet-B3 backbone
            }.get(self._model_key, "backbone.layer4")
            return generate_gradcam_overlay(
                image_bytes=image_bytes, model=self._model,
                tensor=tensor_grad, class_idx=pred_idx,
                device=settings.DEVICE, target_layer_name=target,
            )
        except Exception as e:
            print(f"⚠️  Grad-CAM [{self._model_key}] : {e}")
            return None

    def predict_topk(self, image_bytes: bytes, k: int = 3) -> Dict:
        result = self.predict(image_bytes)
        sorted_probs = sorted(
            result["probabilities"].items(), key=lambda x: x[1], reverse=True
        )
        result["top_k"] = [{"class": c, "probability": p} for c, p in sorted_probs[:k]]
        return result


# ── Cache global ───────────────────────────────────────────────────────────────

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
        print(f"[InferenceCache] Chargement de '{model_key}'...")
        _services[model_key] = _load_single_model(model_key)
    return _services[model_key]


def run_inference(image_bytes: bytes, with_gradcam: bool = False,
                  model_key: str = "chest") -> Dict:
    return get_inference_service(model_key).predict(
        image_bytes, with_gradcam=with_gradcam
    )


def preload_all_models():
    print("[Preload] Chargement de tous les modèles...")
    for key in MODEL_FILES:
        try:
            get_inference_service(key)
        except Exception as e:
            print(f"⚠️  Préchargement [{key}] échoué : {e}")
