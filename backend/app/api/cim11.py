import logging
import os
import re
import unicodedata
import json
import math
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - fallback for incomplete local installs
    load_dotenv = None

from app.api.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cim11", tags=["cim11"])

BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BACKEND_DIR / ".env"
CIM11_PDF_DIR = BACKEND_DIR / "data" / "cim11_pdfs"
CIM11_INDEX_PATH = BACKEND_DIR / "data" / "cim11_index.json"
CIM11_PDF_DIR.mkdir(parents=True, exist_ok=True)

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - dependency can be installed later
    PdfReader = None


def _clean_key(value: Optional[str]) -> str:
    return (value or "").strip().strip('"').strip("'")


def load_env_file() -> None:
    if load_dotenv:
        load_dotenv(dotenv_path=ENV_PATH, override=True)
        return

    if not ENV_PATH.exists():
        return

    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        os.environ[name.strip()] = _clean_key(value)


load_env_file()

DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
GEMINI_MODELS = (
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
)

SYSTEM_PROMPT = (
    "Tu es un assistant medical specialise exclusivement dans la CIM-11 "
    "(Classification Internationale des Maladies, 11e revision) publiee par l'OMS.\n\n"
    "Regles strictes :\n"
    "1. Reponds UNIQUEMENT aux questions relatives a la CIM-11 : codes diagnostiques, "
    "categories nosologiques, criteres de classification, definitions cliniques, "
    "regroupements de maladies, et comparaisons avec la CIM-10 si pertinent.\n"
    "2. Si la question n'est pas liee a la CIM-11, reponds poliment.\n"
    "3. Adresse-toi a un medecin qualifie avec un langage medical precis.\n"
    "4. Formate les codes CIM-11 entre crochets : [5A10], [CA01.0], etc.\n"
    "5. Structure tes reponses avec des listes ou categories quand c'est utile.\n"
    "6. N'invente jamais de codes. Si tu n'es pas certain, dis-le explicitement.\n"
    "7. Reponds toujours en francais."
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    doctor_name: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class Cim11StatusResponse(BaseModel):
    pdf_count: int
    chunk_count: int
    indexed: bool
    pdf_dir: str
    message: str


def get_deepseek_api_key() -> str:
    return _clean_key(os.getenv("DEEPSEEK_API_KEY"))


def get_gemini_api_keys() -> List[str]:
    """Recupere toutes les cles Gemini, meme si .env repete GEMINI_API_KEY."""
    keys: List[str] = []

    for name, value in os.environ.items():
        if name == "GEMINI_API_KEY" or name.startswith("GEMINI_API_KEY_"):
            key = _clean_key(value)
            if key and key not in keys:
                keys.append(key)

    if ENV_PATH.exists():
        try:
            for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue

                name, value = line.split("=", 1)
                name = name.strip()
                if name == "GEMINI_API_KEY" or name.startswith("GEMINI_API_KEY_"):
                    key = _clean_key(value)
                    if key and key not in keys:
                        keys.append(key)
        except OSError as exc:
            logger.warning("CIM-11: impossible de lire .env pour Gemini: %s", exc)

    return keys


def normalize_role(role: str) -> str:
    normalized = unicodedata.normalize("NFKD", role or "")
    return normalized.encode("ascii", "ignore").decode("ascii").strip().lower()


def normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text or "")
    return normalized.encode("ascii", "ignore").decode("ascii").lower()


def tokenize(text: str) -> List[str]:
    stop_words = {
        "avec", "dans", "des", "les", "une", "pour", "sur", "aux", "par",
        "est", "sont", "que", "qui", "quoi", "dont", "plus", "moins",
        "cim", "icd", "the", "and", "for", "with", "from", "this", "that",
        "dans", "elle", "il", "vous", "nous", "leur", "leurs", "ses",
    }
    return [
        token
        for token in re.findall(r"[a-z0-9][a-z0-9.-]{1,}", normalize_text(text))
        if token not in stop_words
    ]


def is_greeting(text: str) -> bool:
    normalized = normalize_text(text).strip()
    normalized = re.sub(r"[^\w\s-]", " ", normalized)
    tokens = set(normalized.split())
    greetings = {
        "bonjour", "bonsoir", "salut", "hello", "hi", "coucou",
        "salam", "merci", "allo",
    }
    return bool(tokens & greetings) and len(tokens) <= 4


def get_index_stats() -> Dict[str, int]:
    pdf_count = len(list_cim11_pdfs())
    chunk_count = 0
    if CIM11_INDEX_PATH.exists():
        try:
            index = json.loads(CIM11_INDEX_PATH.read_text(encoding="utf-8"))
            chunk_count = int(index.get("chunk_count", 0))
        except (OSError, json.JSONDecodeError):
            chunk_count = 0
    return {"pdf_count": pdf_count, "chunk_count": chunk_count}


