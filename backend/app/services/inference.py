"""
Service d'inférence multi-modèles
  • chest → final_model_10classes.pth      (ResNet50, 10 classes thoraciques)
  • lung  → final_lung_cancer_model.pth    (EfficientNet, cancer pulmonaire)
  • brain → final_brain_tumor_model.pth    (ResNet50 custom, 4 classes IRM)

Usage API :
  POST /api/v1/predict?model=chest
  POST /api/v1/predict?model=lung
  POST /api/v1/predict?model=brain
"""

import io
import torch
import torch.nn.functional as F
from typing import Dict, Optional

from app.core.config import settings
from app.services.preprocessing import preprocess_image

# ── Fallback classes ──────────────────────────────────────────────────────────
CHEST_DEFAULT_CLASSES = [
    'COVID', 'Cardiomegaly', 'Edema', 'Emphysema',
    'Lung_Opacity', 'Mass', 'Nodule', 'Pneumonia',
    'Pneumothorax', 'Viral Pneumonia'
]
LUNG_DEFAULT_CLASSES  = ['Benign', 'Malignant', 'Normal']
BRAIN_DEFAULT_CLASSES = ['Glioma', 'Meningioma', 'No Tumor', 'Pituitary']

MODEL_CONFIGS = {
    "chest": {
        "default_path":    "saved_models/final_model_10classes.pth",
        "default_classes": CHEST_DEFAULT_CLASSES,
        "arch":            "resnet50",
        "label":           "Thorax 10 classes",
    },
    "lung": {
        "default_path":    "saved_models/final_lung_cancer_model.pth",
        "default_classes": LUNG_DEFAULT_CLASSES,
        "arch":            "auto",
        "label":           "Cancer Pulmonaire",
    },
    "brain": {
        "default_path":    "saved_models/final_brain_tumor_model.pth",
        "default_classes": BRAIN_DEFAULT_CLASSES,
        "arch":            "brain_efficientnet",
        "label":           "Tumeur Cérébrale",
    },
}


# ── Helpers d'architecture ────────────────────────────────────────────────────

def _build_resnet50(num_classes: int, dropout: float = 0.0):
    import torchvision.models as tv
    import torch.nn as nn

    class _R50(nn.Module):
        def __init__(self):
            super().__init__()
            self.backbone = tv.resnet50(weights=None)
            in_f = self.backbone.fc.in_features
            self.backbone.fc = nn.Sequential(
                nn.Dropout(p=dropout), nn.Linear(in_f, num_classes)
            )

        def forward(self, x):
            return self.backbone(x)

    return _R50()



def _build_brain_efficientnet(num_classes: int, dropout: float = 0.4):
    """
    Reconstruit exactement brain_tumor_efficientnet.ipynb :
    EfficientNet-B3 backbone (timm) + tête custom :
    self.backbone = timm efficientnet_b3 (num_classes=0)
    self.head     = BN(1536)→Drop→Linear(512)→GELU→BN→Drop(0.2)→Linear(N)
    """
    import torch.nn as nn
    try:
        import timm
    except ImportError:
        raise RuntimeError("timm requis pour le modèle brain : pip install timm")

    class _BrainEffNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.backbone = timm.create_model(
                'efficientnet_b3',
                pretrained=False,
                num_classes=0,
                global_pool='avg',
            )
            in_features = self.backbone.num_features   # 1536
            self.head = nn.Sequential(
                nn.BatchNorm1d(in_features),
                nn.Dropout(p=dropout),
                nn.Linear(in_features, 512),
                nn.GELU(),
                nn.BatchNorm1d(512),
                nn.Dropout(p=dropout * 0.5),
                nn.Linear(512, num_classes),
            )
        def forward(self, x):
            return self.head(self.backbone(x))

    return _BrainEffNet()


