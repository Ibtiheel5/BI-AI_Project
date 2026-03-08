"""
Configuration de l'application — supporte les modèles chest et lung
"""

import os
import torch
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

# app/core/config.py → app/core/ → app/ → backend/
BASE_DIR   = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "saved_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def _resolve_path(env_key: str, default_name: str) -> Path:
    raw = os.getenv(env_key, f"saved_models/{default_name}")
    p   = Path(raw)
    return p if p.is_absolute() else BASE_DIR / p


class Settings(BaseSettings):
    APP_NAME: str = "Chest X-Ray API"
    DEBUG: bool   = os.getenv("DEBUG", "false").lower() == "true"

    # Modèle principal (thorax 10 classes)
    MODEL_PATH: Path = _resolve_path("MODEL_PATH", "final_model_10classes.pth")

    # Modèle cancer pulmonaire
    LUNG_MODEL_PATH: Path = _resolve_path("LUNG_MODEL_PATH", "final_lung_cancer_model.pth")

    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

    MAX_FILE_SIZE: int      = 10 * 1024 * 1024
    ALLOWED_EXTENSIONS: str = ".jpg,.jpeg,.png"

    @property
    def allowed_extensions_set(self):
        return set(self.ALLOWED_EXTENSIONS.split(","))

    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file       = ".env"
        case_sensitive = True
        extra          = "ignore"


settings = Settings()

print(f"📁 BASE_DIR        : {BASE_DIR}")
print(f"📄 MODEL_PATH      : {settings.MODEL_PATH}  (existe: {settings.MODEL_PATH.exists()})")
print(f"📄 LUNG_MODEL_PATH : {settings.LUNG_MODEL_PATH}  (existe: {settings.LUNG_MODEL_PATH.exists()})")
print(f"💻 DEVICE          : {settings.DEVICE}")