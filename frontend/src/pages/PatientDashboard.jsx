// src/pages/PatientDashboard.jsx
// Dashboard Patient — Version Premium avec Chatbot IA & Géolocalisation
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION MÉDICALE
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  pending:  { label: "En attente",  short: "Attente",  color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "⏳" },
  accepted: { label: "Pris en charge", short: "En cours", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "🩺" },
  analyzed: { label: "Résultats prêts", short: "Résultat", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: "🧬" },
  closed:   { label: "Terminé",     short: "Terminé",  color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB", icon: "✅" },
  rejected: { label: "Refusé",      short: "Refusé",   color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "❌" },
};

const URGENCY_CONFIG = {
  critical: { label: "Critique", color: "#DC2626", bg: "#FEE2E2", icon: "🔴", pulse: true },
  urgent:   { label: "Urgent",   color: "#EA580C", bg: "#FFF7ED", icon: "🟠", pulse: true },
  normal:   { label: "Normal",   color: "#059669", bg: "#F0FDF4", icon: "🟢", pulse: false },
};

const MODEL_CONFIG = {
  brain:  { icon: "🧠", label: "IRM Cérébrale",     fullLabel: "Imagerie par Résonance Magnétique — Encéphale", color: "#7C3AED", bg: "#F5F3FF", organ: "Cerveau", modality: "IRM", accuracy: "96.2%" },
  lung:   { icon: "🔬", label: "Scanner CT",         fullLabel: "Tomodensitométrie — Poumons",                  color: "#DC2626", bg: "#FEF2F2", organ: "Poumons", modality: "TDM", accuracy: "94.8%" },
  chest:  { icon: "🫁", label: "Radio Thoracique",   fullLabel: "Radiographie — Thorax",                        color: "#0369A1", bg: "#F0F9FF", organ: "Thorax",  modality: "Rx",  accuracy: "97.3%" },
  retina: { icon: "👁️", label: "Fond d'œil",        fullLabel: "Rétinographie — Fond d'œil",                   color: "#0E7490", bg: "#ECFEFF", organ: "Rétine",   modality: "Photo", accuracy: "92.1%" },
};

const CITY_COORDS = {
  "Tunis": [36.8065, 10.1815], "Sfax": [34.7398, 10.7600],
  "Sousse": [35.8254, 10.6369], "Ariana": [36.8625, 10.1956],
  "Bizerte": [37.2744, 9.8739], "Monastir": [35.7643, 10.8113],
  "Nabeul": [36.4561, 10.7376], "Ben Arous": [36.7533, 10.2282],
  "Kairouan": [35.6781, 10.0963], "Gabès": [33.8815, 10.0982],
  "Mahdia": [35.5047, 11.0622], "Gafsa": [34.4250, 8.7842],
  "Béja": [36.7256, 9.1817], "Jendouba": [36.5011, 8.7802],
  "Manouba": [36.8101, 10.0956], "Kasserine": [35.1676, 8.8365],
  "Médenine": [33.3540, 10.5055], "Tataouine": [32.9297, 10.4518],
  "Tozeur": [33.9197, 8.1336], "Siliana": [36.0849, 9.3708],
  "Zaghouan": [36.4029, 10.1429], "Le Kef": [36.1747, 8.7049],
  "Sidi Bouzid": [34.4311, 9.4838], "Kébili": [33.7072, 8.9713],
  "Hammam Lif": [36.6661, 10.3145], "La Marsa": [36.8783, 10.3247],
  "Carthage": [36.8530, 10.3220], "El Menzah": [36.8425, 10.1547],
  "Radès": [36.7033, 10.2333], "Ezzahra": [36.7314, 10.1997],
  "Mornag": [36.6331, 10.2583], "Hammam Sousse": [35.8625, 10.6111],
  "Msaken": [35.7167, 10.5833], "Moknine": [35.6333, 10.9000],
  "Ksar Hellal": [35.6333, 10.8833], "Mahres": [34.5667, 10.5333],
  "Enfidha": [36.1333, 10.4167], "Bouficha": [35.8833, 10.4500],
  "Ben Gardane": [33.3400, 11.1300], "Kalaa Kebira": [35.7167, 10.6333],
};

const TUNISIA_CENTER = [34.0, 9.0];

const SPEC_ICONS = {
  "Neurologue": "🧠", "Neurochirurgien": "🧠", "Pneumologue": "🫁",
  "Oncologue": "🔬", "Carcinologue": "🔬", "Cardiologue": "❤️",
  "Infectiologue": "🦠", "Radiologue": "⚡", "Ophtalmologue": "👁️",
  "Chirurgie carcinologique": "🔬",
};

const PREDICTION_DISPLAY = {
  "Normal": { severity: "none", color: "#059669", label: "Aucune anomalie" },
  "No Finding": { severity: "none", color: "#059669", label: "Aucune anomalie" },
  "COVID": { severity: "critical", color: "#DC2626", label: "COVID-19" },
  "Pneumonia": { severity: "critical", color: "#DC2626", label: "Pneumonie" },
  "Pneumothorax": { severity: "critical", color: "#DC2626", label: "Pneumothorax" },
  "Edema": { severity: "critical", color: "#DC2626", label: "Œdème pulmonaire" },
  "Mass": { severity: "critical", color: "#DC2626", label: "Masse pulmonaire" },
  "Malignant": { severity: "critical", color: "#DC2626", label: "Tumeur maligne" },
  "Glioma": { severity: "critical", color: "#DC2626", label: "Gliome" },
  "Cardiomegaly": { severity: "urgent", color: "#EA580C", label: "Cardiomégalie" },
  "Meningioma": { severity: "urgent", color: "#EA580C", label: "Méningiome" },
  "Benign": { severity: "low", color: "#D97706", label: "Tumeur bénigne" },
  "No_DR": { severity: "none", color: "#059669", label: "Pas de rétinopathie" },
  "Proliferate_DR": { severity: "critical", color: "#DC2626", label: "RD proliférante" },
};

