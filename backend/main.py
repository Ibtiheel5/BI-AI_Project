# backend/main.py — version corrigée

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api.chatbot import router as chatbot_router

# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="MedAI — Plateforme Télémédecine",
    description="Plateforme intelligente de télémédecine avec IA médicale",
    version="3.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autoriser toutes les origines pour le développement
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Servir les images uploadées ────────────────────────────────────
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

# Vérifier que le dossier existe avant de le monter
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ────────────────────────────────────────────────────────
try:
    from app.api.routes import router as predict_router
    from app.api.auth import router as auth_router, init_db
    from app.routers.doctors import router as doctors_router
    from app.api.consultations import router as consultations_router, init_consultation_tables

    app.include_router(predict_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(doctors_router)
    app.include_router(consultations_router, prefix="/api/v1")
    app.include_router(chatbot_router, prefix="/api/v1")
    
    print("✅ Tous les routeurs chargés avec succès")
except Exception as e:
    print(f"⚠️ Erreur chargement routeurs: {e}")
    # Route de fallback
    @app.get("/api/v1/health")
    def fallback_health():
        return {"status": "degraded", "error": str(e)}

# ── Startup ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    print("🚀 Démarrage de MedAI...")
    try:
        init_db()
        print("✅ Table users OK")
    except Exception as e:
        print(f"⚠️ DB users échouée: {e}")
    
    try:
        init_consultation_tables()
        print("✅ Tables consultations OK")
    except Exception as e:
        print(f"⚠️ DB consultations échouée: {e}")

# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/v1/health")
def root_health():
    return {"status": "ok", "message": "MedAI API v3.0 running"}

# Pour démarrer directement
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)