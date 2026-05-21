import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePatientData } from "../../hooks/usePatientData";
import { useNotifications } from "../../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import "./PatientDashboard.css";
import "leaflet/dist/leaflet.css";
import { PatientIcons } from "../../constants/patientIcons";

import { MedicalHistoryPage } from "./MedicalHistoryPage";
import { DocumentsPage } from "./DocumentsPage";
import { PreferencesPage } from "./PreferencesPage";
import  PrescriptionsPage  from "./PrescriptionsPage";
import  RemindersPage  from "./RemindersPage";
import  UpcomingCallsPage  from "./UpcomingCallsPage";
import { CallHistoryPage } from "./CallHistoryPage";
import { ResultsPage } from "./ResultsPage";
import { ResultDetailPage } from "./ResultDetailPage";
import { HealthEvolutionPage } from "./HealthEvolutionPage";
import { ConsultationRequest } from "../ConsultationRequest";
import { ConsultationRoom } from "../ConsultationRoom";
import { MessagesPage } from "./MessagesPage";
import CriticalNotificationOverlay from "../../components/CriticalNotificationOverlay";
import { useCriticalNotifications } from "../../hooks/useCriticalNotifications";
import "../../components/CriticalNotificationOverlay.css";

// ═══════════════════════════════════════
// DYNAMIC LEAFLET IMPORT
// ═══════════════════════════════════════
let L = null;
const getLeaflet = async () => {
  if (L) return L;
  const mod = await import("leaflet");
  L = mod.default || mod;
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  return L;
};

// ═══════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════
const Svg = ({ children, size = 24, color = "currentColor", sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const I = {
  Lungs: p => <Svg {...p}><path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5S7 16 8.5 16M15.5 8c1.8 0 3.5.8 3.5 3.5S17 16 15.5 16M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/></Svg>,
  Brain: p => <Svg {...p}><path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 1.4-.8 2.5-1.8 3.2v2.3a1.8 1.8 0 0 1-3.4 0v-2.3c-1-.7-1.8-1.8-1.8-3.2A3.5 3.5 0 0 1 12 5zM12 5v14M8.5 12c-1 .7-1.8 1.8-1.8 3.2a3.5 3.5 0 0 0 7 0c0-1.4-.8-2.5-1.8-3.2"/></Svg>,
  Heart: p => <Svg {...p}><path d="M3 11.5h3l2-5 2 10 2-7.5 2 4 2-6 2 4.5h3"/></Svg>,
  Shield: p => <Svg {...p}><path d="M12 21s7.5-3.6 7.5-9V5.5L12 3 4.5 5.5V12c0 5.4 7.5 9 7.5 9z"/><polyline points="9 11.5 11 13.5 15 9.5"/></Svg>,
  Scan: p => <Svg {...p}><path d="M3.5 7V5.5a2 2 0 0 1 2-2h2M16.5 3.5h2a2 2 0 0 1 2 2V7M20.5 17v1.5a2 2 0 0 1-2 2h-2M7.5 20.5h-2a2 2 0 0 1-2-2V17"/><circle cx="12" cy="12" r="4.5"/></Svg>,
  Clock: p => <Svg {...p}><circle cx="12" cy="12" r="9.5"/><polyline points="12 6.5 12 12 15.5 14"/></Svg>,
  Upload: p => <Svg {...p}><path d="M20.5 14.5v3.8a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8v-3.8"/><polyline points="16.5 8 12 3.5 7.5 8"/><line x1="12" y1="3.5" x2="12" y2="14.5"/></Svg>,
  Folder: p => <Svg {...p}><path d="M21.5 18.5a1.8 1.8 0 0 1-1.8 1.8H4.3a1.8 1.8 0 0 1-1.8-1.8V5.5a1.8 1.8 0 0 1 1.8-1.8h5l2 2.8h7.2a1.8 1.8 0 0 1 1.8 1.8z"/></Svg>,
  Message: p => <Svg {...p}><path d="M20.5 14.5a1.8 1.8 0 0 1-1.8 1.8H7.5l-4 3.8V5.5a1.8 1.8 0 0 1 1.8-1.8h13.4a1.8 1.8 0 0 1 1.8 1.8z"/></Svg>,
  Calendar: p => <Svg {...p}><rect x="3.5" y="4.5" width="17" height="16.5" rx="2"/><line x1="16" y1="2.5" x2="16" y2="6.5"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="3.5" y1="10" x2="20.5" y2="10"/></Svg>,
  Activity: p => <Svg {...p}><polyline points="21.5 12 18 12 15.5 20 9.5 4 6.5 12 2.5 12"/></Svg>,
  Bell: p => <Svg {...p}><path d="M17.5 8A5.5 5.5 0 0 0 6.5 8c0 6.5-2.8 8.5-2.8 8.5h16.6s-2.8-2-2.8-8.5M13.2 20.5a1.8 1.8 0 0 1-3.4 0"/></Svg>,
  User: p => <Svg {...p}><path d="M19.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H8.1a3.6 3.6 0 0 0-3.6 3.6v1.8"/><circle cx="12" cy="7.5" r="3.6"/></Svg>,
  Map: p => <Svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Svg>,
  Navigation: p => <Svg {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></Svg>,
  Phone: p => <Svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
  Star: p => <Svg {...p}><polygon points="12 2.5 15.1 8.8 22 9.8 17 14.6 18.2 21.5 12 18.3 5.8 21.5 7 14.6 2 9.8 8.9 8.8"/></Svg>,
  Check: p => <Svg {...p}><circle cx="12" cy="12" r="9.5"/><polyline points="8 12 10.5 14.5 16 9"/></Svg>,
  Search: p => <Svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Svg>,
  Hospital: p => <Svg {...p}><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM12 8v8M8 12h8"/></Svg>,
  ChevronRight: p => <Svg {...p} sw={2.5}><polyline points="9 18 15 12 9 6"/></Svg>,
  ChevronLeft: p => <Svg {...p} sw={2.5}><polyline points="15 18 9 12 15 6"/></Svg>,
  X: p => <Svg {...p} sw={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  Sparkles: p => <Svg {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z"/></Svg>,
  Video: p => <Svg {...p}><rect x="2" y="5" width="14" height="14" rx="2"/><polyline points="16 9 22 5 22 19 16 15"/></Svg>,
  Camera: p => <Svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Svg>,
  CalendarCheck: p => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="16 16 12 12 8 16"/></Svg>,
  FileText: p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Svg>,
  LogOut: p => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>,
  AlertTriangle: p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
  Loader: p => <Svg {...p}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></Svg>,
};

// ═══════════════════════════════════════
// TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════════
const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: "#10B981", icon: <I.Check size={16} color="white" /> },
    error: { bg: "#EF4444", icon: <I.AlertTriangle size={16} color="white" /> },
    warning: { bg: "#F59E0B", icon: <I.Bell size={16} color="white" /> },
    info: { bg: "#3B82F6", icon: <I.Activity size={16} color="white" /> },
  };

  const cfg = colors[type] || colors.success;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -50, x: "-50%" }}
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        zIndex: 9999,
        background: cfg.bg,
        color: "white",
        padding: "12px 24px",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: "0.85rem",
        fontWeight: 600,
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        minWidth: 280,
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {cfg.icon}
        {message}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 0 }}>
        <I.X size={14} />
      </button>
    </motion.div>
  );
};

// ═══════════════════════════════════════
// SKELETON LOADER COMPONENTS
// ═══════════════════════════════════════
const SkeletonCard = () => (
  <div style={{
    background: "var(--card)",
    borderRadius: 16,
    padding: 20,
    border: "1px solid var(--border)",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--border)" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 16, width: "60%", background: "var(--border)", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 12, width: "40%", background: "var(--border)", borderRadius: 4 }} />
      </div>
    </div>
  </div>
);

const SkeletonMetric = () => (
  <div style={{
    background: "var(--card)",
    borderRadius: 16,
    padding: 24,
    border: "1px solid var(--border)",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--border)", marginBottom: 12 }} />
    <div style={{ height: 28, width: "50%", background: "var(--border)", borderRadius: 6, marginBottom: 8 }} />
    <div style={{ height: 14, width: "70%", background: "var(--border)", borderRadius: 4 }} />
  </div>
);

// ═══════════════════════════════════════
// LOGOUT MODAL
// ═══════════════════════════════════════
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            background: "var(--card)",
            borderRadius: 20,
            padding: 32,
            maxWidth: 400,
            width: "90%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            border: "1px solid var(--border)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(239,68,68,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}>
            <I.LogOut size={28} color="#EF4444" />
          </div>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--navy)",
            marginBottom: 8,
          }}>
            Déconnexion
          </h3>
          <p style={{
            fontSize: "0.9rem",
            color: "var(--txt2)",
            marginBottom: 24,
            lineHeight: 1.5,
          }}>
            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre espace patient.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 12,
                border: "1.5px solid var(--border)",
                background: "transparent",
                color: "var(--txt)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "#EF4444",
                color: "white",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
              }}
            >
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const CITY_COORDS = {
  "Tunis": [36.8065, 10.1815], "Sfax": [34.7398, 10.7600], "Sousse": [35.8254, 10.6369],
  "Ariana": [36.8625, 10.1956], "Bizerte": [37.2744, 9.8739], "Monastir": [35.7643, 10.8113],
  "Nabeul": [36.4561, 10.7376], "Ben Arous": [36.7533, 10.2282], "Kairouan": [35.6781, 10.0963],
  "Gabès": [33.8815, 10.0982], "Mahdia": [35.5047, 11.0622], "Gafsa": [34.4250, 8.7842],
  "Manouba": [36.8101, 10.0956], "Kasserine": [35.1676, 8.8365], "Médenine": [33.3540, 10.5055],
  "La Marsa": [36.8783, 10.3247], "Carthage": [36.8530, 10.3220], "Radès": [36.7033, 10.2333],
};

const DOCTOR_COLORS = {
  "Cardiologue": "#EF4444", "Infectiologue": "#F59E0B", "Radiologue": "#3B82F6",
  "Neurologue": "#8B5CF6", "Neurochirurgien": "#6B4FA0", "Pneumologue": "#10B981",
  "Oncologue": "#EC4899", "Carcinologue": "#F43F5E", "Chirurgie carcinologique": "#E11D48",
};

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
};

