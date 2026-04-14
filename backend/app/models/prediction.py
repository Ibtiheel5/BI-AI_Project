"""
Modèles Pydantic pour les réponses API
Supporte N classes dynamiquement + Grad-CAM
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class TopKEntry(BaseModel):
    """Une entrée dans le top-K des prédictions."""
    cls: str   = Field(..., alias="class")
    probability: float

    class Config:
        populate_by_name = True


class PredictionResponse(BaseModel):
    """Réponse complète de prédiction."""
    filename:      str
    prediction:    str
    confidence:    float
    probabilities: Dict[str, float]
    num_classes:   Optional[int]  = None
    top_k:         Optional[List[TopKEntry]] = None
    gradcam_image: Optional[str] = None   # image base64 JPEG avec heatmap


class HealthResponse(BaseModel):
    """Réponse du health-check."""
    status:        str
    message:       str
    model_loaded:  Optional[bool]  = None
    num_classes:   Optional[int]   = None
    class_names:   Optional[List[str]] = None
    device:        Optional[str]   = None