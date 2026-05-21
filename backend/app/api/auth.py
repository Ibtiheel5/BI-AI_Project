# backend/app/api/auth.py
import os
import json
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from itsdangerous import URLSafeTimedSerializer

import pg8000
from fastapi import APIRouter, HTTPException, Depends, Query, Request, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel

# ── Import des services email ─────────────────────────────────────────
from app.services.email_service import (
    generate_verification_token,
    verify_token,
    send_verification_email,
    send_admin_notification,
    send_approval_email
)

# ── Config ─────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "NHYaObD1k8ToXe0RY9SydM44etphnUUpGHWfcX1vKwI")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# ========== CRÉATION DU SERIALIZER ==========
serializer = URLSafeTimedSerializer(SECRET_KEY)

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

# Dossier pour les avatars
AVATAR_DIR = Path("uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

# Hachage simple pour les tests
def hash_password(password: str) -> str:
    return password

def verify_password(plain: str, hashed: str) -> bool:
    return plain == hashed

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
router = APIRouter(prefix="/auth", tags=["auth"])

# ── Domaines valides ────────────────────────────────────────────────
VALID_ROLES = {"Medecin", "Patient", "Administrateur"}
VALID_DOMAINS = {"chest", "lung", "brain", "retina"}

# ── Connexion PostgreSQL ────────────────────────────────────────────
def get_db():
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = False
    return conn

def init_db():
    """Crée la table users avec toutes les colonnes nécessaires"""
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              SERIAL PRIMARY KEY,
            username        VARCHAR(100) UNIQUE NOT NULL,
            email           VARCHAR(255) UNIQUE NOT NULL,
            password        TEXT NOT NULL,
            full_name       TEXT NOT NULL,
            domains         TEXT NOT NULL DEFAULT '[]',
            role            VARCHAR(100) NOT NULL DEFAULT 'Medecin',
            specialty       TEXT NOT NULL DEFAULT '',
            status          VARCHAR(20) NOT NULL DEFAULT 'pending',
            email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
            verification_token TEXT,
            reset_token     TEXT,
            reset_token_expiry TIMESTAMP,
            is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
            phone           VARCHAR(50) DEFAULT '',
            address         TEXT DEFAULT '',
            avatar_url      TEXT DEFAULT NULL,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    conn.commit()

    # Vérifier et ajouter les colonnes manquantes
    columns_to_add = [
        ("phone", "VARCHAR(50) DEFAULT ''"),
        ("address", "TEXT DEFAULT ''"),
        ("avatar_url", "TEXT DEFAULT NULL"),
        ("reset_token", "TEXT DEFAULT NULL"),
        ("reset_token_expiry", "TIMESTAMP DEFAULT NULL"),
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"✅ Colonne {col_name} ajoutée")
        except Exception:
            pass  # La colonne existe déjà
    
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM users")
    count = cur.fetchone()[0]

    if count == 0:
        defaults = [
            ("dr.martin",  "dr.martin@medai.com", "chest123",   "Dr. Martin",     '["chest"]',                       "Medecin", "Radiologie thoracique",      "approved", True, False),
            ("dr.lambert", "dr.lambert@medai.com", "neuro123",   "Dr. Lambert",    '["brain"]',                       "Medecin", "Neurologie et IRM",           "approved", True, False),
            ("dr.benali",  "dr.benali@medai.com",  "lung123",    "Dr. Benali",     '["lung"]',                        "Medecin", "Oncologie pulmonaire",        "approved", True, False),
            ("dr.seddik",  "dr.seddik@medai.com",  "retina123",  "Dr. Seddik",     '["retina"]',                      "Medecin", "Ophtalmologie et Retinopathie","approved", True, False),
            ("admin",      "admin@medai.com",      "admin123",   "Administrateur", '["chest","lung","brain","retina"]', "Administrateur", "Acces complet", "approved", True, True),
            ("patient",    "patient@medai.com",    "patient123", "Ahmed Ben Ali",  '[]',                              "Patient", "", "approved", True, False),
        ]
        for username, email, pw, full_name, domains, role, specialty, st, email_verified, is_admin in defaults:
            cur.execute(
                """INSERT INTO users 
                   (username, email, password, full_name, domains, role, specialty, status, email_verified, is_admin)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (username, email, hash_password(pw), full_name, domains, role, specialty, st, email_verified, is_admin)
            )
        conn.commit()
        print("✅ [Auth] Table users créée avec les comptes par défaut")
    else:
        print(f"✅ [Auth] Table users OK ({count} utilisateurs)")

    cur.close()
    conn.close()


# ── Ajouter les colonnes manquantes au démarrage ─────────────────────
def add_missing_columns():
    """Ajoute les colonnes manquantes à la table users"""
    conn = get_db()
    cur = conn.cursor()
    
    columns_to_add = [
        ("phone", "VARCHAR(50) DEFAULT ''"),
        ("address", "TEXT DEFAULT ''"),
        ("avatar_url", "TEXT DEFAULT NULL"),
        ("reset_token", "TEXT DEFAULT NULL"),
        ("reset_token_expiry", "TIMESTAMP DEFAULT NULL"),
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"✅ Colonne {col_name} ajoutée à la table users")
        except Exception:
            pass  # La colonne existe déjà
    
    conn.commit()
    cur.close()
    conn.close()


# Appeler la fonction d'ajout des colonnes
try:
    add_missing_columns()
except Exception as e:
    print(f"⚠️ Erreur ajout colonnes: {e}")


# ── Utilitaires ─────────────────────────────────────────────────────
def row_to_dict(columns, row) -> dict:
    d = dict(zip(columns, row))
    domains = d.get("domains", "[]")
    if isinstance(domains, str):
        try:
            domains = json.loads(domains)
        except:
            domains = []
    return {
        "id": d["id"],
        "username": d["username"],
        "email": d.get("email", ""),
        "full_name": d["full_name"],
        "name": d["full_name"],
        "domains": domains,
        "role": d["role"],
        "specialty": d["specialty"],
        "status": d["status"],
        "email_verified": bool(d.get("email_verified", False)),
        "is_admin": bool(d.get("is_admin", False)),
        "phone": d.get("phone", ""),
        "address": d.get("address", ""),
        "avatar_url": d.get("avatar_url"),
        "created_at": str(d["created_at"]),
    }

def fetch_one(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None:
        return None
    return row_to_dict(columns, row)

def fetch_one_raw(query: str, params: tuple = ()):
    """Retourne le dict brut avec TOUS les champs"""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None:
        return None
    d = dict(zip(columns, row))
    if isinstance(d.get("domains"), str):
        try:
            d["domains"] = json.loads(d["domains"])
        except:
            d["domains"] = []
    d["is_admin"] = bool(d.get("is_admin", False))
    d["email_verified"] = bool(d.get("email_verified", False))
    return d

def fetch_all(query: str, params: tuple = ()) -> list:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [row_to_dict(columns, r) for r in rows]

def execute(query: str, params: tuple = ()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(query, params)
    conn.commit()
    cur.close()
    conn.close()

def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

# ── Dépendances FastAPI ─────────────────────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise ValueError()
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"}
        )
    row = fetch_one("SELECT * FROM users WHERE username=%s AND status='approved'", (username,))
    if not row:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable ou non approuvé")
    return row

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
    return current_user

# ── Modèles Pydantic ────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    domains: List[str] = []
    specialty: str = ""
    role: str = "Medecin"

class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str
    phone: str = ""
    address: str = ""

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    domains: List[str]
    role: str
    specialty: str
    status: str
    email_verified: bool
    is_admin: bool
    phone: str = ""
    address: str = ""
    avatar_url: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ApproveRequest(BaseModel):
    user_id: int
    action: str
    reason: str = ""

class ApproveResponse(BaseModel):
    message: str
    email_sent: bool
    user_email: str

# ============================================================================
# LOG ADMIN
# ============================================================================

def log_admin_action(action: str, user_id: int, user_email: str, details: str, ip: str = "unknown"):
    """Envoie un log au système d'administration"""
    try:
        execute(
            """INSERT INTO admin_logs (action, user_id, user_email, details, ip_address, created_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            (action, user_id, user_email, details, ip)
        )
    except Exception as e:
        print(f"⚠️ Erreur log admin: {e}")

# ============================================================================
# ROUTES
# ============================================================================

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    row = fetch_one_raw("SELECT * FROM users WHERE username=%s", (form.username,))

    if not row or not verify_password(form.password, row["password"]):
        raise HTTPException(401, detail="Identifiants incorrects.")

    if not row.get("email_verified", False):
        raise HTTPException(403, detail="Veuillez vérifier votre email avant de vous connecter.")

    if row["status"] != "approved":
        raise HTTPException(403, detail="Votre compte est en attente de validation par l'administrateur.")

    token = create_token(row["username"])
    user_data = {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "full_name": row["full_name"],
        "name": row["full_name"],
        "domains": row["domains"],
        "role": row["role"],
        "specialty": row["specialty"],
        "status": row["status"],
        "email_verified": row["email_verified"],
        "is_admin": row["is_admin"],
        "phone": row.get("phone", ""),
        "address": row.get("address", ""),
        "avatar_url": row.get("avatar_url"),
        "created_at": str(row["created_at"]),
    }
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse(**user_data))


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/profile")
async def update_profile(
    profile: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mettre à jour le profil utilisateur"""
    
    # Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
    if profile.email != current_user.get("email"):
        existing = fetch_one(
            "SELECT id FROM users WHERE email = %s AND id != %s",
            (profile.email, current_user["id"])
        )
        if existing:
            raise HTTPException(400, detail="Cet email est déjà utilisé")
    
    # Mettre à jour l'utilisateur
    execute(
        """UPDATE users 
           SET full_name = %s, email = %s, phone = %s, address = %s 
           WHERE id = %s""",
        (profile.full_name, profile.email, profile.phone, profile.address, current_user["id"])
    )
    
    # Retourner l'utilisateur mis à jour
    updated_user = fetch_one_raw("SELECT * FROM users WHERE id = %s", (current_user["id"],))
    
    return {
        "id": updated_user["id"],
        "username": updated_user["username"],
        "email": updated_user["email"],
        "full_name": updated_user["full_name"],
        "name": updated_user["full_name"],
        "domains": updated_user["domains"],
        "role": updated_user["role"],
        "specialty": updated_user["specialty"],
        "status": updated_user["status"],
        "email_verified": updated_user["email_verified"],
        "is_admin": updated_user["is_admin"],
        "phone": updated_user.get("phone", ""),
        "address": updated_user.get("address", ""),
        "avatar_url": updated_user.get("avatar_url"),
        "created_at": str(updated_user["created_at"])
    }


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Changer le mot de passe de l'utilisateur"""
    
    # Vérifier l'ancien mot de passe
    user = fetch_one_raw("SELECT * FROM users WHERE id = %s", (current_user["id"],))
    if not user or not verify_password(data.current_password, user["password"]):
        raise HTTPException(400, detail="Mot de passe actuel incorrect")
    
    # Vérifier la longueur du nouveau mot de passe
    if len(data.new_password) < 6:
        raise HTTPException(400, detail="Le nouveau mot de passe doit contenir au moins 6 caractères")
    
    # Mettre à jour le mot de passe
    execute(
        "UPDATE users SET password = %s WHERE id = %s",
        (hash_password(data.new_password), current_user["id"])
    )
    
    return {"message": "Mot de passe modifié avec succès"}

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Uploader un avatar pour l'utilisateur"""
    
    # Vérifier le type de fichier
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Le fichier doit être une image (JPG, PNG, GIF, WEBP)")
    
    # Lire le contenu du fichier
    contents = await file.read()
    
    # Vérifier la taille (max 5MB)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, detail="L'image ne doit pas dépasser 5 Mo")
    
    # Déterminer l'extension
    content_type = file.content_type
    if "jpeg" in content_type or "jpg" in content_type:
        ext = ".jpg"
    elif "png" in content_type:
        ext = ".png"
    elif "gif" in content_type:
        ext = ".gif"
    elif "webp" in content_type:
        ext = ".webp"
    else:
        ext = ".jpg"
    
    # Générer un nom de fichier unique
    filename = f"avatar_{current_user['id']}_{int(datetime.now().timestamp())}{ext}"
    dest = AVATAR_DIR / filename
    
    # Sauvegarder le fichier
    try:
        with open(dest, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(500, detail=f"Erreur lors de la sauvegarde: {str(e)}")
    
    # Supprimer l'ancien avatar s'il existe
    try:
        old_user = fetch_one_raw("SELECT avatar_url FROM users WHERE id = %s", (current_user["id"],))
        if old_user and old_user.get("avatar_url"):
            old_path = Path(old_user["avatar_url"].lstrip("/"))
            if old_path.exists():
                old_path.unlink()
    except Exception:
        pass
    
    # Mettre à jour l'utilisateur
    avatar_url = f"/uploads/avatars/{filename}"
    try:
        execute(
            "UPDATE users SET avatar_url = %s WHERE id = %s",
            (avatar_url, current_user["id"])
        )
    except Exception as e:
        # Si la colonne n'existe pas, l'ajouter
        if "column" in str(e).lower() and "does not exist" in str(e).lower():
            conn = get_db()
            cur = conn.cursor()
            try:
                cur.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL")
                conn.commit()
                print("✅ Colonne avatar_url ajoutée")
            except Exception:
                pass
            finally:
                cur.close()
                conn.close()
            
            # Réessayer la mise à jour
            execute(
                "UPDATE users SET avatar_url = %s WHERE id = %s",
                (avatar_url, current_user["id"])
            )
        else:
            raise
    
    return {"avatar_url": avatar_url}

@router.delete("/avatar")
async def delete_avatar(current_user: dict = Depends(get_current_user)):
    """Supprimer l'avatar de l'utilisateur"""
    
    # Récupérer l'avatar actuel
    user = fetch_one_raw("SELECT avatar_url FROM users WHERE id = %s", (current_user["id"],))
    
    if user and user.get("avatar_url"):
        old_path = Path(user["avatar_url"].lstrip("/"))
        if old_path.exists():
            try:
                old_path.unlink()
            except Exception:
                pass
    
    # Supprimer la référence en base
    execute(
        "UPDATE users SET avatar_url = NULL WHERE id = %s",
        (current_user["id"],)
    )
    
    return {"message": "Avatar supprimé avec succès"}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Envoie un email de réinitialisation de mot de passe"""
    
    # Vérifier si l'email existe
    user = fetch_one_raw("SELECT * FROM users WHERE email=%s", (req.email,))
    if not user:
        return {"message": "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation."}
    
    # Générer un token
    reset_token = serializer.dumps(req.email, salt="password-reset")
    
    # Stocker le token dans la base
    execute(
        "UPDATE users SET reset_token=%s, reset_token_expiry=NOW() + INTERVAL '1 HOUR' WHERE email=%s",
        (reset_token, req.email)
    )
    
    # Envoyer l'email
    from app.services.email_service import send_reset_password_email
    email_sent = send_reset_password_email(req.email, reset_token, user["full_name"])
    
    if not email_sent:
        print(f"Erreur envoi email reset à {req.email}")
    
    return {"message": "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Réinitialise le mot de passe avec le token"""
    
    # Vérifier le token
    try:
        email = serializer.loads(req.token, salt="password-reset", max_age=3600)
    except Exception:
        raise HTTPException(400, detail="Lien invalide ou expiré.")
    
    # Vérifier la longueur du mot de passe
    if len(req.new_password) < 6:
        raise HTTPException(400, detail="Le mot de passe doit contenir au moins 6 caractères.")
    
    # Vérifier si l'utilisateur existe
    user = fetch_one_raw("SELECT * FROM users WHERE email=%s", (email,))
    if not user:
        raise HTTPException(404, detail="Utilisateur non trouvé.")
    
    # Vérifier le token stocké
    if user.get("reset_token") != req.token:
        raise HTTPException(400, detail="Token invalide.")
    
    if user.get("reset_token_expiry") and user["reset_token_expiry"] < datetime.now():
        raise HTTPException(400, detail="Lien expiré.")
    
    # Mettre à jour le mot de passe
    execute(
        "UPDATE users SET password=%s, reset_token=NULL, reset_token_expiry=NULL WHERE email=%s",
        (hash_password(req.new_password), email)
    )
    
    # Envoyer une confirmation
    from app.services.email_service import send_password_changed_confirmation
    send_password_changed_confirmation(email, user["full_name"])
    
    return {"message": "Mot de passe réinitialisé avec succès."}


@router.post("/register", status_code=201)
async def register(req: RegisterRequest):
    # Validation email
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, req.email):
        raise HTTPException(400, detail="Email invalide.")

    if not req.username or not req.password or not req.full_name:
        raise HTTPException(400, detail="Tous les champs obligatoires sont requis.")
    if len(req.password) < 6:
        raise HTTPException(400, detail="Mot de passe trop court (minimum 6 caractères).")

    # Vérifier si email existe déjà
    existing_email = fetch_one("SELECT id FROM users WHERE email=%s", (req.email,))
    if existing_email:
        raise HTTPException(409, detail="Cet email est déjà utilisé.")

    # Vérifier si username existe déjà
    existing_username = fetch_one("SELECT id FROM users WHERE username=%s", (req.username,))
    if existing_username:
        raise HTTPException(409, detail="Ce nom d'utilisateur est déjà pris.")

    role = req.role if req.role in VALID_ROLES else "Medecin"

    if role == "Medecin":
        if not req.domains:
            raise HTTPException(400, detail="Sélectionnez au moins un domaine médical.")
        invalid_domains = [d for d in req.domains if d not in VALID_DOMAINS]
        if invalid_domains:
            raise HTTPException(400, detail=f"Domaine(s) invalide(s) : {', '.join(invalid_domains)}")
        domains = json.dumps(req.domains)
        status = "pending"
    else:
        domains = "[]"
        status = "pending"

    # Générer token de vérification
    verification_token = generate_verification_token(req.email)

    execute(
        """INSERT INTO users 
           (username, email, password, full_name, domains, role, specialty, status, email_verified, verification_token, is_admin)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,FALSE,%s,FALSE)""",
        (req.username, req.email, hash_password(req.password), req.full_name,
         domains, role, req.specialty, status, verification_token)
    )

    # Envoyer email de vérification
    email_sent = send_verification_email(req.email, verification_token, req.full_name)

    if not email_sent:
        print(f"⚠️ Email non envoyé à {req.email}")

    if role == "Patient":
        return {
            "message": "Un email de vérification a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte.",
            "email_sent": email_sent
        }
    else:
        return {
            "message": "Un email de vérification a été envoyé à votre adresse. Après vérification, votre demande sera soumise à l'approbation de l'administrateur.",
            "email_sent": email_sent
        }


@router.get("/verify-email")
async def verify_email(token: str):
    """Vérifie le token d'email"""
    email = verify_token(token)
    if not email:
        raise HTTPException(400, detail="Lien invalide ou expiré.")
    
    user = fetch_one_raw("SELECT * FROM users WHERE email=%s", (email,))
    if not user:
        raise HTTPException(404, detail="Utilisateur non trouvé.")
    
    if user.get("email_verified"):
        return {"success": True, "message": "Email déjà vérifié. Vous pouvez vous connecter.", "redirect": "/login"}
    
    # Activer le compte
    execute("UPDATE users SET email_verified=TRUE, verification_token=NULL WHERE email=%s", (email,))
    
    # Notifier l'admin pour les médecins
    if user["role"] == "Medecin":
        admin_email = os.getenv("ADMIN_EMAIL", "admin@medai.com")
        send_admin_notification(admin_email, user["full_name"], email, user.get("specialty", ""))
    
    return {"success": True, "message": "Email vérifié avec succès !", "redirect": "/login"}


@router.get("/users", dependencies=[Depends(require_admin)])
async def get_all_users():
    return fetch_all("SELECT * FROM users ORDER BY created_at DESC")


@router.get("/pending", dependencies=[Depends(require_admin)])
async def get_pending():
    """Récupère tous les utilisateurs en attente de validation"""
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM users 
        WHERE status = 'pending' 
        ORDER BY created_at DESC
    """)
    columns = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    users = []
    for row in rows:
        d = dict(zip(columns, row))
        if isinstance(d.get("domains"), str):
            try:
                d["domains"] = json.loads(d["domains"])
            except:
                d["domains"] = []
        d["is_admin"] = bool(d.get("is_admin", False))
        d["email_verified"] = bool(d.get("email_verified", False))
        users.append(d)
    
    return users


@router.post("/approve", dependencies=[Depends(require_admin)], response_model=ApproveResponse)
async def approve(
    req: ApproveRequest, 
    request: Request, 
    current_user: dict = Depends(require_admin)
):
    """Approuve ou refuse un utilisateur"""
    if req.action not in ("approve", "reject"):
        raise HTTPException(400, detail="Action invalide. Utilisez 'approve' ou 'reject'.")

    row = fetch_one_raw("SELECT * FROM users WHERE id=%s", (req.user_id,))
    if not row:
        raise HTTPException(404, detail="Utilisateur introuvable.")

    if row.get("is_admin"):
        raise HTTPException(403, detail="Impossible de modifier un administrateur.")

    new_status = "approved" if req.action == "approve" else "rejected"
    execute("UPDATE users SET status=%s WHERE id=%s", (new_status, req.user_id))

    label = "approuvé" if req.action == "approve" else "refusé"
    print(f"[Admin] Utilisateur {row['email']} {label}")

    # Envoyer email de notification
    email_sent = False
    try:
        email_sent = send_approval_email(
            to_email=row["email"],
            full_name=row["full_name"],
            approved=(req.action == "approve"),
            reason=req.reason,
            role=row["role"]
        )
    except Exception as e:
        print(f"[Email] Exception: {e}")

    # Log admin
    client_ip = request.client.host if request.client else "unknown"
    action_type = "user.approved" if req.action == "approve" else "user.rejected"
    log_details = f"Utilisateur {row['email']} ({row['full_name']}) {label}"
    if req.action == "reject" and req.reason:
        log_details += f" - Motif: {req.reason}"
    
    log_admin_action(
        action=action_type,
        user_id=current_user["id"],
        user_email=current_user.get("email", ""),
        details=log_details,
        ip=client_ip
    )

    return ApproveResponse(
        message=f"{row['full_name']} {label} avec succès.",
        email_sent=email_sent,
        user_email=row["email"]
    )


@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: int):
    row = fetch_one("SELECT * FROM users WHERE id=%s", (user_id,))
    if not row:
        raise HTTPException(404, detail="Utilisateur introuvable.")
    if row.get("is_admin"):
        raise HTTPException(403, detail="Impossible de supprimer un administrateur.")
    execute("DELETE FROM users WHERE id=%s", (user_id,))
    return {"message": "Utilisateur supprimé."}


@router.delete("/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Supprimer son propre compte"""
    if current_user.get("is_admin"):
        raise HTTPException(403, detail="Les administrateurs ne peuvent pas supprimer leur compte via cette route.")
    
    # Supprimer l'avatar s'il existe
    if current_user.get("avatar_url"):
        avatar_path = Path(current_user["avatar_url"].lstrip("/"))
        if avatar_path.exists():
            try:
                avatar_path.unlink()
            except Exception:
                pass
    
    execute("DELETE FROM users WHERE id = %s", (current_user["id"],))
    return {"message": "Compte supprimé avec succès"}

@router.post("/signature")
async def upload_signature(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Uploader une signature manuscrite (PNG transparent recommandé)"""
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Le fichier doit être une image")
    
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(400, detail="L'image ne doit pas dépasser 2 Mo")
    
    ext = ".png" if "png" in file.content_type else ".jpg"
    filename = f"signature_{current_user['id']}_{int(datetime.now().timestamp())}{ext}"
    dest = AVATAR_DIR / filename  # ou créez un dossier signatures/
    
    with open(dest, "wb") as f:
        f.write(contents)
    
    signature_url = f"/uploads/avatars/{filename}"
    execute("UPDATE users SET signature_url = %s WHERE id = %s", (signature_url, current_user["id"]))
    
    return {"signature_url": signature_url}   

class SignatureTextRequest(BaseModel):
    signature_text: str

@router.put("/signature-text")
async def update_signature_text(
    req: SignatureTextRequest,
    current_user: dict = Depends(get_current_user)
):
    """Met à jour la signature texte du médecin"""
    if len(req.signature_text) > 100:
        raise HTTPException(400, detail="La signature ne doit pas dépasser 100 caractères")
    
    execute(
        "UPDATE users SET signature_text = %s WHERE id = %s",
        (req.signature_text, current_user["id"])
    )
    return {"message": "Signature enregistrée", "signature_text": req.signature_text}