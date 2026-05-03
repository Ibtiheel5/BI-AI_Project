# app/api/consultations.py
# Gestion complète des demandes de consultation
# Flux : pending → accepted → analyzed → closed

import os
import json
import shutil
from datetime import datetime
from typing import List, Optional
from pathlib import Path

import pg8000
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

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
VALID_MODELS   = {"chest", "lung", "brain"}

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
    conn = get_db(); cur = conn.cursor()

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
            status           VARCHAR(20) DEFAULT 'scheduled',
            notes            TEXT DEFAULT '',
            created_at       TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)

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

    cur.execute("""
        CREATE TABLE IF NOT EXISTS dossiers (
            id               SERIAL PRIMARY KEY,
            patient_id       INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            antecedents      TEXT DEFAULT '[]',
            allergies        TEXT DEFAULT '[]',
            traitements      TEXT DEFAULT '[]',
            blood_group      VARCHAR(5) DEFAULT '',
            birth_date       DATE,
            emergency_contact_name  TEXT DEFAULT '',
            emergency_contact_phone TEXT DEFAULT '',
            updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(patient_id)
        )
    """)

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

    conn.commit(); cur.close(); conn.close()
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

class MessageCreate(BaseModel):
    content:  str
    msg_type: str = "text"

class TransferCreate(BaseModel):
    to_doctor_id: int
    reason:       str = ""


# ══════════════════════════════════════════════════════════════════
# ROUTES CONSULTATIONS
# ══════════════════════════════════════════════════════════════════

