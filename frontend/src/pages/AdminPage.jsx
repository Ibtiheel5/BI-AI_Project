// AdminPage.jsx — Gestion des demandes d'inscription
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DOMAIN_LABELS = {
  chest: { label: "Radiologie Thoracique", icon: "🫁", color: "#2D5F9E" },
  brain: { label: "Neurologie",            icon: "🧠", color: "#6B4FA0" },
  lung:  { label: "Cancer Pulmonaire",     icon: "🔬", color: "#D62828" },
};

export default function AdminPage() {
  const { user, approveUser, rejectUser } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter]     = useState("pending");
  const [toast, setToast]       = useState(null);

  // Rediriger si pas admin
  useEffect(() => {
    if (user && !user.domains?.includes("all") && user.username !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const data = JSON.parse(localStorage.getItem("chestai-pending") || "[]");
    setRequests(data);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (req) => {
    // Ajouter l'utilisateur aux comptes approuvés
    const approved = JSON.parse(localStorage.getItem("chestai-approved") || "[]");
    approved.push({ ...req, status: "approved", approvedAt: new Date().toISOString() });
    localStorage.setItem("chestai-approved", JSON.stringify(approved));

    // Mettre à jour le statut dans pending
    const updated = requests.map(r =>
      r.id === req.id ? { ...r, status: "approved" } : r
    );
    localStorage.setItem("chestai-pending", JSON.stringify(updated));
    setRequests(updated);

    // Appeler le contexte Auth pour mettre à jour USERS dynamiquement
    approveUser?.(req);

    showToast(`✅ ${req.fullName} approuvé avec succès`);
  };

  const handleReject = (req) => {
    const updated = requests.map(r =>
      r.id === req.id ? { ...r, status: "rejected" } : r
    );
    localStorage.setItem("chestai-pending", JSON.stringify(updated));
    setRequests(updated);
    showToast(`❌ ${req.fullName} rejeté`, "error");
  };

  const filtered = requests.filter(r => filter === "all" ? true : r.status === filter);

  const counts = {
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
      padding: "32px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "12px 20px",
          background: toast.type === "error" ? "#D62828" : "#00A86B",
          color: "white", borderRadius: 12, fontWeight: 600, fontSize: "0.85rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          animation: "slideIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0A2647, #2D5F9E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>⚙️</div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", margin: 0 }}>Administration</h1>
              <p style={{ fontSize: "0.8rem", color: "#64748B", margin: 0 }}>Gestion des demandes d'inscription</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "En attente", count: counts.pending,  color: "#FF9F1C", bg: "rgba(255,159,28,0.1)",  icon: "⏳" },
            { label: "Approuvés",  count: counts.approved, color: "#00A86B", bg: "rgba(0,168,107,0.1)",   icon: "✅" },
            { label: "Rejetés",    count: counts.rejected, color: "#D62828", bg: "rgba(214,40,40,0.1)",   icon: "❌" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: `1px solid ${s.color}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            { key: "pending",  label: "En attente" },
            { key: "approved", label: "Approuvés" },
            { key: "rejected", label: "Rejetés" },
            { key: "all",      label: "Tous" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 18px", borderRadius: 40, fontSize: "0.82rem", fontWeight: 500,
                cursor: "pointer", border: "none", transition: "all 0.2s",
                background: filter === f.key ? "#0A2647" : "white",
                color: filter === f.key ? "white" : "#64748B",
                boxShadow: filter === f.key ? "0 4px 12px rgba(10,38,71,0.2)" : "0 2px 6px rgba(0,0,0,0.06)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste des demandes */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📭</div>
            <p>Aucune demande dans cette catégorie</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(req => (
              <div key={req.id} style={{
                background: "white", borderRadius: 20, padding: 24,
                boxShadow: "0 4px 16px rgba(10,38,71,0.06)",
                border: req.status === "pending"  ? "1px solid rgba(255,159,28,0.2)" :
                        req.status === "approved" ? "1px solid rgba(0,168,107,0.2)" :
                        "1px solid rgba(214,40,40,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  {/* Infos */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #0A2647, #2D5F9E)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1rem" }}>
                        {req.fullName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647" }}>{req.fullName}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>@{req.username} · {req.email}</div>
                      </div>
                      {/* Status badge */}
                      <div style={{
                        marginLeft: "auto",
                        padding: "4px 12px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 600,
                        background: req.status === "pending"  ? "rgba(255,159,28,0.1)" :
                                    req.status === "approved" ? "rgba(0,168,107,0.1)" : "rgba(214,40,40,0.1)",
                        color: req.status === "pending"  ? "#FF9F1C" :
                               req.status === "approved" ? "#00A86B" : "#D62828",
                      }}>
                        {req.status === "pending" ? "⏳ En attente" : req.status === "approved" ? "✅ Approuvé" : "❌ Rejeté"}
                      </div>
                    </div>

                    {/* Domaines */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: req.message ? 10 : 0 }}>
                      {req.domains?.map(k => {
                        const d = DOMAIN_LABELS[k];
                        return d ? (
                          <span key={k} style={{ padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, background: `${d.color}15`, color: d.color }}>
                            {d.icon} {d.label}
                          </span>
                        ) : null;
                      })}
                    </div>

                    {req.message && (
                      <div style={{ marginTop: 10, padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: "0.82rem", color: "#475569", fontStyle: "italic" }}>
                        "{req.message}"
                      </div>
                    )}

                    <div style={{ marginTop: 10, fontSize: "0.7rem", color: "#94A3B8" }}>
                      Demande du {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {req.status === "pending" && (
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button
                      onClick={() => handleApprove(req)}
                      style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg, #00A86B, #2ECC71)", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,168,107,0.3)" }}
                    >
                      ✅ Approuver
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      style={{ flex: 1, padding: "10px 0", background: "rgba(214,40,40,0.08)", border: "1px solid rgba(214,40,40,0.2)", borderRadius: 10, color: "#D62828", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  );
}