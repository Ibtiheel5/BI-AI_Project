// frontend/src/pages/patient/CallHistoryPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PatientPageLayout } from "../../components/patient/PatientPageLayout";
import { PatientIcons } from "../../constants/patientIcons";
import { useAuth } from "../../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const CallHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem("medai-token");
  
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const res = await fetch(`${API}/consultations/appointments/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pastCalls = (data.appointments || [])
            .filter(apt => apt.type === "video" && new Date(apt.scheduled_at) < new Date())
            .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
          setCalls(pastCalls);
        }
      } catch (err) {
        console.error(err);
        // Données mockées
        setCalls([
          { id: 1, consultation_id: 101, doctor_name: "Sophie Laurent", scheduled_at: "2024-11-15T10:00:00", duration: 25, status: "completed" },
          { id: 2, consultation_id: 102, doctor_name: "Marc Dubois", scheduled_at: "2024-10-20T14:30:00", duration: 18, status: "completed" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCallHistory();
  }, [token]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const getDoctorInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "D";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border-dim)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <PatientPageLayout
      title="Historique des appels"
      subtitle="Toutes vos téléconsultations passées"
      icon={<PatientIcons.CallHistory size={28} color="var(--gold-dk)" />}
      backButton onBack={() => navigate("/patient")}
    >
      {calls.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: "var(--card)",
          borderRadius: 20,
          border: "1px solid var(--border-dim)"
        }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold-lt)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <PatientIcons.CallHistory size={32} color="var(--gold-dk)" />
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Aucun historique d'appel</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--txt2)" }}>Vos téléconsultations apparaîtront ici après votre premier appel.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {calls.map((call, idx) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: "var(--card)",
                borderRadius: 16,
                padding: "18px 24px",
                border: "1px solid var(--border-dim)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                cursor: "pointer"
              }}
              onClick={() => navigate(`/patient/consultation/${call.consultation_id}`)}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, var(--gold-lt), var(--gold-glass))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "var(--gold-dk)"
              }}>
                {getDoctorInitial(call.doctor_name)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>
                  Dr. {call.doctor_name || "Médecin"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--txt2)" }}>
                  Consultation #{call.consultation_id}
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600, color: "var(--navy)" }}>{formatDate(call.scheduled_at)}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--txt2)" }}>{formatTime(call.scheduled_at)}</div>
                {call.duration && (
                  <div style={{ fontSize: "0.7rem", color: "var(--gold-dk)", marginTop: 2 }}>Durée : {call.duration} min</div>
                )}
              </div>
              
              <PatientIcons.ArrowRight size={16} color="var(--txt3)" />
            </motion.div>
          ))}
        </div>
      )}
    </PatientPageLayout>
  );
};

export default CallHistoryPage;