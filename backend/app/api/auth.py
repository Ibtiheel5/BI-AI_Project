# app/api/auth.py — version avec rôle Patient

import os
import json
from datetime import datetime, timedelta
from typing import List, Optional

import pg8000
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# ── Config ─────────────────────────────────────────────────────────
SECRET_KEY                  = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
ALGORITHM                   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB",   "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
router        = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"Medecin", "Patient", "Administrateur"}

# ── Connexion PostgreSQL ────────────────────────────────────────────
def get_db():
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = False
    return conn

def init_db():
    """Crée la table users et insère les comptes par défaut."""
    conn = get_db()
    cur  = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         SERIAL PRIMARY KEY,
            username   VARCHAR(100) UNIQUE NOT NULL,
            password   TEXT NOT NULL,
            full_name  TEXT NOT NULL,
            domains    TEXT NOT NULL DEFAULT '[]',
            role       VARCHAR(100) NOT NULL DEFAULT 'Medecin',
            specialty  TEXT NOT NULL DEFAULT '',
            status     VARCHAR(20) NOT NULL DEFAULT 'pending',
            is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM users")
    count = cur.fetchone()[0]

    if count == 0:
        defaults = [
            # (username, password, full_name, domains, role, specialty, status, is_admin)
            ("dr.martin",  "chest123",   "Dr. Martin",     '["chest"]',                "Medecin",        "Radiologie thoracique", "approved", False),
            ("dr.lambert", "neuro123",   "Dr. Lambert",    '["brain"]',                "Medecin",        "Neurologie et IRM",     "approved", False),
            ("dr.benali",  "lung123",    "Dr. Benali",     '["lung"]',                 "Medecin",        "Oncologie pulmonaire",  "approved", False),
            ("admin",      "admin123",   "Administrateur", '["chest","lung","brain"]', "Administrateur", "Acces complet",         "approved", True),
            ("patient",    "patient123", "Ahmed Ben Ali",  '[]',                       "Patient",        "",                      "approved", False),
        ]
        for username, pw, full_name, domains, role, specialty, st, is_admin in defaults:
            cur.execute(
                "INSERT INTO users (username,password,full_name,domains,role,specialty,status,is_admin) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (username, pwd_context.hash(pw), full_name, domains, role, specialty, st, is_admin)
            )
        conn.commit()
        print("✅ [Auth] Table users créée avec les comptes par défaut (+ patient).")
    else:
        # Vérifier si le compte patient existe, sinon l'ajouter
        cur.execute("SELECT id FROM users WHERE username='patient'")
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (username,password,full_name,domains,role,specialty,status,is_admin) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                ("patient", pwd_context.hash("patient123"), "Ahmed Ben Ali", "[]", "Patient", "", "approved", False)
            )
            conn.commit()
            print("✅ [Auth] Compte patient par défaut ajouté.")
        print(f"✅ [Auth] Table users OK ({count} utilisateurs)")

    cur.close()
    conn.close()

# ── Utilitaires ─────────────────────────────────────────────────────
def row_to_dict(columns, row) -> dict:
    d = dict(zip(columns, row))
    domains = d.get("domains", "[]")
    if isinstance(domains, str):
        domains = json.loads(domains)
    return {
        "id":         d["id"],
        "username":   d["username"],
        "password":   d["password"],
        "full_name":  d["full_name"],
        "name":       d["full_name"],
        "domains":    domains,
        "role":       d["role"],
        "specialty":  d["specialty"],
        "status":     d["status"],
        "is_admin":   bool(d["is_admin"]),
        "created_at": str(d["created_at"]),
    }

def create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": username, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def fetch_one(query: str, params: tuple = ()):
    conn = get_db()
    cur  = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    row = cur.fetchone()
    cur.close(); conn.close()
    if row is None:
        return None
    return row_to_dict(columns, row)

def fetch_all(query: str, params: tuple = ()) -> list:
    conn = get_db()
    cur  = conn.cursor()
    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description] if cur.description else []
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [row_to_dict(columns, r) for r in rows]

def execute(query: str, params: tuple = ()):
    conn = get_db()
    cur  = conn.cursor()
    cur.execute(query, params)
    conn.commit()
    cur.close(); conn.close()

