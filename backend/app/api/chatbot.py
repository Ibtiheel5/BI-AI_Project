"""
Route API pour le chatbot de symptômes avec recommandation de médecins
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.symptom_analyzer import analyze_symptoms, get_available_models

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class SymptomRequest(BaseModel):
    text: str
    user_lat: Optional[float] = None
    user_lon: Optional[float] = None


class DoctorResponse(BaseModel):
    id: int
    name: str
    specialite: str
    ville: str
    address: str
    phones: List[str]
    distance_km: Optional[float] = None
    source: str


class SymptomResponse(BaseModel):
    type: str
    message: str
    recommendation: Optional[dict] = None
    doctors: List[dict] = []


@router.post("/analyze", response_model=SymptomResponse)
async def analyze_patient_symptoms(request: SymptomRequest):
    """
    Analyse les symptômes décrits par le patient et recommande :
    - Une spécialité médicale adaptée
    - Les médecins disponibles dans la base de données
    """
    result = analyze_symptoms(
        text=request.text,
        user_lat=request.user_lat,
        user_lon=request.user_lon,
    )
    return result


@router.get("/models")
async def get_models():
    """Retourne les modèles IA disponibles."""
    return {"models": get_available_models()}