# app/api/consultations.py
# Routes dans le BON ORDRE : statiques d'abord, /{id} en dernier
# Sinon FastAPI interprète /my, /queue, /assigned comme /{consultation_id}

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

# ── Config ──────────────────────────────────────────────────────────
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB",   "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

UPLOADS_DIR = Path("uploads/consultations")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# IMPORTANT: prefix="/consultations" est ajouté dans main.py
router = APIRouter(prefix="/consultations", tags=["consultations"])

VALID_MODELS = {"chest", "lung", "brain"}

# ── DB helpers ───────────────────────────────────────────────────────
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

# ── Init tables ──────────────────────────────────────────────────────
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


# ── Helper notifications ─────────────────────────────────────────────
def create_notification(user_id: int, ntype: str, title: str, message: str, data: dict = {}):
    try:
        execute(
            "INSERT INTO notifications (user_id, type, title, message, data) VALUES (%s,%s,%s,%s,%s)",
            (user_id, ntype, title, message, json.dumps(data))
        )
    except Exception as e:
        print(f"⚠️ Notification échouée : {e}")


# ── Pydantic models ──────────────────────────────────────────────────
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


# ════════════════════════════════════════════════════════════════════
# ROUTES — ORDRE CRITIQUE: statiques d'abord, /{id} en dernier
# ════════════════════════════════════════════════════════════════════

# ── [1] POST / — Créer une consultation (patient) ───────────────────
@router.post("", status_code=201)
async def create_consultation(
    model_key:     str        = Form(...),
    patient_notes: str        = Form(""),
    file:          UploadFile = File(...),
    current_user:  dict       = Depends(get_current_user),
):
    if model_key not in VALID_MODELS:
        raise HTTPException(400, f"Modèle invalide. Valeurs: {VALID_MODELS}")

    ext      = Path(file.filename or "image.jpg").suffix or ".jpg"
    filename = f"consult_{current_user['id']}_{int(datetime.now().timestamp())}{ext}"
    dest     = UPLOADS_DIR / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

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
            f"Un patient a soumis une demande ({model_key.upper()}). Réf #{consult_id}",
            {"consultation_id": consult_id}
        )

    return {
        "message":         "Demande envoyée. Un médecin va prendre en charge votre dossier.",
        "consultation_id": consult_id,
        "status":          "pending",
    }


