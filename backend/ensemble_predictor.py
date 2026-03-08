"""
╔══════════════════════════════════════════════════════════════════╗
║         ChestAI — Backend Ensemble Learning                      ║
║                                                                  ║
║  Modèle A : MultiModal (EfficientNet-B4 + GNN + BERT + TDA)     ║
║             → 12 classes (chestAI2.pth)                          ║
║  Modèle B : ResNet50 simple                                      ║
║             → 10 classes (final_model_10classes.pth)             ║
║                                                                  ║
║  Stratégie : Modèle A prioritaire si confiance >= seuil         ║
║              Fallback vers Modèle B sinon                        ║
╚══════════════════════════════════════════════════════════════════╝
"""

import os
import io
import base64
import logging
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
import cv2
from PIL import Image
from pathlib import Path
from typing import Optional

import albumentations as A
from albumentations.pytorch import ToTensorV2

# ── Logging ───────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
log = logging.getLogger("ChestAI")

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Chemins vers les modèles (à adapter si besoin)
MODEL_MULTIMODAL_PATH = "chestAI2.pth"           # Modèle A (12 classes)
MODEL_RESNET_PATH     = "final_model_10classes.pth"  # Modèle B (10 classes)

# Seuil de confiance : si Modèle A < CONFIDENCE_THRESHOLD → fallback vers B
CONFIDENCE_THRESHOLD = 0.55

# Classes
CLASSES_MULTIMODAL = [
    "Cardiomegaly", "COVID", "Edema", "Emphysema",
    "Lung_cancer", "Lung_Opacity", "Mass", "Nodule",
    "Normal", "Pneumonia", "Pneumothorax", "Viral Pneumonia"
]

CLASSES_RESNET = [
    "COVID", "Lung_Opacity", "Viral Pneumonia", "Cardiomegaly",
    "Pneumothorax", "Pneumonia", "Edema", "Emphysema", "Nodule", "Mass"
]

# Classes partagées entre les deux modèles (pour validation croisée)
SHARED_CLASSES = set(CLASSES_MULTIMODAL) & set(CLASSES_RESNET)

# ═══════════════════════════════════════════════════════════════════
# ARCHITECTURE MODÈLE A — MultiModal
# (doit être identique à l'architecture d'entraînement)
# ═══════════════════════════════════════════════════════════════════

try:
    from torch_geometric.data import Data
    from torch_geometric.nn import GATConv, global_mean_pool
    GEO_AVAILABLE = True
except ImportError:
    GEO_AVAILABLE = False
    log.warning("torch-geometric non installé — Modèle A désactivé")

try:
    from transformers import AutoTokenizer, AutoModel
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False
    log.warning("transformers non installé — Modèle A désactivé")

try:
    import gudhi
    GUDHI_AVAILABLE = True
except ImportError:
    GUDHI_AVAILABLE = False
    log.warning("gudhi non installé — TDA désactivé (Modèle A)")

MULTIMODAL_AVAILABLE = GEO_AVAILABLE and BERT_AVAILABLE

if MULTIMODAL_AVAILABLE:

    class GAT(nn.Module):
        def __init__(self, d):
            super().__init__()
            self.g1 = GATConv(d, 256, heads=4, concat=False)
            self.g2 = GATConv(256, 256)

        def forward(self, data):
            x = F.relu(self.g1(data.x, data.edge_index))
            x = F.relu(self.g2(x, data.edge_index))
            return global_mean_pool(x, data.batch)

    class MultiModal(nn.Module):
        def __init__(self, cnn_dim, num_classes=12):
            super().__init__()
            self.gnn = GAT(cnn_dim)
            self.fc  = nn.Sequential(
                nn.Linear(cnn_dim + 256 + 768 + 50, 512),
                nn.ReLU(),
                nn.Dropout(0.4),
                nn.Linear(512, num_classes)
            )

        def forward(self, img_feat, graph_data, txt_emb, tda_feat):
            B, C, H, W = img_feat.shape
            g     = self.gnn(graph_data)
            cnn_g = img_feat.view(B, C, -1).mean(2)
            return self.fc(torch.cat([cnn_g, g, txt_emb, tda_feat], 1))


