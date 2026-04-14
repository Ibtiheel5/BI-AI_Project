// pages/VideoConsultation.jsx
// Salle de vidéo consultation — Jitsi Meet intégré
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000/api/v1";

const MODEL_META = {
  brain: { label: "IRM cérébrale",           icon: "🧠", color: "#7C3AED" },
  lung:  { label: "Scanner CT pulmonaire",   icon: "🔬", color: "#DC2626" },
  chest: { label: "Radiographie thoracique", icon: "🫁", color: "#0369A1" },
};

export default function VideoConsultation() {
  const { id }            = useParams();
  const [searchParams]    = useSearchParams();
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const containerRef      = useRef(null);
  const apiRef            = useRef(null);
  const timerRef          = useRef(null);

  const [consultation, setConsultation] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [jitsiReady,   setJitsiReady]   = useState(false);
  const [participants, setParticipants] = useState(1);
  const [duration,     setDuration]     = useState(0);
  const [audioMuted,   setAudioMuted]   = useState(false);
  const [videoMuted,   setVideoMuted]   = useState(false);
  const [toast,        setToast]        = useState(null);
  const [showInfo,     setShowInfo]     = useState(false);

  const roomName = searchParams.get("room") || `medai-consult-${id}`;
  const isDoctor = user?.role === "Medecin" || user?.is_admin;

  const notify = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fmt = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── Load consultation info ─────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("medai-token");
    fetch(`${API}/consultations/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setConsultation(d.consultation); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  // ── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Load & init Jitsi ──────────────────────────────────────────
  useEffect(() => {
    if (loading || !containerRef.current) return;

    const boot = () => {
      if (!window.JitsiMeetExternalAPI) return;
      if (apiRef.current) return; // already initialised

      const displayName = isDoctor
        ? `Dr. ${user?.full_name || user?.name}`
        : user?.full_name || user?.name || "Patient";

      try {
        apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
          roomName,
          parentNode: containerRef.current,
          width:  "100%",
          height: "100%",
          userInfo: { displayName, email: `${user?.username || "user"}@medai.app` },
          configOverwrite: {
            prejoinPageEnabled:  false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking:  true,
            enableWelcomePage:   false,
            toolbarButtons: [
              "microphone", "camera", "desktop", "fullscreen",
              "fodeviceselection", "chat", "settings", "videoquality",
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK:            false,
            SHOW_WATERMARK_FOR_GUESTS:       false,
            SHOW_BRAND_WATERMARK:            false,
            SHOW_POWERED_BY:                 false,
            TOOLBAR_ALWAYS_VISIBLE:          true,
            DEFAULT_BACKGROUND:              "#030C1A",
            DISPLAY_WELCOME_PAGE_CONTENT:    false,
          },
        });

        apiRef.current.addEventListeners({
          videoConferenceJoined: () => {
            setJitsiReady(true);
            notify("✅ Connecté à la salle de consultation", "success");
          },
          participantJoined: (e) => {
            setParticipants(p => p + 1);
            notify(`👤 ${e.displayName || "Participant"} a rejoint la consultation`);
          },
          participantLeft: () => setParticipants(p => Math.max(1, p - 1)),
          audioMuteStatusChanged: (e) => setAudioMuted(e.muted),
          videoMuteStatusChanged: (e) => setVideoMuted(e.muted),
          videoConferenceLeft: () => {
            clearInterval(timerRef.current);
            navigate(`/consultation/${id}`);
          },
          readyToClose: () => navigate(`/consultation/${id}`),
        });

      } catch (err) {
        console.error("Jitsi init error:", err);
        notify("Erreur Jitsi. Vérifiez votre connexion.", "error");
      }
    };

    // Load the Jitsi script if needed
    if (window.JitsiMeetExternalAPI) {
      boot();
    } else {
      const s = document.createElement("script");
      s.src     = "https://meet.jit.si/external_api.js";
      s.onload  = boot;
      s.onerror = () => notify("Impossible de charger Jitsi. Vérifiez votre connexion.", "error");
      document.head.appendChild(s);
    }

    return () => {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
  }, [loading, roomName]);

  // ── Controls ───────────────────────────────────────────────────
  const toggleAudio  = () => apiRef.current?.executeCommand("toggleAudio");
  const toggleVideo  = () => apiRef.current?.executeCommand("toggleVideo");
  const shareScreen  = () => apiRef.current?.executeCommand("toggleShareScreen");

  const hangUp = () => {
    if (!window.confirm("Terminer la consultation vidéo ?")) return;
    clearInterval(timerRef.current);
    apiRef.current?.executeCommand("hangup");
    navigate(`/consultation/${id}`);
  };

  const m = consultation ? (MODEL_META[consultation.model_key] || MODEL_META.chest) : MODEL_META.chest;

  // ── Loading screen ─────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#030C1A", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#2D5F9E", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: ".9rem" }}>Préparation de la consultation…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#030C1A", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.15)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "14px 24px",
        background: "linear-gradient(180deg, rgba(3,12,26,.9) 0%, transparent 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        pointerEvents: "none",
      }}>
        {/* Left: back + consultation info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto" }}>
          <button onClick={() => navigate(`/consultation/${id}`)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 9, color: "white", padding: "6px 12px", fontSize: ".78rem", cursor: "pointer",
          }}>
            ← Dossier
          </button>

          {consultation && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${m.color}30`, border: `1px solid ${m.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".95rem" }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontSize: ".82rem", fontWeight: 700, color: "white" }}>Consultation #{id}</div>
                <div style={{ fontSize: ".67rem", color: "rgba(255,255,255,.5)" }}>
                  {isDoctor ? `Patient : ${consultation.patient_name}` : `Dr. ${consultation.doctor_name || "…"}`} · {m.label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center: status pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          {/* LIVE */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "rgba(220,38,38,.2)", border: "1px solid rgba(220,38,38,.4)", borderRadius: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: ".7rem", fontWeight: 700, color: "#EF4444" }}>EN DIRECT</span>
          </div>
          {/* Timer */}
          <div style={{ padding: "5px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, fontSize: ".78rem", color: "rgba(255,255,255,.8)", fontVariantNumeric: "tabular-nums" }}>
            ⏱ {fmt(duration)}
          </div>
          {/* Participants */}
          <div style={{ padding: "5px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, fontSize: ".78rem", color: "rgba(255,255,255,.6)" }}>
            👥 {participants}
          </div>
        </div>

        {/* Right: user + info toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          <button onClick={() => setShowInfo(v => !v)} style={{
            padding: "6px 14px", background: showInfo ? "rgba(45,95,158,.5)" : "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.15)", borderRadius: 9, color: "white", fontSize: ".75rem", cursor: "pointer",
          }}>
            {showInfo ? "✕ Fermer" : "ℹ️ Infos"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: isDoctor ? "linear-gradient(135deg,#0A2647,#2D5F9E)" : "linear-gradient(135deg,#059669,#10B981)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem" }}>
              {isDoctor ? "👨‍⚕️" : "👤"}
            </div>
            <span style={{ fontSize: ".75rem", color: "rgba(255,255,255,.8)" }}>{user?.full_name || user?.name}</span>
            <span style={{ padding: "1px 8px", background: isDoctor ? "rgba(45,95,158,.4)" : "rgba(5,150,105,.4)", borderRadius: 10, fontSize: ".6rem", fontWeight: 700, color: isDoctor ? "#93C5FD" : "#6EE7B7" }}>
              {isDoctor ? "MÉDECIN" : "PATIENT"}
            </span>
          </div>
        </div>
      </div>

      {/* ── JITSI EMBED ─────────────────────────────────────────── */}
      <div ref={containerRef} style={{ flex: 1, width: "100%", minHeight: "100vh", background: "#030C1A" }} />

      {/* ── BOTTOM CONTROLS ─────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: "20px 32px",
        background: "linear-gradient(0deg, rgba(3,12,26,.9) 0%, transparent 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        pointerEvents: "none",
      }}>
        {/* Mute audio */}
        <button onClick={toggleAudio} style={{
          width: 48, height: 48,
          background: audioMuted ? "rgba(220,38,38,.8)" : "rgba(255,255,255,.12)",
          border: "1px solid rgba(255,255,255,.2)", borderRadius: "50%",
          color: "white", fontSize: "1.1rem", cursor: "pointer", pointerEvents: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} title={audioMuted ? "Activer le micro" : "Couper le micro"}>
          {audioMuted ? "🔇" : "🎤"}
        </button>

        {/* Mute video */}
        <button onClick={toggleVideo} style={{
          width: 48, height: 48,
          background: videoMuted ? "rgba(220,38,38,.8)" : "rgba(255,255,255,.12)",
          border: "1px solid rgba(255,255,255,.2)", borderRadius: "50%",
          color: "white", fontSize: "1.1rem", cursor: "pointer", pointerEvents: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} title={videoMuted ? "Activer la caméra" : "Couper la caméra"}>
          {videoMuted ? "📵" : "📷"}
        </button>

        {/* Share screen */}
        <button onClick={shareScreen} style={{
          padding: "0 20px", height: 48,
          background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 24, color: "rgba(255,255,255,.9)", fontSize: ".78rem", fontWeight: 600,
          cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", gap: 7,
        }}>
          🖥️ Partager l'écran
        </button>

        {/* Dossier shortcut (doctor only) */}
        {isDoctor && (
          <button onClick={() => window.open(`/consultation/${id}`, "_blank")} style={{
            padding: "0 20px", height: 48,
            background: "rgba(45,95,158,.6)", border: "1px solid rgba(45,95,158,.4)",
            borderRadius: 24, color: "white", fontSize: ".78rem", fontWeight: 600,
            cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", gap: 7,
          }}>
            📋 Dossier patient
          </button>
        )}

        {/* Hang up */}
        <button onClick={hangUp} style={{
          padding: "0 28px", height: 48,
          background: "rgba(220,38,38,.85)", border: "1px solid rgba(220,38,38,.5)",
          borderRadius: 24, color: "white", fontSize: ".85rem", fontWeight: 700,
          cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(220,38,38,.3)",
        }}>
          📵 Terminer
        </button>
      </div>

      {/* ── INFO SIDE PANEL ─────────────────────────────────────── */}
      {showInfo && consultation && (
        <div style={{
          position: "absolute", top: 70, right: 20, bottom: 80, zIndex: 200,
          width: 300, background: "rgba(10,17,26,.92)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 16,
          padding: "20px", overflowY: "auto",
          animation: "slideIn .3s ease",
        }}>
          <div style={{ fontSize: ".65rem", fontWeight: 700, color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>
            INFOS CONSULTATION
          </div>

          {[
            ["Référence",   `#${id}`],
            ["Type",        m.label],
            [isDoctor ? "Patient" : "Médecin", isDoctor ? consultation.patient_name : (consultation.doctor_name || "—")],
            ["Statut",      consultation.status],
            ["Urgence",     consultation.urgency === "critical" ? "🔴 Critique" : consultation.urgency === "urgent" ? "🟡 Urgent" : "🟢 Normal"],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.4)" }}>{l}</span>
              <span style={{ fontSize: ".78rem", fontWeight: 600, color: "rgba(255,255,255,.85)" }}>{v}</span>
            </div>
          ))}

          {consultation.patient_notes && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,.05)", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)" }}>
              <div style={{ fontSize: ".6rem", color: "rgba(255,255,255,.35)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Note du patient</div>
              <p style={{ fontSize: ".75rem", color: "rgba(255,255,255,.7)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
                "{consultation.patient_notes}"
              </p>
            </div>
          )}

          <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(14,165,233,.1)", borderRadius: 10, border: "1px solid rgba(14,165,233,.2)" }}>
            <div style={{ fontSize: ".65rem", color: "#38BDF8", fontWeight: 700, marginBottom: 4 }}>🔒 Salle sécurisée</div>
            <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
              Chiffrée de bout en bout via Jitsi Meet.
              Aucun enregistrement automatique.
            </div>
          </div>
        </div>
      )}

      {/* ── Connecting overlay (before Jitsi loads) ─────────────── */}
      {!jitsiReady && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(3,12,26,.88)", backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20,
          pointerEvents: "none", animation: "fadeIn .4s ease",
        }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#0A2647,#1B3B6F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", boxShadow: "0 8px 32px rgba(10,38,71,.5)" }}>
            🏥
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: 6 }}>
              Connexion à la salle…
            </div>
            <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.45)" }}>
              {roomName}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#2D5F9E", animation: `pulse 1.2s ease-in-out ${delay}s infinite` }} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: "🔒", label: "Chiffrement E2E" },
              { icon: "🎥", label: "Vidéo HD" },
              { icon: "📋", label: "Dossier partagé" },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10 }}>
                <span style={{ fontSize: "1rem" }}>{c.icon}</span>
                <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,.6)" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          padding: "10px 22px", borderRadius: 50,
          background: toast.type === "error" ? "rgba(220,38,38,.9)" : toast.type === "success" ? "rgba(5,150,105,.9)" : "rgba(30,58,100,.9)",
          backdropFilter: "blur(12px)", color: "white", fontSize: ".82rem", fontWeight: 500,
          zIndex: 9999, whiteSpace: "nowrap", animation: "fadeIn .3s ease",
          boxShadow: "0 4px 20px rgba(0,0,0,.3)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}