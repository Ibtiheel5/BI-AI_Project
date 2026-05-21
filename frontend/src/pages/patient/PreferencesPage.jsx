// frontend/src/pages/patient/PreferencesPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PatientPageLayout } from "../../components/patient/PatientPageLayout";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const PreferencesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  
  const [preferences, setPreferences] = useState({
    language: "fr",
    notifications_email: true,
    notifications_push: true,
    notifications_sms: false,
    share_data: true,
    date_format: "DD/MM/YYYY"
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Charger les préférences depuis le backend
    const loadPreferences = async () => {
      try {
        const token = localStorage.getItem("medai-token");
        const res = await fetch(`http://localhost:8000/api/v1/patient/preferences`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPreferences(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadPreferences();
  }, []);

  const savePreferences = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const token = localStorage.getItem("medai-token");
      const res = await fetch(`http://localhost:8000/api/v1/patient/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });
      
      if (res.ok) {
        setMessage({ type: "success", text: "Préférences enregistrées" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const languageOptions = [
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "en", label: "English", flag: "🇬🇧" },
    { value: "ar", label: "العربية", flag: "🇹🇳" }
  ];

  const dateFormatOptions = [
    { value: "DD/MM/YYYY", label: "31/12/2024" },
    { value: "MM/DD/YYYY", label: "12/31/2024" },
    { value: "YYYY-MM-DD", label: "2024-12-31" }
  ];

  return (
    <PatientPageLayout
      title="Préférences"
      subtitle="Personnalisez votre expérience"
      icon={<PatientIcons.Preferences size={28} color="var(--gold-dk)" />}
      backButton onBack={() => navigate("/patient/profil")}
      actions={
        <button
          onClick={savePreferences}
          disabled={saving}
          style={{
            padding: "10px 24px",
            borderRadius: 12,
            background: "linear-gradient(135deg, var(--gold), var(--gold-dk))",
            border: "none",
            color: "var(--navy)",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      }
    >
      {message.text && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 12,
          marginBottom: 24,
          background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: message.type === "success" ? "#10B981" : "#EF4444",
          fontSize: "0.85rem"
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
        {/* Appearance */}
        <div style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 24,
          border: "1px solid var(--border-dim)"
        }}>
          <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <PatientIcons.Preferences size={18} />
            Apparence
          </h3>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--txt2)", display: "block", marginBottom: 12 }}>
              Thème
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={toggle}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  background: theme === "light" ? "var(--gold-lt)" : "var(--bg)",
                  border: `2px solid ${theme === "light" ? "var(--gold)" : "var(--border-dim)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <PatientIcons.Sun size={18} />
                Clair
              </button>
              <button
                onClick={toggle}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  background: theme === "dark" ? "var(--gold-lt)" : "var(--bg)",
                  border: `2px solid ${theme === "dark" ? "var(--gold)" : "var(--border-dim)"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
              >
                <PatientIcons.Moon size={18} />
                Sombre
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--txt2)", display: "block", marginBottom: 8 }}>
              Langue
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              {languageOptions.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setPreferences(prev => ({ ...prev, language: lang.value }))}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 10,
                    background: preferences.language === lang.value ? "var(--gold-lt)" : "var(--bg)",
                    border: `1px solid ${preferences.language === lang.value ? "var(--border-gold)" : "var(--border-dim)"}`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <span>{lang.flag}</span>
                  <span style={{ fontSize: "0.85rem" }}>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--txt2)", display: "block", marginBottom: 8 }}>
              Format de date
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              {dateFormatOptions.map(format => (
                <button
                  key={format.value}
                  onClick={() => setPreferences(prev => ({ ...prev, date_format: format.value }))}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 10,
                    background: preferences.date_format === format.value ? "var(--gold-lt)" : "var(--bg)",
                    border: `1px solid ${preferences.date_format === format.value ? "var(--border-gold)" : "var(--border-dim)"}`,
                    cursor: "pointer",
                    fontSize: "0.75rem"
                  }}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 24,
          border: "1px solid var(--border-dim)"
        }}>
          <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <PatientIcons.Notification size={18} />
            Notifications
          </h3>
          
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--navy)" }}>Notifications par email</div>
              <div style={{ fontSize: "0.7rem", color: "var(--txt2)" }}>Résultats, rappels, messages</div>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, notifications_email: !prev.notifications_email }))}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                background: preferences.notifications_email ? "var(--gold)" : "var(--border-dim)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "white",
                position: "absolute",
                top: 2,
                left: preferences.notifications_email ? 26 : 2,
                transition: "left 0.2s"
              }} />
            </button>
          </div>
          
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--navy)" }}>Notifications push</div>
              <div style={{ fontSize: "0.7rem", color: "var(--txt2)" }}>Alertes en temps réel sur votre appareil</div>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, notifications_push: !prev.notifications_push }))}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                background: preferences.notifications_push ? "var(--gold)" : "var(--border-dim)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "white",
                position: "absolute",
                top: 2,
                left: preferences.notifications_push ? 26 : 2,
                transition: "left 0.2s"
              }} />
            </button>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--navy)" }}>Notifications SMS</div>
              <div style={{ fontSize: "0.7rem", color: "var(--txt2)" }}>Pour les rappels importants</div>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, notifications_sms: !prev.notifications_sms }))}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                background: preferences.notifications_sms ? "var(--gold)" : "var(--border-dim)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "white",
                position: "absolute",
                top: 2,
                left: preferences.notifications_sms ? 26 : 2,
                transition: "left 0.2s"
              }} />
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 24,
          border: "1px solid var(--border-dim)"
        }}>
          <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <PatientIcons.Lock size={18} />
            Confidentialité
          </h3>
          
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 500, color: "var(--navy)" }}>Partage des données</div>
              <div style={{ fontSize: "0.7rem", color: "var(--txt2)" }}>Autoriser l'utilisation anonyme pour la recherche</div>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, share_data: !prev.share_data }))}
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                background: preferences.share_data ? "var(--gold)" : "var(--border-dim)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "white",
                position: "absolute",
                top: 2,
                left: preferences.share_data ? 26 : 2,
                transition: "left 0.2s"
              }} />
            </button>
          </div>
        </div>

        {/* About */}
        <div style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 24,
          border: "1px solid var(--border-dim)"
        }}>
          <h3 style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <PatientIcons.Info size={18} />
            À propos
          </h3>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--txt2)" }}>Version</div>
            <div style={{ fontWeight: 600, color: "var(--navy)" }}>MedAI Patient v1.0.0</div>
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--txt2)" }}>Dernière mise à jour</div>
            <div style={{ fontWeight: 600, color: "var(--navy)" }}>Décembre 2024</div>
          </div>
          
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--txt2)" }}>Licence</div>
            <div style={{ fontWeight: 600, color: "var(--navy)" }}>Usage médical - Certifié CE</div>
          </div>
        </div>
      </div>
    </PatientPageLayout>
  );
};

export default PreferencesPage;