// ═══════════════════════════════════════
// LEAFLET MAP COMPONENT
// ═══════════════════════════════════════
const MapView = ({ doctors, userLocation, selectedDoctorId, onDoctorSelect , nearestDoctorId }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialisation de la carte - CORRIGÉE
  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted || !containerRef.current) return;
        
        const leaflet = await getLeaflet();
        
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        
        const center = userLocation ? [userLocation.lat, userLocation.lng] : [36.8065, 10.1815];
        
        const map = leaflet.map(containerRef.current, {
          center: center,
          zoom: userLocation ? 12 : 8,
          zoomControl: false,
          attributionControl: true
        });
        
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          minZoom: 6,
          errorTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }).addTo(map);
        
        map.on('tileerror', function(error) {
          console.warn('Tile error:', error);
        });
        
        mapRef.current = map;
        setMapLoaded(true);
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 200);
        
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 500);
        
      } catch (error) {
        console.error("Erreur d'initialisation:", error);
      }
    };
    
    initMap();
    
    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Mise à jour des marqueurs
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    const updateMarkers = async () => {
      const leaflet = await getLeaflet();
      const map = mapRef.current;
      if (!map) return;

      Object.values(markersRef.current).forEach(m => {
        if (map.hasLayer(m)) map.removeLayer(m);
      });
      markersRef.current = {};
      
      if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      const createDoctorIcon = (color, isNearest = false) => {
        if (isNearest) {
          return leaflet.divIcon({
            html: `<div style="
              width: 36px;
              height: 36px;
              background: #10B981;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 0 0 3px rgba(16,185,129,0.4), 0 2px 6px rgba(0,0,0,0.3);
              cursor: pointer;
              animation: pulse-green 1.5s infinite;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
              "></div>
            </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -30],
            className: 'doctor-marker nearest-marker'
          });
        }
        return leaflet.divIcon({
          html: `<div style="
            width: 28px;
            height: 28px;
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(45deg);
            "></div>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -25],
          className: 'doctor-marker'
        });
      };

      doctors.forEach((doc, idx) => {
        const coords = CITY_COORDS[doc.ville];
        if (!coords) return;
        
        const lat = coords[0] + (idx % 5 - 2) * 0.003;
        const lng = coords[1] + (idx % 5 - 2) * 0.003;
        const color = DOCTOR_COLORS[doc.specialite] || "#D4A500";
        const isNearest = nearestDoctorId && doc.id === nearestDoctorId;

        const marker = leaflet.marker([lat, lng], { icon: createDoctorIcon(color, isNearest) });
        
        
        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; min-width: 180px; padding: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #0A1628;">${doc.name}</div>
            <div style="color: ${color}; font-size: 11px; font-weight: 600; margin: 4px 0;">${doc.specialite}</div>
            <div style="font-size: 10px; color: #64748B;">📍 ${doc.ville}</div>
            ${doc.distance ? `<div style="font-size: 10px; color: #10B981; font-weight: 700; margin-top: 4px;">📏 ${doc.distance} km</div>` : ''}
            ${doc.phones?.[0] ? `<div style="font-size: 10px; color: #64748B; margin-top: 4px;">📞 ${doc.phones[0]}</div>` : ''}
          </div>
        `, { maxWidth: 220 });
        
        marker.on('click', () => onDoctorSelect(doc));
        marker.addTo(map);
        markersRef.current[doc.id] = marker;
      });

      if (userLocation) {
        const userIcon = leaflet.divIcon({
          html: `<div style="
            width: 16px;
            height: 16px;
            background: #3B82F6;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          popupAnchor: [0, -10]
        });
        
        userMarkerRef.current = leaflet.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
        userMarkerRef.current.bindPopup('<b style="color:#3B82F6;">📍 Votre position</b>');
        userMarkerRef.current.addTo(map);
        
        if (!mapRef.current._initialCentered) {
          mapRef.current.setView([userLocation.lat, userLocation.lng], 12);
          mapRef.current._initialCentered = true;
        }
      }
      
      if (doctors.length > 0 && !userLocation && mapRef.current) {
        const bounds = [];
        doctors.forEach(doc => {
          const coords = CITY_COORDS[doc.ville];
          if (coords) bounds.push(coords);
        });
        if (bounds.length > 0) {
          const group = leaflet.featureGroup(bounds.map(c => leaflet.marker(c)));
          mapRef.current.fitBounds(group.getBounds(), { padding: [40, 40] });
        }
      }
    };
    
    updateMarkers();
  }, [doctors, userLocation, onDoctorSelect, mapLoaded, nearestDoctorId]);

  // Voler vers médecin sélectionné
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !selectedDoctorId) return;
    const doc = doctors.find(d => d.id === selectedDoctorId);
    if (!doc || !doc.ville) return;
    
    const coords = CITY_COORDS[doc.ville];
    if (!coords) return;
    
    const idx = doctors.findIndex(d => d.id === selectedDoctorId);
    const lat = coords[0] + (idx % 5 - 2) * 0.003;
    const lng = coords[1] + (idx % 5 - 2) * 0.003;
    
    mapRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
    
    setTimeout(() => {
      const marker = markersRef.current[selectedDoctorId];
      if (marker) marker.openPopup();
    }, 1300);
  }, [selectedDoctorId, doctors, mapLoaded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 450, background: "#E8ECF2" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", background: "#E8ECF2", zIndex: 1 }} />
      
      {!mapLoaded && (
        <div style={{ 
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#E8ECF2", zIndex: 2
        }}>
          <div className="pd3-api-spinner" />
          <span style={{ marginLeft: 12, color: "#64748B" }}>Chargement de la carte...</span>
        </div>
      )}
      
      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 6 }}>
        <button type="button" onClick={() => mapRef.current?.zoomIn()} style={zoomBtn}>+</button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} style={zoomBtn}>−</button>
        {userLocation && (
          <button type="button" onClick={() => mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 13)} style={{...zoomBtn, background: "#3B82F6", color: "white" }}>
            <I.Navigation size={16} color="white" />
          </button>
        )}
      </div>
      
      <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 1000, background: "white", borderRadius: 8, padding: "6px 12px", fontSize: "0.65rem", display: "flex", gap: 10, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50% 50% 50% 0", background: "#D4A500", transform: "rotate(-45deg)" }} />
          <span>Médecin</span>
        </div>
        {userLocation && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3B82F6", border: "2px solid white" }} />
            <span>Vous</span>
          </div>
        )}
      </div>
      
      <style>{`
        .doctor-marker {
          transition: transform 0.2s;
        }
        .doctor-marker:hover {
          transform: scale(1.2);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
        }
        .leaflet-popup-content {
          margin: 10px 14px !important;
        }
      `}</style>
    </div>
  );
};

const zoomBtn = {
  width: 32, height: 32, borderRadius: 8, background: "white", border: "1px solid #E2E8F0",
  cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center",
  justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
};

