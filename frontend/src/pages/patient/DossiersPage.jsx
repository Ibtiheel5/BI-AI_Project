// src/pages/patient/DossiersPage.jsx
import { useState, useEffect, useMemo } from "react";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Badge } from "../../components/ui/Badge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { THEME, EXAM_TYPES, STATUS_MAP } from "../../constants/theme";

export const DossiersPage = ({ consultations, onNavigate, searchQuery }) => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(searchQuery || "");
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    if (searchQuery) setSearchTerm(searchQuery);
  }, [searchQuery]);

  const filteredConsultations = useMemo(() => {
    let result = consultations;
    if (filter !== "all") result = result.filter(c => c.status === filter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        String(c.id).includes(term) ||
        (EXAM_TYPES[c.model_key]?.label || "").toLowerCase().includes(term) ||
        (c.doctor_name || "").toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });
  }, [consultations, filter, searchTerm, sortBy]);

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const filters = [
    { value: "all", label: "Tous", count: consultations.length },
    { value: "pending", label: "En attente", count: consultations.filter(c => c.status === "pending").length },
    { value: "accepted", label: "En cours", count: consultations.filter(c => c.status === "accepted").length },
    { value: "analyzed", label: "Résultats", count: consultations.filter(c => c.status === "analyzed").length },
    { value: "closed", label: "Terminés", count: consultations.filter(c => c.status === "closed").length },
  ];

  return (
    <div>
      <SectionHeader
        title="Dossiers médicaux"
        subtitle={`${consultations.length} dossier${consultations.length > 1 ? "s" : ""} au total`}
        badge={{ text: `${filteredConsultations.length} affichés`, variant: "info" }}
        action={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", background: THEME.colors.bgAlt, borderRadius: THEME.radii.md, padding: 3 }}>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: "6px 14px", borderRadius: THEME.radii.sm, border: "none",
                  background: viewMode === "list" ? THEME.colors.surface : "transparent",
                  color: viewMode === "list" ? THEME.colors.accent : THEME.colors.textMuted,
                  fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                  boxShadow: viewMode === "list" ? THEME.shadows.sm : "none",
                }}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "6px 14px", borderRadius: THEME.radii.sm, border: "none",
                  background: viewMode === "grid" ? THEME.colors.surface : "transparent",
                  color: viewMode === "grid" ? THEME.colors.accent : THEME.colors.textMuted,
                  fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                  boxShadow: viewMode === "grid" ? THEME.shadows.sm : "none",
                }}
              >
                Grille
              </button>
            </div>
            <Button onClick={() => onNavigate("upload")} icon="plus" variant="primary" size="sm">Nouveau dossier</Button>
          </div>
        }
      />

      {/* Recherche et filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 350 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={16} color={THEME.colors.textMuted} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher par ID, type d'examen, médecin..."
            style={{
              width: "100%", padding: "10px 14px 10px 36px",
              borderRadius: THEME.radii.full,
              border: `1.5px solid ${THEME.colors.border}`,
              fontSize: "0.88rem", outline: "none",
              background: THEME.colors.surface, color: THEME.colors.text,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "8px 16px", borderRadius: THEME.radii.full,
                border: `1.5px solid ${filter === f.value ? THEME.colors.primary : THEME.colors.border}`,
                background: filter === f.value ? THEME.colors.primary : THEME.colors.surface,
                color: filter === f.value ? "white" : THEME.colors.textSecondary,
                fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                transition: THEME.transitions.fast,
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{
            padding: "8px 14px", borderRadius: THEME.radii.full,
            border: `1.5px solid ${THEME.colors.border}`,
            fontSize: "0.8rem", outline: "none",
            background: THEME.colors.surface, color: THEME.colors.text,
            cursor: "pointer", fontWeight: 500,
          }}
        >
          <option value="date">Trier par date</option>
          <option value="status">Trier par statut</option>
        </select>
      </div>

      {/* Contenu */}
      {filteredConsultations.length === 0 ? (
        <EmptyState
          icon="file"
          title="Aucun dossier trouvé"
          description={searchTerm ? "Essayez de modifier votre recherche." : "Soumettez votre première image médicale."}
          action={!searchTerm ? <Button onClick={() => onNavigate("upload")}>Soumettre un dossier</Button> : null}
        />
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 18 }}>
          {filteredConsultations.map(consultation => {
            const examType = EXAM_TYPES[consultation.model_key] || EXAM_TYPES.chest;
            return (
              <Card key={consultation.id} hoverable onClick={() => setExpandedId(expandedId === consultation.id ? null : consultation.id)}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: THEME.radii.md, background: `${examType.color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={examType.icon} size={22} color={examType.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: THEME.colors.text }}>{examType.label}</div>
                    <div style={{ fontSize: "0.78rem", color: THEME.colors.textSecondary }}>Dossier #{consultation.id}</div>
                  </div>
                  <StatusBadge status={consultation.status} />
                </div>
                <div style={{ fontSize: "0.82rem", color: THEME.colors.textSecondary }}>{formatDate(consultation.created_at)}</div>
                {consultation.prediction && (
                  <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: THEME.radii.md, background: THEME.colors.successSoft, fontSize: "0.82rem", fontWeight: 600, color: THEME.colors.success }}>
                    {consultation.prediction}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredConsultations.map(consultation => {
            const examType = EXAM_TYPES[consultation.model_key] || EXAM_TYPES.chest;
            const isExpanded = expandedId === consultation.id;
            return (
              <Card key={consultation.id}>
                <div onClick={() => setExpandedId(isExpanded ? null : consultation.id)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 16, userSelect: "none" }}>
                  <div style={{ width: 48, height: 48, borderRadius: THEME.radii.md, background: `${examType.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={examType.icon} size={22} color={examType.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: THEME.colors.text, marginBottom: 4 }}>{examType.label}</div>
                    <div style={{ fontSize: "0.82rem", color: THEME.colors.textSecondary }}>
                      Dossier #{consultation.id} • {formatDate(consultation.created_at)}
                      {consultation.doctor_name && ` • Dr. ${consultation.doctor_name}`}
                    </div>
                  </div>
                  <StatusBadge status={consultation.status} />
                  <Icon name="chevronDown" size={20} color={THEME.colors.textMuted} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: THEME.transitions.normal }} />
                </div>
                {isExpanded && (
                  <div style={{ paddingTop: 20, marginTop: 16, borderTop: `1px solid ${THEME.colors.borderLight}`, animation: "slideDown 0.3s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                      <div>
                        <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: THEME.colors.text, marginBottom: 14 }}>Détails du dossier</h4>
                        {[
                          ["Type d'examen", examType.label],
                          ["Médecin assigné", consultation.doctor_name ? `Dr. ${consultation.doctor_name}` : "En attente d'assignation"],
                          ["Date de création", formatDate(consultation.created_at)],
                          ["Statut", STATUS_MAP[consultation.status]?.label],
                          ["Dernière mise à jour", formatDate(consultation.updated_at || consultation.created_at)],
                        ].map(([label, value], i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${THEME.colors.borderLight}`, fontSize: "0.85rem" }}>
                            <span style={{ color: THEME.colors.textSecondary }}>{label}</span>
                            <span style={{ fontWeight: 500, color: THEME.colors.text }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: THEME.colors.text, marginBottom: 14 }}>Résultat de l'analyse</h4>
                        {consultation.prediction ? (
                          <div style={{ padding: "20px", borderRadius: THEME.radii.md, background: THEME.colors.successSoft, border: `1px solid ${THEME.colors.success}30` }}>
                            <div style={{ fontWeight: 700, fontSize: "1rem", color: THEME.colors.text, marginBottom: 8 }}>{consultation.prediction}</div>
                            {consultation.confidence && (
                              <div>
                                <div style={{ fontSize: "0.85rem", color: THEME.colors.textSecondary, marginBottom: 8 }}>Confiance : {(consultation.confidence * 100).toFixed(1)}%</div>
                                <ProgressBar value={consultation.confidence * 100} color={THEME.colors.success} showLabel={false} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ padding: "20px", borderRadius: THEME.radii.md, background: THEME.colors.bgAlt, textAlign: "center" }}>
                            <Icon name="clock" size={24} color={THEME.colors.textMuted} />
                            <p style={{ color: THEME.colors.textSecondary, fontSize: "0.9rem", marginTop: 8 }}>En attente d'analyse par un médecin</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};