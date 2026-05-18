// src/pages/patient/UploadPage.jsx
import { useState, useRef } from "react";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Spinner } from "../../components/ui/Spinner";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { THEME, EXAM_TYPES } from "../../constants/theme";

export const UploadPage = ({ token, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedExam, setSelectedExam] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const examTypes = Object.values(EXAM_TYPES);

  const handleFile = (f) => {
    if (!f) return;
    const validTypes = ["image/jpeg", "image/png", "image/dicom"];
    if (!validTypes.includes(f.type) && !f.name.endsWith(".dcm")) {
      setError("Format non supporté. Formats acceptés : JPEG, PNG, DICOM.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError("Fichier trop volumineux (maximum 20 Mo).");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleSubmit = async () => {
    if (!file || !selectedExam || !symptoms.trim()) return;
    setLoading(true);
    setError("");
    const progressInterval = simulateProgress();
    
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("model_key", selectedExam.key);
      form.append("patient_notes", `Symptômes: ${symptoms}\n\nInformations complémentaires: ${additionalInfo}`);
      
      const response = await fetch("http://localhost:8000/api/v1/consultations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Erreur lors de la soumission");
      }
      
      setUploadProgress(100);
      setTimeout(() => setSuccess(true), 500);
    } catch (e) {
      clearInterval(progressInterval);
      setError(e.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 550, margin: "80px auto", textAlign: "center" }}>
        <Card padding="52px" style={{ animation: "scaleIn 0.5s ease" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px", background: THEME.colors.successSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check" size={40} color={THEME.colors.success} />
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: THEME.colors.text, marginBottom: 12 }}>Dossier soumis avec succès !</h2>
          <p style={{ fontSize: "0.95rem", color: THEME.colors.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>
            Votre dossier a été transmis à notre équipe médicale. Un médecin spécialiste le prendra en charge sous 24 à 48 heures.
          </p>
          <Button onClick={onSuccess} variant="primary" size="lg">Consulter mes dossiers</Button>
        </Card>
        <style>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <SectionHeader title="Soumettre un dossier médical" subtitle={step === 1 ? "Étape 1 : Sélectionnez le type d'examen" : "Étape 2 : Téléchargez votre image et décrivez vos symptômes"} badge={{ text: `Étape ${step}/2`, variant: "info" }} />

      {/* Barre de progression */}
      <div style={{ display: "flex", gap: 24, marginBottom: 36, alignItems: "center" }}>
        {[1, 2].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", background: step >= s ? THEME.colors.accent : THEME.colors.border, color: step >= s ? "white" : THEME.colors.textMuted, transition: THEME.transitions.normal, boxShadow: step >= s ? `0 4px 12px ${THEME.colors.accent}40` : "none" }}>
              {step > s ? <Icon name="check" size={18} color="white" /> : s}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: step >= s ? THEME.colors.text : THEME.colors.textMuted }}>{s === 1 ? "Type d'examen" : "Image & symptômes"}</div>
              {s === 1 && step > 1 && selectedExam && <div style={{ fontSize: "0.8rem", color: THEME.colors.accent, fontWeight: 500 }}>{selectedExam.label}</div>}
            </div>
          </div>
        ))}
        <div style={{ flex: 1, height: 2, background: THEME.colors.border, borderRadius: 1 }}>
          <div style={{ height: "100%", borderRadius: 1, background: THEME.colors.accent, width: step === 1 ? "0%" : "100%", transition: THEME.transitions.slow }} />
        </div>
      </div>

      {error && (
        <div style={{ padding: "16px 20px", borderRadius: THEME.radii.md, background: THEME.colors.dangerSoft, border: `1px solid #FECACA`, color: THEME.colors.danger, fontSize: "0.9rem", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="x" size={20} color={THEME.colors.danger} /> {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {examTypes.map((exam) => (
            <Card key={exam.key} hoverable onClick={() => { setSelectedExam(exam); setStep(2); }} padding="28px">
              <div style={{ display: "flex", gap: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: THEME.radii.lg, background: `${exam.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={exam.icon} size={30} color={exam.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: THEME.colors.text, marginBottom: 6, fontFamily: THEME.fonts.display }}>{exam.label}</h3>
                  <p style={{ fontSize: "0.85rem", color: THEME.colors.textSecondary, lineHeight: 1.5, marginBottom: 12 }}>{exam.longDescription}</p>
                  <div style={{ display: "flex", gap: 16, fontSize: "0.78rem", color: THEME.colors.textMuted, marginBottom: 8 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="clock" size={14} /> {exam.duration}</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: THEME.colors.textMuted }}><strong>Indications :</strong> {exam.indications}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {step === 2 && selectedExam && (
        <div>
          <button onClick={() => { setStep(1); setFile(null); setPreview(null); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: THEME.colors.textSecondary, fontWeight: 500, fontSize: "0.9rem", marginBottom: 24, padding: "8px 12px", borderRadius: THEME.radii.md, transition: THEME.transitions.fast }} onMouseEnter={e => { e.currentTarget.style.background = THEME.colors.bgAlt; e.currentTarget.style.color = THEME.colors.text; }} onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = THEME.colors.textSecondary; }}>
            <Icon name="chevronRight" size={16} style={{ transform: "rotate(180deg)" }} /> Retour au choix de l'examen
          </button>

          <Card padding="24px" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: THEME.radii.md, background: `${selectedExam.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={selectedExam.icon} size={24} color={selectedExam.color} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: THEME.colors.text, fontSize: "0.95rem" }}>{selectedExam.label}</div>
                <div style={{ fontSize: "0.82rem", color: THEME.colors.textSecondary }}>{selectedExam.description}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: THEME.radii.md, background: THEME.colors.bgAlt, fontSize: "0.85rem", color: THEME.colors.textSecondary, lineHeight: 1.6 }}>
              <strong style={{ color: THEME.colors.text }}>Préparation :</strong> {selectedExam.preparation}<br />
              <strong style={{ color: THEME.colors.text }}>Durée estimée :</strong> {selectedExam.duration}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, color: THEME.colors.text, marginBottom: 12, fontSize: "0.9rem" }}>Image médicale *</label>
              {!preview ? (
                <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }} style={{ border: `2.5px dashed ${THEME.colors.border}`, borderRadius: THEME.radii.xl, padding: "56px 24px", textAlign: "center", cursor: "pointer", background: THEME.colors.surface, transition: THEME.transitions.normal, minHeight: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => { e.currentTarget.style.borderColor = selectedExam.color; e.currentTarget.style.background = `${selectedExam.color}03`; }} onMouseLeave={e => { e.currentTarget.style.borderColor = THEME.colors.border; e.currentTarget.style.background = THEME.colors.surface; }}>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,.dcm" onChange={e => handleFile(e.target.files[0])} style={{ display: "none" }} />
                  <Icon name="upload" size={48} color={THEME.colors.textMuted} />
                  <p style={{ fontWeight: 600, color: THEME.colors.text, marginTop: 14, marginBottom: 6 }}>Déposez votre image ici</p>
                  <p style={{ fontSize: "0.85rem", color: THEME.colors.textSecondary }}>JPEG • PNG • DICOM • 20 Mo max</p>
                </div>
              ) : (
                <Card padding="0" style={{ overflow: "hidden", position: "relative" }}>
                  <img src={preview} alt="Aperçu" style={{ width: "100%", height: 300, objectFit: "contain", background: "#0F172A" }} />
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 8 }}>
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ padding: "8px 16px", borderRadius: THEME.radii.md, background: "rgba(255,255,255,0.95)", border: "none", color: THEME.colors.text, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer" }}>Remplacer</button>
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge variant="success" size="sm">Image chargée</Badge>
                    <span style={{ fontSize: "0.8rem", color: THEME.colors.textSecondary }}>{file?.name} ({(file?.size / 1024 / 1024).toFixed(1)} Mo)</span>
                  </div>
                </Card>
              )}
            </div>

            <div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, color: THEME.colors.text, marginBottom: 8, fontSize: "0.9rem" }}>Symptômes observés *</label>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={5} placeholder="Décrivez précisément vos symptômes : localisation, intensité, durée, facteurs déclenchants..." style={{ width: "100%", padding: "14px 16px", borderRadius: THEME.radii.lg, border: `1.5px solid ${THEME.colors.border}`, fontSize: "0.9rem", fontFamily: "inherit", resize: "vertical", outline: "none", background: THEME.colors.surface, transition: THEME.transitions.fast }} onFocus={e => e.currentTarget.style.borderColor = THEME.colors.accent} onBlur={e => e.currentTarget.style.borderColor = THEME.colors.border} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, color: THEME.colors.text, marginBottom: 8, fontSize: "0.9rem" }}>Informations complémentaires</label>
                <textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} rows={4} placeholder="Antécédents médicaux, traitements en cours, allergies..." style={{ width: "100%", padding: "14px 16px", borderRadius: THEME.radii.lg, border: `1.5px solid ${THEME.colors.border}`, fontSize: "0.9rem", fontFamily: "inherit", resize: "vertical", outline: "none", background: THEME.colors.surface, transition: THEME.transitions.fast }} onFocus={e => e.currentTarget.style.borderColor = THEME.colors.accent} onBlur={e => e.currentTarget.style.borderColor = THEME.colors.border} />
              </div>

              {loading && <div style={{ marginBottom: 16 }}><ProgressBar value={uploadProgress} color={THEME.colors.accent} showLabel /></div>}

              <Button onClick={handleSubmit} disabled={!file || !symptoms.trim() || loading} fullWidth variant="primary" size="lg" loading={loading} icon="upload">
                {loading ? "Envoi en cours..." : "Soumettre le dossier"}
              </Button>

              <p style={{ textAlign: "center", marginTop: 12, fontSize: "0.78rem", color: THEME.colors.textMuted }}>En soumettant, vous acceptez que vos données soient analysées par notre IA et nos médecins.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};