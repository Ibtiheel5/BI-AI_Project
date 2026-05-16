# backend/app/api/contact.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import pg8000
import os

from app.api.auth import get_current_user, require_admin

router = APIRouter(prefix="/contact", tags=["contact"])

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

def get_db():
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = False
    return conn

def execute(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    conn.commit()
    cur.close()
    conn.close()

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

# Modèles Pydantic
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    status: str
    is_read: bool
    created_at: str
    read_at: Optional[str] = None

# Routes
@router.post("")
async def send_contact_message(req: ContactRequest):
    """Envoie un message de contact"""
    try:
        execute(
            """INSERT INTO contacts (name, email, subject, message, status, is_read)
               VALUES (%s, %s, %s, %s, 'pending', FALSE)""",
            (req.name, req.email, req.subject, req.message)
        )
        
        # Notification optionnelle par email à l'admin
        print(f"📧 Nouveau message de contact: {req.name} - {req.email}")
        
        return {"message": "Message envoyé avec succès", "success": True}
    except Exception as e:
        print(f"Erreur: {e}")
        raise HTTPException(500, detail="Erreur lors de l'envoi du message")

@router.get("/admin/messages", dependencies=[Depends(require_admin)])
async def get_all_messages():
    """Récupère tous les messages (admin seulement)"""
    messages = fetch_all(
        "SELECT * FROM contacts ORDER BY created_at DESC"
    )
    return {"messages": messages, "total": len(messages)}

@router.get("/admin/unread", dependencies=[Depends(require_admin)])
async def get_unread_count():
    """Récupère le nombre de messages non lus (admin seulement)"""
    result = fetch_one(
        "SELECT COUNT(*) as count FROM contacts WHERE is_read = FALSE"
    )
    return {"unread": result["count"] if result else 0}

@router.put("/admin/messages/{message_id}/read", dependencies=[Depends(require_admin)])
async def mark_as_read(message_id: int):
    """Marque un message comme lu"""
    execute(
        "UPDATE contacts SET is_read = TRUE, read_at = NOW() WHERE id = %s",
        (message_id,)
    )
    return {"message": "Message marqué comme lu"}

@router.delete("/admin/messages/{message_id}", dependencies=[Depends(require_admin)])
async def delete_message(message_id: int):
    """Supprime un message (admin seulement)"""
    execute("DELETE FROM contacts WHERE id = %s", (message_id,))
    return {"message": "Message supprimé avec succès"}