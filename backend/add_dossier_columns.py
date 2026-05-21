# backend/add_dossier_columns.py
import pg8000
import os

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB = os.getenv("PG_DB", "medai")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = os.getenv("PG_PASS", "cccc123!")

def add_missing_columns():
    conn = pg8000.connect(
        host=PG_HOST, port=PG_PORT,
        database=PG_DB, user=PG_USER, password=PG_PASS
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    # Ajouter les colonnes une par une
    columns = [
        ("taille", "VARCHAR(10) DEFAULT ''"),
        ("poids", "VARCHAR(10) DEFAULT ''"),
        ("imc", "VARCHAR(10) DEFAULT ''"),
    ]
    
    for col_name, col_type in columns:
        try:
            cur.execute(f"ALTER TABLE dossiers ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
            print(f"✅ Colonne {col_name} ajoutée avec succès")
        except Exception as e:
            print(f"⚠️ Erreur pour {col_name}: {e}")
    
    # Vérifier la structure
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'dossiers' 
        ORDER BY ordinal_position
    """)
    
    print("\n📋 Structure de la table dossiers après mise à jour:")
    for row in cur.fetchall():
        print(f"   - {row[0]}: {row[1]}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    add_missing_columns()