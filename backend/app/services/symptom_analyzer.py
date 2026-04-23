"""
Service d'analyse de symptômes et recommandation de spécialité médicale
Avec recherche des médecins disponibles dans la base de données
"""
import re
import json
import os
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# ═══════════════════════════════════════════════════════════════
# MAPPING SYMPTÔMES → SPÉCIALITÉS (inchangé)
# ═══════════════════════════════════════════════════════════════

SYMPTOM_CATEGORIES = {
    "chest": {
        "keywords": [
            "toux", "tousse", "expectoration", "crachat", "crache",
            "essoufflement", "essoufflé", "dyspnée", "respire", "respiration",
            "oppression thoracique", "douleur thoracique", "poitrine",
            "sifflement", "siffle", "wheezing",
            "covid", "coronavirus", "pneumonie", "bronchite",
            "palpitation", "palpite", "tachycardie",
            "douleur cœur", "angine", "infarctus",
            "œdème", "oedeme", "gonflement jambes", "gonflé",
            "souffle court", "essoufflé en montant",
        ],
        "model_key": "chest",
        "model_name": "Radio Thoracique (Chest X-Ray)",
        "model_icon": "🫁",
        "specialites": ["Cardiologue", "Infectiologue", "Radiologue"],
        "description": "Une radiographie thoracique permet d'analyser vos poumons et votre cœur.",
        "urgency_triggers": ["douleur thoracique", "oppression", "essoufflement sévère", "covid"],
    },
    "lung": {
        "keywords": [
            "masse", "grosseur", "boule", "kyste",
            "perte de poids", "amaigrissement", "maigrir",
            "crachat sang", "hémoptysie", "cracher sang",
            "douleur persistante", "douleur thorax",
            "tabac", "fumeur", "fume", "cigarette",
            "cancer", "tumeur", "métastase",
            "nodule", "lésion", "anomalie scanner",
            "suivi oncologique", "chimio", "chimiothérapie",
        ],
        "model_key": "lung",
        "model_name": "Scanner CT Pulmonaire (Lung CT)",
        "model_icon": "🔬",
        "specialites": ["Pneumologue", "Oncologue", "Carcinologue", "Radiologue"],
        "description": "Un scanner CT permet de détecter et caractériser les lésions pulmonaires.",
        "urgency_triggers": ["crachat sang", "hémoptysie", "perte de poids rapide", "masse"],
    },
    "brain": {
        "keywords": [
            "maux de tête", "céphalée", "migraine",
            "vertige", "vertiges", "étourdissement",
            "perte de mémoire", "oublie", "confusion",
            "convulsion", "épilepsie", "crise épileptique",
            "paralysie", "engourdissement", "fourmillement",
            "faiblesse", "tremblement", "tremble",
            "trouble vision", "vision double", "diplopie",
            "trouble équilibre", "marche instable",
            "tumeur cerveau", "glioblastome", "méningiome",
            "avc", "accident vasculaire", "attaque cérébrale",
            "parole", "élocution", "aphasie",
            "coma", "perte connaissance", "évanouissement",
        ],
        "model_key": "brain",
        "model_name": "IRM Cérébrale (Brain MRI)",
        "model_icon": "🧠",
        "specialites": ["Neurologue", "Neurochirurgien", "Radiologue"],
        "description": "Une IRM cérébrale permet d'analyser votre cerveau et détecter des anomalies.",
        "urgency_triggers": ["convulsion", "avc", "paralysie soudaine", "coma", "vision double"],
    },
    "retina": {
        "keywords": [
            "vision floue", "vision trouble", "voit flou",
            "baisse vision", "perte vision", "aveugle",
            "diabète", "diabétique", "glycémie", "sucre",
            "rétine", "rétinopathie", "fond d'œil",
            "tache", "mouche volante", "corps flottant",
            "éclair", "flash lumineux",
            "douleur œil", "œil rouge", "irritation œil",
            "sécheresse oculaire", "larmoiement",
            "glaucome", "cataracte", "dmla",
            "hypertension", "tension artérielle",
        ],
        "model_key": "retina",
        "model_name": "Fond d'œil (Fundus Photography)",
        "model_icon": "👁️",
        "specialites": ["Ophtalmologue", "Radiologue"],
        "description": "Une photographie du fond d'œil permet d'évaluer votre rétine.",
        "urgency_triggers": ["perte vision soudaine", "éclair", "flash lumineux", "vision double"],
    },
}

