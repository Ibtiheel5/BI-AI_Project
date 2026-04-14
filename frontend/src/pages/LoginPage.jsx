// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const user = await login(identifier.trim(), password);
      
      if (user.is_admin || user.role === "Administrateur") {
        navigate("/admin");
      } else if (user.role === "Patient") {
        navigate("/patient");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (username, password) => {
    setIdentifier(username);
    setPassword(password);
    setError("");
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* ═══════════════════════════════════════════════════════
            PANNEAU GAUCHE — MÉDICAL PROFESSIONNEL
        ═══════════════════════════════════════════════════════ */}
        <div style={styles.leftPanel}>
          {/* Image de fond médicale professionnelle */}
          <div style={styles.imageOverlay}></div>
          <img 
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&q=90"
            alt="Professional Medical Team"
            style={styles.backgroundImage}
          />

          {/* Contenu superposé */}
          <div style={styles.leftContent}>
            {/* Logo médical premium */}
            <div style={styles.brandLogo}>
              <div style={styles.logoCircle}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" 
                    fill="white" fillOpacity="0.9"/>
                  <path d="M12 8v8M8 12h8" stroke="#0EA5E9" strokeWidth="2.5" 
                    strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={styles.logoTitle}>ChestAI</div>
                <div style={styles.logoSubtitle}>MEDICAL INTELLIGENCE PLATFORM</div>
              </div>
            </div>

            {/* Citation médicale premium */}
            <div style={styles.quoteCard}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={styles.quoteIcon}>
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" 
                  fill="rgba(255,255,255,0.15)"/>
              </svg>
              <p style={styles.quoteText}>
                "L'IA transforme notre capacité à diagnostiquer avec précision et rapidité. 
                ChestAI est devenu un outil indispensable dans notre pratique quotidienne."
              </p>
              <div style={styles.quoteAuthor}>
                <div style={styles.authorAvatar}>
                  <img 
                    src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80"
                    alt="Dr. Sarah Chen"
                    style={styles.avatarImage}
                  />
                </div>
                <div>
                  <div style={styles.authorName}>Dr. Sarah Chen, MD</div>
                  <div style={styles.authorTitle}>Radiologue Senior · CHU Paris-Sud</div>
                  <div style={styles.authorExpertise}>
                    Spécialiste en imagerie thoracique · 15 ans d'expérience
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques médicales premium */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" 
                      strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={styles.statValue}>2.4s</div>
                <div style={styles.statLabel}>Temps d'analyse moyen</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                      strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={styles.statValue}>98.7%</div>
                <div style={styles.statLabel}>Précision diagnostique</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                      strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                      strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={styles.statValue}>250K+</div>
                <div style={styles.statLabel}>Patients analysés</div>
              </div>
            </div>

            {/* Badges de certification médicale */}
            <div style={styles.certBadges}>
              <div style={styles.certBadge}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
                <span>CE Médical IIa</span>
              </div>
              <div style={styles.certBadge}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11.24V7.5a2.5 2.5 0 015 0v3.74c1.21.81 2 2.18 2 3.76 0 2.49-2.01 4.5-4.5 4.5S7 17.49 7 15c0-1.58.79-2.95 2-3.76z"/>
                </svg>
                <span>ISO 13485</span>
              </div>
              <div style={styles.certBadge}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                <span>RGPD Conforme</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PANNEAU DROIT — FORMULAIRE MÉDICAL PREMIUM
        ═══════════════════════════════════════════════════════ */}
        <div style={styles.rightPanel}>
          <div style={styles.formWrapper}>
            {/* En-tête professionnel */}
            <div style={styles.formHeader}>
              <div style={styles.securityBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <span>Connexion Sécurisée SSL/TLS</span>
              </div>
              
              <h1 style={styles.formTitle}>Accès Professionnel</h1>
              <p style={styles.formSubtitle}>
                Connectez-vous à votre espace médical ChestAI pour accéder 
                aux outils de diagnostic assisté par IA.
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeWidth="2" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                  </svg>
                  Identifiant Médical
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={styles.input}
                  placeholder="Numéro RPPS ou email professionnel"
                  autoComplete="username"
                />
                <div style={styles.inputHint}>
                  Format: dr.nom ou nom@etablissement.fr
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Mot de Passe
                </label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeWidth="2"/>
                        <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={styles.formOptions}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" style={styles.checkbox} />
                  <span>Rester connecté (30 jours)</span>
                </label>
                <Link to="/forgot-password" style={styles.forgotLink}>
                  Récupération d'accès
                </Link>
              </div>

              {error && (
                <div style={styles.errorAlert}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <div>
                    <div style={styles.errorTitle}>Échec de connexion</div>
                    <div style={styles.errorMessage}>{error}</div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  ...(loading ? styles.submitButtonDisabled : {}),
                }}
              >
                {loading ? (
                  <>
                    <span style={styles.spinner}></span>
                    <span>Authentification en cours...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 17l5-5-5-5M15 12H3" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Accéder à ChestAI</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerText}>Comptes de Démonstration</span>
            </div>

            {/* Demo accounts - Version médicale professionnelle */}
            <div style={styles.demoSection}>
              <div style={styles.demoGrid}>
                <button onClick={() => fillDemo("dr.martin", "chest123")} style={styles.demoCard}>
                  <div style={styles.demoAvatarWrapper}>
                    <img 
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80"
                      alt="Dr. Martin"
                      style={styles.demoAvatar}
                    />
                    <div style={{...styles.demoStatus, backgroundColor: '#10B981'}}></div>
                  </div>
                  <div style={styles.demoInfo}>
                    <div style={styles.demoName}>Dr. Sophie Martin</div>
                    <div style={styles.demoRole}>Radiologue Senior</div>
                    <div style={styles.demoSpecialty}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      <span>Imagerie thoracique</span>
                    </div>
                  </div>
                </button>

                <button onClick={() => fillDemo("dr.lambert", "neuro123")} style={styles.demoCard}>
                  <div style={styles.demoAvatarWrapper}>
                    <img 
                      src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&q=80"
                      alt="Dr. Lambert"
                      style={styles.demoAvatar}
                    />
                    <div style={{...styles.demoStatus, backgroundColor: '#10B981'}}></div>
                  </div>
                  <div style={styles.demoInfo}>
                    <div style={styles.demoName}>Dr. Jean Lambert</div>
                    <div style={styles.demoRole}>Neurologue</div>
                    <div style={styles.demoSpecialty}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      <span>IRM cérébrale</span>
                    </div>
                  </div>
                </button>

                <button onClick={() => fillDemo("dr.benali", "lung123")} style={styles.demoCard}>
                  <div style={styles.demoAvatarWrapper}>
                    <img 
                      src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80"
                      alt="Dr. Benali"
                      style={styles.demoAvatar}
                    />
                    <div style={{...styles.demoStatus, backgroundColor: '#10B981'}}></div>
                  </div>
                  <div style={styles.demoInfo}>
                    <div style={styles.demoName}>Dr. Karim Benali</div>
                    <div style={styles.demoRole}>Oncologue</div>
                    <div style={styles.demoSpecialty}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                      </svg>
                      <span>Oncologie pulmonaire</span>
                    </div>
                  </div>
                </button>

                <button onClick={() => fillDemo("patient", "patient123")} style={styles.demoCard}>
                  <div style={styles.demoAvatarWrapper}>
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                      alt="Patient"
                      style={styles.demoAvatar}
                    />
                    <div style={{...styles.demoStatus, backgroundColor: '#0EA5E9'}}></div>
                  </div>
                  <div style={styles.demoInfo}>
                    <div style={styles.demoName}>Ahmed Ben Ali</div>
                    <div style={styles.demoRole}>Patient</div>
                    <div style={styles.demoSpecialty}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span>Espace personnel</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={styles.formFooter}>
              <div style={styles.helpText}>
                Nouveau praticien ? 
                <Link to="/register" style={styles.helpLink}> Demander un accès professionnel</Link>
              </div>
              
              <div style={styles.securityFooter}>
                <div style={styles.securityItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
                  </svg>
                  <span>Cryptage AES-256</span>
                </div>
                <div style={styles.securityItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  <span>Données de santé protégées</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  
  container: {
    display: 'flex',
    maxWidth: '1400px',
    width: '100%',
    minHeight: '85vh',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.5)',
  },

  // ═════════════════════════════════════════
  // PANNEAU GAUCHE - MÉDICAL PROFESSIONNEL
  // ═════════════════════════════════════════
  leftPanel: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '60px',
    overflow: 'hidden',
  },

  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1,
  },

  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(10, 38, 71, 0.97) 0%, rgba(27, 59, 111, 0.93) 50%, rgba(45, 95, 158, 0.90) 100%)',
    backdropFilter: 'blur(2px)',
    zIndex: 2,
  },

  leftContent: {
    position: 'relative',
    zIndex: 3,
    maxWidth: '600px',
    color: 'white',
  },

  // Logo
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    marginBottom: '60px',
  },

  logoCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(20px)',
    border: '1.5px solid rgba(255, 255, 255, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },

  logoTitle: {
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '-1px',
    lineHeight: 1,
  },

  logoSubtitle: {
    fontSize: '10px',
    letterSpacing: '3px',
    opacity: 0.85,
    fontWeight: '600',
    marginTop: '6px',
  },

  // Citation
  quoteCard: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    marginBottom: '50px',
    position: 'relative',
  },

  quoteIcon: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    opacity: 0.3,
  },

  quoteText: {
    fontSize: '19px',
    lineHeight: 1.8,
    marginBottom: '32px',
    fontStyle: 'italic',
    opacity: 0.95,
    fontWeight: '400',
  },

  quoteAuthor: {
    display: 'flex',
    gap: '18px',
    alignItems: 'center',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
  },

  authorAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  authorName: {
    fontSize: '17px',
    fontWeight: '700',
    marginBottom: '4px',
  },

  authorTitle: {
    fontSize: '14px',
    opacity: 0.85,
    marginBottom: '6px',
  },

  authorExpertise: {
    fontSize: '12px',
    opacity: 0.7,
    lineHeight: 1.4,
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '40px',
  },

  statCard: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px 20px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    textAlign: 'center',
  },

  statIcon: {
    color: '#0EA5E9',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '6px',
    letterSpacing: '-0.5px',
  },

  statLabel: {
    fontSize: '12px',
    opacity: 0.8,
    lineHeight: 1.4,
  },

  // Certifications
  certBadges: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },

  certBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(16, 185, 129, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6EE7B7',
  },

  // ═════════════════════════════════════════
  // PANNEAU DROIT - FORMULAIRE
  // ═════════════════════════════════════════
  rightPanel: {
    width: '560px',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 40px',
    overflowY: 'auto',
  },

  formWrapper: {
    width: '100%',
    maxWidth: '460px',
  },

  formHeader: {
    marginBottom: '40px',
  },

  securityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '12px',
    color: '#059669',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '24px',
  },

  formTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#0A2647',
    marginBottom: '12px',
    letterSpacing: '-1px',
    lineHeight: 1.1,
  },

  formSubtitle: {
    fontSize: '15px',
    color: '#64748B',
    lineHeight: 1.6,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: '-0.2px',
  },

  input: {
    width: '100%',
    padding: '16px 18px',
    border: '2px solid #E2E8F0',
    borderRadius: '14px',
    fontSize: '15px',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    outline: 'none',
    background: '#F8FAFC',
    fontFamily: 'inherit',
    fontWeight: '500',
  },

  inputHint: {
    fontSize: '12px',
    color: '#94A3B8',
    marginTop: '-4px',
    fontFamily: "'JetBrains Mono', monospace",
  },

  passwordWrapper: {
    position: 'relative',
  },

  passwordToggle: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#64748B',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
    borderRadius: '8px',
  },

  formOptions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '-12px',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
    fontWeight: '500',
  },

  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#2D5F9E',
  },

  forgotLink: {
    fontSize: '14px',
    color: '#2D5F9E',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s',
  },

  errorAlert: {
    display: 'flex',
    gap: '14px',
    padding: '16px 18px',
    background: '#FEF2F2',
    border: '1.5px solid #FCA5A5',
    borderRadius: '14px',
    color: '#DC2626',
  },

  errorTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '4px',
  },

  errorMessage: {
    fontSize: '13px',
    opacity: 0.9,
  },

  submitButton: {
    width: '100%',
    padding: '18px',
    background: 'linear-gradient(135deg, #0A2647 0%, #2D5F9E 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    letterSpacing: '0.3px',
    boxShadow: '0 8px 24px rgba(10, 38, 71, 0.3)',
  },

  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },

  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '36px 0 28px',
    borderTop: '1.5px solid #E2E8F0',
  },

  dividerText: {
    display: 'inline-block',
    background: 'white',
    padding: '0 20px',
    fontSize: '13px',
    color: '#94A3B8',
    fontWeight: '600',
    position: 'relative',
    top: '-12px',
    letterSpacing: '0.3px',
  },

  // Demo accounts
  demoSection: {
    marginBottom: '36px',
  },

  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },

  demoCard: {
    display: 'flex',
    gap: '14px',
    padding: '18px',
    border: '2px solid #E2E8F0',
    borderRadius: '16px',
    background: '#FAFBFC',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left',
    alignItems: 'center',
  },

  demoAvatarWrapper: {
    position: 'relative',
    flexShrink: 0,
  },

  demoAvatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid white',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },

  demoStatus: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '3px solid white',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
  },

  demoInfo: {
    flex: 1,
    minWidth: 0,
  },

  demoName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  demoRole: {
    fontSize: '13px',
    color: '#64748B',
    fontWeight: '600',
    marginBottom: '6px',
  },

  demoSpecialty: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Footer
  formFooter: {
    borderTop: '1.5px solid #E2E8F0',
    paddingTop: '28px',
  },

  helpText: {
    fontSize: '14px',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: '20px',
  },

  helpLink: {
    color: '#2D5F9E',
    textDecoration: 'none',
    fontWeight: '700',
    transition: 'color 0.2s',
  },

  securityFooter: {
    display: 'flex',
    justifyContent: 'center',
    gap: '28px',
    flexWrap: 'wrap',
  },

  securityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#10B981',
    fontWeight: '600',
  },
};

// Styles CSS globaux pour les animations et les hover states
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #2D5F9E !important;
    background-color: white !important;
    box-shadow: 0 0 0 3px rgba(45, 95, 158, 0.1) !important;
  }
  
  button[type="submit"]:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(10, 38, 71, 0.4) !important;
  }
  
  a:hover {
    color: #1B3B6F !important;
  }
  
  [style*="passwordToggle"]:hover {
    color: #2D5F9E !important;
    background: #F1F5F9 !important;
  }
  
  [style*="demoCard"]:hover {
    border-color: #2D5F9E !important;
    background: white !important;
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(10, 38, 71, 0.15) !important;
  }
  
  [style*="certBadge"] {
    transition: all 0.3s ease;
  }
  
  [style*="certBadge"]:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 1200px) {
    [style*="leftPanel"] {
      display: none !important;
    }
    
    [style*="rightPanel"] {
      width: 100% !important;
      max-width: 600px !important;
      margin: 0 auto !important;
    }
  }
  
  @media (max-width: 640px) {
    [style*="demoGrid"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);