def build_graph(feat, device):
    """Construit le graphe GNN depuis les features CNN."""
    B, C, H, W = feat.shape
    nodes = feat.view(B, C, -1).permute(0, 2, 1).reshape(-1, C)
    edges = []
    for b in range(B):
        base = b * (H * W)
        for i in range(H):
            for j in range(W):
                idx = i * W + j
                if j + 1 < W: edges.append([base + idx, base + idx + 1])
                if i + 1 < H: edges.append([base + idx, base + idx + W])
    edge_index = torch.tensor(edges).t().long().to(device)
    batch_idx  = torch.repeat_interleave(torch.arange(B), H * W).to(device)
    return Data(x=nodes, edge_index=edge_index, batch=batch_idx)


def tda_vec(feat, dim=50, device="cpu"):
    """TDA — vecteur de persistance Rips."""
    if not GUDHI_AVAILABLE:
        return torch.zeros(dim, device=device)
    pts  = feat.view(-1, 2).detach().cpu().numpy()[:200]
    st   = gudhi.RipsComplex(points=pts).create_simplex_tree()
    pers = [p[1][1] - p[1][0] for p in st.persistence() if p[0] == 1][:dim]
    return torch.tensor(pers + [0] * (dim - len(pers)), device=device)


# ═══════════════════════════════════════════════════════════════════
# CHARGEMENT DES MODÈLES
# ═══════════════════════════════════════════════════════════════════

class ModelA:
    """Wrapper Modèle A — MultiModal 12 classes."""

    def __init__(self):
        self.ready      = False
        self.cnn        = None
        self.model      = None
        self.tokenizer  = None
        self.bert       = None
        self.txt_cache  = {}
        self.classes    = CLASSES_MULTIMODAL

    def load(self, path: str):
        if not MULTIMODAL_AVAILABLE:
            log.warning("Dépendances Modèle A manquantes — ignoré")
            return False
        if not os.path.exists(path):
            log.warning(f"Modèle A introuvable : {path}")
            return False
        try:
            log.info("Chargement Modèle A (MultiModal)…")

            # CNN EfficientNet-B4 (features only)
            self.cnn = timm.create_model(
                "efficientnet_b4", pretrained=False, features_only=True
            ).to(DEVICE).eval()
            cnn_dim = self.cnn.feature_info[-1]["num_chs"]

            # MultiModal
            self.model = MultiModal(cnn_dim, num_classes=len(self.classes)).to(DEVICE)

            # Charger les poids
            ckpt = torch.load(path, map_location=DEVICE)
            # Gérer différents formats de sauvegarde
            state = ckpt.get("model_state_dict", ckpt.get("state_dict", ckpt))
            self.model.load_state_dict(state, strict=False)
            self.model.eval()

            # BERT ClinicalBERT
            self.tokenizer = AutoTokenizer.from_pretrained("emilyalsentzer/Bio_ClinicalBERT")
            self.bert      = AutoModel.from_pretrained(
                "emilyalsentzer/Bio_ClinicalBERT"
            ).to(DEVICE).eval()

            self.ready = True
            log.info(f"✅ Modèle A chargé — {len(self.classes)} classes")
            return True

        except Exception as e:
            log.error(f"❌ Erreur chargement Modèle A : {e}")
            return False

    def get_text_emb(self, text: str) -> torch.Tensor:
        if text not in self.txt_cache:
            tok = self.tokenizer(
                text, return_tensors="pt", truncation=True, max_length=64
            ).to(DEVICE)
            with torch.no_grad():
                self.txt_cache[text] = self.bert(**tok).pooler_output.squeeze(0)
        return self.txt_cache[text]

    @torch.no_grad()
    def predict(self, image_tensor: torch.Tensor) -> dict:
        """Retourne {'class': str, 'confidence': float, 'probabilities': dict}"""
        if not self.ready:
            return None
        try:
            img = image_tensor.unsqueeze(0).to(DEVICE)

            # Features CNN
            feat = self.cnn(img)[-1]

            # Graphe GNN
            graph = build_graph(feat, DEVICE)

            # Texte (générique à l'inférence)
            txt_emb = self.get_text_emb("Chest X-ray for diagnosis").unsqueeze(0)

            # TDA
            tda = tda_vec(feat[0], device=DEVICE).unsqueeze(0)

            # Inférence
            logits = self.model(feat, graph, txt_emb, tda)
            probs  = F.softmax(logits, dim=1)[0]

            pred_idx    = int(probs.argmax())
            pred_class  = self.classes[pred_idx]
            confidence  = float(probs[pred_idx])

            return {
                "class"        : pred_class,
                "confidence"   : confidence,
                "probabilities": {c: float(probs[i]) for i, c in enumerate(self.classes)},
                "model_used"   : "MultiModal-12classes",
            }
        except Exception as e:
            log.error(f"Modèle A — erreur inférence : {e}")
            return None


