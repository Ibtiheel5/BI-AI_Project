"""
app/services/symptom_analyzer.py

Analyseur de symptomes multi-tour avec support d'image.

Flux complet :
  1. Patient decrit ses symptomes en langage naturel (texte)
  2. Le patient peut joindre une image medicale (optionnel)
  3. L'analyseur determine automatiquement le modele IA adapte
     - par mots-cles sur le texte (score pondere)
     - par analyse couleur/contraste de l'image si fournie
  4. Les medecins recommandes sont UNIQUEMENT ceux enregistres
     dans la table `users` (role Medecin, statut approved,
     domaine correspondant). Le JSON externe sert de fallback
     seulement si aucun medecin DB n'est trouve.
  5. La reponse finale inclut :
     - model_key detecte
     - score de confiance de la detection
     - medecins DB tries par charge de travail puis distance
     - flag d'urgence si symptome critique detecte
"""

import re
import json
import os
import io
import math
import unicodedata
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# ══════════════════════════════════════════════════════════════════
# CONFIGURATION : SYMPTOMES → MODELE IA
# ══════════════════════════════════════════════════════════════════

SYMPTOM_CATEGORIES: Dict[str, Dict] = {
    "chest": {
        "keywords": [
            # Toux et respiration
            "toux", "tousse", "toussez", "tousser", "toussait", "toussent",
            "expectoration", "expectorations", "crachat", "crache", "cracher",
            "crachait", "crachements",
            "essoufflement", "essouffle", "essoufflee", "essouffle",
            "dyspnee", "dyspnee", "respire", "respiration", "respiratoire",
            "respiratoires", "respirer", "respirait", "respiratoire",
            # Poitrine / thorax
            "oppression thoracique", "oppression", "opprime", "opprimee",
            "douleur thoracique", "douleurs thoraciques", "poitrine",
            "thorax", "thoracique", "thoraciques",
            "douleur quand je respire", "douleur en respirant",
            "douleur a la respiration", "douleur en inspirant",
            # Sifflements
            "sifflement", "siffle", "sifflements", "wheezing",
            # Infections respiratoires
            "covid", "coronavirus", "pneumonie", "pneumonies",
            "bronchite", "bronchites", "pneumopathie", "pneumopathies",
            # Cardiaque
            "palpitation", "palpite", "palpitations", "tachycardie",
            "douleur coeur", "angine", "infarctus",
            # Oedeme
            "oedeme", "oedeme", "oedemes", "oedemes",
            "gonflement jambes", "gonfle", "gonfle", "gonflee",
            "souffle court", "souffle court",
            # Symptomes generaux associes aux infections respiratoires
            "fievre", "fievre", "fievres", "fievres", "forte fievre",
            "temperature", "temperature", "febrile", "febrile",
            "fatigue", "fatigue", "fatigues", "asthenie", "asthenie",
            "maux de tete", "maux de tete", "cephalee", "cephalee", "mal de tete",
            "mal a la tete", "migraine", "migraines",
            "frisson", "frissons", "transpiration", "sueurs",
        ],
        "strong_keywords": [
            "radiographie thoracique", "radio poumons", "rx thorax",
            "chest x-ray", "pneumothorax", "pleuresie", "pleuresie",
            "pneumonie", "pneumonies", "covid", "coronavirus",
            "toux seche", "toux seche", "toux grasse",
            "douleur quand je respire", "douleur en respirant",
            "oppression thoracique", "essoufflement",
        ],
        "urgency_triggers": [
            "douleur thoracique", "oppression", "infarctus",
            "essoufflement severe", "essoufflement severe",
            "covid", "pneumothorax", "forte fievre", "fievre elevee",
            "dyspnee", "dyspnee", "souffle court",
        ],
        "model_key": "chest",
        "model_name": "Radiographie thoracique (Chest X-Ray)",
        "model_icon": "L",
        "specialites": ["Cardiologue", "Infectiologue", "Pneumologue", "Radiologue"],
        "domains_db": ["chest"],
        "description": (
            "Une radiographie thoracique permet d'analyser vos poumons, "
            "votre coeur et votre cage thoracique pour detecter pneumonies, "
            "epanchements et anomalies cardiaques."
        ),
    },
    "lung": {
        "keywords": [
            "masse", "grosseur", "boule", "kyste",
            "perte de poids", "amaigrissement", "maigrir",
            "crachat sang", "hemoptysie", "cracher sang",
            "douleur persistante", "douleur thorax",
            "tabac", "fumeur", "fume", "cigarette",
            "cancer", "tumeur", "metastase",
            "nodule", "lesion", "anomalie scanner",
            "suivi oncologique", "chimio", "chimiotherapie",
        ],
        "strong_keywords": [
            "scanner ct", "scanner pulmonaire", "tdm thoracique",
            "lung ct", "carcinome", "adenocarcinome",
        ],
        "urgency_triggers": [
            "crachat sang", "hemoptysie", "perte de poids rapide", "masse",
        ],
        "model_key": "lung",
        "model_name": "Scanner CT pulmonaire (Lung CT)",
        "model_icon": "S",
        "specialites": ["Pneumologue", "Oncologue", "Carcinologue", "Radiologue"],
        "domains_db": ["lung"],
        "description": (
            "Un scanner CT permet de detecter et de caracteriser precisement "
            "les lesions pulmonaires, nodules et masses suspectes."
        ),
    },
    "brain": {
        "keywords": [
            "maux de tete", "cephalee", "migraine",
            "vertige", "vertiges", "etourdissement",
            "perte de memoire", "oublie", "confusion",
            "convulsion", "epilepsie", "crise epileptique",
            "paralysie", "engourdissement", "fourmillement",
            "faiblesse", "tremblement", "tremble",
            "trouble vision", "vision double", "diplopie",
            "trouble equilibre", "marche instable",
            "tumeur cerveau", "glioblastome", "meningiome",
            "avc", "accident vasculaire", "attaque cerebrale",
            "parole", "elocution", "aphasie",
            "coma", "perte connaissance", "evanouissement",
        ],
        "strong_keywords": [
            "irm cerebrale", "irm cerveau", "brain mri",
            "scanner cerebral", "electroencephalogramme",
        ],
        "urgency_triggers": [
            "convulsion", "avc", "paralysie soudaine",
            "coma", "perte connaissance",
        ],
        "model_key": "brain",
        "model_name": "IRM cerebrale (Brain MRI)",
        "model_icon": "B",
        "specialites": ["Neurologue", "Neurochirurgien", "Radiologue"],
        "domains_db": ["brain"],
        "description": (
            "Une IRM cerebrale permet d'analyser votre cerveau et de detecter "
            "tumeurs, lesions vasculaires et anomalies de structure."
        ),
    },
    "retina": {
        "keywords": [
            "vision floue", "vision trouble", "voit flou",
            "baisse vision", "perte vision", "aveugle",
            "diabete", "diabetique", "glycemie", "sucre",
            "retine", "retinopathie", "fond d'oeil",
            "tache", "mouche volante", "corps flottant",
            "eclair", "flash lumineux",
            "douleur oeil", "oeil rouge", "irritation oeil",
            "secheresse oculaire", "larmoiement",
            "glaucome", "cataracte", "dmla",
            "hypertension", "tension arterielle",
        ],
        "strong_keywords": [
            "fond d'oeil", "fundus", "retinographie",
            "oct retine", "angiographie retinienne",
        ],
        "urgency_triggers": [
            "perte vision soudaine", "eclair", "flash lumineux",
            "vision double",
        ],
        "model_key": "retina",
        "model_name": "Photographie du fond d'oeil (Fundus)",
        "model_icon": "E",
        "specialites": ["Ophtalmologue", "Radiologue"],
        "domains_db": ["retina"],
        "description": (
            "Une photographie du fond d'oeil permet d'evaluer la retine, "
            "les vaisseaux et de detecter la retinopathie diabetique."
        ),
    },
}

