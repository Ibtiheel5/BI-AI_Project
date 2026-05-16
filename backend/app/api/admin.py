# backend/app/api/admin.py
import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

import pg8000
from app.api.auth import get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["admin"])

# ── Connexion PostgreSQL ─────────────────────────────────────────────
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

# ============================================================================
# LOGS SYSTÈME
# ============================================================================

def log_action(action: str, user_id: int, user_email: str, details: str, ip_address: str = "127.0.0.1"):
    """Enregistre une action dans les logs système"""
    try:
        execute("""
            INSERT INTO admin_logs (action, user_id, user_email, details, ip_address, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """, (action, user_id, user_email, details, ip_address))
        print(f"[LOG] {action} - {user_email} - {details}")
    except Exception as e:
        print(f"❌ Erreur écriture log: {e}")

# ============================================================================
# ENDPOINTS LOGS
# ============================================================================

class LogResponse(BaseModel):
    id: int
    action: str
    user_id: Optional[int]
    user_email: str
    details: str
    ip_address: str
    created_at: str
    status: str = "success"

@router.get("/logs")
async def get_admin_logs(
    limit: int = 100,
    action: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """
    Récupère les logs système (admin uniquement)
    Option: filtrer par action (user.created, user.approved, etc.)
    """
    query = "SELECT * FROM admin_logs"
    params = []
    
    if action:
        query += " WHERE action = %s"
        params.append(action)
    
    query += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)
    
    logs = fetch_all(query, tuple(params))
    
    # Formater les dates en string ISO
    for log in logs:
        if isinstance(log.get("created_at"), datetime):
            log["created_at"] = log["created_at"].isoformat()
        log["status"] = "success" if log.get("status") != "error" else "error"
    
    return {"logs": logs, "total": len(logs)}

@router.get("/logs/actions")
async def get_log_actions(current_user: dict = Depends(require_admin)):
    """Retourne la liste des types d'actions disponibles"""
    actions = fetch_all("SELECT DISTINCT action FROM admin_logs ORDER BY action")
    return {"actions": [a["action"] for a in actions]}

# ============================================================================
# INITIALISATION DES TABLES
# ============================================================================

def init_admin_tables():
    """Crée les tables nécessaires pour l'administration"""
    conn = get_db()
    cur = conn.cursor()
    
    # Table des logs
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(100) NOT NULL,
            user_id INT,
            user_email VARCHAR(255),
            details TEXT,
            ip_address VARCHAR(45),
            status VARCHAR(20) DEFAULT 'success',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    
    # Table des webhooks
    cur.execute("""
        CREATE TABLE IF NOT EXISTS webhooks (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            events TEXT[] DEFAULT '{"all"}',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    
    # Table des paramètres (SMTP, etc.)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT,
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_by INT
        )
    """)
    
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Tables admin créées avec succès")

# ============================================================================
# ENDPOINTS WEBHOOKS
# ============================================================================

class WebhookCreate(BaseModel):
    name: str
    url: str
    events: List[str] = ["all"]
    is_active: bool = True

class WebhookResponse(BaseModel):
    id: int
    name: str
    url: str
    events: List[str]
    is_active: bool
    created_at: str

@router.get("/webhooks")
async def get_webhooks(current_user: dict = Depends(require_admin)):
    """Récupère tous les webhooks"""
    webhooks = fetch_all("SELECT * FROM webhooks ORDER BY created_at DESC")
    for w in webhooks:
        if isinstance(w.get("events"), str):
            try:
                w["events"] = json.loads(w["events"])
            except:
                w["events"] = ["all"]
        if isinstance(w.get("created_at"), datetime):
            w["created_at"] = w["created_at"].isoformat()
    return {"webhooks": webhooks}

