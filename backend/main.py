from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes

app = FastAPI(
    title="Chest X-Ray API",
    description="API pour classification et segmentation de radiographies thoraciques",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production: spécifier les domaines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(routes.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Chest X-Ray API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}