class ModelB:
    """Wrapper Modèle B — ResNet50 10 classes."""

    def __init__(self):
        self.ready   = False
        self.model   = None
        self.classes = CLASSES_RESNET

    def load(self, path: str):
        if not os.path.exists(path):
            log.warning(f"Modèle B introuvable : {path}")
            return False
        try:
            import torchvision.models as models
            log.info("Chargement Modèle B (ResNet50)…")

            ckpt        = torch.load(path, map_location=DEVICE)
            num_classes = ckpt.get("num_classes", 10)
            dropout     = ckpt.get("config", {}).get("dropout", 0.5)

            # Reconstruire l'architecture exacte
            backbone    = models.resnet50(weights=None)
            backbone.fc = nn.Sequential(
                nn.Dropout(dropout),
                nn.Linear(backbone.fc.in_features, num_classes)
            )
            backbone.load_state_dict(ckpt["model_state_dict"])
            backbone.eval().to(DEVICE)
            self.model = backbone

            # Classes depuis le checkpoint si disponible
            if "class_names" in ckpt:
                self.classes = ckpt["class_names"]

            self.ready = True
            acc = ckpt.get("test_metrics", {}).get("accuracy", "?")
            log.info(f"✅ Modèle B chargé — {num_classes} classes | acc={acc}")
            return True

        except Exception as e:
            log.error(f"❌ Erreur chargement Modèle B : {e}")
            return False

    @torch.no_grad()
    def predict(self, image_tensor: torch.Tensor) -> dict:
        if not self.ready:
            return None
        try:
            img    = image_tensor.unsqueeze(0).to(DEVICE)
            logits = self.model(img)
            probs  = F.softmax(logits, dim=1)[0]

            pred_idx   = int(probs.argmax())
            pred_class = self.classes[pred_idx]
            confidence = float(probs[pred_idx])

            return {
                "class"        : pred_class,
                "confidence"   : confidence,
                "probabilities": {c: float(probs[i]) for i, c in enumerate(self.classes)},
                "model_used"   : "ResNet50-10classes",
            }
        except Exception as e:
            log.error(f"Modèle B — erreur inférence : {e}")
            return None


# ═══════════════════════════════════════════════════════════════════
# ENSEMBLE PREDICTOR
# ═══════════════════════════════════════════════════════════════════

