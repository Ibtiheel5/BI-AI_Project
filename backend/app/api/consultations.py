# app/api/consultations.py
# Gestion complète des demandes de consultation
# Flux : pending → accepted → analyzed → closed

import os
import json
import shutil
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from fastapi.responses import FileResponse
import pg8000
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from app.services.report_generator import generate_report_pdf
import io
from app.api.auth import get_current_user, require_admin

# ── Config ─────────────────────────────────────────────────────────
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB",   "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

UPLOADS_DIR = Path("uploads/consultations")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/consultations", tags=["consultations"])

VALID_STATUSES = {"pending", "accepted", "analyzed", "closed", "rejected"}
VALID_URGENCY  = {"normal", "urgent", "critical"}
VALID_MODELS   = {"chest", "lung", "brain", "retina"}


def normalize_role(role: str) -> str:
    """Normalise le rôle pour comparaison insensible à la casse."""
    if not role:
        return ""
    role = role.strip().lower()
    # Mapping des variantes
    role_map = {
        "patient": "Patient",
        "medecin": "Medecin",
        "administrateur": "Administrateur",
        "admin": "Administrateur",
        "doctor": "Medecin",
        "dr": "Medecin",
        "user": "Patient",
    }
    return role_map.get(role, role.capitalize())

# ── DB helpers ──────────────────────────────────────────────────────
def get_db():
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = False
    return conn

def row_to_dict(columns, row) -> dict:
    return dict(zip(columns, row))

def fetch_one(query: str, params: tuple = ()):
    conn = get_db(); cur = conn.cursor()
    cur.execute(query, params)
    columns = [d[0] for d in cur.description] if cur.description else []
    row = cur.fetchone()
    cur.close(); conn.close()
    return row_to_dict(columns, row) if row else None

def fetch_all(query: str, params: tuple = ()) -> list:
    conn = get_db(); cur = conn.cursor()
    cur.execute(query, params)
    columns = [d[0] for d in cur.description] if cur.description else []
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [row_to_dict(columns, r) for r in rows]

def execute(query: str, params: tuple = (), returning=False):
    conn = get_db(); cur = conn.cursor()
    cur.execute(query, params)
    result = cur.fetchone() if returning else None
    conn.commit(); cur.close(); conn.close()
    return result

