"""
Route API pour le chatbot de symptômes avec recommandation de médecins
et création automatique de consultation.
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
from app.services.symptom_analyzer import analyze_symptoms, get_available_models
from app.api.auth import get_current_user

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class SymptomRequest(BaseModel):
    text: str
    user_lat: Optional[float] = None
    user_lon: Optional[float] = None


class SymptomResponse(BaseModel):
    type: str
    message: str
    recommendation: Optional[dict] = None
    doctors: List[dict] = []
    model_detected: Optional[str] = None
    confidence: float = 0.0


@router.post("/analyze", response_model=SymptomResponse)
async def analyze_patient_symptoms(request: SymptomRequest):
    """
    Analyse les symptômes décrits par le patient en texte et recommande :
    - Le modèle IA le plus adapté
    - Les médecins enregistrés dans la base de données
    """
    result = analyze_symptoms(
        text=request.text,
        user_lat=request.user_lat,
        user_lon=request.user_lon,
    )
    return result


@router.post("/analyze-with-image")
async def analyze_symptoms_with_image(
    text: str = Form(...),
    user_lat: Optional[float] = Form(None),
    user_lon: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    """
    Analyse les symptômes avec image médicale optionnelle.
    L'image aide à confirmer le modèle IA détecté par le texte.
    """
    image_bytes = None
    if image and image.filename:
        image_bytes = await image.read()

    result = analyze_symptoms(
        text=text,
        user_lat=user_lat,
        user_lon=user_lon,
        image_bytes=image_bytes,
    )
    return result


@router.get("/models")
async def get_models():
    """Retourne les modèles IA disponibles avec leurs descriptions."""
    return {"models": get_available_models()}