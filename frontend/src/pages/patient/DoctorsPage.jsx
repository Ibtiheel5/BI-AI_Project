// src/pages/patient/DoctorsPage.jsx
import { useState } from "react";
import { Card } from "../../components/ui/Card";
import { Icon } from "../../components/ui/Icon";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { SectionHeader } from "../../components/ui/SectionHeader";
import { THEME } from "../../constants/theme";
import { DOCTORS } from "../../constants/doctors";

export const DoctorsPage = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const specialties = ["all", ...new Set(DOCTORS.team.map(d => d.specialty))];

  const filteredDoctors = DOCTORS.team.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialty.toLowerCase().includes(searchTerm.toLowerCase()) || d.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || d.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div>
      <SectionHeader title="Notre équipe médicale" subtitle={`${DOCTORS.team.length} spécialistes à votre service`} badge={{ text: `${DOCTORS.team.filter(d => d.available).length} disponibles`, variant: "success" }} />

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><Icon name="search" size={16} color={THEME.colors.textMuted} /></span>
          <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Rechercher un médecin..." style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: THEME.radii.full, border: `1.5px solid ${THEME.colors.border}`, fontSize: "0.88rem", outline: "none", background: THEME.colors.surface, color: THEME.colors.text }} />
        </div>
        <select value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)} style={{ padding: "10px 16px", borderRadius: THEME.radii.full, border: `1.5px solid ${THEME.colors.border}`, fontSize: "0.88rem", outline: "none", background: THEME.colors.surface, color: THEME.colors.text, cursor: "pointer" }}>
          <option value="all">Toutes les spécialités</option>
          {specialties.filter(s => s !== "all").map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grille de médecins */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
        {filteredDoctors.map((doctor) => (
          <Card key={doctor.id} hoverable padding="0" style={{ overflow: "hidden" }} onClick={() => setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor)}>
            <div style={{ padding: "24px 28px", background: `linear-gradient(135deg, ${THEME.colors.primary}10, ${THEME.colors.accentSoft})` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <Avatar src={doctor.photo} name={doctor.name} size={80} available={doctor.available} ring />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: THEME.colors.text, fontFamily: THEME.fonts.display, margin: 0 }}>{doctor.name}</h3>
                    <Badge variant={doctor.available ? "success" : "default"} size="sm">{doctor.available ? "Disponible" : "Indisponible"}</Badge>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: THEME.colors.accent, fontWeight: 500, marginBottom: 4 }}>{doctor.specialty}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Icon name="star" size={14} color={THEME.colors.warning} />
                    <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{doctor.rating}</span>
                    <span style={{ fontSize: "0.78rem", color: THEME.colors.textMuted }}>({doctor.patients.toLocaleString()} avis)</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: THEME.colors.textSecondary }}>{doctor.hospital}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 28px 28px" }}>
              <div style={{ marginBottom: 16 }}><div style={{ fontSize: "0.8rem", color: THEME.colors.textMuted, marginBottom: 4 }}>Expérience</div><div style={{ fontWeight: 600, fontSize: "0.9rem", color: THEME.colors.text }}>{doctor.experience}</div></div>
              <div style={{ marginBottom: 16 }}><div style={{ fontSize: "0.8rem", color: THEME.colors.textMuted, marginBottom: 4 }}>Formation</div><div style={{ fontWeight: 500, fontSize: "0.85rem", color: THEME.colors.text }}>{doctor.education}</div></div>
              <div style={{ marginBottom: 20 }}><div style={{ fontSize: "0.8rem", color: THEME.colors.textMuted, marginBottom: 4 }}>Langues</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{doctor.languages.map(lang => <span key={lang} style={{ padding: "4px 10px", borderRadius: THEME.radii.full, background: THEME.colors.bgAlt, fontSize: "0.75rem", color: THEME.colors.textSecondary, fontWeight: 500 }}>{lang}</span>)}</div></div>

              {doctor.available && <div style={{ padding: "12px 16px", borderRadius: THEME.radii.md, background: THEME.colors.successSoft, display: "flex", alignItems: "center", gap: 8 }}><Icon name="clock" size={16} color={THEME.colors.success} /><span style={{ fontSize: "0.85rem", color: THEME.colors.success, fontWeight: 600 }}>Prochain créneau : {doctor.nextSlot}</span></div>}

              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Button onClick={(e) => { e.stopPropagation(); onNavigate("messages"); }} icon="message" variant="primary" size="sm" fullWidth>Contacter</Button>
                <Button onClick={(e) => { e.stopPropagation(); onNavigate("appointments"); }} icon="calendar" variant="secondary" size="sm" fullWidth>RDV</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};