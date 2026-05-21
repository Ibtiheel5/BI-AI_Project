# backend/main.py — version corrigée CORS + OPTIONS preflight + Exception Handler + Static Files CORS

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, JSONResponse, FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pathlib import Path
from app.api.contact import router as contact_router
from app.api.prescriptions import router as prescriptions_router
from app.api.doctor_reminders import router as doctor_reminders_router


# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="MedAI — Plateforme Télémédecine",
    description="Plateforme intelligente de télémédecine avec IA médicale",
    version="3.0.0",
)

# ── CORS CORRIGÉ ─────────────────────────────────────────────────
# NE PAS utiliser "*" avec allow_credentials=True

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ── Handler manuel pour OPTIONS (preflight) ───────────────────────
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str = ""):
    """Gère explicitement les requêtes OPTIONS preflight CORS."""
    origin = request.headers.get("origin", "*")
    response = Response(status_code=204)
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

# ── Exception handler global avec CORS headers ─────────────────────
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Ajoute les headers CORS même en cas d'erreur HTTP."""
    origin = request.headers.get("origin", "*")
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Ajoute les headers CORS même en cas d'erreur 500."""
    origin = request.headers.get("origin", "*")
    response = JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur", "error": str(exc)}
    )
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# ── Servir les images uploadées avec CORS ──────────────────────────
# Solution: endpoint API pour servir les fichiers avec CORS au lieu de StaticFiles
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)

@app.get("/uploads/{file_path:path}")
async def serve_uploaded_file(file_path: str, request: Request):
    """Sert les fichiers uploadés avec les headers CORS appropriés."""
    file_location = uploads_dir / file_path
    if not file_location.exists():
        raise StarletteHTTPException(status_code=404, detail="Fichier non trouvé")

    # Vérifier que le fichier est dans le répertoire uploads (sécurité)
    try:
        file_location.resolve().relative_to(uploads_dir.resolve())
    except ValueError:
        raise StarletteHTTPException(status_code=403, detail="Accès interdit")

    origin = request.headers.get("origin", "*")
    response = FileResponse(str(file_location))
    response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

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

try:
    from app.api.contact import router as contact_router
    app.include_router(contact_router, prefix="/api/v1")
    print("✅ Contact router loaded")
except Exception as e:
    print(f"❌ Contact router error: {e}")

# ========== AJOUTER LE ROUTER REMINDERS ICI ==========
try:
    from app.api.reminders import router as reminders_router, init_reminders_tables
    app.include_router(reminders_router, prefix="/api/v1")
    print("✅ Reminders router loaded")
except Exception as e:
    print(f"❌ Reminders router error: {e}")
# ===============================================

# ========== AJOUTER LE ROUTER ADMIN ICI ==========
try:
    from app.api.admin import router as admin_router, init_admin_tables
    app.include_router(admin_router, prefix="/api/v1")
    print("✅ Admin router loaded (logs, webhooks, settings)")
except Exception as e:
    print(f"❌ Admin router error: {e}")

try:
    from app.api.reminders import router as reminders_router, init_reminders_tables
    app.include_router(reminders_router, prefix="/api/v1")
    print("✅ Reminders router loaded")
except Exception as e:
    print(f"❌ Reminders router error: {e}")
# ===============================================

# ========== AJOUTER LE ROUTER DOCTOR REMINDERS ICI ==========
try:
    from app.api.doctor_reminders import router as doctor_reminders_router
    app.include_router(doctor_reminders_router, prefix="/api/v1")
    print("✅ Doctor reminders router loaded")
except Exception as e:
    print(f"❌ Doctor reminders router error: {e}")
# ===============================================

# ========== AJOUTER LE ROUTER ADMIN ICI ==========
try:
    from app.api.admin import router as admin_router, init_admin_tables
    app.include_router(admin_router, prefix="/api/v1")
    print("✅ Admin router loaded (logs, webhooks, settings)")
except Exception as e:
    print(f"❌ Admin router error: {e}")    
# ===============================================

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

    try:
        init_admin_tables()
        print("✅ Tables admin (logs, webhooks, settings) OK")
    except Exception as e:
        print(f"⚠️ DB admin échouée: {e}")

    try:
        init_reminders_tables()
        print("✅ Table reminders OK")
    except Exception as e:
        print(f"⚠️ DB reminders échouée: {e}")
    
    try:
        from app.api.consultations import init_prescriptions_table
        init_prescriptions_table()
        print("✅ Table prescriptions initialisée")
    except Exception as e:
        print(f"⚠️ Erreur init prescriptions: {e}")

    # PAS DE ROUTERS ICI — ils sont déjà chargés plus haut !

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(prescriptions_router, prefix="/api/v1")

@app.get("/health")
@app.get("/api/v1/health")
def root_health():
    return {"status": "ok", "message": "MedAI API v3.0 running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/health")
@app.get("/api/v1/health")
def root_health():
    return {"status": "ok", "message": "MedAI API v3.0 running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)