GREETING_PATTERNS = [
    r"\b(bonjour|salut|bonsoir|coucou|hello|bjr|bsr|slt)\b",
    r"\b(comment ça va|ça va|comment allez)\b",
]

FAREWELL_PATTERNS = [
    r"\b(merci|thanks|au revoir|bye|adieu|a plus|a\+)\b",
]

# ═══════════════════════════════════════════════════════════════
# RECHERCHE MÉDECINS DANS LA BASE
# ═══════════════════════════════════════════════════════════════

# Liste des coordonnées des villes tunisiennes
CITY_COORDS = {
    "Tunis": (36.8065, 10.1815), "Sfax": (34.7398, 10.7600),
    "Sousse": (35.8254, 10.6369), "Ariana": (36.8625, 10.1956),
    "Bizerte": (37.2744, 9.8739), "Monastir": (35.7643, 10.8113),
    "Nabeul": (36.4561, 10.7376), "Ben Arous": (36.7533, 10.2282),
    "Kairouan": (35.6781, 10.0963), "Gabès": (33.8815, 10.0982),
    "Mahdia": (35.5047, 11.0622), "Gafsa": (34.4250, 8.7842),
    "Béja": (36.7256, 9.1817), "Jendouba": (36.5011, 8.7802),
    "Manouba": (36.8101, 10.0956), "Kasserine": (35.1676, 8.8365),
    "Médenine": (33.3540, 10.5055), "Tataouine": (32.9297, 10.4518),
    "Tozeur": (33.9197, 8.1336), "Siliana": (36.0849, 9.3708),
    "Zaghouan": (36.4029, 10.1429), "Le Kef": (36.1747, 8.7049),
    "Sidi Bouzid": (34.4311, 9.4838), "Kébili": (33.7072, 8.9713),
    "Hammam Lif": (36.6661, 10.3145), "La Marsa": (36.8783, 10.3247),
    "Carthage": (36.8530, 10.3220), "El Menzah": (36.8425, 10.1547),
    "Radès": (36.7033, 10.2333), "Ezzahra": (36.7314, 10.1997),
    "Mornag": (36.6331, 10.2583), "Hammam Sousse": (35.8625, 10.6111),
    "Msaken": (35.7167, 10.5833), "Moknine": (35.6333, 10.9000),
    "Ksar Hellal": (35.6333, 10.8833), "Mahres": (34.5667, 10.5333),
    "Enfidha": (36.1333, 10.4167), "Bouficha": (35.8833, 10.4500),
    "Ben Gardane": (33.3400, 11.1300), "Kalaa Kebira": (35.7167, 10.6333),
}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcule la distance en km entre deux points GPS."""
    from math import radians, cos, sin, asin, sqrt
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))


def load_doctors() -> List[Dict]:
    """Charge la base de données des médecins."""
    doctors_path = Path(__file__).resolve().parent.parent.parent / "data" / "doctors_tunisia.json"
    if not doctors_path.exists():
        return []
    with open(doctors_path, encoding="utf-8") as f:
        return json.load(f)


def find_doctors_by_specialty(
    specialites: List[str],
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
    limit: int = 10,
) -> List[Dict]:
    """
    Trouve les médecins correspondant aux spécialités recherchées,
    triés par proximité si la localisation est fournie.
    
    Args:
        specialites: Liste des spécialités recherchées
        user_lat: Latitude de l'utilisateur (optionnel)
        user_lon: Longitude de l'utilisateur (optionnel)
        limit: Nombre maximum de résultats
        
    Returns:
        Liste des médecins avec distance
    """
    doctors = load_doctors()
    if not doctors:
        return []

    # Convertir les spécialités en minuscules pour comparaison
    specialites_lower = [s.lower() for s in specialites]

    # Filtrer par spécialité
    matching_doctors = []
    for doc in doctors:
        doc_spec = doc.get("specialite", "").lower()
        if any(spec in doc_spec for spec in specialites_lower):
            matching_doctors.append(doc)

    # Calculer la distance si coordonnées fournies
    if user_lat is not None and user_lon is not None:
        for doc in matching_doctors:
            ville = doc.get("ville", "")
            coords = CITY_COORDS.get(ville)
            if coords:
                doc["distance_km"] = round(haversine(user_lat, user_lon, coords[0], coords[1]), 1)
            else:
                doc["distance_km"] = None

        # Trier par distance
        matching_doctors.sort(key=lambda d: d.get("distance_km") or 9999)
    else:
        # Trier par ville (ordre alphabétique)
        matching_doctors.sort(key=lambda d: d.get("ville", ""))

    return matching_doctors[:limit]


def format_doctor_for_chat(doctor: Dict, index: int) -> str:
    """Formate un médecin pour l'affichage dans le chatbot."""
    name = doctor.get("name", "Médecin inconnu")
    specialite = doctor.get("specialite", "")
    ville = doctor.get("ville", "")
    address = doctor.get("address", "")
    distance = doctor.get("distance_km")
    phones = doctor.get("phones", [])
    source = doctor.get("source", "")

    lines = [f"**{index}. {name}**"]
    lines.append(f"   🩺 {specialite}")
    
    if ville:
        location_str = f"📍 {ville}"
        if distance is not None:
            location_str += f" — **{distance} km**"
        lines.append(f"   {location_str}")
    
    if address:
        lines.append(f"   🏥 {address[:80]}")
    
    if phones:
        phone_str = " · ".join([f"📞 {p}" for p in phones[:2]])
        lines.append(f"   {phone_str}")
    
    if source:
        source_label = "MedAI" if source == "plateforme" else "Annuaire médical"
        lines.append(f"   🔗 {source_label}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════
# ANALYSEUR PRINCIPAL
# ═══════════════════════════════════════════════════════════════

def analyze_symptoms(
    text: str,
    user_lat: Optional[float] = None,
    user_lon: Optional[float] = None,
) -> Dict:
    """
    Analyse le texte des symptômes et retourne la recommandation
    avec les médecins disponibles.
    """
    text_lower = text.lower().strip()
    
    # Détecter les salutations
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, text_lower):
            return {
                "type": "greeting",
                "message": (
                    "Bonjour ! 👋 Je suis votre **assistant santé IA**.\n\n"
                    "Décrivez-moi vos symptômes et je vous orienterai vers l'examen le plus adapté "
                    "**avec les médecins disponibles près de chez vous**.\n\n"
                    "Je peux vous aider pour :\n"
                    "• 🫁 **Symptômes respiratoires/cardiaques** → Radio thoracique\n"
                    "• 🔬 **Lésions pulmonaires** → Scanner CT\n"
                    "• 🧠 **Symptômes neurologiques** → IRM cérébrale\n"
                    "• 👁️ **Problèmes de vision** → Fond d'œil\n\n"
                    "Quels sont vos symptômes ?"
                ),
                "recommendation": None,
                "doctors": [],
            }
    
    # Détecter les remerciements
    for pattern in FAREWELL_PATTERNS:
        if re.search(pattern, text_lower):
            return {
                "type": "farewell",
                "message": "Je vous en prie ! Prenez soin de vous et n'hésitez pas à consulter un médecin. 🏥",
                "recommendation": None,
                "doctors": [],
            }
    
    # Analyser les symptômes
    scores = {}
    urgency_detected = False
    
    for category, config in SYMPTOM_CATEGORIES.items():
        score = 0
        matched_keywords = []
        urgency_matches = []
        
        for keyword in config["keywords"]:
            if keyword.lower() in text_lower:
                score += 1
                matched_keywords.append(keyword)
        
        for trigger in config["urgency_triggers"]:
            if trigger.lower() in text_lower:
                urgency_detected = True
                urgency_matches.append(trigger)
        
        if score > 0:
            scores[category] = {
                "score": score,
                "matched_keywords": matched_keywords,
                "urgency_matches": urgency_matches,
                "config": config,
            }
    
    # Si aucun symptôme reconnu
    if not scores:
        return {
            "type": "unknown",
            "message": (
                "Je n'ai pas détecté de symptôme spécifique dans votre description. "
                "Pouvez-vous me donner plus de détails ?\n\n"
                "Par exemple :\n"
                "• « J'ai une toux persistante depuis 2 semaines »\n"
                "• « J'ai des maux de tête et des vertiges »\n"
                "• « Je vois flou et je suis diabétique »\n"
                "• « J'ai une douleur thoracique en montant les escaliers »"
            ),
            "recommendation": None,
            "doctors": [],
        }
    
    # Trier par score et prendre le meilleur
    best_category = max(scores, key=lambda k: scores[k]["score"])
    best = scores[best_category]
    config = best["config"]
    
    # Rechercher les médecins correspondants
    doctors = find_doctors_by_specialty(
        specialites=config["specialites"],
        user_lat=user_lat,
        user_lon=user_lon,
        limit=5,
    )
    
    # Construire le message
    matched_str = ", ".join(best["matched_keywords"])
    urgency_msg = ""
    if urgency_detected and best["urgency_matches"]:
        urgency_msg = f"\n\n⚠️ **Attention** : Les symptômes suivants nécessitent une consultation rapide : **{', '.join(best['urgency_matches'])}**"
    
    # Message des médecins
    doctors_msg = ""
    if doctors:
        doctors_msg = f"\n\n### 👨‍⚕️ **Médecins disponibles près de chez vous**\n\n"
        for i, doc in enumerate(doctors[:5], 1):
            doctors_msg += format_doctor_for_chat(doc, i) + "\n\n"
        doctors_msg += (
            "---\n"
            "💡 **Pour prendre rendez-vous**, cliquez sur le bouton ci-dessous ou "
            "appelez directement le médecin de votre choix.\n"
            "Ces médecins sont spécialisés dans le traitement de vos symptômes."
        )
    else:
        doctors_msg = (
            f"\n\n### 👨‍⚕️ **Spécialistes recherchés**\n\n"
            f"Les spécialistes suivants peuvent vous aider : **{', '.join(config['specialites'])}**\n\n"
            "🔍 Aucun médecin trouvé dans notre base pour le moment. "
            "Vous pouvez utiliser la carte interactive pour chercher manuellement."
        )
    
    message = f"""📋 **Analyse de vos symptômes**

J'ai détecté les symptômes suivants : **{matched_str}**

---

### 🎯 **Examen Recommandé**

**{config['model_icon']} {config['model_name']}**

{config['description']}{urgency_msg}{doctors_msg}"""

    return {
        "type": "recommendation",
        "message": message,
        "recommendation": {
            "model_key": config["model_key"],
            "model_name": config["model_name"],
            "model_icon": config["model_icon"],
            "specialites": config["specialites"],
            "score": best["score"],
            "matched_keywords": best["matched_keywords"],
            "urgency": urgency_detected,
            "urgency_matches": best["urgency_matches"],
        },
        "doctors": doctors,
    }
def get_available_models() -> List[Dict]:
    """Retourne la liste des modèles IA disponibles."""
    return [
        {
            "key": config["model_key"],
            "name": config["model_name"],
            "icon": config["model_icon"],
            "specialites": config["specialites"],
        }
        for config in SYMPTOM_CATEGORIES.values()
    ]