def _detect_arch(state_dict_keys) -> str:
    keys = list(state_dict_keys)
    joined = " ".join(keys[:20])
    if "conv_stem" in joined or ("blocks." in joined and "backbone" not in joined):
        return "efficientnet"
    # ResNet avec ou sans préfixe backbone
    if any(k in joined for k in ["layer1", "backbone.layer", "backbone.conv1", "conv1.weight"]):
        return "resnet50"
    return "resnet50"


def _detect_efficientnet_variant(state_dict: dict) -> str:
    bn1_key = next((k for k in state_dict if k.endswith("bn1.weight")), None)
    if bn1_key is None:
        return "efficientnet_b0"

    ch = state_dict[bn1_key].shape[0]
    n_params = sum(v.numel() for v in state_dict.values())

    if ch == 32:
        if   n_params < 5_300_000: return "efficientnet_b0"
        elif n_params < 6_600_000: return "efficientnet_b1"
        else:                      return "efficientnet_b2"
    elif ch == 40:                 return "efficientnet_b3"
    elif ch == 48:
        if   n_params < 17_600_000: return "efficientnet_b4"
        else:                       return "efficientnet_b5"
    elif ch == 56:                  return "efficientnet_b6"
    elif ch == 64:                  return "efficientnet_b7"
    return "efficientnet_b0"


def _build_model(arch: str, num_classes: int, state_dict: dict):
    detected = _detect_arch(list(state_dict.keys()))

    # 'auto' = laisser la détection décider entièrement
    effective_arch = detected if arch == "auto" else arch

    if effective_arch == "efficientnet":
        try:
            import timm
            variant = _detect_efficientnet_variant(state_dict)
            bn1_key = next((k for k in state_dict if k.endswith("bn1.weight")), None)
            bn1_ch  = state_dict[bn1_key].shape[0] if bn1_key else "?"
            print(
                f"   EfficientNet variante détectée : {variant} "
                f"(bn1={bn1_ch}, params={sum(v.numel() for v in state_dict.values()):,})"
            )

            # Détecter si le checkpoint utilise le nouveau wrapper (backbone + classifier)
            # ou timm direct (conv_stem, blocks, ...)
            has_backbone_prefix = any(k.startswith("backbone.") for k in state_dict)
            has_classifier_prefix = any(k.startswith("classifier.") for k in state_dict)

            if has_backbone_prefix or has_classifier_prefix:
                # Nouveau format : LungClassifier(backbone=timm, classifier=nn.Sequential)
                import torch.nn as nn

                class LungClassifier(nn.Module):
                    def __init__(self):
                        super().__init__()
                        self.backbone = timm.create_model(
                            variant, pretrained=False, num_classes=0, drop_rate=0.6
                        )
                        in_f = self.backbone.num_features
                        dropout = 0.6
                        self.classifier = nn.Sequential(
                            nn.BatchNorm1d(in_f),
                            nn.Dropout(dropout),
                            nn.Linear(in_f, 256),
                            nn.GELU(),
                            nn.Dropout(dropout * 0.5),
                            nn.Linear(256, num_classes),
                        )
                    def forward(self, x):
                        return self.classifier(self.backbone(x))

                model = LungClassifier()
                print(f"   Format : LungClassifier (backbone+classifier)")
            else:
                # Ancien format : timm direct avec head remplacé
                model = timm.create_model(variant, pretrained=False, num_classes=num_classes)
                print(f"   Format : timm direct")

            return model, variant
        except ImportError:
            raise RuntimeError("Le modèle lung cancer nécessite `timm`. pip install timm")
    elif arch == "brain_efficientnet":
        dropout = 0.4
        print(f"   Architecture : brain_efficientnet (EfficientNet-B3 + BN→Drop→512→GELU→Drop→{num_classes})")
        return _build_brain_efficientnet(num_classes, dropout), "brain_efficientnet"
    else:
        print(f"   Architecture détectée : ResNet50 (demandée: '{arch}', détectée: '{detected}')")
        return _build_resnet50(num_classes), "resnet50"


# ── Service par modèle ────────────────────────────────────────────────────────

