"""
report_generator.py — Génération de rapports PDF médicaux
Utilise ReportLab pour produire un rapport clinique complet :
  - En-tête institution + métadonnées patient
  - Résumé de prédiction avec badge de sévérité
  - Image originale + heatmap Grad-CAM côte à côte
  - Distribution des probabilités (barres)
  - Rapport d'explication clinique (texte Gemini)
  - Pied de page légal
"""

import io
import base64
from datetime import datetime
from typing import Optional, Dict

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage, KeepTogether, PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF


# ── Palette médicale ─────────────────────────────────────────────────────────
NAVY       = colors.HexColor("#0A2647")
BLUE       = colors.HexColor("#2D5F9E")
LIGHT_BLUE = colors.HexColor("#EFF6FF")
SLATE      = colors.HexColor("#475569")
MUTED      = colors.HexColor("#94A3B8")
WHITE      = colors.white
RED        = colors.HexColor("#DC2626")
ORANGE     = colors.HexColor("#EA580C")
GREEN      = colors.HexColor("#16A34A")
AMBER      = colors.HexColor("#D97706")
BG_LIGHT   = colors.HexColor("#F8FAFC")
BORDER     = colors.HexColor("#E2E8F0")

# Sévérité par classe
SEVERITY = {
    "COVID":          ("URGENCE VITALE",         RED),
    "Pneumonia":      ("URGENCE VITALE",         RED),
    "Pneumothorax":   ("URGENCE VITALE",         RED),
    "Edema":          ("URGENCE VITALE",         RED),
    "Mass":           ("URGENCE ONCOLOGIQUE",    RED),
    "Malignant":      ("URGENCE ONCOLOGIQUE",    RED),
    "Glioma":         ("URGENCE NEUROLOGIQUE",   RED),
    "Cardiomegaly":   ("SURVEILLANCE CARDIO",    ORANGE),
    "Emphysema":      ("SURVEILLANCE PNEUMO",    ORANGE),
    "Meningioma":     ("SURVEILLANCE NEURO",     ORANGE),
    "Viral Pneumonia":("URGENCE VITALE",         RED),
    "Lung_Opacity":   ("SURVEILLANCE PNEUMO",    ORANGE),
    "Nodule":         ("BILAN COMPLÉMENTAIRE",   AMBER),
    "No Finding":     ("NORMAL",                 GREEN),
    "Normal":         ("NORMAL",                 GREEN),
    "Benign":         ("BÉNIN",                  BLUE),
    "No Tumor":       ("NORMAL",                 GREEN),
    "Pituitary":      ("SURVEILLANCE NEURO",     ORANGE),
}

MODEL_LABELS = {
    "chest": "Radiographie Thoracique",
    "lung":  "Scanner CT Pulmonaire",
    "brain": "IRM Cérébrale",
}


def _decode_b64_image(b64_str: str) -> Optional[io.BytesIO]:
    """Décode une image base64 en BytesIO."""
    try:
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        data = base64.b64decode(b64_str)
        buf = io.BytesIO(data)
        buf.seek(0)
        return buf
    except Exception:
        return None