def build_greeting_reply(doctor_name: Optional[str] = None) -> str:
    name = f" Docteur {doctor_name}" if doctor_name else ""
    stats = get_index_stats()
    return (
        f"Bonsoir{name}.\n\n"
        "Je suis pret a vous aider sur la CIM-11 a partir des documents OMS indexes "
        f"localement ({stats['pdf_count']} PDF, {stats['chunk_count']} passages).\n\n"
        "Vous pouvez par exemple demander :\n"
        "- Comment utiliser les codes racines et les codes d'extension ?\n"
        "- Quelle est la difference entre CIM-10 et CIM-11 ?\n"
        "- Comment coder le diabete de type 2 dans la CIM-11 ?"
    )


def split_into_chunks(text: str, max_words: int = 180, overlap: int = 35) -> List[str]:
    words = re.findall(r"\S+", text)
    if not words:
        return []

    chunks = []
    step = max(max_words - overlap, 1)
    for start in range(0, len(words), step):
        chunk_words = words[start:start + max_words]
        if len(chunk_words) < 30 and chunks:
            break
        chunks.append(" ".join(chunk_words))
    return chunks


def pdf_fingerprint(pdf_paths: List[Path]) -> Dict[str, int]:
    return {
        path.name: int(path.stat().st_mtime)
        for path in pdf_paths
        if path.exists()
    }


def list_cim11_pdfs() -> List[Path]:
    return sorted(CIM11_PDF_DIR.glob("*.pdf"))


def load_pdf_text(pdf_path: Path) -> List[Dict[str, Any]]:
    if PdfReader is None:
        raise RuntimeError("pypdf n'est pas installe. Lancez: pip install -r backend/requirements.txt")

    pages = []
    reader = PdfReader(str(pdf_path))
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            pages.append({"page": index, "text": text})
    return pages


def build_cim11_index() -> Dict[str, Any]:
    pdf_paths = list_cim11_pdfs()
    chunks = []

    for pdf_path in pdf_paths:
        try:
            pages = load_pdf_text(pdf_path)
        except Exception as exc:
            logger.warning("CIM-11 PDF ignore (%s): %s", pdf_path.name, exc)
            continue

        for page in pages:
            for chunk in split_into_chunks(page["text"]):
                tokens = tokenize(chunk)
                if not tokens:
                    continue
                chunks.append({
                    "source": pdf_path.name,
                    "page": page["page"],
                    "text": chunk,
                    "tokens": tokens,
                })

    index = {
        "fingerprint": pdf_fingerprint(pdf_paths),
        "chunk_count": len(chunks),
        "chunks": chunks,
    }

    CIM11_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    CIM11_INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    return index


def load_cim11_index() -> Dict[str, Any]:
    pdf_paths = list_cim11_pdfs()
    current_fingerprint = pdf_fingerprint(pdf_paths)

    if CIM11_INDEX_PATH.exists():
        try:
            index = json.loads(CIM11_INDEX_PATH.read_text(encoding="utf-8"))
            if index.get("fingerprint") == current_fingerprint:
                return index
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("CIM-11: index invalide, reconstruction: %s", exc)

    return build_cim11_index()


def search_cim11_context(question: str, limit: int = 5) -> List[Dict[str, Any]]:
    index = load_cim11_index()
    chunks = index.get("chunks", [])
    query_tokens = tokenize(question)
    if not query_tokens or not chunks:
        return []

    query_counts = {token: query_tokens.count(token) for token in set(query_tokens)}
    total_chunks = len(chunks)
    document_frequency: Dict[str, int] = {}
    for chunk in chunks:
        for token in set(chunk.get("tokens", [])):
            document_frequency[token] = document_frequency.get(token, 0) + 1

    scored = []
    for chunk in chunks:
        chunk_tokens = chunk.get("tokens", [])
        chunk_counts = {token: chunk_tokens.count(token) for token in set(chunk_tokens)}
        score = 0.0
        for token, query_count in query_counts.items():
            frequency = chunk_counts.get(token, 0)
            if not frequency:
                continue
            idf = math.log((total_chunks + 1) / (document_frequency.get(token, 0) + 1)) + 1
            score += query_count * frequency * idf

        if score > 0:
            scored.append({**chunk, "score": score})

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[:limit]


def format_context(chunks: List[Dict[str, Any]]) -> str:
    lines = []
    for index, chunk in enumerate(chunks, start=1):
        lines.append(
            f"[Source {index}: {chunk['source']}, page {chunk['page']}]\n"
            f"{chunk['text']}"
        )
    return "\n\n".join(lines)


