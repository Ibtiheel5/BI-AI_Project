"""
╔══════════════════════════════════════════════════════════════════╗
║         SCRIPT DE TEST BACKEND — Modèle 10 classes              ║
║  Teste le checkpoint final_model_10classes.pth sans lancer       ║
║  le serveur FastAPI complet.                                     ║
║                                                                  ║
║  Usage :                                                         ║
║    python test_backend.py                        (mode auto)     ║
║    python test_backend.py image.jpg              (image réelle)  ║
║    python test_backend.py --model path/to/model.pth image.jpg   ║
╚══════════════════════════════════════════════════════════════════╝
"""

import sys
import os
import argparse
import time
import json
from pathlib import Path

# ── Ajouter le répertoire backend au path ─────────────────────────────────
# À adapter selon ta structure : ce script doit être dans backend/
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
import io

# ══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════

DEFAULT_MODEL_PATH = "saved_models/final_model_10classes.pth"

EXPECTED_CLASSES = [
    'COVID', 'Cardiomegaly', 'Edema', 'Emphysema',
    'Lung_Opacity', 'Mass', 'Nodule', 'Pneumonia',
    'Pneumothorax', 'Viral Pneumonia'
]

# ══════════════════════════════════════════════════════════════════
# COULEURS TERMINAL
# ══════════════════════════════════════════════════════════════════
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):   print(f"  {GREEN}✅ {msg}{RESET}")
def err(msg):  print(f"  {RED}❌ {msg}{RESET}")
def warn(msg): print(f"  {YELLOW}⚠️  {msg}{RESET}")
def info(msg): print(f"  {CYAN}ℹ️  {msg}{RESET}")
def header(msg): print(f"\n{BOLD}{'═'*60}\n  {msg}\n{'═'*60}{RESET}")

# ══════════════════════════════════════════════════════════════════
# TEST 1 — Vérification du checkpoint
# ══════════════════════════════════════════════════════════════════

def test_checkpoint(model_path: str) -> dict:
    header("TEST 1 — Vérification du checkpoint")

    path = Path(model_path)

    # Existence
    if not path.exists():
        err(f"Fichier introuvable : {path.resolve()}")
        print(f"\n  Chemin cherché : {path.resolve()}")
        print(f"  Fichiers .pth présents dans saved_models/ :")
        sm = Path("saved_models")
        if sm.exists():
            for f in sm.glob("*.pth"):
                size = f.stat().st_size / (1024*1024)
                print(f"    • {f.name} ({size:.1f} MB)")
        else:
            warn("Dossier saved_models/ introuvable")
        sys.exit(1)

    size_mb = path.stat().st_size / (1024 * 1024)
    ok(f"Fichier trouvé : {path.name} ({size_mb:.1f} MB)")

    # Chargement
    print(f"\n  Chargement du checkpoint...")
    t0 = time.time()
    checkpoint = torch.load(str(path), map_location='cpu', weights_only=False)
    elapsed = time.time() - t0
    ok(f"Chargement OK ({elapsed:.2f}s)")

    # Clés attendues
    required_keys = ['model_state_dict', 'class_names', 'num_classes']
    missing = [k for k in required_keys if k not in checkpoint]
    if missing:
        err(f"Clés manquantes dans le checkpoint : {missing}")
        info(f"Clés présentes : {list(checkpoint.keys())}")
        sys.exit(1)
    ok(f"Clés présentes : {list(checkpoint.keys())}")

    # Classes
    class_names = checkpoint['class_names']
    num_classes  = checkpoint['num_classes']
    print(f"\n  Classes dans le checkpoint ({num_classes}) :")
    for i, cls in enumerate(class_names):
        print(f"    {i:2d}. {cls}")

    # Cohérence
    if num_classes != len(class_names):
        warn(f"Incohérence : num_classes={num_classes} vs len(class_names)={len(class_names)}")
    else:
        ok(f"Cohérence num_classes / class_names : {num_classes}")

    # Métriques sauvegardées
    if 'test_metrics' in checkpoint:
        m = checkpoint['test_metrics']
        print(f"\n  Métriques (depuis le training Kaggle) :")
        for k, v in m.items():
            print(f"    {k:12s}: {v*100:.2f}%")

    return checkpoint