def _make_styles():
    """Crée tous les styles de paragraphes."""
    base = getSampleStyleSheet()

    def S(name, **kw):
        return ParagraphStyle(name, parent=base["Normal"], **kw)

    return {
        "title":       S("title",       fontSize=20, textColor=NAVY,
                          fontName="Helvetica-Bold", spaceAfter=2,
                          alignment=TA_LEFT),
        "subtitle":    S("subtitle",    fontSize=9,  textColor=MUTED,
                          fontName="Helvetica", spaceAfter=0),
        "section":     S("section",     fontSize=10, textColor=NAVY,
                          fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4),
        "body":        S("body",        fontSize=8.5, textColor=SLATE,
                          fontName="Helvetica", leading=14, alignment=TA_JUSTIFY),
        "label":       S("label",       fontSize=7,  textColor=MUTED,
                          fontName="Helvetica", spaceAfter=1),
        "value":       S("value",       fontSize=9,  textColor=NAVY,
                          fontName="Helvetica-Bold"),
        "prediction":  S("prediction",  fontSize=18, textColor=NAVY,
                          fontName="Helvetica-Bold", alignment=TA_CENTER),
        "conf":        S("conf",        fontSize=11, textColor=BLUE,
                          fontName="Helvetica-Bold", alignment=TA_CENTER),
        "badge":       S("badge",       fontSize=8,  textColor=WHITE,
                          fontName="Helvetica-Bold", alignment=TA_CENTER),
        "footer":      S("footer",      fontSize=7,  textColor=MUTED,
                          fontName="Helvetica", alignment=TA_CENTER, leading=11),
        "mono":        S("mono",        fontSize=7.5, textColor=SLATE,
                          fontName="Courier", leading=12),
        "prob_label":  S("prob_label",  fontSize=8,  textColor=SLATE,
                          fontName="Helvetica"),
        "prob_value":  S("prob_value",  fontSize=8,  textColor=NAVY,
                          fontName="Helvetica-Bold"),
        "warn":        S("warn",        fontSize=7.5, textColor=AMBER,
                          fontName="Helvetica-Bold"),
    }


def _prob_bar_table(probabilities: Dict[str, float], styles: dict) -> Table:
    """Crée un tableau avec des barres de probabilités visuelles."""
    sorted_probs = sorted(probabilities.items(), key=lambda x: -x[1])[:8]
    max_prob = sorted_probs[0][1] if sorted_probs else 1.0

    rows = []
    for cls, prob in sorted_probs:
        pct = prob * 100
        bar_width = int((prob / max_prob) * 80)  # max 80 units

        # Bar visuelle via Drawing
        d = Drawing(90 * mm, 6 * mm)
        # Background bar
        d.add(Rect(0, 1, 90 * mm, 4.5 * mm,
                   fillColor=BORDER, strokeColor=None))
        # Filled bar
        if bar_width > 0:
            fill_color = BLUE if prob == max_prob else colors.HexColor("#93C5FD")
            d.add(Rect(0, 1, (prob / max_prob) * 90 * mm, 4.5 * mm,
                       fillColor=fill_color, strokeColor=None))

        rows.append([
            Paragraph(cls, styles["prob_label"]),
            d,
            Paragraph(f"{pct:.1f}%", styles["prob_value"]),
        ])

    t = Table(rows, colWidths=[45*mm, 92*mm, 16*mm])
    t.setStyle(TableStyle([
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING",(0,0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",(0, 0), (-1, -1), 0),
    ]))
    return t