class ModelService:
    """Encapsule un checkpoint unique."""

    def __init__(self, model_key: str):
        self.key          = model_key
        self.cfg          = MODEL_CONFIGS[model_key]
        self._model       = None
        self._class_names = self.cfg["default_classes"]
        self._num_classes = len(self._class_names)
        self._arch        = self.cfg["arch"]
        self._arch_name   = self.cfg["arch"]
        self._img_size    = 224
        self._load()

    # ------------------------------------------------------------------
    def _resolve_path(self) -> str:
        from pathlib import Path
        import os
        env_vars = {"chest": "MODEL_PATH", "lung": "LUNG_MODEL_PATH", "brain": "BRAIN_MODEL_PATH"}
        env_val = os.getenv(env_vars.get(self.key, ""), "")
        if env_val:
            p = Path(env_val)
            return str(p if p.is_absolute() else Path(settings.MODEL_PATH).parent.parent / env_val)
        base = Path(settings.MODEL_PATH).parent
        return str(base / Path(self.cfg["default_path"]).name)

    # ------------------------------------------------------------------
    def _load(self):
        from pathlib import Path
        path = self._resolve_path()
        if not Path(path).exists():
            print(f"⚠️  [{self.key}] Fichier introuvable : {path}")
            return

        print(f"⏳ [{self.key}] Chargement : {path}")
        try:
            ckpt = torch.load(path, map_location="cpu", weights_only=False)

            # Supporter ckpt dict ou state_dict brut
            if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
                self._class_names = ckpt.get("class_names", self._class_names)
                self._num_classes  = len(self._class_names)
                self._img_size     = ckpt.get("img_size", 224)
                raw_sd = ckpt["model_state_dict"]
            elif isinstance(ckpt, dict):
                # Peut être un state_dict brut sauvegardé directement
                raw_sd = ckpt
            else:
                print(f"❌ [{self.key}] Format checkpoint inconnu : {type(ckpt)}")
                return

            # Construire le modèle
            model, arch_name = _build_model(self._arch, self._num_classes, raw_sd)
            self._arch_name  = arch_name

            # ── Chargement des poids : essais successifs ──────────────
            loaded = False

            # Essai 1 : direct strict
            try:
                model.load_state_dict(raw_sd, strict=True)
                loaded = True
                print(f"   ✅ Poids chargés (strict, direct)")
            except RuntimeError as e1:
                print(f"   ⚠️  Essai 1 (strict direct) échoué : {e1}")

            # Essai 2 : sans préfixe backbone
            if not loaded:
                from collections import OrderedDict
                sd_no_prefix = OrderedDict(
                    (k.replace("backbone.", "", 1) if k.startswith("backbone.") else k, v)
                    for k, v in raw_sd.items()
                )
                try:
                    model.load_state_dict(sd_no_prefix, strict=True)
                    loaded = True
                    print(f"   ✅ Poids chargés (strict, sans préfixe backbone)")
                except RuntimeError as e2:
                    print(f"   ⚠️  Essai 2 (sans préfixe) échoué : {e2}")

            # Essai 3 : avec préfixe backbone
            if not loaded:
                from collections import OrderedDict
                sd_with_prefix = OrderedDict(
                    (f"backbone.{k}" if not k.startswith("backbone.") else k, v)
                    for k, v in raw_sd.items()
                )
                try:
                    model.load_state_dict(sd_with_prefix, strict=True)
                    loaded = True
                    print(f"   ✅ Poids chargés (strict, avec préfixe backbone)")
                except RuntimeError as e3:
                    print(f"   ⚠️  Essai 3 (avec préfixe) échoué : {e3}")

            # Essai 4 : strict=False avec diagnostic
            if not loaded:
                missing, unexpected = model.load_state_dict(raw_sd, strict=False)
                if missing:
                    print(f"   ⚠️  Clés manquantes ({len(missing)}) : {missing[:5]}")
                if unexpected:
                    print(f"   ⚠️  Clés inattendues ({len(unexpected)}) : {unexpected[:5]}")
                # Si trop de poids manquants, le modèle retournera des valeurs aléatoires
                if len(missing) > self._num_classes * 2:
                    print(
                        f"   ❌ [{self.key}] {len(missing)} clés manquantes — "
                        f"les poids ne sont pas compatibles avec l'architecture détectée. "
                        f"Modèle NON chargé."
                    )
                    return
                print(f"   ⚠️  Poids chargés (non-strict) — vérifier les performances")

            model.eval()
            self._model     = model
            self._arch_name = arch_name  # mis à jour avec la valeur réelle post-détection
            print(f"✅ [{self.key}] {arch_name} · {self._num_classes} classes : {self._class_names}")

        except Exception as e:
            print(f"❌ [{self.key}] Erreur chargement : {e}")
            import traceback; traceback.print_exc()
            self._model = None

    # ------------------------------------------------------------------
    @property
    def is_loaded(self):   return self._model is not None
    @property
    def class_names(self): return self._class_names
    @property
    def num_classes(self): return self._num_classes
    @property
    def label(self):       return self.cfg["label"]
    @property
    def arch_name(self):   return self._arch_name

    # ------------------------------------------------------------------
    def predict(self, image_bytes: bytes, with_gradcam: bool = False) -> Dict:
        if self._model is None:
            raise RuntimeError(f"Modèle '{self.key}' non chargé.")

        tensor = preprocess_image(image_bytes, img_size=self._img_size)
        with torch.no_grad():
            logits = self._model(tensor)
            probs  = F.softmax(logits, dim=1)
            conf, pred = torch.max(probs, 1)

        idx        = pred.item()
        pred_class = self._class_names[idx]
        prob_arr   = probs[0].cpu().numpy()

        result = {
            "model"        : self.key,
            "prediction"   : pred_class,
            "confidence"   : round(float(conf.item()), 6),
            "probabilities": {c: round(float(p), 6) for c, p in zip(self._class_names, prob_arr)},
            "class_index"  : idx,
            "num_classes"  : self._num_classes,
            "gradcam_image": None,
        }

        if with_gradcam:
            try:
                from app.services.gradcam import generate_gradcam_overlay
                tensor_grad = preprocess_image(image_bytes, img_size=self._img_size)
                result["gradcam_image"] = generate_gradcam_overlay(
                    image_bytes=image_bytes,
                    model=self._model,
                    tensor=tensor_grad,
                    class_idx=idx,
                    device="cpu",
                    arch=self._arch_name,
                )
            except Exception as e:
                print(f"⚠️  Grad-CAM échoué : {e}")
                import traceback; traceback.print_exc()

        return result


