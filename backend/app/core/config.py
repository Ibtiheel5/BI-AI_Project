"""
Configuration de l'application — supporte N classes dynamiquement
Fix : BASE_DIR corrigé (2 niveaux au lieu de 3) + MODEL_PATH absolu
"""

import os
import torch
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Charger .env depuis le dossier backend/ (là où uvicorn est lancé)
load_dotenv()

# app/core/config.py
#  └── app/core/          ← parent
#      └── app/           ← parent.parent
#          └── backend/   ← parent.parent.parent  ✅ c'est ici le bon BASE_DIR
BASE_DIR   = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "saved_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def _resolve_model_path() -> Path:
    """
    Résout MODEL_PATH en chemin absolu.
    - Si la valeur dans .env est relative → résout depuis BASE_DIR (backend/)
    - Si elle est déjà absolue → utilisée telle quelle
    """
    raw = os.getenv("MODEL_PATH", "saved_models/final_model_10classes.pth")
    p   = Path(raw)
    if not p.is_absolute():
        p = BASE_DIR / p
    return p


class Settings(BaseSettings):
    """Configuration principale de l'API."""

    # ── App ───────────────────────────────────────────────────────
    APP_NAME: str = "Chest X-Ray API"
    DEBUG: bool   = os.getenv("DEBUG", "false").lower() == "true"

    # ── Modèle ────────────────────────────────────────────────────
    # Toujours un chemin absolu grâce à _resolve_model_path()
    MODEL_PATH: Path = _resolve_model_path()
    DEVICE: str      = "cuda" if torch.cuda.is_available() else "cpu"

    # ── Upload ────────────────────────────────────────────────────
    MAX_FILE_SIZE: int      = 10 * 1024 * 1024   # 10 MB
    ALLOWED_EXTENSIONS: str = ".jpg,.jpeg,.png"

    @property
    def allowed_extensions_set(self):
        return set(self.ALLOWED_EXTENSIONS.split(","))

    # ── CORS ──────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["*"]

    # ── Pydantic ──────────────────────────────────────────────────
    class Config:
        env_file       = ".env"
        case_sensitive = True
        extra          = "ignore"   # ignore les variables inconnues du .env


settings = Settings()

# Debug au démarrage — visible dans les logs uvicorn
print(f"📁 BASE_DIR    : {BASE_DIR}")
print(f"📁 MODELS_DIR  : {MODELS_DIR}")
print(f"📄 MODEL_PATH  : {settings.MODEL_PATH}")
print(f"   Existe      : {settings.MODEL_PATH.exists()}")
print(f"💻 DEVICE      : {settings.DEVICE}")