# ── [2] GET /my — Consultations du patient connecté ─────────────────
@router.get("/my")
async def get_my_consultations(
    status:       Optional[str] = Query(None),
    current_user: dict          = Depends(get_current_user),
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


# ── [3] GET /queue — File d'attente médecin ──────────────────────────
@router.get("/queue")
async def get_doctor_queue(
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    domains = current_user.get("domains", [])
    if isinstance(domains, str):
        import json as _json
        try:
            domains = _json.loads(domains)
        except Exception:
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


# ── [4] GET /assigned — Cas assignés au médecin ──────────────────────
@router.get("/assigned")
async def get_assigned_consultations(
    status:       Optional[str] = Query(None),
    current_user: dict          = Depends(get_current_user),
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


# ── [5] POST /appointments — Créer un rendez-vous ────────────────────
@router.post("/appointments", status_code=201)
async def create_appointment(
    body:         AppointmentCreate,
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
           (consultation_id, doctor_id, patient_id, type, scheduled_at,
            duration_minutes, video_link, location, notes)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (body.consultation_id, current_user["id"], row["patient_id"],
         body.type, scheduled_dt, body.duration_minutes,
         body.video_link, body.location, body.notes)
    )

    rdv_type = "vidéo" if body.type == "video" else "présentiel"
    create_notification(
        row["patient_id"], "appointment_scheduled",
        f"Rendez-vous {rdv_type} planifié",
        f"Dr. {current_user['full_name']} vous a proposé un RDV le "
        f"{scheduled_dt.strftime('%d/%m/%Y à %H:%M')}.",
        {"consultation_id": body.consultation_id, "type": body.type}
    )

    return {"message": f"Rendez-vous {rdv_type} créé.", "type": body.type}


# ── [6] GET /notifications/me ────────────────────────────────────────
@router.get("/notifications/me")
async def get_my_notifications(
    unread_only:  bool = Query(False),
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


# ── [7] POST /notifications/read-all ────────────────────────────────
@router.post("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    execute(
        "UPDATE notifications SET is_read=TRUE WHERE user_id=%s",
        (current_user["id"],)
    )
    return {"message": "Toutes les notifications marquées comme lues."}


# ════════════════════════════════════════════════════════════════════
# ROUTES DYNAMIQUES /{consultation_id} — EN DERNIER obligatoirement
# ════════════════════════════════════════════════════════════════════

# ── [8] GET /{id} — Détail d'une consultation ────────────────────────
@router.get("/{consultation_id}")
async def get_consultation(
    consultation_id: int,
    current_user:    dict = Depends(get_current_user),
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

    uid      = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    if not is_admin and row["patient_id"] != uid and row["doctor_id"] != uid:
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


# ── [9] POST /{id}/accept ────────────────────────────────────────────
@router.post("/{consultation_id}/accept")
async def accept_consultation(
    consultation_id: int,
    current_user:    dict = Depends(get_current_user),
):
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Réservé aux médecins.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "pending":
        raise HTTPException(400, f"Statut actuel : {row['status']}. Impossible d'accepter.")

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

    return {"message": "Consultation acceptée.", "status": "accepted"}


# ── [10] POST /{id}/reject ───────────────────────────────────────────
@router.post("/{consultation_id}/reject")
async def reject_consultation(
    consultation_id: int,
    reason:          str  = Form(""),
    current_user:    dict = Depends(get_current_user),
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
        "Votre demande a été rejetée. Vous pouvez en soumettre une nouvelle.",
        {"consultation_id": consultation_id}
    )

    return {"message": "Consultation rejetée.", "status": "rejected"}


# ── [11] POST /{id}/analysis — Sauvegarder résultat IA ───────────────
@router.post("/{consultation_id}/analysis")
async def save_analysis(
    consultation_id: int,
    prediction:      str   = Form(...),
    confidence:      float = Form(...),
    probabilities:   str   = Form("{}"),
    explain_text:    str   = Form(""),
    gradcam_b64:     str   = Form(""),
    out_of_domain:   bool  = Form(False),
    warning:         str   = Form(""),
    current_user:    dict  = Depends(get_current_user),
):
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["status"] != "accepted":
        raise HTTPException(400, "La consultation doit être acceptée avant l'analyse.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut lancer l'analyse.")

    # Urgence automatique
    urgent_preds = {"glioma", "malignant", "COVID", "Pneumonia", "Pneumothorax",
                    "Edema", "Mass", "Viral Pneumonia"}
    medium_preds = {"meningioma", "Cardiomegaly", "Emphysema", "Nodule",
                    "Lung_Opacity", "pituitary"}
    urgency = "normal"
    if prediction in urgent_preds:
        urgency = "critical"
    elif prediction in medium_preds:
        urgency = "urgent"

    execute(
        """INSERT INTO analyses
           (consultation_id, prediction, confidence, probabilities,
            gradcam_b64, explain_text, out_of_domain, warning)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (consultation_id, prediction, confidence, probabilities,
         gradcam_b64, explain_text, out_of_domain, warning)
    )

    execute(
        "UPDATE consultations SET status='analyzed', urgency=%s, updated_at=NOW() WHERE id=%s",
        (urgency, consultation_id)
    )

    create_notification(
        row["patient_id"], "analysis_ready",
        "Résultat IA disponible",
        f"Votre analyse est prête. Diagnostic : {prediction} "
        f"({confidence * 100:.1f}% confiance).",
        {"consultation_id": consultation_id, "prediction": prediction, "urgency": urgency}
    )

    return {"message": "Analyse sauvegardée.", "urgency": urgency, "status": "analyzed"}


# ── [12] POST /{id}/close ────────────────────────────────────────────
@router.post("/{consultation_id}/close")
async def close_consultation(
    consultation_id: int,
    doctor_notes:    str  = Form(""),
    current_user:    dict = Depends(get_current_user),
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
        "Votre consultation a été clôturée. Consultez votre espace patient.",
        {"consultation_id": consultation_id}
    )

    return {"message": "Consultation clôturée.", "status": "closed"}


# ── [13] GET /{id}/messages ──────────────────────────────────────────
@router.get("/{consultation_id}/messages")
async def get_messages(
    consultation_id: int,
    current_user:    dict = Depends(get_current_user),
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


# ── [14] POST /{id}/messages ─────────────────────────────────────────
@router.post("/{consultation_id}/messages", status_code=201)
async def send_message(
    consultation_id: int,
    body:            MessageCreate,
    current_user:    dict = Depends(get_current_user),
):
    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")

    uid = current_user["id"]
    if row["patient_id"] != uid and row["doctor_id"] != uid and not current_user.get("is_admin"):
        raise HTTPException(403, "Accès refusé.")
    if row["status"] not in ("accepted", "analyzed"):
        raise HTTPException(400, "Messages disponibles seulement après acceptation.")
    if not body.content.strip():
        raise HTTPException(400, "Message vide.")

    execute(
        "INSERT INTO messages (consultation_id, sender_id, content, msg_type) VALUES (%s,%s,%s,%s)",
        (consultation_id, uid, body.content.strip(), body.msg_type)
    )

    other_id = row["doctor_id"] if uid == row["patient_id"] else row["patient_id"]
    if other_id:
        create_notification(
            other_id, "new_message",
            f"Nouveau message de {current_user['full_name']}",
            body.content[:80] + ("…" if len(body.content) > 80 else ""),
            {"consultation_id": consultation_id}
        )

    return {"message": "Message envoyé."}


# ── [15] POST /{id}/transfer ─────────────────────────────────────────
@router.post("/{consultation_id}/transfer")
async def transfer_consultation(
    consultation_id: int,
    body:            TransferCreate,
    current_user:    dict = Depends(get_current_user),
):
    if current_user["role"] not in ("Medecin", "Administrateur"):
        raise HTTPException(403, "Seul un médecin peut transférer un dossier.")

    row = fetch_one("SELECT * FROM consultations WHERE id = %s", (consultation_id,))
    if not row:
        raise HTTPException(404, "Consultation introuvable.")
    if row["doctor_id"] != current_user["id"] and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul le médecin assigné peut transférer.")

    target = fetch_one(
        "SELECT * FROM users WHERE id=%s AND role='Medecin' AND status='approved'",
        (body.to_doctor_id,)
    )
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
        f"Dr. {current_user['full_name']} vous a transféré un dossier. "
        f"Motif : {body.reason or 'Non précisé'}",
        {"consultation_id": consultation_id}
    )
    create_notification(
        row["patient_id"], "doctor_changed",
        "Votre médecin a changé",
        f"Votre dossier a été transféré à Dr. {target['full_name']} ({target['specialty']}).",
        {"consultation_id": consultation_id}
    )

    return {
        "message":    f"Dossier transféré à Dr. {target['full_name']}.",
        "new_doctor": target["full_name"],
    }