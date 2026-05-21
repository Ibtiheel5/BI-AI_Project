# backend/app/api/doctor_reminders.py
# Gestion des rappels pour les médecins (même structure que patient)

import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel

import pg8000
from app.api.auth import get_current_user

router = APIRouter(prefix="/doctor", tags=["doctor"], redirect_slashes=False)

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB",   "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

def get_db():
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = False
    return conn

def execute(query: str, params: tuple = (), returning=False):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    result = cur.fetchone() if returning else None
    conn.commit()
    cur.close()
    conn.close()
    return result

def fetch_all(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(zip(columns, row)) for row in rows]

def fetch_one(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return dict(zip(columns, row))
    return None

# ============================================================================
# MODELES PYDANTIC
# ============================================================================

class ReminderCreate(BaseModel):
    title: str
    description: str = ""
    date: str
    time: str = ""
    type: str = "medical"

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    completed: Optional[bool] = None

# ============================================================================
# ROUTES DOCTOR (même logique que patient mais rôle Médecin autorisé)
# ============================================================================

@router.get("/reminders/")
async def get_reminders(
    completed: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """Recupere tous les rappels du médecin connecté"""
    if current_user["role"] not in ("Medecin", "Doctor", "Administrateur"):
        raise HTTPException(403, "Acces reserve aux medecins.")

    query = "SELECT * FROM reminders WHERE patient_id = %s"  # patient_id = doctor_id pour simplifier
    params = [current_user["id"]]

    if completed is not None:
        query += " AND completed = %s"
        params.append(completed)

    query += " ORDER BY reminder_date ASC, reminder_time ASC"

    reminders = fetch_all(query, tuple(params))

    for r in reminders:
        if isinstance(r.get("reminder_date"), datetime):
            r["date"] = r["reminder_date"].strftime("%Y-%m-%d")
        else:
            r["date"] = str(r.get("reminder_date", ""))

        if isinstance(r.get("reminder_time"), datetime):
            r["time"] = r["reminder_time"].strftime("%H:%M")
        else:
            r["time"] = str(r.get("reminder_time", "")) if r.get("reminder_time") else ""

        if isinstance(r.get("created_at"), datetime):
            r["created_at"] = r["created_at"].isoformat()

    return {"reminders": reminders, "total": len(reminders)}


@router.post("/reminders/", status_code=201)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_user),
):
    """Cree un nouveau rappel pour le médecin"""
    if current_user["role"] not in ("Medecin", "Doctor", "Administrateur"):
        raise HTTPException(403, "Acces reserve aux medecins.")

    if not reminder.title or not reminder.date:
        raise HTTPException(400, "Titre et date sont obligatoires.")

    try:
        datetime.strptime(reminder.date, "%Y-%m-%d")
        if reminder.time:
            datetime.strptime(reminder.time, "%H:%M")
    except ValueError:
        raise HTTPException(400, "Format de date ou heure invalide.")

    row = execute(
        """INSERT INTO reminders (patient_id, title, description, reminder_date, reminder_time, type)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
        (current_user["id"], reminder.title, reminder.description,
         reminder.date, reminder.time or None, reminder.type),
        returning=True
    )
    reminder_id = row[0]

    new_reminder = fetch_one("SELECT * FROM reminders WHERE id = %s", (reminder_id,))
    new_reminder["date"] = str(new_reminder.get("reminder_date", ""))
    new_reminder["time"] = str(new_reminder.get("reminder_time", "")) if new_reminder.get("reminder_time") else ""
    if isinstance(new_reminder.get("created_at"), datetime):
        new_reminder["created_at"] = new_reminder["created_at"].isoformat()

    return new_reminder


@router.put("/reminders/{reminder_id}/")
async def update_reminder(
    reminder_id: int,
    update: ReminderUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Met a jour un rappel du médecin"""
    if current_user["role"] not in ("Medecin", "Doctor", "Administrateur"):
        raise HTTPException(403, "Acces reserve aux medecins.")

    existing = fetch_one(
        "SELECT * FROM reminders WHERE id = %s AND patient_id = %s",
        (reminder_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(404, "Rappel introuvable.")

    updates = []
    params = []

    if update.title is not None:
        updates.append("title = %s")
        params.append(update.title)
    if update.description is not None:
        updates.append("description = %s")
        params.append(update.description)
    if update.date is not None:
        updates.append("reminder_date = %s")
        params.append(update.date)
    if update.time is not None:
        updates.append("reminder_time = %s")
        params.append(update.time if update.time else None)
    if update.type is not None:
        updates.append("type = %s")
        params.append(update.type)
    if update.completed is not None:
        updates.append("completed = %s")
        params.append(update.completed)

    if not updates:
        raise HTTPException(400, "Aucune modification fournie.")

    params.extend([reminder_id, current_user["id"]])

    execute(
        f"UPDATE reminders SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s AND patient_id = %s",
        tuple(params)
    )

    updated = fetch_one("SELECT * FROM reminders WHERE id = %s", (reminder_id,))
    updated["date"] = str(updated.get("reminder_date", ""))
    updated["time"] = str(updated.get("reminder_time", "")) if updated.get("reminder_time") else ""
    if isinstance(updated.get("created_at"), datetime):
        updated["created_at"] = updated["created_at"].isoformat()

    return updated


@router.delete("/reminders/{reminder_id}/")
async def delete_reminder(
    reminder_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Supprime un rappel du médecin"""
    if current_user["role"] not in ("Medecin", "Doctor", "Administrateur"):
        raise HTTPException(403, "Acces reserve aux medecins.")

    existing = fetch_one(
        "SELECT * FROM reminders WHERE id = %s AND patient_id = %s",
        (reminder_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(404, "Rappel introuvable.")

    execute("DELETE FROM reminders WHERE id = %s", (reminder_id,))

    return {"message": "Rappel supprime avec succes."}


@router.get("/reminders/check/")
async def check_upcoming_reminders(
    current_user: dict = Depends(get_current_user),
):
    """Verifie les rappels a venir du médecin"""
    if current_user["role"] not in ("Medecin", "Doctor", "Administrateur"):
        raise HTTPException(403, "Acces reserve aux medecins.")

    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    upcoming = fetch_all(
        """SELECT * FROM reminders
           WHERE patient_id = %s
           AND completed = FALSE
           AND notified = FALSE
           AND reminder_date <= %s
           ORDER BY reminder_date ASC, reminder_time ASC""",
        (current_user["id"], tomorrow)
    )

    notified_count = 0
    for reminder in upcoming:
        execute(
            "UPDATE reminders SET notified = TRUE WHERE id = %s",
            (reminder["id"],)
        )
        notified_count += 1

    return {
        "checked": True,
        "upcoming_count": len(upcoming),
        "notified_count": notified_count
    }