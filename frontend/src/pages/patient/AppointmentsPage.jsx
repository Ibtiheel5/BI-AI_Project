// src/pages/patient/AppointmentsPage.jsx
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Badge } from "../../components/ui/Badge";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { THEME, EXAM_TYPES } from "../../constants/theme";

export const AppointmentsPage = ({ consultations, onNavigate }) => {
  const active = consultations.filter(c => c.status === "accepted" || c.status === "analyzed");

  return (
    <div>
      <SectionHeader title="Rendez-vous" subtitle="Vos consultations planifiées et à venir" badge={{ text: `${active.length} actifs`, variant: "info" }} />
      {active.length === 0 ? (
        <EmptyState icon="calendar" title="Aucun rendez-vous" description="Les rendez-vous seront disponibles après acceptation de votre dossier par un médecin." action={<Button onClick={() => onNavigate("upload")}>Soumettre un dossier</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {active.map(c => {
            const examType = EXAM_TYPES[c.model_key] || EXAM_TYPES.chest;
            return (
              <Card key={c.id} padding="24px" hoverable>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: THEME.radii.lg, background: THEME.colors.infoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="calendar" size={24} color={THEME.colors.info} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: THEME.colors.text }}>Consultation #{c.id}</div>
                    <div style={{ fontSize: "0.85rem", color: THEME.colors.textSecondary, marginTop: 2 }}>{c.doctor_name ? `Dr. ${c.doctor_name}` : "Médecin à confirmer"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <StatusBadge status={c.status} />
                      <span style={{ fontSize: "0.8rem", color: THEME.colors.textMuted }}>{examType.label}</span>
                    </div>
                  </div>
                  <Button onClick={() => onNavigate("messages")} variant="primary" size="sm">Rejoindre</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};