def _header_table(patient_id: str, model_key: str,
                  report_id: str, styles: dict) -> Table:
    """En-tête avec logo-texte institution + métadonnées."""
    now = datetime.now()
    date_str = now.strftime("%d/%m/%Y")
    time_str = now.strftime("%H:%M")

    logo_cell = [
        Paragraph("ChestAI", ParagraphStyle("logo", fontSize=16,
                   fontName="Helvetica-Bold", textColor=NAVY)),
        Paragraph("Plateforme d'Imagerie Médicale IA", ParagraphStyle("logoSub",
                   fontSize=7.5, fontName="Helvetica", textColor=MUTED)),
        Paragraph("Certifié CE IIa · Usage diagnostique professionnel",
                   ParagraphStyle("logoCert", fontSize=6.5,
                   fontName="Helvetica", textColor=BLUE)),
    ]

    meta_cell = [
        Paragraph(f"<b>Patient ID</b> : {patient_id}",
                   ParagraphStyle("m", fontSize=8.5, fontName="Helvetica",
                   textColor=NAVY, alignment=TA_RIGHT)),
        Paragraph(f"<b>Type d'examen</b> : {MODEL_LABELS.get(model_key, model_key)}",
                   ParagraphStyle("m2", fontSize=8.5, fontName="Helvetica",
                   textColor=SLATE, alignment=TA_RIGHT)),
        Paragraph(f"<b>Date / Heure</b> : {date_str} à {time_str}",
                   ParagraphStyle("m3", fontSize=8.5, fontName="Helvetica",
                   textColor=SLATE, alignment=TA_RIGHT)),
        Paragraph(f"<b>Rapport N°</b> : {report_id}",
                   ParagraphStyle("m4", fontSize=7.5, fontName="Courier",
                   textColor=MUTED, alignment=TA_RIGHT)),
    ]

    t = Table([[logo_cell, meta_cell]], colWidths=[95*mm, 95*mm])
    t.setStyle(TableStyle([
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def generate_report_pdf(
    patient_id:    str,
    model_key:     str,
    filename:      str,
    prediction:    str,
    confidence:    float,
    probabilities: Dict[str, float],
    explain_text:  str = "",
    image_b64:     Optional[str] = None,
    gradcam_b64:   Optional[str] = None,
    report_id:     Optional[str] = None,
) -> bytes:
    """
    Génère un rapport PDF complet.
    Retourne les bytes du PDF.
    """
    if report_id is None:
        import uuid
        report_id = f"CHX-{uuid.uuid4().hex[:8].upper()}"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18*mm,  rightMargin=18*mm,
        topMargin=16*mm,   bottomMargin=20*mm,
        title=f"Rapport IA — {patient_id}",
        author="ChestAI Medical Platform",
        subject=f"Analyse {MODEL_LABELS.get(model_key, model_key)}",
    )

    styles = _make_styles()
    story  = []
    W = 174*mm   # usable width

    # ── 1. HEADER ────────────────────────────────────────────────────────────
    story.append(_header_table(patient_id, model_key, report_id, styles))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width=W, thickness=2, color=NAVY, spaceAfter=4*mm))

    # ── 2. TITRE RAPPORT ─────────────────────────────────────────────────────
    story.append(Paragraph(
        "RAPPORT D'ANALYSE PAR INTELLIGENCE ARTIFICIELLE",
        ParagraphStyle("rptTitle", fontSize=11, fontName="Helvetica-Bold",
                       textColor=NAVY, alignment=TA_CENTER, spaceAfter=1*mm)
    ))
    story.append(Paragraph(
        "Ce rapport est généré automatiquement et destiné à l'usage exclusif du professionnel de santé.",
        ParagraphStyle("rptSub", fontSize=7.5, fontName="Helvetica",
                       textColor=MUTED, alignment=TA_CENTER, spaceAfter=5*mm)
    ))

    # ── 3. BLOC DIAGNOSTIC ───────────────────────────────────────────────────
    conf_pct = confidence * 100
    sev_label, sev_color = SEVERITY.get(prediction, ("ANALYSE", BLUE))

    # Badge sévérité
    badge_bg = Table(
        [[Paragraph(f"● {sev_label}", ParagraphStyle(
            "b", fontSize=8, fontName="Helvetica-Bold",
            textColor=WHITE, alignment=TA_CENTER))]],
        colWidths=[60*mm]
    )
    badge_bg.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), sev_color),
        ("ROUNDEDCORNERS", (0,0), (-1,-1), [4,4,4,4]),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
    ]))

    # Conf bar
    conf_bar_d = Drawing(W, 8*mm)
    conf_bar_d.add(Rect(0, 2, W, 5*mm, fillColor=BORDER, strokeColor=None))
    conf_bar_d.add(Rect(0, 2, W * confidence, 5*mm,
                        fillColor=sev_color, strokeColor=None))

    diag_block = Table([
        [Paragraph("DIAGNOSTIC PRINCIPAL", ParagraphStyle("dl", fontSize=7,
           fontName="Helvetica-Bold", textColor=MUTED, alignment=TA_CENTER)),
         Paragraph("SCORE DE CONFIANCE", ParagraphStyle("dl2", fontSize=7,
           fontName="Helvetica-Bold", textColor=MUTED, alignment=TA_CENTER)),
         Paragraph("SÉVÉRITÉ", ParagraphStyle("dl3", fontSize=7,
           fontName="Helvetica-Bold", textColor=MUTED, alignment=TA_CENTER))],
        [Paragraph(prediction, ParagraphStyle("dp", fontSize=17,
           fontName="Helvetica-Bold", textColor=NAVY, alignment=TA_CENTER)),
         Paragraph(f"{conf_pct:.1f}%", ParagraphStyle("dc", fontSize=17,
           fontName="Helvetica-Bold", textColor=sev_color, alignment=TA_CENTER)),
         badge_bg],
    ], colWidths=[60*mm, 54*mm, 60*mm])
    diag_block.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), LIGHT_BLUE),
        ("BOX",           (0,0), (-1,-1), 1, BORDER),
        ("ROUNDEDCORNERS",(0,0), (-1,-1), [8,8,8,8]),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
        ("LINEBELOW",     (0,0), (-1,0),  0.5, BORDER),
    ]))

    story.append(KeepTogether([diag_block, Spacer(1, 2*mm), conf_bar_d, Spacer(1, 5*mm)]))

    # ── 4. IMAGES (originale + Grad-CAM) ─────────────────────────────────────
    story.append(Paragraph("■ IMAGERIE MÉDICALE", ParagraphStyle("sh", fontSize=9,
        fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=3*mm,
        borderPad=2, borderColor=NAVY, borderWidth=0,
        leftIndent=0)))
    story.append(HRFlowable(width=W, thickness=0.5, color=BORDER, spaceAfter=3*mm))

    img_cells  = []
    img_labels = []

    for b64, label in [(image_b64, f"Image originale\n{filename}"),
                        (gradcam_b64, "Carte de chaleur\nGrad-CAM")]:
        if b64:
            buf_img = _decode_b64_image(b64)
            if buf_img:
                try:
                    img = RLImage(buf_img, width=80*mm, height=72*mm, kind="proportional")
                    cell = Table([[img]], colWidths=[84*mm])
                    cell.setStyle(TableStyle([
                        ("BOX",           (0,0), (-1,-1), 1, BORDER),
                        ("BACKGROUND",    (0,0), (-1,-1), BG_LIGHT),
                        ("ALIGN",         (0,0), (-1,-1), "CENTER"),
                        ("TOPPADDING",    (0,0), (-1,-1), 4),
                        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                    ]))
                    img_cells.append(cell)
                    img_labels.append(Paragraph(label, ParagraphStyle("il",
                        fontSize=7.5, fontName="Helvetica", textColor=MUTED,
                        alignment=TA_CENTER)))
                except Exception:
                    pass

    if img_cells:
        if len(img_cells) == 2:
            img_row   = Table([img_cells],  colWidths=[87*mm, 87*mm])
            label_row = Table([img_labels], colWidths=[87*mm, 87*mm])
        else:
            img_row   = Table([img_cells],  colWidths=[87*mm])
            label_row = Table([img_labels], colWidths=[87*mm])

        img_row.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
            ("VALIGN",(0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING",(0,0),(-1,-1), 0),
            ("RIGHTPADDING",(0,0),(-1,-1), 0),
        ]))
        label_row.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
            ("TOPPADDING",(0,0),(-1,-1), 3),
        ]))
        story.append(img_row)
        story.append(Spacer(1, 1*mm))
        story.append(label_row)
        story.append(Spacer(1, 5*mm))
    else:
        story.append(Paragraph(
            "Aucune image disponible dans ce rapport.",
            ParagraphStyle("ni", fontSize=8, fontName="Helvetica",
                           textColor=MUTED, spaceAfter=5*mm)
        ))

    # ── 5. DISTRIBUTION DES PROBABILITÉS ─────────────────────────────────────
    story.append(Paragraph("■ DISTRIBUTION DES PROBABILITÉS (SOFTMAX)", ParagraphStyle("sh2",
        fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=3*mm)))
    story.append(HRFlowable(width=W, thickness=0.5, color=BORDER, spaceAfter=3*mm))
    story.append(_prob_bar_table(probabilities, styles))
    story.append(Spacer(1, 5*mm))

    # ── 6. RAPPORT D'EXPLICATION GEMINI ──────────────────────────────────────
    if explain_text.strip():
        story.append(Paragraph("■ RAPPORT D'EXPLICATION CLINIQUE (IA GÉNÉRATIVE)", ParagraphStyle("sh3",
            fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=3*mm)))
        story.append(HRFlowable(width=W, thickness=0.5, color=BORDER, spaceAfter=3*mm))

        # Parser les sections ## du markdown
        current_section = None
        current_lines   = []

        def flush_section():
            nonlocal current_section, current_lines
            if current_section:
                # Titre de section
                story.append(Paragraph(current_section, ParagraphStyle("secTitle",
                    fontSize=9, fontName="Helvetica-Bold", textColor=BLUE,
                    spaceBefore=6, spaceAfter=3,
                    leftIndent=3*mm,
                    borderPadding=(3,0,3,6),
                )))
                content = " ".join(current_lines).strip()
                if content:
                    # Nettoyage markdown basique
                    content = content.replace("**", "").replace("*", "")
                    story.append(Paragraph(content, ParagraphStyle("secBody",
                        fontSize=8.5, fontName="Helvetica", textColor=SLATE,
                        leading=13.5, alignment=TA_JUSTIFY,
                        leftIndent=3*mm, spaceAfter=2)))
            current_section = None
            current_lines   = []

        for line in explain_text.split("\n"):
            line = line.strip()
            if line.startswith("## "):
                flush_section()
                # Nettoie les emojis basiques pour ReportLab
                sec_title = line[3:].strip()
                for emoji in ["🔍","🤖","📊","⚕️","⚠️","🧬","🔬","💊","🏥"]:
                    sec_title = sec_title.replace(emoji, "").strip()
                current_section = sec_title
            elif line and current_section is not None:
                current_lines.append(line)
            elif line and current_section is None:
                # Texte avant la première section
                story.append(Paragraph(line.replace("**","").replace("*",""),
                    styles["body"]))

        flush_section()
        story.append(Spacer(1, 5*mm))

    # ── 7. RECOMMANDATIONS RÉSUMÉES ───────────────────────────────────────────
    story.append(Paragraph("■ RECOMMANDATIONS IMMÉDIATES", ParagraphStyle("sh4",
        fontSize=9, fontName="Helvetica-Bold", textColor=NAVY, spaceAfter=3*mm)))
    story.append(HRFlowable(width=W, thickness=0.5, color=BORDER, spaceAfter=3*mm))

    reco_map = {
        "COVID":         "Isolement immédiat, PCR COVID si non réalisée, TDM thoracique, bilan biologique complet (NFS, CRP, D-dimères).",
        "Pneumonia":     "Antibiothérapie probabiliste selon guidelines, TDM si doute diagnostique, bilan biologique (NFS, CRP, hémocultures).",
        "Pneumothorax":  "Évaluation urgente de la tolérance clinique. Si mal toléré : exsufflation ou drainage en urgence. TDM si doute.",
        "Edema":         "Bilan cardiologique urgent, BNP/pro-BNP, échocardiographie transthoracique, restriction hydrosodée.",
        "Mass":          "TDM thoracique avec injection en urgence, PET-scan, bronchoscopie selon localisation, avis oncologique.",
        "Malignant":     "TDM thoracique avec injection, PET-scan, biopsie, avis oncologique urgent.",
        "Cardiomegaly":  "Échocardiographie transthoracique en 1re intention, ECG, BNP/pro-BNP, troponines. Guidelines ESC insuffisance cardiaque.",
        "Emphysema":     "EFR (spirométrie), TDM thoracique HR, avis pneumologique. Arrêt tabac, réhabilitation respiratoire.",
        "Glioma":        "IRM cérébrale avec gadolinium séquences complètes, avis neurochirurgical urgent, bilan pré-opératoire.",
        "Meningioma":    "IRM cérébrale avec gadolinium, avis neurochirurgical, suivi à 3 mois si asymptomatique.",
        "No Finding":    "Aucune anomalie détectée. Suivi clinique standard selon l'indication initiale de l'examen.",
        "Normal":        "Aucune anomalie détectée. Suivi clinique standard.",
        "Benign":        "Lésion d'aspect bénin. Contrôle radiologique à 3-6 mois recommandé pour vérifier la stabilité.",
        "No Tumor":      "Aucune lésion tumorale détectée. Suivi clinique standard.",
    }
    reco_text = reco_map.get(prediction,
        f"Corrélation clinique indispensable. Examens complémentaires selon le contexte clinique et la sévérité du tableau.")

    reco_table = Table([[
        Paragraph("→", ParagraphStyle("arrow", fontSize=14, fontName="Helvetica-Bold",
                   textColor=sev_color, alignment=TA_CENTER)),
        Paragraph(reco_text, ParagraphStyle("reco", fontSize=8.5, fontName="Helvetica",
                   textColor=NAVY, leading=13, alignment=TA_JUSTIFY))
    ]], colWidths=[12*mm, 162*mm])
    reco_table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), colors.HexColor(f"#{'fee2e2' if sev_color==RED else 'fff7ed' if sev_color==ORANGE else 'f0fdf4' if sev_color==GREEN else 'eff6ff'}")),
        ("BOX",          (0,0), (-1,-1), 1, sev_color),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0), (-1,-1), 8),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
    ]))
    story.append(reco_table)
    story.append(Spacer(1, 6*mm))

    # ── 8. SIGNATURE / VALIDATION ────────────────────────────────────────────
    sig_table = Table([[
        Paragraph("Généré par IA — Non signé", ParagraphStyle("sig1", fontSize=8,
            fontName="Helvetica", textColor=MUTED)),
        Paragraph("À valider par :", ParagraphStyle("sig2", fontSize=8,
            fontName="Helvetica", textColor=MUTED, alignment=TA_RIGHT)),
    ],[
        Paragraph(f"ChestAI v2.0 · {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            ParagraphStyle("sig3", fontSize=7.5, fontName="Courier", textColor=MUTED)),
        Paragraph("Dr. _______________________________",
            ParagraphStyle("sig4", fontSize=9, fontName="Helvetica-Bold",
            textColor=NAVY, alignment=TA_RIGHT)),
    ]], colWidths=[87*mm, 87*mm])
    sig_table.setStyle(TableStyle([
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("LINEABOVE",    (0,0),(-1,0),  0.5, BORDER),
    ]))
    story.append(sig_table)

    # ── 9. FOOTER LÉGAL ──────────────────────────────────────────────────────
    def add_footer(canvas, doc):
        canvas.saveState()
        W_pt = A4[0]
        H_pt = A4[1]
        # Line
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(18*mm, 16*mm, W_pt - 18*mm, 16*mm)
        # Text
        canvas.setFont("Helvetica", 6.5)
        canvas.setFillColor(MUTED)
        legal = (
            "⚠  Ce rapport est un outil d'AIDE AU DIAGNOSTIC exclusivement réservé aux professionnels de santé. "
            "Il ne constitue pas un diagnostic médical ni une prescription. "
            "La responsabilité diagnostique et thérapeutique reste celle du clinicien. "
            f"  |  Rapport N° {report_id}  |  Page {{page}}"
        )
        canvas.drawCentredString(W_pt/2, 10*mm, legal.replace("{page}", str(doc.page)))
        canvas.restoreState()

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)

    buf.seek(0)
    return buf.read()