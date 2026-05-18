// src/pages/VideoConsultation.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

// SVG Icons
const Svg = ({ children, size = 24, color = "currentColor", sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const Icons = {
  Video: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <polyline points="16 9 22 5 22 19 16 15" />
    </Svg>
  ),
  Phone: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  ),
  Mic: ({ size = 20, color = "currentColor", muted = false }) => (
    <Svg size={size} color={color}>
      {!muted ? (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      ) : (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
          <path d="M15 9.34V4a3 3 0 0 0-5.94-.6" />
          <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </Svg>
  ),
  Camera: ({ size = 20, color = "currentColor", off = false }) => (
    <Svg size={size} color={color}>
      {!off ? (
        <>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </>
      ) : (
        <>
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </>
      )}
    </Svg>
  ),
  ScreenShare: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <path d="M21 12v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </Svg>
  ),
  HangUp: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </Svg>
  ),
  Close: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
  Info: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
    </Svg>
  ),
  User: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Shield: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </Svg>
  ),
  Clock: ({ size = 20, color = "currentColor" }) => (
    <Svg size={size} color={color}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Svg>
  ),
};

export default function VideoConsultation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [duration, setDuration] = useState(0);

  const roomName = searchParams.get("room") || `medai-consult-${id}`;
  const isDoctor = user?.role === "Medecin" || user?.is_admin;

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("medai-token");
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }

    fetch(`${API}/consultations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Consultation non trouvée");
        return res.json();
      })
      .then(data => {
        setConsultation(data.consultation);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (loading || !containerRef.current || error) return;

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI || apiRef.current) return;

      const displayName = isDoctor
        ? `Dr. ${user?.full_name || user?.name || "Medecin"}`
        : user?.full_name || user?.name || "Patient";

      try {
        const domain = "meet.jit.si";
        const options = {
          roomName: roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: {
            displayName: displayName,
            email: `${user?.username || "user"}@medai.app`
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            DEFAULT_BACKGROUND: "#030C1A",
          }
        };

        apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

        apiRef.current.addEventListeners({
          videoConferenceJoined: () => {
            console.log("Conference joined");
          },
          participantJoined: () => setParticipants(p => p + 1),
          participantLeft: () => setParticipants(p => Math.max(1, p - 1)),
          audioMuteStatusChanged: (e) => setAudioMuted(e.muted),
          videoMuteStatusChanged: (e) => setVideoMuted(e.muted),
          videoConferenceLeft: () => {
            navigate(`/consultation/${id}`);
          },
          readyToClose: () => {
            navigate(`/consultation/${id}`);
          }
        });
      } catch (err) {
        console.error("Jitsi init error:", err);
        setError("Erreur de connexion à la salle vidéo");
      }
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setError("Impossible de charger Jitsi");
      document.head.appendChild(script);
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [loading, roomName, isDoctor, user, id, navigate, error]);

  const toggleAudio = () => apiRef.current?.executeCommand("toggleAudio");
  const toggleVideo = () => apiRef.current?.executeCommand("toggleVideo");
  const shareScreen = () => apiRef.current?.executeCommand("toggleShareScreen");
  const hangUp = () => {
    if (window.confirm("Terminer la consultation vidéo ?")) {
      apiRef.current?.executeCommand("hangup");
      navigate(`/consultation/${id}`);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030C1A",
        color: "white",
        fontFamily: "sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(255,255,255,0.1)",
            borderTopColor: "#2D5F9E",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px"
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>Chargement de la consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030C1A",
        color: "white",
        fontFamily: "sans-serif",
        flexDirection: "column",
        gap: 20
      }}>
        <Icons.Close size={48} color="#EF4444" />
        <p>{error}</p>
        <button
          onClick={() => navigate(`/consultation/${id}`)}
          style={{
            padding: "10px 24px",
            background: "#2D5F9E",
            border: "none",
            borderRadius: 8,
            color: "white",
            cursor: "pointer"
          }}
        >
          Retour à la consultation
        </button>
      </div>
    );
  }

  const modelMeta = {
    brain: { label: "IRM cerebrale", icon: "🧠", color: "#7C3AED" },
    lung: { label: "Scanner CT pulmonaire", icon: "🔬", color: "#DC2626" },
    chest: { label: "Radiographie thoracique", icon: "🫁", color: "#0369A1" },
  };
  const model = modelMeta[consultation?.model_key] || modelMeta.chest;

  return (
    <div style={{ width: "100%", height: "100vh", background: "#030C1A", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "14px 24px",
        background: "linear-gradient(180deg, rgba(3,12,26,0.9) 0%, transparent 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(`/consultation/${id}`)}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 9, color: "white", padding: "6px 12px",
              fontSize: "0.78rem", cursor: "pointer"
            }}
          >
            ← Dossier
          </button>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "white" }}>
              Consultation #{id}
            </div>
            <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.5)" }}>
              {isDoctor ? `Patient : ${consultation?.patient_name}` : `Dr. ${consultation?.doctor_name || "..."}`} · {model.label}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#EF4444" }}>EN DIRECT</span>
          </div>
          <div style={{ padding: "5px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, fontSize: "0.78rem", color: "rgba(255,255,255,0.8)" }}>
            <Icons.Clock size={12} /> {formatTime(duration)}
          </div>
          <div style={{ padding: "5px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>
            <Icons.User size={12} /> {participants}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowInfo(v => !v)}
            style={{
              padding: "6px 14px", background: showInfo ? "rgba(45,95,158,0.5)" : "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 9, color: "white", fontSize: "0.75rem", cursor: "pointer"
            }}
          >
            <Icons.Info size={14} /> {showInfo ? "Fermer" : "Infos"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: isDoctor ? "linear-gradient(135deg,#0A2647,#2D5F9E)" : "linear-gradient(135deg,#059669,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem" }}>
              {isDoctor ? "M" : "P"}
            </div>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>{user?.full_name || user?.name}</span>
            <span style={{ padding: "1px 8px", background: isDoctor ? "rgba(45,95,158,0.4)" : "rgba(5,150,105,0.4)", borderRadius: 10, fontSize: "0.6rem", fontWeight: 700, color: isDoctor ? "#93C5FD" : "#6EE7B7" }}>
              {isDoctor ? "MEDECIN" : "PATIENT"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "20px 32px",
        background: "linear-gradient(0deg, rgba(3,12,26,0.9) 0%, transparent 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        zIndex: 100,
      }}>
        <button onClick={toggleAudio} style={{
          width: 48, height: 48,
          background: audioMuted ? "rgba(220,38,38,0.8)" : "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%",
          color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icons.Mic size={20} muted={audioMuted} />
        </button>

        <button onClick={toggleVideo} style={{
          width: 48, height: 48,
          background: videoMuted ? "rgba(220,38,38,0.8)" : "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%",
          color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Icons.Camera size={20} off={videoMuted} />
        </button>

        <button onClick={shareScreen} style={{
          padding: "0 20px", height: 48,
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 24, color: "rgba(255,255,255,0.9)", fontSize: "0.78rem", fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
        }}>
          <Icons.ScreenShare size={16} /> Partager l'ecran
        </button>

        {isDoctor && (
          <button onClick={() => window.open(`/consultation/${id}`, "_blank")} style={{
            padding: "0 20px", height: 48,
            background: "rgba(45,95,158,0.6)", border: "1px solid rgba(45,95,158,0.4)",
            borderRadius: 24, color: "white", fontSize: "0.78rem", fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
          }}>
            <Icons.User size={14} /> Dossier patient
          </button>
        )}

        <button onClick={hangUp} style={{
          padding: "0 28px", height: 48,
          background: "rgba(220,38,38,0.85)", border: "1px solid rgba(220,38,38,0.5)",
          borderRadius: 24, color: "white", fontSize: "0.85rem", fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(220,38,38,0.3)",
        }}>
          <Icons.HangUp size={16} /> Terminer
        </button>
      </div>

      {/* Info panel */}
      {showInfo && consultation && (
        <div style={{
          position: "absolute", top: 70, right: 20, bottom: 80, zIndex: 200,
          width: 300, background: "rgba(10,17,26,0.92)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
          padding: "20px", overflowY: "auto",
        }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            INFOS CONSULTATION
          </div>

          {[
            ["Reference", `#${id}`],
            ["Type", model.label],
            [isDoctor ? "Patient" : "Medecin", isDoctor ? consultation.patient_name : (consultation.doctor_name || "--")],
            ["Statut", consultation.status === "pending" ? "En attente" : consultation.status === "accepted" ? "En cours" : consultation.status === "analyzed" ? "Analyse" : "Termine"],
            ["Urgence", consultation.urgency === "critical" ? "Critique" : consultation.urgency === "urgent" ? "Urgent" : "Normal"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{l}</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{v}</span>
            </div>
          ))}

          {consultation.patient_notes && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Note du patient</div>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
                "{consultation.patient_notes}"
              </p>
            </div>
          )}

          <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(14,165,233,0.1)", borderRadius: 10, border: "1px solid rgba(14,165,233,0.2)" }}>
            <div style={{ fontSize: "0.65rem", color: "#38BDF8", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Icons.Shield size={12} /> Salle securisee
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              Chiffree de bout en bout via Jitsi Meet. Aucun enregistrement automatique.
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}