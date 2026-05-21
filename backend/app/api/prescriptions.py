from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json

from app.api.auth import get_current_user
from app.api.consultations import fetch_one, fetch_all, execute, create_notification, normalize_role, get_db
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
from pathlib import Path
from datetime import datetime
router = APIRouter(prefix="", tags=["prescriptions"])

# ============================================================================
# PRESCRIPTIONS (Medecin -> Patient)
# ============================================================================

class PrescriptionMedication(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = ""
    duration: str = ""

class PrescriptionCreate(BaseModel):
    consultation_id: int
    patient_id: int
    medications: List[PrescriptionMedication]
    notes: str = ""
    valid_until: Optional[str] = None
    signature_type: str = "text"  # "text" | "draw"
    signature_text: Optional[str] = None

class PrescriptionUpdate(BaseModel):
    medications: Optional[List[PrescriptionMedication]] = None
    notes: Optional[str] = None
    status: Optional[str] = None


def init_prescriptions_table():
    """Cree la table prescriptions si elle n'existe pas"""
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS prescriptions (
                id SERIAL PRIMARY KEY,
                consultation_id INT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
                doctor_id INT NOT NULL REFERENCES users(id),
                patient_id INT NOT NULL REFERENCES users(id),
                medications TEXT NOT NULL DEFAULT '[]',
                notes TEXT DEFAULT '',
                status VARCHAR(20) DEFAULT 'active',
                valid_until TIMESTAMP,
                signature_type VARCHAR(20) DEFAULT 'text',
                signature_text TEXT DEFAULT '',
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """)
        conn.commit()
        print("Table prescriptions creee avec succes")
    except Exception as e:
        print(f"Erreur creation table prescriptions: {e}")
    finally:
        cur.close()
        conn.close()


@router.get("/prescriptions/doctor")
async def get_doctor_prescriptions(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = None,
):
    """Recupere toutes les prescriptions ecrites par le medecin connecte"""
    user_id = current_user["id"]

    query = "SELECT * FROM prescriptions WHERE doctor_id = %s"
    params = [user_id]

    if status:
        query += " AND status = %s"
        params.append(status)

    query += " ORDER BY created_at DESC"

    rows = fetch_all(query, tuple(params))

    # Parser les medications JSON
    for row in rows:
        if isinstance(row.get("medications"), str):
            try:
                row["medications"] = json.loads(row["medications"])
            except:
                row["medications"] = []

    return {"prescriptions": rows, "total": len(rows)}


@router.get("/prescriptions/patient")
async def get_patient_prescriptions(
    current_user: dict = Depends(get_current_user),
):
    """Recupere les prescriptions du patient connecte"""
    if normalize_role(current_user.get("role", "")) != "Patient" and not current_user.get("is_admin"):
        raise HTTPException(403, "Acces reserve aux patients")

    rows = fetch_all(
        """SELECT p.*, u.full_name as doctor_name, c.model_key
           FROM prescriptions p
           JOIN users u ON p.doctor_id = u.id
           JOIN consultations c ON p.consultation_id = c.id
           WHERE p.patient_id = %s AND p.status = 'active'
           ORDER BY p.created_at DESC""",
        (current_user["id"],)
    )

    for row in rows:
        if isinstance(row.get("medications"), str):
            try:
                row["medications"] = json.loads(row["medications"])
            except:
                row["medications"] = []

    return {"prescriptions": rows}


@router.post("/prescriptions", status_code=201)
async def create_prescription(
    data: PrescriptionCreate,
    current_user: dict = Depends(get_current_user),
):
    """Cree une nouvelle prescription (medecin)"""

    # Verifier que l'utilisateur est medecin ou admin
    if normalize_role(current_user.get("role", "")) != "Medecin" and not current_user.get("is_admin"):
        raise HTTPException(403, "Seul un medecin peut creer une prescription")

    # Verifier que la consultation appartient au medecin
    consult = fetch_one(
        "SELECT * FROM consultations WHERE id = %s AND doctor_id = %s",
        (data.consultation_id, current_user["id"])
    )
    if not consult:
        raise HTTPException(404, "Consultation non trouvee ou non assignee")

    # Verifier que le patient existe
    patient = fetch_one("SELECT * FROM users WHERE id = %s", (data.patient_id,))
    if not patient:
        raise HTTPException(404, "Patient non trouve")

    # Convertir les medicaments en JSON
    medications_json = json.dumps([m.dict() for m in data.medications])

    # Recuperer la signature du medecin selon le type choisi
    doctor = fetch_one("SELECT signature_url, signature_text FROM users WHERE id = %s", (current_user["id"],))

    sig_type = data.signature_type
    sig_text = data.signature_text or ""

    if sig_type == "text":
        sig_text = doctor.get("signature_text", "") if doctor else ""
    elif sig_type == "draw":
        sig_text = doctor.get("signature_url", "") if doctor else ""

    # Inserer la prescription
    row = execute(
        """INSERT INTO prescriptions 
           (consultation_id, doctor_id, patient_id, medications, notes, valid_until, status, signature_type, signature_text)
           VALUES (%s, %s, %s, %s, %s, %s, 'active', %s, %s)
           RETURNING id""",
        (data.consultation_id, current_user["id"], data.patient_id,
         medications_json, data.notes, data.valid_until, sig_type, sig_text),
        returning=True
    )
    presc_id = row[0]

    # Notifier le patient
    create_notification(
        data.patient_id,
        "new_prescription",
        "Nouvelle prescription medicale",
        f"Le Dr. {current_user['full_name']} a redige une prescription pour vous.",
        {"prescription_id": presc_id, "consultation_id": data.consultation_id}
    )

    return {"message": "Prescription creee avec succes", "prescription_id": presc_id}


@router.put("/prescriptions/{prescription_id}")
async def update_prescription(
    prescription_id: int,
    data: PrescriptionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Met a jour une prescription"""

    # Verifier que la prescription appartient au medecin
    existing = fetch_one(
        "SELECT * FROM prescriptions WHERE id = %s AND doctor_id = %s",
        (prescription_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(404, "Prescription non trouvee")

    updates = []
    params = []

    if data.medications is not None:
        updates.append("medications = %s")
        params.append(json.dumps([m.dict() for m in data.medications]))

    if data.notes is not None:
        updates.append("notes = %s")
        params.append(data.notes)

    if data.status is not None:
        updates.append("status = %s")
        params.append(data.status)

    if updates:
        updates.append("updated_at = NOW()")
        params.extend([prescription_id])
        execute(
            f"UPDATE prescriptions SET {', '.join(updates)} WHERE id = %s",
            tuple(params)
        )

    return {"message": "Prescription mise a jour"}


@router.delete("/prescriptions/{prescription_id}")
async def delete_prescription(
    prescription_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Supprime une prescription (soft delete -> status cancelled)"""

    existing = fetch_one(
        "SELECT * FROM prescriptions WHERE id = %s AND doctor_id = %s",
        (prescription_id, current_user["id"])
    )
    if not existing:
        raise HTTPException(404, "Prescription non trouvee")

    execute(
        "UPDATE prescriptions SET status = 'cancelled', updated_at = NOW() WHERE id = %s",
        (prescription_id,)
    )

    return {"message": "Prescription annulee"}


@router.post("/prescriptions/{prescription_id}/send")
async def send_prescription_to_patient(
    prescription_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Envoie la prescription au patient (notification)"""

    prescription = fetch_one(
        """SELECT p.*, u.email as patient_email, u.full_name as patient_name
           FROM prescriptions p
           JOIN users u ON p.patient_id = u.id
           WHERE p.id = %s AND p.doctor_id = %s""",
        (prescription_id, current_user["id"])
    )
    if not prescription:
        raise HTTPException(404, "Prescription non trouvee")

    # Creer une notification pour le patient
    create_notification(
        prescription["patient_id"],
        "prescription_ready",
        "Votre prescription est disponible",
        f"Le Dr. {current_user['full_name']} a partage une prescription avec vous.",
        {"prescription_id": prescription_id}
    )

    return {"message": "Prescription envoyee au patient"}

# ============================================================================
# GENERATION PDF ORDONNANCE
# ============================================================================

@router.get("/prescriptions/{prescription_id}/pdf")
async def download_prescription_pdf(
    prescription_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Telecharge la prescription medicale au format PDF"""

    print(f"[PDF] Demande de PDF pour prescription {prescription_id} par user {current_user.get('id')}")

    # Recuperer la prescription avec infos medecin/patient
    try:
        prescription = fetch_one(
            """SELECT p.*, 
                      d.full_name as doctor_name, d.specialty as doctor_specialty,
                      d.signature_url as doctor_signature_url,
                      d.signature_text as doctor_signature_text,
                      pat.full_name as patient_name
               FROM prescriptions p
               JOIN users d ON p.doctor_id = d.id
               JOIN users pat ON p.patient_id = pat.id
               WHERE p.id = %s""",
            (prescription_id,)
        )
    except Exception as e:
        print(f"[PDF] Erreur SQL: {e}")
        raise HTTPException(500, f"Erreur base de donnees: {str(e)}")

    if not prescription:
        print(f"[PDF] Prescription {prescription_id} introuvable")
        raise HTTPException(404, "Prescription introuvable")

    print(f"[PDF] Prescription trouvee: {prescription}")

    # Verifier les droits
    uid = current_user["id"]
    is_admin = current_user.get("is_admin", False)
    if prescription["doctor_id"] != uid and prescription["patient_id"] != uid and not is_admin:
        raise HTTPException(403, "Acces non autorise")

    # Parser les medicaments
    medications = []
    if isinstance(prescription.get("medications"), str):
        try:
            medications = json.loads(prescription["medications"])
            print(f"[PDF] Medicaments parses: {medications}")
        except Exception as e:
            print(f"[PDF] Erreur parsing medicaments: {e}")
            medications = []
    elif isinstance(prescription.get("medications"), list):
        medications = prescription["medications"]

    # Generer le PDF
    try:
        pdf_bytes = _generate_prescription_pdf(prescription, medications)
        print(f"[PDF] PDF genere avec succes: {len(pdf_bytes)} bytes")
    except Exception as e:
        import traceback
        print(f"[PDF] Erreur generation PDF: {e}")
        print(traceback.format_exc())
        raise HTTPException(500, f"Erreur generation PDF: {str(e)}")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ordonnance_{prescription_id}.pdf"',
            "Content-Type": "application/pdf",
        }
    )


def _clean_text(text: str) -> str:
    """Nettoie le texte pour ReportLab (echappement XML/HTML)"""
    if not text:
        return ""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    text = text.replace('"', "&quot;")
    text = text.replace("'", "&apos;")
    return text


def _generate_prescription_pdf(prescription: dict, medications: list) -> bytes:
    """Genere un PDF d'ordonnance medicale"""

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()
    navy = colors.HexColor("#0A2647")
    gold = colors.HexColor("#D4A500")
    muted = colors.HexColor("#64748B")
    border = colors.HexColor("#E2E8F0")

    # Styles custom
    title_style = ParagraphStyle(
        'Title', parent=styles['Heading1'], fontSize=22, textColor=navy,
        spaceAfter=6, alignment=TA_CENTER, fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        'Subtitle', parent=styles['Normal'], fontSize=9, textColor=muted,
        alignment=TA_CENTER, spaceAfter=20
    )
    section_style = ParagraphStyle(
        'Section', parent=styles['Heading2'], fontSize=11, textColor=navy,
        spaceBefore=12, spaceAfter=6, fontName="Helvetica-Bold"
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'], fontSize=10, leading=14,
        spaceAfter=4
    )
    med_name_style = ParagraphStyle(
        'MedName', parent=styles['Normal'], fontSize=11, textColor=navy,
        fontName="Helvetica-Bold", spaceAfter=2
    )
    med_detail_style = ParagraphStyle(
        'MedDetail', parent=styles['Normal'], fontSize=9, textColor=muted,
        leading=12, leftIndent=10
    )
    footer_style = ParagraphStyle(
        'Footer', parent=styles['Normal'], fontSize=8, textColor=muted,
        alignment=TA_CENTER, leading=10
    )

    story = []

    # === EN-TETE ===
    story.append(Paragraph("<b>ORDONNANCE MEDICALE</b>", title_style))
    story.append(Paragraph("Document officiel - A conserver", subtitle_style))
    story.append(HRFlowable(width=170*mm, thickness=1.5, color=gold))
    story.append(Spacer(1, 8*mm))

    # === INFO MEDECIN ===
    doctor_name = prescription.get("doctor_name", "Dr. Inconnu")
    doctor_specialty = prescription.get("doctor_specialty", "")

    # FIX: Remove "Dr." prefix if already present to avoid "Dr.Dr."
    display_doctor_name = doctor_name
    if doctor_name.startswith("Dr.") or doctor_name.startswith("Dr "):
        display_doctor_name = doctor_name
    else:
        display_doctor_name = f"Dr. {doctor_name}"

    doctor_info = [
        [Paragraph("<b>Medecin prescripteur</b>", section_style), ""],
        [Paragraph(f"{display_doctor_name}", body_style), 
         Paragraph(f"Specialite: {doctor_specialty}", body_style)],
    ]
    doctor_table = Table(doctor_info, colWidths=[85*mm, 85*mm])
    doctor_table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
    ]))
    story.append(doctor_table)
    story.append(Spacer(1, 6*mm))

    # === INFO PATIENT ===
    patient_name = prescription.get("patient_name", "Patient")
    created_at = prescription.get("created_at", datetime.now())
    if hasattr(created_at, 'strftime'):
        date_str = created_at.strftime("%d/%m/%Y")
    else:
        date_str = str(created_at)[:10]

    patient_info = [
        [Paragraph("<b>Patient</b>", section_style), 
         Paragraph("<b>Date</b>", section_style)],
        [Paragraph(patient_name, body_style), 
         Paragraph(date_str, body_style)],
    ]
    patient_table = Table(patient_info, colWidths=[85*mm, 85*mm])
    patient_table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 10*mm))

    # === MEDICAMENTS ===
    story.append(Paragraph("Medicaments prescrits", section_style))
    story.append(HRFlowable(width=170*mm, thickness=0.5, color=border))
    story.append(Spacer(1, 4*mm))

    if medications:
        for i, med in enumerate(medications, 1):
            med_name = med.get("name", "Non specifie")
            dosage = med.get("dosage", "")
            frequency = med.get("frequency", "")
            duration = med.get("duration", "")

            story.append(Paragraph(f"{i}. {med_name}", med_name_style))

            details = []
            if dosage:
                details.append(f"• Dosage: {dosage}")
            if frequency:
                details.append(f"• Frequence: {frequency}")
            if duration:
                details.append(f"• Duree: {duration}")

            if details:
                story.append(Paragraph("<br/>".join(details), med_detail_style))
            story.append(Spacer(1, 6*mm))
    else:
        story.append(Paragraph("Aucun medicament prescrit.", body_style))

    story.append(Spacer(1, 8*mm))

    # === NOTES ===
    notes = prescription.get("notes", "")
    if notes:
        story.append(Paragraph("Notes / Instructions", section_style))
        story.append(HRFlowable(width=170*mm, thickness=0.5, color=border))
        story.append(Spacer(1, 4*mm))
        story.append(Paragraph(notes.replace(chr(10), "<br/>"), body_style))
        story.append(Spacer(1, 10*mm))

    # === SIGNATURE ===
    story.append(HRFlowable(width=170*mm, thickness=0.5, color=border))
    story.append(Spacer(1, 10*mm))

    # Recuperer la signature du medecin selon le type choisi lors de la creation
    sig_type = prescription.get("signature_type", "text")
    sig_text = prescription.get("signature_text", "")
    signature_url = prescription.get("doctor_signature_url") or ""
    signature_text = prescription.get("doctor_signature_text", "")

    signature_elements = []

    if sig_type == "draw" and signature_url:
        # === SIGNATURE IMAGE (manuscrite) ===
        sig_path = signature_url.lstrip("/")
        if not sig_path.startswith("uploads/"):
            sig_path = f"uploads/avatars/{sig_path.split('/')[-1]}"

        full_path = Path(sig_path)
        if full_path.exists():
            try:
                sig_img = RLImage(str(full_path), width=40*mm, height=15*mm, kind="proportional")
                signature_elements = [
                    Paragraph("<b>Signature du medecin</b>", body_style),
                    Spacer(1, 2*mm),
                    sig_img,
                ]
            except Exception as e:
                print(f"[PDF] Erreur chargement signature image: {e}")
                # Fallback sur texte
                if signature_text:
                    sig_style = ParagraphStyle(
                        'SigText', parent=body_style,
                        fontName="Helvetica-Oblique", fontSize=16,
                        textColor=navy, leading=20,
                    )
                    signature_elements = [
                        Paragraph("<b>Signature du medecin</b>", body_style),
                        Spacer(1, 4*mm),
                        Paragraph(f"<i>{_clean_text(signature_text)}</i>", sig_style),
                    ]
                else:
                    signature_elements = [
                        Paragraph("<b>Signature du medecin</b><br/><br/>_________________________", body_style),
                    ]
        else:
            # Image manquante -> fallback texte
            if signature_text:
                sig_style = ParagraphStyle(
                    'SigText', parent=body_style,
                    fontName="Helvetica-Oblique", fontSize=16,
                    textColor=navy, leading=20,
                )
                signature_elements = [
                    Paragraph("<b>Signature du medecin</b>", body_style),
                    Spacer(1, 4*mm),
                    Paragraph(f"<i>{_clean_text(signature_text)}</i>", sig_style),
                ]
            else:
                signature_elements = [
                    Paragraph("<b>Signature du medecin</b><br/><br/>_________________________", body_style),
                ]
    elif sig_type == "text" and (sig_text or signature_text):
        # === SIGNATURE TEXTE ===
        text_to_use = sig_text or signature_text
        sig_style = ParagraphStyle(
            'SigText',
            parent=body_style,
            fontName="Helvetica-Oblique",
            fontSize=16,
            textColor=navy,
            leading=20,
        )
        signature_elements = [
            Paragraph("<b>Signature du medecin</b>", body_style),
            Spacer(1, 4*mm),
            Paragraph(f"<i>{_clean_text(text_to_use)}</i>", sig_style),
        ]
    else:
        # === AUCUNE SIGNATURE ===
        signature_elements = [
            Paragraph("<b>Signature du medecin</b><br/><br/>_________________________", body_style),
        ]

    # Nom du medecin
    signature_data = [
        [Paragraph(f"<b>{display_doctor_name}</b><br/>{prescription.get('doctor_specialty', '')}", body_style), 
         signature_elements],
    ]
    sig_table = Table(signature_data, colWidths=[85*mm, 85*mm])
    sig_table.setStyle(TableStyle([
        ("ALIGN", (0,0), (0,0), "LEFT"),
        ("ALIGN", (1,0), (1,0), "RIGHT"),
        ("VALIGN", (0,0), (-1,-1), "BOTTOM"),
    ]))
    story.append(sig_table)

    # === FOOTER ===
    story.append(Spacer(1, 20*mm))
    story.append(HRFlowable(width=170*mm, thickness=0.5, color=border))
    story.append(Paragraph(
        "<b>Important :</b> Cette ordonnance est un document medical officiel. "
        "Elle est valable sur presentation en pharmacie. <br/>"
        "<i>MedAI - Plateforme medicale assistee par intelligence artificielle</i> - "
        f"Document genere le {datetime.now().strftime('%d/%m/%Y a %H:%M')}", 
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()