def build_grounded_prompt(question: str, history_text: str, context_chunks: List[Dict[str, Any]]) -> str:
    return (
        "Tu dois repondre uniquement a partir des extraits CIM-11 ci-dessous. "
        "Si les extraits ne suffisent pas, dis clairement que les PDFs indexes ne "
        "contiennent pas assez d'information pour confirmer la reponse.\n\n"
        f"Historique recent:\n{history_text}\n\n"
        f"Question du medecin:\n{question}\n\n"
        f"Extraits CIM-11:\n{format_context(context_chunks)}\n\n"
        "Reponse attendue en francais, concise, medicale, avec les sources entre "
        "parentheses sous la forme: (source, p. X)."
    )


def build_extractive_reply(question: str, chunks: List[Dict[str, Any]]) -> str:
    if not chunks:
        stats = get_index_stats()
        if stats["chunk_count"] > 0:
            return (
                "Je n'ai pas trouve d'extrait CIM-11 suffisamment pertinent pour cette question.\n\n"
                "Essayez de reformuler avec un terme medical, un diagnostic, un chapitre, "
                "ou une notion de codage CIM-11.\n\n"
                "Exemples : codes d'extension, codes racines, tumeurs malignes, diabete de type 2, "
                "mortalite, morbidite, postcoordination."
            )

        return (
            "Je n'ai pas trouve d'extrait pertinent dans les PDFs CIM-11 indexes.\n\n"
            f"Ajoutez des PDFs CIM-11 dans: {CIM11_PDF_DIR}\n"
            "Puis relancez la reindexation via POST /api/v1/cim11/reindex."
        )

    sections = [
        "Je peux repondre a partir des PDFs indexes, mais l'IA de reformulation est indisponible. "
        "Voici les passages CIM-11 les plus pertinents trouves:"
    ]
    for chunk in chunks[:3]:
        excerpt = chunk["text"]
        if len(excerpt) > 650:
            excerpt = excerpt[:650].rsplit(" ", 1)[0] + "..."
        sections.append(f"- {excerpt}\n  Source: {chunk['source']}, page {chunk['page']}")

    sections.append(
        "Conclusion: utilisez ces extraits comme base documentaire et verifiez le code exact "
        "dans la version officielle de la CIM-11."
    )
    return "\n\n".join(sections)


async def call_deepseek(prompt: str) -> Optional[str]:
    """Appelle l'API DeepSeek."""
    api_key = get_deepseek_api_key()
    if not api_key:
        return None

    request_body = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 1000,
        "top_p": 0.9,
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                DEEPSEEK_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                json=request_body,
            )
    except Exception as exc:
        logger.error("DeepSeek exception: %s", exc)
        return None

    if response.status_code == 200:
        data = response.json()
        reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        return reply or None

    logger.warning("DeepSeek error %s: %s", response.status_code, response.text[:500])
    return None


async def call_gemini(prompt: str) -> Optional[str]:
    """Appelle l'API Gemini en fallback, avec rotation des cles."""
    api_keys = get_gemini_api_keys()
    if not api_keys:
        return None

    request_body = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1000,
            "topP": 0.9,
        },
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        for model in GEMINI_MODELS:
            for api_key in api_keys:
                url = (
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{model}:generateContent?key={api_key}"
                )

                try:
                    response = await client.post(url, json=request_body)
                except Exception as exc:
                    logger.error("Gemini exception (%s): %s", model, exc)
                    continue

                if response.status_code == 200:
                    data = response.json()
                    reply = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )
                    if reply:
                        return reply
                    logger.warning("Gemini %s: reponse 200 sans texte exploitable", model)
                    continue

                logger.warning(
                    "Gemini error %s (%s): %s",
                    response.status_code,
                    model,
                    response.text[:500],
                )

    return None