# ── Patient : créer une demande ────────────────────────────────────
@router.post("", status_code=201)
async def create_consultation(
    model_key:     str        = Form(...),
    patient_notes: str        = Form(""),
    file:          UploadFile = File(...),
    current_user: dict        = Depends(get_current_user),
):
    if current_user["role"] not in ("Patient", "Medecin", "Administrateur"):
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

    # Notifier tous les médecins du bon domaine
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
    if status:
        rows = fetch_all(
            """SELECT c.*, u.full_name as doctor_name, u.specialty as doctor_specialty
               FROM consultations c
               LEFT JOIN users u ON c.doctor_id = u.id
               WHERE c.patient_id = %s AND c.status = %s
               ORDER BY c.created_at DESC""",
            (current_user["id"], status)
        )
    else:
        rows = fetch_all(
            """SELECT c.*, u.full_name as doctor_name, u.specialty as doctor_specialty
               FROM consultations c
               LEFT JOIN users u ON c.doctor_id = u.id
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
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    domains = current_user.get("domains", [])
    if isinstance(domains, str):
        domains = json.loads(domains)

    if not domains:
        return {"consultations": [], "total": 0}

    # Récupérer les consultations en attente correspondant aux domaines du médecin
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


# ── Médecin : mes consultations acceptées ──────────────────────────
@router.get("/assigned")
async def get_assigned_consultations(
    status: Optional[str] = Query(None),
    current_user: dict    = Depends(get_current_user),
):
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    if status:
        rows = fetch_all(
            """SELECT c.*, u.full_name as patient_name
               FROM consultations c
               JOIN users u ON c.patient_id = u.id
               WHERE c.doctor_id = %s AND c.status = %s
               ORDER BY c.updated_at DESC""",
            (current_user["id"], status)
        )
    else:
        rows = fetch_all(
            """SELECT c.*, u.full_name as patient_name
               FROM consultations c
               JOIN users u ON c.patient_id = u.id
               WHERE c.doctor_id = %s AND c.status != 'pending'
               ORDER BY c.updated_at DESC""",
            (current_user["id"],)
        )
    return {"consultations": rows, "total": len(rows)}


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

    # Vérifier les droits d'accès
    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    if not is_admin and row["patient_id"] != uid and row["doctor_id"] != uid:
        raise HTTPException(403, "Accès refusé.")

    # Récupérer l'analyse si elle existe
    analysis = fetch_one(
        "SELECT * FROM analyses WHERE consultation_id = %s ORDER BY created_at DESC LIMIT 1",
        (consultation_id,)
    )

    # Messages
    messages = fetch_all(
        """SELECT m.*, u.full_name as sender_name, u.role as sender_role
           FROM messages m JOIN users u ON m.sender_id = u.id
           WHERE m.consultation_id = %s ORDER BY m.created_at ASC""",
        (consultation_id,)
    )

    # Rendez-vous
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
    if current_user["role"] not in ("Medecin", "Administrateur"):
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

    # Notifier le patient
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
    if current_user["role"] not in ("Medecin", "Administrateur"):
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

    # Vérifier que c'est le bon médecin
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut lancer l'analyse.")

    # Calculer urgence automatique selon prediction
    urgency = "normal"
    urgent_preds = {"glioma", "malignant", "COVID", "Pneumonia", "Pneumothorax", "Edema", "Mass", "Viral Pneumonia"}
    medium_preds = {"meningioma", "Cardiomegaly", "Emphysema", "Nodule", "Lung_Opacity", "pituitary"}
    if prediction in urgent_preds:
        urgency = "critical"
    elif prediction in medium_preds:
        urgency = "urgent"

    # Sauvegarder l'analyse
    execute(
        """INSERT INTO analyses
           (consultation_id, prediction, confidence, probabilities, gradcam_b64, explain_text, out_of_domain, warning)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (consultation_id, prediction, confidence, probabilities, gradcam_b64, explain_text, out_of_domain, warning)
    )

    # Mettre à jour le statut
    execute(
        "UPDATE consultations SET status='analyzed', urgency=%s, updated_at=NOW() WHERE id=%s",
        (urgency, consultation_id)
    )

    # Notifier le patient — résultat disponible
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
    body: MessageCreate,
    current_user: dict = Depends(get_current_user),
):
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")

    uid = current_user["id"]
    if row["patient_id"] != uid and row["doctor_id"] != uid and not current_user.get("is_admin"):
        raise HTTPException(403, "Accès refusé.")
    if row["status"] not in ("accepted", "analyzed"):
        raise HTTPException(400, "Les messages ne sont disponibles qu'après acceptation.")

    if not body.content.strip():
        raise HTTPException(400, "Message vide.")

    execute(
        "INSERT INTO messages (consultation_id, sender_id, content, msg_type) VALUES (%s,%s,%s,%s)",
        (consultation_id, uid, body.content.strip(), body.msg_type)
    )

    # Notifier l'autre partie
    other_id = row["doctor_id"] if uid == row["patient_id"] else row["patient_id"]
    if other_id:
        create_notification(
            other_id, "new_message",
            f"Nouveau message de {current_user['full_name']}",
            body.content[:80] + ("…" if len(body.content) > 80 else ""),
            {"consultation_id": consultation_id}
        )

    return {"message": "Message envoyé."}


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
    return {"messages": messages}


