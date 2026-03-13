// RegisterPage.jsx — Thème clair bleu médical professionnel
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID  = "service_uaw6eeh";
const EMAILJS_TEMPLATE_ID = "template_sc7pb5n";
const EMAILJS_PUBLIC_KEY  = "K6sSCJ-bKEor0mCFD";
const ADMIN_EMAIL         = "ton.email@gmail.com"; // ← remplace par ton email

const DOMAIN_OPTIONS = [
  { key: "chest", label: "Radiologie Thoracique", icon: "🫁", desc: "Chest X-Ray · 10 pathologies" },
  { key: "brain", label: "Neurologie",            icon: "🧠", desc: "Brain MRI · Tumeurs cérébrales" },
  { key: "lung",  label: "Cancer Pulmonaire",     icon: "🔬", desc: "CT Scan · Détection lésions" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep]             = useState(1);
  const [fullName, setFullName]     = useState("");
  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [password2, setPassword2]   = useState("");
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [message, setMessage]       = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [focused, setFocused]       = useState(null);

  const toggleDomain = (key) =>
    setSelectedDomains(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );

  const validateStep1 = () => {
    if (!fullName.trim()) return "Veuillez entrer votre nom complet.";
    if (!username.trim()) return "Veuillez choisir un identifiant.";
    if (!email.trim() || !email.includes("@")) return "Email invalide.";
    if (password.length < 6) return "Mot de passe trop court (min 6 caractères).";
    if (password !== password2) return "Les mots de passe ne correspondent pas.";
    return null;
  };

  const handleStep1 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError(""); setStep(2);
  };

  const handleSubmit = async () => {
    if (selectedDomains.length === 0) { setError("Veuillez sélectionner au moins un domaine."); return; }
    setError(""); setLoading(true);

    const request = {
      id: Date.now().toString(), fullName, username, email, password,
      domains: selectedDomains, message, status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("chestai-pending") || "[]");
      if (existing.some(r => r.username === username)) {
        setError("Cet identifiant est déjà utilisé."); setLoading(false); return;
      }
      existing.push(request);
      localStorage.setItem("chestai-pending", JSON.stringify(existing));

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        admin_email: ADMIN_EMAIL,
        doctor_name: fullName,
        username,
        domains: selectedDomains.join(", "),
        from_email: email,
        message: message || "Aucun message.",
      }, EMAILJS_PUBLIC_KEY);

      setStep(3);
    } catch (e) {
      console.error("EmailJS error:", e);
      setStep(3);
    } finally { setLoading(false); }
  };

  const inputStyle = (name) => ({
    width: "100%",
    padding: "11px 14px 11px 42px",
    background: focused === name ? "#EFF6FF" : "#F8FAFC",
    border: focused === name ? "1.5px solid #2D5F9E" : "1.5px solid #E2E8F0",
    borderRadius: 10, color: "#0A2647", fontSize: "0.88rem",
    outline: "none", boxSizing: "border-box", transition: "all 0.2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif", padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #1B3B6F, #2D5F9E)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: "1.5rem", boxShadow: "0 8px 24px rgba(45,95,158,0.3)" }}>🏥</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0A2647", letterSpacing: "-0.03em", margin: 0 }}>
            Med<span style={{ color: "#2D5F9E" }}>AI</span>
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.82rem", marginTop: 4 }}>Créer un compte médecin</p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {["Informations", "Domaines", "Confirmation"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step > i + 1 ? "#16A34A" : step === i + 1 ? "#2D5F9E" : "#E2E8F0",
                border: step === i + 1 ? "2px solid #93C5FD" : "2px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                color: step >= i + 1 ? "white" : "#94A3B8",
                transition: "all 0.3s",
              }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: "0.72rem", color: step === i + 1 ? "#0A2647" : "#94A3B8", fontWeight: step === i + 1 ? 700 : 400 }}>
                {label}
              </span>
              {i < 2 && <div style={{ width: 20, height: 1.5, background: "#E2E8F0" }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "white", borderRadius: 20,
          border: "1px solid #E2E8F0", padding: "32px 36px",
          boxShadow: "0 8px 40px rgba(10,38,71,0.1)",
        }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0A2647", marginBottom: 20 }}>Vos informations</h2>
              {[
                { name: "fullName",  label: "Nom complet",            icon: "👤", value: fullName,  setter: setFullName,  type: "text",     placeholder: "Dr. Jean Dupont" },
                { name: "username",  label: "Identifiant",            icon: "🔖", value: username,  setter: setUsername,  type: "text",     placeholder: "dr.dupont" },
                { name: "email",     label: "Email professionnel",    icon: "📧", value: email,     setter: setEmail,     type: "email",    placeholder: "jean.dupont@hopital.fr" },
                { name: "password",  label: "Mot de passe",           icon: "🔒", value: password,  setter: setPassword,  type: "password", placeholder: "••••••••" },
                { name: "password2", label: "Confirmer mot de passe", icon: "🔒", value: password2, setter: setPassword2, type: "password", placeholder: "••••••••" },
              ].map(({ name, label, icon, value, setter, type, placeholder }) => (
                <div key={name} style={{ marginBottom: 13 }}>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", color: "#94A3B8" }}>{icon}</span>
                    <input type={type} value={value} onChange={e => setter(e.target.value)}
                      onFocus={() => setFocused(name)} onBlur={() => setFocused(null)}
                      placeholder={placeholder} style={inputStyle(name)} />
                  </div>
                </div>
              ))}

              {error && <div style={{ margin: "10px 0", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#DC2626", fontSize: "0.82rem" }}>⚠️ {error}</div>}

              <button onClick={handleStep1} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #1B3B6F, #2D5F9E)", border: "none", borderRadius: 10, color: "white", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer", marginTop: 8, boxShadow: "0 4px 16px rgba(45,95,158,0.3)" }}>
                Continuer →
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0A2647", marginBottom: 6 }}>Choisir votre spécialité</h2>
              <p style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: 18 }}>Sélectionnez un ou plusieurs domaines médicaux</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                {DOMAIN_OPTIONS.map(d => (
                  <button key={d.key} onClick={() => toggleDomain(d.key)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    background: selectedDomains.includes(d.key) ? "#EFF6FF" : "#F8FAFC",
                    border: selectedDomains.includes(d.key) ? "1.5px solid #2D5F9E" : "1.5px solid #E2E8F0",
                    borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: "1.7rem" }}>{d.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0A2647" }}>{d.label}</div>
                      <div style={{ fontSize: "0.73rem", color: "#64748B" }}>{d.desc}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: selectedDomains.includes(d.key) ? "none" : "2px solid #CBD5E1",
                      background: selectedDomains.includes(d.key) ? "#2D5F9E" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", color: "white",
                    }}>
                      {selectedDomains.includes(d.key) ? "✓" : ""}
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
                  Message pour l'admin (optionnel)
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Ex: Je suis radiologue au CHU de Paris..." rows={3}
                  style={{ width: "100%", padding: "11px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, color: "#0A2647", fontSize: "0.85rem", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }} />
              </div>

              {error && <div style={{ marginBottom: 12, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#DC2626", fontSize: "0.82rem" }}>⚠️ {error}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setError(""); }} style={{ flex: 1, padding: 13, background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 10, color: "#475569", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer" }}>
                  ← Retour
                </button>
                <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: 13, background: loading ? "#93C5FD" : "linear-gradient(135deg, #1B3B6F, #2D5F9E)", border: "none", borderRadius: 10, color: "white", fontSize: "0.92rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading ? (<><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Envoi...</>) : "Envoyer la demande ✓"}
                </button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #86EFAC", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "2rem" }}>✅</div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0A2647", marginBottom: 10 }}>Demande envoyée !</h2>
              <p style={{ fontSize: "0.85rem", color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>
                Votre demande a été transmise à l'administrateur.<br />
                Vous recevrez une confirmation une fois approuvée.
              </p>
              <div style={{ padding: "16px 20px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, marginBottom: 24, textAlign: "left" }}>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Récapitulatif</div>
                <div style={{ fontSize: "0.85rem", color: "#0A2647", lineHeight: 1.9 }}>
                  <div>👤 {fullName}</div>
                  <div>🔖 @{username}</div>
                  <div>📧 {email}</div>
                  <div>{selectedDomains.map(k => DOMAIN_OPTIONS.find(d => d.key === k)?.icon + " " + DOMAIN_OPTIONS.find(d => d.key === k)?.label).join(" · ")}</div>
                </div>
              </div>
              <button onClick={() => navigate("/login")} style={{ width: "100%", padding: 13, background: "linear-gradient(135deg, #1B3B6F, #2D5F9E)", border: "none", borderRadius: 10, color: "white", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer" }}>
                Retour à la connexion
              </button>
            </div>
          )}
        </div>

        {step !== 3 && (
          <p style={{ textAlign: "center", marginTop: 18, fontSize: "0.82rem", color: "#64748B" }}>
            Déjà un compte ?{" "}
            <Link to="/login" style={{ color: "#2D5F9E", textDecoration: "none", fontWeight: 700 }}>Se connecter</Link>
          </p>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #CBD5E1; }
      `}</style>
    </div>
  );
}