@router.post("", response_model=ChatResponse)
async def chat_with_cim11(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Assistant CIM-11 base sur les PDFs locaux, avec LLM optionnel."""
    user_role = normalize_role(current_user.get("role") or "")
    is_admin = bool(current_user.get("is_admin"))
    if user_role not in ["medecin", "medecin", "administrateur"] and not is_admin:
        raise HTTPException(status_code=403, detail="Acces reserve aux medecins")

    has_deepseek = bool(get_deepseek_api_key())
    gemini_keys = get_gemini_api_keys()
    has_gemini = bool(gemini_keys)

    logger.info(
        "CIM-11: requete | user=%s | deepseek=%s | gemini_keys=%s",
        current_user.get("username"),
        has_deepseek,
        len(gemini_keys),
    )

    last_message = request.messages[-1].content if request.messages else ""
    if not last_message.strip():
        raise HTTPException(status_code=400, detail="Message vide")

    if is_greeting(last_message):
        return ChatResponse(reply=build_greeting_reply(request.doctor_name))

    history_lines = []
    for msg in request.messages[:-1]:
        role_label = "Utilisateur" if msg.role == "user" else "Assistant"
        history_lines.append(f"{role_label}: {msg.content}")

    history_text = "\n".join(history_lines[-6:])
    context_chunks = search_cim11_context(last_message)

    if not context_chunks:
        return ChatResponse(reply=build_extractive_reply(last_message, context_chunks))

    full_prompt = build_grounded_prompt(last_message, history_text, context_chunks)

    if has_gemini:
        logger.info("CIM-11: tentative Gemini avec contexte PDF")
        reply = await call_gemini(full_prompt)
        if reply:
            logger.info("CIM-11: Gemini OK")
            return ChatResponse(reply=reply)
        logger.warning("CIM-11: Gemini a echoue, fallback local/DeepSeek")

    if has_deepseek:
        logger.info("CIM-11: tentative DeepSeek avec contexte PDF")
        reply = await call_deepseek(full_prompt)
        if reply:
            logger.info("CIM-11: DeepSeek OK")
            return ChatResponse(reply=reply)
        logger.warning("CIM-11: DeepSeek a egalement echoue, fallback extractif")

    return ChatResponse(reply=build_extractive_reply(last_message, context_chunks))


@router.get("/status", response_model=Cim11StatusResponse)
async def cim11_status(current_user: dict = Depends(get_current_user)):
    user_role = normalize_role(current_user.get("role") or "")
    is_admin = bool(current_user.get("is_admin"))
    if user_role not in ["medecin", "medecin", "administrateur"] and not is_admin:
        raise HTTPException(status_code=403, detail="Acces reserve aux medecins")

    pdf_count = len(list_cim11_pdfs())
    chunk_count = 0
    indexed = False
    if CIM11_INDEX_PATH.exists():
        try:
            index = json.loads(CIM11_INDEX_PATH.read_text(encoding="utf-8"))
            chunk_count = int(index.get("chunk_count", 0))
            indexed = chunk_count > 0
        except (OSError, json.JSONDecodeError):
            indexed = False

    if pdf_count == 0:
        message = "Aucun PDF CIM-11 trouve. Ajoutez des PDFs dans le dossier indique."
    elif indexed:
        message = "Base documentaire CIM-11 indexee."
    else:
        message = "PDFs presents mais pas encore indexes."

    return Cim11StatusResponse(
        pdf_count=pdf_count,
        chunk_count=chunk_count,
        indexed=indexed,
        pdf_dir=str(CIM11_PDF_DIR),
        message=message,
    )


@router.post("/reindex", response_model=Cim11StatusResponse)
async def reindex_cim11(current_user: dict = Depends(get_current_user)):
    user_role = normalize_role(current_user.get("role") or "")
    is_admin = bool(current_user.get("is_admin"))
    if user_role != "administrateur" and not is_admin:
        raise HTTPException(status_code=403, detail="Reindexation reservee aux administrateurs")

    index = build_cim11_index()
    pdf_count = len(list_cim11_pdfs())
    chunk_count = int(index.get("chunk_count", 0))

    return Cim11StatusResponse(
        pdf_count=pdf_count,
        chunk_count=chunk_count,
        indexed=chunk_count > 0,
        pdf_dir=str(CIM11_PDF_DIR),
        message="Base documentaire CIM-11 reconstruite.",
    )


@router.post("/pdfs", response_model=Cim11StatusResponse)
async def upload_cim11_pdf(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_role = normalize_role(current_user.get("role") or "")
    is_admin = bool(current_user.get("is_admin"))
    if user_role != "administrateur" and not is_admin:
        raise HTTPException(status_code=403, detail="Upload reserve aux administrateurs")

    filename = Path(file.filename or "").name
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptes")

    safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", filename).strip("._")
    if not safe_name:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide")

    destination = CIM11_PDF_DIR / safe_name
    with destination.open("wb") as output:
        shutil.copyfileobj(file.file, output)

    index = build_cim11_index()
    chunk_count = int(index.get("chunk_count", 0))

    return Cim11StatusResponse(
        pdf_count=len(list_cim11_pdfs()),
        chunk_count=chunk_count,
        indexed=chunk_count > 0,
        pdf_dir=str(CIM11_PDF_DIR),
        message=f"PDF ajoute et base CIM-11 reindexee: {safe_name}",
    )