class EnsemblePredictor:
    """
    Stratégie d'ensemble :
      1. Modèle A prédit → si confiance >= CONFIDENCE_THRESHOLD → résultat final
      2. Sinon → Modèle B prédit
      3. Si les deux sont disponibles et classe partagée → score moyen pondéré
    """

    def __init__(self):
        self.model_a   = ModelA()
        self.model_b   = ModelB()
        self.threshold = CONFIDENCE_THRESHOLD
        self.ready     = False

    def load_models(self,
                    path_a: str = MODEL_MULTIMODAL_PATH,
                    path_b: str = MODEL_RESNET_PATH):
        ok_a = self.model_a.load(path_a)
        ok_b = self.model_b.load(path_b)

        if not ok_a and not ok_b:
            raise RuntimeError("❌ Aucun modèle n'a pu être chargé !")

        self.ready = True
        log.info(f"Ensemble prêt | Modèle A={'✅' if ok_a else '❌'} | "
                 f"Modèle B={'✅' if ok_b else '❌'} | "
                 f"Seuil confiance={self.threshold:.0%}")

    def preprocess(self, image_np: np.ndarray, img_size: int = 224) -> torch.Tensor:
        transform = A.Compose([
            A.Resize(img_size, img_size),
            A.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225]),
            ToTensorV2(),
        ])
        return transform(image=image_np)["image"]

    def load_image(self, image_input) -> np.ndarray:
        """Accepte chemin (str), bytes ou np.ndarray RGB."""
        if isinstance(image_input, str):
            img = cv2.imread(image_input)
            if img is None:
                raise ValueError(f"Image introuvable : {image_input}")
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        elif isinstance(image_input, (bytes, bytearray)):
            arr = np.frombuffer(image_input, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Impossible de décoder l'image")
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        elif isinstance(image_input, np.ndarray):
            return image_input  # déjà en RGB

        else:
            raise TypeError("image_input : str | bytes | np.ndarray attendu")

    def _merge_probabilities(self, result_a: dict, result_b: dict) -> dict:
        """
        Fusionne les probabilités sur les classes communes.
        Pondération : Modèle A × 0.6 + Modèle B × 0.4
        """
        merged = {}

        # Probabilités Modèle A (toutes ses classes)
        for cls, p in result_a["probabilities"].items():
            merged[cls] = p * 0.6

        # Probabilités Modèle B (classes communes → ajout pondéré)
        for cls, p in result_b["probabilities"].items():
            if cls in merged:
                merged[cls] += p * 0.4
            else:
                merged[cls] = p * 0.4   # classe exclusive au Modèle B

        # Renormaliser
        total = sum(merged.values())
        if total > 0:
            merged = {k: v / total for k, v in merged.items()}

        best_class = max(merged, key=merged.get)
        return {
            "class"        : best_class,
            "confidence"   : merged[best_class],
            "probabilities": dict(sorted(merged.items(), key=lambda x: -x[1])),
            "model_used"   : "Ensemble (A×0.6 + B×0.4)",
        }

    @torch.no_grad()
    def predict(self, image_input, threshold: float = None) -> dict:
        """
        Prédit la pathologie avec la meilleure stratégie disponible.

        Returns:
            {
              'prediction'   : str,       # classe prédite
              'confidence'   : float,     # confiance (0-1)
              'probabilities': dict,      # toutes les probs
              'model_used'   : str,       # modèle(s) utilisé(s)
              'strategy'     : str,       # explication de la décision
              'top3'         : list,      # top 3 prédictions
            }
        """
        if not self.ready:
            raise RuntimeError("Modèles non chargés — appelez load_models() d'abord")

        thr = threshold or self.threshold

        # Charger et préprocesser l'image
        img_np = self.load_image(image_input)

        # ── Cas 1 : Seulement Modèle B disponible ─────────────────
        if not self.model_a.ready and self.model_b.ready:
            tensor = self.preprocess(img_np, 224)
            result = self.model_b.predict(tensor)
            strategy = "ResNet50 seul (Modèle A indisponible)"
            return self._format_result(result, strategy)

        # ── Cas 2 : Seulement Modèle A disponible ─────────────────
        if self.model_a.ready and not self.model_b.ready:
            tensor   = self.preprocess(img_np, 380)  # EfficientNet-B4 = 380px
            result   = self.model_a.predict(tensor)
            strategy = "MultiModal seul (Modèle B indisponible)"
            return self._format_result(result, strategy)

        # ── Cas 3 : Les deux disponibles → Stratégie complète ─────
        # D'abord Modèle A
        tensor_a = self.preprocess(img_np, 380)
        result_a = self.model_a.predict(tensor_a)

        # Si Modèle A confiant → on le prend
        if result_a and result_a["confidence"] >= thr:
            strategy = (f"Modèle A prioritaire "
                        f"(confiance {result_a['confidence']:.1%} >= seuil {thr:.0%})")
            return self._format_result(result_a, strategy)

        # Modèle A peu confiant → Modèle B en renfort
        tensor_b = self.preprocess(img_np, 224)
        result_b = self.model_b.predict(tensor_b)

        if result_a is None:
            strategy = "Fallback total vers Modèle B (Modèle A échoué)"
            return self._format_result(result_b, strategy)

        # Les deux ont prédit → fusion
        if result_a["class"] in SHARED_CLASSES and result_b["class"] in SHARED_CLASSES:
            merged   = self._merge_probabilities(result_a, result_b)
            strategy = (f"Fusion Ensemble "
                        f"(A confiance {result_a['confidence']:.1%} < seuil {thr:.0%})")
            return self._format_result(merged, strategy)

        # Classe du Modèle A exclusive (ex: Lung_cancer, Normal) → on garde A
        if result_a["class"] not in CLASSES_RESNET:
            strategy = (f"Modèle A retenu (classe exclusive '{result_a['class']}', "
                        f"confiance {result_a['confidence']:.1%})")
            return self._format_result(result_a, strategy)

        # Fallback vers B si plus confiant
        if result_b and result_b["confidence"] > result_a["confidence"]:
            strategy = (f"Fallback Modèle B "
                        f"(B {result_b['confidence']:.1%} > A {result_a['confidence']:.1%})")
            return self._format_result(result_b, strategy)

        # Garder A par défaut
        strategy = f"Modèle A retenu par défaut (confiance {result_a['confidence']:.1%})"
        return self._format_result(result_a, strategy)

    def _format_result(self, result: dict, strategy: str) -> dict:
        """Formate le résultat final pour le frontend."""
        probs = result["probabilities"]
        top3  = sorted(probs.items(), key=lambda x: -x[1])[:3]

        return {
            "prediction"   : result["class"],
            "confidence"   : round(result["confidence"], 4),
            "probabilities": probs,
            "model_used"   : result["model_used"],
            "strategy"     : strategy,
            "top3"         : [{"class": c, "confidence": round(p, 4)} for c, p in top3],
        }


# ═══════════════════════════════════════════════════════════════════
# INSTANCE GLOBALE (singleton)
# ═══════════════════════════════════════════════════════════════════

_predictor: Optional[EnsemblePredictor] = None


def get_predictor() -> EnsemblePredictor:
    """Retourne le predictor singleton (initialise si nécessaire)."""
    global _predictor
    if _predictor is None:
        _predictor = EnsemblePredictor()
        _predictor.load_models()
    return _predictor


# ═══════════════════════════════════════════════════════════════════
# INTÉGRATION FASTAPI
# ═══════════════════════════════════════════════════════════════════
"""
Ajoutez ces routes dans votre fichier FastAPI existant :

from ensemble_predictor import get_predictor

@app.on_event("startup")
async def startup():
    get_predictor()   # charge les modèles au démarrage

@app.get("/api/v1/health")
def health():
    p = get_predictor()
    return {
        "status"      : "ok",
        "num_classes" : len(CLASSES_MULTIMODAL),   # 12
        "model_a"     : p.model_a.ready,
        "model_b"     : p.model_b.ready,
        "threshold"   : p.threshold,
        "classes"     : CLASSES_MULTIMODAL,
    }

@app.post("/api/v1/predict")
async def predict_endpoint(file: UploadFile = File(...), gradcam: bool = False):
    data   = await file.read()
    result = get_predictor().predict(data)
    
    # Grad-CAM (si activé et supporté)
    if gradcam:
        result["gradcam_image"] = generate_gradcam(data)   # votre fonction existante
    
    return result
"""


# ═══════════════════════════════════════════════════════════════════
# TEST RAPIDE (script autonome)
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys

    print("═" * 60)
    print("  ChestAI — Test Ensemble Predictor")
    print("═" * 60)

    predictor = EnsemblePredictor()
    predictor.load_models(
        path_a=MODEL_MULTIMODAL_PATH,
        path_b=MODEL_RESNET_PATH,
    )

    # Test avec image passée en argument
    test_image = sys.argv[1] if len(sys.argv) > 1 else None

    if test_image and os.path.exists(test_image):
        print(f"\n🔬 Test sur : {test_image}")
        result = predictor.predict(test_image)

        print(f"\n  Prédiction  : {result['prediction']}")
        print(f"  Confiance   : {result['confidence']:.1%}")
        print(f"  Modèle      : {result['model_used']}")
        print(f"  Stratégie   : {result['strategy']}")
        print(f"\n  Top 3 :")
        for r in result["top3"]:
            print(f"    {r['class']:25s}  {r['confidence']:.1%}")
    else:
        print("\n⚠️  Aucune image fournie.")
        print("Usage : python ensemble_predictor.py chemin/image.png")
        print("\nModèles attendus dans le dossier courant :")
        for name, path in [("Modèle A", MODEL_MULTIMODAL_PATH),
                           ("Modèle B", MODEL_RESNET_PATH)]:
            exists = "✅" if os.path.exists(path) else "❌ manquant"
            print(f"  {name} : {path}  [{exists}]")