"""
Router FastAPI — Médecins tunisiens
Dashboard Patient — Compatible Brain / Lung / Chest
"""
from fastapi import APIRouter, Query, HTTPException
from pathlib import Path
from typing import Optional
import json

router = APIRouter(prefix="/api/v1", tags=["doctors"])

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "doctors_tunisia.json"

MODEL_TO_SPECIALITES = {
    "brain": ["Neurologue", "Neurochirurgien"],
    "lung" : ["Pneumologue", "Oncologue", "Carcinologue", "Chirurgie carcinologique", "Radiologue"],
    "chest": ["Cardiologue", "Infectiologue", "Radiologue"],
}

PREDICTION_TO_MODEL = {
    "glioma"           : "brain",
    "meningioma"       : "brain",
    "pituitary"        : "brain",
    "notumor"          : None,
    "malignant"        : "lung",
    "benign"           : "lung",
    "normal"           : None,
    "COVID"            : "chest",
    "Lung_Opacity"     : "chest",
    "Viral Pneumonia"  : "chest",
    "Cardiomegaly"     : "chest",
    "Pneumothorax"     : "chest",
    "Pneumonia"        : "chest",
    "Edema"            : "chest",
    "Emphysema"        : "chest",
    "Nodule"           : "lung",
    "Mass"             : "lung",
}


def load_doctors() -> list:
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


@router.get("/doctors")
def get_doctors(
    model     : Optional[str] = Query(None, description="brain | lung | chest"),
    ville     : Optional[str] = Query(None, description="Tunis | Sfax | Ariana ..."),
    specialite: Optional[str] = Query(None, description="Neurologue | Cardiologue ..."),
    prediction: Optional[str] = Query(None, description="glioma | COVID | malignant ..."),
):
    doctors = load_doctors()
    if not doctors:
        raise HTTPException(status_code=503, detail="Base medecins indisponible.")

    if prediction and not model:
        model = PREDICTION_TO_MODEL.get(prediction)

    if model:
        model = model.lower()
        if model not in MODEL_TO_SPECIALITES:
            raise HTTPException(status_code=400, detail=f"Modele invalide: {list(MODEL_TO_SPECIALITES.keys())}")
        target = [s.lower() for s in MODEL_TO_SPECIALITES[model]]
        doctors = [d for d in doctors if any(t in d.get("specialite","").lower() for t in target)]

    if ville:
        doctors = [d for d in doctors if ville.lower() in d.get("ville","").lower()
                   or ville.lower() in d.get("address","").lower()]

    if specialite:
        doctors = [d for d in doctors if specialite.lower() in d.get("specialite","").lower()]

    return {
        "total"              : len(doctors),
        "model"              : model,
        "prediction"         : prediction,
        "ville"              : ville,
        "specialites_ciblees": MODEL_TO_SPECIALITES.get(model, []) if model else [],
        "doctors"            : doctors,
    }


@router.get("/doctors/for-prediction")
def get_doctors_for_prediction(
    prediction: str          = Query(..., description="glioma | COVID | malignant ..."),
    ville     : Optional[str]= Query(None),
    limit     : int          = Query(10, ge=1, le=50),
):
    model = PREDICTION_TO_MODEL.get(prediction)

    if model is None:
        return {
            "total"    : 0,
            "model"    : None,
            "prediction": prediction,
            "message"  : "Aucune pathologie detectee — consultation non necessaire",
            "doctors"  : [],
        }

    doctors = load_doctors()
    target  = [s.lower() for s in MODEL_TO_SPECIALITES.get(model, [])]
    doctors = [d for d in doctors if any(t in d.get("specialite","").lower() for t in target)]

    if ville:
        filtered = [d for d in doctors if ville.lower() in d.get("ville","").lower()]
        if filtered:
            doctors = filtered

    doctors.sort(key=lambda d: (0 if d.get("phones") else 1, d.get("ville", "")))

    return {
        "total"              : len(doctors[:limit]),
        "model"              : model,
        "prediction"         : prediction,
        "ville"              : ville,
        "specialites_ciblees": MODEL_TO_SPECIALITES.get(model, []),
        "message"            : f"Medecins recommandes pour '{prediction}'",
        "doctors"            : doctors[:limit],
    }


@router.get("/doctors/villes")
def get_villes():
    doctors = load_doctors()
    villes  = sorted(set(d["ville"] for d in doctors if d.get("ville")))
    return {"villes": villes, "total": len(villes)}


@router.get("/doctors/specialites")
def get_specialites(model: Optional[str] = Query(None)):
    doctors = load_doctors()
    if model and model in MODEL_TO_SPECIALITES:
        target  = [s.lower() for s in MODEL_TO_SPECIALITES[model]]
        doctors = [d for d in doctors if any(t in d.get("specialite","").lower() for t in target)]
    specs = sorted(set(d["specialite"] for d in doctors if d.get("specialite")))
    return {"specialites": specs, "total": len(specs), "model": model}


@router.get("/doctors/{doctor_id}")
def get_doctor(doctor_id: int):
    doctors = load_doctors()
    for d in doctors:
        if d.get("id") == doctor_id:
            return d
    raise HTTPException(status_code=404, detail=f"Medecin {doctor_id} introuvable")