# ── Dépendances FastAPI ─────────────────────────────────────────────
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
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
    username:  str
    password:  str
    full_name: str
    domains:   List[str]
    specialty: str = ""
    role:      str = "Medecin"   # ← nouveau champ : "Medecin" | "Patient"

class ApproveRequest(BaseModel):
    user_id: int
    action:  str  # "approve" | "reject"

class UserResponse(BaseModel):
    id:         int
    username:   str
    full_name:  str
    domains:    List[str]
    role:       str
    specialty:  str
    status:     str
    is_admin:   bool
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    user:         UserResponse

# ── Routes ──────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    row = fetch_one("SELECT * FROM users WHERE username=%s", (form.username,))

    if not row or not pwd_context.verify(form.password, row["password"]):
        raise HTTPException(401, detail="Identifiants incorrects.")
    if row["status"] == "pending":
        raise HTTPException(403, detail="Votre compte est en attente de validation par un administrateur.")
    if row["status"] == "rejected":
        raise HTTPException(403, detail="Votre demande d'accès a été refusée.")

    token = create_token(row["username"])
    return TokenResponse(access_token=token, token_type="bearer", user=UserResponse(**row))


@router.post("/register", status_code=201)
async def register(req: RegisterRequest):
    # Validations communes
    if not req.username or not req.password or not req.full_name:
        raise HTTPException(400, detail="Tous les champs obligatoires sont requis.")
    if len(req.password) < 6:
        raise HTTPException(400, detail="Mot de passe trop court (minimum 6 caractères).")

    # Validation rôle
    role = req.role if req.role in VALID_ROLES else "Medecin"

    # Validation domaines — obligatoire seulement pour les médecins
    if role == "Medecin":
        if not req.domains:
            raise HTTPException(400, detail="Sélectionnez au moins un domaine médical.")
        if not all(d in {"chest", "lung", "brain"} for d in req.domains):
            raise HTTPException(400, detail="Domaine invalide.")
        domains = json.dumps(req.domains)
        status  = "pending"   # médecin → validation admin requise
    else:
        # Patient → pas de domaine requis, compte approuvé directement
        domains = "[]"
        status  = "approved"

    if fetch_one("SELECT id FROM users WHERE username=%s", (req.username,)):
        raise HTTPException(409, detail="Ce nom d'utilisateur est déjà pris.")

    execute(
        "INSERT INTO users (username,password,full_name,domains,role,specialty,status,is_admin) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,FALSE)",
        (req.username, pwd_context.hash(req.password), req.full_name, domains, role, req.specialty, status)
    )

    if role == "Patient":
        return {"message": "Compte patient créé avec succès. Vous pouvez vous connecter."}
    else:
        return {"message": "Demande envoyée. Un administrateur validera votre compte."}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.get("/users", dependencies=[Depends(require_admin)])
async def get_all_users():
    return fetch_all("SELECT * FROM users ORDER BY created_at DESC")


@router.get("/pending", dependencies=[Depends(require_admin)])
async def get_pending():
    return fetch_all("SELECT * FROM users WHERE status='pending' ORDER BY created_at DESC")


@router.post("/approve", dependencies=[Depends(require_admin)])
async def approve(req: ApproveRequest):
    if req.action not in ("approve", "reject"):
        raise HTTPException(400, detail="Action invalide.")
    row = fetch_one("SELECT * FROM users WHERE id=%s", (req.user_id,))
    if not row:
        raise HTTPException(404, detail="Utilisateur introuvable.")
    new_status = "approved" if req.action == "approve" else "rejected"
    execute("UPDATE users SET status=%s WHERE id=%s", (new_status, req.user_id))
    label = "approuvé" if req.action == "approve" else "refusé"
    return {"message": f"{row['full_name']} {label} avec succès."}


@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: int):
    row = fetch_one("SELECT * FROM users WHERE id=%s", (user_id,))
    if not row:
        raise HTTPException(404, detail="Utilisateur introuvable.")
    if row["is_admin"]:
        raise HTTPException(403, detail="Impossible de supprimer un administrateur.")
    execute("DELETE FROM users WHERE id=%s", (user_id,))
    return {"message": "Utilisateur supprimé."}