// ═══════════════════════════════════════
// COMPOSANT BOUTON APPEL VIDÉO POUR PATIENT (AVEC MINUTEUR 20 MIN)
// ═══════════════════════════════════════
const PatientVideoCallButton = ({ consultationId, consultationStatus, consultation }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  
  const fetchAppointment = async () => {
    const token = localStorage.getItem("medai-token");
    if (!token || !consultationId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/v1/consultations/${consultationId}/appointment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointment(data.appointment);
        
        // Calculer le temps restant pour accepter (20 minutes)
        if (data.appointment && data.appointment.status === "pending" && data.appointment.created_at) {
          const created = new Date(data.appointment.created_at);
          const expiresAt = new Date(created.getTime() + 20 * 60 * 1000);
          const now = new Date();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(remaining);
        }
      }
    } catch (err) {
      console.error("Erreur vérification rendez-vous:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAppointment();
  }, [consultationId]);
  
  // Minuteur pour mise à jour du temps restant
  useEffect(() => {
    if (!appointment || appointment.status !== "pending") return;
    
    const interval = setInterval(() => {
      if (appointment.created_at) {
        const created = new Date(appointment.created_at);
        const expiresAt = new Date(created.getTime() + 20 * 60 * 1000);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeft(remaining);
        
        // Si le temps est écoulé, recharger
        if (remaining === 0) {
          fetchAppointment();
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [appointment]);
  
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const acceptAppointment = async () => {
    setIsAccepting(true);
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/consultations/appointments/${appointment.id}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Toast au lieu de alert
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Rendez-vous accepté avec succès !", type: "success" } }));
        fetchAppointment();
      } else {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur lors de l'acceptation", type: "error" } }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur réseau", type: "error" } }));
    } finally {
      setIsAccepting(false);
    }
  };
  
  const rejectAppointment = async () => {
    setIsRejecting(true);
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/consultations/appointments/${appointment.id}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Rendez-vous refusé", type: "warning" } }));
        fetchAppointment();
      } else {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur lors du refus", type: "error" } }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur réseau", type: "error" } }));
    } finally {
      setIsRejecting(false);
    }
  };
  
  if (loading || !appointment) return null;
  
  // Afficher uniquement pour les rendez-vous en attente
  if (appointment.status !== "pending") return null;
  
  const aptDate = new Date(appointment.scheduled_at);
  const isExpired = timeLeft === 0;
  
  return (
    <div style={{
      marginTop: 8,
      padding: "12px",
      background: "rgba(245,158,11,0.08)",
      borderRadius: 10,
      border: "1px solid rgba(245,158,11,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.7rem", color: "#F59E0B" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span style={{ fontWeight: 600 }}>En attente de votre confirmation</span>
        </div>
        {timeLeft > 0 && !isExpired && (
          <div style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: timeLeft < 300 ? "#EF4444" : "#F59E0B",
            background: "rgba(0,0,0,0.2)",
            padding: "2px 8px",
            borderRadius: 20,
          }}>
            ⏱️ {formatTimeLeft(timeLeft)}
          </div>
        )}
      </div>
      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
        {aptDate.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
      </div>
      {!isExpired ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={acceptAppointment}
            disabled={isAccepting}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "#10B981",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isAccepting ? "..." : "✓ Accepter"}
          </button>
          <button
            type="button"
            onClick={rejectAppointment}
            disabled={isRejecting}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "#EF4444",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRejecting ? "..." : "✗ Refuser"}
          </button>
        </div>
      ) : (
        <div style={{
          padding: "8px 12px",
          background: "rgba(239,68,68,0.2)",
          borderRadius: 8,
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#EF4444",
        }}>
          Temps écoulé - rendez-vous expiré
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// COMPOSANT AFFICHAGE RENDEZ-VOUS
// ═══════════════════════════════════════
const AppointmentInfo = ({ consultationId }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      const token = localStorage.getItem("medai-token");
      if (!token || !consultationId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/api/v1/consultations/${consultationId}/appointment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAppointment(data.appointment);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [consultationId]);

  if (loading || !appointment) return null;

  const appointmentDate = appointment?.scheduled_at ? new Date(appointment.scheduled_at) : null;
  const now = new Date();
  const isAppointmentTime = appointmentDate && appointmentDate <= now;
  // Le rendez-vous est valide pendant 30 minutes après l'heure prévue
  const isWithinWindow = appointmentDate && (now - appointmentDate) <= 30 * 60 * 1000;
  const isExpired = appointmentDate && (now - appointmentDate) > 30 * 60 * 1000;

const canJoin = canVideoCall && isAppointmentAccepted && isAppointmentTime && isWithinWindow && !isExpired;

  return (
    <div style={{
      marginTop: 8,
      padding: "8px 12px",
      background: "rgba(16,185,129,0.08)",
      borderRadius: 10,
      border: "1px solid rgba(16,185,129,0.15)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.7rem", color: "#10B981" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontWeight: 600 }}>
          {isUpcoming ? "Rendez-vous prevu" : isToday ? "Rendez-vous aujourd'hui" : "Rendez-vous passe"}
        </span>
      </div>
      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
        {appointmentDate.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
      </div>
      {appointment.notes && (
        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          Note: {appointment.notes}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// COMPOSANT LISTE DES RENDEZ-VOUS - AVEC ACCEPTATION
// ═══════════════════════════════════════
const AppointmentsList = ({ appointments, loading, onRefresh }) => {
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const acceptAppointment = async (appointmentId) => {
    setAcceptingId(appointmentId);
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/consultations/appointments/${appointmentId}/accept`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Rendez-vous accepté !", type: "success" } }));
        onRefresh();
      } else {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur lors de l'acceptation", type: "error" } }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur réseau", type: "error" } }));
    } finally {
      setAcceptingId(null);
    }
  };

  const rejectAppointment = async (appointmentId) => {
    setRejectingId(appointmentId);
    const token = localStorage.getItem("medai-token");
    try {
      const res = await fetch(`http://localhost:8000/api/v1/consultations/appointments/${appointmentId}/reject`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Rendez-vous refusé", type: "warning" } }));
        onRefresh();
      } else {
        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur lors du refus", type: "error" } }));
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Erreur réseau", type: "error" } }));
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="pd3-empty">
        <div className="pd3-empty-icon"><I.Calendar size={32} color="#D4A500"/></div>
        <div className="pd3-empty-title">Aucun rendez-vous</div>
        <div className="pd3-empty-desc">Vous n'avez aucun rendez-vous programmé pour le moment.</div>
        <button className="pd3-btn pd3-btn-gold pd3-btn-sm" onClick={() => window.location.href = "/patient/consultation/new"}>
          <I.Upload size={14}/> Nouvelle consultation
        </button>
      </div>
    );
  }

  const now = new Date();
  const pendingAppointments = appointments.filter(a => {
    if (!a.scheduled_at) return false;
    return a.status === "pending" && new Date(a.scheduled_at) >= now;
  });
  
  const upcomingAppointments = appointments.filter(a => {
    if (!a.scheduled_at) return false;
    return a.status === "accepted" && new Date(a.scheduled_at) >= now;
  }).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  
  const pastAppointments = appointments.filter(a => {
    if (!a.scheduled_at) return false;
    return new Date(a.scheduled_at) < now || a.status === "cancelled" || a.status === "rejected";
  }).sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  const joinVideoCall = (consultationId) => {
    window.open(`/video-consultation/${consultationId}?room=medai-${consultationId}`, "_blank");
  };

  const getSpecialtyLabel = (modelKey) => {
    const labels = {
      chest: "Radiologie thoracique",
      brain: "Neurologie",
      lung: "Pneumologie",
      retina: "Ophtalmologie"
    };
    return labels[modelKey] || "Consultation médicale";
  };

  return (
    <div>
      {/* Rendez-vous en attente de confirmation */}
      {pendingAppointments.length > 0 && (
        <>
          <div className="pd3-section-row" style={{ marginTop: 16 }}>
            <span className="pd3-section-row-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              En attente de confirmation
            </span>
          </div>
          {pendingAppointments.map(apt => {
            const aptDate = new Date(apt.scheduled_at);
            const isToday = aptDate.toDateString() === now.toDateString();
            
            return (
              <motion.div
                key={apt.id}
                className="pd3-appt-card"
                whileHover={{ x: 4 }}
                style={{ 
                  cursor: "default",
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A"
                }}
              >
                <div className="pd3-appt-avatar" style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#fff"
                }}>
                  {apt.doctor_name ? apt.doctor_name.charAt(0) : "D"}
                </div>
                <div className="pd3-appt-info">
                  <div className="pd3-appt-name">{apt.doctor_name ? `Dr. ${apt.doctor_name}` : "Médecin"}</div>
                  <div className="pd3-appt-specialty">{getSpecialtyLabel(apt.model_key)}</div>
                  <div style={{ fontSize: "0.65rem", color: "#F59E0B", marginTop: 4 }}>
                    En attente de votre confirmation
                  </div>
                </div>
                <div className="pd3-appt-time-block">
                  <div className="pd3-appt-date">
                    {aptDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                  <div className="pd3-appt-time">
                    {aptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {isToday && (
                    <div className="pd3-appt-time" style={{ color: "#F59E0B", fontSize: "0.65rem" }}>Aujourd'hui</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="pd3-appt-action"
                    onClick={() => acceptAppointment(apt.id)}
                    disabled={acceptingId === apt.id}
                    style={{ background: "#10B981", color: "white", border: "none" }}
                  >
                    {acceptingId === apt.id ? "..." : "✓ Accepter"}
                  </button>
                  <button
                    type="button"
                    className="pd3-appt-action"
                    onClick={() => rejectAppointment(apt.id)}
                    disabled={rejectingId === apt.id}
                    style={{ background: "#EF4444", color: "white", border: "none" }}
                  >
                    {rejectingId === apt.id ? "..." : "✗ Refuser"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </>
      )}

      {/* Rendez-vous acceptés à venir */}
      {upcomingAppointments.length > 0 && (
        <>
          <div className="pd3-section-row" style={{ marginTop: pendingAppointments.length > 0 ? 24 : 16 }}>
            <span className="pd3-section-row-title"><I.Calendar size={16} color="#D4A500"/> Prochains rendez-vous</span>
            {onRefresh && (
              <button className="pd3-section-link" onClick={onRefresh}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Rafraîchir
              </button>
            )}
          </div>
          {upcomingAppointments.map(apt => {
            const aptDate = new Date(apt.scheduled_at);
            const isToday = aptDate.toDateString() === now.toDateString();
            const canJoin = apt.type === "video" && aptDate <= now;
            
            return (
              <motion.div
                key={apt.id}
                className="pd3-appt-card"
                whileHover={{ x: 4 }}
                style={{ cursor: "pointer", background: "var(--card)" }}
                onClick={() => window.location.href = `/patient/consultation/${apt.consultation_id}`}
              >
                <div className="pd3-appt-avatar" style={{
                  background: "linear-gradient(135deg, #0A2647, #1B3B6F)",
                  color: "#fff"
                }}>
                  {apt.doctor_name ? apt.doctor_name.charAt(0) : "D"}
                </div>
                <div className="pd3-appt-info">
                  <div className="pd3-appt-name">{apt.doctor_name ? `Dr. ${apt.doctor_name}` : "Médecin"}</div>
                  <div className="pd3-appt-specialty">{getSpecialtyLabel(apt.model_key)}</div>
                </div>
                <div className="pd3-appt-time-block">
                  <div className="pd3-appt-date">
                    {aptDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                  <div className="pd3-appt-time">
                    {aptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {isToday && (
                    <div className="pd3-appt-time" style={{ color: "#10B981", fontSize: "0.65rem" }}>Aujourd'hui</div>
                  )}
                </div>
                {canJoin && (
                  <button
                    type="button"
                    className="pd3-appt-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      joinVideoCall(apt.consultation_id);
                    }}
                    style={{ background: "#10B981", color: "white", border: "none" }}
                  >
                    <I.Video size={12} /> Rejoindre
                  </button>
                )}
              </motion.div>
            );
          })}
        </>
      )}

      {/* Rendez-vous passés */}
      {pastAppointments.length > 0 && (
        <>
          <div className="pd3-section-row" style={{ marginTop: 24 }}>
            <span className="pd3-section-row-title"><I.Clock size={16} color="#6B7280"/> Historique</span>
          </div>
          {pastAppointments.slice(0, 5).map(apt => {
            const aptDate = new Date(apt.scheduled_at);
            const isCancelled = apt.status === "cancelled" || apt.status === "rejected";
            return (
              <motion.div
                key={apt.id}
                className="pd3-appt-card"
                whileHover={{ x: 4 }}
                style={{ cursor: "pointer", opacity: 0.7, background: isCancelled ? "#FEF2F2" : "var(--card)" }}
                onClick={() => window.location.href = `/patient/consultation/${apt.consultation_id}`}
              >
                <div className="pd3-appt-avatar" style={{
                  background: isCancelled ? "rgba(239,68,68,0.15)" : "rgba(100,116,139,0.15)",
                  color: isCancelled ? "#EF4444" : "#64748B"
                }}>
                  {apt.doctor_name ? apt.doctor_name.charAt(0) : "D"}
                </div>
                <div className="pd3-appt-info">
                  <div className="pd3-appt-name">{apt.doctor_name ? `Dr. ${apt.doctor_name}` : "Médecin"}</div>
                  <div className="pd3-appt-specialty">{getSpecialtyLabel(apt.model_key)}</div>
                  {isCancelled && <div style={{ fontSize: "0.65rem", color: "#EF4444" }}>Annulé</div>}
                </div>
                <div className="pd3-appt-time-block">
                  <div className="pd3-appt-date">{aptDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</div>
                  <div className="pd3-appt-time">{aptDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <I.ChevronRight size={16} color="#64748B" />
              </motion.div>
            );
          })}
          {pastAppointments.length > 5 && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <span style={{ fontSize: "0.7rem", color: "#64748B" }}>+ {pastAppointments.length - 5} autres rendez-vous</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════
const Particles = () => {
  const p = useMemo(() => Array.from({length:35}, (_,i) => ({ id:i, left:`${Math.random()*100}%`, w:`${Math.random()*3+1}px`, h:`${Math.random()*3+1}px`, dur:`${Math.random()*14+8}s`, delay:`${Math.random()*10}s`, bottom:`-${Math.random()*40}px`, glow:i%5===0 })), []);
  return <div className="pd3-hero-particles">{p.map(x => <div key={x.id} className="pd3-particle" style={{left:x.left,width:x.w,height:x.h,animationDuration:x.dur,animationDelay:x.delay,bottom:x.bottom,boxShadow:x.glow?'0 0 10px rgba(255,215,0,0.6)':'none'}} />)}</div>;
};

const Reveal = ({ children, delay=0 }) => (
  <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-50px"}} transition={{duration:.65,delay,ease:[.22,.61,.36,1]}}>{children}</motion.div>
);

const Counter = ({ value, suffix="", duration=1500 }) => {
  const [c,setC]=useState(0); const [vis,setVis]=useState(false); const ref=useRef(null);
  useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting)setVis(true)},{threshold:.3});if(ref.current)o.observe(ref.current);return ()=>o.disconnect()},[]);
  useEffect(()=>{if(!vis)return;let s=0;const inc=value/(duration/16);const t=setInterval(()=>{s+=inc;if(s>=value){setC(value);clearInterval(t)}else setC(Math.floor(s))},16);return ()=>clearInterval(t)},[vis,value,duration]);
  return <span ref={ref} className="pd3-platform-value">{c}{suffix}</span>;
};

const HealthRing = ({ score=86 }) => {
  const r=42, circ=2*Math.PI*r, off=circ-(score/100)*circ;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{transform:"rotate(-90deg)"}}>
      <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#E8B830"/><stop offset="50%" stopColor="#FFD700"/><stop offset="100%" stopColor="#D4A020"/></linearGradient><filter id="hgf"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
      <motion.circle cx="50" cy="50" r={r} fill="none" stroke="url(#hg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:off}} transition={{duration:1.5,delay:.5,ease:"easeOut"}} filter="url(#hgf)"/>
    </svg>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = { pending:{l:"En attente",c:"pd3-badge-pending"}, accepted:{l:"En cours",c:"pd3-badge-accepted"}, analyzed:{l:"Résultats",c:"pd3-badge-analyzed"}, closed:{l:"Terminé",c:"pd3-badge-closed"} };
  const {l,c} = cfg[status] || cfg.pending;
  return <span className={`pd3-badge ${c}`}>● {l}</span>;
};

const ConsultationCard = ({ consultation, onClick }) => {
  const cfg = { 
    chest: { color: "#2D5F9E", bg: "rgba(45,95,158,0.08)", icon: <I.Lungs size={22} /> }, 
    brain: { color: "#6B4FA0", bg: "rgba(107,79,160,0.08)", icon: <I.Brain size={22} /> }, 
    lung: { color: "#D4A500", bg: "rgba(212,165,0,0.08)", icon: <I.Scan size={22} /> } 
  };
  const c = cfg[consultation.model_key] || { color: "#64748B", bg: "rgba(100,116,139,0.08)", icon: <I.Folder size={22} /> };
  const fd = new Date(consultation.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  
  const canVideoCall = consultation.status === "accepted" || consultation.status === "analyzed";
  
  // État pour le rendez-vous
  const [appointment, setAppointment] = useState(null);
  const [loadingAppointment, setLoadingAppointment] = useState(true);
  
  useEffect(() => {
    const checkAppointment = async () => {
      const token = localStorage.getItem("medai-token");
      if (!token || !consultation.id) {
        setLoadingAppointment(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/api/v1/consultations/${consultation.id}/appointment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAppointment(data.appointment);
        }
      } catch (err) {
        console.error("Erreur vérification rendez-vous:", err);
      } finally {
        setLoadingAppointment(false);
      }
    };
    checkAppointment();
  }, [consultation.id]);
  
  // Vérifier si le rendez-vous est accepté et à l'heure
  const isAppointmentAccepted = appointment?.status === "accepted";
  const isAppointmentPending = appointment?.status === "pending";
  
  // === CORRECTION : Calcul de la date et de l'expiration ===
  const appointmentDate = appointment?.scheduled_at ? new Date(appointment.scheduled_at) : null;
  const now = new Date();
  const isAppointmentTime = appointmentDate && appointmentDate <= now;
  // Le rendez-vous est valide pendant 30 minutes après l'heure prévue
  const isWithinWindow = appointmentDate && (now - appointmentDate) <= 30 * 60 * 1000;
  const isExpired = appointmentDate && (now - appointmentDate) > 30 * 60 * 1000;
  // =========================================================
  
  const canJoin = canVideoCall && isAppointmentAccepted && isAppointmentTime && isWithinWindow && !isExpired;
  
  const joinVideoCall = (e) => {
    e.stopPropagation();
    if (canJoin) {
      window.open(`/video-consultation/${consultation.id}?room=medai-${consultation.id}`, "_blank");
    }
  };

  return (
    <motion.div 
      className="pd3-consult-card" 
      style={{ "--accent-color": c.color, cursor: "pointer", flexDirection: "column", alignItems: "stretch" }} 
      onClick={onClick} 
      whileHover={{ x: 6 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="pd3-consult-card-accent" />
        <div className="pd3-consult-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
        <div className="pd3-consult-body">
          <div className="pd3-consult-header">
            <span className="pd3-consult-id">Dossier #{consultation.id}</span>
            <StatusBadge status={consultation.status} />
          </div>
          <div className="pd3-consult-date">{fd}</div>
          <div className="pd3-consult-doctor">{consultation.doctor_name ? `Dr. ${consultation.doctor_name}` : "En attente"}</div>
          {consultation.prediction && <div className="pd3-prediction">{consultation.prediction}</div>}
        </div>
        <I.ChevronRight size={18} />
      </div>
      
      {/* Bouton Rejoindre - visible uniquement si rendez-vous accepté, heure atteinte, et NON expiré */}
      {canJoin && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={joinVideoCall}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: "linear-gradient(135deg, #059669, #10B981)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="14" height="14" rx="2"/>
              <polyline points="16 9 22 5 22 19 16 15"/>
            </svg>
            Rejoindre l'appel vidéo
          </button>
        </div>
      )}
      
      {/* Message si rendez-vous expiré */}
      {isExpired && (
        <div style={{
          marginTop: 8,
          padding: "8px 12px",
          background: "rgba(239,68,68,0.08)",
          borderRadius: 10,
          border: "1px solid rgba(239,68,68,0.15)",
        }}>
          <div style={{ fontSize: "0.7rem", color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Rendez-vous expiré — Le créneau est passé
          </div>
        </div>
      )}
      
      {/* Afficher les infos de rendez-vous uniquement si consultation acceptée et rendez-vous existe */}
      {canVideoCall && !loadingAppointment && appointment && (
        <>
          {/* Si rendez-vous en attente - afficher le minuteur */}
          {isAppointmentPending && (
            <PatientVideoCallButton 
              consultationId={consultation.id} 
              consultationStatus={consultation.status}
              consultation={consultation}
            />
          )}
          
          {/* Si rendez-vous accepté - afficher les infos */}
          {isAppointmentAccepted && !isExpired && (
            <div style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(16,185,129,0.08)",
              borderRadius: 10,
              border: "1px solid rgba(16,185,129,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.7rem", color: "#10B981" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span style={{ fontWeight: 600 }}>
                  {isAppointmentTime ? "Rendez-vous disponible maintenant" : "Rendez-vous accepté"}
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {new Date(appointment.scheduled_at).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          )}
          
          {/* Si rendez-vous refusé ou annulé */}
          {(appointment.status === "rejected" || appointment.status === "cancelled") && (
            <div style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(239,68,68,0.08)",
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.15)",
            }}>
              <div style={{ fontSize: "0.7rem", color: "#EF4444" }}>
                Rendez-vous {appointment.status === "rejected" ? "refusé" : "expiré ou annulé"}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const DoctorCardAPI = ({ doctor, distance, onClick, isNearest }) => {
  const color = DOCTOR_COLORS[doctor.specialite] || "#64748B";
  const initials = (doctor.name||"").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase();
  return (
    <motion.div 
      className="pd3-doctor-card-api" 
      style={{
        "--accent-color": color,
        border: isNearest ? "2px solid #10B981" : "1px solid var(--border)",
        background: isNearest ? "linear-gradient(145deg, #FFFFFF, #F0FDF4)" : "var(--card)",
        position: "relative",
      }} 
      onClick={onClick} 
      whileHover={{y:-4}}
    >
      {isNearest && (
        <div style={{
          position: "absolute",
          top: -10,
          left: 20,
          background: "#10B981",
          color: "white",
          fontSize: "0.6rem",
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          gap: 4,
          boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
          zIndex: 5,
        }}>
          <I.Navigation size={10} color="white" /> Plus proche
        </div>
      )}
      
      {distance !== null && <span className="pd3-doctor-badge-distance"><I.Navigation size={11}/> {distance} km</span>}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        <div className="pd3-doctor-avatar-large" style={{
          background: isNearest ? "#10B98118" : `${color}18`,
          color: isNearest ? "#10B981" : color,
          border: isNearest ? "2px solid #10B981" : `1px solid ${color}30`,
        }}>{initials}</div>
        <div>
          <div style={{
            fontWeight: 700,
            fontSize: "0.92rem",
            color: "var(--navy)",
            marginBottom: 3,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap"
          }}>
            {doctor.name}
            {isNearest && (
              <span style={{
                background: "#10B981",
                color: "white",
                fontSize: "0.6rem",
                padding: "2px 8px",
                borderRadius: 12,
                fontWeight: 600,
              }}>
                Plus proche
              </span>
            )}
          </div>
          <div style={{fontSize:"0.78rem",color,fontWeight:600}}>{doctor.specialite}</div>
        </div>
      </div>
      <div style={{fontSize:"0.75rem",color:"var(--txt2)",lineHeight:1.6}}>
        {doctor.address && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><I.Hospital size={13} color="var(--txt3)"/> {doctor.address}</div>}
        {doctor.ville && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><I.Map size={13} color="var(--txt3)"/> {doctor.ville}</div>}
        {doctor.phones?.[0] && <div style={{display:"flex",alignItems:"center",gap:6}}><I.Phone size={13} color="var(--txt3)"/> {doctor.phones[0]}</div>}
      </div>
    </motion.div>
  );
};

const NotificationItem = ({ notification, onRead }) => {
  const colors = { new_consultation:"#3B82F6", consultation_accepted:"#10B981", analysis_ready:"#D4A500", appointment_scheduled:"#6B4FA0", new_message:"#3B82F6", consultation_closed:"#64748B" };
  const color = colors[notification.type] || "#3B82F6";
  const diff = Math.floor((Date.now() - new Date(notification.created_at).getTime()) / 60000);
  const ago = diff < 1 ? "À l'instant" : diff < 60 ? `Il y a ${diff} min` : diff < 1440 ? `Il y a ${Math.floor(diff/60)}h` : `Il y a ${Math.floor(diff/1440)}j`;
  return (
    <div className={`pd3-notif-item ${!notification.is_read?"unread":""}`} onClick={()=>onRead?.(notification.id)}>
      <div className="pd3-notif-item-icon" style={{background:`${color}14`,color}}><I.Bell size={16}/></div>
      <div className="pd3-notif-item-content"><div className="pd3-notif-item-title">{notification.title}</div><div className="pd3-notif-item-msg">{notification.message}</div><div className="pd3-notif-item-time">{ago}</div></div>
      {!notification.is_read && <div className="pd3-notif-item-dot"/>}
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN COMPONENT - SANS RAFRAÎCHISSEMENT AUTOMATIQUE
// ═══════════════════════════════════════
export default function PatientDashboard({ initialTab = "overview" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { consultations, stats, loading: cLoading } = usePatientData();
  const { notifications, unreadCount, markAsRead: markNotifRead, markAllAsRead } = useNotifications();
  const { criticalNotifications, refetch: refetchCritical } = useCriticalNotifications("patient");

  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isScrolled, setIsScrolled] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [mapView, setMapView] = useState("map");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toast, setToast] = useState(null);
  const notifRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const sY = useSpring(heroY, { stiffness: 80, damping: 25 });

  // Toast listener
  useEffect(() => {
    const handleToast = (e) => {
      setToast(e.detail);
    };
    window.addEventListener('showToast', handleToast);
    return () => window.removeEventListener('showToast', handleToast);
  }, []);

  const navigateTo = (view, id = null) => {
    setActiveTab(view);
    if (view === "resultats") navigate("/patient/resultats");
    if (view === "resultat_detail") navigate(`/patient/resultats/${id || ""}`);
    if (view === "evolution") navigate("/patient/resultats/evolution");
    if (view === "medical_history") navigate("/patient/profil/medical");
    if (view === "documents") navigate("/patient/profil/documents");
    if (view === "preferences") navigate("/patient/profil/preferences");
    if (view === "prescriptions") navigate("/patient/prescriptions");
    if (view === "rappels") navigate("/patient/rappels");
    if (view === "upcoming_calls") navigate("/patient/teleconsultation/upcoming");
    if (view === "call_history") navigate("/patient/teleconsultation/history");
  };

  const navigateToPage = (page, id = null) => {
    switch(page) {
      case "new_consultation":
        navigate("/patient/consultation/new");
        break;
      case "consultation_detail":
        navigate(`/patient/consultation/${id}`);
        break;
      case "results":
        navigate("/patient/resultats");
        break;
      case "result_detail":
        navigate(`/patient/resultats/${id}`);
        break;
      case "evolution":
        navigate("/patient/resultats/evolution");
        break;
      case "medical_history":
        navigate("/patient/profil/medical");
        break;
      case "documents":
        navigate("/patient/profil/documents");
        break;
      case "preferences":
        navigate("/patient/profil/preferences");
        break;
      case "prescriptions":
        navigate("/patient/prescriptions");
        break;
      case "reminders":
        navigate("/patient/rappels");
        break;
      case "upcoming_calls":
        navigate("/patient/teleconsultation/upcoming");
        break;
      case "call_history":
        navigate("/patient/teleconsultation/history");
        break;
      default:
        break;
    }
  };

  // ── Greeting ──────────────────────────────────────────────
  useEffect(() => { 
    const h = new Date().getHours(); 
    setGreeting(h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"); 
  }, []);
  
  // ── Horloge ────────────────────────────────────────────────
  useEffect(() => { 
    const i = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(i); 
  }, []);
  
  // ── Scroll listener ────────────────────────────────────────
  useEffect(() => { 
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true }); 
    return () => window.removeEventListener("scroll", handleScroll); 
  }, []);

  // ── Fetch appointments ────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    const token = localStorage.getItem("medai-token");
    if (!token) {
      setAppointmentsLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/api/v1/consultations/appointments/my", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      } else {
        const res2 = await fetch("http://localhost:8000/api/v1/consultations/appointments", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res2.ok) {
          const data = await res2.json();
          setAppointments(data.appointments || []);
        }
      }
    } catch (err) {
      console.error("Erreur chargement rendez-vous:", err);
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // ── Fetch doctors ────────────────────────────────────────
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setDoctorsLoading(true);
        const token = localStorage.getItem("medai-token");
        const res = await fetch("http://localhost:8000/api/v1/doctors?limit=100", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) { 
          const data = await res.json(); 
          setDoctors(data.doctors || []); 
        } else { 
          throw new Error("API error"); 
        }
      } catch {
        setDoctors([
          { id:1, name:"Dr. Hichem Charfi", specialite:"Neurologue", ville:"Tunis", address:"Centre Médical, Av. Habib Bourguiba", phones:["+216 71 234 567"] },
          { id:2, name:"Dr. Mohamed Talbi", specialite:"Neurologue", ville:"Tunis", address:"Clinique Ennasr, Rue des Jasmins", phones:["+216 71 345 678"] },
          { id:3, name:"Dr. Riadh Tounsi", specialite:"Neurochirurgien", ville:"Sfax", address:"CHU Habib Bourguiba", phones:["+216 74 456 789"] },
          { id:4, name:"Dr. Tarek Ben Dhiab", specialite:"Chirurgie carcinologique", ville:"Tunis", address:"Institut Salah Azaiez", phones:["+216 71 678 901"] },
          { id:5, name:"Dr. Samir Ben Salah", specialite:"Cardiologue", ville:"Sousse", address:"Hôpital Farhat Hached", phones:["+216 73 890 123"] },
          { id:6, name:"Dr. Amel Bouzid", specialite:"Pneumologue", ville:"Monastir", address:"CHU Fattouma Bourguiba", phones:["+216 73 901 234"] },
          { id:7, name:"Dr. Leila Mansour", specialite:"Infectiologue", ville:"Bizerte", address:"Hôpital Régional", phones:["+216 72 123 456"] },
          { id:8, name:"Dr. Nizar Kallel", specialite:"Oncologue", ville:"Tunis", address:"Clinique Internationale", phones:["+216 71 012 345"] },
          { id:9, name:"Dr. Martine Dupont", specialite:"Radiologue", ville:"Ariana", address:"Centre Imagerie Médicale", phones:["+216 71 789 012"] },
          { id:10, name:"Dr. Khaled Hentati", specialite:"Neurochirurgien", ville:"Sfax", address:"Clinique Ennour", phones:["+216 74 567 890"] },
        ]);
      } finally { 
        setDoctorsLoading(false); 
      }
    };
    fetchDocs();
  }, []);

  // ── Geolocation ──────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Geolocation denied"),
      { timeout: 8000 }
    );
  }, []);

  // ── Computed values ───────────────────────────────────────
  const doctorsWithDistance = useMemo(() => doctors.map(d => {
    let dist = null;
    if (userLocation && d.ville && CITY_COORDS[d.ville]) {
      dist = haversine(userLocation.lat, userLocation.lng, CITY_COORDS[d.ville][0], CITY_COORDS[d.ville][1]);
    }
    return { ...d, distance: dist };
  }), [doctors, userLocation]);

  const filteredDoctors = useMemo(() => {
    let result = doctorsWithDistance;
    if (specialtyFilter !== "all") result = result.filter(d => d.specialite === specialtyFilter);
    if (searchQuery.trim()) { 
      const q = searchQuery.toLowerCase(); 
      result = result.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.specialite.toLowerCase().includes(q) || 
        (d.ville && d.ville.toLowerCase().includes(q)) || 
        (d.address && d.address.toLowerCase().includes(q))
      ); 
    }
    return result.sort((a,b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }, [doctorsWithDistance, searchQuery, specialtyFilter]);

  const nearestDoctor = useMemo(() => {
    if (!userLocation || filteredDoctors.length === 0) return null;
    return filteredDoctors.reduce((nearest, current) => {
      if (!nearest) return current;
      if ((current.distance ?? Infinity) < (nearest.distance ?? Infinity)) return current;
      return nearest;
    }, null);
  }, [filteredDoctors, userLocation]);

  const specialties = useMemo(() => [...new Set(doctors.map(d => d.specialite).filter(Boolean))].sort(), [doctors]);

  const statsData = [
    { icon:I.Folder, label:"Dossiers totaux", value:stats?.total || 0, color:"#D4A500", bg:"rgba(212,165,0,0.08)", trend:{v:12,d:"up"} },
    { icon:I.Clock, label:"En attente", value:stats?.pending || 0, color:"#3B82F6", bg:"rgba(59,130,246,0.08)", trend:{v:5,d:"down"} },
    { icon:I.Scan, label:"Analysés", value:stats?.analyzed || 0, color:"#10B981", bg:"rgba(16,185,129,0.08)", trend:{v:8,d:"up"} },
    { icon:I.Activity, label:"Critiques", value:stats?.critical || 0, color:"#EF4444", bg:"rgba(239,68,68,0.08)", trend:{v:2,d:"neutral"} },
  ];

  const quickActions = [
    { 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, 
      label: "Nouvelle consultation", 
      desc: "Soumettre une imagerie", 
      color: "#D4A500", 
      bg: "rgba(212,165,0,0.08)", 
      action: () => navigate("/patient/consultation/new") 
    },
    { 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>, 
      label: "Mes dossiers", 
      desc: "Historique complet", 
      color: "#3B82F6", 
      bg: "rgba(59,130,246,0.08)", 
      action: () => navigate("/patient/dossiers") 
    },
    { 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, 
      label: "Messages", 
      desc: `${unreadCount} non lu${unreadCount > 1 ? "s" : ""}`, 
      color: "#10B981", 
      bg: "rgba(16,185,129,0.08)", 
      action: () => navigate("/patient/messages") 
    },
    { 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>, 
      label: "Analyse IA", 
      desc: "Voir mes résultats", 
      color: "#8B5CF6", 
      bg: "rgba(139,92,246,0.08)", 
      action: () => navigate("/patient/resultats")
    },
  ];

  const profileLinks = [
    { 
      label: "Mes résultats", 
      desc: "Tous vos diagnostics", 
      path: "/patient/resultats", 
      color: "#D4A500", 
      bg: "rgba(212,165,0,0.08)", 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/><path d="M14 14l2 2 4-4"/></svg> 
    },
    { 
      label: "Ordonnances", 
      desc: "Vos prescriptions", 
      path: "/patient/prescriptions", 
      color: "#10B981", 
      bg: "rgba(16,185,129,0.08)", 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 
    },
    { 
      label: "Rappels", 
      desc: "Gérez vos alertes", 
      path: "/patient/rappels", 
      color: "#8B5CF6", 
      bg: "rgba(139,92,246,0.08)", 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg> 
    },
    { 
      label: "Téléconsultations", 
      desc: "Appels à venir", 
      path: "/patient/teleconsultation/upcoming", 
      color: "#EF4444", 
      bg: "rgba(239,68,68,0.08)", 
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="14" height="14" rx="2"/><polyline points="16 9 22 5 22 19 16 15"/></svg> 
    },
  ];

  const recent = (consultations || []).slice(0, 4);
  const healthTips = [
    { icon:<I.Sparkles size={18}/>, title:"Hydratation optimale", desc:"Buvez 2L d'eau par jour pour optimiser votre fonction pulmonaire." },
    { icon:<I.Activity size={18}/>, title:"Activité régulière", desc:"30 min de marche quotidienne améliore la capacité respiratoire." },
    { icon:<I.Lungs size={18}/>, title:"Prochain contrôle", desc:"Votre bilan radiologique est recommandé dans 3 mois." },
  ];

  const platformStats = [
    { icon:I.Scan, value:50000, suffix:"+", label:"Radiographies analysées" },
    { icon:I.Brain, value:98, suffix:".5%", label:"Précision de détection" },
    { icon:I.Lungs, value:14, suffix:"+", label:"Pathologies couvertes" },
    { icon:I.Shield, value:100, suffix:"%", label:"Données sécurisées" },
  ];

  

  // Handle logout
  const handleLogout = () => {
    logout?.();
    localStorage.removeItem("medai-token");
    localStorage.removeItem("medai-user");
    navigate("/login");
  };

  if (cLoading) {
    return (
      <div className="pd3">
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",flexDirection:"column",gap:20,background:"var(--bg)"}}>
          <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:2,ease:"linear"}}>
            <I.Sparkles size={48} color="#D4A500"/>
          </motion.div>
          <p style={{color:"var(--txt2)",fontWeight:500}}>Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pd3">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogout}
      />

      {/* NAVIGATION - AMÉLIORÉE AVEC BOUTON DÉCONNEXION */}
      <motion.nav className={`pd3-nav ${isScrolled ? "scrolled" : ""}`} initial={{y:-80}} animate={{y:0}} transition={{duration:.5,type:"spring",stiffness:100}}>
        <div className="pd3-nav-brand" onClick={()=>navigate("/")}>
          <div className="pd3-nav-logo"><div className="pd3-nav-logo-inner"><I.Lungs size={22} color="#0A1628"/></div></div>
          <span className="pd3-nav-name">Med<span className="accent">AI</span></span>
        </div>
        <div className="pd3-nav-links">
          {[
            { id:"overview", label:"Vue d'ensemble" },
            { id:"doctors", label:"Médecins" },
            { id:"dossiers", label:"Dossiers" },
            { id:"appointments", label:"Rendez-vous" },
            { id:"health", label:"Santé" },
            { id:"results", label:"Résultats" },
            { id:"messages", label:"Messages" }, 
          ].map(tab => (
            <button key={tab.id} className={`pd3-nav-link ${activeTab===tab.id ? "active" : ""}`} onClick={()=>setActiveTab(tab.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pd3-nav-actions">
          <button className="pd3-btn pd3-btn-outline pd3-btn-sm" onClick={() => navigate("/patient/profil")}>
            <I.User size={15}/> Profil
          </button>
          <div style={{position:"relative"}} ref={notifRef}>
            <motion.button className="pd3-btn-icon" onClick={()=>setShowNotif(!showNotif)} whileHover={{scale:1.05}} whileTap={{scale:.95}}>
              <I.Bell size={18} color="#fff"/>
              {unreadCount > 0 && (
                <motion.span className="pd3-btn-badge" initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:400}}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </motion.button>
            <AnimatePresence>
              {showNotif && (
                <motion.div className="pd3-notif-panel" initial={{opacity:0,y:-10,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10,scale:.96}} transition={{duration:.2}}>
                  <div className="pd3-notif-header">
                    <div className="pd3-notif-title"><I.Bell size={15} color="#D4A500"/> Notifications {unreadCount>0&&<span className="pd3-notif-badge">{unreadCount} non lue{unreadCount>1?"s":""}</span>}</div>
                    <div className="pd3-notif-actions">
                      {unreadCount>0 && <button className="pd3-notif-action" onClick={markAllAsRead}>Tout lu</button>}
                      <button className="pd3-notif-action" onClick={()=>setShowNotif(false)}><I.X size={16}/></button>
                    </div>
                  </div>
                  <div className="pd3-notif-body">
                    {notifications.length === 0 ? (
                      <div className="pd3-notif-empty"><div className="pd3-notif-empty-icon"><I.Bell size={26} color="#D4A500"/></div><div className="pd3-notif-empty-text">Aucune notification</div><div className="pd3-notif-empty-sub">Vous êtes à jour</div></div>
                    ) : notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={markNotifRead}/>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* BOUTON DÉCONNEXION */}
          <motion.button 
            className="pd3-btn-icon" 
            onClick={() => setShowLogoutModal(true)}
            whileHover={{scale:1.05}} 
            whileTap={{scale:.95}}
            title="Se déconnecter"
            style={{ marginLeft: 4 }}
          >
            <I.LogOut size={18} color="#EF4444"/>
          </motion.button>
        </div>
      </motion.nav>

      {/* HERO */}
      <motion.section className="pd3-hero" style={{y:sY}}>
        <div className="pd3-hero-grid"/><div className="pd3-hero-orb pd3-hero-orb-1"/><div className="pd3-hero-orb pd3-hero-orb-2"/><div className="pd3-hero-orb pd3-hero-orb-3"/>
        <div className="pd3-hero-ring pd3-hero-ring-1"/><div className="pd3-hero-ring pd3-hero-ring-2"/><div className="pd3-hero-ring pd3-hero-ring-3"/>
        <Particles/>
        <div className="pd3-hero-content">
          <div>
            <motion.div initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
              <div className="pd3-hero-status"><span className="pd3-status-pulse"/><span>ESPACE PATIENT</span><span className="pd3-status-sep"/><span>CERTIFIÉ CE MÉDICAL</span></div>
            </motion.div>
            <motion.h1 className="pd3-hero-welcome" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.1}}>
              {greeting},<br/><span className="highlight">{user?.full_name?.split(" ")[0] || "Patient"}</span>
            </motion.h1>
            <motion.div className="pd3-hero-date" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.2}}>
              <I.Calendar size={14} color="rgba(255,255,255,0.5)"/> {currentTime.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} <span style={{margin:"0 8px",opacity:.3}}>•</span> {currentTime.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
            </motion.div>
            <motion.p className="pd3-hero-subtitle" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.25}}>
              Votre espace de suivi médical intelligent. Analysez vos examens, communiquez avec vos médecins et suivez votre santé en toute sécurité.
            </motion.p>
            <motion.div className="pd3-hero-actions" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.35}}>
              <button className="pd3-btn pd3-btn-gold pd3-btn-lg" onClick={()=>navigate("/patient/consultation/new")}>
                <I.Upload size={18}/> Nouvelle consultation
              </button>
              <button className="pd3-btn pd3-btn-outline-light pd3-btn-lg" onClick={()=>navigate("/patient/dossiers")}>
                <I.Folder size={16}/> Mes dossiers
              </button>
            </motion.div>
            <motion.div className="pd3-hero-certs" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5}}>
              <div className="pd3-hero-cert"><I.Shield size={13}/> AES-256 Chiffré</div>
              <div className="pd3-hero-cert"><I.Check size={13}/> CE Médical</div>
              <div className="pd3-hero-cert"><I.Activity size={13}/> Résultats en 30s</div>
            </motion.div>
          </div>
          <motion.div className="pd3-hero-visual" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:.7,delay:.3}}>
            <div className="pd3-hero-card">
              <div className="pd3-hero-card-header"><span className="pd3-card-title">ANALYSE EN TEMPS RÉEL</span><span className="pd3-card-badge"><span className="pd3-status-pulse"/> IA Active</span></div>
              <div className="pd3-mini-chart">
                {[35,55,40,70,45,65,80,50,75,60,85,55,70,90,65,50,75,60,80,55].map((h,i)=>(
                  <motion.div key={i} className={`pd3-chart-bar ${i>=14?"highlight":""}`} style={{height:`${h}%`}} initial={{height:0}} animate={{height:`${h}%`}} transition={{delay:.6+i*.04,duration:.5}}/>
                ))}
              </div>
              <div className="pd3-mini-stats">
                <motion.div className="pd3-mini-stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.8}}>
                  <div className="pd3-mini-stat-value">{stats?.total || 0}</div><div className="pd3-mini-stat-label">Dossiers</div>
                </motion.div>
                <motion.div className="pd3-mini-stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.9}}>
                  <div className="pd3-mini-stat-value">{stats?.analyzed || 0}</div><div className="pd3-mini-stat-label">Analysés</div>
                </motion.div>
                <motion.div className="pd3-mini-stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:1.0}}>
                  <div className="pd3-mini-stat-value">{stats?.pending || 0}</div><div className="pd3-mini-stat-label">En cours</div>
                </motion.div>
              </div>
              <motion.div className="pd3-progress-section" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.1}}>
                <div className="pd3-progress-header"><span className="pd3-progress-label">Complétude du profil</span><span className="pd3-progress-value">85%</span></div>
                <div className="pd3-progress-bar"><motion.div className="pd3-progress-fill" initial={{width:0}} animate={{width:"85%"}} transition={{delay:1.2,duration:1}}/></div>
              </motion.div>
              <div className="pd3-live-indicator"><div className="pd3-live-dot"/><span className="pd3-live-text">SYSTÈME OPÉRATIONNEL</span><span style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)",marginLeft:"auto"}}>98.5% uptime</span></div>
            </div>
            <motion.div className="pd3-float-card pd3-float-1" animate={{y:[0,-14,0]}} transition={{repeat:Infinity,duration:4.5}}>
              <div className="pd3-float-card-icon" style={{background:"rgba(232,184,48,0.12)",color:"#FFD700"}}><I.Brain size={20}/></div>
              <div><div className="pd3-float-card-value">98.5%</div><div className="pd3-float-card-label">Précision</div></div>
            </motion.div>
            <motion.div className="pd3-float-card pd3-float-2" animate={{y:[0,-10,0],x:[0,6,0]}} transition={{repeat:Infinity,duration:5,delay:1.2}}>
              <div className="pd3-float-card-icon" style={{background:"rgba(16,185,129,0.12)",color:"#10B981"}}><I.Clock size={20}/></div>
              <div><div className="pd3-float-card-value">&lt; 24s</div><div className="pd3-float-card-label">Analyse</div></div>
            </motion.div>
            <motion.div className="pd3-float-card pd3-float-3" animate={{boxShadow:["0 0 0px rgba(232,184,48,0.15)","0 0 35px rgba(232,184,48,0.4)","0 0 0px rgba(232,184,48,0.15)"]}} transition={{repeat:Infinity,duration:2.5}}>
              <div className="pd3-float-card-icon" style={{background:"rgba(139,92,246,0.12)",color:"#8B5CF6"}}><I.Activity size={20}/></div>
              <div><div className="pd3-float-card-value">28+</div><div className="pd3-float-card-label">Pathologies</div></div>
            </motion.div>
          </motion.div>
        </div>
        <div className="pd3-scroll-down"><span className="pd3-scroll-text">Découvrir</span><div className="pd3-scroll-icon"><div className="pd3-scroll-wheel"/></div></div>
      </motion.section>

      {/* BODY */}
      <div className="pd3-body">
        <Reveal>
          <div className="pd3-tabs">
            {[
              { id:"overview", label:"Vue d'ensemble", icon:<I.Activity size={16}/> },
              { id:"doctors", label:"Médecins", icon:<I.Map size={16}/> },
              { id:"dossiers", label:"Dossiers", icon:<I.Folder size={16}/> },
              { id:"appointments", label:"Rendez-vous", icon:<I.Calendar size={16}/> },
              { id:"health", label:"Santé", icon:<I.Heart size={16}/> },
              { id:"results", label:"Résultats", icon:<I.Star size={16}/> },
              { id:"prescriptions", label:"Ordonnances", icon:<I.FileText size={16}/> },
              { id:"reminders", label:"Rappels", icon:<I.Clock size={16}/> },
              { id:"upcoming_calls", label:"Appels", icon:<I.Video size={16}/> },
              { id:"messages", label:"Messages", icon:<I.Message size={16}/> },
            ].map(tab=>(
              <button key={tab.id} className={`pd3-tab ${activeTab===tab.id?"active":""}`} onClick={()=>setActiveTab(tab.id)}>
                <span className="pd3-tab-icon">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <Reveal>
                <div className="pd3-section-header" style={{
                  background: "linear-gradient(135deg, #0A1628 0%, #1B3B6F 50%, #0F1B2D 100%)",
                  borderRadius: "24px",
                  padding: "48px 40px 40px",
                  marginBottom: "32px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(10, 22, 40, 0.3), 0 0 0 1px rgba(255, 215, 0, 0.1)",
                }}>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `
                      linear-gradient(rgba(255,215,0,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,215,0,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                    opacity: 0.5,
                  }} />
                  <div style={{
                    position: "absolute",
                    top: "-60px",
                    right: "-40px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)",
                    filter: "blur(40px)",
                  }} />
                  <div style={{
                    position: "absolute",
                    bottom: "-40px",
                    left: "10%",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
                    filter: "blur(30px)",
                  }} />
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 18px",
                      borderRadius: "100px",
                      background: "rgba(255, 215, 0, 0.1)",
                      border: "1px solid rgba(255, 215, 0, 0.25)",
                      marginBottom: "20px",
                      backdropFilter: "blur(10px)",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#FFD700",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                      }}>
                        Vue d'ensemble
                      </span>
                    </div>
                    <h2 style={{
                      fontSize: "2.4rem",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      margin: "0 0 12px 0",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                    }}>
                      Tableau de bord <span style={{
                        background: "linear-gradient(135deg, #FFD700, #D4A500)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}>médical</span>
                    </h2>
                    <p style={{
                      fontSize: "1rem",
                      color: "rgba(255, 255, 255, 0.55)",
                      margin: 0,
                      maxWidth: "500px",
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}>
                      Suivez l'ensemble de vos consultations et analyses en temps réel
                    </p>
                    <div style={{
                      display: "flex",
                      gap: "24px",
                      marginTop: "28px",
                      flexWrap: "wrap",
                    }}>
                      {[
                        { 
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, 
                          label: "Système opérationnel", 
                          color: "#10B981" 
                        },
                        { 
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, 
                          label: "Données chiffrées AES-256", 
                          color: "#3B82F6" 
                        },
                        { 
                          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, 
                          label: "Mise à jour temps réel", 
                          color: "#FFD700" 
                        },
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.75rem",
                          color: "rgba(255, 255, 255, 0.5)",
                          fontWeight: 500,
                        }}>
                          <span style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            background: `${item.color}15`,
                          }}>
                            {item.icon}
                          </span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
              <div className="pd3-metrics-grid">
                {cLoading ? (
                  [1, 2, 3, 4].map(i => <SkeletonMetric key={i} />)
                ) : (
                  statsData.map((s,i)=>(
                    <Reveal key={i} delay={i*.06}>
                      <motion.div className="pd3-metric" style={{"--metric-color":s.color}} whileHover={{y:-6}} onClick={s.label==="En attente" && s.value>0 ? ()=>navigate("/patient/dossiers") : undefined}>
                        <div className="pd3-metric-icon" style={{background:s.bg,color:s.color}}><s.icon size={24}/></div>
                        <div className="pd3-metric-value" style={{color:s.color}}>{s.value}</div>
                        <div className="pd3-metric-label">{s.label}</div>
                        {s.trend && <div className={`pd3-metric-trend ${s.trend.d}`}>{s.trend.d==="up"?"↑":s.trend.d==="down"?"↓":"→"} {s.trend.v}%</div>}
                      </motion.div>
                    </Reveal>
                  ))
                )}
              </div>
              <Reveal delay={.1}>
                <div className="pd3-section-row"><span className="pd3-section-row-title"><I.Sparkles size={16} color="#D4A500"/> Actions rapides</span></div>
              </Reveal>
              <div className="pd3-actions-grid">
                {quickActions.map((a,i)=>(
                  <Reveal key={i} delay={.12+i*.06}>
                    <motion.button className="pd3-action" onClick={a.action} whileHover={{y:-5}}>
                      <div className="pd3-action-top"><div className="pd3-action-icon" style={{background:a.bg,color:a.color}}>{a.icon}</div><div className="pd3-action-arrow"><I.ChevronRight size={14}/></div></div>
                      <div className="pd3-action-label">{a.label}</div><div className="pd3-action-desc">{a.desc}</div>
                    </motion.button>
                  </Reveal>
                ))}
              </div>

              <div className="pd3-actions-grid" style={{ marginTop: 16 }}>
                {profileLinks.map((a,i)=>(
                  <Reveal key={i} delay={.12+i*.06}>
                    <motion.button className="pd3-action" onClick={()=>navigate(a.path)} whileHover={{y:-5}}>
                      <div className="pd3-action-top"><div className="pd3-action-icon" style={{background:a.bg,color:a.color, fontSize:"1.2rem"}}>{a.icon}</div><div className="pd3-action-arrow"><I.ChevronRight size={14}/></div></div>
                      <div className="pd3-action-label">{a.label}</div><div className="pd3-action-desc">{a.desc}</div>
                    </motion.button>
                  </Reveal>
                ))}
              </div>
              <div className="pd3-bottom-grid">
                <Reveal delay={.15}>
                  <div>
                    <div className="pd3-section-row"><span className="pd3-section-row-title"><I.Folder size={16} color="#D4A500"/> Dossiers récents</span><button className="pd3-section-link" onClick={()=>navigate("/patient/dossiers")}>Voir tout →</button></div>
                    <div className="pd3-consult-list">
                      {recent.length === 0 ? (
                        <div className="pd3-empty"><div className="pd3-empty-icon"><I.Folder size={32} color="#D4A500"/></div><div className="pd3-empty-title">Aucun dossier</div><div className="pd3-empty-desc">Soumettez votre première consultation</div><button className="pd3-btn pd3-btn-gold pd3-btn-sm" onClick={()=>navigate("/patient/consultation/new")}><I.Upload size={14}/> Nouveau dossier</button></div>
                      ) : recent.map(c => <ConsultationCard key={c.id} consultation={c} onClick={()=>navigate(`/patient/consultation/${c.id}`)}/>)}
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={.25}>
                  <div>
                    <div className="pd3-section-row"><span className="pd3-section-row-title"><I.Heart size={16} color="#D4A500"/> Score de santé</span></div>
                    <div className="pd3-health-card">
                      <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
                      <div className="pd3-health-content">
                        <div className="pd3-health-top">
                          <div className="pd3-health-ring-container"><HealthRing score={86}/><div className="pd3-health-ring-center"><span className="pd3-health-score">86</span><span className="pd3-health-max">/100</span></div></div>
                          <div><div className="pd3-health-info-status">Score global</div><div className="pd3-health-info-grade"><span className="pd3-health-grade-dot"/> Excellent</div><p className="pd3-health-desc">Continuez à suivre vos rendez-vous et examens périodiques.</p></div>
                        </div>
                        <div className="pd3-health-actions">
                          <button className="pd3-btn pd3-btn-gold pd3-btn-sm" onClick={()=>navigate("/patient/consultation/new")}>Nouveau dossier →</button>
                          <button className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{color:"#fff",borderColor:"rgba(255,255,255,0.2)"}} onClick={()=>navigate("/patient/messages")}>Contacter médecin</button>
                        </div>
                        <div className="pd3-health-tags">
                          {[{icon:<I.Shield size={12}/>,text:"AES-256"},{icon:<I.Check size={12}/>,text:"CE Médical"},{icon:<I.Activity size={12}/>,text:"Teledoc 24/7"}].map((t,i)=><motion.span key={i} className="pd3-health-tag" whileHover={{y:-2}}><span className="pd3-health-tag-icon">{t.icon}</span> {t.text}</motion.span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </motion.div>
          )}

          {/* DOCTORS TAB */}
          {activeTab === "doctors" && (
            <motion.div key="doctors" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <Reveal>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><I.Map size={12}/> MÉDECINS DISPONIBLES</div>
                  <h2 className="pd3-section-title">Trouvez le <span className="accent">spécialiste</span> adapté</h2>
                  <p className="pd3-section-sub">
                    {userLocation ? `📍 Vous êtes à ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "📍 Activez votre position pour voir les médecins les plus proches"}
                  </p>
                </div>
              </Reveal>
              
              <Reveal>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center",marginBottom:24}}>
                  <div style={{position:"relative",flex:"1 1 250px"}}>
                    <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--txt3)",pointerEvents:"none"}}><I.Search size={14}/></span>
                    <input 
                      type="text" 
                      placeholder="Rechercher médecin, spécialité, ville..." 
                      value={searchQuery} 
                      onChange={e=>setSearchQuery(e.target.value)}
                      style={{width:"100%",padding:"10px 16px 10px 40px",borderRadius:12,border:"1.5px solid var(--border)",fontSize:"0.85rem",fontFamily:"inherit",outline:"none",background:"var(--bg)",color:"var(--txt)"}}
                    />
                  </div>
                  <select value={specialtyFilter} onChange={e=>setSpecialtyFilter(e.target.value)}
                    style={{padding:"10px 16px",borderRadius:12,border:"1.5px solid var(--border)",fontSize:"0.85rem",fontFamily:"inherit",outline:"none",background:"var(--bg)",color:"var(--txt)",cursor:"pointer",minWidth:180}}>
                    <option value="all">Toutes les spécialités</option>
                    {specialties.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        setDoctorsLoading(true);
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                            setDoctorsLoading(false);
                          },
                          err => {
                            console.error("Erreur géolocalisation:", err);
                            setDoctorsLoading(false);
                            window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Impossible d'obtenir votre position", type: "error" } }));
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      } else {
                        window.dispatchEvent(new CustomEvent('showToast', { detail: { message: "Géolocalisation non supportée", type: "warning" } }));
                      }
                    }}
                    style={{
                      padding:"10px 18px", borderRadius:12, background:"var(--gradient-nav)", color:"#fff",
                      border:"none", fontWeight:600, fontSize:"0.85rem", cursor:"pointer",
                      display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap"
                    }}
                  >
                    <I.Navigation size={14} color="#fff" />
                    {userLocation ? "Mettre à jour ma position" : "📍 Me localiser"}
                  </button>
                  
                  <div style={{display:"flex",background:"var(--bg)",borderRadius:10,padding:3,border:"1px solid var(--border)"}}>
                    <button onClick={()=>setMapView("map")} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:mapView==="map"?"var(--gradient-nav)":"transparent",color:mapView==="map"?"#fff":"var(--txt3)",fontSize:"0.78rem",fontWeight:600,fontFamily:"inherit",transition:"all 0.2s ease"}}>
                      <I.Map size={14}/> Carte
                    </button>
                    <button onClick={()=>setMapView("list")} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:mapView==="list"?"var(--gradient-nav)":"transparent",color:mapView==="list"?"#fff":"var(--txt3)",fontSize:"0.78rem",fontWeight:600,fontFamily:"inherit",transition:"all 0.2s ease"}}>
                      <I.Folder size={14}/> Liste
                    </button>
                  </div>
                  
                  <span style={{fontSize:"0.8rem",color:"var(--txt3)",fontWeight:500,marginLeft:"auto"}}>
                    {filteredDoctors.length} médecin{filteredDoctors.length>1?"s":""}
                    {userLocation && " • Triés par proximité"}
                  </span>
                </div>
              </Reveal>

              {doctorsLoading ? (
                <div className="pd3-api-loading"><div className="pd3-api-spinner"/><span style={{color:"var(--txt3)"}}>Chargement des médecins...</span></div>
              ) : mapView === "map" ? (
                <div className="pd3-map-full-container" style={{overflow:"hidden",marginBottom:32,borderRadius:"var(--radius-xl)",border:"1px solid var(--border)"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 350px",height:600}}>
                    <MapView 
                      doctors={filteredDoctors} 
                      userLocation={userLocation} 
                      selectedDoctorId={selectedDoctorId} 
                      onDoctorSelect={d => setSelectedDoctorId(d.id)}
                      nearestDoctorId={nearestDoctor?.id}
                    />
                    <div className="pd3-map-sidebar">
                      <div className="pd3-map-sidebar-header">
                        <span>Médecins à proximité</span>
                        <span style={{fontSize:"0.7rem",color:"var(--txt3)"}}>
                          {filteredDoctors.length} résultat{filteredDoctors.length>1?"s":""}
                        </span>
                      </div>
                      <div className="pd3-map-sidebar-list" style={{maxHeight:540,overflowY:"auto"}}>
                        {filteredDoctors.length === 0 ? (
                          <div style={{padding:"40px 20px",textAlign:"center",color:"var(--txt3)"}}>
                            <I.Map size={32} color="var(--txt3)"/>
                            <p style={{marginTop:12}}>Aucun médecin trouvé</p>
                            <p style={{fontSize:"0.7rem"}}>Essayez de modifier vos filtres</p>
                          </div>
                        ) : (
                          filteredDoctors.map((d, idx) => {
                            const isNearestDoctor = nearestDoctor && d.id === nearestDoctor.id;
                            return (
                              <motion.div
                                key={d.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`pd3-map-sidebar-item ${selectedDoctorId === d.id ? "active" : ""} ${isNearestDoctor ? "nearest" : ""}`}
                                onClick={() => setSelectedDoctorId(d.id)}
                                style={{
                                  cursor: "pointer",
                                  padding: "14px 18px",
                                  borderBottom: "1px solid var(--border)",
                                  transition: "all 0.2s",
                                  background: isNearestDoctor ? "rgba(16,185,129,0.08)" : "transparent",
borderLeft: isNearestDoctor ? "3px solid #10B981" : "3px solid transparent",                                 borderLeft: isNearestDoctor ? "3px solid #10B981" : "3px solid transparent",
                                }}
                              >
                                <div className="pd3-map-sidebar-item-name" style={{fontWeight:700,color:"var(--navy)",marginBottom:4}}>
                                  {d.name}
                                </div>
                                <div className="pd3-map-sidebar-item-specialty" style={{fontSize:"0.72rem",color:"var(--gold-dk)",fontWeight:600,marginBottom:6}}>
                                  {d.specialite}
                                </div>
                                {d.ville && (
                                  <div className="pd3-map-sidebar-item-address" style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.7rem",color:"var(--txt3)",marginBottom:4}}>
                                    <I.Map size={11} color="var(--txt3)"/> {d.ville}
                                  </div>
                                )}
                                {d.distance !== null && (
                                  <div className={`pd3-map-sidebar-item-distance ${isNearestDoctor ? "nearest" : ""}`} style={{fontSize:"0.7rem",color:"var(--success)",fontWeight:700,marginTop:6,display:"flex",alignItems:"center",gap:4}}>
                                    <I.Navigation size={11} color="var(--success)"/> {d.distance} km
                                  </div>
                                )}
                                {d.phones?.[0] && (
                                  <div className="pd3-map-sidebar-item-address" style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.7rem",color:"var(--txt3)",marginTop:6}}>
                                    <I.Phone size={11} color="var(--txt3)"/> {d.phones[0]}
                                  </div>
                                )}
                                {d.address && (
                                  <div className="pd3-map-sidebar-item-address" style={{fontSize:"0.65rem",color:"var(--txt3)",marginTop:4}}>
                                    {d.address.length > 60 ? d.address.substring(0,60)+"..." : d.address}
                                  </div>
                                )}
                                {isNearestDoctor && (
                                  <div style={{
                                    marginTop: 8,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    background: "#10B98115",
                                    color: "#10B981",
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    width: "fit-content",
                                  }}>
                                    <I.Navigation size={10} color="#10B981"/> Le plus proche de vous
                                  </div>
                                )}
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pd3-doctors-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))",gap:16}}>
                  {filteredDoctors.map(d => {
                    const isNearest = nearestDoctor && d.id === nearestDoctor.id;
                    return (
                      <DoctorCardAPI 
                        key={d.id} 
                        doctor={d} 
                        distance={d.distance} 
                        isNearest={isNearest}
                        onClick={() => {setSelectedDoctorId(d.id);setMapView("map");}}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* DOSSIERS TAB */}
          {activeTab === "dossiers" && (
            <motion.div key="dossiers" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <Reveal>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><I.Folder size={12}/> DOSSIERS MEDICAUX</div>
                  <h2 className="pd3-section-title">Historique <span className="accent">complet</span></h2>
                  <p className="pd3-section-sub">Consultez et suivez tous vos dossiers medicaux</p>
                </div>
              </Reveal>
              <Reveal>
                <div className="pd3-section-row">
                  <span className="pd3-section-row-title"><I.Folder size={16} color="#D4A500"/> Tous les dossiers</span>
                  <button className="pd3-btn pd3-btn-gold pd3-btn-sm" onClick={()=>navigate("/patient/consultation/new")}><I.Upload size={14}/> Nouveau</button>
                </div>
              </Reveal>
              <div className="pd3-consult-list">
                {(consultations || []).length === 0 ? (
                  <div className="pd3-empty"><div className="pd3-empty-icon"><I.Folder size={36} color="#D4A500"/></div><div className="pd3-empty-title">Aucun dossier</div><div className="pd3-empty-desc">Creez votre premier dossier</div><button className="pd3-btn pd3-btn-gold" onClick={()=>navigate("/patient/consultation/new")}><I.Upload size={16}/> Premier dossier</button></div>
                ) : (consultations || []).map(c => <ConsultationCard key={c.id} consultation={c} onClick={()=>navigate(`/patient/consultation/${c.id}`)}/>)}
              </div>
            </motion.div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === "appointments" && (
            <motion.div key="appointments" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <Reveal>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><I.Calendar size={12}/> RENDEZ-VOUS</div>
                  <h2 className="pd3-section-title">Vos <span className="accent">consultations</span></h2>
                  <p className="pd3-section-sub">Planifiez et gérez vos rendez-vous médicaux</p>
                </div>
              </Reveal>
              
              <div className="pd3-appt-grid">
                <div>
                  <AppointmentsList 
                    appointments={appointments}
                    loading={appointmentsLoading}
                    onRefresh={fetchAppointments}
                  />
                </div>
                <Reveal delay={.1}>
                  <div className="pd3-calendar">
                    <div className="pd3-calendar-header">
                      <span className="pd3-calendar-title">
                        {new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" })}
                      </span>
                      <div className="pd3-calendar-nav">
                        <button className="pd3-cal-nav-btn" onClick={() => {}}><I.ChevronLeft size={14}/></button>
                        <button className="pd3-cal-nav-btn" onClick={() => {}}><I.ChevronRight size={14}/></button>
                      </div>
                    </div>
                    <div className="pd3-calendar-days">
                      {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => <span key={d}>{d}</span>)}
                    </div>
                    <div className="pd3-calendar-grid">
                      {Array.from({length: 35}, (_, i) => {
                        const day = i + 1;
                        const hasAppt = appointments.some(apt => {
                          if (!apt.scheduled_at) return false;
                          const aptDate = new Date(apt.scheduled_at);
                          return aptDate.getDate() === day && aptDate.getMonth() === new Date().getMonth() && apt.status !== "cancelled";
                        });
                        const isToday = day === new Date().getDate();
                        return (
                          <motion.div 
                            key={i} 
                            className={`pd3-cal-day ${isToday ? "today" : ""} ${hasAppt ? "has-appt" : ""}`} 
                            whileHover={{ scale: 1.05 }}
                          >
                            {day <= 31 ? day : day - 31}
                            {hasAppt && day <= 31 && <div className="pd3-cal-dot"/>}
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="pd3-calendar-footer" style={{ marginTop: 16, textAlign: "center" }}>
                      <button 
                        className="pd3-btn pd3-btn-gold pd3-btn-sm" 
                        onClick={() => navigate("/patient/consultation/new")}
                        style={{ width: "100%" }}
                      >
                        <I.Upload size={14}/> Demander une consultation
                      </button>
                    </div>
                  </div>
                </Reveal>
              </div>
            </motion.div>
          )}
          
          {/* HEALTH TAB */}
          {activeTab === "health" && (
            <motion.div key="health" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <Reveal>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><I.Heart size={12}/> SANTÉ & CONSEILS</div>
                  <h2 className="pd3-section-title">Votre <span className="accent">santé</span> en détail</h2>
                  <p className="pd3-section-sub">Indicateurs vitaux et recommandations personnalisées</p>
                </div>
              </Reveal>
              <div className="pd3-health-grid">
                <Reveal>
                  <div className="pd3-health-card" style={{minHeight:340}}>
                    <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
                    <div className="pd3-health-content" style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
                      <div className="pd3-health-ring-container" style={{marginBottom:20}}><HealthRing score={86}/><div className="pd3-health-ring-center"><span className="pd3-health-score">86</span><span className="pd3-health-max">/100</span></div></div>
                      <h3 style={{color:"#fff",fontSize:"1.15rem",fontWeight:700,marginBottom:8}}>Score de santé global</h3>
                      <p style={{color:"rgba(255,255,255,0.45)",fontSize:"0.82rem",lineHeight:1.6,marginBottom:24}}>Votre santé est bien maintenue. Continuez votre suivi régulier.</p>
                      <div style={{display:"flex",gap:14,width:"100%"}}>
                        {[{label:"Dossiers",value:stats?.total||0},{label:"Analysés",value:stats?.analyzed||0},{label:"En cours",value:stats?.pending||0}].map((item,i)=>(
                          <div key={i} style={{flex:1,textAlign:"center",padding:"14px 8px",background:"rgba(255,255,255,0.04)",borderRadius:14,border:"1px solid rgba(232,184,48,0.1)"}}><div style={{fontSize:"1.4rem",fontWeight:800,color:"#FFD700"}}>{item.value}</div><div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",marginTop:4}}>{item.label}</div></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
                <div>
                  <Reveal><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Sparkles size={16} color="#D4A500"/> Conseils personnalisés</span></div></Reveal>
                  {healthTips.map((tip,i)=>(
                    <Reveal key={i} delay={i*.08}>
                      <motion.div className="pd3-tip-card" whileHover={{x:4}}>
                        <div className="pd3-tip-icon">{tip.icon}</div>
                        <div><div className="pd3-tip-title">{tip.title}</div><div className="pd3-tip-desc">{tip.desc}</div></div>
                      </motion.div>
                    </Reveal>
                  ))}
                  <Reveal delay={.3}>
                    <div className="pd3-section-row" style={{marginTop:28}}><span className="pd3-section-row-title"><I.Activity size={16} color="#D4A500"/> Derniers indicateurs</span></div>
                    <div className="pd3-vitals-grid">
                      {[
                        { label:"Fréq. cardiaque", value:"72", unit:"bpm", icon:<I.Heart size={16}/>, color:"#EF4444", bg:"rgba(239,68,68,0.08)" },
                        { label:"SpO₂", value:"98", unit:"%", icon:<I.Lungs size={16}/>, color:"#3B82F6", bg:"rgba(59,130,246,0.08)" },
                        { label:"IMC", value:"22.4", unit:"", icon:<I.User size={16}/>, color:"#10B981", bg:"rgba(16,185,129,0.08)" },
                      ].map((v,i)=>(
                        <motion.div key={i} className="pd3-vital" whileHover={{y:-4}}>
                          <div className="pd3-vital-icon" style={{background:v.bg,color:v.color}}>{v.icon}</div>
                          <div className="pd3-vital-value" style={{color:v.color}}>{v.value}<span className="pd3-vital-unit"> {v.unit}</span></div>
                          <div className="pd3-vital-label">{v.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  </Reveal>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESULTS TAB */}
          {activeTab === "results" && (
            <motion.div key="results" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <Reveal>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><PatientIcons.Results size={12}/> MES RÉSULTATS</div>
                  <h2 className="pd3-section-title">Tous vos <span className="accent">diagnostics</span></h2>
                  <p className="pd3-section-sub">Consultez l'historique complet de vos analyses</p>
                </div>
              </Reveal>
              
              <div className="pd3-section-row">
                <span className="pd3-section-row-title"><PatientIcons.Results size={16} color="#D4A500"/> Derniers résultats</span>
                <button className="pd3-section-link" onClick={() => navigate("/patient/resultats")}>Voir tout →</button>
              </div>
              
              <div className="pd3-consult-list">
                {(consultations || []).filter(c => c.status === "analyzed" && c.prediction).slice(0, 5).length === 0 ? (
                  <div className="pd3-empty">
                    <div className="pd3-empty-icon"><PatientIcons.Results size={32} color="#D4A500"/></div>
                    <div className="pd3-empty-title">Aucun résultat</div>
                    <div className="pd3-empty-desc">Vos résultats d'analyse apparaîtront ici</div>
                    <button className="pd3-btn pd3-btn-gold pd3-btn-sm" onClick={() => navigate("/patient/consultation/new")}>
                      <I.Upload size={14}/> Nouvelle consultation
                    </button>
                  </div>
                ) : (
                  (consultations || []).filter(c => c.status === "analyzed" && c.prediction).slice(0, 5).map(c => (
                    <ConsultationCard key={c.id} consultation={c} onClick={() => navigate(`/patient/resultats/${c.id}`)}/>
                  ))
                )}
              </div>
              
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={() => navigate("/patient/resultats/evolution")}
                  className="pd3-btn pd3-btn-outline"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <PatientIcons.Evolution size={16}/> Voir l'évolution de ma santé
                </button>
              </div>
            </motion.div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === "messages" && (
            <motion.div key="messages" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <MessagesPage user={user} consultations={consultations} notifications={notifications} onNavigate={navigateToPage} />
            </motion.div>
          )}

          {/* PRESCRIPTIONS TAB */}
          {activeTab === "prescriptions" && (
            <motion.div key="prescriptions" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <PrescriptionsPage />
            </motion.div>
          )}

          {/* REMINDERS TAB */}
          {activeTab === "reminders" && (
            <motion.div key="reminders" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <RemindersPage />
            </motion.div>
          )}

          {/* UPCOMING CALLS TAB */}
          {activeTab === "upcoming_calls" && (
            <motion.div key="upcoming_calls" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
              <UpcomingCallsPage />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PLATFORM METRICS */}
        <Reveal>
          <section className="pd3-platform">
            <div className="pd3-platform-grid">
              {platformStats.map((s,i)=>(
                <motion.div key={i} className="pd3-platform-item" whileHover={{y:-4}}>
                  <div className="pd3-platform-icon"><s.icon size={30} color="#D4A500"/></div>
                  <Counter value={s.value} suffix={s.suffix}/>
                  <div className="pd3-platform-label">{s.label}</div>
                  {i<3 && <div className="pd3-platform-div"/>}
                </motion.div>
              ))}
            </div>
          </section>
        </Reveal>

        {/* FOOTER */}
        <footer className="hp-footer">
          <div className="hp-footer-inner">
            <div className="hp-footer-grid">
              <div className="hp-footer-brand">
                <div className="hp-nav-logo" style={{ marginBottom: 16 }}>
                  <div className="hp-logo-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M12 4v12M8 8c-2 0-4 1-4 4s1 6 4 6M16 8c2 0 4 1 4 4s-1 6-4 6M8 8c1.5 0 3 1 4 2M16 8c-1.5 0-3 1-4 2"/>
                    </svg>
                  </div>
                  <span style={{ color: "#fff" }}>Med<span style={{ color: "#FFD700" }}>AI</span></span>
                </div>
                <p>Plateforme médicale de diagnostic assisté par IA. Transformant la radiologie avec l'apprentissage profond depuis 2024.</p>
                <div className="hp-footer-socials">
                  {["LI", "TW", "GH", "YT", "IN"].map((s, i) => (
                    <div className="hp-footer-social" key={i}>{s}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4>PRODUIT</h4>
                {["Analyse IA", "Radiologues", "API Access", "Mobile App", "Tarifs"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
              </div>
              <div>
                <h4>ENTREPRISE</h4>
                {["À propos", "Carrières", "Recherche", "Blog", "Contact"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
              </div>
              <div>
                <h4>RESSOURCES</h4>
                {["Documentation", "Études de cas", "Whitepapers", "Support", "Statut"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
              </div>
            </div>
            <div className="hp-footer-bottom">
              <span>© 2025 MedAI — Plateforme médicale certifiée · Tous droits réservés</span>
              <div className="hp-footer-bottom-links">
                {["Confidentialité", "Conditions", "Sécurité", "HIPAA", "RGPD", "Contact"].map(x => <a href="#" key={x}>{x}</a>)}
              </div>
            </div>
          </div>
        </footer>
      </div>
       {/* ═══════════════════════════════════════════ */}
      {/* OVERLAY NOTIFICATIONS CRITIQUES — 100% SVG   */}
      {/* ═══════════════════════════════════════════ */}
      <CriticalNotificationOverlay 
        notifications={criticalNotifications}
        userRole="patient"
        onDismiss={() => {
          refetchCritical();
        }}
        onAction={(notification) => {
          try {
            const data = JSON.parse(notification.data || "{}");
            if (data.consultation_id) {
              navigate(`/patient/consultation/${data.consultation_id}`);
            }
          } catch (e) {
            console.error(e);
          }
          markNotifRead(notification.id);
        }}
        autoShowDelay={2000}
        dismissAfter={null}
      />
    </div>
  );
}