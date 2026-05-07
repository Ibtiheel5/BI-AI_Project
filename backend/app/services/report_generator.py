import base64
import io
import re
import uuid
from datetime import datetime
from typing import Dict, Optional
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


NAVY = colors.HexColor("#0A2647")
BLUE = colors.HexColor("#2563EB")
LIGHT_BLUE = colors.HexColor("#EFF6FF")
SLATE = colors.HexColor("#475569")
MUTED = colors.HexColor("#64748B")
BORDER = colors.HexColor("#E2E8F0")
BG_LIGHT = colors.HexColor("#F8FAFC")
WHITE = colors.white
RED = colors.HexColor("#DC2626")
ORANGE = colors.HexColor("#EA580C")
GREEN = colors.HexColor("#16A34A")
AMBER = colors.HexColor("#D97706")

MODEL_LABELS = {
    "chest": "Radiographie thoracique",
    "lung": "Scanner CT pulmonaire",
    "brain": "IRM cerebrale",
    "retina": "Retinographie / fond d'oeil",
}

SEVERITY = {
    "COVID": ("Urgence infectieuse", RED),
    "Pneumonia": ("Urgence respiratoire", RED),
    "Viral Pneumonia": ("Urgence respiratoire", RED),
    "Pneumothorax": ("Urgence vitale", RED),
    "Edema": ("Urgence cardio-respiratoire", RED),
    "Mass": ("Suspicion oncologique", RED),
    "Malignant": ("Suspicion oncologique", RED),
    "Glioma": ("Urgence neurologique", RED),
    "Cardiomegaly": ("Surveillance cardiologique", ORANGE),
    "Emphysema": ("Surveillance pneumologique", ORANGE),
    "Meningioma": ("Surveillance neurologique", ORANGE),
    "Nodule": ("Bilan complementaire", AMBER),
    "No Finding": ("Aucune anomalie detectee", GREEN),
    "Normal": ("Aucune anomalie detectee", GREEN),
    "No_DR": ("Retine sans DR detectee", GREEN),
    "Mild": ("DR legere", AMBER),
    "Moderate": ("DR moderee", ORANGE),
    "Severe": ("DR severe", RED),
    "Proliferate_DR": ("DR proliferante", RED),
    "No Tumor": ("Aucune tumeur detectee", GREEN),
    "notumor": ("Aucune tumeur detectee", GREEN),
    "Benign": ("Aspect benin", BLUE),
    "Pituitary": ("Surveillance neuro-endocrine", ORANGE),
}

RECOMMENDATIONS = {
    "COVID": "Isolement, confirmation virologique si necessaire, evaluation de la tolerance respiratoire et surveillance rapprochee.",
    "Pneumonia": "Correlation clinico-biologique, antibiotherapie selon le contexte, controle evolutif et TDM si discordance.",
    "Viral Pneumonia": "Correlation clinique, bilan infectieux, surveillance respiratoire et controle radiologique selon evolution.",
    "Pneumothorax": "Evaluer la tolerance clinique. Drainage ou exsufflation en urgence si pneumothorax important ou mal tolere.",
    "Edema": "Bilan cardiologique, BNP/pro-BNP, echocardiographie et prise en charge d'une eventuelle decompensation.",
    "Mass": "TDM injectee, comparaison aux examens anterieurs, discussion RCP et confirmation histologique si indiquee.",
    "Malignant": "Bilan d'extension, avis oncologique et confirmation anatomopathologique selon le contexte.",
    "Cardiomegaly": "ECG, echocardiographie transthoracique, BNP/pro-BNP et evaluation cardiologique.",
    "Emphysema": "Spirometrie, evaluation tabagique, avis pneumologique et optimisation du traitement bronchodilatateur.",
    "Glioma": "IRM cerebrale avec gadolinium, avis neurochirurgical et discussion multidisciplinaire.",
    "Meningioma": "IRM avec injection, evaluation neurochirurgicale et surveillance si lesion asymptomatique stable.",
    "No Finding": "Pas d'anomalie radiologique evidente detectee par l'IA. Interpreter selon le contexte clinique.",
    "Normal": "Pas d'anomalie evidente detectee par l'IA. Suivi clinique selon indication initiale.",
    "No_DR": "Surveillance ophtalmologique reguliere selon le contexte diabetique et controle glycemique.",
    "Mild": "Controle ophtalmologique, optimisation glycemique et tensionnelle.",
    "Moderate": "Avis ophtalmologique, surveillance rapprochee et recherche d'oedeme maculaire.",
    "Severe": "Avis ophtalmologique rapide, surveillance rapprochee et discussion therapeutique specialisee.",
    "Proliferate_DR": "Avis ophtalmologique urgent, evaluation pour laser, anti-VEGF ou chirurgie selon le cas.",
}