# ── Init tables ─────────────────────────────────────────────────────
def init_consultation_tables():
    conn = get_db()
    cur = conn.cursor()

    # Table consultations
    cur.execute("""
        CREATE TABLE IF NOT EXISTS consultations (
            id              SERIAL PRIMARY KEY,
            patient_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            doctor_id       INT REFERENCES users(id) ON DELETE SET NULL,
            model_key       VARCHAR(20) NOT NULL,
            image_path      TEXT,
            status          VARCHAR(20) NOT NULL DEFAULT 'pending',
            urgency         VARCHAR(20) DEFAULT 'normal',
            patient_notes   TEXT DEFAULT '',
            doctor_notes    TEXT DEFAULT '',
            created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    # Table analyses
    cur.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id               SERIAL PRIMARY KEY,
            consultation_id  INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
            prediction       VARCHAR(100),
            confidence       FLOAT,
            probabilities    TEXT DEFAULT '{}',
            gradcam_b64      TEXT,
            explain_text     TEXT DEFAULT '',
            out_of_domain    BOOLEAN DEFAULT FALSE,
            warning          TEXT DEFAULT '',
            created_at       TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    # Table appointments
    cur.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id               SERIAL PRIMARY KEY,
            consultation_id  INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
            doctor_id        INT NOT NULL REFERENCES users(id),
            patient_id       INT NOT NULL REFERENCES users(id),
            type             VARCHAR(20) NOT NULL DEFAULT 'video',
            scheduled_at     TIMESTAMP,
            duration_minutes INT DEFAULT 30,
            video_link       TEXT DEFAULT '',
            location         TEXT DEFAULT '',
            status           VARCHAR(20) DEFAULT 'pending',
            notes            TEXT DEFAULT '',
            created_at       TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    # Table messages
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id               SERIAL PRIMARY KEY,
            consultation_id  INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
            sender_id        INT NOT NULL REFERENCES users(id),
            content          TEXT NOT NULL,
            msg_type         VARCHAR(20) DEFAULT 'text',
            created_at       TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    # Table dossiers (AVEC toutes les colonnes)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dossiers (
            id                    SERIAL PRIMARY KEY,
            patient_id            INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            antecedents           TEXT DEFAULT '[]',
            allergies             TEXT DEFAULT '[]',
            traitements           TEXT DEFAULT '[]',
            blood_group           VARCHAR(5) DEFAULT '',
            birth_date            DATE,
            emergency_contact_name  TEXT DEFAULT '',
            emergency_contact_phone TEXT DEFAULT '',
            taille                VARCHAR(10) DEFAULT '',
            poids                 VARCHAR(10) DEFAULT '',
            imc                   VARCHAR(10) DEFAULT '',
            created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(patient_id)
        )
    """)

    # Table notifications
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id          SERIAL PRIMARY KEY,
            user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type        VARCHAR(50) NOT NULL,
            title       TEXT NOT NULL,
            message     TEXT NOT NULL,
            data        TEXT DEFAULT '{}',
            is_read     BOOLEAN DEFAULT FALSE,
            created_at  TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    # Table transfers
    cur.execute("""
        CREATE TABLE IF NOT EXISTS transfers (
            id               SERIAL PRIMARY KEY,
            consultation_id  INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
            from_doctor_id   INT NOT NULL REFERENCES users(id),
            to_doctor_id     INT NOT NULL REFERENCES users(id),
            reason           TEXT DEFAULT '',
            status           VARCHAR(20) DEFAULT 'pending',
            created_at       TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    # Table message_attachments
    cur.execute("""
        CREATE TABLE IF NOT EXISTS message_attachments (
            id SERIAL PRIMARY KEY,
            message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            content_type TEXT DEFAULT 'application/octet-stream',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ [Consultations] Tables créées avec succès")

# ── Helper notifications ────────────────────────────────────────────
def create_notification(user_id: int, ntype: str, title: str, message: str, data: dict = {}):
    try:
        execute(
            "INSERT INTO notifications (user_id, type, title, message, data) VALUES (%s,%s,%s,%s,%s)",
            (user_id, ntype, title, message, json.dumps(data))
        )
    except Exception as e:
        print(f"⚠️ Notification échouée : {e}")


# ── Modèles Pydantic ────────────────────────────────────────────────
def build_fallback_explain(prediction: str, confidence: float, probabilities: dict, model_key: str, warning: str = "") -> str:
    """Explication clinique locale si Gemini est indisponible ou trop court."""
    try:
        confidence_pct = float(confidence) * 100
    except Exception:
        confidence_pct = 0.0

    model_labels = {
        "chest": "radiographie thoracique",
        "lung": "scanner CT pulmonaire",
        "brain": "IRM cerebrale",
        "retina": "retinographie du fond d'oeil",
    }
    model_label = model_labels.get(model_key, "image medicale")

    if isinstance(probabilities, str):
        try:
            probabilities = json.loads(probabilities)
        except Exception:
            probabilities = {}
    if not isinstance(probabilities, dict):
        probabilities = {}

    sorted_probs = []
    for label, value in probabilities.items():
        try:
            sorted_probs.append((str(label), float(value)))
        except Exception:
            continue
    sorted_probs.sort(key=lambda item: item[1], reverse=True)
    differential = ", ".join(f"{label} ({value * 100:.1f}%)" for label, value in sorted_probs[1:4]) or "non disponible"

    confidence_note = "elevee" if confidence_pct >= 80 else "intermediaire" if confidence_pct >= 55 else "faible"
    warning_text = f"\n\nAttention particuliere : {warning}" if warning else ""

    return (
        "## Signes observes sur cette image\n"
        f"L'analyse IA de cette {model_label} retient principalement la classe {prediction}. "
        "Les regions mises en avant par la carte Grad-CAM doivent etre confrontees visuellement "
        "a l'image originale afin de verifier leur concordance anatomique.\n\n"
        "## Correlation signes visuels / decision du modele\n"
        f"Le score de confiance est de {confidence_pct:.1f}%, ce qui correspond a une confiance {confidence_note}. "
        f"Les principales hypotheses differentielles du modele sont : {differential}. "
        "Une marge faible entre les classes doit faire privilegier la prudence diagnostique.\n\n"
        "## Conduite clinique basee sur cette image\n"
        "Cette prediction doit etre interpretee comme une aide a la decision. "
        "Elle doit etre integree aux symptomes, antecedents, constantes, biologie et examens anterieurs du patient. "
        "Une validation par le medecin responsable reste indispensable avant toute decision therapeutique.\n\n"
        "## Limites de cette analyse\n"
        "Le modele peut se tromper en cas d'image de mauvaise qualite, de cadrage incomplet, "
        "d'artefact, de pathologie rare ou de discordance entre l'image fournie et le modele choisi."
        f"{warning_text}"
    )


def explain_is_too_short(text: str) -> bool:
    clean = (text or "").strip()
    return len(clean.split()) < 45 or clean.lower() in {"ok", "normal", "aucune anomalie"}


class ConsultationCreate(BaseModel):
    model_key:     str
    patient_notes: str = ""

class ConsultationUpdate(BaseModel):
    doctor_notes: str = ""
    urgency:      str = "normal"

class AppointmentCreate(BaseModel):
    consultation_id:  int
    type:             str = "video"
    scheduled_at:     str
    duration_minutes: int = 30
    video_link:       str = ""
    location:         str = ""
    notes:            str = ""

class AppointmentSchedule(BaseModel):
    scheduled_at: str
    notes: Optional[str] = None
    type: str = "video"
    status: str = "pending"

class MessageCreate(BaseModel):
    content:  str
    msg_type: str = "text"

class TransferCreate(BaseModel):
    to_doctor_id: int
    reason:       str = ""


# ══════════════════════════════════════════════════════════════════
# ROUTES CONSULTATIONS
# ══════════════════════════════════════════════════════════════════

# ── Patient : créer via chatbot (nouveau flux) ─────────────────────
@router.post("/from-chatbot", status_code=201)
async def create_consultation_from_chatbot(
    model_key:     str        = Form(...),
    doctor_id:     int        = Form(...),
    patient_notes: str        = Form(""),
    symptoms:      str        = Form(""),
    file:          UploadFile = File(...),
    current_user: dict        = Depends(get_current_user),
):
    """
    Crée une consultation depuis le chatbot symptômes.
    Le modèle IA est déterminé automatiquement par l'analyseur.
    Le patient choisit un médecin parmi les recommandations.
    L'image médicale est fournie par le patient.
    """
    if normalize_role(current_user.get("role", "")) not in ("Patient", "Administrateur"):
        raise HTTPException(403, "Accès réservé aux patients.")
    if model_key not in VALID_MODELS:
        raise HTTPException(400, f"Modèle invalide. Valeurs: {VALID_MODELS}")

    # Vérifier que le médecin choisi existe, est approuvé et a le bon domaine
    doctor = fetch_one(
        "SELECT id, full_name, domains, specialty FROM users WHERE id = %s AND role = 'Medecin' AND status = 'approved'",
        (doctor_id,)
    )
    if not doctor:
        raise HTTPException(404, "Médecin introuvable ou non disponible.")

    # Vérifier que le médecin couvre ce domaine
    doc_domains = doctor.get("domains", [])
    if isinstance(doc_domains, str):
        try:
            doc_domains = json.loads(doc_domains)
        except Exception:
            doc_domains = []
    if model_key not in doc_domains:
        raise HTTPException(400, f"Ce médecin ne couvre pas le domaine '{model_key}'.")

    # Sauvegarder l'image
    ext      = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename = f"consult_{current_user['id']}_{int(datetime.now().timestamp())}{ext}"
    dest     = UPLOADS_DIR / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Construire les notes patient (symptômes + notes libres)
    full_notes = symptoms
    if patient_notes:
        full_notes = f"{symptoms}\n\nNotes complémentaires : {patient_notes}" if symptoms else patient_notes

    # Insérer en DB avec le médecin déjà assigné et statut 'pending'
    row = execute(
        """INSERT INTO consultations
               (patient_id, doctor_id, model_key, image_path, patient_notes, status)
           VALUES (%s, %s, %s, %s, %s, 'pending') RETURNING id""",
        (current_user["id"], doctor_id, model_key, str(dest), full_notes),
        returning=True
    )
    consult_id = row[0]

    # Notifier UNIQUEMENT le médecin choisi
    create_notification(
        doctor_id, "new_consultation",
        "Nouvelle demande de consultation",
        f"{current_user['full_name']} vous a choisi pour une analyse "
        f"({model_key.upper()}). Ref #{consult_id}",
        {"consultation_id": consult_id}
    )

    return {
        "message":         f"Demande envoyée au Dr. {doctor['full_name']}.",
        "consultation_id": consult_id,
        "doctor_name":     doctor["full_name"],
        "doctor_specialty": doctor.get("specialty", ""),
        "status":          "pending",
    }


# ── Patient : créer une demande (ancien flux conservé) ────────────
@router.post("", status_code=201)
async def create_consultation(
    model_key:     str        = Form(...),
    patient_notes: str        = Form(""),
    file:          UploadFile = File(...),
    current_user: dict        = Depends(get_current_user),
):
    """
    Crée une consultation (flux direct avec image déjà disponible).
    Notifie uniquement les médecins du bon domaine — sans choix de médecin.
    Conservé pour compatibilité ascendante.
    """
    if normalize_role(current_user.get("role", "")) not in ("Patient", "Medecin", "Administrateur"):
        raise HTTPException(403, "Accès refusé.")
    if model_key not in VALID_MODELS:
        raise HTTPException(400, f"Modèle invalide. Valeurs: {VALID_MODELS}")

    # Sauvegarder l'image
    ext       = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename  = f"consult_{current_user['id']}_{int(datetime.now().timestamp())}{ext}"
    dest      = UPLOADS_DIR / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Insérer en DB
    row = execute(
        """INSERT INTO consultations (patient_id, model_key, image_path, patient_notes, status)
           VALUES (%s,%s,%s,%s,'pending') RETURNING id""",
        (current_user["id"], model_key, str(dest), patient_notes),
        returning=True
    )
    consult_id = row[0]

    # Notifier les médecins du bon domaine
    doctors = fetch_all(
        "SELECT id FROM users WHERE role='Medecin' AND status='approved' AND domains LIKE %s",
        (f'%"{model_key}"%',)
    )
    for doc in doctors:
        create_notification(
            doc["id"], "new_consultation",
            "Nouvelle demande de consultation",
            f"Un patient a soumis une demande d'analyse ({model_key.upper()}). Ref #{consult_id}",
            {"consultation_id": consult_id}
        )

    return {
        "message":         "Demande envoyée. En attente d'un médecin disponible.",
        "consultation_id": consult_id,
        "status":          "pending",
    }


# ── Patient : mes consultations ────────────────────────────────────
@router.get("/my")
async def get_my_consultations(
    status: Optional[str] = Query(None),
    current_user: dict    = Depends(get_current_user),
):
    if normalize_role(current_user.get("role", "")) not in ("Patient", "Administrateur"):
        raise HTTPException(403, "Réservé aux patients.")
    
    if status:
        rows = fetch_all(
            """SELECT c.*, u.full_name as doctor_name, u.specialty as doctor_specialty,
                      a.prediction, a.confidence, a.probabilities, a.gradcam_b64,
                      a.explain_text, a.out_of_domain, a.warning
               FROM consultations c
               LEFT JOIN users u ON c.doctor_id = u.id
               LEFT JOIN analyses a ON a.consultation_id = c.id
               WHERE c.patient_id = %s AND c.status = %s
               ORDER BY c.created_at DESC""",
            (current_user["id"], status)
        )
    else:
        rows = fetch_all(
            """SELECT c.*, u.full_name as doctor_name, u.specialty as doctor_specialty,
                      a.prediction, a.confidence, a.probabilities, a.gradcam_b64,
                      a.explain_text, a.out_of_domain, a.warning
               FROM consultations c
               LEFT JOIN users u ON c.doctor_id = u.id
               LEFT JOIN analyses a ON a.consultation_id = c.id
               WHERE c.patient_id = %s
               ORDER BY c.created_at DESC""",
            (current_user["id"],)
        )
    return {"consultations": rows, "total": len(rows)}


# ── Médecin : file d'attente ────────────────────────────────────────
@router.get("/queue")
async def get_doctor_queue(
    current_user: dict = Depends(get_current_user),
):
    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    domains = current_user.get("domains", [])
    if isinstance(domains, str):
        try:
            domains = json.loads(domains)
        except:
            domains = []

    if not domains:
        return {"consultations": [], "total": 0}

    placeholders = ",".join(["%s"] * len(domains))
    rows = fetch_all(
        f"""SELECT c.*, u.full_name as patient_name
            FROM consultations c
            JOIN users u ON c.patient_id = u.id
            WHERE c.status = 'pending' AND c.model_key IN ({placeholders})
            ORDER BY c.created_at ASC""",
        tuple(domains)
    )
    return {"consultations": rows, "total": len(rows)}


# ── Médecin : mes consultations assignées ──────────────────────────
# ── Médecin : mes consultations assignées ──────────────────────────
@router.get("/assigned")
async def get_assigned_consultations(
    status: Optional[str] = Query(None),
    current_user: dict    = Depends(get_current_user),
):
    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    if status:
        rows = fetch_all(
            """SELECT c.*, u.full_name as patient_name,
                      a.id as appointment_id, a.scheduled_at, a.type as appointment_type, 
                      a.notes as appointment_notes, a.status as appointment_status
               FROM consultations c
               JOIN users u ON c.patient_id = u.id
               LEFT JOIN appointments a ON a.consultation_id = c.id
               WHERE c.doctor_id = %s AND c.status = %s
               ORDER BY c.updated_at DESC""",
            (current_user["id"], status)
        )
    else:
        rows = fetch_all(
            """SELECT c.*, u.full_name as patient_name,
                      a.id as appointment_id, a.scheduled_at, a.type as appointment_type, 
                      a.notes as appointment_notes, a.status as appointment_status
               FROM consultations c
               JOIN users u ON c.patient_id = u.id
               LEFT JOIN appointments a ON a.consultation_id = c.id
               WHERE c.doctor_id = %s AND c.status != 'pending'
               ORDER BY c.updated_at DESC""",
            (current_user["id"],)
        )
    return {"consultations": rows, "total": len(rows)}

# ── Servir les fichiers de consultation ────────────────────────────
@router.get("/files/{filename}")
async def get_consultation_file(
    filename: str,
    current_user: dict = Depends(get_current_user),
):
    """Servir un fichier image de consultation (originale)"""
    # Sécurité: extraire seulement le nom de fichier
    safe_filename = Path(filename).name
    file_path = UPLOADS_DIR / safe_filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Fichier introuvable: {safe_filename}")

    # Vérifier les droits d'accès
    consultation = fetch_one(
        "SELECT patient_id, doctor_id FROM consultations WHERE image_path LIKE %s",
        (f"%{safe_filename}%",)
    )

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation introuvable")

    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)

    if consultation["patient_id"] != uid and consultation["doctor_id"] != uid and not is_admin:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    content_type = "image/jpeg"
    if safe_filename.lower().endswith(".png"):
        content_type = "image/png"
    elif safe_filename.lower().endswith(".webp"):
        content_type = "image/webp"

    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type=content_type
    )


