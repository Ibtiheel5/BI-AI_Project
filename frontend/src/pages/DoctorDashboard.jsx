// DoctorDashboard.jsx — Version Premium Pro avec Analytics & Charts
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import "./patient/PatientDashboard.css";
import { useAuth } from "../context/AuthContext";
import CIM11Chatbot from "../components/CIM11Chatbot";
import DoctorPrescriptionsPage from "./doctor/DoctorPrescriptionsPage";
import DoctorRemindersPage from "./doctor/DoctorRemindersPage";
import DoctorUpcomingCallsPage from "./doctor/DoctorUpcomingCallsPage";
import CriticalNotificationOverlay from "../components/CriticalNotificationOverlay";
import { useCriticalNotifications } from "../hooks/useCriticalNotifications";
import "../components/CriticalNotificationOverlay.css";
const API = "http://localhost:8000/api/v1";

const Svg = ({ children, size = 24, color = "currentColor", sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

const I = {
  Lungs: p => <Svg {...p}><path d="M12 4.5v11M8.5 8c-1.8 0-3.5.8-3.5 3.5S7 16 8.5 16M15.5 8c1.8 0 3.5.8 3.5 3.5S17 16 15.5 16M8.5 8c1.2 0 2.5.8 3.5 2M15.5 8c-1.2 0-2.5.8-3.5 2"/></Svg>,
  Brain: p => <Svg {...p}><path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 1.4-.8 2.5-1.8 3.2v2.3a1.8 1.8 0 0 1-3.4 0v-2.3c-1-.7-1.8-1.8-1.8-3.2A3.5 3.5 0 0 1 12 5zM12 5v14"/></Svg>,
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
  LogOut: p => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>,
  Navigation: p => <Svg {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></Svg>,
  Phone: p => <Svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></Svg>,
  ChevronRight: p => <Svg {...p} sw={2.5}><polyline points="9 18 15 12 9 6"/></Svg>,
  ChevronLeft: p => <Svg {...p} sw={2.5}><polyline points="15 18 9 12 15 6"/></Svg>,
  X: p => <Svg {...p} sw={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  Sparkles: p => <Svg {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z"/></Svg>,
  Eye: p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>,
  Download: p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>,
  Send: p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>,
  Check: p => <Svg {...p}><circle cx="12" cy="12" r="9.5"/><polyline points="8 12 10.5 14.5 16 9"/></Svg>,
  Search: p => <Svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Svg>,
  Hospital: p => <Svg {...p}><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM12 8v8M8 12h8"/></Svg>,
  Map: p => <Svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Svg>,
  Star: p => <Svg {...p}><polygon points="12 2.5 15.1 8.8 22 9.8 17 14.6 18.2 21.5 12 18.3 5.8 21.5 7 14.6 2 9.8 8.9 8.8"/></Svg>,
  Users: p => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  AlertTriangle: p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
  FileText: p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Svg>,
  Image: p => <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Svg>,
  BarChart: p => <Svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></Svg>,
  Book: p => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>,
  Video: p => <Svg {...p}><rect x="2" y="5" width="14" height="14" rx="2"/><polyline points="16 9 22 5 22 19 16 15"/></Svg>,
  Camera: p => <Svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Svg>,
  TrendingUp: p => <Svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>,
  TrendingDown: p => <Svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Svg>,
  Layers: p => <Svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Svg>,
  Target: p => <Svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Svg>,
  Award: p => <Svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Svg>,
  Zap: p => <Svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>,
  PieChart: p => <Svg {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></Svg>,
  Grid: p => <Svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></Svg>,
  Filter: p => <Svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Svg>,
  MoreHorizontal: p => <Svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Svg>,
  ArrowUpRight: p => <Svg {...p}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></Svg>,
  ArrowDownRight: p => <Svg {...p}><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></Svg>,
  Minus: p => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  Plus: p => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
};

const getDisplayName = (fullName) => {
  if (!fullName) return "Médecin";
  const cleanName = fullName.trim();
  if (/^dr[.\s]/i.test(cleanName)) return cleanName;
  return `Dr. ${cleanName}`;
};

const getFirstName = (fullName) => {
  if (!fullName) return "Médecin";
  const cleanName = fullName.replace(/^dr[.\s]+/i, "").trim();
  return cleanName.split(" ")[0];
};

const MODEL_CONFIG = {
  brain:  { label: "IRM Cérébrale", color: "#8B5CF6", icon: <I.Brain size={18} />, bg: "rgba(139,92,246,0.08)" },
  lung:   { label: "Scanner CT",    color: "#EC4899", icon: <I.Scan size={18} />, bg: "rgba(236,72,153,0.08)" },
  chest:  { label: "Radio Thorax",  color: "#3B82F6", icon: <I.Lungs size={18} />, bg: "rgba(59,130,246,0.08)" },
  retina: { label: "Fond d&apos;œil",    color: "#06B6D4", icon: <I.Eye size={18} />, bg: "rgba(6,182,212,0.08)" },
};

const STATUS_CONFIG = {
  pending:  { label: "En attente", color: "#F59E0B", bg: "#FFFBEB", icon: <I.Clock size={12} /> },
  accepted: { label: "En cours",   color: "#3B82F6", bg: "#EFF6FF", icon: <I.Check size={12} /> },
  analyzed: { label: "Résultats",  color: "#10B981", bg: "#ECFDF5", icon: <I.Check size={12} /> },
  closed:   { label: "Terminé",   color: "#6B7280", bg: "#F9FAFB", icon: <I.Shield size={12} /> },
};

const URGENCY_CONFIG = {
  critical: { label: "CRITIQUE", color: "#EF4444", bg: "#FEE2E2" },
  urgent:   { label: "URGENT",   color: "#F59E0B", bg: "#FEF3C7" },
  normal:   { label: "NORMAL",   color: "#10B981", bg: "#D1FAE5" },
};

const CHART_COLORS = {
  primary: "#D4A500", secondary: "#3B82F6", success: "#10B981",
  danger: "#EF4444", warning: "#F59E0B", info: "#06B6D4",
  purple: "#8B5CF6", pink: "#EC4899", navy: "#0A1628", gold: "#FFD700",
};

const Particles = () => {
  const p = useMemo(() => Array.from({length:35}, (_,i) => ({ id:i, left:`${Math.random()*100}%`, w:`${Math.random()*3+1}px`, h:`${Math.random()*3+1}px`, dur:`${Math.random()*14+8}s`, delay:`${Math.random()*10}s`, bottom:`-${Math.random()*40}px`, glow:i%5===0 })), []);
  return <div className="pd3-hero-particles">{p.map(x => <div key={x.id} className="pd3-particle" style={{left:x.left,width:x.w,height:x.h,animationDuration:x.dur,animationDelay:x.delay,bottom:x.bottom,boxShadow:x.glow?'0 0 10px rgba(255,215,0,0.6)':'none'}} />)}</div>;
};

const Reveal = ({ children, delay=0 }) => (
  <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-50px"}} transition={{duration:.65,delay,ease:[.22,.61,.36,1]}}>{children}</motion.div>
);

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className="pd3-badge" style={{background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}30`}}>{cfg.icon} {cfg.label}</span>;
};

const ConsultationCard = ({ consultation, onClick, onAccept, onReject, actionLoading, compact }) => {
  const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;

  // Utiliser la prédiction de l'analyse si disponible, sinon l'urgence de la consultation
  const hasAnalysis = consultation.status === "analyzed" && consultation.prediction;
  const displayPrediction = hasAnalysis ? consultation.prediction : (consultation.urgency || "normal");

  // Déterminer l'urgence d'affichage basée sur la prédiction réelle
  const severePreds = ["Severe", "severe", "critical", "Critical", "malignant", "glioma", "COVID", "Pneumonia", "Pneumothorax", "Edema", "Mass", "Viral Pneumonia"];
  const mediumPreds = ["meningioma", "Cardiomegaly", "Emphysema", "Nodule", "Lung_Opacity", "pituitary", "Moderate", "moderate"];

  let urgency;
  if (hasAnalysis) {
    // Si on a une analyse, afficher la prédiction réelle avec la bonne couleur
    if (severePreds.includes(displayPrediction)) {
      urgency = URGENCY_CONFIG.critical;
    } else if (mediumPreds.includes(displayPrediction)) {
      urgency = URGENCY_CONFIG.urgent;
    } else {
      urgency = URGENCY_CONFIG.normal;
    }
  } else {
    urgency = URGENCY_CONFIG[consultation.urgency] || URGENCY_CONFIG.normal;
  }

  const isPending = consultation.status === "pending";

  return (
    <motion.div onClick={onClick} whileHover={{x:4}} style={{
      background:"#fff",borderRadius:16,padding:compact?"14px 16px":"18px 20px",border:"1px solid #E5E7EB",
      borderLeft:`4px solid ${urgency.color}`,cursor:"pointer",display:"flex",
      alignItems:"center",gap:compact?12:14,transition:"all 0.2s ease",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{width:compact?40:48,height:compact?40:48,borderRadius:14,background:model.bg,color:model.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{model.icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
          <span style={{fontWeight:700,fontSize:compact?"0.82rem":"0.9rem",color:"#0A1628"}}>{consultation.patient_name}</span>
          <span style={{fontSize:"0.65rem",color:"#8899AA"}}>#{consultation.id}</span>
          <span style={{padding:"2px 8px",borderRadius:12,fontSize:"0.6rem",fontWeight:600,background:urgency.bg,color:urgency.color}}>{urgency.label}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <StatusBadge status={consultation.status}/>
          <span style={{fontSize:"0.7rem",color:"#8899AA"}}>{model.label}</span>
          {consultation.created_at && <span style={{fontSize:"0.65rem",color:"#CBD5E1"}}>
            {(() => { const diff = Math.floor((Date.now()-new Date(consultation.created_at))/60000); return diff<1?"À l&apos;instant":diff<60?`${diff}min`:diff<1440?`${Math.floor(diff/60)}h`:`${Math.floor(diff/1440)}j`; })()}
          </span>}
        </div>
      </div>
      {isPending && onAccept && onReject && (
        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <button type="button" onClick={e=>{e.stopPropagation();onAccept();}} disabled={actionLoading} className="pd3-btn pd3-btn-gold pd3-btn-sm">{actionLoading?"...":"Accepter"}</button>
          <button type="button" onClick={e=>{e.stopPropagation();onReject();}} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{color:"#EF4444",borderColor:"#FCA5A5"}}>Refuser</button>
        </div>
      )}
      {consultation.status === "analyzed" && (
        <div style={{padding:"4px 12px",background:"#ECFDF5",borderRadius:20,fontSize:"0.68rem",fontWeight:700,color:"#059669",flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
          <I.Check size={12} color="#059669"/> Résultats
        </div>
      )}
    </motion.div>
  );
};

const MessageBubble = ({ message, isDoctor }) => {
  const isMine = (isDoctor && message.sender_role === "Medecin") || (!isDoctor && message.sender_role === "Patient");
  const time = new Date(message.created_at).toLocaleTimeString("fr-FR", {hour:"2-digit",minute:"2-digit"});
  return (
    <div style={{display:"flex",justifyContent:isMine?"flex-end":"flex-start",marginBottom:6}}>
      <div style={{maxWidth:"75%",padding:"10px 14px",borderRadius:isMine?"14px 14px 4px 14px":"14px 14px 14px 4px",background:isMine?"rgba(255,215,0,0.15)":"rgba(255,255,255,0.08)",color:"#fff",fontSize:"0.84rem",lineHeight:1.5}}>
        {!isMine && <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)",marginBottom:3,fontWeight:600}}>{message.sender_name}</div>}
        {message.content}
        <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)",marginTop:4,textAlign:"right"}}>{time}</div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        fontSize: "0.8rem",
      }}>
        <p style={{ color: "#0A1628", fontWeight: 700, marginBottom: 8 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, display: "inline-block" }} />
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const WeeklyActivityChart = ({ data }) => (
  <div style={{ width: "100%", height: 280 }}>
    <ResponsiveContainer>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorConsultations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem", paddingTop: 10 }} />
        <Area type="monotone" dataKey="consultations" name="Consultations" stroke={CHART_COLORS.primary} strokeWidth={2.5} fill="url(#colorConsultations)" />
        <Area type="monotone" dataKey="analyses" name="Analyses IA" stroke={CHART_COLORS.success} strokeWidth={2.5} fill="url(#colorAnalyses)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const PathologyDistributionChart = ({ data }) => {
  const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success, CHART_COLORS.purple, CHART_COLORS.pink, CHART_COLORS.info];
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "0.75rem", paddingLeft: 20 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const MonthlyPerformanceChart = ({ data }) => (
  <div style={{ width: "100%", height: 280 }}>
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem", paddingTop: 10 }} />
        <Bar dataKey="traites" name="Traités" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="urgents" name="Urgents" fill={CHART_COLORS.danger} radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="analyses" name="Analysés" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const DomainRadarChart = ({ data }) => (
  <div style={{ width: "100%", height: 300 }}>
    <ResponsiveContainer>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="rgba(0,0,0,0.08)" />
        <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} />
        <Radar name="Précision IA" dataKey="accuracy" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.15} strokeWidth={2.5} />
        <Radar name="Volume" dataKey="volume" stroke={CHART_COLORS.secondary} fill={CHART_COLORS.secondary} fillOpacity={0.1} strokeWidth={2} strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem", paddingTop: 10 }} />
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

const ConfidenceTrendChart = ({ data }) => (
  <div style={{ width: "100%", height: 260 }}>
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem", paddingTop: 10 }} />
        <Line type="monotone" dataKey="chest" name="Thorax" stroke={CHART_COLORS.secondary} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.secondary }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="brain" name="Cérébral" stroke={CHART_COLORS.purple} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.purple }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="lung" name="Poumon" stroke={CHART_COLORS.pink} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.pink }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="retina" name="Rétine" stroke={CHART_COLORS.info} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.info }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const HourlyDistributionChart = ({ data }) => (
  <div style={{ width: "100%", height: 260 }}>
    <ResponsiveContainer>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
        <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Consultations" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={35} opacity={0.8} />
        <Line type="monotone" dataKey="avgTime" name="Temps moyen (min)" stroke={CHART_COLORS.danger} strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const AnalyticsDashboard = ({ stats, assigned, queue, userDomains }) => {
  const weeklyData = useMemo(() => [
    { day: "Lun", consultations: 12, analyses: 8 },
    { day: "Mar", consultations: 18, analyses: 14 },
    { day: "Mer", consultations: 15, analyses: 11 },
    { day: "Jeu", consultations: 22, analyses: 18 },
    { day: "Ven", consultations: 19, analyses: 15 },
    { day: "Sam", consultations: 8, analyses: 6 },
    { day: "Dim", consultations: 5, analyses: 3 },
  ], []);

  const pathologyData = useMemo(() => {
    const pathologies = {};
    assigned.forEach(c => {
      if (c.prediction) {
        pathologies[c.prediction] = (pathologies[c.prediction] || 0) + 1;
      }
    });
    if (Object.keys(pathologies).length === 0) {
      return [
        { name: "Normal", value: 35 },
        { name: "Pneumonie", value: 20 },
        { name: "COVID-19", value: 15 },
        { name: "Tumeur", value: 12 },
        { name: "Fracture", value: 10 },
        { name: "Autre", value: 8 },
      ];
    }
    return Object.entries(pathologies).map(([name, value]) => ({ name, value }));
  }, [assigned]);

  const monthlyData = useMemo(() => [
    { month: "Jan", traites: 45, urgents: 8, analyses: 38 },
    { month: "Fév", traites: 52, urgents: 12, analyses: 44 },
    { month: "Mar", traites: 48, urgents: 6, analyses: 41 },
    { month: "Avr", traites: 61, urgents: 15, analyses: 53 },
    { month: "Mai", traites: 55, urgents: 9, analyses: 47 },
    { month: "Juin", traites: 67, urgents: 11, analyses: 58 },
  ], []);

  const domainRadarData = useMemo(() => {
    const domains = userDomains.length > 0 ? userDomains : ["chest", "brain", "lung", "retina"];
    const labels = { chest: "Thorax", brain: "Cérébral", lung: "Poumon", retina: "Rétine" };
    const accuracy = { chest: 97, brain: 96, lung: 95, retina: 93 };
    return domains.map(d => ({
      domain: labels[d] || d,
      accuracy: accuracy[d] || 90,
      volume: Math.floor(Math.random() * 40) + 60,
    }));
  }, [userDomains]);

  const confidenceData = useMemo(() => [
    { date: "01/06", chest: 96.5, brain: 97.2, lung: 94.8, retina: 92.1 },
    { date: "05/06", chest: 97.1, brain: 96.8, lung: 95.2, retina: 93.5 },
    { date: "10/06", chest: 96.8, brain: 97.5, lung: 95.8, retina: 94.2 },
    { date: "15/06", chest: 97.5, brain: 97.0, lung: 96.1, retina: 93.8 },
    { date: "20/06", chest: 97.8, brain: 96.5, lung: 96.5, retina: 94.5 },
    { date: "25/06", chest: 98.1, brain: 97.8, lung: 96.8, retina: 95.1 },
  ], []);

  const hourlyData = useMemo(() => [
    { hour: "8h", count: 5, avgTime: 12 },
    { hour: "9h", count: 12, avgTime: 15 },
    { hour: "10h", count: 18, avgTime: 18 },
    { hour: "11h", count: 15, avgTime: 14 },
    { hour: "12h", count: 8, avgTime: 10 },
    { hour: "14h", count: 14, avgTime: 16 },
    { hour: "15h", count: 20, avgTime: 20 },
    { hour: "16h", count: 16, avgTime: 17 },
    { hour: "17h", count: 10, avgTime: 13 },
    { hour: "18h", count: 6, avgTime: 11 },
  ], []);

  const kpiCards = [
    { title: "Taux de réponse", value: "94.2%", change: "+2.4%", trend: "up", icon: I.Zap, color: CHART_COLORS.success, bg: "rgba(16,185,129,0.08)" },
    { title: "Temps moyen", value: "14.3 min", change: "-1.2 min", trend: "down", icon: I.Clock, color: CHART_COLORS.primary, bg: "rgba(212,165,0,0.08)" },
    { title: "Précision IA", value: "97.8%", change: "+0.5%", trend: "up", icon: I.Target, color: CHART_COLORS.secondary, bg: "rgba(59,130,246,0.08)" },
    { title: "Satisfaction", value: "4.8/5", change: "+0.3", trend: "up", icon: I.Award, color: CHART_COLORS.purple, bg: "rgba(139,92,246,0.08)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {kpiCards.map((kpi, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}
              style={{
                background: "#fff", borderRadius: 20, padding: "20px",
                border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: kpi.bg, color: kpi.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <kpi.icon size={20} />
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 20,
                  background: kpi.trend === "up" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  color: kpi.trend === "up" ? "#10B981" : "#EF4444",
                  fontSize: "0.75rem", fontWeight: 700,
                }}>
                  {kpi.trend === "up" ? <I.TrendingUp size={12} /> : <I.TrendingDown size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 500 }}>{kpi.title}</div>
            </motion.div>
          ))}
        </div>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        <Reveal delay={0.1}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Activité hebdomadaire</h3>
                <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Consultations et analyses sur 7 jours</p>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(212,165,0,0.1)", color: "#D4A500", fontSize: "0.7rem", fontWeight: 600 }}>Cette semaine</span>
            </div>
            <WeeklyActivityChart data={weeklyData} />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Pathologies détectées</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Distribution des diagnostics IA</p>
            </div>
            <PathologyDistributionChart data={pathologyData} />
          </div>
        </Reveal>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Reveal delay={0.2}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Performance mensuelle</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Dossiers traités par mois</p>
            </div>
            <MonthlyPerformanceChart data={monthlyData} />
          </div>
        </Reveal>
        <Reveal delay={0.25}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Compétences par domaine</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Précision et volume par spécialité</p>
            </div>
            <DomainRadarChart data={domainRadarData} />
          </div>
        </Reveal>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Reveal delay={0.3}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Tendance de confiance IA</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Évolution de la précision par modèle</p>
            </div>
            <ConfidenceTrendChart data={confidenceData} />
          </div>
        </Reveal>
        <Reveal delay={0.35}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Distribution horaire</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Volume et temps moyen par heure</p>
            </div>
            <HourlyDistributionChart data={hourlyData} />
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.4}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Résumé détaillé</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Métriques clés de performance</p>
            </div>
            <button type="button" className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <I.Download size={14} /> Exporter
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Consultations totales", value: stats.queue + stats.active + stats.analyzed + stats.closed, icon: I.Folder, color: CHART_COLORS.primary },
              { label: "Taux d'acceptation", value: "87.3%", icon: I.Check, color: CHART_COLORS.success },
              { label: "Temps moyen d'analyse", value: "4.2 min", icon: I.Zap, color: CHART_COLORS.warning },
              { label: "Urgences traitées", value: stats.critical, icon: I.AlertTriangle, color: CHART_COLORS.danger },
              { label: "Patients satisfaits", value: "96.4%", icon: I.Star, color: CHART_COLORS.purple },
              { label: "Rapports générés", value: stats.analyzed, icon: I.FileText, color: CHART_COLORS.info },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: 14, background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${item.color}15`, color: item.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0A1628" }}>{item.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
};

const AnalysisSection = ({ analysis, analysisLoading, explainText, explaining, onRunAnalysis, onDownloadPDF, consultationData, model }) => {
  const probabilities = useMemo(() => {
    if (!analysis?.probabilities) return [];
    let p = analysis.probabilities;
    if (typeof p === "string") { try { p = JSON.parse(p); } catch { return []; } }
    return Object.entries(p).sort(([,a],[,b]) => b - a);
  }, [analysis]);

  if (!consultationData) {
    return (
      <div className="pd3-health-card" style={{ display: "flex", flexDirection: "column", height: "auto", minHeight: "500px" }}>
        <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: 40 }}>
          <I.Brain size={52} color="rgba(255,215,0,0.3)" />
          <div style={{ marginTop: 16, fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Sélectionnez une consultation</div>
          <div style={{ marginTop: 8, fontSize: "0.82rem" }}>Acceptez ou ouvrez une consultation pour lancer l&apos;analyse IA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pd3-health-card" style={{ display: "flex", flexDirection: "column", height: "650px", minHeight: "650px", overflow: "hidden" }}>
      <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
      <div className="pd3-health-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <I.Brain size={20} color="#FFD700"/>
            <span style={{ fontWeight: 700, color: "#FFD700", fontSize: "1rem" }}>Analyse IA</span>
            {analysis && !analysisLoading && <span className="pd3-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "0.65rem" }}>Complète</span>}
          </div>
          {analysis && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{model?.label}</span>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", minHeight: 0 }}>
          {analysisLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                <I.Sparkles size={48} color="#FFD700"/>
              </motion.div>
              <div style={{ marginTop: 20, color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>Analyse en cours...</div>
            </div>
          ) : analysis ? (
            <>
              <div style={{ padding: 18, background: "rgba(16,185,129,0.08)", borderRadius: 16, border: "1px solid rgba(16,185,129,0.2)", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <I.Check size={18} color="#10B981"/>
                  <span style={{ fontWeight: 700, color: "#10B981", fontSize: "1rem" }}>Diagnostic : {analysis.prediction}</span>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Confiance</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>{(analysis.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                    <motion.div style={{ height: "100%", background: "linear-gradient(90deg,#10B981,#34D399)", borderRadius: 4 }} initial={{ width: 0 }} animate={{ width: `${analysis.confidence * 100}%` }} transition={{ duration: 1, delay: .3 }} />
                  </div>
                </div>
              </div>

              {probabilities.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Distribution des probabilités</div>
                  {probabilities.slice(0, 5).map(([cls, prob], idx) => (
                    <div key={cls} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.8rem", color: cls === analysis.prediction ? "#10B981" : "rgba(255,255,255,0.6)", fontWeight: cls === analysis.prediction ? 700 : 400 }}>
                          {cls === analysis.prediction && "▶ "}{cls}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                        <motion.div style={{ height: "100%", background: cls === analysis.prediction ? "#10B981" : "rgba(255,255,255,0.2)", borderRadius: 3 }} initial={{ width: 0 }} animate={{ width: `${(prob / Math.max(...probabilities.map(([, p]) => p))) * 100}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {explainText && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <I.Brain size={14} color="#FFD700"/> Explication clinique IA
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px", border: "1px solid rgba(255,215,0,0.15)", fontSize: "0.85rem", lineHeight: "1.7", color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" }}>
                    {explainText.split('\n').map((line, i) => (
                      line.startsWith('##') ? (
                        <div key={i} style={{ fontWeight: 700, color: "#FFD700", marginTop: 12, marginBottom: 6 }}>{line.replace('## ', '')}</div>
                      ) : (
                        <div key={i} style={{ marginBottom: 4 }}>{line}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {explaining && (
                <div style={{ display: "flex", gap: 6, padding: "12px 0", justifyContent: "center" }}>
                  {[0, 0.15, 0.3].map((d, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFD700", animation: `typing 1s ease-in-out ${d}s infinite` }}/>
                  ))}
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", marginLeft: 8 }}>Génération de l'explication...</span>
                </div>
              )}
            </>
          ) : ["accepted", "analyzed"].includes(consultationData?.status) ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <I.Brain size={56} color="rgba(255,215,0,0.4)" style={{ marginBottom: 20 }}/>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
                {consultationData?.status === "analyzed" ? "Analyse déjà effectuée" : "Prêt pour l'analyse"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                {consultationData?.status === "analyzed"
                  ? "Une analyse existe déjà. Vous pouvez relancer pour mettre à jour."
                  : "Lancez l'analyse IA pour obtenir le diagnostic automatique."}
              </div>
              <button type="button" onClick={onRunAnalysis} className="pd3-btn pd3-btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 28px" }}>
                <I.Sparkles size={18}/> {consultationData?.status === "analyzed" ? "Relancer l&apos;analyse" : "Lancer l&apos;analyse IA"}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
              <I.Clock size={48} style={{ marginBottom: 16 }}/>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Consultation en attente</div>
              <div style={{ fontSize: "0.8rem", marginTop: 8 }}>Acceptez d'abord la consultation pour lancer l'analyse</div>
            </div>
          )}
        </div>

        {analysis && (
          <div style={{ paddingTop: 16, borderTop: "1px solid rgba(232,184,48,0.1)", flexShrink: 0, marginTop: "auto" }}>
            <button type="button" onClick={onDownloadPDF} disabled={explaining} className="pd3-btn pd3-btn-gold" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px", fontSize: "0.85rem", fontWeight: 700, opacity: explaining ? 0.65 : 1, cursor: explaining ? "not-allowed" : "pointer" }}>
              <I.Download size={18}/> {explaining ? "Attente explication IA..." : "Télécharger le rapport PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatSection = ({ consultationData, messages, msgInput, setMsgInput, onSend, canMessage, onClose, model, loading }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!consultationData) {
    return (
      <div className="pd3-health-card" style={{ display: "flex", flexDirection: "column", height: "auto", minHeight: "600px", alignItems: "center", justifyContent: "center" }}>
        <I.Message size={52} color="rgba(255,255,255,0.25)" />
        <div style={{fontSize:"1rem",fontWeight:700,marginTop:16,color:"rgba(255,255,255,0.65)"}}>Aucune consultation selectionnee</div>
        <div style={{fontSize:"0.85rem",marginTop:8,maxWidth:360,lineHeight:1.5}}>Selectionnez une consultation ou acceptez une demande pour ouvrir les messages et lancer l'analyse IA.</div>
      </div>
    );
  }

  return (
    <div className="pd3-health-card" style={{ display: "flex", flexDirection: "column", height: "650px", minHeight: "650px", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(232,184,48,0.1)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {model?.icon || <I.Scan size={20} color="#FFD700"/>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>{consultationData.patient_name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>#{consultationData.id}</span>
            <StatusBadge status={consultationData.status}/>
          </div>
        </div>
        {canMessage && (
          <div style={{ display: "flex", gap: 8 }}>
            <VideoCallButton consultationId={consultationData?.id} consultationStatus={consultationData?.status} consultation={consultationData} />
            <button type="button" onClick={onClose} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
              <I.Shield size={14}/> Clôturer
            </button>
          </div>
        )}
      </div>

      <div ref={messagesContainerRef} style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minHeight: "480px", maxHeight: "480px" }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <I.Message size={56} style={{ marginBottom: 20 }}/>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Aucun message</div>
            <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Commencez la discussion avec le patient</div>
          </div>
        ) : (
          messages.map(m => <MessageBubble key={m.id} message={m} isDoctor={true}/>)
        )}
      </div>

      {canMessage ? (
        <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(232,184,48,0.1)", display: "flex", gap: 14, flexShrink: 0, background: "rgba(0,0,0,0.1)" }}>
          <textarea 
            value={msgInput} 
            onChange={e => setMsgInput(e.target.value)} 
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }}}
            placeholder="Écrire un message au patient... (Shift+Enter pour retour à la ligne)"
            rows={3}
            style={{ flex: 1, padding: "14px 18px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", outline: "none", fontFamily: "inherit", fontSize: "0.9rem", resize: "vertical", minHeight: "70px", maxHeight: "120px" }} 
          />
          <button type="button" onClick={onSend} disabled={!msgInput.trim()} className="pd3-btn pd3-btn-gold pd3-btn-sm" style={{ width: 60, height: 60, minWidth: 60, padding: 0, borderRadius: 18, alignSelf: "flex-end" }}>
            <I.Send size={20}/>
          </button>
        </div>
      ) : (
        <div style={{ padding: "18px 24px", background: "rgba(0,0,0,0.1)", borderTop: "1px solid rgba(232,184,48,0.1)", fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", textAlign: "center", flexShrink: 0 }}>
          Messages disponibles après acceptation de la consultation
        </div>
      )}
    </div>
  );
};

const AppointmentModal = ({ isOpen, onClose, consultation, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: "#fff", borderRadius: 28, padding: 32, maxWidth: 500, width: "100%" }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>Planifier un rendez-vous</h2>
        <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: 24 }}>Patient : {consultation?.patient_name}</p>
        <div style={{ marginBottom: 16 }}>
          <input type="datetime-local" onChange={e => setSelectedDate(new Date(e.target.value))} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: "0.9rem" }} />
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={3} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1.5px solid #E2E8F0", fontSize: "0.85rem", marginBottom: 16, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={onClose} className="pd3-btn pd3-btn-outline" style={{ flex: 1 }}>Annuler</button>
          <button type="button" onClick={() => { setLoading(true); onConfirm(selectedDate, selectedTime, notes); setLoading(false); onClose(); }} disabled={loading || !selectedDate} className="pd3-btn pd3-btn-gold" style={{ flex: 1 }}>{loading ? "..." : "Confirmer"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const VideoCallButton = ({ consultationId, consultationStatus, consultation }) => {
  const [hasAppointment, setHasAppointment] = useState(false);
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const checkAppointment = async () => {
      const token = localStorage.getItem("medai-token");
      if (!token || !consultationId) return;
      try {
        const res = await fetch(`${API}/consultations/${consultationId}/appointment`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.appointment) { setHasAppointment(true); setAppointmentTime(data.appointment.scheduled_at); }
        }
      } catch (err) { console.error(err); }
    };
    checkAppointment();
  }, [consultationId]);

  const canCall = consultationId && (consultationStatus === "accepted" || consultationStatus === "analyzed") && hasAppointment;
  const isAppointmentTime = appointmentTime && new Date(appointmentTime) <= new Date();

  const startVideoCall = () => {
    if (!consultationId) { alert("Aucune consultation selectionnee"); return; }
    if (!hasAppointment) { alert("Veuillez d'abord planifier un rendez-vous"); return; }
    if (!isAppointmentTime) { alert(`Rendez-vous prevu pour ${new Date(appointmentTime).toLocaleString("fr-FR")}`); return; }
    setIsJoining(true);
    window.open(`/video-consultation/${consultationId}?room=medai-${consultationId}`, "_blank");
    setTimeout(() => setIsJoining(false), 1000);
  };

  const scheduleAppointment = async (date, time, notes) => {
    const token = localStorage.getItem("medai-token");
    const res = await fetch(`${API}/consultations/${consultationId}/appointment`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at: date?.toISOString(), notes, type: "video" })
    });
    if (res.ok) { setHasAppointment(true); setAppointmentTime(date); alert("Rendez-vous planifie"); }
    else alert("Erreur");
  };

  const canSchedule = consultationId && (consultationStatus === "accepted" || consultationStatus === "analyzed") && !hasAppointment;

  return (
    <>
      {canSchedule && (
        <motion.button type="button" onClick={() => setShowAppointmentModal(true)} className="pd3-btn"
          style={{ background: "linear-gradient(135deg, #D4A500, #B8941E)", color: "#fff", padding: "10px 20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <I.Calendar size={18} /> Planifier
        </motion.button>
      )}
      {hasAppointment && (
        <motion.button type="button" onClick={startVideoCall} disabled={!isAppointmentTime || isJoining} className="pd3-btn"
          style={{ background: !isAppointmentTime ? "rgba(100,116,139,0.15)" : "linear-gradient(135deg, #059669, #10B981)", color: !isAppointmentTime ? "rgba(255,255,255,0.4)" : "#fff", padding: "10px 20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", fontWeight: 600, cursor: !isAppointmentTime ? "not-allowed" : "pointer" }}
          whileHover={isAppointmentTime ? { scale: 1.02 } : {}} whileTap={isAppointmentTime ? { scale: 0.98 } : {}}>
          {!isAppointmentTime ? <I.Clock size={18} /> : <I.Video size={18} />}
          {!isAppointmentTime ? new Date(appointmentTime).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Appel video"}
        </motion.button>
      )}
      <AppointmentModal isOpen={showAppointmentModal} onClose={() => setShowAppointmentModal(false)} consultation={consultation} onConfirm={scheduleAppointment} />
    </>
  );
};

const CIM11Section = ({ user }) => {
  const [showChatbot, setShowChatbot] = useState(true);
  return (
    <div style={{ height: "auto", minHeight: "500px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,215,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I.Book size={22} color="#FFD700" />
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0A1628" }}>Assistant CIM-11</h2>
          <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Classification internationale des maladies (OMS)</p>
        </div>
        <button type="button" onClick={() => setShowChatbot(!showChatbot)} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{ marginLeft: "auto" }}>
          {showChatbot ? "Masquer" : "Afficher"}
        </button>
      </div>
      {showChatbot && <CIM11Chatbot doctor={user} height="500px" minHeight="400px" />}
    </div>
  );
};

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("medai-token");

  const displayName = getDisplayName(user?.full_name);
  const firstName = getFirstName(user?.full_name);

  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [queue, setQueue] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationData, setConsultationData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explaining, setExplaining] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  // === AJOUTER APRÈS la ligne 890 (après tous les useState) ===
const tokenRef = useRef(token);
useEffect(() => { tokenRef.current = token; }, [token]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const sY = useSpring(heroY, { stiffness: 80, damping: 25 });

  const userDomains = (user?.domains || []);

  useEffect(() => { const h = new Date().getHours(); setGreeting(h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir"); }, []);
  useEffect(() => { const i = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(i); }, []);
  useEffect(() => { const h = () => setIsScrolled(window.scrollY > 40); window.addEventListener("scroll",h,{passive:true}); return () => window.removeEventListener("scroll",h); }, []);
  useEffect(() => { const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false); }; document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h); }, []);

   const fetchAll = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken) { setLoading(false); return; }
    try {
      const [qRes, aRes, nRes] = await Promise.all([
        fetch(`${API}/consultations/queue`, { headers: { Authorization: `Bearer ${currentToken}` } }),
        fetch(`${API}/consultations/assigned`, { headers: { Authorization: `Bearer ${currentToken}` } }),
        fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers: { Authorization: `Bearer ${currentToken}` } }),
      ]);
      if (qRes.ok) setQueue((await qRes.json()).consultations || []);
      if (aRes.ok) setAssigned((await aRes.json()).consultations || []);
      if (nRes.ok) setNotifications((await nRes.json()).notifications || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchAll();
    const i = setInterval(fetchAll, 30000);
    return () => clearInterval(i);
  }, [fetchAll, token]);

  useEffect(() => {
    if (!selectedConsultation || !token) { setConsultationData(null); setMessages([]); setAnalysis(null); setExplainText(""); return; }
    fetch(`${API}/consultations/${selectedConsultation}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setConsultationData(d.consultation); setMessages(d.messages || []); setAnalysis(d.analysis || null); setExplainText(d.analysis?.explain_text || ""); } })
      .catch(e => console.error(e));
  }, [selectedConsultation, token]);

    // ═══════════════════════════════════════════
  // NOTIFICATIONS CRITIQUES — SVG Overlay
  // ═══════════════════════════════════════════
  const { 
    criticalNotifications, 
    criticalCount, 
    markAsRead, 
    markAllAsRead,
    refetch: refetchCritical 
  } = useCriticalNotifications("doctor");

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/consultations/${id}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text() || `Erreur ${res.status}`);
      setConsultationData(null); setAnalysis(null); setExplainText(""); setMessages([]); setActiveTab("messages");
      setSelectedConsultation(null);
      setTimeout(() => setSelectedConsultation(id), 100);
      fetchAll();
    } catch (e) { alert("Impossible d'accepter: " + e.message); } finally { setActionLoading(null); }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/consultations/${id}/reject`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: new URLSearchParams({ reason: "" }) });
      if (!res.ok) throw new Error(await res.text());
      fetchAll();
    } catch (e) { alert("Erreur: " + e.message); } finally { setActionLoading(null); }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;

    // Le backend attend du FormData, pas du JSON
    const formData = new FormData();
    formData.append("content", msgInput.trim());
    formData.append("msg_type", "text");

    await fetch(`${API}/consultations/${selectedConsultation}/messages`, { 
      method: "POST", 
      headers: { Authorization: `Bearer ${token}` },  // Ne PAS mettre Content-Type, le navigateur le gère pour FormData
      body: formData 
    });
    setMsgInput("");

    // Rafraîchir les messages
    const r = await fetch(`${API}/consultations/${selectedConsultation}`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const data = await r.json();
      setMessages(data.messages || []);
      if (data.consultation) setConsultationData(data.consultation);
      if (data.analysis) setAnalysis(data.analysis);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true); setExplainText(""); setExplaining(false); setAnalysis(null);
    try {
      const res = await fetch(`${API}/consultations/${selectedConsultation}/run-analysis?gradcam=true`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `Erreur ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullExplain = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const evt = JSON.parse(jsonStr);
            if (evt.type === "prediction") {
              setAnalysis({ prediction: evt.prediction, confidence: evt.confidence, probabilities: JSON.stringify(evt.probabilities || {}), gradcam_b64: evt.gradcam_image || "", out_of_domain: evt.out_of_domain || false, warning: evt.warning || "", explain_text: "" });
              setAnalysisLoading(false);
              if (!evt.out_of_domain) setExplaining(true);
            }
            if (evt.type === "explain_chunk") { fullExplain += evt.text; setExplainText(fullExplain); }
            if (evt.type === "saved") setExplaining(false);
            if (evt.type === "error" || evt.type === "save_error") { console.error(evt); setExplaining(false); }
          } catch (_) {}
        }
      }
      await new Promise(r => setTimeout(r, 500));
      const dR = await fetch(`${API}/consultations/${selectedConsultation}`, { headers: { Authorization: `Bearer ${token}` } });
      if (dR.ok) {
        const d = await dR.json();
        if (d.analysis) { setAnalysis(d.analysis); if (d.analysis.explain_text) setExplainText(d.analysis.explain_text); }
        if (d.consultation) setConsultationData(d.consultation);
        setMessages(d.messages || []);
      }
    } catch (e) { alert("Erreur analyse: " + e.message); } finally { setAnalysisLoading(false); setExplaining(false); fetchAll(); }
  };

  const handleDownloadPDF = async () => {
    if (!analysis || !consultationData) return;
    if (explaining) { alert("Veuillez attendre la fin de l'explication IA."); return; }
    setPdfLoading(true);
    try {
      let imageBlob = null;
      const imagePath = consultationData.image_path;
      const possiblePaths = [
        `http://localhost:8000/uploads/${imagePath?.split('/').pop()}`,
        `http://localhost:8000/${imagePath}`,
        `http://localhost:8000/uploads/consultations/${imagePath?.split('/').pop()}`,
      ];
      for (const path of possiblePaths) {
        try {
          const imgRes = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
          if (imgRes.ok) { imageBlob = await imgRes.blob(); break; }
        } catch (err) {}
      }
      if (!imageBlob) {
        const defaultImgRes = await fetch("https://placehold.co/800x600/e2e8f0/475569?text=Radiographie");
        if (defaultImgRes.ok) imageBlob = await defaultImgRes.blob();
      }
      const form = new FormData();
      form.append("file", new File([imageBlob], "radiographie.jpg", { type: "image/jpeg" }));
      form.append("explain_text", explainText || analysis.explain_text || "");
      form.append("gradcam_image", analysis.gradcam_b64 || "");
      const reportProbabilities = (() => {
        const raw = analysis.probabilities || {};
        if (typeof raw === "string") { try { return JSON.stringify(JSON.parse(raw)); } catch { return "{}"; } }
        return JSON.stringify(raw);
      })();
      const params = new URLSearchParams({
        model: consultationData.model_key || "chest",
        patient_id: consultationData.patient_name || "Patient",
        prediction: analysis.prediction,
        confidence: String(analysis.confidence || 0),
        probabilities: reportProbabilities,
        report_id: `MEDAI-${Date.now().toString(36).toUpperCase()}`
      });
      const res = await fetch(`${API}/report?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!res.ok) throw new Error(await res.text());
      const pdfBlob = await res.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a"); a.href = url; a.download = `rapport_medical_${consultationData.id}_${new Date().toISOString().slice(0,19)}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert("Erreur PDF: " + e.message); } finally { setPdfLoading(false); }
  };

  const handleClose = async () => {
    const form = new FormData(); form.append("doctor_notes", closeNotes);
    await fetch(`${API}/consultations/${selectedConsultation}/close`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    setShowCloseModal(false); setCloseNotes(""); fetchAll();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const model = consultationData ? MODEL_CONFIG[consultationData.model_key] || MODEL_CONFIG.chest : null;
  const canMessage = consultationData && (consultationData.status === "accepted" || consultationData.status === "analyzed");

  const stats = useMemo(() => ({
    queue: queue.length, critical: queue.filter(c=>c.urgency==="critical").length,
    active: assigned.filter(c=>c.status==="accepted"||c.status==="analyzed").length,
    analyzed: assigned.filter(c=>c.status==="analyzed").length,
    closed: assigned.filter(c=>c.status==="closed").length,
  }), [queue, assigned]);

  const getDomainColor = (d) => {
    const colors = { chest: { color: "#2D5F9E", bg: "#EFF6FF" }, brain: { color: "#6B4FA0", bg: "#F5F3FF" }, lung: { color: "#D62828", bg: "#FEF2F2" }, retina: { color: "#0E7490", bg: "#ECFEFF" } };
    return colors[d] || { color: "#64748B", bg: "#F1F5F9" };
  };
  const getDomainIcon = (d) => { const icons = { chest: "🫁", brain: "🧠", lung: "🔬", retina: "👁️" }; return icons[d] || "🏥"; };
  const getDomainLabel = (d) => { const labels = { chest: "Radiologie Thoracique", brain: "Neurologie & IRM", lung: "Cancer Pulmonaire", retina: "Rétinopathie Diabétique" }; return labels[d] || d; };
  const getDomainAccuracy = (d) => { const acc = { chest: "97.3%", brain: "96.2%", lung: "94.8%", retina: "92.1%" }; return acc[d] || "—"; };
  const getDomainClasses = (d) => { const classes = { chest: "10 pathologies", brain: "4 tumeurs", lung: "3 classes", retina: "5 stades DR" }; return classes[d] || "—"; };

  return (
    <div className="pd3">
      {/* NAVIGATION */}
      <motion.nav className={`pd3-nav ${isScrolled?"scrolled":""}`} initial={{y:-80}} animate={{y:0}} transition={{duration:.5,type:"spring",stiffness:100}}>
        <div className="pd3-nav-brand" onClick={()=>navigate("/")}>
          <div className="pd3-nav-logo"><div className="pd3-nav-logo-inner"><I.Lungs size={22} color="#0A1628"/></div></div>
          <span className="pd3-nav-name">Med<span className="accent">AI</span></span>
        </div>
        <div className="pd3-nav-links">
          {[
            {id:"overview",label:"Vue d'ensemble"},
            {id:"consultations",label:"Consultations"},
            {id:"messages",label:"Messages & Analyse"},
            {id:"analytics",label:"Statistiques"},
            {id:"prescriptions",label:"Ordonnances"},
            {id:"reminders",label:"Rappels"},
            {id:"upcoming_calls",label:"Appels"},
            {id:"cim11",label:"CIM-11"}
          ].map(tab=>(
            <button type="button" key={tab.id} className={`pd3-nav-link ${activeTab===tab.id?"active":""}`} onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{tab.label}</button>
          ))}
        </div>
        <div className="pd3-nav-actions">
          <div ref={profileRef} style={{position:"relative"}}>
            <button type="button" className="pd3-btn pd3-btn-outline pd3-btn-sm" onClick={()=>setShowProfileMenu(!showProfileMenu)}>
              <I.User size={15}/> {firstName}
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:240,background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",boxShadow:"0 12px 40px rgba(0,0,0,0.12)",overflow:"hidden",zIndex:1001}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid #F1F5F9",background:"#FAFBFC"}}>
                    <div style={{fontWeight:700,fontSize:"0.88rem",color:"#0A1628"}}>{displayName}</div>
                    <div style={{fontSize:"0.72rem",color:"#8899AA"}}>{user?.specialty}</div>
                    {userDomains.length > 0 && (
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>
                        {userDomains.map(d => {
                          const cfg = getDomainColor(d);
                          return <span key={d} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 6px",borderRadius:6,fontSize:"0.6rem",fontWeight:600,background:cfg.bg,color:cfg.color}}>{getDomainIcon(d)} {d}</span>;
                        })}
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={()=>{setShowProfileMenu(false);logout();navigate("/login");}} style={{width:"100%",padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:"0.82rem",color:"#EF4444",fontWeight:600,fontFamily:"inherit"}}><I.LogOut size={16}/> Déconnexion</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div ref={notifRef} style={{position:"relative"}}>
            <motion.button type="button" className="pd3-btn-icon" onClick={()=>setShowNotif(!showNotif)} whileHover={{scale:1.05}}>
              <I.Bell size={18} color="#fff"/>
              {unreadCount>0 && <span className="pd3-btn-badge">{unreadCount>9?"9+":unreadCount}</span>}
            </motion.button>
            <AnimatePresence>{showNotif&&(<motion.div className="pd3-notif-panel" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><div className="pd3-notif-header"><span className="pd3-notif-title"><I.Bell size={15} color="#D4A500"/> Notifications</span><button type="button" onClick={()=>setShowNotif(false)} className="pd3-notif-action"><I.X size={16}/></button></div><div className="pd3-notif-body" style={{maxHeight:350,overflowY:"auto"}}>{notifications.length===0?<div className="pd3-notif-empty"><I.Bell size={26} color="#D4A500"/><div className="pd3-notif-empty-text">Aucune notification</div></div>:notifications.map(n=><div key={n.id} className="pd3-notif-item" onClick={()=>{try{const d=JSON.parse(n.data||"{}");if(d.consultation_id){setSelectedConsultation(d.consultation_id);setActiveTab("messages")}}catch{}setShowNotif(false)}}><div className="pd3-notif-item-content"><div className="pd3-notif-item-title">{n.title}</div><div className="pd3-notif-item-msg">{n.message?.substring(0,80)}</div></div></div>)}</div></motion.div>)}</AnimatePresence>
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
            <motion.div initial={{opacity:0,y:25}} animate={{opacity:1,y:0}}><div className="pd3-hero-status"><span className="pd3-status-pulse"/><span>ESPACE MÉDECIN</span><span className="pd3-status-sep"/><span>CERTIFIÉ CE MÉDICAL</span></div></motion.div>
            <motion.h1 className="pd3-hero-welcome" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.1}}>{greeting},<br/><span className="highlight">{firstName}</span></motion.h1>
            <motion.div className="pd3-hero-date" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.2}}><I.Calendar size={14} color="rgba(255,255,255,0.5)"/> {currentTime.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})} <span style={{margin:"0 8px",opacity:.3}}>•</span> {currentTime.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</motion.div>
            <motion.p className="pd3-hero-subtitle" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.25}}>
              {user?.specialty||"Spécialiste"} · Gérez vos consultations et analyses médicales
              {userDomains.length > 0 && (
                <span style={{display:"inline-flex",alignItems:"center",gap:6,marginLeft:12,flexWrap:"wrap"}}>
                  {userDomains.map(d => {
                    const cfg = getDomainColor(d);
                    return <span key={d} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:6,fontSize:"0.7rem",fontWeight:600,background:cfg.bg,color:cfg.color}}>{getDomainIcon(d)} {d}</span>;
                  })}
                </span>
              )}
            </motion.p>
            <motion.div className="pd3-hero-actions" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.35}}>
              <button type="button" className="pd3-btn pd3-btn-gold pd3-btn-lg" onClick={()=>setActiveTab("consultations")}><I.Folder size={18}/> File d'attente ({stats.queue})</button>
              <button type="button" className="pd3-btn pd3-btn-outline-light pd3-btn-lg" onClick={()=>navigate("/classification")}><I.Scan size={16}/> Analyse libre</button>
            </motion.div>
          </div>
          <motion.div className="pd3-hero-visual" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{duration:.7,delay:.3}}>
            <div className="pd3-hero-card">
              <div className="pd3-hero-card-header"><span className="pd3-card-title">ANALYSE EN TEMPS RÉEL</span><span className="pd3-card-badge"><span className="pd3-status-pulse"/> IA Active</span></div>
              <div className="pd3-mini-chart">{[35,55,40,70,45,65,80,50,75,60,85,55,70,90,65,50,75,60,80,55].map((h,i)=>(<motion.div key={i} className={`pd3-chart-bar ${i>=14?"highlight":""}`} style={{height:`${h}%`}} initial={{height:0}} animate={{height:`${h}%`}} transition={{delay:.6+i*.04,duration:.5}}/>))}</div>
              <div className="pd3-mini-stats">
                <motion.div className="pd3-mini-stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.8}}><div className="pd3-mini-stat-value">{stats.queue}</div><div className="pd3-mini-stat-label">EN ATTENTE</div></motion.div>
                <motion.div className="pd3-mini-stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.9}}><div className="pd3-mini-stat-value">{stats.active}</div><div className="pd3-mini-stat-label">EN COURS</div></motion.div>
                <motion.div className="pd3-mini-stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:1.0}}><div className="pd3-mini-stat-value">{stats.analyzed}</div><div className="pd3-mini-stat-label">ANALYSÉS</div></motion.div>
              </div>
              <motion.div className="pd3-progress-section" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.1}}><div className="pd3-progress-header"><span className="pd3-progress-label">Dossiers traités</span><span className="pd3-progress-value">{stats.closed+stats.analyzed} dossiers</span></div><div className="pd3-progress-bar"><motion.div className="pd3-progress-fill" initial={{width:0}} animate={{width:`${Math.min(((stats.closed+stats.analyzed)/Math.max(queue.length+assigned.length,1))*100,100)}%`}} transition={{delay:1.2,duration:1}}/></div></motion.div>
              <div className="pd3-live-indicator"><div className="pd3-live-dot"/><span className="pd3-live-text">SYSTÈME OPÉRATIONNEL</span><span style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)",marginLeft:"auto"}}>98.5% uptime</span></div>
            </div>
            <motion.div className="pd3-float-card pd3-float-1" animate={{y:[0,-14,0]}} transition={{repeat:Infinity,duration:4.5}}><div className="pd3-float-card-icon" style={{background:"rgba(232,184,48,0.12)",color:"#FFD700"}}><I.Brain size={20}/></div><div><div className="pd3-float-card-value">98.5%</div><div className="pd3-float-card-label">Précision IA</div></div></motion.div>
            <motion.div className="pd3-float-card pd3-float-2" animate={{y:[0,-10,0],x:[0,6,0]}} transition={{repeat:Infinity,duration:5,delay:1.2}}><div className="pd3-float-card-icon" style={{background:"rgba(16,185,129,0.12)",color:"#10B981"}}><I.Clock size={20}/></div><div><div className="pd3-float-card-value">&lt; 30s</div><div className="pd3-float-card-label">Analyse rapide</div></div></motion.div>
            <motion.div className="pd3-float-card pd3-float-3" animate={{boxShadow:["0 0 0px rgba(232,184,48,0.15)","0 0 35px rgba(232,184,48,0.4)","0 0 0px rgba(232,184,48,0.15)"]}} transition={{repeat:Infinity,duration:2.5}}><div className="pd3-float-card-icon" style={{background:"rgba(139,92,246,0.12)",color:"#8B5CF6"}}><I.Activity size={20}/></div><div><div className="pd3-float-card-value">28+</div><div className="pd3-float-card-label">Pathologies</div></div></motion.div>
          </motion.div>
        </div>
        <div className="pd3-scroll-down"><span className="pd3-scroll-text">Découvrir</span><div className="pd3-scroll-icon"><div className="pd3-scroll-wheel"/></div></div>
      </motion.section>

      {/* BODY */}
      <div className="pd3-body">
        <Reveal><div className="pd3-tabs">
          {[
            {id:"overview",label:"Vue d'ensemble",icon:<I.Activity size={16}/>},
            {id:"consultations",label:"Consultations",icon:<I.Folder size={16}/>},
            {id:"messages",label:"Messages & Analyse",icon:<I.Message size={16}/>},
            {id:"analytics",label:"Statistiques",icon:<I.BarChart size={16}/>},
            {id:"prescriptions",label:"Ordonnances",icon:<I.FileText size={16}/>},
            {id:"reminders",label:"Rappels",icon:<I.Bell size={16}/>},
            {id:"upcoming_calls",label:"Appels à venir",icon:<I.Phone size={16}/>},
            {id:"cim11",label:"Assistant CIM-11",icon:<I.Book size={16}/>}
          ].map(tab=>(
            <button type="button" key={tab.id} className={`pd3-tab ${activeTab===tab.id?"active":""}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); const currentScroll = window.scrollY; setActiveTab(tab.id); setTimeout(() => window.scrollTo(0, currentScroll), 0); }}>
              <span className="pd3-tab-icon">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div></Reveal>

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab==="overview"&&(<motion.div key="overview" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
          {/* Hero Card Style - Vue d'ensemble */}
          <Reveal>
            <div style={{
              background: "linear-gradient(135deg, #0A1628 0%, #1a2d4d 50%, #0d1f3c 100%)",
              borderRadius: 24,
              padding: "40px 48px",
              marginBottom: 32,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(10,22,40,0.3)",
            }}>
              {/* Subtle glow effect */}
              <div style={{
                position: "absolute",
                top: "-50%",
                right: "-20%",
                width: "60%",
                height: "200%",
                background: "radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute",
                bottom: "-30%",
                left: "-10%",
                width: "40%",
                height: "150%",
                background: "radial-gradient(ellipse, rgba(212,165,0,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 50,
                background: "rgba(212,165,0,0.15)",
                border: "1px solid rgba(212,165,0,0.3)",
                marginBottom: 20,
                position: "relative",
                zIndex: 1,
              }}>
                <I.Sparkles size={14} color="#D4A500" />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#D4A500", letterSpacing: "0.08em", textTransform: "uppercase" }}>Vue d'ensemble</span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#fff",
                marginBottom: 12,
                position: "relative",
                zIndex: 1,
                lineHeight: 1.2,
              }}>
                Tableau de bord <span style={{ color: "#FFD700" }}>médical</span>
              </h2>

              {/* Subtitle */}
              <p style={{
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.55)",
                marginBottom: 28,
                position: "relative",
                zIndex: 1,
                maxWidth: 500,
              }}>
                Suivez l'ensemble de vos consultations et analyses en temps réel
              </p>

              {/* Status badges */}
              <div style={{
                display: "flex",
                gap: 20,
                position: "relative",
                zIndex: 1,
                flexWrap: "wrap",
              }}>
                {[
                  { icon: I.Check, color: "#10B981", bg: "rgba(16,185,129,0.15)", text: "Système opérationnel" },
                  { icon: I.Shield, color: "#60A5FA", bg: "rgba(96,165,250,0.15)", text: "Données chiffrées AES-256" },
                  { icon: I.Clock, color: "#F59E0B", bg: "rgba(245,158,11,0.15)", text: "Mise à jour temps réel" },
                ].map((badge, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 10,
                    background: badge.bg,
                    border: `1px solid ${badge.color}30`,
                  }}>
                    <badge.icon size={14} color={badge.color} />
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal><Reveal delay={.1}><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Sparkles size={16} color="#D4A500"/> Actions rapides</span></div></Reveal>
          <div className="pd3-actions-grid">
            {[
              {icon:I.Folder,label:"File d'attente",desc:"Gérer les demandes",color:"#D4A500",bg:"rgba(212,165,0,0.08)",action:()=>setActiveTab("consultations")},
              {icon:I.Scan,label:"Analyse libre",desc:"Classifier une image",color:"#8B5CF6",bg:"rgba(139,92,246,0.08)",action:()=>navigate("/classification")},
              {icon:I.Message,label:"Messages",desc:"Communiquer avec patients",color:"#10B981",bg:"rgba(16,185,129,0.08)",action:()=>setActiveTab("messages")},
              {icon:I.BarChart,label:"Statistiques",desc:"Vue globale",color:"#3B82F6",bg:"rgba(59,130,246,0.08)",action:()=>setActiveTab("analytics")},
              {icon:I.FileText,label:"Ordonnances",desc:"Gérer les prescriptions",color:"#EC4899",bg:"rgba(236,72,153,0.08)",action:()=>setActiveTab("prescriptions")},
              {icon:I.Bell,label:"Rappels",desc:"Mes rappels actifs",color:"#F59E0B",bg:"rgba(245,158,11,0.08)",action:()=>setActiveTab("reminders")},
              {icon:I.Phone,label:"Appels à venir",desc:"Consultations planifiées",color:"#06B6D4",bg:"rgba(6,182,212,0.08)",action:()=>setActiveTab("upcoming_calls")},
              {icon:I.Book,label:"Assistant CIM-11",desc:"Classification OMS",color:"#0099cc",bg:"rgba(0,153,204,0.08)",action:()=>setActiveTab("cim11")}
            ].map((a,i)=>(<Reveal key={i} delay={.12+i*.06}><motion.button type="button" className="pd3-action" onClick={a.action} whileHover={{y:-5}}><div className="pd3-action-top"><div className="pd3-action-icon" style={{background:a.bg,color:a.color}}><a.icon size={22}/></div><div className="pd3-action-arrow"><I.ChevronRight size={14}/></div></div><div className="pd3-action-label">{a.label}</div><div className="pd3-action-desc">{a.desc}</div></motion.button></Reveal>))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
            {[
              { icon: I.Folder, label: "En attente", value: stats.queue, color: "#D4A500", bg: "rgba(212,165,0,0.08)", iconBg: "#FEF9E7" },
              { icon: I.Clock, label: "En cours", value: stats.active, color: "#3B82F6", bg: "rgba(59,130,246,0.08)", iconBg: "#EFF6FF" },
              { icon: I.Check, label: "Analysées", value: stats.analyzed, color: "#10B981", bg: "rgba(16,185,129,0.08)", iconBg: "#ECFDF5" },
              { icon: I.Shield, label: "Terminées", value: stats.closed, color: "#6B7280", bg: "rgba(107,114,128,0.08)", iconBg: "#F3F4F6" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * .06}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    padding: "24px",
                    border: "1px solid #F1F5F9",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: s.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}>
                    <s.icon size={22} color={s.color} />
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 500 }}>{s.label}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Section Dossiers récents + Score de santé */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 480px", gap: 24, marginBottom: 32 }}>
            {/* Dossiers récents */}
            <Reveal delay={0.1}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <I.Folder size={16} color="#D4A500" />
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0A1628" }}>Dossiers récents</span>
                  </div>
                  <button type="button" onClick={() => setActiveTab("consultations")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#D4A500", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                    Voir tout <I.ArrowUpRight size={12} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {loading ? (
                    <div style={{ textAlign: "center", padding: 40 }}><I.Sparkles size={32} color="#D4A500"/></div>
                  ) : [...assigned.slice(0, 3), ...queue.slice(0, 2)].slice(0, 4).map((c, idx) => {
                    const model = MODEL_CONFIG[c.model_key] || MODEL_CONFIG.chest;
                    const urgency = URGENCY_CONFIG[c.urgency] || URGENCY_CONFIG.normal;
                    return (
                      <motion.div
                        key={c.id}
                        whileHover={{ x: 4 }}
                        onClick={() => { setSelectedConsultation(c.id); setActiveTab("messages"); }}
                        style={{
                          background: "#fff",
                          borderRadius: 16,
                          padding: "16px 20px",
                          border: "1px solid #F1F5F9",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: model.bg, color: model.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {model.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0A1628" }}>Dossier #{c.id}</span>
                            <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: "0.65rem", fontWeight: 600, background: STATUS_CONFIG[c.status]?.bg || "#F3F4F6", color: STATUS_CONFIG[c.status]?.color || "#6B7280" }}>
                              {STATUS_CONFIG[c.status]?.label || c.status}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#8899AA", marginBottom: 3 }}>
                            {c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""} · {c.patient_name}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: model.color, fontWeight: 600, background: model.bg, padding: "2px 8px", borderRadius: 6, display: "inline-block" }}>
                            {model.label}
                          </div>
                        </div>
                        <I.ChevronRight size={16} color="#CBD5E1" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Score de santé card */}
            <Reveal delay={0.15}>
              <div style={{
                background: "linear-gradient(135deg, #0A1628 0%, #1a2d4d 50%, #0d1f3c 100%)",
                borderRadius: 24,
                padding: "32px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(10,22,40,0.3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
                {/* Glow effects */}
                <div style={{ position: "absolute", top: "-30%", right: "-20%", width: "70%", height: "160%", background: "radial-gradient(ellipse, rgba(212,165,0,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "50%", height: "120%", background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <I.Sparkles size={14} color="#D4A500" />
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D4A500", letterSpacing: "0.05em" }}>Score de santé</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
                    {/* Circular Score */}
                    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <motion.circle 
                          cx="50" cy="50" r="42" fill="none" stroke="#D4A500" strokeWidth="8" 
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - 86 / 100) }}
                          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFD700" }}>86</span>
                        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>/100</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Score global</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>Excellent</span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5, maxWidth: 200 }}>
                        Suivi optimal de vos patients. Taux de réponse et précision IA excellents.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    <button type="button" onClick={() => navigate("/classification")} className="pd3-btn" style={{ flex: 1, background: "linear-gradient(135deg, #D4A500, #B8941E)", color: "#fff", padding: "10px 16px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      Nouvelle consultation <I.ArrowUpRight size={12} />
                    </button>
                    <button type="button" onClick={() => setActiveTab("consultations")} className="pd3-btn" style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "#fff", padding: "10px 16px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 600, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
                      Mes patients
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { icon: I.Shield, text: "AES-256" },
                      { icon: I.Check, text: "CE Médical" },
                      { icon: I.Phone, text: "Teledoc 24/7" },
                    ].map((badge, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <badge.icon size={12} color="rgba(255,255,255,0.5)" />
                        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)" }}>{badge.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Section Activité Hebdomadaire */}
          <Reveal delay={0.2}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Activité hebdomadaire</h3>
                  <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Volume de consultations et analyses sur 7 jours</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(212,165,0,0.1)", color: "#D4A500", fontSize: "0.7rem", fontWeight: 600 }}>Cette semaine</span>
                </div>
              </div>
              <WeeklyActivityChart data={[
                { day: "Lun", consultations: 12, analyses: 8 },
                { day: "Mar", consultations: 18, analyses: 14 },
                { day: "Mer", consultations: 15, analyses: 11 },
                { day: "Jeu", consultations: 22, analyses: 18 },
                { day: "Ven", consultations: 19, analyses: 15 },
                { day: "Sam", consultations: 8, analyses: 6 },
                { day: "Dim", consultations: 5, analyses: 3 },
              ]} />
            </div>
          </Reveal>

          {/* Section Alertes & Urgences */}
          {stats.critical > 0 && (
            <Reveal delay={0.25}>
              <div style={{ background: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)", borderRadius: 20, padding: "20px 24px", border: "1px solid #FECACA", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <I.AlertTriangle size={24} color="#EF4444" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#DC2626", marginBottom: 2 }}>{stats.critical} cas critique{stats.critical > 1 ? 's' : ''} en attente</div>
                  <div style={{ fontSize: "0.75rem", color: "#991B1B" }}>Consultations marquées comme CRITIQUE nécessitant une attention immédiate</div>
                </div>
                <button type="button" onClick={() => setActiveTab("consultations")} className="pd3-btn" style={{ background: "#DC2626", color: "#fff", padding: "10px 20px", borderRadius: 12, fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", flexShrink: 0 }}>
                  Voir urgences
                </button>
              </div>
            </Reveal>
          )}

          {/* Section Performance IA */}
          <Reveal delay={0.3}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Performance IA</h3>
                  <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Métriques de précision et efficacité des modèles</p>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10B981", fontSize: "0.7rem", fontWeight: 600 }}>Temps réel</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { label: "Précision globale", value: "97.8%", change: "+0.5%", color: "#10B981", icon: I.Target },
                  { label: "Temps moyen analyse", value: "4.2 min", change: "-12%", color: "#D4A500", icon: I.Zap },
                  { label: "Taux de confiance", value: "96.4%", change: "+1.2%", color: "#3B82F6", icon: I.Shield },
                  { label: "Faux positifs", value: "2.1%", change: "-0.8%", color: "#8B5CF6", icon: I.Brain },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "16px", borderRadius: 14, background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <item.icon size={18} color={item.color} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.value}</div>
                    <div style={{ fontSize: "0.75rem", color: item.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <I.TrendingUp size={12} /> {item.change} vs mois dernier
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Section Patients par modèle */}
          <Reveal delay={0.35}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Patients par spécialité</h3>
                  <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Répartition des consultations par domaine médical</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { key: "chest", label: "Radiologie Thoracique", count: assigned.filter(c => c.model_key === "chest").length, total: queue.filter(c => c.model_key === "chest").length + assigned.filter(c => c.model_key === "chest").length, color: "#3B82F6", bg: "#EFF6FF" },
                  { key: "brain", label: "Neurologie & IRM", count: assigned.filter(c => c.model_key === "brain").length, total: queue.filter(c => c.model_key === "brain").length + assigned.filter(c => c.model_key === "brain").length, color: "#8B5CF6", bg: "#F5F3FF" },
                  { key: "lung", label: "Cancer Pulmonaire", count: assigned.filter(c => c.model_key === "lung").length, total: queue.filter(c => c.model_key === "lung").length + assigned.filter(c => c.model_key === "lung").length, color: "#EC4899", bg: "#FDF2F8" },
                  { key: "retina", label: "Rétinopathie Diabétique", count: assigned.filter(c => c.model_key === "retina").length, total: queue.filter(c => c.model_key === "retina").length + assigned.filter(c => c.model_key === "retina").length, color: "#06B6D4", bg: "#ECFEFF" },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -3 }}
                    style={{ padding: "18px", borderRadius: 16, background: item.bg, border: `1px solid ${item.color}20`, cursor: "pointer" }}
                    onClick={() => setActiveTab("consultations")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {MODEL_CONFIG[item.key]?.icon || <I.Scan size={18} color={item.color} />}
                      </div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: item.color }}>{item.label}</div>
                    </div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0A1628", marginBottom: 4 }}>{item.count}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                      {item.total > 0 ? `${Math.round((item.count / item.total) * 100)}% du total` : "Aucun dossier"}
                    </div>
                    <div style={{ marginTop: 10, height: 6, background: "rgba(255,255,255,0.5)", borderRadius: 3, overflow: "hidden" }}>
                      <motion.div 
                        style={{ height: "100%", background: item.color, borderRadius: 3 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Section Certifications & Conformité */}
          <Reveal delay={0.4}>
            <div style={{ background: "linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)", borderRadius: 20, padding: "20px 24px", border: "1px solid #BBF7D0", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.Award size={22} color="#10B981" />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#059669" }}>Certification CE Médical</div>
                  <div style={{ fontSize: "0.7rem", color: "#047857" }}>Conforme aux normes européennes</div>
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: "#BBF7D0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.Shield size={22} color="#3B82F6" />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563EB" }}>RGPD / HIPAA</div>
                  <div style={{ fontSize: "0.7rem", color: "#1D4ED8" }}>Protection des données santé</div>
                </div>
              </div>
              <div style={{ width: 1, height: 40, background: "#BBF7D0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(212,165,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.Check size={22} color="#D4A500" />
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#B45309" }}>AES-256</div>
                  <div style={{ fontSize: "0.7rem", color: "#92400E" }}>Chiffrement de bout en bout</div>
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span style={{ padding: "6px 14px", borderRadius: 20, background: "#10B981", color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                  Actif
                </span>
              </div>
            </div>
          </Reveal>

          {userDomains.length > 1 && (
            <div style={{marginTop:20,marginBottom:30,background:"white",borderRadius:20,padding:"22px",border:"1px solid #E2E8F0"}}>
              <h2 style={{fontSize:"1rem",fontWeight:800,color:"#0A2647",marginBottom:16}}>Mes spécialités</h2>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(userDomains.length,4)}, 1fr)`,gap:12}}>
                {userDomains.map(d => {
                  const cfg = getDomainColor(d);
                  return (
                    <div key={d} style={{padding:"16px",borderRadius:14,background:cfg.bg,border:`1px solid ${cfg.color}30`,cursor:"pointer",transition:"all .2s"}}
                      onClick={() => navigate("/classification")}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = ""}>
                      <div style={{fontSize:"1.8rem",marginBottom:8}}>{getDomainIcon(d)}</div>
                      <div style={{fontSize:".82rem",fontWeight:700,color:cfg.color,marginBottom:4}}>{getDomainLabel(d)}</div>
                      <div style={{fontSize:".7rem",color:"#64748B",marginBottom:2}}>{getDomainClasses(d)}</div>
                      <div style={{fontSize:".7rem",fontWeight:600,color:cfg.color}}>Précision : {getDomainAccuracy(d)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Taux d'occupation & Rendez-vous */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Mini Calendrier - Rendez-vous */}
            <Reveal delay={0.15}>
              <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Prochains rendez-vous</h3>
                    <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Consultations planifiées aujourd'hui</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("upcoming_calls")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#D4A500", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                    Voir tout <I.ArrowUpRight size={12} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { time: "09:00", patient: "Ahmed Ben Ali", type: "brain", status: "confirmed", duration: "30 min" },
                    { time: "10:30", patient: "Fatima Trabelsi", type: "chest", status: "confirmed", duration: "20 min" },
                    { time: "14:00", patient: "Mohamed Karray", type: "lung", status: "pending", duration: "45 min" },
                    { time: "16:30", patient: "Sonia Jaziri", type: "retina", status: "confirmed", duration: "25 min" },
                  ].map((rdv, i) => {
                    const model = MODEL_CONFIG[rdv.type] || MODEL_CONFIG.chest;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: model.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {model.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0A1628" }}>{rdv.patient}</span>
                            <span style={{ padding: "1px 8px", borderRadius: 10, fontSize: "0.6rem", fontWeight: 600, background: rdv.status === "confirmed" ? "#D1FAE5" : "#FEF3C7", color: rdv.status === "confirmed" ? "#059669" : "#D97706" }}>
                              {rdv.status === "confirmed" ? "Confirmé" : "En attente"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#8899AA" }}>{model.label} · {rdv.duration}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0A1628" }}>{rdv.time}</div>
                          <div style={{ fontSize: "0.65rem", color: "#8899AA" }}>Aujourd'hui</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Taux d'occupation horaire */}
            <Reveal delay={0.2}>
              <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Taux d'occupation</h3>
                    <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Charge de travail par tranche horaire</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10B981", fontSize: "0.7rem", fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} /> 78% occupé
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { hour: "08h-10h", value: 85, color: "#EF4444", label: "Très chargé" },
                    { hour: "10h-12h", value: 65, color: "#F59E0B", label: "Modéré" },
                    { hour: "12h-14h", value: 25, color: "#10B981", label: "Faible" },
                    { hour: "14h-16h", value: 90, color: "#EF4444", label: "Très chargé" },
                    { hour: "16h-18h", value: 55, color: "#F59E0B", label: "Modéré" },
                    { hour: "18h-20h", value: 30, color: "#10B981", label: "Faible" },
                  ].map((slot, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 70, fontSize: "0.75rem", fontWeight: 600, color: "#64748B", flexShrink: 0 }}>{slot.hour}</div>
                      <div style={{ flex: 1, height: 28, background: "#F1F5F9", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                        <motion.div 
                          style={{ height: "100%", background: slot.color, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${slot.value}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                        >
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fff" }}>{slot.value}%</span>
                        </motion.div>
                      </div>
                      <div style={{ width: 80, fontSize: "0.7rem", fontWeight: 500, color: slot.color, textAlign: "right" }}>{slot.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Section Démographie patients */}
          <Reveal delay={0.25}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Démographie patients</h3>
                  <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Répartition par âge et sexe des patients consultés</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Répartition par âge */}
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Répartition par âge</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { range: "18-30 ans", count: 12, total: 67, color: "#3B82F6" },
                      { range: "31-45 ans", count: 24, total: 67, color: "#8B5CF6" },
                      { range: "46-60 ans", count: 18, total: 67, color: "#D4A500" },
                      { range: "60+ ans", count: 13, total: 67, color: "#10B981" },
                    ].map((age, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 500 }}>{age.range}</span>
                          <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>{age.count} patients ({Math.round((age.count/age.total)*100)}%)</span>
                        </div>
                        <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                          <motion.div style={{ height: "100%", background: age.color, borderRadius: 4 }} initial={{ width: 0 }} animate={{ width: `${(age.count/age.total)*100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Répartition par sexe + Taux conversion */}
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Répartition par sexe</h4>
                  <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                    <div style={{ flex: 1, padding: "16px", borderRadius: 14, background: "#EFF6FF", border: "1px solid #DBEAFE", textAlign: "center" }}>
                      <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>♂</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#3B82F6" }}>58%</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B" }}>Hommes</div>
                    </div>
                    <div style={{ flex: 1, padding: "16px", borderRadius: 14, background: "#FDF2F8", border: "1px solid #FCE7F3", textAlign: "center" }}>
                      <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>♀</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#EC4899" }}>42%</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B" }}>Femmes</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Taux de conversion</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Consultation → Analyse", value: 87, color: "#10B981" },
                      { label: "Analyse → Clôture", value: 94, color: "#3B82F6" },
                      { label: "Urgence → Traitement < 1h", value: 96, color: "#D4A500" },
                    ].map((conv, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, fontSize: "0.75rem", color: "#374151" }}>{conv.label}</div>
                        <div style={{ width: 100, height: 20, background: "#F1F5F9", borderRadius: 10, overflow: "hidden" }}>
                          <motion.div style={{ height: "100%", background: conv.color, borderRadius: 10 }} initial={{ width: 0 }} animate={{ width: `${conv.value}%` }} transition={{ duration: 1, delay: i * 0.15 }} />
                        </div>
                        <div style={{ width: 36, fontSize: "0.75rem", fontWeight: 700, color: conv.color, textAlign: "right" }}>{conv.value}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Section Statut des modèles IA */}
          <Reveal delay={0.3}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "24px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0A1628", marginBottom: 4 }}>Statut des modèles IA</h3>
                  <p style={{ fontSize: "0.75rem", color: "#64748B" }}>État opérationnel des modèles de diagnostic</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#10B981", fontSize: "0.75rem", fontWeight: 700 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", animation: "pulse 2s infinite" }} /> Tous opérationnels
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { key: "chest", name: "ResNet-50 Thorax", accuracy: "97.3%", latency: "1.2s", status: "online", lastUpdate: "Il y a 2h" },
                  { key: "brain", name: "UNet Cérébral", accuracy: "96.2%", latency: "2.1s", status: "online", lastUpdate: "Il y a 1h" },
                  { key: "lung", name: "YOLO Pulmonaire", accuracy: "94.8%", latency: "1.8s", status: "online", lastUpdate: "Il y a 30min" },
                  { key: "retina", name: "VGG-16 Rétine", accuracy: "92.1%", latency: "2.4s", status: "maintenance", lastUpdate: "En cours" },
                ].map((model, i) => (
                  <div key={i} style={{ padding: "16px", borderRadius: 14, background: "#F8FAFC", border: "1px solid #F1F5F9", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: model.status === "online" ? "#10B981" : "#F59E0B" }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: MODEL_CONFIG[model.key]?.bg || "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {MODEL_CONFIG[model.key]?.icon || <I.Scan size={16} />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 10, background: model.status === "online" ? "#D1FAE5" : "#FEF3C7", fontSize: "0.65rem", fontWeight: 700, color: model.status === "online" ? "#059669" : "#D97706" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: model.status === "online" ? "#059669" : "#D97706" }} />
                        {model.status === "online" ? "En ligne" : "Maintenance"}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>{model.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                        <span style={{ color: "#64748B" }}>Précision</span>
                        <span style={{ color: "#0A1628", fontWeight: 700 }}>{model.accuracy}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                        <span style={{ color: "#64748B" }}>Latence</span>
                        <span style={{ color: "#0A1628", fontWeight: 700 }}>{model.latency}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem" }}>
                        <span style={{ color: "#64748B" }}>Mise à jour</span>
                        <span style={{ color: "#0A1628", fontWeight: 600 }}>{model.lastUpdate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Section Notifications temps réel */}
          <Reveal delay={0.35}>
            <div style={{ background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)", borderRadius: 20, padding: "20px 24px", border: "1px solid #FDE68A", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <I.Bell size={20} color="#F59E0B" />
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#92400E" }}>Notifications système</div>
                  <div style={{ fontSize: "0.75rem", color: "#B45309" }}>{unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''} en attente</div>
                </div>
                <button type="button" onClick={() => setShowNotif(true)} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 10, background: "#F59E0B", color: "#fff", fontSize: "0.75rem", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Voir notifications
                </button>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { icon: I.Message, text: "Nouveau message patient", count: 3, color: "#3B82F6" },
                  { icon: I.AlertTriangle, text: "Urgence à traiter", count: stats.critical, color: "#EF4444" },
                  { icon: I.Check, text: "Analyse terminée", count: 2, color: "#10B981" },
                  { icon: I.Calendar, text: "Rendez-vous confirmé", count: 4, color: "#8B5CF6" },
                ].map((notif, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#fff", border: "1px solid #FDE68A" }}>
                    <notif.icon size={14} color={notif.color} />
                    <span style={{ fontSize: "0.75rem", color: "#78350F", fontWeight: 500 }}>{notif.text}</span>
                    {notif.count > 0 && (
                      <span style={{ padding: "1px 6px", borderRadius: 10, background: notif.color, color: "#fff", fontSize: "0.65rem", fontWeight: 700, minWidth: 18, textAlign: "center" }}>{notif.count}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          
          <Reveal delay={.15}><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Folder size={16} color="#D4A500"/> Consultations récentes</span></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{loading?<div style={{textAlign:"center",padding:40}}><I.Sparkles size={32} color="#D4A500"/></div>:[...assigned.slice(0,3),...queue.slice(0,2)].slice(0,5).map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}}/>)}</div></Reveal></motion.div>)}

          {/* CONSULTATIONS TAB */}
          {activeTab==="consultations"&&(<motion.div key="consultations" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Folder size={12}/> CONSULTATIONS</div><h2 className="pd3-section-title">File d'attente <span className="accent">({queue.length})</span></h2></div></Reveal><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>{queue.map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}} onAccept={()=>handleAccept(c.id)} onReject={()=>handleReject(c.id)} actionLoading={actionLoading===c.id}/>)}</div>{assigned.filter(c=>c.status!=="closed").length>0&&<><Reveal><h2 className="pd3-section-title" style={{marginBottom:24}}>Mes dossiers <span className="accent">actifs</span></h2></Reveal><div style={{display:"flex",flexDirection:"column",gap:8}}>{assigned.filter(c=>c.status!=="closed").map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}}/>)}</div></>}</motion.div>)}

          {/* MESSAGES & ANALYSE TAB */}
          {activeTab === "messages" && (
            <motion.div key="messages" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: "grid", gridTemplateColumns: "1fr 500px", gap: 28, alignItems: "start" }}>
              <ChatSection consultationData={consultationData} messages={messages} msgInput={msgInput} setMsgInput={setMsgInput} onSend={handleSendMessage} canMessage={canMessage} onClose={() => setShowCloseModal(true)} model={model} loading={loading} />
              <AnalysisSection analysis={analysis} analysisLoading={analysisLoading} explainText={explainText} explaining={explaining} onRunAnalysis={handleRunAnalysis} onDownloadPDF={handleDownloadPDF} consultationData={consultationData} model={model} />
            </motion.div>
          )}

          {/* ANALYTICS TAB - NOUVEAU AVEC GRAPHIQUES */}
          {activeTab === "analytics" && (
            <motion.div key="analytics" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
              <Reveal>
                <div className="pd3-section-header">
                  <div className="pd3-section-badge"><I.BarChart size={12}/> ANALYTICS</div>
                  <h2 className="pd3-section-title">Tableau de bord <span className="accent">analytique</span></h2>
                  <p className="pd3-section-sub">Visualisez vos performances et métriques cliniques</p>
                </div>
              </Reveal>
              <AnalyticsDashboard stats={stats} assigned={assigned} queue={queue} userDomains={userDomains} />
            </motion.div>
          )}

          
          {/* ORDONNANCES TAB */}
{activeTab === "prescriptions" && (
  <motion.div key="prescriptions" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
    <Reveal>
      <div className="pd3-section-header">
        <div className="pd3-section-badge"><I.FileText size={12}/> ORDONNANCES</div>
        <h2 className="pd3-section-title">Prescriptions <span className="accent">médicales</span></h2>
        <p className="pd3-section-sub">Gérez les traitements prescrits à vos patients</p>
      </div>
    </Reveal>
    <DoctorPrescriptionsPage />
  </motion.div>
)}

          {/* RAPPELS TAB */}
          {activeTab === "reminders" && (
  <motion.div 
    key="reminders" 
    initial={{opacity:0, y:15}} 
    animate={{opacity:1, y:0}} 
    exit={{opacity:0, y:-10}} 
    transition={{duration:.3}}
  >
    {/* Header du dashboard - unique */}
    <Reveal>
      <div className="pd3-section-header">
        <div className="pd3-section-badge">
          <I.Bell size={12}/> RAPPELS
        </div>
        <h2 className="pd3-section-title">
          Mes <span className="accent">rappels</span>
        </h2>
        <p className="pd3-section-sub">
          Gérez vos rappels de suivi patient et tâches médicales
        </p>
      </div>
    </Reveal>
    
    {/* Le contenu SANS header - juste la liste */}
    <DoctorRemindersPage />
  </motion.div>
)}

          {/* APPELS À VENIR TAB */}
          {activeTab === "upcoming_calls" && (
              <motion.div key="upcoming_calls" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.3}}>
                <Reveal>
                  <div className="pd3-section-header">
                    <div className="pd3-section-badge"><I.Phone size={12}/> APPELS À VENIR</div>
                    <h2 className="pd3-section-title">Consultations <span className="accent">planifiées</span></h2>
                    <p className="pd3-section-sub">Vos appels vidéo et consultations à distance planifiés</p>
                  </div>
                </Reveal>
                <DoctorUpcomingCallsPage />
              </motion.div>
            )}
          {/* CIM-11 TAB */}
          {activeTab==="cim11"&&(
            <motion.div key="cim11" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} style={{ height: "auto" }}>
              <CIM11Section user={user} />
            </motion.div>
          )}
        </AnimatePresence>

        <Reveal><section className="pd3-platform"><div className="pd3-platform-grid">{[{icon:I.Scan,value:50000,suffix:"+",label:"Radiographies analysées"},{icon:I.Brain,value:98,suffix:".5%",label:"Précision de détection"},{icon:I.Lungs,value:14,suffix:"+",label:"Pathologies couvertes"},{icon:I.Shield,value:100,suffix:"%",label:"Données sécurisées"}].map((s,i)=><motion.div key={i} className="pd3-platform-item" whileHover={{y:-4}}><div className="pd3-platform-icon"><s.icon size={30} color="#D4A500"/></div><div className="pd3-platform-value">{s.value}{s.suffix}</div><div className="pd3-platform-label">{s.label}</div>{i<3&&<div className="pd3-platform-div"/>}</motion.div>)}</div></section></Reveal>

        <footer className="hp-footer" style={{marginTop:40}}><div className="hp-footer-inner"><div className="hp-footer-grid"><div className="hp-footer-brand"><div className="hp-nav-logo" style={{marginBottom:16}}><div className="hp-logo-icon"><I.Lungs size={18} color="#fff"/></div><span style={{color:"#fff"}}>Med<span style={{color:"#FFD700"}}>AI</span></span></div><p>Plateforme médicale de diagnostic assisté par IA. Transformant la radiologie avec l'apprentissage profond depuis 2024.</p><div className="hp-footer-socials">{["LI","TW","GH","YT","IN"].map((s,i)=><div className="hp-footer-social" key={i}>{s}</div>)}</div></div><div><h4>PRODUIT</h4>{["Analyse IA","Radiologues","API Access","Mobile App","Tarifs"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div><div><h4>ENTREPRISE</h4>{["À propos","Carrières","Recherche","Blog","Contact"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div><div><h4>RESSOURCES</h4>{["Documentation","Études de cas","Whitepapers","Support","Statut"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div></div><div className="hp-footer-bottom"><span>© 2025 MedAI — Plateforme médicale certifiée · Tous droits réservés</span><div className="hp-footer-bottom-links">{["Confidentialité","Conditions","Sécurité","HIPAA","RGPD","Contact"].map(x=><a href="#" key={x}>{x}</a>)}</div></div></div></footer>
      </div>
      {/* ═══════════════════════════════════════════ */}
      {/* OVERLAY NOTIFICATIONS CRITIQUES — 100% SVG   */}
      {/* ═══════════════════════════════════════════ */}
      <CriticalNotificationOverlay 
        notifications={criticalNotifications}
        userRole="doctor"
        onDismiss={() => {
          refetchCritical();
        }}
        onAction={(notification) => {
          try {
            const data = JSON.parse(notification.data || "{}");
            if (data.consultation_id) {
              setSelectedConsultation(data.consultation_id);
              setActiveTab("messages");
            }
          } catch (e) {
            console.error(e);
          }
          markAsRead(notification.id);
        }}
        autoShowDelay={2000}
        dismissAfter={null}
      />

      <AnimatePresence>{showCloseModal&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><motion.div initial={{scale:.95}} animate={{scale:1}} style={{background:"#fff",borderRadius:20,padding:28,maxWidth:460,width:"100%"}}><h2 style={{fontWeight:800,color:"#0A1628",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><I.Shield size={20} color="#6B7280"/> Clôturer la consultation</h2><textarea value={closeNotes} onChange={e=>setCloseNotes(e.target.value)} placeholder="Notes de clôture, recommandations..." rows={4} style={{width:"100%",padding:12,borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:"0.85rem",fontFamily:"inherit",resize:"none",outline:"none",marginBottom:18,boxSizing:"border-box"}}/><div style={{display:"flex",gap:10}}><button type="button" onClick={()=>{setShowCloseModal(false);setCloseNotes("");}} className="pd3-btn pd3-btn-outline" style={{flex:1}}>Annuler</button><button type="button" onClick={handleClose} className="pd3-btn pd3-btn-gold" style={{flex:1}}>Confirmer la clôture</button></div></motion.div></motion.div>)}</AnimatePresence>
    </div>
  );
}