# ══════════════════════════════════════════════════════════════════
# UTILITAIRE : NORMALISATION DES ACCENTS
# ══════════════════════════════════════════════════════════════════

def _normalize_text(text: str) -> str:
    """
    Normalise le texte pour la comparaison des mots-cles :
    - Convertit en minuscules
    - Supprime les accents (e -> e, e -> e, etc.)
    - Supprime les caracteres speciaux superflus
    """
    if not text:
        return ""
    # Convertir en minuscules
    text = text.lower()
    # Decomposer les accents (e -> e + ́)
    text = unicodedata.normalize('NFD', text)
    # Supprimer les marques de combinaison (accents)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    # Normaliser a nouveau en NFC
    text = unicodedata.normalize('NFC', text)
    return text


# ══════════════════════════════════════════════════════════════════
# DETECTION DES SALUTATIONS (CORRIGE)
# ══════════════════════════════════════════════════════════════════
# Un message est une salutation UNIQUEMENT s'il ne contient AUCUN symptome

def _is_greeting_only(text_lower: str) -> bool:
    """
    Determine si le texte est UNIQUEMENT une salutation (sans symptomes).
    Retourne True si le texte ne contient aucun mot-cle medical.
    """
    # Normaliser le texte pour la comparaison
    text_normalized = _normalize_text(text_lower)

    # Verifier d'abord s'il y a des mots-cles medicaux (version normalisee)
    for category, config in SYMPTOM_CATEGORIES.items():
        for kw in config["keywords"]:
            if _normalize_text(kw) in text_normalized:
                return False
        for kw in config.get("strong_keywords", []):
            if _normalize_text(kw) in text_normalized:
                return False

    # Si aucun mot-cle medical, verifier si c'est une salutation
    greeting_patterns = [
        r"^\s*(bonjour|salut|bonsoir|coucou|hello|bjr|bsr|slt)\b",
        r"^\s*(comment ca va|ca va|comment allez)\b",
        r"^\s*(merci|thanks|au revoir|bye|adieu|a plus|a\+)\b",
    ]

    for pattern in greeting_patterns:
        if re.search(pattern, text_lower):
            return True

    return False


