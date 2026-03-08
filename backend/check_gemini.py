"""
Lance ce script dans ton terminal backend pour voir les modèles disponibles :
  python check_gemini.py
"""
import urllib.request, json, os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")
api_key = os.getenv("GEMINI_API_KEY", "")

if not api_key:
    print("❌ GEMINI_API_KEY non trouvée dans .env")
    exit(1)

print(f"🔑 Clé: {api_key[:12]}...")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
try:
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read())
        models = [
            m["name"].replace("models/", "")
            for m in data.get("models", [])
            if "generateContent" in m.get("supportedGenerationMethods", [])
        ]
        print(f"\n✅ {len(models)} modèles disponibles:\n")
        for m in sorted(models):
            print(f"  GEMINI_MODELS = [\"{m}\"]")
except Exception as e:
    print(f"❌ Erreur: {e}")