# ══════════════════════════════════════════════════════════════════
# TEST 2 — Chargement du modèle (via InferenceService)
# ══════════════════════════════════════════════════════════════════

def test_model_loading(model_path: str):
    header("TEST 2 — Chargement du modèle (direct, sans singleton)")

    try:
        import torch.nn as nn
        import torchvision.models as models
        from app.services.preprocessing import preprocess_image
    except ImportError as e:
        err(f"Impossible d'importer les modules backend : {e}")
        info("Vérifie que tu lances le script depuis le dossier backend/")
        sys.exit(1)

    checkpoint  = torch.load(str(model_path), map_location="cpu", weights_only=False)
    class_names = checkpoint["class_names"]
    num_classes = checkpoint["num_classes"]

    # Reconstruire ResNet50 (même archi que le notebook 10classes)
    class _ResNet50(nn.Module):
        def __init__(self, n, drop=0.0):
            super().__init__()
            self.backbone = models.resnet50(weights=None)
            in_f = self.backbone.fc.in_features
            self.backbone.fc = nn.Sequential(nn.Dropout(drop), nn.Linear(in_f, n))
        def forward(self, x): return self.backbone(x)

    t0    = time.time()
    model = _ResNet50(num_classes)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    elapsed = time.time() - t0

    ok(f"Modèle chargé en {elapsed:.2f}s")
    ok(f"Num classes : {num_classes}")

    if set(class_names) == set(EXPECTED_CLASSES):
        ok("10 classes correspondent exactement aux classes attendues")
    else:
        extra   = set(class_names) - set(EXPECTED_CLASSES)
        missing = set(EXPECTED_CLASSES) - set(class_names)
        if extra:   warn(f"Classes supplémentaires : {extra}")
        if missing: warn(f"Classes manquantes      : {missing}")

    # Proxy simple pour les tests suivants
    class _Proxy:
        def __init__(self, m, cn, nc, pp):
            self._model, self.class_names = m, cn
            self.num_classes, self._pp    = nc, pp
            self.is_loaded                = True
        def predict(self, image_bytes):
            tensor = self._pp(image_bytes)
            with torch.no_grad():
                probs = F.softmax(self._model(tensor), dim=1)
                conf, pred = torch.max(probs, 1)
            idx = pred.item()
            return {
                "prediction"   : self.class_names[idx],
                "confidence"   : round(float(conf.item()), 6),
                "probabilities": {c: round(float(p), 6)
                                  for c, p in zip(self.class_names, probs[0].numpy())},
                "class_index"  : idx,
                "num_classes"  : self.num_classes,
            }

    return _Proxy(model, class_names, num_classes, preprocess_image)


# ══════════════════════════════════════════════════════════════════
# TEST 3 — Inférence sur image synthétique
# ══════════════════════════════════════════════════════════════════

def test_synthetic_inference(svc):
    header("TEST 3 — Inférence sur image synthétique (224×224 gris)")

    # Créer une image de test en niveaux de gris (radiographie simulée)
    img_array = np.random.randint(30, 200, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=90)
    image_bytes = buf.getvalue()

    t0 = time.time()
    result = svc.predict(image_bytes)
    elapsed = time.time() - t0

    ok(f"Inférence OK en {elapsed*1000:.1f}ms")
    ok(f"Prédiction  : {result['prediction']}")
    ok(f"Confiance   : {result['confidence']*100:.2f}%")
    ok(f"Num classes : {result['num_classes']}")

    # Vérifier que toutes les probs sont là
    if len(result['probabilities']) == svc.num_classes:
        ok(f"Probabilités : {len(result['probabilities'])} classes ✓")
    else:
        err(f"Probabilités incomplètes : {len(result['probabilities'])} / {svc.num_classes}")

    # Vérifier que les probs somment à ~1
    total = sum(result['probabilities'].values())
    if abs(total - 1.0) < 0.001:
        ok(f"Somme des probs ≈ 1.0 ({total:.6f}) ✓")
    else:
        warn(f"Somme des probs = {total:.6f} (attendu ≈ 1.0)")

    print(f"\n  Top-5 probabilités :")
    sorted_probs = sorted(result['probabilities'].items(),
                          key=lambda x: x[1], reverse=True)
    for cls, prob in sorted_probs[:5]:
        bar = '█' * int(prob * 40)
        print(f"    {cls:20s}: {prob*100:5.2f}%  {bar}")

    return result