# ══════════════════════════════════════════════════════════════════
# GEOLOCALISATION
# ══════════════════════════════════════════════════════════════════

CITY_COORDS: Dict[str, Tuple[float, float]] = {
    "Tunis": (36.8065, 10.1815), "Sfax": (34.7398, 10.7600),
    "Sousse": (35.8254, 10.6369), "Ariana": (36.8625, 10.1956),
    "Bizerte": (37.2744, 9.8739), "Monastir": (35.7643, 10.8113),
    "Nabeul": (36.4561, 10.7376), "Ben Arous": (36.7533, 10.2282),
    "Kairouan": (35.6781, 10.0963), "Gabes": (33.8815, 10.0982),
    "Mahdia": (35.5047, 11.0622), "Gafsa": (34.4250, 8.7842),
    "Beja": (36.7256, 9.1817), "Jendouba": (36.5011, 8.7802),
    "Manouba": (36.8101, 10.0956), "Kasserine": (35.1676, 8.8365),
    "Medenine": (33.3540, 10.5055), "Tataouine": (32.9297, 10.4518),
    "Tozeur": (33.9197, 8.1336), "Siliana": (36.0849, 9.3708),
    "Zaghouan": (36.4029, 10.1429), "Le Kef": (36.1747, 8.7049),
    "Sidi Bouzid": (34.4311, 9.4838), "Kebili": (33.7072, 8.9713),
    "Hammam Lif": (36.6661, 10.3145), "La Marsa": (36.8783, 10.3247),
    "Carthage": (36.8530, 10.3220), "El Menzah": (36.8425, 10.1547),
    "Rades": (36.7033, 10.2333),
}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return round(R * 2 * math.asin(math.sqrt(a)), 1)


def detect_model_from_image(image_bytes: bytes) -> Optional[str]:
    """
    Determine le type d'image medicale a partir de ses caracteristiques.
    Couleur -> retina, niveaux de gris -> chest/lung/brain (indetermine).
    """
    try:
        from PIL import Image as PILImage
        img = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
        img_small = img.resize((64, 64))
        import numpy as np
        arr = np.array(img_small, dtype=np.float32)
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
        max_diff = float(max(
            float(((r - g) ** 2).mean() ** 0.5),
            float(((r - b) ** 2).mean() ** 0.5),
            float(((g - b) ** 2).mean() ** 0.5),
        ))
        return "retina" if max_diff > 8.0 else "gray"
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════
# SOURCE 1 — MEDECINS DEPUIS LA BASE DE DONNEES
# ══════════════════════════════════════════════════════════════════

def _get_db_connection():
    import pg8000
    return pg8000.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        database=os.getenv("PG_DB", "medai"),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASS", "cccc123!"),
    )