# ── Détail d'une consultation ──────────────────────────────────────
@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
):
    row = fetch_one(
        """SELECT c.*,
                  p.full_name as patient_name, p.username as patient_username,
                  d.full_name as doctor_name,  d.specialty as doctor_specialty
           FROM consultations c
           JOIN users p ON c.patient_id = p.id
           LEFT JOIN users d ON c.doctor_id = d.id
           WHERE c.id = %s""",
        (consultation_id,)
    )
    if not row:
        raise HTTPException(404, "Consultation introuvable.")

    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    is_patient_owner = row["patient_id"] == uid
    is_assigned_doctor = row["doctor_id"] == uid

    is_doctor_with_domain = False
    if normalize_role(current_user.get("role", "")) in ("Medecin", "Administrateur"):
        domains = current_user.get("domains", [])
        if isinstance(domains, str):
            try:
                domains = json.loads(domains)
            except Exception:
                domains = []
        if row.get("model_key") in domains:
            is_doctor_with_domain = True

    if not is_admin and not is_patient_owner and not is_assigned_doctor and not is_doctor_with_domain:
        raise HTTPException(403, "Accès refusé.")

    analysis = fetch_one(
        "SELECT * FROM analyses WHERE consultation_id = %s ORDER BY created_at DESC LIMIT 1",
        (consultation_id,)
    )

    messages = fetch_all(
        """SELECT m.*, u.full_name as sender_name, u.role as sender_role
           FROM messages m JOIN users u ON m.sender_id = u.id
           WHERE m.consultation_id = %s ORDER BY m.created_at ASC""",
        (consultation_id,)
    )

    appointment = fetch_one(
        "SELECT * FROM appointments WHERE consultation_id = %s ORDER BY created_at DESC LIMIT 1",
        (consultation_id,)
    )

    return {
        "consultation": row,
        "analysis":     analysis,
        "messages":     messages,
        "appointment":  appointment,
    }


# ── Médecin : accepter une consultation ────────────────────────────
@router.post("/{consultation_id}/accept")
async def accept_consultation(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
):
    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "pending":
        raise HTTPException(400, f"Statut actuel : {row['status']}. Ne peut être acceptée.")

    execute(
        "UPDATE consultations SET status='accepted', doctor_id=%s, updated_at=NOW() WHERE id=%s",
        (current_user["id"], consultation_id)
    )

    create_notification(
        row["patient_id"], "consultation_accepted",
        "Demande acceptée !",
        f"Dr. {current_user['full_name']} a accepté votre demande. L'analyse IA va démarrer.",
        {"consultation_id": consultation_id}
    )

    return {
        "message": "Consultation acceptée. L'analyse IA peut maintenant être lancée.",
        "status":  "accepted",
    }