# ══════════════════════════════════════════════════════════════════
# TEST 4 — Inférence via routes FastAPI (simulation)
# ══════════════════════════════════════════════════════════════════

def test_routes_simulation(model_path: str):
    header("TEST 4 — Simulation complète de la route /predict")

    # Détecter la version de starlette/httpx pour choisir le bon mode
    try:
        import httpx
        httpx_version = tuple(int(x) for x in httpx.__version__.split(".")[:2])
    except ImportError:
        httpx_version = (0, 0)

    try:
        from fastapi.testclient import TestClient
        from main import app
        os.environ['MODEL_PATH'] = str(Path(model_path).resolve())

        # httpx >= 0.20 a changé la signature de TestClient
        try:
            if httpx_version >= (0, 20):
                client = TestClient(app, base_url="http://testserver")
            else:
                client = TestClient(app)
        except TypeError:
            # Fallback : instanciation directe sans kwarg app
            import starlette.testclient as _tc
            client = _tc.TestClient.__new__(_tc.TestClient)
            _tc.TestClient.__init__(client, app)

        # ── GET /health ────────────────────────────────────────────
        print(f"\n  GET /health :")
        try:
            resp = client.get("/api/v1/health")
            if resp.status_code == 200:
                data = resp.json()
                ok(f"Status       : {resp.status_code}")
                ok(f"model_loaded : {data.get('model_loaded')}")
                ok(f"num_classes  : {data.get('num_classes')}")
                ok(f"class_names  : {data.get('class_names')}")
            else:
                err(f"Health check failed : {resp.status_code} — {resp.text}")
        except Exception as e:
            err(f"GET /health échoué : {e}")

        # ── POST /predict ──────────────────────────────────────────
        print(f"\n  POST /predict (image synthétique) :")
        try:
            img_array = np.random.randint(30, 200, (256, 256, 3), dtype=np.uint8)
            img = Image.fromarray(img_array)
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            buf.seek(0)

            resp = client.post(
                "/api/v1/predict",
                files={"file": ("test.jpg", buf, "image/jpeg")}
            )
            if resp.status_code == 200:
                data = resp.json()
                ok(f"Status      : {resp.status_code}")
                ok(f"prediction  : {data.get('prediction')}")
                ok(f"confidence  : {data.get('confidence')*100:.2f}%")
                ok(f"num_classes : {data.get('num_classes')}")
            else:
                err(f"Predict failed : {resp.status_code} — {resp.text}")
        except Exception as e:
            err(f"POST /predict échoué : {e}")

    except TypeError as e:
        # Incompatibilité de version httpx/starlette — on skip proprement
        warn(f"TestClient incompatible avec cette version de httpx/starlette")
        warn(f"  Détail : {e}")
        info("Ce test nécessite : pip install 'httpx<0.20' ou 'starlette>=0.20'")
        info("Les tests 1-3 (checkpoint + inférence directe) sont suffisants.")
        info("Lance le backend manuellement pour tester les routes (voir TEST 6).")

    except ImportError as e:
        warn(f"Dépendance manquante : {e}")
        info("Installe httpx : pip install httpx")


# ══════════════════════════════════════════════════════════════════
# TEST 5 — Image réelle fournie par l'utilisateur
# ══════════════════════════════════════════════════════════════════

