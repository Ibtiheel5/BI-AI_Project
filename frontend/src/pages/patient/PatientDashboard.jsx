import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePatientData } from "../../hooks/usePatientData";
import { useNotifications } from "../../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import "./PatientDashboard.css";
import "leaflet/dist/leaflet.css";

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
// LEAFLET MAP COMPONENT - VERSION COMPLÈTEMENT CORRIGÉE
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
        // Attendre que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted || !containerRef.current) return;
        
        const leaflet = await getLeaflet();
        
        // Nettoyer l'ancienne carte
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        
        // Centre par défaut : Tunis
        const center = userLocation ? [userLocation.lat, userLocation.lng] : [36.8065, 10.1815];
        
        // Créer la carte
        const map = leaflet.map(containerRef.current, {
          center: center,
          zoom: userLocation ? 12 : 8,
          zoomControl: false, // On utilisera nos propres contrôles
          attributionControl: true
        });
        
        // ✅ SOLUTION : Utiliser OpenStreetMap standard (le plus fiable)
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          minZoom: 6,
          errorTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }).addTo(map);
        
        // Ajouter un fond de secours en cas d'erreur
        map.on('tileerror', function(error) {
          console.warn('Tile error:', error);
        });
        
        mapRef.current = map;
        setMapLoaded(true);
        
        // Forcer l'invalidation de la taille
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 200);
        
        // Rafraîchir après le chargement complet
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

      // Nettoyer les marqueurs existants
      Object.values(markersRef.current).forEach(m => {
        if (map.hasLayer(m)) map.removeLayer(m);
      });
      markersRef.current = {};
      
      if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      // Icône médecin
      // Remplacer la création du marqueur médecin par :
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

      // Ajouter les médecins
      doctors.forEach((doc, idx) => {
        const coords = CITY_COORDS[doc.ville];
        if (!coords) return;
        
        // Position avec petit offset
        const lat = coords[0] + (idx % 5 - 2) * 0.003;
        const lng = coords[1] + (idx % 5 - 2) * 0.003;
        const color = DOCTOR_COLORS[doc.specialite] || "#D4A500";
        const isNearest = doc.id === nearestDoctorId;

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

      // Marqueur utilisateur
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
        
        // Centrer sur l'utilisateur
        if (!mapRef.current._initialCentered) {
          mapRef.current.setView([userLocation.lat, userLocation.lng], 12);
          mapRef.current._initialCentered = true;
        }
      }
      
      // Ajuster les limites si pas de position utilisateur
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
  }, [doctors, userLocation, onDoctorSelect, mapLoaded]);

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
      
      {/* Loading overlay */}
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
      
      {/* Contrôles */}
      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 6 }}>
        <button onClick={() => mapRef.current?.zoomIn()} style={zoomBtn}>+</button>
        <button onClick={() => mapRef.current?.zoomOut()} style={zoomBtn}>−</button>
        {userLocation && (
          <button onClick={() => mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 13)} style={{...zoomBtn, background: "#3B82F6", color: "white" }}>
            <I.Navigation size={16} color="white" />
          </button>
        )}
      </div>
      
      {/* Légende */}
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
  const cfg = { chest:{color:"#2D5F9E",bg:"rgba(45,95,158,0.08)",icon:<I.Lungs size={22}/>}, brain:{color:"#6B4FA0",bg:"rgba(107,79,160,0.08)",icon:<I.Brain size={22}/>}, lung:{color:"#D4A500",bg:"rgba(212,165,0,0.08)",icon:<I.Scan size={22}/>} };
  const c = cfg[consultation.model_key] || {color:"#64748B",bg:"rgba(100,116,139,0.08)",icon:<I.Folder size={22}/>};
  const fd = new Date(consultation.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
  return (
    <motion.div className="pd3-consult-card" style={{"--accent-color":c.color}} onClick={onClick} whileHover={{x:6}}>
      <div className="pd3-consult-card-accent"/>
      <div className="pd3-consult-icon" style={{background:c.bg,color:c.color}}>{c.icon}</div>
      <div className="pd3-consult-body">
        <div className="pd3-consult-header"><span className="pd3-consult-id">Dossier #{consultation.id}</span><StatusBadge status={consultation.status}/></div>
        <div className="pd3-consult-date">{fd}</div>
        <div className="pd3-consult-doctor">{consultation.doctor_name ? `Dr. ${consultation.doctor_name}` : "En attente"}</div>
        {consultation.prediction && <div className="pd3-prediction">{consultation.prediction}</div>}
      </div>
      <I.ChevronRight size={18}/>
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { consultations, stats, loading: cLoading, refetch: refetchConsultations } = usePatientData();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch: refetchNotifs } = useNotifications();

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
  const notifRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const sY = useSpring(heroY, { stiffness: 80, damping: 25 });

  // ── Greeting (une seule fois) ──────────────────────────────────────────────
  useEffect(() => { 
    const h = new Date().getHours(); 
    setGreeting(h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"); 
  }, []);
  
  // ── Horloge (rafraîchissement limité à 60 secondes au lieu de 1 seconde) ──
  useEffect(() => { 
    const i = setInterval(() => setCurrentTime(new Date()), 60000); // 1 minute
    return () => clearInterval(i); 
  }, []);
  
  // ── Click outside pour fermer les notifications ───────────────────────────

  // ── Scroll listener avec throttle pour performance ────────────────────────
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

  // ───❌ SUPPRESSION COMPLÈTE DU POLLING AUTOMATIQUE ❌───────────────────────
  // Le bloc suivant a été SUPPRIMÉ pour éviter tout rafraîchissement automatique
  // Les données ne se rafraîchissent que :
  //   1. Au chargement initial de la page
  //   2. Lors d'un rechargement manuel (F5)
  //   3. Si l'utilisateur navigue vers une autre page et revient
  // ───────────────────────────────────────────────────────────────────────────

  // ── Fetch doctors (une seule fois) ────────────────────────────────────────
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
  }, []); // ← Dépendances vides = exécution une seule fois

  // ── Geolocation (une seule fois) ──────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log("Geolocation denied"),
      { timeout: 8000 }
    );
  }, []); // ← Une seule fois

  // ── Computed values ───────────────────────────────────────────────────────
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

  // Après le calcul de filteredDoctors, ajouter :
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
    { icon:I.Upload, label:"Nouvelle consultation", desc:"Soumettre une imagerie", color:"#D4A500", bg:"rgba(212,165,0,0.08)", action:()=>navigate("/patient/consultation/new") },
    { icon:I.Folder, label:"Mes dossiers", desc:"Historique complet", color:"#3B82F6", bg:"rgba(59,130,246,0.08)", action:()=>navigate("/patient/dossiers") },
    { icon:I.Message, label:"Messages", desc:`${unreadCount} non lu${unreadCount>1?"s":""}`, color:"#10B981", bg:"rgba(16,185,129,0.08)", action:()=>navigate("/patient/messages") },
    { icon:I.Brain, label:"Analyse IA", desc:"Tester un modèle", color:"#8B5CF6", bg:"rgba(139,92,246,0.08)", action:()=>navigate("/classification") },
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
  const handleLogout = () => {
  localStorage.removeItem("medai-token");
  localStorage.removeItem("medai-user");
  window.location.href = "/";
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
      {/* NAVIGATION */}
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
          ].map(tab => (
            <button key={tab.id} className={`pd3-nav-link ${activeTab===tab.id ? "active" : ""}`} onClick={()=>setActiveTab(tab.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pd3-nav-actions">
          <button className="pd3-btn pd3-btn-outline pd3-btn-sm" onClick={()=>navigate("/profile")}>
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
                    ) : notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={markAsRead}/>)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              { id:"doctors", label:"Médecins disponibles", icon:<I.Map size={16}/> },
              { id:"dossiers", label:"Dossiers récents", icon:<I.Folder size={16}/> },
              { id:"appointments", label:"Rendez-vous", icon:<I.Calendar size={16}/> },
              { id:"health", label:"Santé & conseils", icon:<I.Heart size={16}/> },
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
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><I.Activity size={12}/> VUE D'ENSEMBLE</div>
                  <h2 className="pd3-section-title">Tableau de bord <span className="accent">médical</span></h2>
                  <p className="pd3-section-sub">Suivez l'ensemble de vos consultations en temps réel</p>
                </div>
              </Reveal>
              <div className="pd3-metrics-grid">
                {statsData.map((s,i)=>(
                  <Reveal key={i} delay={i*.06}>
                    <motion.div className="pd3-metric" style={{"--metric-color":s.color}} whileHover={{y:-6}} onClick={s.label==="En attente" && s.value>0 ? ()=>navigate("/patient/dossiers") : undefined}>
                      <div className="pd3-metric-icon" style={{background:s.bg,color:s.color}}><s.icon size={24}/></div>
                      <div className="pd3-metric-value" style={{color:s.color}}>{s.value}</div>
                      <div className="pd3-metric-label">{s.label}</div>
                      {s.trend && <div className={`pd3-metric-trend ${s.trend.d}`}>{s.trend.d==="up"?"↑":s.trend.d==="down"?"↓":"→"} {s.trend.v}%</div>}
                    </motion.div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={.1}>
                <div className="pd3-section-row"><span className="pd3-section-row-title"><I.Sparkles size={16} color="#D4A500"/> Actions rapides</span></div>
              </Reveal>
              <div className="pd3-actions-grid">
                {quickActions.map((a,i)=>(
                  <Reveal key={i} delay={.12+i*.06}>
                    <motion.button className="pd3-action" onClick={a.action} whileHover={{y:-5}}>
                      <div className="pd3-action-top"><div className="pd3-action-icon" style={{background:a.bg,color:a.color}}><a.icon size={22}/></div><div className="pd3-action-arrow"><I.ChevronRight size={14}/></div></div>
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

                    {/* DOCTORS TAB - VERSION CORRIGÉE AVEC GÉOLOCALISATION */}
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
              
              {/* Barre d'outils */}
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
                  
                  {/* Bouton de géolocalisation */}
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
                            alert("Impossible d'obtenir votre position. Vérifiez vos paramètres de localisation.");
                          },
                          { enableHighAccuracy: true, timeout: 10000 }
                        );
                      } else {
                        alert("Géolocalisation non supportée par votre navigateur.");
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

              {/* Affichage Carte ou Liste */}
              {/* Affichage Carte ou Liste */}
{doctorsLoading ? (
  <div className="pd3-api-loading">...</div>
) : mapView === "map" ? (
  <div className="pd3-map-full-container" style={{overflow:"hidden",marginBottom:32,borderRadius:"var(--radius-xl)",border:"1px solid var(--border)"}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 350px",height:600}}>
      <MapView 
        doctors={filteredDoctors} 
        userLocation={userLocation} 
        selectedDoctorId={selectedDoctorId} 
        onDoctorSelect={d => setSelectedDoctorId(d.id)}
        nearestDoctorId={nearestDoctor?.id}  // ← AJOUTER CETTE LIGNE
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
              // ↓↓↓ AJOUTER CETTE LIGNE ↓↓↓
              const isNearestDoctor = nearestDoctor && d.id === nearestDoctor.id;
              // ↑↑↑ AJOUTER CETTE LIGNE ↑↑↑
              
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  // ↓↓↓ MODIFIER LE className ↓↓↓
                  className={`pd3-map-sidebar-item ${selectedDoctorId === d.id ? "active" : ""} ${isNearestDoctor ? "nearest" : ""}`}
                  // ↑↑↑ MODIFIER LE className ↑↑↑
                  onClick={() => setSelectedDoctorId(d.id)}
                  // ↓↓↓ MODIFIER LE style ↓↓↓
                  style={{
                    cursor: "pointer",
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border)",
                    transition: "all 0.2s",
                    background: isNearestDoctor ? "rgba(16,185,129,0.08)" : "transparent",
                    borderLeft: isNearestDoctor ? "3px solid #10B981" : "3px solid transparent",
                  }}
                  // ↑↑↑ MODIFIER LE style ↑↑↑
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
                  
                  {/* ↓↓↓ AJOUTER CETTE SECTION POUR LE BADGE "PLUS PROCHE" ↓↓↓ */}
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
                  {/* ↑↑↑ AJOUTER CETTE SECTION ↑↑↑ */}
                  
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  </div>
) : (
  // Vue liste
  <div className="pd3-doctors-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))",gap:16}}>
    {filteredDoctors.map(d => {
      // ↓↓↓ AJOUTER CETTE LIGNE ↓↓↓
      const isNearest = nearestDoctor && d.id === nearestDoctor.id;
      // ↑↑↑ AJOUTER CETTE LIGNE ↑↑↑
      
      return (
        <DoctorCardAPI 
          key={d.id} 
          doctor={d} 
          distance={d.distance} 
          isNearest={isNearest}  // ← AJOUTER CETTE PROP
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
                  <div className="pd3-section-badge"><I.Folder size={12}/> DOSSIERS MÉDICAUX</div>
                  <h2 className="pd3-section-title">Historique <span className="accent">complet</span></h2>
                  <p className="pd3-section-sub">Consultez et suivez tous vos dossiers médicaux</p>
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
                  <div className="pd3-empty"><div className="pd3-empty-icon"><I.Folder size={36} color="#D4A500"/></div><div className="pd3-empty-title">Aucun dossier</div><div className="pd3-empty-desc">Créez votre premier dossier</div><button className="pd3-btn pd3-btn-gold" onClick={()=>navigate("/patient/consultation/new")}><I.Upload size={16}/> Premier dossier</button></div>
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
                  <Reveal><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Calendar size={16} color="#D4A500"/> Prochains rendez-vous</span></div></Reveal>
                  <div className="pd3-appt-list">
                    <div className="pd3-empty"><div className="pd3-empty-icon"><I.Calendar size={32} color="#D4A500"/></div><div className="pd3-empty-title">Aucun rendez-vous</div><div className="pd3-empty-desc">Planifiez votre première consultation</div></div>
                  </div>
                  <Reveal delay={.2}>
                    <button className="pd3-btn pd3-btn-gold" style={{marginTop:16,width:"100%"}} onClick={()=>navigate("/patient/appointments")}>
                      <I.Calendar size={16}/> Planifier un rendez-vous
                    </button>
                  </Reveal>
                </div>
                <Reveal delay={.1}>
                  <div className="pd3-calendar">
                    <div className="pd3-calendar-header"><span className="pd3-calendar-title">Janvier 2025</span><div className="pd3-calendar-nav"><button className="pd3-cal-nav-btn"><I.ChevronLeft size={14}/></button><button className="pd3-cal-nav-btn"><I.ChevronRight size={14}/></button></div></div>
                    <div className="pd3-calendar-days">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d=><span key={d}>{d}</span>)}</div>
                    <div className="pd3-calendar-grid">
                      {Array.from({length:31},(_,i)=>{const day=i+1,hasAppt=[5,7].includes(day),isToday=day===2;return<motion.div key={i} className={`pd3-cal-day ${isToday?"today":""} ${hasAppt?"has-appt":""}`} whileHover={{scale:1.1}}>{day}{hasAppt&&<div className="pd3-cal-dot"/>}</motion.div>;})}
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

        {/* ========== FOOTER PREMIUM (IDENTIQUE À HOMEPAGE) ========== */}
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
    </div>
  );
}