def find_doctors_from_db(
    domains: List[str],
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    limit: int = 8,
) -> List[Dict]:
    """
    Recherche les medecins enregistres dans la base de donnees
    (role='Medecin', status='approved') dont le domaine correspond.

    Tri : par charge de travail (consultations actives ASC),
          puis par distance si coordonnees GPS fournies.
    """
    try:
        conn = _get_db_connection()
        cur = conn.cursor()

        domain_clauses = " OR ".join([f"u.domains LIKE %s" for _ in domains])
        domain_params = tuple(f'%{d}%' for d in domains)

        query = f"""
            SELECT
                u.id,
                u.full_name,
                u.specialty,
                u.domains,
                u.email,
                u.phone,
                u.address,
                COUNT(c.id) FILTER (
                    WHERE c.status IN ('pending', 'accepted')
                ) AS workload
            FROM users u
            LEFT JOIN consultations c ON c.doctor_id = u.id
            WHERE u.role = 'Medecin'
              AND u.status = 'approved'
              AND ({domain_clauses})
            GROUP BY u.id, u.full_name, u.specialty,
                     u.domains, u.email, u.phone, u.address
            ORDER BY workload ASC
            LIMIT %s
        """

        cur.execute(query, domain_params + (limit * 3,))
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        cur.close()
        conn.close()

        doctors: List[Dict] = []
        for row in rows:
            d = dict(zip(columns, row))

            raw_domains = d.get("domains", "[]")
            if isinstance(raw_domains, str):
                try:
                    d["domains"] = json.loads(raw_domains)
                except Exception:
                    d["domains"] = []

            d["distance_km"] = None
            d["source"] = "db"
            d["ville"] = ""

            if user_lat is not None and user_lon is not None:
                address_lower = (d.get("address") or "").lower()
                for city_name, coords in CITY_COORDS.items():
                    if city_name.lower() in address_lower:
                        d["distance_km"] = haversine(
                            user_lat, user_lon, coords[0], coords[1]
                        )
                        d["ville"] = city_name
                        break

            doctors.append(d)

        if user_lat is not None and user_lon is not None:
            doctors.sort(
                key=lambda x: (
                    x.get("distance_km") if x.get("distance_km") is not None else 9999,
                    x.get("workload", 0),
                )
            )

        return doctors[:limit]

    except Exception as e:
        print(f"[symptom_analyzer] Erreur DB medecins: {e}")
        return []


# ══════════════════════════════════════════════════════════════════
# DETECTION DU MODELE PAR LE TEXTE (CORRIGE AVEC NORMALISATION)
# ══════════════════════════════════════════════════════════════════

def _score_text(text_lower: str) -> Dict[str, Dict]:
    scores: Dict[str, Dict] = {}

    # Normaliser le texte complet pour la comparaison
    text_normalized = _normalize_text(text_lower)

    for category, config in SYMPTOM_CATEGORIES.items():
        score = 0
        matched: List[str] = []
        urgent: List[str] = []

        # Mots-cles normaux (1 point chacun)
        for kw in config["keywords"]:
            kw_normalized = _normalize_text(kw)
            if kw_normalized in text_normalized:
                score += 1
                matched.append(kw)

        # Mots-cles forts (3 points chacun)
        for kw in config.get("strong_keywords", []):
            kw_normalized = _normalize_text(kw)
            if kw_normalized in text_normalized:
                score += 3
                matched.append(kw)

        # Triggers d'urgence
        for trigger in config["urgency_triggers"]:
            trigger_normalized = _normalize_text(trigger)
            if trigger_normalized in text_normalized:
                urgent.append(trigger)

        if score > 0:
            scores[category] = {
                "score": score,
                "matched_keywords": matched,
                "urgency_matches": urgent,
                "config": config,
            }

    return scores


# ══════════════════════════════════════════════════════════════════
# POINT D'ENTREE PRINCIPAL
# ══════════════════════════════════════════════════════════════════