def _clean_text(value: object) -> str:
    text = "" if value is None else str(value)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return escape(text)


def _strip_markdown(text: str) -> str:
    text = re.sub(r"^\s*[-*]\s+", "- ", text)
    text = text.replace("**", "").replace("__", "").replace("`", "")
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
    return text


def _decode_b64_image(b64_str: Optional[str]) -> Optional[io.BytesIO]:
    if not b64_str:
        return None
    try:
        raw = b64_str.strip()
        if "," in raw:
            raw = raw.split(",", 1)[1]
        data = base64.b64decode(raw, validate=False)
        if not data:
            return None
        buf = io.BytesIO(data)
        buf.seek(0)
        return buf
    except Exception:
        return None


def _normalize_probabilities(probabilities: object) -> Dict[str, float]:
    if not isinstance(probabilities, dict):
        return {}
    clean = {}
    for key, value in probabilities.items():
        try:
            prob = float(value)
        except (TypeError, ValueError):
            continue
        clean[str(key)] = max(0.0, min(prob, 1.0))
    return clean


def _normalize_confidence(confidence: object) -> float:
    try:
        value = float(confidence)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(value, 1.0))


def _styles() -> dict:
    base = getSampleStyleSheet()

    def style(name, **kwargs):
        return ParagraphStyle(name, parent=base["Normal"], **kwargs)

    return {
        "title": style("title", fontName="Helvetica-Bold", fontSize=18, textColor=NAVY, alignment=TA_LEFT, leading=22),
        "subtitle": style("subtitle", fontSize=8, textColor=MUTED, alignment=TA_LEFT, leading=11),
        "meta": style("meta", fontSize=8, textColor=SLATE, alignment=TA_RIGHT, leading=12),
        "section": style("section", fontName="Helvetica-Bold", fontSize=10, textColor=NAVY, spaceBefore=8, spaceAfter=5),
        "body": style("body", fontSize=8.5, textColor=SLATE, leading=13, alignment=TA_JUSTIFY),
        "small": style("small", fontSize=7.5, textColor=MUTED, leading=10),
        "label": style("label", fontName="Helvetica-Bold", fontSize=7, textColor=MUTED, alignment=TA_CENTER),
        "value": style("value", fontName="Helvetica-Bold", fontSize=14, textColor=NAVY, alignment=TA_CENTER, leading=16),
        "value_red": style("value_red", fontName="Helvetica-Bold", fontSize=14, textColor=RED, alignment=TA_CENTER, leading=16),
        "badge": style("badge", fontName="Helvetica-Bold", fontSize=8, textColor=WHITE, alignment=TA_CENTER),
        "prob": style("prob", fontSize=8, textColor=SLATE, leading=11),
        "prob_bold": style("prob_bold", fontName="Helvetica-Bold", fontSize=8, textColor=NAVY, leading=11),
        "explain_title": style("explain_title", fontName="Helvetica-Bold", fontSize=9, textColor=BLUE, leading=12, spaceBefore=5, spaceAfter=2),
        "footer": style("footer", fontSize=6.5, textColor=MUTED, alignment=TA_CENTER, leading=8),
    }