// ═══════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km == null || isNaN(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function formatDate(d, withTime = false) {
  if (!d) return "—";
  const options = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) { options.hour = "2-digit"; options.minute = "2-digit"; }
  return new Date(d).toLocaleDateString("fr-FR", options);
}

function formatTimeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return `Il y a ${Math.floor(diff / 1440)}j`;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS INTERNES
// ═══════════════════════════════════════════════════════════════

// --- Particles Background ---
function ParticlesBg() {
  const particles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, duration: 8 + Math.random() * 15,
    delay: Math.random() * 10, opacity: 0.03 + Math.random() * 0.06,
  })), []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#2563EB", opacity: p.opacity,
          animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// --- Map Components ---
function MapCenterOnUser({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 13); }, [position, map]);
  return null;
}

function DoctorMap({ userLocation, allDoctors, nearbyIds, selectedDoctor, setSelectedDoctor, searchRadius }) {
  const userIcon = L.divIcon({
    html: `<div style="width:22px;height:22px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(37,99,235,0.3),0 0 16px rgba(37,99,235,0.5);animation:mapPulse 2s infinite;"></div>`,
    className: "", iconSize: [22, 22], iconAnchor: [11, 11],
  });

  const nearbyIcon = (isSel) => L.divIcon({
    html: `<div style="width:${isSel?38:28}px;height:${isSel?38:28}px;background:${isSel?'#DC2626':'#059669'};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:${isSel?16:13}px;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.3);">⚕</div>`,
    className: "", iconSize: [isSel?38:28, isSel?38:28], iconAnchor: [isSel?19:14, isSel?19:14],
  });

  const farIcon = (isSel) => L.divIcon({
    html: `<div style="width:${isSel?26:20}px;height:${isSel?26:20}px;background:${isSel?'#6B7280':'#94A3B8'};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:${isSel?11:9}px;font-weight:700;opacity:0.7;">⚕</div>`,
    className: "", iconSize: [isSel?26:20, isSel?26:20], iconAnchor: [isSel?13:10, isSel?13:10],
  });

  return (
    <MapContainer center={TUNISIA_CENTER} zoom={7} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {userLocation && <MapCenterOnUser position={userLocation} />}
      
      {/* Cercle du rayon de recherche */}
      {userLocation && (
        <Circle
          center={userLocation}
          radius={searchRadius * 1000}
          pathOptions={{
            color: "#2563EB",
            fillColor: "#2563EB",
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: "5, 5",
          }}
        />
      )}

      {/* Position utilisateur */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div style={{ fontWeight: 700, color: "#2563EB", padding: 4, textAlign: "center" }}>
              📍 <strong>Ma position</strong>
              {searchRadius && <div style={{ fontSize: "0.75rem", fontWeight: 400, marginTop: 2 }}>Rayon de recherche : {searchRadius} km</div>}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Tous les médecins */}
      {allDoctors.filter(d => d.coordinates).map(doc => {
        const isNearby = nearbyIds.has(doc.id);
        const isSel = selectedDoctor?.id === doc.id;
        const icon = isNearby ? nearbyIcon(isSel) : farIcon(isSel);
        
        return (
          <Marker
            key={doc.id}
            position={doc.coordinates}
            icon={icon}
            zIndexOffset={isNearby ? 1000 : 500}
            eventHandlers={{ click: () => setSelectedDoctor(doc) }}
          >
            <Popup>
              <div style={{ minWidth: 200, padding: 4 }}>
                <div style={{ fontWeight: 700, color: "#0A2647", marginBottom: 4, fontSize: "0.85rem" }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: 4 }}>
                  {SPEC_ICONS[doc.specialite] || "⚕"} {doc.specialite}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginBottom: 8 }}>
                  📍 {doc.ville}
                  {doc.distance != null && (
                    <span style={{
                      marginLeft: 8,
                      padding: "2px 8px",
                      borderRadius: 8,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: isNearby ? "#ECFDF5" : "#F1F5F9",
                      color: isNearby ? "#059669" : "#64748B",
                    }}>
                      {formatDistance(doc.distance)}
                      {!isNearby && " (hors rayon)"}
                    </span>
                  )}
                </div>
                {doc.address && (
                  <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 6 }}>
                    🏥 {doc.address.substring(0, 60)}
                  </div>
                )}
                {doc.phones?.length > 0 && (
                  <a href={`tel:${doc.phones[0]}`} style={{
                    display: "inline-block", padding: "5px 12px",
                    background: "#059669", color: "white", borderRadius: 8,
                    fontSize: "0.7rem", fontWeight: 600, textDecoration: "none",
                  }}>📞 Appeler</a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// --- Doctor Card ---
function DoctorCard({ doctor, isSelected, onClick, isNearby }) {
  const specIcon = SPEC_ICONS[doctor.specialite] || "⚕";
  return (
    <div onClick={onClick} style={{
      padding: "14px 16px", borderRadius: 14, marginBottom: 8, cursor: "pointer",
      background: isSelected ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)" : "white",
      border: `1.5px solid ${isSelected ? "#2563EB" : "#F1F5F9"}`,
      transition: "all 0.2s", position: "relative", overflow: "hidden",
      opacity: isNearby ? 1 : 0.7,
    }}>
      {isSelected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2563EB, #0EA5E9)" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: isSelected ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : isNearby ? "linear-gradient(135deg, #059669, #047857)" : "linear-gradient(135deg, #94A3B8, #64748B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "1.2rem", fontWeight: 700,
          boxShadow: isSelected ? "0 6px 20px rgba(37,99,235,0.3)" : "none",
        }}>{specIcon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doctor.name}</span>
            {!isNearby && (
              <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 700, background: "#F1F5F9", color: "#94A3B8" }}>HORS RAYON</span>
            )}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#64748B", marginBottom: 4 }}>{doctor.specialite}</div>
          <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
            📍 {doctor.ville}
            {doctor.distance != null && ` · ${formatDistance(doctor.distance)}`}
          </div>
        </div>
        <div style={{ color: isSelected ? "#2563EB" : "#CBD5E1", fontSize: "1.1rem", transition: "transform 0.2s", transform: isSelected ? "rotate(90deg)" : "" }}>→</div>
      </div>
      {isSelected && (
        <div style={{ marginTop: 12, padding: "12px", background: "white", borderRadius: 10, animation: "fadeUp 0.25s ease" }}>
          {doctor.address && <div style={{ fontSize: "0.72rem", color: "#475569", marginBottom: 8 }}>🏥 {doctor.address}</div>}
          {doctor.phones?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {doctor.phones.map((p, i) => (
                <a key={i} href={`tel:${p}`} onClick={e => e.stopPropagation()} style={{
                  padding: "6px 14px", background: "linear-gradient(135deg, #059669, #047857)",
                  color: "white", borderRadius: 8, fontSize: "0.72rem", fontWeight: 600,
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
                  boxShadow: "0 3px 10px rgba(5,150,105,0.2)",
                }}>📞 {p}</a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Consultation Row ---
function ConsultationRow({ consultation, onClick }) {
  const st = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.pending;
  const mc = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
  const pd = PREDICTION_DISPLAY[consultation.prediction];
  const ur = URGENCY_CONFIG[consultation.urgency];

  return (
    <div onClick={onClick} style={{
      background: "white", borderRadius: 14, padding: "16px 20px",
      border: "1px solid #E2E8F0", cursor: "pointer", display: "flex",
      alignItems: "center", gap: 14, transition: "all 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = mc.color; e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = `0 4px 16px ${mc.color}15`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${mc.color}, ${mc.color}cc)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.4rem", color: "white", boxShadow: `0 6px 16px ${mc.color}30`,
      }}>{mc.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#94A3B8", fontFamily: "'DM Mono', monospace", background: "#F1F5F9", padding: "2px 8px", borderRadius: 6 }}>#{consultation.id}</span>
          <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.icon} {st.short}</span>
          {ur && consultation.status !== "pending" && (
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: ur.bg, color: ur.color, animation: ur.pulse ? "alertPulse 2s infinite" : "none" }}>{ur.icon} {ur.label}</span>
          )}
          {pd && consultation.status !== "pending" && (
            <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: "0.62rem", fontWeight: 700, background: pd.color + "15", color: pd.color }}>{pd.label}</span>
          )}
        </div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0A2647", marginBottom: 3 }}>{mc.label} — {mc.organ}</div>
        <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
          {formatDate(consultation.created_at)} · {mc.modality}
          {consultation.doctor_name && ` · Dr. ${consultation.doctor_name}`}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        {consultation.status === "analyzed" && (
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>🧬 Résultat</div>
        )}
        <div style={{ color: "#CBD5E1", fontSize: "1.1rem", marginTop: 4 }}>→</div>
      </div>
    </div>
  );
}

// --- Quick Action Card ---
function QuickActionCard({ icon, title, desc, color, bg, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      padding: "20px", background: "white", borderRadius: 16,
      border: "1px solid #E2E8F0", cursor: "pointer", textAlign: "left",
      transition: "all 0.2s", display: "flex", alignItems: "center", gap: 16,
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0A2647", marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: "0.75rem", color: "#94A3B8", lineHeight: 1.4 }}>{desc}</div>
      </div>
      {badge && (
        <span style={{
          position: "absolute", top: 12, right: 12,
          padding: "3px 10px", borderRadius: 20, fontSize: "0.65rem",
          fontWeight: 700, background: color, color: "white",
        }}>{badge}</span>
      )}
    </button>
  );
}

// --- Stat Card ---
function StatCard({ icon, label, value, color, bg, onClick, alert }) {
  return (
    <div onClick={onClick} style={{
      background: "white", borderRadius: 16, padding: "18px 20px",
      border: "1px solid #E2E8F0", cursor: onClick ? "pointer" : "default",
      position: "relative", overflow: "hidden", transition: "all 0.2s",
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.transform = ""; } }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: bg, opacity: 0.5 }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: "1.5rem" }}>{icon}</span>
          {alert && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC2626", animation: "pulse 1.5s infinite" }} />}
        </div>
        <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600, marginTop: 6 }}>{label}</div>
      </div>
    </div>
  );
}

