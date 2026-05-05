# backend/main.py — version complète télémédecine
from dotenv import load_dotenv
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api import cim11
# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="MedAI — Plateforme Télémédecine",
    description="Plateforme intelligente de télémédecine avec IA médicale",
    version="3.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Servir les images uploadées ────────────────────────────────────
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ────────────────────────────────────────────────────────
from app.api.routes        import router as predict_router
from app.api.auth          import router as auth_router,          init_db
from app.routers.doctors   import router as doctors_router
from app.api.consultations import router as consultations_router, init_consultation_tables

app.include_router(predict_router,       prefix="/api/v1")
app.include_router(auth_router,          prefix="/api/v1")
app.include_router(doctors_router)
app.include_router(consultations_router, prefix="/api/v1")

# ── Startup ────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        init_db()
        print("✅ Table users OK")
    except Exception as e:
        print(f"⚠️  DB users échouée : {e}")
    try:
        init_consultation_tables()
        print("✅ Tables consultations OK")
    except Exception as e:
        print(f"⚠️  DB consultations échouée : {e}")

# ── Health ─────────────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/v1/health")
def root_health():
    return {"status": "ok", "message": "MedAI API v3.0 running"}
app.include_router(cim11.router, prefix="/api/v1") 