@router.post("/webhooks", status_code=201)
async def create_webhook(
    webhook: WebhookCreate,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Crée un nouveau webhook"""
    # Vérifier l'unicité du nom
    existing = fetch_one("SELECT id FROM webhooks WHERE name = %s", (webhook.name,))
    if existing:
        raise HTTPException(400, detail="Un webhook avec ce nom existe déjà")
    
    execute("""
        INSERT INTO webhooks (name, url, events, is_active)
        VALUES (%s, %s, %s, %s)
    """, (webhook.name, webhook.url, json.dumps(webhook.events), webhook.is_active))
    
    # Log l'action
    client_ip = request.client.host if request.client else "unknown"
    log_action(
        action="webhook.created",
        user_id=current_user["id"],
        user_email=current_user.get("email", ""),
        details=f"Webhook créé: {webhook.name}",
        ip_address=client_ip
    )
    
    return {"message": "Webhook créé avec succès"}

@router.put("/webhooks/{webhook_id}")
async def update_webhook(
    webhook_id: int,
    webhook: WebhookCreate,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Met à jour un webhook"""
    existing = fetch_one("SELECT id FROM webhooks WHERE id = %s", (webhook_id,))
    if not existing:
        raise HTTPException(404, detail="Webhook non trouvé")
    
    execute("""
        UPDATE webhooks 
        SET name = %s, url = %s, events = %s, is_active = %s, updated_at = NOW()
        WHERE id = %s
    """, (webhook.name, webhook.url, json.dumps(webhook.events), webhook.is_active, webhook_id))
    
    client_ip = request.client.host if request.client else "unknown"
    log_action(
        action="webhook.updated",
        user_id=current_user["id"],
        user_email=current_user.get("email", ""),
        details=f"Webhook mis à jour: {webhook.name}",
        ip_address=client_ip
    )
    
    return {"message": "Webhook mis à jour"}

@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: int,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Supprime un webhook"""
    webhook = fetch_one("SELECT name FROM webhooks WHERE id = %s", (webhook_id,))
    if not webhook:
        raise HTTPException(404, detail="Webhook non trouvé")
    
    execute("DELETE FROM webhooks WHERE id = %s", (webhook_id,))
    
    client_ip = request.client.host if request.client else "unknown"
    log_action(
        action="webhook.deleted",
        user_id=current_user["id"],
        user_email=current_user.get("email", ""),
        details=f"Webhook supprimé: {webhook['name']}",
        ip_address=client_ip
    )
    
    return {"message": "Webhook supprimé"}

@router.post("/webhooks/{webhook_id}/toggle")
async def toggle_webhook(
    webhook_id: int,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Active/désactive un webhook"""
    webhook = fetch_one("SELECT name, is_active FROM webhooks WHERE id = %s", (webhook_id,))
    if not webhook:
        raise HTTPException(404, detail="Webhook non trouvé")
    
    new_status = not webhook["is_active"]
    execute("UPDATE webhooks SET is_active = %s, updated_at = NOW() WHERE id = %s", (new_status, webhook_id))
    
    client_ip = request.client.host if request.client else "unknown"
    log_action(
        action="webhook.toggled",
        user_id=current_user["id"],
        user_email=current_user.get("email", ""),
        details=f"Webhook {webhook['name']} {'activé' if new_status else 'désactivé'}",
        ip_address=client_ip
    )
    
    return {"is_active": new_status, "message": "Statut modifié"}

# ============================================================================
# ENDPOINTS CONFIGURATION SMTP
# ============================================================================

class SMTPConfig(BaseModel):
    host: str = "smtp.gmail.com"
    port: int = 587
    user: str = ""
    password: str = ""
    from_email: str = ""
    use_tls: bool = True

@router.get("/smtp-config")
async def get_smtp_config(current_user: dict = Depends(require_admin)):
    """Récupère la configuration SMTP (masque le mot de passe)"""
    config = fetch_one("SELECT value FROM settings WHERE key = 'smtp_config'")
    if config and config.get("value"):
        try:
            data = json.loads(config["value"])
            # Ne pas retourner le mot de passe en clair
            if "password" in data:
                data["password"] = "********"
            return data
        except:
            pass
    return {"host": "smtp.gmail.com", "port": 587, "use_tls": True, "user": "", "from_email": ""}

@router.post("/smtp-config")
async def save_smtp_config(
    config: SMTPConfig,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Sauvegarde la configuration SMTP"""
    # Stocker la configuration complète (avec mot de passe)
    config_dict = config.dict()
    
    execute("""
        INSERT INTO settings (key, value, updated_by, updated_at)
        VALUES ('smtp_config', %s, %s, NOW())
        ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
    """, (json.dumps(config_dict), current_user["id"]))
    
    client_ip = request.client.host if request.client else "unknown"
    log_action(
        action="settings.smtp",
        user_id=current_user["id"],
        user_email=current_user.get("email", ""),
        details="Configuration SMTP mise à jour",
        ip_address=client_ip
    )
    
    return {"message": "Configuration SMTP sauvegardée"}

@router.post("/test-email")
async def test_email(
    config: SMTPConfig,
    current_user: dict = Depends(require_admin)
):
    """Envoie un email de test pour vérifier la configuration SMTP"""
    try:
        import smtplib
        from email.mime.text import MIMEText
        
        msg = MIMEText("Ceci est un email de test depuis MedAI.\n\nSi vous recevez ce message, la configuration SMTP est correcte.", "plain")
        msg["Subject"] = "Test SMTP - MedAI"
        msg["From"] = config.from_email
        msg["To"] = current_user.get("email")
        
        with smtplib.SMTP(config.host, config.port) as server:
            if config.use_tls:
                server.starttls()
            if config.user and config.password:
                server.login(config.user, config.password)
            server.sendmail(config.from_email, current_user.get("email"), msg.as_string())
        
        return {"message": "Email de test envoyé avec succès"}
    except Exception as e:
        raise HTTPException(400, detail=f"Erreur d'envoi: {str(e)}")