def _header(patient_id: str, model_key: str, report_id: str, styles: dict) -> Table:
    now = datetime.now()
    left = [
        Paragraph("MedAI", styles["title"]),
        Paragraph("Rapport d'analyse medicale assistee par intelligence artificielle", styles["subtitle"]),
        Paragraph("Usage professionnel - interpretation finale par le clinicien", styles["subtitle"]),
    ]
    right = [
        Paragraph(f"<b>Patient</b> : {_clean_text(patient_id)}", styles["meta"]),
        Paragraph(f"<b>Examen</b> : {_clean_text(MODEL_LABELS.get(model_key, model_key))}", styles["meta"]),
        Paragraph(f"<b>Date</b> : {now.strftime('%d/%m/%Y a %H:%M')}", styles["meta"]),
        Paragraph(f"<b>Rapport</b> : {_clean_text(report_id)}", styles["meta"]),
    ]
    table = Table([[left, right]], colWidths=[96 * mm, 78 * mm])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return table


def _diagnosis_block(prediction: str, confidence: float, severity_label: str, severity_color, styles: dict) -> Table:
    confidence_style = ParagraphStyle(
        "confidence_dynamic",
        parent=styles["value"],
        textColor=severity_color,
    )
    severity_badge = Table(
        [[Paragraph(_clean_text(severity_label.upper()), styles["badge"])]],
        colWidths=[55 * mm],
    )
    severity_badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), severity_color),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    table = Table([
        [
            Paragraph("DIAGNOSTIC IA", styles["label"]),
            Paragraph("CONFIANCE", styles["label"]),
            Paragraph("NIVEAU CLINIQUE", styles["label"]),
        ],
        [
            Paragraph(_clean_text(prediction), styles["value"]),
            Paragraph(f"{confidence * 100:.1f}%", confidence_style),
            severity_badge,
        ],
    ], colWidths=[62 * mm, 52 * mm, 60 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def _confidence_bar(confidence: float, color) -> Table:
    filled = max(1, int(confidence * 100))
    empty = max(0, 100 - filled)
    row = []
    widths = []
    if filled:
        row.append("")
        widths.append(174 * mm * filled / 100)
    if empty:
        row.append("")
        widths.append(174 * mm * empty / 100)
    table = Table([row], colWidths=widths, rowHeights=[5 * mm])
    commands = [("BOX", (0, 0), (-1, -1), 0.2, BORDER)]
    if filled:
        commands.append(("BACKGROUND", (0, 0), (0, 0), color))
    if empty:
        commands.append(("BACKGROUND", (-1, 0), (-1, 0), BORDER))
    table.setStyle(TableStyle(commands))
    return table


def _image_cell(image_b64: Optional[str], label: str, filename: str = ""):
    styles = _styles()
    buf = _decode_b64_image(image_b64)
    if not buf:
        return [
            Paragraph(_clean_text(label), styles["prob_bold"]),
            Spacer(1, 3 * mm),
            Paragraph("Image non disponible.", styles["small"]),
        ]
    try:
        image = RLImage(buf, width=78 * mm, height=70 * mm, kind="proportional")
        return [
            Paragraph(_clean_text(label), styles["prob_bold"]),
            Paragraph(_clean_text(filename), styles["small"]) if filename else Spacer(1, 1 * mm),
            Spacer(1, 2 * mm),
            image,
        ]
    except Exception:
        return [
            Paragraph(_clean_text(label), styles["prob_bold"]),
            Spacer(1, 3 * mm),
            Paragraph("Image illisible dans ce rapport.", styles["small"]),
        ]


def _images_table(image_b64: Optional[str], gradcam_b64: Optional[str], filename: str) -> Table:
    original = _image_cell(image_b64, "Image originale", filename)
    gradcam = _image_cell(gradcam_b64, "Carte de chaleur Grad-CAM", "Zones qui influencent la prediction")
    table = Table([[original, gradcam]], colWidths=[86 * mm, 86 * mm])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def _probability_table(probabilities: Dict[str, float], prediction: str, styles: dict) -> Table:
    if not probabilities:
        table = Table([[Paragraph("Distribution non disponible.", styles["small"])]], colWidths=[174 * mm])
        table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
            ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        return table

    rows = [[
        Paragraph("Classe", styles["prob_bold"]),
        Paragraph("Probabilite", styles["prob_bold"]),
        Paragraph("Barre", styles["prob_bold"]),
    ]]
    sorted_probs = sorted(probabilities.items(), key=lambda item: -item[1])[:10]
    max_prob = max([prob for _, prob in sorted_probs] + [1e-6])
    for label, prob in sorted_probs:
        marker = "  <- prediction" if label == prediction else ""
        bar_pct = int((prob / max_prob) * 32)
        bar = "|" * max(1, bar_pct)
        rows.append([
            Paragraph(_clean_text(f"{label}{marker}"), styles["prob"]),
            Paragraph(f"{prob * 100:.1f}%", styles["prob_bold"]),
            Paragraph(_clean_text(bar), ParagraphStyle("bar", parent=styles["prob"], fontName="Courier", textColor=BLUE)),
        ])

    table = Table(rows, colWidths=[67 * mm, 28 * mm, 79 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("BACKGROUND", (0, 1), (-1, -1), BG_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.35, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def _explain_blocks(explain_text: str, styles: dict):
    blocks = []
    text = (explain_text or "").strip()
    if not text:
        blocks.append(Paragraph(
            "Explication IA non disponible. Le rapport contient uniquement la prediction, les probabilites et les images disponibles.",
            styles["body"],
        ))
        return blocks

    current_title = None
    current_lines = []

    def flush():
        nonlocal current_title, current_lines
        if current_title:
            blocks.append(Paragraph(_clean_text(current_title), styles["explain_title"]))
        content = "\n".join(current_lines).strip()
        if content:
            paragraphs = re.split(r"\n\s*\n", content)
            for para in paragraphs:
                clean = _strip_markdown(para).replace("\n", "<br/>")
                blocks.append(Paragraph(_clean_text(clean).replace("&lt;br/&gt;", "<br/>"), styles["body"]))
                blocks.append(Spacer(1, 1.5 * mm))
        current_title = None
        current_lines = []

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            current_lines.append("")
            continue
        if line.startswith("##"):
            flush()
            current_title = _strip_markdown(line.lstrip("#").strip())
        else:
            current_lines.append(line)
    flush()
    return blocks


def _recommendation(prediction: str) -> str:
    return RECOMMENDATIONS.get(
        prediction,
        "Correlation clinique indispensable. Completer par l'examen clinique, les antecedents, les examens biologiques et l'imagerie complementaire si necessaire.",
    )


def _fallback_explain_text(model_key: str, prediction: str, confidence: float, probabilities: Dict[str, float]) -> str:
    model_label = MODEL_LABELS.get(model_key, "image medicale")
    sorted_probs = sorted(probabilities.items(), key=lambda item: -item[1])
    differentials = ", ".join(f"{label} ({value * 100:.1f}%)" for label, value in sorted_probs[1:4]) or "non disponible"
    confidence_note = "elevee" if confidence >= 0.8 else "intermediaire" if confidence >= 0.55 else "faible"
    return (
        "## Signes observes sur cette image\n"
        f"L'analyse IA de cette {model_label} retient principalement la classe {prediction}. "
        "La carte Grad-CAM doit etre comparee a l'image originale pour verifier que les regions activees "
        "correspondent a une zone anatomique pertinente.\n\n"
        "## Correlation signes visuels / decision du modele\n"
        f"Le score de confiance est de {confidence * 100:.1f}%, soit une confiance {confidence_note}. "
        f"Les hypotheses differentielles principales sont : {differentials}. "
        "Plus les probabilites concurrentes sont proches, plus la prudence diagnostique est necessaire.\n\n"
        "## Conduite clinique basee sur cette image\n"
        "Cette sortie IA doit etre integree aux donnees cliniques, biologiques et aux examens anterieurs. "
        "La decision finale, les examens complementaires et la conduite therapeutique relevent du medecin responsable.\n\n"
        "## Limites de cette analyse\n"
        "Cette analyse peut etre limitee par la qualite de l'image, le cadrage, les artefacts, "
        "les variants anatomiques ou les situations hors distribution d'apprentissage du modele."
    )


def generate_report_pdf(
    patient_id: str,
    model_key: str,
    filename: str,
    prediction: str,
    confidence: float,
    probabilities: Dict[str, float],
    explain_text: str = "",
    image_b64: Optional[str] = None,
    gradcam_b64: Optional[str] = None,
    report_id: Optional[str] = None,
) -> bytes:
    probabilities = _normalize_probabilities(probabilities)
    confidence = _normalize_confidence(confidence)
    prediction = str(prediction or "Non determine")
    if len((explain_text or "").split()) < 45:
        extra_explain = _fallback_explain_text(model_key, prediction, confidence, probabilities)
        explain_text = ((explain_text or "").strip() + "\n\n" + extra_explain).strip()
    report_id = report_id or f"MEDAI-{uuid.uuid4().hex[:8].upper()}"

    severity_label, severity_color = SEVERITY.get(prediction, ("Analyse a correler", BLUE))
    styles = _styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=20 * mm,
        title=f"Rapport MedAI - {patient_id}",
        author="MedAI",
        subject=f"Analyse IA - {MODEL_LABELS.get(model_key, model_key)}",
    )

    story = []
    story.append(_header(patient_id, model_key, report_id, styles))
    story.append(Spacer(1, 4 * mm))
    story.append(HRFlowable(width=174 * mm, thickness=1.4, color=NAVY))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Synthese de l'analyse IA", styles["section"]))
    story.append(_diagnosis_block(prediction, confidence, severity_label, severity_color, styles))
    story.append(Spacer(1, 2 * mm))
    story.append(_confidence_bar(confidence, severity_color))
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("Images analysees", styles["section"]))
    story.append(_images_table(image_b64, gradcam_b64, filename or "image.jpg"))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Distribution des probabilites", styles["section"]))
    story.append(_probability_table(probabilities, prediction, styles))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Explication clinique IA (Gemini / Explainable AI)", styles["section"]))
    story.extend(_explain_blocks(explain_text, styles))
    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("Recommandation immediate", styles["section"]))
    reco = Table([[
        Paragraph("A retenir", ParagraphStyle("reco_label", parent=styles["prob_bold"], textColor=severity_color)),
        Paragraph(_clean_text(_recommendation(prediction)), styles["body"]),
    ]], colWidths=[28 * mm, 146 * mm])
    reco.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7ED") if severity_color in (RED, ORANGE, AMBER) else LIGHT_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.7, severity_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(reco)
    story.append(Spacer(1, 7 * mm))

    signature = Table([[
        Paragraph("Genere automatiquement par MedAI", styles["small"]),
        Paragraph("Validation medicale : Dr. __________________________", ParagraphStyle("sig", parent=styles["small"], alignment=TA_RIGHT, textColor=NAVY)),
    ]], colWidths=[72 * mm, 102 * mm])
    signature.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(signature)

    def footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.4)
        canvas.line(18 * mm, 15 * mm, A4[0] - 18 * mm, 15 * mm)
        canvas.setFont("Helvetica", 6.5)
        canvas.setFillColor(MUTED)
        text = (
            "Ce rapport est une aide a la decision. Il ne remplace pas l'avis du clinicien. "
            f"Rapport {report_id} - Page {document.page}"
        )
        canvas.drawCentredString(A4[0] / 2, 9 * mm, text)
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    buffer.seek(0)
    return buffer.getvalue()
