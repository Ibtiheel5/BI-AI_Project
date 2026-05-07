# backend/main.py — version corrigée

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="MedAI — Plateforme Télémédecine",
    description="Plateforme intelligente de télémédecine avec IA médicale",
    version="3.0.0",
)

# ── CORS corrigé ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── Servir les images uploadées ────────────────────────────────────
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ────────────────────────────────────────────────────────
try:
    from app.api.auth import router as auth_router, init_db
    app.include_router(auth_router, prefix="/api/v1")
    print("✅ Auth router loaded")
except Exception as e:
    print(f"❌ Auth router error: {e}")

try:
    from app.api.consultations import router as consultations_router, init_consultation_tables
    app.include_router(consultations_router, prefix="/api/v1")
    print("✅ Consultations router loaded")
except Exception as e:
    print(f"❌ Consultations router error: {e}")

try:
    from app.api.routes import router as predict_router
    app.include_router(predict_router, prefix="/api/v1")
    print("✅ Prediction router loaded")
except Exception as e:
    print(f"⚠️ Prediction router error: {e}")

try:
    from app.routers.doctors import router as doctors_router
    app.include_router(doctors_router)
    print("✅ Doctors router loaded")
except Exception as e:
    print(f"⚠️ Doctors router error: {e}")

try:
    from app.api.chatbot import router as chatbot_router
    app.include_router(chatbot_router, prefix="/api/v1")
    print("✅ Chatbot router loaded")
except Exception as e:
    print(f"⚠️ Chatbot router error: {e}")

try:
    from app.api.cim11 import router as cim11_router
    app.include_router(cim11_router, prefix="/api/v1")
    print("✅ CIM11 router loaded")
except Exception as e:
    print(f"⚠️ CIM11 router error: {e}")

print("✅ Router loading complete")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)