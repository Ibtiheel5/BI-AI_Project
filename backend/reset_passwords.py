"""
Script à exécuter sur votre machine pour réinitialiser les mots de passe.
Placez ce fichier dans le dossier backend/ et exécutez :
    python reset_passwords.py
"""
import os
import sys

# Essayer de charger python-dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB",   "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

USERS = [
    ("dr.martin",  "chest123",   "Dr. Martin",     '["chest"]',                        "Medecin",        "Radiologie thoracique",       "approved", False),
    ("dr.lambert", "neuro123",   "Dr. Lambert",     '["brain"]',                        "Medecin",        "Neurologie et IRM",            "approved", False),
    ("dr.benali",  "lung123",    "Dr. Benali",      '["lung"]',                         "Medecin",        "Oncologie pulmonaire",         "approved", False),
    ("dr.seddik",  "retina123",  "Dr. Seddik",      '["retina"]',                       "Medecin",        "Ophtalmologie et Retinopathie","approved", False),
    ("admin",      "admin123",   "Administrateur",  '["chest","lung","brain","retina"]', "Administrateur", "Acces complet",                "approved", True),
    ("patient",    "patient123", "Ahmed Ben Ali",   '[]',                               "Patient",        "",                             "approved", False),
]

try:
    import pg8000
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = False
    cur = conn.cursor()

    print(f"✅ Connecté à PostgreSQL — DB: {PG_DB}")
    print()

    # Créer la table si elle n'existe pas
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
    print("✅ Table users vérifiée")

    # Afficher l'état actuel
    cur.execute("SELECT username, password, role, status FROM users ORDER BY id")
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    print("\n=== ÉTAT ACTUEL DE LA BASE ===")
    for row in rows:
        d = dict(zip(cols, row))
        print(f"  {d['username']:15} | pwd='{d['password']:20}' | {d['role']:15} | {d['status']}")

    print("\n=== RÉINITIALISATION DES COMPTES ===")
    for username, password, full_name, domains, role, specialty, status, is_admin in USERS:
        # Vérifier si l'utilisateur existe
        cur.execute("SELECT id FROM users WHERE username=%s", (username,))
        existing = cur.fetchone()

        if existing:
            # Mettre à jour le mot de passe en clair
            cur.execute(
                "UPDATE users SET password=%s, full_name=%s, domains=%s, role=%s, specialty=%s, status=%s, is_admin=%s WHERE username=%s",
                (password, full_name, domains, role, specialty, status, is_admin, username)
            )
            print(f"  ✅ {username:15} → mot de passe mis à jour: '{password}'")
        else:
            # Insérer le nouvel utilisateur
            cur.execute(
                "INSERT INTO users (username, password, full_name, domains, role, specialty, status, is_admin) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (username, password, full_name, domains, role, specialty, status, is_admin)
            )
            print(f"  ➕ {username:15} → créé avec mot de passe: '{password}'")

    conn.commit()

    # Vérification finale
    print("\n=== VÉRIFICATION FINALE ===")
    cur.execute("SELECT username, password, role, status FROM users ORDER BY id")
    rows = cur.fetchall()
    for row in rows:
        d = dict(zip(cols, row))
        print(f"  {d['username']:15} | pwd='{d['password']:20}' | {d['role']:15} | {d['status']}")

    cur.close()
    conn.close()
    print("\n✅ Reset terminé avec succès!")
    print("\n📋 Comptes disponibles:")
    for username, password, _, _, role, _, _, _ in USERS:
        print(f"  {username:15} / {password:15} → {role}")

except ImportError:
    print("❌ pg8000 non installé. Lancez: pip install pg8000")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)