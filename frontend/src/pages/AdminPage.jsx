// Chemin : src/pages/AdminPage.jsx  (remplace l'existant)

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DOMAIN_LABELS = {
  chest: { label: "Radiologie Thoracique", icon: "🫁", color: "#2D5F9E" },
  brain: { label: "Neurologie",            icon: "🧠", color: "#6B4FA0" },
  lung:  { label: "Cancer Pulmonaire",     icon: "🔬", color: "#D62828" },
};

const STATUS_META = {
  pending:  { bg: "#FEF9C3", text: "#854D0E", label: "En attente" },
  approved: { bg: "#DCFCE7", text: "#166534", label: "Approuvé"   },
  rejected: { bg: "#FEE2E2", text: "#991B1B", label: "Refusé"     },
};

export default function AdminPage() {
  const { isAdmin, getAllUsers, approveUser, rejectUser, deleteUser } = useAuth();
  const navigate = useNavigate();

  const [users,     setUsers]     = useState([]);
  const [filter,    setFilter]    = useState("pending");
  const [toast,     setToast]     = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => { if (!isAdmin) navigate("/"); }, [isAdmin]);
  useEffect(() => { load(); }, []);

  const load = async () => {
    try   { setUsers(await getAllUsers()); }
    catch (e) { showToast("Erreur : " + e.message, "error"); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handle = (fn, label) => async (u) => {
    setLoadingId(u.id);
    try {
      await fn(u.id);
      showToast(label.replace("{name}", u.full_name));
      await load();
    } catch (e) { showToast("Erreur : " + e.message, "error"); }
    finally     { setLoadingId(null); }
  };

  const onApprove = handle(approveUser, "✅ {name} approuvé");
  const onReject  = handle(rejectUser,  "❌ {name} refusé");
  const onDelete  = handle(deleteUser,  "🗑️ {name} supprimé");

  const filtered = users.filter(u => filter === "all" || u.status === filter);
  const counts   = { all: users.length, pending: 0, approved: 0, rejected: 0 };
  users.forEach(u => { if (counts[u.status] !== undefined) counts[u.status]++; });

  const tab = (key, label) => (
    <button key={key} onClick={() => setFilter(key)} style={{
      padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
      fontWeight: filter === key ? 600 : 400, fontSize: "0.875rem",
      background: filter === key ? "#2D5F9E" : "#F1F5F9",
      color: filter === key ? "#fff" : "#64748B",
    }}>
      {label}
      {counts[key] > 0 && key !== "all" && (
        <span style={{ marginLeft: 6, background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 7px", fontSize: "0.75rem" }}>
          {counts[key]}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 20px", fontFamily: "DM Sans, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000, padding: "12px 20px", borderRadius: 10, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", background: toast.type === "error" ? "#FEE2E2" : "#DCFCE7", color: toast.type === "error" ? "#991B1B" : "#166534" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>Administration</h1>
      <p style={{ color: "#64748B", marginBottom: 28 }}>Gestion des accès médecins</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[["all","Total","#2D5F9E"],["pending","En attente","#D97706"],["approved","Approuvés","#059669"],["rejected","Refusés","#DC2626"]].map(([k,l,c]) => (
          <div key={k} onClick={() => setFilter(k)} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: `2px solid ${filter===k ? c : "#E2E8F0"}`, cursor: "pointer" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: c }}>{counts[k]}</div>
            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {tab("pending","En attente")}
        {tab("approved","Approuvés")}
        {tab("rejected","Refusés")}
        {tab("all","Tous")}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
          <div style={{ fontSize: "2.5rem" }}>👥</div>
          <p style={{ fontWeight: 500 }}>Aucun utilisateur dans cette catégorie</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(u => {
            const sm  = STATUS_META[u.status] || STATUS_META.pending;
            const busy = loadingId === u.id;
            return (
              <div key={u.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>

                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#2D5F9E,#6B4FA0)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>
                  {(u.full_name || u.username)?.[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "#0F172A" }}>{u.full_name}</span>
                    <span style={{ background: sm.bg, color: sm.text, padding: "2px 10px", borderRadius: 20, fontSize: "0.73rem", fontWeight: 600 }}>{sm.label}</span>
                    {u.is_admin && <span style={{ background: "#EDE9FE", color: "#5B21B6", padding: "2px 10px", borderRadius: 20, fontSize: "0.73rem", fontWeight: 600 }}>Admin</span>}
                  </div>
                  <div style={{ color: "#64748B", fontSize: "0.8rem", marginTop: 3 }}>@{u.username} · {u.role} · {u.specialty}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
                    {(u.domains || []).map(d => {
                      const info = DOMAIN_LABELS[d];
                      return info ? (
                        <span key={d} style={{ background: info.color + "18", color: info.color, border: `1px solid ${info.color}40`, padding: "2px 8px", borderRadius: 6, fontSize: "0.73rem", fontWeight: 500 }}>
                          {info.icon} {info.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Date */}
                <div style={{ color: "#94A3B8", fontSize: "0.76rem", flexShrink: 0 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : ""}
                </div>

                {/* Actions */}
                {!u.is_admin && (
                  <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                    {u.status === "pending" && (<>
                      <button onClick={() => onApprove(u)} disabled={busy} style={{ padding: "7px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", opacity: busy ? 0.6 : 1 }}>
                        {busy ? "…" : "✅ Approuver"}
                      </button>
                      <button onClick={() => onReject(u)} disabled={busy} style={{ padding: "7px 14px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", opacity: busy ? 0.6 : 1 }}>
                        {busy ? "…" : "❌ Refuser"}
                      </button>
                    </>)}
                    {u.status === "approved" && (
                      <button onClick={() => onReject(u)} disabled={busy} style={{ padding: "7px 14px", background: "#F1F5F9", color: "#64748B", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
                        Révoquer
                      </button>
                    )}
                    <button onClick={() => { if(confirm(`Supprimer ${u.full_name} ?`)) onDelete(u); }} disabled={busy} style={{ padding: "7px 11px", background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 8, cursor: "pointer" }}>
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}