def analyze_symptoms(
    text: str,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    image_bytes: Optional[bytes] = None,
) -> Dict:
    """
    Analyse les symptomes decrits par le patient.

    Returns:
        dict avec :
            type            : "greeting" | "unknown" | "recommendation" | "farewell"
            message         : Texte formate a afficher
            recommendation  : dict modele IA ou None
            doctors         : liste de medecins (DB uniquement)
            model_detected  : cle du modele ou None
            confidence      : score de confiance (0.0 - 1.0)
    """
    text_lower = (text or "").lower().strip()

    # -- Analyse du texte (TOUJOURS en premier) -------------------
    text_scores = _score_text(text_lower)

    # -- Salutation UNIQUEMENT si aucun symptome detecte ----------
    if not text_scores and _is_greeting_only(text_lower):
        return {
            "type": "greeting",
            "message": (
                "Bonjour ! Je suis votre assistant sante.\n\n"
                "Decrivez-moi vos symptomes en quelques phrases. "
                "Vous pouvez aussi joindre une image medicale "
                "(radiographie, scanner, IRM, fond d'oeil) si vous en avez une.\n\n"
                "Je determine automatiquement l'examen le plus adapte "
                "et vous oriente vers les medecins disponibles."
            ),
            "recommendation": None,
            "doctors": [],
            "model_detected": None,
            "confidence": 0.0,
        }

    # -- Analyse de l'image (si fournie) --------------------------
    image_hint: Optional[str] = None
    if image_bytes:
        image_hint = detect_model_from_image(image_bytes)

    # -- Fusion texte + image -------------------------------------
    if image_hint == "retina":
        if "retina" in text_scores:
            text_scores["retina"]["score"] += 5
        else:
            text_scores["retina"] = {
                "score": 5,
                "matched_keywords": ["[image couleur detectee]"],
                "urgency_matches": [],
                "config": SYMPTOM_CATEGORIES["retina"],
            }
    elif image_hint == "gray" and text_scores:
        if "retina" in text_scores and text_scores["retina"]["score"] < 3:
            del text_scores["retina"]

    # -- Aucun symptome detecte -----------------------------------
    if not text_scores:
        no_symptom_msg = (
            "Je n'ai pas detecte de symptome precis dans votre description.\n\n"
            "Pouvez-vous preciser ?\n"
            "- La zone concernee (poitrine, tete, yeux, poumons...)\n"
            "- Le type de gene (douleur, vision floue, essoufflement...)\n"
            "- Depuis combien de temps\n\n"
        )
        if image_bytes and image_hint:
            if image_hint == "retina":
                no_symptom_msg += (
                    "J'ai analyse votre image : elle ressemble a une photographie "
                    "du fond d'oeil - cela confirme l'orientation vers ce type d'examen."
                )
            else:
                no_symptom_msg += (
                    "J'ai analyse votre image : c'est une image medicale en niveaux "
                    "de gris (radio, IRM ou scanner). Decrivez la zone concernee."
                )
        return {
            "type": "unknown",
            "message": no_symptom_msg,
            "recommendation": None,
            "doctors": [],
            "model_detected": None,
            "confidence": 0.0,
        }

    # -- Selection de la meilleure categorie ---------------------
    best_cat = max(text_scores, key=lambda k: text_scores[k]["score"])
    best = text_scores[best_cat]
    config = best["config"]

    # NOUVEAU : calcul de confiance base sur les mots-cles trouves
    matched_keywords_count = len(best["matched_keywords"])
    strong_matched = len([k for k in best["matched_keywords"]
                          if _normalize_text(k) in [_normalize_text(sk) for sk in config.get("strong_keywords", [])]])

    # Base : chaque mot-cle trouve vaut ~15%, strong vaut bonus 10% supplementaire
    raw_confidence = min(
        (matched_keywords_count * 0.15) + (strong_matched * 0.10),
        0.95
    )

    # Bonus image
    if image_hint == "retina" and best_cat == "retina":
        raw_confidence = min(raw_confidence + 0.15, 1.0)
    elif image_hint == "gray" and best_cat in ("chest", "lung", "brain"):
        raw_confidence = min(raw_confidence + 0.10, 1.0)

    # Minimum de confiance si on a trouve des symptomes clairs
    raw_confidence = max(raw_confidence, 0.25)  # Au moins 25% si symptomes detectes

    urgency_detected = bool(best["urgency_matches"])

    # -- Recherche de medecins UNIQUEMENT dans la DB --------------
    doctors: List[Dict] = find_doctors_from_db(
        domains=config["domains_db"],
        user_lat=user_lat,
        user_lon=user_lon,
        limit=6,
    )

    # -- Construction du message ----------------------------------
    matched_str = ", ".join(best["matched_keywords"][:6])
    if len(best["matched_keywords"]) > 6:
        matched_str += "..."

    urgency_block = ""
    if urgency_detected:
        urgency_block = (
            f"\n\n**Attention** - Symptomes necessitant une consultation rapide : "
            f"{', '.join(best['urgency_matches'])}."
        )

    image_block = ""
    if image_bytes:
        if image_hint == "retina":
            image_block = (
                "\n\nVotre image a ete identifiee comme une **photographie du fond d'oeil** "
                "- cela confirme l'orientation vers ce type d'examen."
            )
        elif image_hint == "gray":
            image_block = (
                "\n\nVotre image a ete identifiee comme une **image medicale en niveaux "
                "de gris** (radiographie, IRM ou scanner)."
            )

    confidence_label = (
        "elevee" if raw_confidence >= 0.6
        else "moyenne" if raw_confidence >= 0.3
        else "faible"
    )

    doctors_block = _format_doctors_block(doctors, config["specialites"])

    message = (
        f"**Analyse de vos symptomes**\n\n"
        f"Symptomes detectes : {matched_str}\n\n"
        f"---\n\n"
        f"**Examen recommande**\n\n"
        f"{config['model_icon']} {config['model_name']}\n\n"
        f"{config['description']}\n\n"
        f"*Confiance de la detection : {confidence_label} "
        f"({int(raw_confidence * 100)} %)*"
        f"{image_block}"
        f"{urgency_block}"
        f"{doctors_block}"
    )

    return {
        "type": "recommendation",
        "message": message,
        "recommendation": {
            "model_key": config["model_key"],
            "model_name": config["model_name"],
            "model_icon": config["model_icon"],
            "specialites": config["specialites"],
            "domains_db": config["domains_db"],
            "score": best["score"],
            "matched_keywords": best["matched_keywords"],
            "urgency": urgency_detected,
            "urgency_matches": best["urgency_matches"],
            "confidence": round(raw_confidence, 2),
        },
        "doctors": doctors,
        "model_detected": config["model_key"],
        "confidence": round(raw_confidence, 2),
    }