# ── Médecin : rejeter une consultation ─────────────────────────────
@router.post("/{consultation_id}/reject")
async def reject_consultation(
    consultation_id: int,
    reason: str = Form(""),
    current_user: dict = Depends(get_current_user),
):
    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "pending":
        raise HTTPException(400, "Seulement les consultations en attente peuvent être rejetées.")

    execute(
        "UPDATE consultations SET status='rejected', doctor_notes=%s, updated_at=NOW() WHERE id=%s",
        (reason, consultation_id)
    )

    create_notification(
        row["patient_id"], "consultation_rejected",
        "Demande non disponible",
        "Votre demande a été rejetée. Veuillez en soumettre une nouvelle.",
        {"consultation_id": consultation_id}
    )

    return {"message": "Consultation rejetée.", "status": "rejected"}


# ── Rendez-vous (Appointments) ─────────────────────────────────────

@router.post("/{consultation_id}/appointment")
async def create_appointment_for_consultation(
    consultation_id: int,
    appointment_data: AppointmentSchedule,
    current_user: dict = Depends(get_current_user),
):
    """Créer un rendez-vous pour une consultation"""
    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Seul un médecin peut créer un rendez-vous.")

    consultation = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not consultation:
        raise HTTPException(404, "Consultation introuvable")

    if consultation["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut créer un rendez-vous")

    if consultation["status"] in ("closed", "rejected"):
        raise HTTPException(400, "La consultation est terminée, impossible de créer un rendez-vous")

    existing = fetch_one("SELECT id FROM appointments WHERE consultation_id = %s", (consultation_id,))
    if existing:
        raise HTTPException(400, "Un rendez-vous existe déjà pour cette consultation")

    try:
        scheduled_dt = datetime.fromisoformat(appointment_data.scheduled_at.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(400, "Format de date invalide. Utilisez ISO 8601")

    execute(
        """INSERT INTO appointments 
           (consultation_id, doctor_id, patient_id, type, scheduled_at, notes, status)
           VALUES (%s, %s, %s, %s, %s, %s, 'pending')""",
        (
            consultation_id,
            current_user["id"],
            consultation["patient_id"],
            appointment_data.type,
            scheduled_dt,
            appointment_data.notes or "",
        )
    )

    create_notification(
        consultation["patient_id"],
        "appointment_scheduled",
        "Nouveau rendez-vous planifié",
        f"Dr. {current_user['full_name']} a planifié un rendez-vous pour le {scheduled_dt.strftime('%d/%m/%Y à %H:%M')}",
        {"consultation_id": consultation_id, "type": appointment_data.type}
    )

    return {"message": "Rendez-vous créé avec succès", "scheduled_at": scheduled_dt.isoformat()}


@router.get("/{consultation_id}/appointment")
async def get_appointment_for_consultation(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Récupérer le rendez-vous d'une consultation"""
    consultation = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not consultation:
        raise HTTPException(404, "Consultation introuvable")

    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    if consultation["patient_id"] != uid and consultation["doctor_id"] != uid and not is_admin:
        raise HTTPException(403, "Accès non autorisé")

    appointment = fetch_one(
        "SELECT * FROM appointments WHERE consultation_id = %s ORDER BY created_at DESC LIMIT 1",
        (consultation_id,)
    )

    if not appointment:
        return {"appointment": None}

    doctor = fetch_one("SELECT full_name FROM users WHERE id = %s", (appointment["doctor_id"],))
    patient = fetch_one("SELECT full_name FROM users WHERE id = %s", (appointment["patient_id"],))

    return {
        "appointment": {
            "id": appointment["id"],
            "consultation_id": appointment["consultation_id"],
            "doctor_id": appointment["doctor_id"],
            "patient_id": appointment["patient_id"],
            "doctor_name": doctor["full_name"] if doctor else None,
            "patient_name": patient["full_name"] if patient else None,
            "scheduled_at": appointment["scheduled_at"].isoformat() if appointment["scheduled_at"] else None,
            "notes": appointment["notes"],
            "type": appointment["type"],
            "status": appointment["status"],
        }
    }


@router.get("/appointments/my")
async def get_my_appointments(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
):
    """Récupérer tous les rendez-vous du médecin ou patient connecté"""
    uid = current_user["id"]

    query = """
        SELECT a.*, 
               d.full_name as doctor_name,
               p.full_name as patient_name,
               c.model_key,
               c.status as consultation_status
        FROM appointments a
        JOIN consultations c ON a.consultation_id = c.id
        LEFT JOIN users d ON a.doctor_id = d.id
        LEFT JOIN users p ON a.patient_id = p.id
        WHERE (a.doctor_id = %s OR a.patient_id = %s)
    """
    params = [uid, uid]

    if status:
        query += " AND a.status = %s"
        params.append(status)

    query += " ORDER BY a.scheduled_at ASC"

    appointments = fetch_all(query, tuple(params))

    for apt in appointments:
        if apt.get("scheduled_at"):
            apt["scheduled_at"] = apt["scheduled_at"].isoformat() if hasattr(apt["scheduled_at"], 'isoformat') else str(apt["scheduled_at"])

    return {"appointments": appointments}


@router.get("/appointments")
async def get_all_appointments(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
):
    """Alias pour /appointments/my - récupérer les rendez-vous"""
    return await get_my_appointments(current_user, status)


@router.put("/appointments/{appointment_id}/accept")
async def accept_appointment(
    appointment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Le patient accepte le rendez-vous"""
    appointment = fetch_one("SELECT * FROM appointments WHERE id = %s", (appointment_id,))
    if not appointment:
        raise HTTPException(404, "Rendez-vous introuvable")
    
    if appointment["patient_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Non autorisé")
    
    if appointment["status"] != "pending":
        raise HTTPException(400, "Ce rendez-vous ne peut pas être accepté")
    
    execute("UPDATE appointments SET status = 'accepted' WHERE id = %s", (appointment_id,))
    
    create_notification(
        appointment["doctor_id"],
        "appointment_accepted",
        "Rendez-vous accepté",
        f"Le patient a accepté le rendez-vous",
        {"appointment_id": appointment_id, "consultation_id": appointment["consultation_id"]}
    )
    
    return {"message": "Rendez-vous accepté", "status": "accepted"}


@router.put("/appointments/{appointment_id}/reject")
async def reject_appointment(
    appointment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Le patient refuse le rendez-vous"""
    appointment = fetch_one("SELECT * FROM appointments WHERE id = %s", (appointment_id,))
    if not appointment:
        raise HTTPException(404, "Rendez-vous introuvable")
    
    if appointment["patient_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Non autorisé")
    
    if appointment["status"] != "pending":
        raise HTTPException(400, "Ce rendez-vous ne peut pas être refusé")
    
    execute("UPDATE appointments SET status = 'rejected' WHERE id = %s", (appointment_id,))
    
    create_notification(
        appointment["doctor_id"],
        "appointment_rejected",
        "Rendez-vous refusé",
        f"Le patient a refusé le rendez-vous",
        {"appointment_id": appointment_id, "consultation_id": appointment["consultation_id"]}
    )
    
    return {"message": "Rendez-vous refusé", "status": "rejected"}


@router.put("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Annuler un rendez-vous (médecin ou patient)"""
    appointment = fetch_one("SELECT * FROM appointments WHERE id = %s", (appointment_id,))
    if not appointment:
        raise HTTPException(404, "Rendez-vous introuvable")

    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    if appointment["doctor_id"] != uid and appointment["patient_id"] != uid and not is_admin:
        raise HTTPException(403, "Non autorisé")

    if appointment["status"] == "cancelled":
        raise HTTPException(400, "Le rendez-vous est déjà annulé")

    execute("UPDATE appointments SET status = 'cancelled' WHERE id = %s", (appointment_id,))

    other_id = appointment["patient_id"] if uid == appointment["doctor_id"] else appointment["doctor_id"]
    create_notification(
        other_id,
        "appointment_cancelled",
        "Rendez-vous annulé",
        f"Votre rendez-vous a été annulé",
        {"appointment_id": appointment_id, "consultation_id": appointment["consultation_id"]}
    )

    return {"message": "Rendez-vous annulé"}
# Ajouter à la fin du fichier, après les autres endpoints

@router.get("/appointments/pending/check-expired")
async def check_expired_appointments(
    current_user: dict = Depends(require_admin),
):
    """Vérifier et annuler les rendez-vous en attente depuis plus de 20 minutes"""
    # Récupérer tous les rendez-vous en attente
    pending = fetch_all(
        "SELECT * FROM appointments WHERE status = 'pending'"
    )
    
    expired_count = 0
    for apt in pending:
        created_at = apt.get("created_at")
        if created_at:
            # Vérifier si plus de 20 minutes (20 * 60 = 1200 secondes)
            if (datetime.now() - created_at).total_seconds() > 1200:
                execute(
                    "UPDATE appointments SET status = 'cancelled' WHERE id = %s",
                    (apt["id"],)
                )
                expired_count += 1
                # Notifier le médecin
                create_notification(
                    apt["doctor_id"],
                    "appointment_expired",
                    "Rendez-vous expiré",
                    f"Le patient n'a pas accepté le rendez-vous dans les 20 minutes",
                    {"appointment_id": apt["id"], "consultation_id": apt["consultation_id"]}
                )
    
    return {"expired_count": expired_count}

# ── Enregistrer le résultat IA (après inference) ───────────────────
@router.post("/{consultation_id}/analysis")
async def save_analysis(
    consultation_id: int,
    prediction:    str   = Form(...),
    confidence:    float = Form(...),
    probabilities: str   = Form("{}"),
    explain_text:  str   = Form(""),
    gradcam_b64:   str   = Form(""),
    out_of_domain: bool  = Form(False),
    warning:       str   = Form(""),
    current_user: dict   = Depends(get_current_user),
):
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "accepted":
        raise HTTPException(400, "La consultation doit être acceptée avant l'analyse.")

    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut lancer l'analyse.")

    urgency = "normal"
    urgent_preds = {"glioma", "malignant", "COVID", "Pneumonia", "Pneumothorax", "Edema", "Mass", "Viral Pneumonia"}
    medium_preds = {"meningioma", "Cardiomegaly", "Emphysema", "Nodule", "Lung_Opacity", "pituitary"}
    if prediction in urgent_preds:
        urgency = "critical"
    elif prediction in medium_preds:
        urgency = "urgent"

    execute(
        """INSERT INTO analyses
           (consultation_id, prediction, confidence, probabilities, gradcam_b64, explain_text, out_of_domain, warning)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (consultation_id, prediction, confidence, probabilities, gradcam_b64, explain_text, out_of_domain, warning)
    )

    execute(
        "UPDATE consultations SET status='analyzed', urgency=%s, updated_at=NOW() WHERE id=%s",
        (urgency, consultation_id)
    )

    create_notification(
        row["patient_id"], "analysis_ready",
        "Résultat IA disponible",
        f"Votre analyse est prête. Diagnostic : {prediction} ({confidence*100:.1f}% confiance).",
        {"consultation_id": consultation_id, "prediction": prediction, "urgency": urgency}
    )

    return {
        "message": "Analyse sauvegardée et visible par le patient.",
        "urgency": urgency,
        "status":  "analyzed",
    }


# ── Fermer une consultation ────────────────────────────────────────
@router.post("/{consultation_id}/close")
async def close_consultation(
    consultation_id: int,
    doctor_notes: str = Form(""),
    current_user: dict = Depends(get_current_user),
):
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut clôturer.")

    execute(
        "UPDATE consultations SET status='closed', doctor_notes=%s, updated_at=NOW() WHERE id=%s",
        (doctor_notes, consultation_id)
    )

    create_notification(
        row["patient_id"], "consultation_closed",
        "Consultation terminée",
        "Votre consultation a été clôturée. Consultez votre dossier médical.",
        {"consultation_id": consultation_id}
    )

    return {"message": "Consultation clôturée.", "status": "closed"}


# ── Messages / Chat ────────────────────────────────────────────────
@router.post("/{consultation_id}/messages", status_code=201)
async def send_message(
    consultation_id: int,
    content: str = Form(""),
    msg_type: str = Form("text"),
    files: List[UploadFile] = File(default=[]),
    current_user: dict = Depends(get_current_user),
):
    """Envoyer un message avec pièces jointes optionnelles"""
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")

    uid = current_user["id"]
    if row["patient_id"] != uid and row["doctor_id"] != uid and not current_user.get("is_admin"):
        raise HTTPException(403, "Accès refusé.")
    if row["status"] not in ("accepted", "analyzed"):
        raise HTTPException(400, "Les messages ne sont disponibles qu'après acceptation.")

    content = content.strip()
    if not content and not files:
        raise HTTPException(400, "Message vide.")

    # Sauvegarder les fichiers
    attachments = []
    for file in files:
        if file.filename:
            ext = Path(file.filename).suffix or ".bin"
            filename = f"msg_{uid}_{int(datetime.now().timestamp())}_{len(attachments)}{ext}"
            dest = UPLOADS_DIR / "messages" / filename
            dest.parent.mkdir(parents=True, exist_ok=True)
            
            with open(dest, "wb") as f:
                shutil.copyfileobj(file.file, f)
            
            attachments.append({
                "filename": file.filename,
                "stored_path": str(dest),
                "content_type": file.content_type or "application/octet-stream"
            })

    # Insérer le message
    execute(
        "INSERT INTO messages (consultation_id, sender_id, content, msg_type) VALUES (%s,%s,%s,%s)",
        (consultation_id, uid, content, msg_type)
    )

    # Récupérer l'ID du message
    msg = fetch_one(
        "SELECT id FROM messages WHERE consultation_id = %s AND sender_id = %s ORDER BY created_at DESC LIMIT 1",
        (consultation_id, uid)
    )
    
    # Sauvegarder les attachments en DB si table existe
    if attachments and msg:
        try:
            execute("""
                CREATE TABLE IF NOT EXISTS message_attachments (
                    id SERIAL PRIMARY KEY,
                    message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                    filename TEXT NOT NULL,
                    stored_path TEXT NOT NULL,
                    content_type TEXT DEFAULT 'application/octet-stream',
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            for att in attachments:
                execute(
                    "INSERT INTO message_attachments (message_id, filename, stored_path, content_type) VALUES (%s,%s,%s,%s)",
                    (msg["id"], att["filename"], att["stored_path"], att["content_type"])
                )
        except Exception as e:
            print(f"⚠️ Erreur sauvegarde attachments: {e}")

    # Notification
    other_id = row["doctor_id"] if uid == row["patient_id"] else row["patient_id"]
    if other_id:
        create_notification(
            other_id, "new_message",
            f"Nouveau message de {current_user['full_name']}",
            content[:80] + ("…" if len(content) > 80 else ""),
            {"consultation_id": consultation_id}
        )

    return {"message": "Message envoyé.", "attachments_count": len(attachments)}


@router.get("/{consultation_id}/messages")
async def get_messages(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
):
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")

    uid = current_user["id"]
    if row["patient_id"] != uid and row["doctor_id"] != uid and not current_user.get("is_admin"):
        raise HTTPException(403, "Accès refusé.")

    messages = fetch_all(
        """SELECT m.*, u.full_name as sender_name, u.role as sender_role
           FROM messages m JOIN users u ON m.sender_id = u.id
           WHERE m.consultation_id = %s ORDER BY m.created_at ASC""",
        (consultation_id,)
    )
    
    # Ajouter les pièces jointes à chaque message
    for msg in messages:
        msg_id = msg.get("id")
        if msg_id:
            try:
                attachments = fetch_all(
                    """SELECT id, filename, content_type, stored_path
                       FROM message_attachments 
                       WHERE message_id = %s""",
                    (msg_id,)
                )
                # Construire les URLs publiques
                for att in attachments:
                    stored = att.get("stored_path", "")
                    filename = stored.split("/")[-1] if "/" in stored else stored
                    att["file_url"] = f"/uploads/consultations/messages/{filename}"
                    att["url"] = att["file_url"]
                
                msg["attachments"] = attachments
            except Exception as e:
                print(f"⚠️ Erreur chargement attachments: {e}")
                msg["attachments"] = []
        else:
            msg["attachments"] = []
    
    return {"messages": messages}





# ══════════════════════════════════════════════════════════════════
# ROUTES MESSAGERIE — Conversations & Messages
# ══════════════════════════════════════════════════════════════════

@router.get("/messages/conversations")
async def get_conversations(
    current_user: dict = Depends(get_current_user),
):
    """
    Retourne la liste des conversations pour l'utilisateur connecté.
    Une conversation = une consultation avec au moins un message.
    """
    uid = current_user["id"]
    role = current_user.get("role", "")

    if role == "Patient":
        # Le patient voit ses consultations avec messages
        rows = fetch_all(
            """SELECT DISTINCT c.id, c.patient_id, c.doctor_id, c.model_key, c.status,
                      c.created_at, c.updated_at,
                      p.full_name as patient_name, p.username as patient_username,
                      d.full_name as doctor_name, d.specialty as doctor_specialty
               FROM consultations c
               JOIN users p ON c.patient_id = p.id
               LEFT JOIN users d ON c.doctor_id = d.id
               WHERE c.patient_id = %s
                 AND c.status IN ('accepted', 'analyzed', 'closed')
               ORDER BY c.updated_at DESC""",
            (uid,)
        )
    elif role in ("Medecin", "Administrateur"):
        # Le médecin voit les consultations qui lui sont assignées ou en attente dans son domaine
        domains = current_user.get("domains", [])
        if isinstance(domains, str):
            try:
                domains = json.loads(domains)
            except:
                domains = []

        if current_user.get("is_admin"):
            # Admin voit tout
            rows = fetch_all(
                """SELECT DISTINCT c.id, c.patient_id, c.doctor_id, c.model_key, c.status,
                          c.created_at, c.updated_at,
                          p.full_name as patient_name, p.username as patient_username,
                          d.full_name as doctor_name, d.specialty as doctor_specialty
                   FROM consultations c
                   JOIN users p ON c.patient_id = p.id
                   LEFT JOIN users d ON c.doctor_id = d.id
                   WHERE c.status IN ('accepted', 'analyzed', 'closed')
                   ORDER BY c.updated_at DESC"""
            )
        else:
            # Médecin : consultations assignées OU en attente dans son domaine
            placeholders = ",".join(["%s"] * len(domains)) if domains else "''"
            rows = fetch_all(
                f"""SELECT DISTINCT c.id, c.patient_id, c.doctor_id, c.model_key, c.status,
                          c.created_at, c.updated_at,
                          p.full_name as patient_name, p.username as patient_username,
                          d.full_name as doctor_name, d.specialty as doctor_specialty
                   FROM consultations c
                   JOIN users p ON c.patient_id = p.id
                   LEFT JOIN users d ON c.doctor_id = d.id
                   WHERE (c.doctor_id = %s OR (c.status = 'pending' AND c.model_key IN ({placeholders})))
                     AND c.status IN ('pending', 'accepted', 'analyzed', 'closed')
                   ORDER BY 
                     CASE c.status WHEN 'pending' THEN 0 ELSE 1 END,
                     c.updated_at DESC""",
                (uid, *domains) if domains else (uid,)
            )
    else:
        rows = []

    # Construire les objets conversation
    conversations = []
    for row in rows:
        # Récupérer le dernier message
        last_msg = fetch_one(
            """SELECT m.*, u.full_name as sender_name, u.role as sender_role
               FROM messages m JOIN users u ON m.sender_id = u.id
               WHERE m.consultation_id = %s
               ORDER BY m.created_at DESC LIMIT 1""",
            (row["id"],)
        )

        # Compter les messages non lus
        unread = fetch_one(
            """SELECT COUNT(*) as count FROM messages
               WHERE consultation_id = %s AND sender_id != %s
               AND id NOT IN (
                   SELECT message_id FROM message_reads WHERE user_id = %s
               )""",
            (row["id"], uid, uid)
        )

        # Déterminer les participants
        participants = []
        if row.get("patient_id"):
            participants.append({
                "id": row["patient_id"],
                "full_name": row.get("patient_name", "Patient"),
                "name": row.get("patient_name", "Patient"),
                "role": "Patient"
            })
        if row.get("doctor_id"):
            participants.append({
                "id": row["doctor_id"],
                "full_name": row.get("doctor_name", "Médecin"),
                "name": row.get("doctor_name", "Médecin"),
                "role": "Medecin",
                "specialty": row.get("doctor_specialty", "")
            })

        conversations.append({
            "id": row["id"],
            "consultation_id": row["id"],
            "participants": participants,
            "status": row["status"],
            "model_key": row["model_key"],
            "last_message": {
                "content": last_msg["content"] if last_msg else "Cliquez pour commencer la discussion",
                "created_at": str(last_msg["created_at"]) if last_msg else str(row["updated_at"]),
                "sender_name": last_msg["sender_name"] if last_msg else None,
            } if last_msg else None,
            "unread_count": unread["count"] if unread else 0,
            "updated_at": str(row["updated_at"]),
        })

    return {"conversations": conversations, "total": len(conversations)}


@router.put("/{consultation_id}/messages/read")
async def mark_messages_read(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
):
    """
    Marque tous les messages d'une consultation comme lus pour l'utilisateur connecté.
    """
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")

    uid = current_user["id"]
    if row["patient_id"] != uid and row["doctor_id"] != uid and not current_user.get("is_admin"):
        raise HTTPException(403, "Accès refusé.")

    # Créer la table message_reads si elle n'existe pas
    execute("""
        CREATE TABLE IF NOT EXISTS message_reads (
            id SERIAL PRIMARY KEY,
            message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            read_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(message_id, user_id)
        )
    """)

    # Marquer tous les messages comme lus
    execute("""
        INSERT INTO message_reads (message_id, user_id)
        SELECT m.id, %s FROM messages m
        WHERE m.consultation_id = %s AND m.sender_id != %s
        ON CONFLICT (message_id, user_id) DO NOTHING
    """, (uid, consultation_id, uid))

    return {"message": "Messages marqués comme lus."}


@router.get("/my-patient")
async def get_my_consultations_patient(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Alias pour /consultations/my — retourne les consultations du patient connecté.
    """
    if normalize_role(current_user.get("role", "")) not in ("Patient", "Administrateur"):
        raise HTTPException(403, "Réservé aux patients.")

    if status:
        rows = fetch_all(
            """SELECT c.*, u.full_name as doctor_name, u.specialty as doctor_specialty,
                      a.prediction, a.confidence, a.probabilities, a.gradcam_b64,
                      a.explain_text, a.out_of_domain, a.warning
               FROM consultations c
               LEFT JOIN users u ON c.doctor_id = u.id
               LEFT JOIN analyses a ON a.consultation_id = c.id
               WHERE c.patient_id = %s AND c.status = %s
               ORDER BY c.created_at DESC""",
            (current_user["id"], status)
        )
    else:
        rows = fetch_all(
            """SELECT c.*, u.full_name as doctor_name, u.specialty as doctor_specialty,
                      a.prediction, a.confidence, a.probabilities, a.gradcam_b64,
                      a.explain_text, a.out_of_domain, a.warning
               FROM consultations c
               LEFT JOIN users u ON c.doctor_id = u.id
               LEFT JOIN analyses a ON a.consultation_id = c.id
               WHERE c.patient_id = %s
               ORDER BY c.created_at DESC""",
            (current_user["id"],)
        )
    return {"consultations": rows, "total": len(rows)}


# ── Transfert de dossier ───────────────────────────────────────────
@router.post("/{consultation_id}/transfer")
async def transfer_consultation(
    consultation_id: int,
    body: TransferCreate,
    current_user: dict = Depends(get_current_user),
):
    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Seul un médecin peut transférer un dossier.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut transférer.")

    target = fetch_one("SELECT * FROM users WHERE id=%s AND role='Medecin' AND status='approved'", (body.to_doctor_id,))
    if not target:
        raise HTTPException(404, "Médecin destinataire introuvable.")

    execute(
        "INSERT INTO transfers (consultation_id, from_doctor_id, to_doctor_id, reason) VALUES (%s,%s,%s,%s)",
        (consultation_id, current_user["id"], body.to_doctor_id, body.reason)
    )

    execute(
        "UPDATE consultations SET doctor_id=%s, updated_at=NOW() WHERE id=%s",
        (body.to_doctor_id, consultation_id)
    )

    create_notification(
        body.to_doctor_id, "consultation_transferred",
        "Dossier transféré",
        f"Dr. {current_user['full_name']} vous a transféré un dossier. Motif : {body.reason or 'Non précisé'}",
        {"consultation_id": consultation_id}
    )

    create_notification(
        row["patient_id"], "doctor_changed",
        "Votre médecin a changé",
        f"Votre dossier a été transféré à Dr. {target['full_name']} ({target['specialty']}).",
        {"consultation_id": consultation_id}
    )

    return {
        "message": f"Dossier transféré à Dr. {target['full_name']}.",
        "new_doctor": target["full_name"],
    }


# ── Lancer l'analyse IA côté serveur ───────────────────────────────
@router.post("/{consultation_id}/run-analysis")
async def run_analysis_server_side(
    consultation_id: int,
    gradcam: bool = Query(True),
    current_user: dict = Depends(get_current_user),
):
    import asyncio
    import base64
    from fastapi.responses import StreamingResponse

    if normalize_role(current_user.get("role", "")) not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "accepted":
        raise HTTPException(400, f"Statut actuel : {row['status']}. La consultation doit être acceptée.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut lancer l'analyse.")

    image_path = Path(row["image_path"])
    if not image_path.exists():
        raise HTTPException(404, f"Image introuvable sur le serveur : {image_path}")

    image_bytes = image_path.read_bytes()
    model_key   = row["model_key"]

    async def event_stream():
        import json as _json

        try:
            from app.services.inference import run_inference
            result = run_inference(image_bytes, with_gradcam=gradcam, model_key=model_key)
        except Exception as e:
            yield f"data: {_json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        yield f"data: {_json.dumps({'type': 'prediction', 'prediction': result['prediction'], 'confidence': result['confidence'], 'probabilities': result['probabilities'], 'gradcam_image': result.get('gradcam_image'), 'out_of_domain': result.get('out_of_domain', False), 'warning': result.get('warning', '')})}\n\n"
        await asyncio.sleep(0)

        if result.get("out_of_domain"):
            yield 'data: {"type":"done"}\n\n'
            return

        full_explain = ""
        try:
            from app.api.routes import stream_gemini_fused, _cache_key
            ck = _cache_key(image_bytes, model_key)
            async for chunk_json in stream_gemini_fused(
                result["prediction"], result["confidence"],
                result["probabilities"], model_key,
                image_bytes=image_bytes, cache_key=ck
            ):
                yield f"data: {chunk_json}\n\n"
                await asyncio.sleep(0)
                try:
                    parsed = _json.loads(chunk_json)
                    if parsed.get("type") == "explain_chunk":
                        full_explain += parsed.get("text", "")
                except Exception:
                    pass
        except Exception as e:
            yield f"data: {_json.dumps({'type': 'explain_error', 'error': str(e)})}\n\n"

        if explain_is_too_short(full_explain):
            fallback_explain = build_fallback_explain(
                result["prediction"],
                result["confidence"],
                result["probabilities"],
                model_key,
                result.get("warning", ""),
            )
            if full_explain.strip():
                full_explain = full_explain.strip() + "\n\n" + fallback_explain
                event_data = {
                    'type': 'explain_chunk',
                    'text': "\n\n" + fallback_explain,
                    'fallback': True
                }
                yield f"data: {_json.dumps(event_data)}\n\n"
            else:
                full_explain = fallback_explain
                event_data = {
                    'type': 'explain_chunk',
                    'text': fallback_explain,
                    'fallback': True
                }
                yield f"data: {_json.dumps(event_data)}\n\n"

        try:
            urgency = "normal"
            urgent_preds = {"glioma", "malignant", "COVID", "Pneumonia", "Pneumothorax", "Edema", "Mass", "Viral Pneumonia"}
            medium_preds = {"meningioma", "Cardiomegaly", "Emphysema", "Nodule", "Lung_Opacity", "pituitary"}
            if result["prediction"] in urgent_preds:
                urgency = "critical"
            elif result["prediction"] in medium_preds:
                urgency = "urgent"

            import json as _j
            execute(
                """INSERT INTO analyses
                   (consultation_id, prediction, confidence, probabilities,
                    gradcam_b64, explain_text, out_of_domain, warning)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    consultation_id,
                    result["prediction"],
                    result["confidence"],
                    _j.dumps(result["probabilities"]),
                    result.get("gradcam_image") or "",
                    full_explain,
                    result.get("out_of_domain", False),
                    result.get("warning", ""),
                )
            )
            execute(
                "UPDATE consultations SET status='analyzed', urgency=%s, updated_at=NOW() WHERE id=%s",
                (urgency, consultation_id)
            )
            create_notification(
                row["patient_id"], "analysis_ready",
                "Résultat IA disponible",
                f"Votre analyse est prête. Diagnostic : {result['prediction']} ({result['confidence']*100:.1f}% confiance).",
                {"consultation_id": consultation_id, "prediction": result["prediction"], "urgency": urgency}
            )
            yield f"data: {_j.dumps({'type': 'saved', 'urgency': urgency, 'status': 'analyzed'})}\n\n"
        except Exception as e:
            yield f"data: {_j.dumps({'type': 'save_error', 'error': str(e)})}\n\n"

        yield 'data: {"type":"done"}\n\n'

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Notifications ──────────────────────────────────────────────────
@router.get("/notifications/me")
async def get_my_notifications(
    unread_only: bool = Query(False),
    current_user: dict = Depends(get_current_user),
):
    if unread_only:
        rows = fetch_all(
            "SELECT * FROM notifications WHERE user_id=%s AND is_read=FALSE ORDER BY created_at DESC",
            (current_user["id"],)
        )
    else:
        rows = fetch_all(
            "SELECT * FROM notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 50",
            (current_user["id"],)
        )
    return {"notifications": rows, "unread": sum(1 for r in rows if not r["is_read"])}


@router.post("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    execute("UPDATE notifications SET is_read=TRUE WHERE user_id=%s", (current_user["id"],))
    return {"message": "Toutes les notifications marquées comme lues."}

@router.get("/files/messages/{filename}")
async def get_message_file(
    filename: str,
    current_user: dict = Depends(get_current_user),
):
    """Servir un fichier de message"""
    file_path = UPLOADS_DIR / "messages" / filename
    
    if not file_path.exists():
        raise HTTPException(404, "Fichier introuvable")
    
    return FileResponse(
        path=str(file_path),
        filename=filename
    )    

# backend/app/api/consultations.py - Ajouter à la fin du fichier

# ============================================================================
# DOSSIER MÉDICAL PATIENT
# ============================================================================

class DossierMedical(BaseModel):
    antecedents: List[str] = []
    allergies: List[str] = []
    traitements: List[dict] = []
    blood_group: str = ""
    birth_date: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    taille: str = ""
    poids: str = ""
    imc: str = ""


@router.get("/dossiers/me")
async def get_medical_dossier(current_user: dict = Depends(get_current_user)):
    """Récupère le dossier médical du patient connecté"""
    
    # Vérifier que l'utilisateur est un patient
    if normalize_role(current_user.get("role", "")) != "Patient" and not current_user.get("is_admin"):
        raise HTTPException(403, detail="Accès réservé aux patients")
    
    # Récupérer le dossier existant
    dossier = fetch_one(
        "SELECT * FROM dossiers WHERE patient_id = %s",
        (current_user["id"],)
    )
    
    if not dossier:
        # Créer un dossier vide si inexistant
        execute(
            """INSERT INTO dossiers (patient_id, antecedents, allergies, traitements, blood_group, 
               birth_date, emergency_contact_name, emergency_contact_phone, taille, poids, imc)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (current_user["id"], "[]", "[]", "[]", "", "", "", "", "", "", "")
        )
        dossier = fetch_one(
            "SELECT * FROM dossiers WHERE patient_id = %s",
            (current_user["id"],)
        )
    
    # Parse les champs JSON
    if dossier and isinstance(dossier.get("antecedents"), str):
        try:
            dossier["antecedents"] = json.loads(dossier["antecedents"])
        except:
            dossier["antecedents"] = []
    
    if dossier and isinstance(dossier.get("allergies"), str):
        try:
            dossier["allergies"] = json.loads(dossier["allergies"])
        except:
            dossier["allergies"] = []
    
    if dossier and isinstance(dossier.get("traitements"), str):
        try:
            dossier["traitements"] = json.loads(dossier["traitements"])
        except:
            dossier["traitements"] = []
    
    return dossier or {
        "antecedents": [],
        "allergies": [],
        "traitements": [],
        "blood_group": "",
        "birth_date": "",
        "emergency_contact_name": "",
        "emergency_contact_phone": "",
        "taille": "",
        "poids": "",
        "imc": ""
    }


@router.put("/dossiers/me")
async def update_medical_dossier(
    dossier: DossierMedical,
    current_user: dict = Depends(get_current_user)
):
    """Met à jour le dossier médical du patient connecté"""
    
    # Vérifier que l'utilisateur est un patient
    if normalize_role(current_user.get("role", "")) != "Patient" and not current_user.get("is_admin"):
        raise HTTPException(403, detail="Accès réservé aux patients")
    
    # Vérifier si le dossier existe
    existing = fetch_one("SELECT id FROM dossiers WHERE patient_id = %s", (current_user["id"],))
    
    if not existing:
        # Créer un nouveau dossier
        execute(
            """INSERT INTO dossiers 
               (patient_id, antecedents, allergies, traitements, blood_group, birth_date, 
                emergency_contact_name, emergency_contact_phone, taille, poids, imc)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                current_user["id"],
                json.dumps(dossier.antecedents),
                json.dumps(dossier.allergies),
                json.dumps(dossier.traitements),
                dossier.blood_group,
                dossier.birth_date,
                dossier.emergency_contact_name,
                dossier.emergency_contact_phone,
                dossier.taille,
                dossier.poids,
                dossier.imc
            )
        )
    else:
        # Mettre à jour le dossier existant
        execute(
            """UPDATE dossiers SET 
               antecedents = %s,
               allergies = %s,
               traitements = %s,
               blood_group = %s,
               birth_date = %s,
               emergency_contact_name = %s,
               emergency_contact_phone = %s,
               taille = %s,
               poids = %s,
               imc = %s,
               updated_at = NOW()
               WHERE patient_id = %s""",
            (
                json.dumps(dossier.antecedents),
                json.dumps(dossier.allergies),
                json.dumps(dossier.traitements),
                dossier.blood_group,
                dossier.birth_date,
                dossier.emergency_contact_name,
                dossier.emergency_contact_phone,
                dossier.taille,
                dossier.poids,
                dossier.imc,
                current_user["id"]
            )
        )
    
    return {"message": "Dossier médical mis à jour avec succès"}
@router.get("/{consultation_id}/report/pdf")
async def download_report_pdf(
    consultation_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Telecharge le rapport PDF d'une consultation"""
    
    # Verifier les droits d'acces
    consultation = fetch_one(
        """SELECT c.*, u.full_name as patient_name, u.username as patient_username
           FROM consultations c
           JOIN users u ON c.patient_id = u.id
           WHERE c.id = %s""",
        (consultation_id,)
    )
    if not consultation:
        raise HTTPException(404, "Consultation introuvable")
    
    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    if consultation["patient_id"] != uid and consultation["doctor_id"] != uid and not is_admin:
        raise HTTPException(403, "Acces non autorise")
    
    # Recuperer l'analyse
    analysis = fetch_one(
        "SELECT * FROM analyses WHERE consultation_id = %s ORDER BY created_at DESC LIMIT 1",
        (consultation_id,)
    )
    if not analysis:
        raise HTTPException(404, "Aucune analyse disponible pour cette consultation")
    
    # Recuperer les probabilites
    probabilities = {}
    if analysis.get("probabilities"):
        try:
            probabilities = json.loads(analysis["probabilities"])
        except:
            probabilities = {}
    
    # Generer le PDF
    try:
        pdf_bytes = generate_report_pdf(
            patient_id=consultation.get("patient_name") or consultation.get("patient_username") or str(consultation["patient_id"]),
            model_key=consultation["model_key"],
            filename=consultation.get("image_path", "").split("/")[-1] or "image.jpg",
            prediction=analysis.get("prediction", "Non determine"),
            confidence=analysis.get("confidence", 0),
            probabilities=probabilities,
            explain_text=analysis.get("explain_text", ""),
            image_b64=None,
            gradcam_b64=analysis.get("gradcam_b64"),
            report_id=f"MEDAI-{consultation_id:06d}",
        )
    except Exception as e:
        print(f"[Report] Erreur generation PDF: {e}")
        raise HTTPException(500, f"Erreur lors de la generation du PDF: {str(e)}")
    
    # Retourner le PDF en streaming
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="rapport_medai_{consultation_id}.pdf"',
            "Content-Type": "application/pdf",
        }
    )