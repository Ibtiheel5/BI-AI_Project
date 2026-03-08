"""
Modèles Pydantic pour les réponses API
Supporte N classes dynamiquement + Grad-CAM + multi-modèles
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any


class TopKEntry(BaseModel):
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
    gradcam_image: Optional[str] = None
    model:         Optional[str] = None   # 'chest' | 'lung' | 'covid'
    out_of_domain: Optional[bool]  = None  # True si image hors-domaine
    warning:       Optional[str]   = None  # Message d'avertissement lisible
    entropy_ratio: Optional[float] = None  # 0 = certain, 1 = totalement incertain


class HealthResponse(BaseModel):
    """Réponse du health-check (rétrocompatibilité)."""
    status:        str
    message:       str
    model_loaded:  Optional[bool]  = None
    num_classes:   Optional[int]   = None
    class_names:   Optional[List[str]] = None
    device:        Optional[str]   = None


class ModelStatus(BaseModel):
    """Statut d'un modèle individuel."""
    loaded:      bool
    num_classes: int
    class_names: List[str]
    label:       str


class MultiModelHealthResponse(HealthResponse):
    """Réponse étendue du health-check avec tous les modèles."""
    models: Optional[Dict[str, Any]] = None