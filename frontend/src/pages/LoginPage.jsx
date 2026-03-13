// LoginPage.jsx — Thème clair bleu médical professionnel
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, USERS } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused]   = useState(null);

  const handleSubmit = async () => {
    if (!username || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true); setError("");
    try {
      await new Promise(r => setTimeout(r, 500));
      login(username.trim(), password);
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  const inputStyle = (name) => ({
    width: "100%",
    padding: "12px 14px 12px 42px",
    background: focused === name ? "#EFF6FF" : "#F8FAFC",
    border: focused === name ? "1.5px solid #2D5F9E" : "1.5px solid #E2E8F0",
    borderRadius: 10,
    color: "#0A2647",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)",
      display: "flex",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #0A2647 0%, #1B3B6F 60%, #2D5F9E 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }} />
        {/* Glow */}
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,95,158,0.4) 0%, transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 360, textAlign: "center" }}>
          {/* Logo */}
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "2rem", backdropFilter: "blur(10px)" }}>🏥</div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", letterSpacing: "-0.04em", margin: "0 0 12px" }}>
            Med<span style={{ color: "#93C5FD" }}>AI</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 40 }}>
            Plateforme d'aide au diagnostic médical par intelligence artificielle
          </p>

          {/* Features */}
          {[
            { icon: "🫁", text: "Radiologie thoracique" },
            { icon: "🧠", text: "Neurologie & IRM" },
            { icon: "🔬", text: "Oncologie pulmonaire" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "rgba(255,255,255,0.08)", borderRadius: 10, marginBottom: 10, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: "1.2rem" }}>{f.icon}</span>
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.88rem", fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}

          <p style={{ marginTop: 32, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
            Certifié CE IIa · Usage professionnel exclusif
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div style={{
        width: 480,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 48px",
        background: "white",
        boxShadow: "-8px 0 40px rgba(10,38,71,0.08)",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0A2647", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
              Connexion
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748B", margin: 0 }}>
              Accès réservé aux professionnels de santé
            </p>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Identifiant
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "#94A3B8" }}>👤</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocused("username")} onBlur={() => setFocused(null)}
                onKeyDown={handleKeyDown} placeholder="ex: dr.martin"
                style={inputStyle("username")} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "#94A3B8" }}>🔒</span>
              <input type={showPass ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                onKeyDown={handleKeyDown} placeholder="••••••••"
                style={{ ...inputStyle("password"), paddingRight: 42 }} />
              <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "0.9rem", padding: 0 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, color: "#DC2626", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "13px",
            background: loading ? "#93C5FD" : "linear-gradient(135deg, #1B3B6F, #2D5F9E)",
            border: "none", borderRadius: 10, color: "white",
            fontSize: "0.95rem", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            boxShadow: loading ? "none" : "0 4px 16px rgba(45,95,158,0.35)",
            transition: "all 0.2s",
          }}>
            {loading ? (
              <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> Connexion...</>
            ) : "Se connecter →"}
          </button>

          {/* Register link */}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "#64748B" }}>
            Pas encore de compte ?{" "}
            <Link to="/register" style={{ color: "#2D5F9E", textDecoration: "none", fontWeight: 700 }}>Créer un compte</Link>
          </p>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 16px" }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 500 }}>COMPTES DÉMO</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>

          {/* Demo accounts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {USERS.map(u => (
              <button key={u.id} onClick={() => { setUsername(u.username); setPassword(u.password); }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#EFF6FF"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0"; }}
              >
                <span style={{ fontSize: "1.1rem" }}>
                  {u.domains?.includes("brain") && !u.domains?.includes("chest") ? "🧠" : u.domains?.length > 2 ? "⚙️" : "🫁"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0A2647" }}>{u.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748B" }}>{u.specialty}</div>
                </div>
                <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#94A3B8", background: "#F1F5F9", padding: "2px 7px", borderRadius: 5 }}>{u.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #CBD5E1; }
      `}</style>
    </div>
  );
}