def _format_doctors_block(doctors: List[Dict], specialites: List[str]) -> str:
    if not doctors:
        return (
            f"\n\n---\n\n**Medecins recommandes**\n\n"
            f"Specialites recherchees : {', '.join(specialites)}\n\n"
            "Aucun medecin disponible dans notre reseau pour le moment. "
            "Veuillez contacter votre administration."
        )

    lines = [f"\n\n---\n\n**Medecins de notre reseau**\n"]
    for i, doc in enumerate(doctors[:5], 1):
        name = doc.get("full_name") or doc.get("name") or "Medecin"
        spec = doc.get("specialty") or doc.get("specialite") or ""
        addr = doc.get("address") or ""
        ville = doc.get("ville") or ""
        dist = doc.get("distance_km")
        phone = doc.get("phone") or ""
        workload = doc.get("workload")

        location = ville or (addr[:40] if addr else "")
        dist_str = f" - {dist} km" if dist is not None else ""
        workload_str = (
            f" . {workload} consultation(s) en cours" if workload is not None else ""
        )

        lines.append(
            f"{i}. **{name}**\n"
            f"   {spec}\n"
            + (f"   <Icon.Map /> {location}{dist_str}\n" if location else "")
            + (f"   <Icon.Phone /> {phone}\n" if phone else "")
            + (f"   *Disponibilite : {workload_str.strip(' . ')}*\n" if workload is not None else "")
        )

    lines.append(
        "\nSelectionnez un medecin ci-dessous pour lui soumettre votre demande."
    )

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════
# HELPERS PUBLICS
# ══════════════════════════════════════════════════════════════════

def get_available_models() -> List[Dict]:
    return [
        {
            "key": cfg["model_key"],
            "name": cfg["model_name"],
            "icon": cfg["model_icon"],
            "specialites": cfg["specialites"],
            "description": cfg["description"],
        }
        for cfg in SYMPTOM_CATEGORIES.values()
    ]


def get_model_for_key(model_key: str) -> Optional[Dict]:
    for cfg in SYMPTOM_CATEGORIES.values():
        if cfg["model_key"] == model_key:
            return cfg
    return None