# ── Registry global ───────────────────────────────────────────────────────────

class ModelRegistry:
    """Charge et gère tous les modèles disponibles (singleton)."""

    def __init__(self):
        self._services: Dict[str, ModelService] = {}
        for key in MODEL_CONFIGS:
            self._services[key] = ModelService(key)

    def get(self, key: str) -> ModelService:
        if key not in self._services:
            raise ValueError(
                f"Modèle inconnu : '{key}'. Disponibles : {list(self._services.keys())}"
            )
        return self._services[key]

    def status(self) -> Dict:
        return {
            key: {
                "loaded"     : svc.is_loaded,
                "num_classes": svc.num_classes,
                "class_names": svc.class_names,
                "label"      : svc.label,
            }
            for key, svc in self._services.items()
        }

    # Compatibilité avec l'ancien code (modèle 'chest' par défaut)
    @property
    def is_loaded(self):   return self._services["chest"].is_loaded
    @property
    def num_classes(self): return self._services["chest"].num_classes
    @property
    def class_names(self): return self._services["chest"].class_names


# ── Singleton ─────────────────────────────────────────────────────────────────

_registry: Optional[ModelRegistry] = None


def get_inference_service() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry


def run_inference(image_bytes: bytes, with_gradcam: bool = False, model: str = "chest") -> Dict:
    """Point d'entrée principal utilisé par routes.py."""
    return get_inference_service().get(model).predict(image_bytes, with_gradcam)