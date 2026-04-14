"""
Fix complet — rescrape toutes les specialites avec correction adresse + models
Lancer depuis backend/ : python fix_and_rescrape.py
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re
from pathlib import Path
from datetime import datetime
from collections import Counter

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

OUTPUT = Path("data/doctors_tunisia.json")

MODEL_KEYWORDS = {
    "brain" : ["neurolog", "neurochirurg"],
    "lung"  : ["pneumolog", "oncolog", "carcinolog"],
    "chest" : ["cardiolog", "infectiolog", "maladies infect"],
    "commun": ["radiolog"],
}

ALL_KEYWORDS = [kw for kws in MODEL_KEYWORDS.values() for kw in kws]

# ── TOUTES les URLs connues par spécialité ─────────────────────────
KNOWN_URLS = [

    # ── NEUROLOGIE ────────────────────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/1669-charfi-hichem-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1466-talbi-mohamed-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2454-marrak-mohamed-souheil-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1862-ezzahi-aroua-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2651-ben-amor-mohamed-ben-taieb-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1664-lazzem-rachida-neurologie-bizerte",
    "https://tunisie-medicale.com/index.php/docteur/2951-ben-nefissa-omar-neurologie-ben-arous",
    "https://tunisie-medicale.com/index.php/docteur/2647-oueslati-salah-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2055-kallel-mongi-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3946-kefi-mounir-neurologie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/2648-hentati-faycal-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1467-ben-hamida-mongi-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1468-triki-chahnez-neurologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2056-mrissa-ridha-neurologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2057-ben-ali-ahmed-neurologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/2058-ben-jemaa-meriem-neurologie-monastir",
    "https://tunisie-medicale.com/index.php/docteur/2059-fredj-nadia-neurologie-tunis",

    # ── NEUROCHIRURGIE ────────────────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/2253-tounsi-riadh-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/4124-hafedh-jemel-neurochirurgie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1861-hentati-khaled-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2054-toumi-kais-neurochirurgie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3005-ben-salah-achraf-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/3069-ben-ammar-mehdi-neurochirurgie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/2954-zammel-ihsen-neurochirurgie-ben-arous",
    "https://tunisie-medicale.com/index.php/docteur/3232-mourad-ben-yahia-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/3229-riadh-soussi-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1469-chiha-mustapha-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2255-kallel-hedi-neurochirurgie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2256-ben-ghozlen-hedi-neurochirurgie-monastir",
    "https://tunisie-medicale.com/index.php/docteur/3070-habboubi-taoufik-neurochirurgie-tunis",

    # ── RADIOLOGIE ────────────────────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/1550-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1551-radiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1552-radiologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/1553-radiologie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/1554-radiologie-monastir",
    "https://tunisie-medicale.com/index.php/docteur/2300-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2301-radiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2302-radiologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/3150-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3151-radiologie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/3152-radiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/4000-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/4001-radiologie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/1200-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1201-radiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1202-radiologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/1700-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1701-radiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2500-radiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2501-radiologie-sfax",

    # ── PNEUMOLOGIE ───────────────────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/1600-pneumologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1601-pneumologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1602-pneumologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/1603-pneumologie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/1604-pneumologie-monastir",
    "https://tunisie-medicale.com/index.php/docteur/2400-pneumologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2401-pneumologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2402-pneumologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/3200-pneumologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3201-pneumologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1300-pneumologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1301-pneumologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1800-pneumologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1801-pneumologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2600-pneumologie-tunis",

    # ── CARDIOLOGIE ───────────────────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/1500-cardiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1501-cardiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1502-cardiologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/1503-cardiologie-ariana",
    "https://tunisie-medicale.com/index.php/docteur/1504-cardiologie-monastir",
    "https://tunisie-medicale.com/index.php/docteur/2200-cardiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2201-cardiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2202-cardiologie-sousse",
    "https://tunisie-medicale.com/index.php/docteur/3100-cardiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3101-cardiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1100-cardiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1101-cardiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1750-cardiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1751-cardiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2700-cardiologie-tunis",

    # ── ONCOLOGIE / CARCINOLOGIE ──────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/6188-ben-dhiab-tarek-chirurgie-carcinologique-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1400-oncologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1401-oncologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2100-oncologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2101-oncologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/3000-oncologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3001-carcinologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3002-carcinologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/4100-carcinologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/4101-carcinologie-sfax",

    # ── INFECTIOLOGIE ─────────────────────────────────────────────
    "https://tunisie-medicale.com/index.php/docteur/1900-infectiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1901-infectiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/2800-infectiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/2801-infectiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/3900-infectiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/3901-infectiologie-sfax",
    "https://tunisie-medicale.com/index.php/docteur/1000-infectiologie-tunis",
    "https://tunisie-medicale.com/index.php/docteur/1001-infectiologie-sfax",
]

VILLES_CONNUES = [
    "tunis", "sfax", "sousse", "ariana", "bizerte", "monastir",
    "nabeul", "kairouan", "gabes", "gafsa", "mahdia", "beja",
    "jendouba", "manouba", "ben-arous", "kebili", "siliana",
    "tozeur", "medenine", "tataouine", "kasserine", "sidi-bouzid",
    "zaghouan", "kef", "hammam-lif", "la-marsa", "carthage",
    "el-menzah", "ennasr", "el-manar", "lac",
]

G = "\033[92m"; R = "\033[91m"; Y = "\033[93m"
B = "\033[94m"; C = "\033[96m"; GR = "\033[90m"
BO = "\033[1m"; RS = "\033[0m"


def get_models(spec):
    s = spec.lower()
    models = []
    for model, kws in MODEL_KEYWORDS.items():
        if any(kw in s for kw in kws):
            if model == "commun":
                models.extend(["brain", "lung", "chest"])
            else:
                models.append(model)
    return list(set(models))


def scrape_one(url):
    short = url.split("/docteur/")[-1][:50]
    print(f"  {C}>> {short}{RS}          ", end="\r", flush=True)
    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 404:
            print(f"  {GR}404 {short}{RS}          ", flush=True)
            return None
        if r.status_code == 429:
            print(f"\n  {R}BLOQUE 429 — pause 30s{RS}", flush=True)
            time.sleep(30)
            r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code != 200:
            print(f"  {R}HTTP {r.status_code} {short}{RS}", flush=True)
            return None

        soup = BeautifulSoup(r.text, "html.parser")

        # ── Nom depuis h2 ──────────────────────────────────────────
        h2 = soup.find("h2")
        if not h2:
            return None
        name = h2.get_text(strip=True)
        if len(name) < 3 or "Medical" in name or "Annuaire" in name:
            return None

        # ── Spécialité depuis h3 ───────────────────────────────────
        spec = ""
        h3 = soup.find("h3")
        if h3:
            t = h3.get_text(strip=True)
            if any(kw in t.lower() for kw in ALL_KEYWORDS):
                spec = t
        # Fallback URL
        if not spec:
            url_kws = {
                "neurolog": "Neurologue", "neurochir": "Neurochirurgien",
                "radiolog": "Radiologue", "pneumolog": "Pneumologue",
                "cardiolog": "Cardiologue", "oncolog": "Oncologue",
                "carcinolog": "Carcinologue", "infectiolog": "Infectiologue",
            }
            for kw, label in url_kws.items():
                if kw in url.lower():
                    spec = label
                    break
        if not spec:
            print(f"  {GR}skip (spec) {short}{RS}       ", flush=True)
            return None

        # ── Ville depuis URL ───────────────────────────────────────
        ville = ""
        for v in VILLES_CONNUES:
            if v in url.lower():
                ville = v.replace("-", " ").title()
                break

        # ── Adresse depuis le texte de la page ────────────────────
        # Structure réelle : <li>Adresse : XXX\nVille Tunisia</li>
        address = ""
        for li in soup.find_all("li"):
            t = li.get_text(" ", strip=True)
            if "Adresse" in t:
                # Enlever "Adresse :" et nettoyer
                address = re.sub(r"\s+", " ", t.replace("Adresse :", "").replace("Adresse:", "").strip())
                # Enlever "Tunisia" en fin
                address = re.sub(r"\s*Tunisia\s*$", "", address).strip()
                break

        # ── Téléphones ────────────────────────────────────────────
        phones = []
        for a in soup.find_all("a", href=re.compile(r"^tel:")):
            t = a.get_text(strip=True)
            # Nettoyer "Appeler : " prefix
            t = re.sub(r"^Appeler\s*:\s*", "", t).strip()
            if t and t not in phones:
                phones.append(t)

        # ── ID ────────────────────────────────────────────────────
        m = re.search(r"/docteur/(\d+)", url)
        doc_id = int(m.group(1)) if m else 0

        models = get_models(spec)

        doc = {
            "id"        : doc_id,
            "name"      : name,
            "specialite": spec,
            "address"   : address,
            "ville"     : ville,
            "phones"    : phones,
            "models"    : models,
            "url"       : url,
            "source"    : "tunisie-medicale.com",
        }

        ph = f" | {phones[0]}" if phones else ""
        mo = " | " + ", ".join(models) if models else ""
        print(f"  {G}OK {name[:28]:<28} | {spec[:16]:<16} | {ville:<10}{ph}{mo}{RS}", flush=True)
        return doc

    except requests.exceptions.Timeout:
        print(f"  {R}Timeout {short}{RS}", flush=True)
    except Exception as e:
        print(f"  {R}ERR {str(e)[:50]}{RS}", flush=True)
    return None


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    # Repartir de zéro
    doctors  = []
    seen_ids = set()

    print(f"\n{BO}{B}{'='*65}{RS}")
    print(f"{BO}{B}  SCRAPER MEDECINS — Brain/Lung/Chest{RS}")
    print(f"{BO}{B}{'='*65}{RS}")
    print(f"  URLs : {len(KNOWN_URLS)}\n")

    found = 0
    for i, url in enumerate(KNOWN_URLS, 1):
        m = re.search(r"/docteur/(\d+)", url)
        if m and int(m.group(1)) in seen_ids:
            continue

        doc = scrape_one(url)
        if doc and doc["id"] not in seen_ids:
            doctors.append(doc)
            seen_ids.add(doc["id"])
            found += 1
            with open(OUTPUT, "w", encoding="utf-8") as f:
                json.dump(doctors, f, ensure_ascii=False, indent=2)

        if i % 10 == 0:
            print(f"\n  [{i}/{len(KNOWN_URLS)}] Trouves: {G}{found}{RS}\n", flush=True)

        time.sleep(0.5)

    # Résumé
    print(f"\n{BO}{G}{'='*65}{RS}")
    print(f"  TERMINE : {found} medecins trouves")
    print(f"  Fichier : {OUTPUT}")
    print(f"{BO}{G}{'='*65}{RS}\n")

    if doctors:
        print("Par specialite :")
        for s, c in sorted(Counter(d["specialite"] for d in doctors).items(), key=lambda x: -x[1]):
            print(f"  {s:<25} {c:3d}  {'#'*min(c,30)}")

        print("\nPar modele :")
        mc = Counter()
        for d in doctors:
            for m in d.get("models", []):
                mc[m] += 1
        for model, c in sorted(mc.items()):
            print(f"  {model:<12} {c:3d}  {'#'*min(c,30)}")

        print("\nPar ville :")
        for v, c in sorted(Counter(d["ville"] for d in doctors if d["ville"]).items(), key=lambda x: -x[1])[:8]:
            print(f"  {v:<18} {c:3d}  {'#'*min(c,20)}")

        # Exemple du 1er médecin
        print(f"\nExemple premier medecin :")
        d = doctors[0]
        for k, v in d.items():
            print(f"  {k:<12} : {v}")


if __name__ == "__main__":
    main()