// --- Loading Spinner ---
function LoadingSpinner({ text = "Chargement..." }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{
        width: 44, height: 44, border: "3px solid #E2E8F0",
        borderTopColor: "#2563EB", borderRadius: "50%",
        animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
      }} />
      <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>{text}</div>
    </div>
  );
}

// --- Empty State ---
function EmptyState({ icon, title, desc, actionLabel, onAction }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 24px",
      background: "linear-gradient(180deg, #FAFBFC, #F1F5F9)",
      borderRadius: 20, border: "1px dashed #E2E8F0",
    }}>
      <div style={{ fontSize: "3.5rem", marginBottom: 16, opacity: 0.7 }}>{icon}</div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0A2647", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: "0.85rem", color: "#94A3B8", lineHeight: 1.6, maxWidth: 400, margin: "0 auto 20px" }}>{desc}</div>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{
          padding: "12px 28px", background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
          border: "none", borderRadius: 12, color: "white", fontSize: "0.85rem",
          fontWeight: 700, cursor: "pointer", boxShadow: "0 6px 20px rgba(10,38,71,0.25)",
        }}>{actionLabel}</button>
      )}
    </div>
  );
}

// --- Chatbot Widget ---
function ChatbotWidget({ isOpen, onToggle, userLocation }) {
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Bonjour ! 👋 Je suis votre **assistant santé IA**.\n\nDécrivez-moi vos symptômes et je vous orienterai vers l'examen le plus adapté **avec les médecins disponibles près de chez vous**.\n\nJe peux vous aider pour :\n• 🫁 Symptômes respiratoires/cardiaques → Radio thoracique\n• 🔬 Lésions pulmonaires → Scanner CT\n• 🧠 Symptômes neurologiques → IRM cérébrale\n• 👁️ Problèmes de vision → Fond d'œil",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    setMessages(prev => [...prev, { type: "user", text }]);
    setIsTyping(true);
    setDoctors([]);

    try {
      const body = { text };
      if (userLocation) {
        body.user_lat = userLocation[0];
        body.user_lon = userLocation[1];
      }

      const res = await fetch(`${API}/chatbot/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      setMessages(prev => [...prev, { type: "bot", text: data.message }]);
      if (data.recommendation) setRecommendation(data.recommendation);
      if (data.doctors?.length > 0) setDoctors(data.doctors);
    } catch {
      setMessages(prev => [...prev, { type: "bot", text: "Désolé, une erreur est survenue. Veuillez réessayer." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickExamples = [
    { text: "Je tousse depuis 2 semaines avec fièvre", icon: "🫁", model: "chest" },
    { text: "J'ai des maux de tête intenses et des vertiges", icon: "🧠", model: "brain" },
    { text: "Je vois flou et je suis diabétique", icon: "👁️", model: "retina" },
    { text: "J'ai perdu du poids et je fume beaucoup", icon: "🔬", model: "lung" },
  ];

  return (
    <>
      {/* Floating Button */}
      <button onClick={onToggle} style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1001,
        width: 64, height: 64, borderRadius: 20,
        background: isOpen ? "#DC2626" : "linear-gradient(135deg, #0EA5E9, #2563EB)",
        border: "none", boxShadow: "0 10px 30px rgba(37,99,235,0.4)",
        cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: "1.6rem",
        transition: "all 0.3s", color: "white",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {isOpen ? "✕" : "🤖"}
        {!isOpen && <div style={{
          position: "absolute", top: -4, right: -4,
          width: 16, height: 16, borderRadius: "50%",
          background: "#10B981", border: "2px solid white",
          animation: "pulse 2s infinite",
        }} />}
      </button>

      {/* Chat Window */}
      <div style={{
        position: "fixed", bottom: isOpen ? 108 : -700, right: 28, zIndex: 1000,
        width: 440, height: 620, background: "white", borderRadius: 24,
        boxShadow: "0 24px 60px rgba(0,0,0,0.2)", border: "1px solid #E2E8F0",
        display: "flex", flexDirection: "column", transition: "bottom 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #E2E8F0",
          background: "linear-gradient(135deg, #0EA5E9, #2563EB)", color: "white",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>Assistant Santé IA</div>
            <div style={{ fontSize: "0.65rem", opacity: 0.8 }}>Analyse de symptômes · Recommandation médecins</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: "0.62rem", opacity: 0.8 }}>En ligne</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#F8FAFC" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
              marginBottom: 14, animation: "fadeUp 0.3s ease",
            }}>
              {msg.type === "bot" && (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #0EA5E9, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", marginRight: 8, marginTop: 6, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: msg.type === "user" ? "78%" : "88%",
                padding: "12px 16px", borderRadius: msg.type === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.type === "user" ? "linear-gradient(135deg, #0A2647, #1B3B6F)" : "white",
                color: msg.type === "user" ? "white" : "#0A2647",
                fontSize: "0.82rem", lineHeight: 1.65,
                border: msg.type === "bot" ? "1px solid #E2E8F0" : "none",
                boxShadow: msg.type === "user" ? "0 4px 12px rgba(10,38,71,0.2)" : "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {msg.text.split("\n").map((line, j) => (
                  <div key={j}>{line.split(/(\*\*.*?\*\*)/).map((part, k) => {
                    if (part.startsWith("**") && part.endsWith("**")) return <strong key={k} style={{ color: msg.type === "user" ? "#93C5FD" : "#2563EB" }}>{part.slice(2, -2)}</strong>;
                    return part;
                  })}</div>
                ))}
              </div>
            </div>
          ))}

          {/* Médecins Cards */}
          {doctors.length > 0 && (
            <div style={{ marginLeft: 40, marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#059669", marginBottom: 8 }}>👨‍⚕️ Médecins disponibles — Appelez directement</div>
              {doctors.map(doc => (
                <div key={doc.id} style={{ background: "white", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #059669, #047857)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1rem", fontWeight: 700, flexShrink: 0 }}>{SPEC_ICONS[doc.specialite] || "⚕"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0A2647", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{doc.specialite}</div>
                    </div>
                    {doc.distance_km && <span style={{ padding: "3px 8px", borderRadius: 10, fontSize: "0.65rem", fontWeight: 700, background: "#ECFDF5", color: "#059669" }}>{doc.distance_km} km</span>}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: 6 }}>📍 {doc.ville}{doc.address ? ` — ${doc.address.substring(0, 50)}` : ""}</div>
                  {doc.phones?.length > 0 && (
                    <div style={{ display: "flex", gap: 6 }}>
                      {doc.phones.map((p, j) => (
                        <a key={j} href={`tel:${p}`} style={{ padding: "5px 12px", background: "linear-gradient(135deg, #059669, #047857)", color: "white", borderRadius: 8, fontSize: "0.68rem", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>📞 {p}</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isTyping && (
            <div style={{ display: "flex", gap: 5, marginLeft: 40, marginBottom: 14 }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#CBD5E1", animation: `typingBounce 1.2s ease-in-out ${delay}s infinite` }} />
              ))}
            </div>
          )}

          {recommendation && (
            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 8, animation: "fadeUp 0.3s ease" }}>
              <button onClick={() => navigate(`/patient/consultation/new?model=${recommendation.model_key}`)} style={{
                padding: "12px 24px", background: "linear-gradient(135deg, #059669, #047857)",
                border: "none", borderRadius: 14, color: "white", fontSize: "0.85rem",
                fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                boxShadow: "0 6px 20px rgba(5,150,105,0.3)",
              }}>
                {MODEL_CONFIG[recommendation.model_key]?.icon || "📋"} Commencer l'examen →
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick examples */}
        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 10px", background: "#F8FAFC" }}>
            <div style={{ fontSize: "0.65rem", color: "#94A3B8", marginBottom: 8, fontWeight: 600 }}>💡 Exemples :</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quickExamples.map((ex, i) => (
                <button key={i} onClick={() => { setInput(ex.text); setTimeout(() => handleSend(), 100); }} style={{
                  padding: "6px 12px", background: "white", border: "1px solid #E2E8F0",
                  borderRadius: 20, fontSize: "0.68rem", color: "#475569", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563EB"; e.currentTarget.style.color = "#2563EB"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#475569"; }}
                >{ex.icon} {ex.text.substring(0, 30)}...</button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10, alignItems: "flex-end", background: "white" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Décrivez vos symptômes..." rows={2}
            style={{ flex: 1, padding: "10px 14px", background: "#F8FAFC", border: "1.5px solid #E2E8F0", borderRadius: 12, fontSize: "0.82rem", color: "#0A2647", resize: "none", fontFamily: "'DM Sans', sans-serif", outline: "none", maxHeight: 80 }}
            onFocus={e => e.target.style.borderColor = "#2563EB"} onBlur={e => e.target.style.borderColor = "#E2E8F0"}
          />
          <button onClick={handleSend} disabled={!input.trim() || isTyping} style={{
            width: 44, height: 44, borderRadius: 14,
            background: input.trim() ? "linear-gradient(135deg, #2563EB, #0EA5E9)" : "#E2E8F0",
            border: "none", color: "white", fontSize: "1.1rem",
            cursor: input.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.2s",
            boxShadow: input.trim() ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
          }}>➤</button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  // State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Fetch consultations
  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/consultations/my`, { headers }),
      fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers }),
    ])
      .then(([cRes, nRes]) => Promise.all([cRes.json(), nRes.ok ? nRes.json() : { notifications: [], unread: 0 }]))
      .then(([cData, nData]) => {
        setConsultations(cData.consultations || []);
        setNotifications(nData.notifications || []);
        setUnreadCount(nData.unread || 0);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  // Géolocalisation
  useEffect(() => {
    if (!navigator.geolocation) { setLocationError("Non supporté"); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setLocationLoading(false); },
      () => { setLocationError("Activez la localisation"); setLocationLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch doctors
  useEffect(() => {
    fetch(`${API}/doctors`)
      .then(r => r.json()).then(d => { setDoctors(d.doctors || []); setDoctorsLoading(false); })
      .catch(() => setDoctorsLoading(false));
  }, []);

  // Close notifications
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false); };
    if (showNotifications) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);

  // TOUS les médecins avec distance
  const allDoctorsWithDistance = useMemo(() => {
    if (!userLocation) {
      return doctors.map(doc => ({
        ...doc,
        distance: null,
        coordinates: CITY_COORDS[doc.ville] || null,
      }));
    }
    return doctors.map(doc => {
      const coords = CITY_COORDS[doc.ville];
      if (!coords) return { ...doc, distance: null, coordinates: null };
      const distance = haversineDistance(userLocation[0], userLocation[1], coords[0], coords[1]);
      return { ...doc, distance, coordinates: coords };
    });
  }, [doctors, userLocation]);

  // Médecins dans le rayon
  const nearbyDoctors = useMemo(() => {
    let filtered = allDoctorsWithDistance.filter(d => d.distance !== null && d.distance <= searchRadius);
    if (filterSpecialty) filtered = filtered.filter(d => d.specialite?.toLowerCase().includes(filterSpecialty.toLowerCase()));
    return filtered.sort((a, b) => a.distance - b.distance);
  }, [allDoctorsWithDistance, searchRadius, filterSpecialty]);

  // IDs des médecins dans le rayon
  const nearbyIds = useMemo(() => new Set(nearbyDoctors.map(d => d.id)), [nearbyDoctors]);

  // Médecins pour la carte (tous, filtrés par spécialité)
  const mapDoctors = useMemo(() => {
    if (filterSpecialty) return allDoctorsWithDistance.filter(d => d.specialite?.toLowerCase().includes(filterSpecialty.toLowerCase()));
    return allDoctorsWithDistance;
  }, [allDoctorsWithDistance, filterSpecialty]);

  const specialties = useMemo(() => [...new Set(doctors.map(d => d.specialite).filter(Boolean))].sort(), [doctors]);

  // Stats
  const stats = useMemo(() => ({
    total: consultations.length,
    pending: consultations.filter(c => c.status === "pending").length,
    active: consultations.filter(c => c.status === "accepted").length,
    ready: consultations.filter(c => c.status === "analyzed").length,
    closed: consultations.filter(c => c.status === "closed").length,
    critical: consultations.filter(c => c.urgency === "critical" || c.urgency === "urgent").length,
  }), [consultations]);

  const tabs = [
    { key: "dashboard", icon: "📊", label: "Vue d'ensemble" },
    { key: "consultations", icon: "📋", label: "Consultations" },
    { key: "appointments", icon: "📅", label: "Rendez-vous" },
    { key: "nearby", icon: "🗺️", label: "Médecins" },
    { key: "profile", icon: "👤", label: "Profil" },
  ];

  const markAllRead = async () => {
    try {
      await fetch(`${API}/consultations/notifications/read-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch {}
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)",
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    }}>
      <ParticlesBg />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.25); opacity: 0.6; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes typingBounce { 0%,100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-6px); } }
        @keyframes alertPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes floatParticle { 0% { transform: translateY(0) translateX(0); } 50% { transform: translateY(-20px) translateX(10px); } 100% { transform: translateY(15px) translateX(-15px); } }
        @keyframes mapPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); } 50% { box-shadow: 0 0 0 14px rgba(37,99,235,0); } }
        * { scrollbar-width: thin; scrollbar-color: #CBD5E1 transparent; }
        *::-webkit-scrollbar { width: 5px; } *::-webkit-scrollbar-track { background: transparent; } *::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #030C1A 0%, #0A2647 30%, #144272 60%, #205295 100%)",
        padding: "24px 32px 32px", color: "white", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.04) 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "50px 50px, 40px 40px" }} />
        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", border: "2px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, flexShrink: 0 }}>
                {user?.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>
              <div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{user?.full_name || "Patient"}</div>
                <div style={{ fontSize: "0.72rem", opacity: 0.7, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem" }}>PAT-{String(user?.id || 0).padStart(6, "0")}</span>
                  {userLocation && <span style={{ background: "rgba(52,211,153,0.2)", color: "#4ADE80", padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600 }}>📍 Localisé</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div ref={notifRef} style={{ position: "relative" }}>
                <button onClick={() => setShowNotifications(!showNotifications)} style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", cursor: "pointer", color: "white" }}>
                  🔔{unreadCount > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, background: "#DC2626", color: "white", fontSize: "0.6rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", border: "2px solid #0A2647", animation: "pulse 2s infinite" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div style={{ position: "absolute", top: 52, right: 0, width: 380, maxHeight: 400, background: "white", borderRadius: 18, border: "1px solid #E2E8F0", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", zIndex: 200, overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFBFC" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "#0A2647" }}>Notifications</span>
                      {unreadCount > 0 && <button onClick={markAllRead} style={{ background: "none", border: "1px solid #E2E8F0", color: "#475569", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", borderRadius: 6, padding: "3px 10px" }}>Tout lire</button>}
                    </div>
                    <div style={{ overflowY: "auto", maxHeight: 340 }}>
                      {notifications.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#CBD5E1" }}>Aucune notification</div> :
                        notifications.slice(0, 10).map(n => (
                          <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid #F8FAFC", background: n.is_read ? "white" : "#F0F9FF", cursor: "pointer" }}
                            onClick={() => { try { const d = typeof n.data === "string" ? JSON.parse(n.data) : n.data; if (d.consultation_id) navigate(`/consultation/${d.consultation_id}`); } catch {} setShowNotifications(false); }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: n.is_read ? "#F1F5F9" : "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>📌</div>
                              <div><div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0A2647", marginBottom: 2 }}>{n.title}</div>
                                <div style={{ fontSize: "0.72rem", color: "#64748B", lineHeight: 1.4 }}>{n.message}</div>
                                <div style={{ fontSize: "0.62rem", color: "#CBD5E1", marginTop: 4 }}>{formatTimeAgo(n.created_at)}</div></div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => navigate("/patient/consultation/new")} style={{ padding: "11px 24px", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, color: "white", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>+ Nouvelle demande</button>
            </div>
          </div>
          <div style={{ maxWidth: 600 }}>
            <h1 style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1.2 }}>
              {new Date().getHours() < 12 ? "👋 Bonjour" : new Date().getHours() < 18 ? "☀️ Bon après-midi" : "🌙 Bonsoir"}, {user?.full_name?.split(" ")[0]}
            </h1>
            <p style={{ fontSize: "0.95rem", opacity: 0.8, lineHeight: 1.6 }}>Votre espace santé sécurisé. Consultez vos résultats, trouvez un médecin près de chez vous, ou soumettez un nouvel examen.</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", gap: 2, padding: "0 32px", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "16px 24px", border: "none", background: "none",
              borderBottom: activeTab === tab.key ? "3px solid #2563EB" : "3px solid transparent",
              color: activeTab === tab.key ? "#2563EB" : "#64748B",
              fontWeight: activeTab === tab.key ? 700 : 400, fontSize: "0.88rem",
              cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10,
            }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 32px", position: "relative", zIndex: 1 }}>

        {/* TAB: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {stats.critical > 0 && (
              <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #FEF2F2, #FFF1F2)", border: "1.5px solid #FCA5A5", borderRadius: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", color: "white", animation: "alertPulse 2s infinite" }}>⚠️</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>Résultats nécessitant votre attention</div><div style={{ fontSize: "0.78rem", color: "#B91C1C" }}>{stats.critical} consultation{stats.critical > 1 ? "s" : ""} urgente{stats.critical > 1 ? "s" : ""}</div></div>
                <button onClick={() => setActiveTab("consultations")} style={{ padding: "9px 18px", background: "#DC2626", border: "none", borderRadius: 10, color: "white", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Voir →</button>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              <StatCard icon="📋" label="Total examens" value={stats.total} color="#0A2647" bg="#F1F5F9" />
              <StatCard icon="⏳" label="En attente" value={stats.pending} color="#D97706" bg="#FFFBEB" onClick={() => setActiveTab("consultations")} alert={stats.pending > 0} />
              <StatCard icon="🧬" label="Résultats prêts" value={stats.ready} color="#059669" bg="#ECFDF5" onClick={() => setActiveTab("consultations")} />
              <StatCard icon="✅" label="Terminés" value={stats.closed} color="#6B7280" bg="#F9FAFB" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              <QuickActionCard icon="📤" title="Nouvel examen" desc="Soumettre une image médicale" color="#7C3AED" bg="#EDE9FE" onClick={() => navigate("/patient/consultation/new")} />
              <QuickActionCard icon="🗺️" title="Médecins proches" desc="Trouver un spécialiste" color="#2563EB" bg="#EFF6FF" onClick={() => setActiveTab("nearby")} badge={userLocation ? `${nearbyDoctors.length}` : "📍"} />
              <QuickActionCard icon="💬" title="Consultations" desc="Historique & résultats" color="#059669" bg="#ECFDF5" onClick={() => setActiveTab("consultations")} />
              <QuickActionCard icon="📅" title="Rendez-vous" desc="Planning & suivi" color="#EA580C" bg="#FFF7ED" onClick={() => setActiveTab("appointments")} />
            </div>
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", fontSize: "0.9rem" }}>📋</div><div><div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0A2647" }}>Dernières consultations</div><div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>{consultations.length} consultation{consultations.length > 1 ? "s" : ""}</div></div></div>
                {consultations.length > 5 && <button onClick={() => setActiveTab("consultations")} style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, color: "#2563EB", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", padding: "6px 14px" }}>Voir tout →</button>}
              </div>
              {loading ? <LoadingSpinner /> : consultations.length === 0 ? <EmptyState icon="🏥" title="Aucune consultation" desc="Soumettez votre première image médicale." actionLabel="+ Nouvelle demande" onAction={() => navigate("/patient/consultation/new")} /> :
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {consultations.slice(0, 5).map(c => <ConsultationRow key={c.id} consultation={c} onClick={() => navigate(`/consultation/${c.id}`)} />)}
                </div>}
            </div>
          </div>
        )}

        {/* TAB: CONSULTATIONS */}
        {activeTab === "consultations" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", marginBottom: 4 }}>📋 Mes Consultations</h2><p style={{ color: "#64748B" }}>Historique complet de vos examens et analyses IA</p></div>
            {loading ? <LoadingSpinner /> : consultations.length === 0 ? <EmptyState icon="🏥" title="Aucune consultation" desc="Soumettez votre première image médicale." actionLabel="+ Nouvelle demande" onAction={() => navigate("/patient/consultation/new")} /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{consultations.map(c => <ConsultationRow key={c.id} consultation={c} onClick={() => navigate(`/consultation/${c.id}`)} />)}</div>}
          </div>
        )}

        {/* TAB: APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", marginBottom: 4 }}>📅 Mes Rendez-vous</h2><p style={{ color: "#64748B" }}>Gérez vos rendez-vous médicaux</p></div>
            <EmptyState icon="📅" title="Aucun rendez-vous" desc="Les rendez-vous avec vos médecins apparaîtront ici." />
          </div>
        )}

        {/* TAB: MÉDECINS PROCHES */}
        {activeTab === "nearby" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", marginBottom: 4 }}>🗺️ Médecins à Proximité</h2><p style={{ color: "#64748B" }}>{userLocation ? `${nearbyDoctors.length} médecin${nearbyDoctors.length > 1 ? "s" : ""} dans un rayon de ${searchRadius} km · ${mapDoctors.filter(d => d.coordinates).length} au total sur la carte` : "Activez la géolocalisation pour voir les distances"}</p></div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", padding: "16px 20px", background: "white", borderRadius: 16, border: "1px solid #E2E8F0", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>Rayon :</span>
              <select value={searchRadius} onChange={e => setSearchRadius(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: "0.8rem", background: "#F8FAFC", cursor: "pointer" }}>
                <option value={10}>10 km</option><option value={25}>25 km</option><option value={50}>50 km</option><option value={100}>100 km</option><option value={0}>Tout afficher</option>
              </select>
              <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>Spécialité :</span>
              <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: "0.8rem", background: "#F8FAFC", cursor: "pointer" }}>
                <option value="">Toutes</option>{specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ marginLeft: "auto" }}><span style={{ padding: "7px 16px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, background: "#EFF6FF", color: "#2563EB" }}>🟢 {nearbyDoctors.length} proches · ⚪ {allDoctorsWithDistance.length - nearbyDoctors.length} autres</span></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
              <div style={{ height: "calc(100vh - 400px)", minHeight: 500, borderRadius: 18, overflow: "hidden", border: "2px solid #E2E8F0", position: "relative" }}>
                {locationLoading ? <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}><LoadingSpinner text="Détection de votre position..." /></div> :
                  <DoctorMap userLocation={userLocation} allDoctors={mapDoctors} nearbyIds={nearbyIds} selectedDoctor={selectedDoctor} setSelectedDoctor={setSelectedDoctor} searchRadius={searchRadius} />}
                {locationError && <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 999, padding: "10px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, color: "#92400E", fontSize: "0.8rem", fontWeight: 600 }}>⚠️ {locationError}</div>}
              </div>
              <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 400px)" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", fontWeight: 800, color: "#0A2647", fontSize: "0.9rem" }}>
                  📋 {filterSpecialty ? `Médecins — ${filterSpecialty}` : "Tous les médecins"}
                  <span style={{ fontSize: "0.7rem", fontWeight: 400, color: "#94A3B8", marginLeft: 8 }}>
                    ({nearbyDoctors.length} dans le rayon)
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
                  {doctorsLoading ? <LoadingSpinner /> : nearbyDoctors.length === 0 && allDoctorsWithDistance.length === 0 ?
                    <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}><div style={{ fontSize: "2.5rem", marginBottom: 8, opacity: 0.5 }}>🔍</div><div>Aucun médecin trouvé</div></div> :
                    <>
                      {/* Médecins dans le rayon */}
                      {nearbyDoctors.map(doc => <DoctorCard key={doc.id} doctor={doc} isSelected={selectedDoctor?.id === doc.id} onClick={() => setSelectedDoctor(doc)} isNearby={true} />)}
                      {/* Séparateur */}
                      {nearbyDoctors.length > 0 && nearbyDoctors.length < allDoctorsWithDistance.length && (
                        <div style={{ margin: "12px 0", borderTop: "1px dashed #E2E8F0", textAlign: "center" }}>
                          <span style={{ position: "relative", top: -10, padding: "2px 12px", background: "#F8FAFC", borderRadius: 10, fontSize: "0.65rem", color: "#94A3B8", fontWeight: 600 }}>
                            ⚪ Hors rayon ({searchRadius} km) — {allDoctorsWithDistance.length - nearbyDoctors.length} médecins
                          </span>
                        </div>
                      )}
                      {/* Médecins hors rayon */}
                      {allDoctorsWithDistance.filter(d => !nearbyIds.has(d.id)).slice(0, 20).map(doc => <DoctorCard key={doc.id} doctor={doc} isSelected={selectedDoctor?.id === doc.id} onClick={() => setSelectedDoctor(doc)} isNearby={false} />)}
                    </>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFIL */}
        {activeTab === "profile" && (
          <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 700 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0A2647", marginBottom: 20 }}>👤 Mon Profil Médical</h2>
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ padding: "28px", borderBottom: "1px solid #E2E8F0", background: "linear-gradient(135deg, #FAFBFC, white)", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #0A2647, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "2rem", fontWeight: 700, boxShadow: "0 8px 24px rgba(37,99,235,0.3)" }}>{user?.full_name?.charAt(0)?.toUpperCase() || "P"}</div>
                <div><div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0A2647", marginBottom: 4 }}>{user?.full_name || "Patient"}</div><div style={{ fontSize: "0.85rem", color: "#64748B" }}>@{user?.username || "patient"}</div><div style={{ marginTop: 8, display: "flex", gap: 6 }}><span style={{ padding: "3px 10px", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700, background: "#EFF6FF", color: "#2563EB" }}>{user?.role || "Patient"}</span><span style={{ padding: "3px 10px", borderRadius: 8, fontSize: "0.68rem", fontWeight: 700, background: "#ECFDF5", color: "#059669" }}>Compte actif</span></div></div>
              </div>
              <div style={{ padding: "20px 28px" }}>
                {[["Nom complet", user?.full_name],["Identifiant", user?.username],["Email", user?.email || "Non renseigné"],["Téléphone", user?.phone || "Non renseigné"],["Spécialité", user?.specialty || "—"],["Date d'inscription", formatDate(user?.created_at)]].map(([l, v], i) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: i < 5 ? "1px solid #F8FAFC" : "none" }}><span style={{ fontSize: "0.85rem", color: "#94A3B8", fontWeight: 500 }}>{l}</span><span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0A2647" }}>{v || "—"}</span></div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20, background: "white", borderRadius: 18, border: "1px solid #E2E8F0", padding: "20px 24px" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0A2647", marginBottom: 16 }}>🔬 Examens disponibles</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {Object.entries(MODEL_CONFIG).map(([k, m]) => (
                  <div key={k} style={{ padding: "14px", borderRadius: 14, background: m.bg, border: `1px solid ${m.color}20`, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: "1.4rem" }}>{m.icon}</div><div><div style={{ fontSize: "0.82rem", fontWeight: 700, color: m.color }}>{m.label}</div><div style={{ fontSize: "0.7rem", color: "#64748B" }}>{m.organ} · {m.accuracy}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20, padding: "16px 20px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#92400E", marginBottom: 4 }}>⚠️ Avertissement médical</div>
              <div style={{ fontSize: "0.75rem", color: "#A16207", lineHeight: 1.6 }}>Les résultats IA sont des aides au diagnostic. En cas d'urgence, appelez le <strong>15 (SAMU)</strong> ou le <strong>112</strong>.</div>
            </div>
          </div>
        )}

      </div>

      {/* CHATBOT */}
      <ChatbotWidget isOpen={chatbotOpen} onToggle={() => setChatbotOpen(!chatbotOpen)} userLocation={userLocation} />

      {/* FOOTER */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "20px 32px 30px", borderTop: "1px solid #E2E8F0", textAlign: "center", color: "#94A3B8", fontSize: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>⚕️ MedAI — Plateforme de télémédecine assistée par IA</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 6 }}>{["Confidentialité", "Conditions", "Contact", "Aide"].map(l => <span key={l} style={{ cursor: "pointer" }}>{l}</span>)}</div>
      </div>
    </div>
  );
}