# ── Rendez-vous ────────────────────────────────────────────────────
@router.post("/appointments", status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Seul un médecin peut créer un rendez-vous.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (body.consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut créer un RDV.")

    try:
        scheduled_dt = datetime.fromisoformat(body.scheduled_at)
    except ValueError:
        raise HTTPException(400, "Format de date invalide. Utilisez ISO 8601.")

    execute(
        """INSERT INTO appointments
           (consultation_id, doctor_id, patient_id, type, scheduled_at, duration_minutes, video_link, location, notes)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (body.consultation_id, current_user["id"], row["patient_id"],
         body.type, scheduled_dt, body.duration_minutes,
         body.video_link, body.location, body.notes)
    )

    rdv_type = "vidéo" if body.type == "video" else "présentiel"
    create_notification(
        row["patient_id"], "appointment_scheduled",
        f"Rendez-vous {rdv_type} planifié",
        f"Dr. {current_user['full_name']} vous a proposé un RDV le {scheduled_dt.strftime('%d/%m/%Y à %H:%M')}.",
        {"consultation_id": body.consultation_id, "type": body.type}
    )

    return {"message": f"Rendez-vous {rdv_type} créé.", "type": body.type}


# ── Transfert de dossier ───────────────────────────────────────────
@router.post("/{consultation_id}/transfer")
async def transfer_consultation(
    consultation_id: int,
    body: TransferCreate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Seul un médecin peut transférer un dossier.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut transférer.")

    target = fetch_one("SELECT * FROM users WHERE id=%s AND role='Medecin' AND status='approved'", (body.to_doctor_id,))
    if not target:
        raise HTTPException(404, "Médecin destinataire introuvable.")

    # Enregistrer le transfert
    execute(
        "INSERT INTO transfers (consultation_id, from_doctor_id, to_doctor_id, reason) VALUES (%s,%s,%s,%s)",
        (consultation_id, current_user["id"], body.to_doctor_id, body.reason)
    )

    # Changer le médecin assigné
    execute(
        "UPDATE consultations SET doctor_id=%s, updated_at=NOW() WHERE id=%s",
        (body.to_doctor_id, consultation_id)
    )

    # Notifier le nouveau médecin
    create_notification(
        body.to_doctor_id, "consultation_transferred",
        "Dossier transféré",
        f"Dr. {current_user['full_name']} vous a transféré un dossier. Motif : {body.reason or 'Non précisé'}",
        {"consultation_id": consultation_id}
    )
    # Notifier le patient
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


# ── Lancer l'analyse IA côté serveur (évite le CORS sur /uploads) ──
@router.post("/{consultation_id}/run-analysis")
async def run_analysis_server_side(
    consultation_id: int,
    gradcam: bool = Query(True),
    current_user: dict = Depends(get_current_user),
):
    """
    Lit l'image directement depuis le disque serveur et lance l'inférence.
    Aucun fetch cross-origin côté frontend — résout le bug CORS sur /uploads.
    Retourne un stream SSE identique à /api/v1/predict.
    """
    import asyncio
    import base64
    from fastapi.responses import StreamingResponse

    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "accepted":
        raise HTTPException(400, f"Statut actuel : {row['status']}. La consultation doit être acceptée.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut lancer l'analyse.")

    # Lire l'image depuis le disque (pas de fetch réseau → pas de CORS)
    image_path = Path(row["image_path"])
    if not image_path.exists():
        raise HTTPException(404, f"Image introuvable sur le serveur : {image_path}")

    image_bytes = image_path.read_bytes()
    model_key   = row["model_key"]

    async def event_stream():
        import json as _json

        # ── 1. Inférence ──────────────────────────────────────────────
        try:
            from app.services.inference import run_inference
            result = run_inference(image_bytes, with_gradcam=gradcam, model_key=model_key)
        except Exception as e:
            yield f"data: {_json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        # ── 2. Envoyer la prédiction immédiatement ────────────────────
        yield f"data: {_json.dumps({'type': 'prediction', 'prediction': result['prediction'], 'confidence': result['confidence'], 'probabilities': result['probabilities'], 'gradcam_image': result.get('gradcam_image'), 'out_of_domain': result.get('out_of_domain', False), 'warning': result.get('warning', '')})}\n\n"
        await asyncio.sleep(0)

        if result.get("out_of_domain"):
            yield 'data: {"type":"done"}\n\n'
            return

        # ── 3. Explication Gemini streamée ────────────────────────────
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
                # Accumuler le texte pour la sauvegarde
                try:
                    parsed = _json.loads(chunk_json)
                    if parsed.get("type") == "explain_chunk":
                        full_explain += parsed.get("text", "")
                except Exception:
                    pass
        except Exception as e:
            yield f"data: {_json.dumps({'type': 'explain_error', 'error': str(e)})}\n\n"

        # ── 4. Sauvegarder automatiquement l'analyse en DB ────────────
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