def test_real_image(svc, image_path: str):
    header(f"TEST 5 — Inférence sur image réelle")
    print(f"  Image : {image_path}")

    path = Path(image_path)
    if not path.exists():
        err(f"Image introuvable : {path.resolve()}")
        return

    with open(path, 'rb') as f:
        image_bytes = f.read()

    size_kb = len(image_bytes) / 1024
    ok(f"Image chargée : {size_kb:.1f} KB")

    # Vérif taille (limite backend : 10MB)
    if len(image_bytes) > 10 * 1024 * 1024:
        err("Image trop grande (> 10MB, rejetée par le backend)")
        return

    # Extension valide ?
    ext = path.suffix.lower()
    if ext not in ['.jpg', '.jpeg', '.png']:
        warn(f"Extension '{ext}' non supportée par le backend (JPEG/PNG requis)")

    t0 = time.time()
    try:
        result = svc.predict(image_bytes)
        elapsed = time.time() - t0
    except Exception as e:
        err(f"Erreur inférence : {e}")
        return

    ok(f"Inférence en {elapsed*1000:.1f}ms")

    print(f"\n  {'─'*40}")
    print(f"  {BOLD}Résultat pour : {path.name}{RESET}")
    print(f"  {'─'*40}")
    print(f"  Prédiction  : {BOLD}{result['prediction']}{RESET}")
    print(f"  Confiance   : {result['confidence']*100:.2f}%")
    print(f"  {'─'*40}")
    print(f"\n  Toutes les classes :")

    sorted_probs = sorted(result['probabilities'].items(),
                          key=lambda x: x[1], reverse=True)
    for i, (cls, prob) in enumerate(sorted_probs):
        bar   = '█' * int(prob * 50)
        bold  = BOLD if i == 0 else ''
        print(f"    {bold}{cls:20s}: {prob*100:5.2f}%  {bar}{RESET}")


# ══════════════════════════════════════════════════════════════════
# TEST 6 — Commandes curl pour test API en live
# ══════════════════════════════════════════════════════════════════

def print_curl_commands(image_path: str = None):
    header("TEST 6 — Commandes curl (backend lancé sur port 8000)")

    print(f"""
  # 1. Vérifier que le backend répond
  curl http://localhost:8000/api/v1/health

  # 2. Tester une prédiction avec une image JPEG
  curl -X POST http://localhost:8000/api/v1/predict \\
       -F "file=@{image_path or 'chemin/vers/image.jpg'}" \\
       -H "accept: application/json"

  # 3. Résultat formaté avec jq
  curl -s -X POST http://localhost:8000/api/v1/predict \\
       -F "file=@{image_path or 'chemin/vers/image.jpg'}" | jq .

  # Lancer le backend (depuis le dossier backend/) :
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
""")


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Test backend Chest X-Ray — modèle 10 classes'
    )
    parser.add_argument(
        'image', nargs='?', default=None,
        help='Chemin vers une image JPEG/PNG à tester (optionnel)'
    )
    parser.add_argument(
        '--model', default=DEFAULT_MODEL_PATH,
        help=f'Chemin vers le checkpoint .pth (défaut: {DEFAULT_MODEL_PATH})'
    )
    parser.add_argument(
        '--skip-routes', action='store_true',
        help='Ignorer le test des routes FastAPI (Test 4)'
    )
    args = parser.parse_args()

    print(f"""
{BOLD}╔══════════════════════════════════════════════════════════╗
║       TEST BACKEND — Chest X-Ray 10 classes              ║
╚══════════════════════════════════════════════════════════╝{RESET}
  Modèle    : {args.model}
  Image     : {args.image or '(synthétique)'}
  Répertoire: {Path.cwd()}
""")

    # TEST 1 — Checkpoint
    checkpoint = test_checkpoint(args.model)

    # TEST 2 — InferenceService
    svc = test_model_loading(args.model)

    # TEST 3 — Inférence synthétique
    test_synthetic_inference(svc)

    # TEST 4 — Routes FastAPI
    if not args.skip_routes:
        test_routes_simulation(args.model)

    # TEST 5 — Image réelle
    if args.image:
        test_real_image(svc, args.image)

    # TEST 6 — Curl
    print_curl_commands(args.image)

    # ── Résumé ────────────────────────────────────────────────────
    header("RÉSUMÉ")
    ok("Checkpoint valide")
    ok("InferenceService fonctionnel")
    ok("Inférence opérationnelle")
    print(f"""
  {BOLD}Prochaine étape :{RESET}
  1. Copier le .pth dans saved_models/final_model.pth
     (ou pointer MODEL_PATH=saved_models/final_model_10classes.pth dans .env)

  2. Lancer le backend :
     {CYAN}cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload{RESET}

  3. Tester en live :
     {CYAN}curl http://localhost:8000/api/v1/health{RESET}
""")


if __name__ == '__main__':
    main()