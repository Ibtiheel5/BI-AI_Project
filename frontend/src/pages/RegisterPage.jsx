// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",        // ✅ camelCase — correspond à ce qu'attend AuthContext.register()
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialty: "",
    institution: "",
    phone: "",
    domains: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDomain = (key) => {
    // ✅ "retina" n'existe pas dans le backend — on filtre pour ne garder que les 3 valides
    const VALID_BACKEND_DOMAINS = ["chest", "lung", "brain"];
    if (!VALID_BACKEND_DOMAINS.includes(key)) return;
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(key)
        ? prev.domains.filter(d => d !== key)
        : [...prev.domains, key]
    }));
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return "Veuillez entrer votre nom complet";
    if (!formData.username.match(/^[a-zA-Z0-9._-]{3,50}$/))
      return "Identifiant invalide (3-50 caractères, lettres/chiffres/points/tirets)";
    if (formData.password.length < 6)
      return "Le mot de passe doit contenir au moins 6 caractères";
    if (formData.password !== formData.confirmPassword)
      return "Les mots de passe ne correspondent pas";
    return null;
  };

  const handleSubmit = async () => {
    if (role === "Medecin" && formData.domains.length === 0) {
      setError("Veuillez sélectionner au moins un domaine médical");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ✅ FIX PRINCIPAL : on passe fullName (camelCase) comme AuthContext.register() l'attend.
      // AuthContext convertit ensuite full_name → backend.
      // On NE passe PAS email/institution/phone car le backend RegisterRequest ne les connaît pas.
      await register({
        username:  formData.username,
        password:  formData.password,
        fullName:  formData.fullName,          // ✅ camelCase ← c'est ce qu'attend AuthContext
        domains:   role === "Patient" ? [] : formData.domains,
        specialty: formData.specialty || "",
        role:      role,
        // ❌ NE PAS envoyer : email, institution, phone
        // Le backend auth.py → RegisterRequest ne les accepte pas → 422
      });
      setStep(3);
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // ── Domaines — "retina" retiré car absent du backend ─────────────
  const DOMAIN_OPTIONS = [
    {
      key: "chest",
      label: "Radiologie Thoracique",
      icon: "🫁",
      desc: "Analyse de radiographies pulmonaires (10 pathologies)",
      color: "#2D5F9E",
      bg: "rgba(45,95,158,0.08)",
    },
    {
      key: "brain",
      label: "Neurologie & IRM",
      icon: "🧠",
      desc: "Analyse d'IRM cérébrales — 4 types de tumeurs",
      color: "#6B4FA0",
      bg: "rgba(107,79,160,0.08)",
    },
    {
      key: "lung",
      label: "Cancer Pulmonaire",
      icon: "🔬",
      desc: "Détection de lésions pulmonaires sur scanner CT",
      color: "#D62828",
      bg: "rgba(214,40,40,0.08)",
    },
    // ❌ "retina" supprimé — n'existe pas dans auth.py (domaines valides: chest, lung, brain)
  ];

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>🏥</div>
            <div>
              <div style={styles.logoText}>Med<span style={{color: "#2D5F9E"}}>AI</span></div>
              <div style={styles.logoSub}>Télémédecine</div>
            </div>
          </div>

          <h1 style={styles.title}>
            Créer votre compte<br />
            <span style={{color: "#2D5F9E"}}>MedAI</span>
          </h1>

          <p style={styles.description}>
            Rejoignez la plateforme de diagnostic assisté par IA
          </p>

          <div style={styles.domainPreview}>
            {[
              { icon: "🫁", label: "Thorax",     color: "#2D5F9E" },
              { icon: "🧠", label: "Neurologie", color: "#6B4FA0" },
              { icon: "🔬", label: "Oncologie",  color: "#D62828" },
            ].map(d => (
              <div key={d.label} style={{
                ...styles.domainPill,
                borderColor: d.color + "40",
                color: d.color,
                background: d.color + "15",
              }}>
                <span style={{fontSize: '16px'}}>{d.icon}</span>
                <span style={{fontSize: '12px', fontWeight: 600}}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>

          {/* ── ÉTAPE 0 : Choix du rôle ─────────────────────────── */}
          {step === 0 && (
            <>
              <div style={styles.formHeader}>
                <div style={styles.formIcon}>📝</div>
                <h2 style={styles.formTitle}>Créer un compte</h2>
                <p style={styles.formSubtitle}>Choisissez votre type de compte</p>
              </div>

              <div style={styles.roleContainer}>
                <button
                  onClick={() => { setRole("Medecin"); setStep(1); }}
                  style={styles.roleCard}
                >
                  <span style={styles.roleIcon}>👨‍⚕️</span>
                  <div>
                    <div style={styles.roleTitle}>Professionnel de santé</div>
                    <div style={styles.roleDesc}>Médecin, radiologue, neurologue...</div>
                  </div>
                  <span style={styles.roleArrow}>→</span>
                </button>

                <button
                  onClick={() => { setRole("Patient"); setStep(1); }}
                  style={styles.roleCard}
                >
                  <span style={styles.roleIcon}>👤</span>
                  <div>
                    <div style={styles.roleTitle}>Patient</div>
                    <div style={styles.roleDesc}>Accédez à vos résultats et suivis</div>
                  </div>
                  <span style={styles.roleArrow}>→</span>
                </button>
              </div>

              <p style={styles.loginLink}>
                Déjà un compte ?{" "}
                <Link to="/login" style={styles.link}>Se connecter</Link>
              </p>
            </>
          )}

          {/* ── ÉTAPE 1 : Informations personnelles ─────────────── */}
          {step === 1 && (
            <>
              <div style={styles.formHeader}>
                <button onClick={() => setStep(0)} style={styles.backButton}>← Retour</button>
                <div style={styles.formIcon}>📋</div>
                <h2 style={styles.formTitle}>Informations</h2>
                <p style={styles.formSubtitle}>
                  {role === "Medecin"
                    ? "Créez votre compte professionnel"
                    : "Créez votre compte patient"}
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nom complet *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    style={styles.input}
                    placeholder={role === "Medecin" ? "Dr. Jean Dupont" : "Jean Dupont"}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Identifiant *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateForm("username", e.target.value.toLowerCase())}
                    style={styles.input}
                    placeholder="ex: jean.dupont"
                  />
                </div>

                {/* ✅ Email conservé dans le formulaire mais NON envoyé au backend */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email (optionnel)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    style={{...styles.input, borderStyle: "dashed", opacity: 0.7}}
                    placeholder="votre@email.com"
                  />
                  <span style={{fontSize: "11px", color: "#94A3B8", marginTop: "2px"}}>
                    ℹ️ Non requis par le système actuellement
                  </span>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mot de passe *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    style={styles.input}
                    placeholder="••••••••  (6 caractères min.)"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirmer le mot de passe *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateForm("confirmPassword", e.target.value)}
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>

                {role === "Medecin" && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Spécialité (optionnel)</label>
                    <input
                      type="text"
                      value={formData.specialty}
                      onChange={(e) => updateForm("specialty", e.target.value)}
                      style={styles.input}
                      placeholder="Radiologie, Neurologie..."
                    />
                  </div>
                )}

                {error && (
                  <div style={styles.errorBox}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <button
                  onClick={() => {
                    const err = validateStep1();
                    if (err) { setError(err); return; }
                    setError("");
                    if (role === "Patient") handleSubmit();
                    else setStep(2);
                  }}
                  disabled={loading}
                  style={{
                    ...styles.submitButton,
                    ...(loading ? {opacity: 0.7, cursor: "not-allowed"} : {}),
                  }}
                >
                  {loading ? "Création..." : role === "Patient" ? "Créer mon compte →" : "Continuer →"}
                </button>
              </form>
            </>
          )}

          {/* ── ÉTAPE 2 : Sélection des domaines (médecins) ─────── */}
          {step === 2 && role === "Medecin" && (
            <>
              <div style={styles.formHeader}>
                <button onClick={() => setStep(1)} style={styles.backButton}>← Retour</button>
                <div style={styles.formIcon}>🏥</div>
                <h2 style={styles.formTitle}>Domaines médicaux</h2>
                <p style={styles.formSubtitle}>
                  Sélectionnez vos spécialités (plusieurs possibles)
                </p>
              </div>

              <div style={styles.domainsContainer}>
                {DOMAIN_OPTIONS.map((domain) => {
                  const selected = formData.domains.includes(domain.key);
                  return (
                    <button
                      key={domain.key}
                      onClick={() => toggleDomain(domain.key)}
                      style={{
                        ...styles.domainCard,
                        ...(selected ? {
                          borderColor: domain.color,
                          backgroundColor: domain.bg,
                          boxShadow: `0 0 0 3px ${domain.color}20`,
                        } : {}),
                      }}
                    >
                      <span style={styles.domainIcon}>{domain.icon}</span>
                      <div style={styles.domainInfo}>
                        <div style={{
                          ...styles.domainLabel,
                          ...(selected ? {color: domain.color} : {}),
                        }}>
                          {domain.label}
                        </div>
                        <div style={styles.domainDesc}>{domain.desc}</div>
                      </div>
                      <div style={{
                        ...styles.domainCheck,
                        background: selected ? domain.color : "#E2E8F0",
                        color: selected ? "white" : "transparent",
                      }}>
                        {selected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.domains.length > 0 && (
                <div style={styles.selectedBadges}>
                  {formData.domains.map(k => {
                    const d = DOMAIN_OPTIONS.find(o => o.key === k);
                    return d ? (
                      <span key={k} style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 10px", borderRadius: "8px", fontSize: "12px",
                        fontWeight: 600, background: d.color + "15", color: d.color,
                        border: `1px solid ${d.color}40`,
                      }}>
                        {d.icon} {d.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || formData.domains.length === 0}
                style={{
                  ...styles.submitButton,
                  marginTop: "20px",
                  ...(formData.domains.length === 0 || loading
                    ? {opacity: 0.5, cursor: "not-allowed"}
                    : {}),
                }}
              >
                {loading
                  ? "Création en cours..."
                  : `Créer mon compte (${formData.domains.length} domaine${formData.domains.length > 1 ? "s" : ""})`}
              </button>
            </>
          )}

          {/* ── ÉTAPE 3 : Succès ─────────────────────────────────── */}
          {step === 3 && (
            <div style={styles.successContainer}>
              <div style={styles.successIcon}>✅</div>
              <h2 style={styles.successTitle}>
                {role === "Medecin" ? "Demande envoyée !" : "Compte créé !"}
              </h2>
              <p style={styles.successMessage}>
                {role === "Medecin"
                  ? "Votre demande a été transmise à l'administrateur. Votre compte sera validé sous peu."
                  : "Votre compte patient a été créé avec succès. Vous pouvez vous connecter dès maintenant."}
              </p>
              <button onClick={() => navigate("/login")} style={styles.submitButton}>
                Se connecter →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    backgroundColor: "#f5f7fa",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #0A2647 0%, #1B3B6F 50%, #2D5F9E 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  leftContent: {
    maxWidth: "450px",
    color: "white",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
  },
  logoText: {
    fontSize: "28px",
    fontWeight: "bold",
  },
  logoSub: {
    fontSize: "11px",
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: "2px",
  },
  title: {
    fontSize: "36px",
    fontWeight: "bold",
    lineHeight: 1.2,
    marginBottom: "20px",
  },
  description: {
    fontSize: "16px",
    opacity: 0.8,
    lineHeight: 1.6,
    marginBottom: "32px",
  },
  domainPreview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  domainPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    borderRadius: "12px",
    border: "1px solid",
  },
  rightPanel: {
    width: "520px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    boxShadow: "-5px 0 20px rgba(0,0,0,0.05)",
    overflowY: "auto",
  },
  formContainer: {
    width: "100%",
    maxWidth: "420px",
  },
  formHeader: {
    textAlign: "center",
    marginBottom: "32px",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    background: "none",
    border: "none",
    color: "#2D5F9E",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
  formIcon: {
    width: "64px",
    height: "64px",
    backgroundColor: "#E5F0F8",
    borderRadius: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    margin: "0 auto 16px",
  },
  formTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0A2647",
    marginBottom: "8px",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#64748B",
  },
  roleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  },
  roleCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    border: "2px solid #E2E8F0",
    borderRadius: "16px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.3s",
    textAlign: "left",
  },
  roleIcon: { fontSize: "40px" },
  roleTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#0A2647",
    marginBottom: "4px",
  },
  roleDesc: { fontSize: "13px", color: "#64748B" },
  roleArrow: { fontSize: "20px", color: "#2D5F9E", marginLeft: "auto" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#1B3B6F",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    padding: "12px",
    color: "#DC2626",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#2D5F9E",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s",
    fontFamily: "inherit",
  },
  domainsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "12px",
  },
  domainCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    border: "2px solid #E2E8F0",
    borderRadius: "14px",
    background: "white",
    cursor: "pointer",
    transition: "all 0.25s",
    textAlign: "left",
  },
  domainIcon: { fontSize: "28px", flexShrink: 0 },
  domainInfo: { flex: 1 },
  domainLabel: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#0A2647",
    marginBottom: "3px",
    transition: "color 0.25s",
  },
  domainDesc: { fontSize: "12px", color: "#64748B", lineHeight: 1.4 },
  domainCheck: {
    width: "24px",
    height: "24px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
    flexShrink: 0,
    transition: "all 0.25s",
  },
  selectedBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "8px",
  },
  successContainer: { textAlign: "center" },
  successIcon: { fontSize: "64px", marginBottom: "20px" },
  successTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0A2647",
    marginBottom: "12px",
  },
  successMessage: {
    fontSize: "14px",
    color: "#64748B",
    lineHeight: 1.6,
    marginBottom: "24px",
  },
  loginLink: {
    textAlign: "center",
    fontSize: "13px",
    color: "#64748B",
    marginTop: "20px",
  },
  link: {
    color: "#2D5F9E",
    textDecoration: "none",
    fontWeight: "bold",
  },
};