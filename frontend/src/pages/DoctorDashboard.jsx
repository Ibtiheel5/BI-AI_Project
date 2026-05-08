// DoctorDashboard.jsx — Version Finale Complète (Premium Gold/Navy)
// Intégration du chatbot CIM-11 pour les médecins
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import "./patient/PatientDashboard.css";
import { useAuth } from "../context/AuthContext";
import CIM11Chatbot from "../components/CIM11Chatbot"; // Import du chatbot CIM-11

const API = "http://localhost:8000/api/v1";

// ═══════════════════════════════════════
// SVG ICONS
// ═══════════════════════════════════════
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
  Video: p => <Svg {...p}><rect x="2" y="5" width="14" height="14" rx="2"/><polyline points="16 9 22 5 22 19 16 15"/></Svg>, // NOUVEAU
  Camera: p => <Svg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Svg>, // NOUVEAU
};

// ═══════════════════════════════════════
// Helper: Display name without double Dr.
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════
const MODEL_CONFIG = {
  brain:  { label: "IRM Cérébrale", color: "#8B5CF6", icon: <I.Brain size={18} />, bg: "rgba(139,92,246,0.08)" },
  lung:   { label: "Scanner CT",    color: "#EC4899", icon: <I.Scan size={18} />, bg: "rgba(236,72,153,0.08)" },
  chest:  { label: "Radio Thorax",  color: "#3B82F6", icon: <I.Lungs size={18} />, bg: "rgba(59,130,246,0.08)" },
  retina: { label: "Fond d'œil",    color: "#06B6D4", icon: <I.Eye size={18} />, bg: "rgba(6,182,212,0.08)" },
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

// ═══════════════════════════════════════
// Particles
// ═══════════════════════════════════════
const Particles = () => {
  const p = useMemo(() => Array.from({length:35}, (_,i) => ({ id:i, left:`${Math.random()*100}%`, w:`${Math.random()*3+1}px`, h:`${Math.random()*3+1}px`, dur:`${Math.random()*14+8}s`, delay:`${Math.random()*10}s`, bottom:`-${Math.random()*40}px`, glow:i%5===0 })), []);
  return <div className="pd3-hero-particles">{p.map(x => <div key={x.id} className="pd3-particle" style={{left:x.left,width:x.w,height:x.h,animationDuration:x.dur,animationDelay:x.delay,bottom:x.bottom,boxShadow:x.glow?'0 0 10px rgba(255,215,0,0.6)':'none'}} />)}</div>;
};

const Reveal = ({ children, delay=0 }) => (
  <motion.div initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true,margin:"-50px"}} transition={{duration:.65,delay,ease:[.22,.61,.36,1]}}>{children}</motion.div>
);

// ═══════════════════════════════════════
// Status Badge
// ═══════════════════════════════════════
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className="pd3-badge" style={{background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}30`}}>{cfg.icon} {cfg.label}</span>;
};

// ═══════════════════════════════════════
// Consultation Card
// ═══════════════════════════════════════
const ConsultationCard = ({ consultation, onClick, onAccept, onReject, actionLoading, compact }) => {
  const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
  const urgency = URGENCY_CONFIG[consultation.urgency] || URGENCY_CONFIG.normal;
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
            {(() => { const diff = Math.floor((Date.now()-new Date(consultation.created_at))/60000); return diff<1?"À l'instant":diff<60?`${diff}min`:diff<1440?`${Math.floor(diff/60)}h`:`${Math.floor(diff/1440)}j`; })()}
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

// ═══════════════════════════════════════
// Message Bubble
// ═══════════════════════════════════════
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

// ═══════════════════════════════════════
// Analysis Section (developed)
// ═══════════════════════════════════════
const AnalysisSection = ({ analysis, analysisLoading, explainText, explaining, onRunAnalysis, onDownloadPDF, consultationData, model }) => {
  // Parse probabilities
  const probabilities = useMemo(() => {
    if (!analysis?.probabilities) return [];
    let p = analysis.probabilities;
    if (typeof p === "string") { try { p = JSON.parse(p); } catch { return []; } }
    return Object.entries(p).sort(([,a],[,b]) => b - a);
  }, [analysis]);

  if (!consultationData) {
    return (
      <div className="pd3-health-card" style={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "auto",  // CHANGÉ: plus de hauteur fixe
        minHeight: "500px"  // Réduit
      }}>
        <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", padding: 40 }}>
          <I.Brain size={52} color="rgba(255,215,0,0.3)" />
          <div style={{ marginTop: 16, fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
            Sélectionnez une consultation
          </div>
          <div style={{ marginTop: 8, fontSize: "0.82rem" }}>
            Acceptez ou ouvrez une consultation pour lancer l&apos;analyse IA
          </div>
        </div>
      </div>
    );
  }

  return (
     <div className="pd3-health-card" style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "auto",  // CHANGÉ: plus de hauteur fixe
      minHeight: "500px"  // Réduit
    }}>
      <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
      <div className="pd3-health-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <I.Brain size={20} color="#FFD700"/>
            <span style={{ fontWeight: 700, color: "#FFD700", fontSize: "1rem" }}>Analyse IA</span>
            {analysis && !analysisLoading && <span className="pd3-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981", fontSize: "0.65rem" }}>Complète</span>}
          </div>
          {analysis && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{model?.label}</span>}
        </div>

        {/* Contenu scrollable */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px" }}>
          {analysisLoading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                <I.Sparkles size={48} color="#FFD700"/>
              </motion.div>
              <div style={{ marginTop: 20, color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>Analyse en cours...</div>
            </div>
          ) : analysis ? (
            <>
              {/* Prediction Card */}
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
                    <motion.div 
                      style={{ height: "100%", background: "linear-gradient(90deg,#10B981,#34D399)", borderRadius: 4 }} 
                      initial={{ width: 0 }} 
                      animate={{ width: `${analysis.confidence * 100}%` }} 
                      transition={{ duration: 1, delay: .3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Probabilities */}
              {probabilities.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                    Distribution des probabilités
                  </div>
                  {probabilities.slice(0, 5).map(([cls, prob], idx) => (
                    <div key={cls} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ 
                          fontSize: "0.8rem", 
                          color: cls === analysis.prediction ? "#10B981" : "rgba(255,255,255,0.6)", 
                          fontWeight: cls === analysis.prediction ? 700 : 400 
                        }}>
                          {cls === analysis.prediction && "▶ "}{cls}
                        </span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                        <motion.div 
                          style={{ 
                            height: "100%", 
                            background: cls === analysis.prediction ? "#10B981" : "rgba(255,255,255,0.2)", 
                            borderRadius: 3 
                          }} 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(prob / Math.max(...probabilities.map(([, p]) => p))) * 100}%` }} 
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EXPLICATION IA - AJOUTÉE ICI */}
              {explainText && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <I.Brain size={14} color="#FFD700"/> Explication clinique IA
                  </div>
                  <div style={{ 
                    background: "rgba(255,255,255,0.05)", 
                    borderRadius: 14, 
                    padding: "18px",
                    border: "1px solid rgba(255,215,0,0.15)",
                    fontSize: "0.85rem",
                    lineHeight: "1.7",
                    color: "rgba(255,255,255,0.8)",
                    whiteSpace: "pre-wrap"
                  }}>
                    {explainText.split('\n').map((line, i) => (
                      line.startsWith('##') ? (
                        <div key={i} style={{ fontWeight: 700, color: "#FFD700", marginTop: 12, marginBottom: 6 }}>
                          {line.replace('## ', '')}
                        </div>
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
                <I.Sparkles size={18}/> {consultationData?.status === "analyzed" ? "Relancer l'analyse" : "Lancer l'analyse IA"}
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

        {/* Bouton PDF - Plus visible */}
        {analysis && (
          <div style={{ paddingTop: 16, borderTop: "1px solid rgba(232,184,48,0.1)", flexShrink: 0, marginTop: "auto" }}>
            <button 
              type="button"
              onClick={onDownloadPDF} 
              disabled={explaining}
              className="pd3-btn pd3-btn-gold" 
              style={{ 
                width: "100%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: 10, 
                padding: "14px",
                fontSize: "0.85rem",
                fontWeight: 700,
                opacity: explaining ? 0.65 : 1,
                cursor: explaining ? "not-allowed" : "pointer"
              }}
            >
              <I.Download size={18}/> {explaining ? "Attente explication IA..." : "Télécharger le rapport PDF"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
// ═══════════════════════════════════════
// Chat Section (developed)
// ═══════════════════════════════════════
// ChatSection - Version avec cadre agrandi
const ChatSection = ({ consultationData, messages, msgInput, setMsgInput, onSend, canMessage, onClose, model, loading }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!consultationData) {
    return (
      <div className="pd3-health-card" style={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "auto",
        minHeight: "600px",  // Agrandi
        alignItems: "center",
        justifyContent: "center",
      }}>
        <I.Message size={52} color="rgba(255,255,255,0.25)" />
        <div style={{fontSize:"1rem",fontWeight:700,marginTop:16,color:"rgba(255,255,255,0.65)"}}>
          Aucune consultation selectionnee
        </div>
        <div style={{fontSize:"0.85rem",marginTop:8,maxWidth:360,lineHeight:1.5}}>
          Selectionnez une consultation ou acceptez une demande pour ouvrir les messages et lancer l'analyse IA.
        </div>
      </div>
    );
  }

  return (
    <div className="pd3-health-card" style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "auto",
      minHeight: "650px",  // Agrandi de 550px à 650px
    }}>
      {/* Header */}
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
            <VideoCallButton 
              consultationId={consultationData?.id} 
              consultationStatus={consultationData?.status}
              consultation={consultationData}
            />
            <button type="button" onClick={onClose} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>
              <I.Shield size={14}/> Clôturer
            </button>
          </div>
        )}
      </div>

      {/* Messages - ZONE AGRANDIE */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minHeight: "480px", maxHeight: "480px" }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            <I.Message size={56} style={{ marginBottom: 20 }}/>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Aucun message</div>
            <div style={{ fontSize: "0.85rem", marginTop: 8 }}>Commencez la discussion avec le patient</div>
          </div>
        ) : (
          messages.map(m => <MessageBubble key={m.id} message={m} isDoctor={true}/>)
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input - Plus grand */}
      {canMessage ? (
        <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(232,184,48,0.1)", display: "flex", gap: 14, flexShrink: 0, background: "rgba(0,0,0,0.1)" }}>
          <textarea 
            value={msgInput} 
            onChange={e => setMsgInput(e.target.value)} 
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Écrire un message au patient... (Shift+Enter pour retour à la ligne)"
            rows={3}
            style={{ 
              flex: 1, 
              padding: "14px 18px", 
              borderRadius: 18, 
              border: "1px solid rgba(255,255,255,0.15)", 
              background: "rgba(255,255,255,0.08)", 
              color: "#fff", 
              outline: "none", 
              fontFamily: "inherit", 
              fontSize: "0.9rem",
              resize: "vertical",
              minHeight: "70px",
              maxHeight: "120px",
            }} 
          />
          <button 
            type="button" 
            onClick={onSend} 
            disabled={!msgInput.trim()} 
            className="pd3-btn pd3-btn-gold pd3-btn-sm" 
            style={{ 
              width: 60, 
              height: 60, 
              minWidth: 60, 
              padding: 0, 
              borderRadius: 18,
              alignSelf: "flex-end"
            }}
          >
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

// ═══════════════════════════════════════
// COMPOSANT BOUTON APPEL VIDÉO
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// MODAL DE PLANIFICATION DE RENDEZ-VOUS
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// MODAL DE PLANIFICATION DE RENDEZ-VOUS - VERSION AGENDA AVEC SAISIE MANUELLE
// ═══════════════════════════════════════
const AppointmentModal = ({ isOpen, onClose, consultation, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customHour, setCustomHour] = useState("");
  const [customMinute, setCustomMinute] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeInputMode, setTimeInputMode] = useState("preset"); // "preset" ou "manual"
  const [weekStart, setWeekStart] = useState(1);

  // Heures prédéfinies (créneaux standards)
  const presetTimeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  // Jours fériés approximatifs (Tunisie)
  const holidays = [
    "01-01", "14-01", "20-03", "09-04", "01-05",
    "25-07", "13-08", "15-10",
  ];

  const isHoliday = (date) => {
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isPastTimeForToday = (date, time) => {
    if (!selectedDate) return false;
    const today = new Date();
    const selectedDateTime = new Date(selectedDate);
    
    if (selectedDateTime.toDateString() !== today.toDateString()) return false;
    
    const [hours, minutes] = time.split(":");
    const selectedHour = parseInt(hours);
    const selectedMinute = parseInt(minutes);
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    return (selectedHour < currentHour) || (selectedHour === currentHour && selectedMinute < currentMinute);
  };

  // Valider l'heure saisie manuellement
  const validateCustomTime = (hour, minute) => {
    const h = parseInt(hour);
    const m = parseInt(minute);
    
    if (isNaN(h) || isNaN(m)) return false;
    if (h < 0 || h > 23) return false;
    if (m < 0 || m > 59) return false;
    
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (isPastTimeForToday(selectedDate, timeStr)) return false;
    
    return true;
  };

  // Appliquer l'heure personnalisée
  const applyCustomTime = () => {
    if (!customHour || !customMinute) {
      alert("Veuillez entrer une heure valide");
      return;
    }
    
    if (validateCustomTime(customHour, customMinute)) {
      const timeStr = `${String(parseInt(customHour)).padStart(2, '0')}:${String(parseInt(customMinute)).padStart(2, '0')}`;
      setSelectedTime(timeStr);
      setTimeInputMode("preset");
    } else {
      alert("Heure invalide ou déjà passée. Veuillez saisir une heure entre 00:00 et 23:59");
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = (startDayOfWeek - weekStart + 7) % 7;
    
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isSelected: false
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date: date,
        isCurrentMonth: true,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isSelected: false
      });
    }
    
    return days;
  };

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const selectDate = (date) => {
    if (isPastDate(date) || isWeekend(date) || isHoliday(date)) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setCustomHour("");
    setCustomMinute("");
  };

  const selectTime = (time) => {
    if (isPastTimeForToday(selectedDate, time)) return;
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Veuillez selectionner une date et une heure");
      return;
    }
    setLoading(true);
    await onConfirm(selectedDate, selectedTime, notes);
    setLoading(false);
    onClose();
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        style={{
          background: "#fff",
          borderRadius: 28,
          padding: 32,
          maxWidth: 800,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>
          Planifier un rendez-vous
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#64748B", marginBottom: 24 }}>
          Patient : {consultation?.patient_name}
        </p>

        {/* Calendrier */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            marginBottom: 20
          }}>
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: "pointer",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0A1628" }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                border: "1px solid #E2E8F0",
                background: "#fff",
                cursor: "pointer",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              →
            </button>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 8
          }}>
            {dayNames.map(day => (
              <div key={day} style={{ 
                textAlign: "center", 
                fontSize: "0.7rem", 
                fontWeight: 600, 
                color: "#64748B",
                padding: "8px 0"
              }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6
          }}>
            {days.map((day, index) => {
              const date = day.date;
              const isDisabled = isPastDate(date) || isWeekend(date) || isHoliday(date);
              const isSelected = day.isSelected;
              const isToday = date.toDateString() === today.toDateString();
              
              let bgColor = "#fff";
              let textColor = "#1E293B";
              
              if (isDisabled) {
                bgColor = "#F1F5F9";
                textColor = "#94A3B8";
              }
              if (isSelected) {
                bgColor = "#D4A500";
                textColor = "#fff";
              }
              
              return (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => !isDisabled && selectDate(date)}
                  disabled={isDisabled}
                  whileHover={!isDisabled ? { scale: 1.05 } : {}}
                  style={{
                    aspectRatio: 1,
                    background: bgColor,
                    border: isToday && !isSelected ? "2px solid #D4A500" : "1px solid #E2E8F0",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  <span style={{ 
                    fontSize: "0.85rem", 
                    fontWeight: isSelected ? 700 : 500,
                    color: textColor,
                  }}>
                    {date.getDate()}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sélection des horaires */}
        {selectedDate && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              marginBottom: 12
            }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                Heure du rendez-vous
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTimeInputMode("preset")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: timeInputMode === "preset" ? "2px solid #D4A500" : "1px solid #E2E8F0",
                    background: timeInputMode === "preset" ? "rgba(212,165,0,0.1)" : "#fff",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                  }}
                >
                  Créneaux
                </button>
                <button
                  type="button"
                  onClick={() => setTimeInputMode("manual")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: timeInputMode === "manual" ? "2px solid #D4A500" : "1px solid #E2E8F0",
                    background: timeInputMode === "manual" ? "rgba(212,165,0,0.1)" : "#fff",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                  }}
                >
                  Saisie manuelle
                </button>
              </div>
            </div>

            {/* Mode créneaux prédéfinis */}
            {timeInputMode === "preset" && (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
                maxHeight: 200,
                overflowY: "auto",
                padding: 4
              }}>
                {presetTimeSlots.map(time => {
                  const isPast = isPastTimeForToday(selectedDate, time);
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => !isPast && selectTime(time)}
                      disabled={isPast}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 10,
                        border: isSelected ? "2px solid #D4A500" : "1px solid #E2E8F0",
                        background: isSelected ? "rgba(212,165,0,0.1)" : "#fff",
                        fontSize: "0.75rem",
                        fontWeight: isSelected ? 600 : 500,
                        color: isPast ? "#CBD5E1" : (isSelected ? "#D4A500" : "#475569"),
                        cursor: isPast ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mode saisie manuelle */}
            {timeInputMode === "manual" && (
              <div style={{ 
                padding: "16px",
                background: "#F8FAFC",
                borderRadius: 16,
                border: "1px solid #E2E8F0"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <label style={{ fontSize: "0.65rem", color: "#64748B", display: "block", marginBottom: 4 }}>Heure</label>
                    <input
                      type="number"
                      value={customHour}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = "";
                        if (val > 23) val = 23;
                        if (val < 0) val = 0;
                        setCustomHour(val === "" ? "" : String(val));
                      }}
                      placeholder="00-23"
                      min="0"
                      max="23"
                      style={{
                        width: 70,
                        padding: "10px",
                        borderRadius: 10,
                        border: "1.5px solid #E2E8F0",
                        fontSize: "1rem",
                        textAlign: "center",
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "1.5rem", color: "#64748B" }}>:</span>
                  <div style={{ textAlign: "center" }}>
                    <label style={{ fontSize: "0.65rem", color: "#64748B", display: "block", marginBottom: 4 }}>Minute</label>
                    <input
                      type="number"
                      value={customMinute}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = "";
                        if (val > 59) val = 59;
                        if (val < 0) val = 0;
                        setCustomMinute(val === "" ? "" : String(val).padStart(2, '0'));
                      }}
                      placeholder="00-59"
                      min="0"
                      max="59"
                      style={{
                        width: 70,
                        padding: "10px",
                        borderRadius: 10,
                        border: "1.5px solid #E2E8F0",
                        fontSize: "1rem",
                        textAlign: "center",
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomTime}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #D4A500, #B8941E)",
                      color: "#fff",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      marginTop: 18,
                    }}
                  >
                    Appliquer
                  </button>
                </div>
                <div style={{ 
                  marginTop: 12, 
                  fontSize: "0.7rem", 
                  color: "#64748B", 
                  textAlign: "center",
                  padding: "8px",
                  background: "#fff",
                  borderRadius: 8,
                }}>
                  ⏰ Saisissez une heure entre 00:00 et 23:59
                </div>
              </div>
            )}

            {selectedTime && (
              <div style={{ 
                marginTop: 12, 
                padding: "10px 12px", 
                background: "#F0FDF4",
                borderRadius: 10,
                fontSize: "0.75rem",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Rendez-vous planifié pour le {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {selectedTime}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Instructions spéciales, préparation..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1.5px solid #E2E8F0",
              fontSize: "0.85rem",
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        {/* Boutons d'action */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            className="pd3-btn pd3-btn-outline"
            style={{ flex: 1 }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !selectedDate || !selectedTime}
            className="pd3-btn pd3-btn-gold"
            style={{ flex: 1 }}
          >
            {loading ? "Planification..." : "Confirmer le rendez-vous"}
          </button>
        </div>

        {/* Légende */}
        <div style={{ 
          display: "flex", 
          gap: 16, 
          marginTop: 24, 
          paddingTop: 16, 
          borderTop: "1px solid #E2E8F0",
          fontSize: "0.7rem",
          color: "#64748B",
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 4 }} />
            <span>Disponible</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, background: "#D4A500", borderRadius: 4 }} />
            <span>Sélectionné</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: 4 }} />
            <span>Indisponible</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, border: "2px solid #D4A500", borderRadius: 4 }} />
            <span>Aujourd'hui</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
// ═══════════════════════════════════════
// COMPOSANT BOUTON APPEL VIDÉO AVEC PLANIFICATION
// ═══════════════════════════════════════
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
        const res = await fetch(`${API}/consultations/${consultationId}/appointment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.appointment) {
            setHasAppointment(true);
            setAppointmentTime(data.appointment.scheduled_at);
          }
        }
      } catch (err) {
        console.error("Erreur vérification rendez-vous:", err);
      }
    };
    checkAppointment();
  }, [consultationId]);

  const canCall = consultationId && (consultationStatus === "accepted" || consultationStatus === "analyzed") && hasAppointment;
  const isAppointmentTime = appointmentTime && new Date(appointmentTime) <= new Date();

  const startVideoCall = () => {
    if (!consultationId) {
      alert("Aucune consultation selectionnee");
      return;
    }
    if (!hasAppointment) {
      alert("Veuillez d'abord planifier un rendez-vous avec le patient");
      return;
    }
    if (!isAppointmentTime) {
      alert(`Le rendez-vous est prevu pour le ${new Date(appointmentTime).toLocaleString("fr-FR")}. Veuillez patienter jusqu'a l'heure du rendez-vous.`);
      return;
    }
    setIsJoining(true);
    window.open(`/video-consultation/${consultationId}?room=medai-${consultationId}`, "_blank");
    setTimeout(() => setIsJoining(false), 1000);
  };

  const scheduleAppointment = async (date, time, notes) => {
    const token = localStorage.getItem("medai-token");
    const scheduledAt = new Date(date);
    const [hours, minutes] = time.split(":");
    scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const res = await fetch(`${API}/consultations/${consultationId}/appointment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scheduled_at: scheduledAt.toISOString(),
        notes: notes,
        type: "video"
      })
    });
    
    if (res.ok) {
      setHasAppointment(true);
      setAppointmentTime(scheduledAt);
      alert(`Rendez-vous planifie pour le ${scheduledAt.toLocaleString("fr-FR")}`);
    } else {
      alert("Erreur lors de la planification");
    }
  };

  const canSchedule = consultationId && (consultationStatus === "accepted" || consultationStatus === "analyzed") && !hasAppointment;

  return (
    <>
      {canSchedule && (
        <motion.button
          type="button"
          onClick={() => setShowAppointmentModal(true)}
          className="pd3-btn"
          style={{
            background: "linear-gradient(135deg, #D4A500, #B8941E)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title="Planifier un rendez-vous avec le patient"
        >
          <I.Calendar size={18} />
          Planifier
        </motion.button>
      )}

      {hasAppointment && (
        <motion.button
          type="button"
          onClick={startVideoCall}
          disabled={!isAppointmentTime || isJoining}
          className="pd3-btn"
          style={{
            background: !isAppointmentTime ? "rgba(100,116,139,0.15)" : "linear-gradient(135deg, #059669, #10B981)",
            color: !isAppointmentTime ? "rgba(255,255,255,0.4)" : "#fff",
            padding: "10px 20px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: !isAppointmentTime ? "not-allowed" : "pointer",
          }}
          whileHover={isAppointmentTime ? { scale: 1.02 } : {}}
          whileTap={isAppointmentTime ? { scale: 0.98 } : {}}
          title={!isAppointmentTime ? `Rendez-vous le ${new Date(appointmentTime).toLocaleString("fr-FR")}` : "Demarrer l'appel video"}
        >
          {isJoining ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 18, height: 18, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
          ) : (
            <>
              {!isAppointmentTime ? <I.Clock size={18} /> : <I.Video size={18} />}
              {!isAppointmentTime 
                ? new Date(appointmentTime).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                : "Appel video"}
            </>
          )}
        </motion.button>
      )}

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        consultation={consultation}
        onConfirm={scheduleAppointment}
      />
    </>
  );
};

// ═══════════════════════════════════════
// CIM-11 Chatbot Section (NOUVEAU)
// ═══════════════════════════════════════

const CIM11Section = ({ user }) => {
  const [showChatbot, setShowChatbot] = useState(true);
  
  return (
     <div style={{ height: "auto", minHeight: "500px" }}>  {/* CHANGÉ: plus de hauteur fixe */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,215,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I.Book size={22} color="#FFD700" />  {/* Utiliser I.Book au lieu de Icons.Book */}
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0A1628" }}>Assistant CIM-11</h2>
          <p style={{ fontSize: "0.75rem", color: "#64748B" }}>Classification internationale des maladies (OMS) — Base de données officielle</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowChatbot(!showChatbot)} 
          className="pd3-btn pd3-btn-outline pd3-btn-sm" 
          style={{ marginLeft: "auto" }}
        >
          {showChatbot ? "Masquer" : "Afficher"}
        </button>
      </div>
      {showChatbot && (
        <CIM11Chatbot doctor={user} height="500px" minHeight="400px" />
      )}
    </div>
  );
};
// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
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

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const sY = useSpring(heroY, { stiffness: 80, damping: 25 });

  // Domaines de l'utilisateur (pour l'affichage)
  const userDomains = (user?.domains || []);

  // Check backend connectivity on mount
  useEffect(() => {
    console.log("🔍 Checking backend connectivity...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    fetch("http://localhost:8000/health", { 
      method: "GET",
      signal: controller.signal
    })
      .then(r => {
        clearTimeout(timeoutId);
        if (r.ok) {
          console.log("✅ Backend is online");
        } else {
          console.warn("⚠️ Backend responded with:", r.status);
        }
      })
      .catch(e => {
        clearTimeout(timeoutId);
        console.error("❌ Backend connection failed:", e.message);
        alert("⚠️ Cannot connect to backend. Please ensure the server is running on localhost:8000");
      });
  }, []);

  useEffect(() => { const h = new Date().getHours(); setGreeting(h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir"); }, []);
  useEffect(() => { const i = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(i); }, []);
  useEffect(() => { const h = () => setIsScrolled(window.scrollY > 40); window.addEventListener("scroll",h,{passive:true}); return () => window.removeEventListener("scroll",h); }, []);
  useEffect(() => { const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false); }; document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h); }, []);

  const fetchAll = useCallback(async () => {
    // Guard: Don't fetch if no token available
    if (!token) {
      console.warn("⚠️ No token available, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      console.log("📡 Fetching consultation data...");
      const [qRes, aRes, nRes] = await Promise.all([
        fetch(`${API}/consultations/queue`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/consultations/assigned`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (!qRes.ok) console.warn("Queue fetch failed:", qRes.status);
      if (!aRes.ok) console.warn("Assigned fetch failed:", aRes.status);
      if (!nRes.ok) console.warn("Notifications fetch failed:", nRes.status);
      
      if (qRes.ok) setQueue((await qRes.json()).consultations || []);
      if (aRes.ok) setAssigned((await aRes.json()).consultations || []);
      if (nRes.ok) setNotifications((await nRes.json()).notifications || []);
      
      console.log("✅ Data fetched successfully");
    } catch (e) {
      console.error("❌ Error fetching consultation data:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      console.warn("⚠️ Skipping data fetch - no token available");
      setLoading(false);
      return;
    }
    
    fetchAll();
    const i = setInterval(fetchAll, 30000);
    return () => clearInterval(i);
  }, [fetchAll, token]);

  useEffect(() => {
    if (!selectedConsultation || !token) {
      setConsultationData(null);
      setMessages([]);
      setAnalysis(null);
      setExplainText("");
      return;
    }

    console.log("📡 Fetching consultation details for:", selectedConsultation);
    fetch(`${API}/consultations/${selectedConsultation}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) {
          console.warn("❌ Failed to fetch consultation details:", r.status);
          return null;
        }
        return r.json();
      })
      .then(d => {
        if (d) {
          console.log("✅ Consultation details loaded:", {
            id: d.consultation?.id,
            status: d.consultation?.status,
            doctor_id: d.consultation?.doctor_id,
            has_analysis: !!d.analysis,
          });
          setConsultationData(d.consultation);
          setMessages(d.messages || []);
          setAnalysis(d.analysis || null);
          setExplainText(d.analysis?.explain_text || "");
        }
      })
      .catch(e => console.error("❌ Error fetching consultation:", e));
  }, [selectedConsultation, token]);

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/consultations/${id}/accept`, {method:"POST",headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erreur ${res.status}`);
      }

      // Vider les données précédentes
      setConsultationData(null);
      setAnalysis(null);
      setExplainText("");
      setMessages([]);
      setActiveTab("messages");

      // Forcer le re-déclenchement du useEffect même si id === selectedConsultation
      setSelectedConsultation(null);
      setTimeout(() => setSelectedConsultation(id), 100);

      fetchAll();
    } catch (e) {
      alert("Impossible d'accepter la consultation: " + (e.message || e));
    } finally {
      setActionLoading(null);
    }
  };
  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/consultations/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ reason: "" })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }
      console.log("✅ Consultation rejected");
      setActionLoading(null);
      fetchAll();
    } catch (e) {
      console.error("❌ Error rejecting consultation:", e);
      alert("Failed to reject: " + (e.message || e));
      setActionLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;
    await fetch(`${API}/consultations/${selectedConsultation}/messages`, {method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({content:msgInput.trim(),msg_type:"text"})});
    setMsgInput("");
    const r = await fetch(`${API}/consultations/${selectedConsultation}`, {headers:{Authorization:`Bearer ${token}`}});
    if (r.ok) setMessages((await r.json()).messages || []);
  };

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    setExplainText("");
    setExplaining(false);
    setAnalysis(null);

    try {
      const res = await fetch(
        `${API}/consultations/${selectedConsultation}/run-analysis?gradcam=true`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Erreur serveur ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullExplain = "";

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
              // ← C'était le bug : cet event n'était jamais traité
              setAnalysis({
                prediction:    evt.prediction,
                confidence:    evt.confidence,
                probabilities: JSON.stringify(evt.probabilities || {}),
                gradcam_b64:   evt.gradcam_image || "",
                out_of_domain: evt.out_of_domain || false,
                warning:       evt.warning || "",
                explain_text:  "",
              });
              setAnalysisLoading(false);
              if (!evt.out_of_domain) setExplaining(true);
            }

            if (evt.type === "explain_chunk") {
              fullExplain += evt.text;
              setExplainText(fullExplain);
            }

            if (evt.type === "saved") {
              setExplaining(false);
            }

            if (evt.type === "error" || evt.type === "save_error") {
              console.error("SSE error:", evt);
              setExplaining(false);
            }

          } catch (_) { /* ligne mal formée, on ignore */ }
        }
      }

      // Recharger depuis la DB pour avoir l'analyse complète sauvegardée
      await new Promise(r => setTimeout(r, 500)); // laisser le backend finir la sauvegarde
      const dR = await fetch(`${API}/consultations/${selectedConsultation}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dR.ok) {
        const d = await dR.json();
        if (d.analysis) {
          setAnalysis(d.analysis);
          if (d.analysis.explain_text) setExplainText(d.analysis.explain_text);
        }
        if (d.consultation) setConsultationData(d.consultation);
        setMessages(d.messages || []);
      }

    } catch (e) {
      console.error("❌ Analyse error:", e);
      alert("Erreur lors de l'analyse : " + e.message);
    } finally {
      setAnalysisLoading(false);
      setExplaining(false);
      fetchAll();
    }
  };

  const handleDownloadPDF = async () => {
  if (!analysis || !consultationData) return;
  if (explaining) {
    alert("Veuillez attendre la fin de l'explication IA avant de telecharger le rapport PDF.");
    return;
  }
  setPdfLoading(true);
  
  try {
    console.log("📄 Génération du PDF...");
    console.log("Consultation data:", consultationData);
    
    // 1. Récupérer l'image - plusieurs tentatives avec différents chemins
    let imageBlob = null;
    let imagePath = consultationData.image_path;
    
    // Essayer différents chemins possibles
    const possiblePaths = [
      `http://localhost:8000/uploads/${imagePath?.split('/').pop()}`,
      `http://localhost:8000/${imagePath}`,
      `http://localhost:8000/uploads/consultations/${imagePath?.split('/').pop()}`,
    ];
    
    for (const path of possiblePaths) {
      try {
        console.log("Tentative chargement image:", path);
        const imgRes = await fetch(path, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (imgRes.ok) {
          imageBlob = await imgRes.blob();
          console.log("✅ Image chargée depuis:", path);
          break;
        }
      } catch (err) {
        console.warn("Échec chargement depuis:", path, err.message);
      }
    }
    
    if (!imageBlob) {
      console.warn("⚠️ Image originale non trouvée, utilisation d'une image par défaut");
      const defaultImgRes = await fetch("https://placehold.co/800x600/e2e8f0/475569?text=Radiographie");
      if (defaultImgRes.ok) {
        imageBlob = await defaultImgRes.blob();
      } else {
        throw new Error("Impossible de charger l'image");
      }
    }
    
    // 2. Préparer le formulaire
    const form = new FormData(); 
    form.append("file", new File([imageBlob], "radiographie.jpg", { type: "image/jpeg" }));
    form.append("explain_text", explainText || analysis.explain_text || "");
    form.append("gradcam_image", analysis.gradcam_b64 || "");
    
    const reportProbabilities = (() => {
      const raw = analysis.probabilities || {};
      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          return JSON.stringify(parsed && typeof parsed === "object" ? parsed : {});
        } catch {
          return "{}";
        }
      }
      return JSON.stringify(raw);
    })();
    
    // 3. Paramètres du rapport
    const params = new URLSearchParams({
      model: consultationData.model_key || "chest",
      patient_id: consultationData.patient_name || "Patient",
      prediction: analysis.prediction,
      confidence: String(analysis.confidence || 0),
      probabilities: reportProbabilities,
      report_id: `MEDAI-${Date.now().toString(36).toUpperCase()}`
    });
    
    console.log("📤 Envoi requête PDF...");
    
    // 4. Générer le PDF
    const res = await fetch(`${API}/report?${params}`, { 
      method: "POST", 
      headers: { 
        Authorization: `Bearer ${token}`,
      }, 
      body: form 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erreur API PDF:", res.status, errorText);
      throw new Error(`Erreur ${res.status}: ${errorText}`);
    }
    
    // 5. Télécharger le PDF
    const pdfBlob = await res.blob();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = `rapport_medical_${consultationData.id}_${new Date().toISOString().slice(0,19)}.pdf`;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url);
    
    console.log("✅ PDF téléchargé avec succès");
    
  } catch (e) { 
    console.error("❌ Erreur PDF:", e);
    alert("Erreur de génération du PDF: " + e.message + "\n\nVeuillez réessayer ou contacter l'administrateur.");
  } finally { 
    setPdfLoading(false); 
  }
};

  const handleClose = async () => {
    const form = new FormData(); form.append("doctor_notes", closeNotes);
    await fetch(`${API}/consultations/${selectedConsultation}/close`, {method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
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

  // Domaines display avec couleurs
  const getDomainColor = (d) => {
    const colors = {
      chest: { color: "#2D5F9E", bg: "#EFF6FF" },
      brain: { color: "#6B4FA0", bg: "#F5F3FF" },
      lung: { color: "#D62828", bg: "#FEF2F2" },
      retina: { color: "#0E7490", bg: "#ECFEFF" },
    };
    return colors[d] || { color: "#64748B", bg: "#F1F5F9" };
  };

  const getDomainIcon = (d) => {
    const icons = { chest: "🫁", brain: "🧠", lung: "🔬", retina: "👁️" };
    return icons[d] || "🏥";
  };

  const getDomainLabel = (d) => {
    const labels = { chest: "Radiologie Thoracique", brain: "Neurologie & IRM", lung: "Cancer Pulmonaire", retina: "Rétinopathie Diabétique" };
    return labels[d] || d;
  };

  const getDomainAccuracy = (d) => {
    const acc = { chest: "97.3%", brain: "96.2%", lung: "94.8%", retina: "92.1%" };
    return acc[d] || "—";
  };

  const getDomainClasses = (d) => {
    const classes = { chest: "10 pathologies", brain: "4 tumeurs", lung: "3 classes", retina: "5 stades DR" };
    return classes[d] || "—";
  };
  const CIMIcons = {
  Book: ({ size = 22, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

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
                          return (
                            <span key={d} style={{
                              display:"inline-flex",alignItems:"center",gap:3,
                              padding:"1px 6px",borderRadius:6,fontSize:"0.6rem",fontWeight:600,
                              background:cfg.bg,color:cfg.color,
                            }}>
                              {getDomainIcon(d)} {d}
                            </span>
                          );
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
                    return (
                      <span key={d} style={{
                        display:"inline-flex",alignItems:"center",gap:3,
                        padding:"2px 8px",borderRadius:6,fontSize:"0.7rem",fontWeight:600,
                        background:cfg.bg,color:cfg.color,
                      }}>
                        {getDomainIcon(d)} {d}
                      </span>
                    );
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
    {id:"analytics",label:"Statistiques",icon:<I.Star size={16}/>},
    {id:"video",label:"Vidéo",icon:<I.Video size={16}/>},  // NOUVEAU
    {id:"cim11",label:"Assistant CIM-11",icon:<I.Book size={16}/>}
  ].map(tab=>(
    <button 
      type="button" 
      key={tab.id} 
      className={`pd3-tab ${activeTab===tab.id?"active":""}`} 
      onClick={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        const currentScroll = window.scrollY;
        setActiveTab(tab.id);
        setTimeout(() => window.scrollTo(0, currentScroll), 0);
      }}
    >
      <span className="pd3-tab-icon">{tab.icon}</span> {tab.label}
    </button>
  ))}
</div></Reveal>

        <AnimatePresence mode="wait">
          {/* OVERVIEW TAB */}
          {activeTab==="overview"&&(<motion.div key="overview" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Activity size={12}/> VUE D'ENSEMBLE</div><h2 className="pd3-section-title">Tableau de bord <span className="accent">médecin</span></h2><p className="pd3-section-sub">Gérez vos consultations en temps réel</p></div></Reveal><div className="pd3-metrics-grid">{[{icon:I.Folder,label:"En attente",value:stats.queue,color:"#D4A500",bg:"rgba(212,165,0,0.08)"},{icon:I.Clock,label:"En cours",value:stats.active,color:"#3B82F6",bg:"rgba(59,130,246,0.08)"},{icon:I.Check,label:"Analysées",value:stats.analyzed,color:"#10B981",bg:"rgba(16,185,129,0.08)"},{icon:I.Shield,label:"Terminées",value:stats.closed,color:"#6B7280",bg:"rgba(107,114,128,0.08)"}].map((s,i)=>(<Reveal key={i} delay={i*.06}><motion.div className="pd3-metric" style={{"--metric-color":s.color}} whileHover={{y:-6}}><div className="pd3-metric-icon" style={{background:s.bg,color:s.color}}><s.icon size={24}/></div><div className="pd3-metric-value" style={{color:s.color}}>{s.value}</div><div className="pd3-metric-label">{s.label}</div></motion.div></Reveal>))}</div>
          
          {/* Section Accès rapide par domaine (comme dans MedecinDashboard) */}
          {userDomains.length > 1 && (
            <div style={{marginTop:20,marginBottom:30,background:"white",borderRadius:20,padding:"22px",border:"1px solid #E2E8F0"}}>
              <h2 style={{fontSize:"1rem",fontWeight:800,color:"#0A2647",marginBottom:16}}>Mes spécialités</h2>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(userDomains.length,4)}, 1fr)`,gap:12}}>
                {userDomains.map(d => {
                  const cfg = getDomainColor(d);
                  return (
                    <div key={d} style={{
                      padding:"16px",borderRadius:14,
                      background:cfg.bg,border:`1px solid ${cfg.color}30`,
                      cursor:"pointer",transition:"all .2s",
                    }}
                      onClick={() => navigate("/classification")}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = ""}
                    >
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

          <Reveal delay={.1}><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Sparkles size={16} color="#D4A500"/> Actions rapides</span></div></Reveal>
          <div className="pd3-actions-grid">
            {[
              {icon:I.Folder,label:"File d'attente",desc:"Gérer les demandes",color:"#D4A500",bg:"rgba(212,165,0,0.08)",action:()=>setActiveTab("consultations")},
              {icon:I.Scan,label:"Analyse libre",desc:"Classifier une image",color:"#8B5CF6",bg:"rgba(139,92,246,0.08)",action:()=>navigate("/classification")},
              {icon:I.Message,label:"Messages",desc:"Communiquer avec patients",color:"#10B981",bg:"rgba(16,185,129,0.08)",action:()=>setActiveTab("messages")},
              {icon:I.BarChart,label:"Statistiques",desc:"Vue globale",color:"#3B82F6",bg:"rgba(59,130,246,0.08)",action:()=>setActiveTab("analytics")},
              {icon:I.Book,label:"Assistant CIM-11",desc:"Classification OMS",color:"#0099cc",bg:"rgba(0,153,204,0.08)",action:()=>setActiveTab("cim11")}
            ].map((a,i)=>(<Reveal key={i} delay={.12+i*.06}><motion.button type="button" className="pd3-action" onClick={a.action} whileHover={{y:-5}}><div className="pd3-action-top"><div className="pd3-action-icon" style={{background:a.bg,color:a.color}}><a.icon size={22}/></div><div className="pd3-action-arrow"><I.ChevronRight size={14}/></div></div><div className="pd3-action-label">{a.label}</div><div className="pd3-action-desc">{a.desc}</div></motion.button></Reveal>))}
          </div>
          <Reveal delay={.15}><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Folder size={16} color="#D4A500"/> Consultations récentes</span></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{loading?<div style={{textAlign:"center",padding:40}}><I.Sparkles size={32} color="#D4A500"/></div>:[...assigned.slice(0,3),...queue.slice(0,2)].slice(0,5).map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}}/>)}</div></Reveal></motion.div>)}

          {/* CONSULTATIONS TAB */}
          {activeTab==="consultations"&&(<motion.div key="consultations" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Folder size={12}/> CONSULTATIONS</div><h2 className="pd3-section-title">File d'attente <span className="accent">({queue.length})</span></h2></div></Reveal><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>{queue.map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}} onAccept={()=>handleAccept(c.id)} onReject={()=>handleReject(c.id)} actionLoading={actionLoading===c.id}/>)}</div>{assigned.filter(c=>c.status!=="closed").length>0&&<><Reveal><h2 className="pd3-section-title" style={{marginBottom:24}}>Mes dossiers <span className="accent">actifs</span></h2></Reveal><div style={{display:"flex",flexDirection:"column",gap:8}}>{assigned.filter(c=>c.status!=="closed").map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}}/>)}</div></>}</motion.div>)}

          {/* MESSAGES & ANALYSE TAB */}
{activeTab === "messages" && (
  <motion.div 
    key="messages" 
    initial={{ opacity: 0, y: 15 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0, y: -10 }} 
    style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 500px",  // Changé de 480px à 500px
      gap: 28,                           // Augmenté
      alignItems: "start",
    }}
  >
    <ChatSection 
      consultationData={consultationData} 
      messages={messages} 
      msgInput={msgInput} 
      setMsgInput={setMsgInput} 
      onSend={handleSendMessage} 
      canMessage={canMessage} 
      onClose={() => setShowCloseModal(true)} 
      model={model} 
      loading={loading}
    />
    <AnalysisSection 
      analysis={analysis} 
      analysisLoading={analysisLoading} 
      explainText={explainText} 
      explaining={explaining} 
      onRunAnalysis={handleRunAnalysis} 
      onDownloadPDF={handleDownloadPDF} 
      consultationData={consultationData} 
      model={model}
    />
  </motion.div>
)}

          {/* STATISTIQUES TAB */}
          {activeTab==="analytics"&&(<motion.div key="analytics" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Star size={12}/> STATISTIQUES</div><h2 className="pd3-section-title">Vue <span className="accent">globale</span></h2></div></Reveal><div className="pd3-metrics-grid">{[{icon:I.Folder,label:"Total",value:queue.length+assigned.length,color:"#0A1628"},{icon:I.Clock,label:"En attente",value:stats.queue,color:"#D4A500"},{icon:I.Activity,label:"En cours",value:stats.active,color:"#3B82F6"},{icon:I.Check,label:"Analysées",value:stats.analyzed,color:"#10B981"}].map((s,i)=><Reveal key={i} delay={i*.06}><motion.div className="pd3-metric"><div className="pd3-metric-icon" style={{background:`${s.color}15`,color:s.color}}><s.icon size={24}/></div><div className="pd3-metric-value" style={{color:s.color}}>{s.value}</div><div className="pd3-metric-label">{s.label}</div></motion.div></Reveal>)}</div></motion.div>)}


          {/* VIDEO TAB - CONSULTATION EN LIGNE */}
{activeTab === "video" && (
  <motion.div 
    key="video" 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    transition={{ duration: 0 }}
  >
    <Reveal>
      <div className="pd3-section-header">
        <div className="pd3-section-badge"><I.Video size={12}/> TÉLÉMÉDECINE</div>
        <h2 className="pd3-section-title">Consultation <span className="accent">en ligne</span></h2>
        <p className="pd3-section-sub">Appels vidéo sécurisés avec vos patients — Chiffrement de bout en bout</p>
      </div>
    </Reveal>

    <div className="pd3-video-container" style={{
      display: "grid",
      gridTemplateColumns: "1fr 380px",
      gap: 24,
      marginTop: 20,
    }}>
      {/* Section de gauche - Liste des consultations actives */}
      <div>
        <Reveal>
          <div className="pd3-section-row">
            <span className="pd3-section-row-title"><I.Video size={16} color="#D4A500"/> Consultations actives</span>
          </div>
        </Reveal>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {assigned.filter(c => c.status === "accepted" || c.status === "analyzed").length === 0 ? (
            <div className="pd3-empty">
              <div className="pd3-empty-icon"><I.Video size={32} color="#D4A500"/></div>
              <div className="pd3-empty-title">Aucune consultation active</div>
              <div className="pd3-empty-desc">Acceptez des consultations pour démarrer des appels vidéo</div>
            </div>
          ) : (
            assigned.filter(c => c.status === "accepted" || c.status === "analyzed").map(consultation => {
              const model = MODEL_CONFIG[consultation.model_key] || MODEL_CONFIG.chest;
              const urgency = URGENCY_CONFIG[consultation.urgency] || URGENCY_CONFIG.normal;
              return (
                <motion.div
                  key={consultation.id}
                  className="pd3-video-card"
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "20px",
                    border: selectedConsultation === consultation.id ? "2px solid #10B981" : "1px solid #E5E7EB",
                    borderLeft: `4px solid ${urgency.color}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => {
                    const currentScroll = window.scrollY;
                    setSelectedConsultation(consultation.id);
                    setTimeout(() => window.scrollTo(0, currentScroll), 0);
                  }}
                  whileHover={{ x: 4 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 50, height: 50, borderRadius: 14,
                      background: model.bg, color: model.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {model.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0A1628" }}>{consultation.patient_name}</span>
                        <span style={{ fontSize: "0.65rem", color: "#8899AA" }}>#{consultation.id}</span>
                        <span style={{
                          padding: "2px 8px", borderRadius: 12, fontSize: "0.6rem",
                          fontWeight: 600, background: urgency.bg, color: urgency.color
                        }}>
                          {urgency.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <StatusBadge status={consultation.status}/>
                        <span style={{ fontSize: "0.7rem", color: "#8899AA" }}>{model.label}</span>
                      </div>
                    </div>
                    <VideoCallButton 
                      consultationId={consultation.id}
                      consultationStatus={consultation.status}
                      consultation={consultation}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Section de droite - Informations et guide */}
      <div>
        <div className="pd3-health-card" style={{ height: "auto", minHeight: "auto" }}>
          <div className="pd3-health-bg-pattern"/>
          <div className="pd3-health-content">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: "rgba(16,185,129,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <I.Camera size={24} color="#10B981"/>
              </div>
              <div>
                <h3 style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Appel sécurisé</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>Chiffrement de bout en bout</p>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <I.Shield size={20} color="#10B981"/>
                <div><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>Sécurité maximale</div><div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>Conforme RGPD / HIPAA</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <I.Clock size={20} color="#10B981"/>
                <div><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>Qualité HD</div><div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>Jusqu'à 1080p</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <I.Users size={20} color="#10B981"/>
                <div><div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fff" }}>Jusqu'à 5 participants</div><div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>Incluant le patient</div></div>
              </div>
            </div>

            <div style={{
              background: "rgba(16,185,129,0.1)",
              borderRadius: 12,
              padding: "16px",
              border: "1px solid rgba(16,185,129,0.2)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <I.Message size={16} color="#10B981"/>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10B981" }}>Comment démarrer ?</span>
              </div>
              <ol style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.7rem", lineHeight: 1.8, marginLeft: 20 }}>
                <li>Acceptez une consultation en attente</li>
                <li>Cliquez sur "Appel vidéo" dans la consultation</li>
                <li>Une nouvelle fenêtre s'ouvre avec la salle Jitsi</li>
                <li>Partagez le lien avec le patient si nécessaire</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
)}

          {/* NOUVEAU: CIM-11 TAB */}
         {/* NOUVEAU: CIM-11 TAB */}
        {activeTab==="cim11"&&(
          <motion.div 
            key="cim11" 
            initial={{opacity:0,y:15}} 
            animate={{opacity:1,y:0}} 
            exit={{opacity:0,y:-10}}
            style={{ height: "auto" }}  // CHANGÉ: hauteur auto
          >
            <CIM11Section user={user} />
          </motion.div>
        )}
        </AnimatePresence>

        <Reveal><section className="pd3-platform"><div className="pd3-platform-grid">{[{icon:I.Scan,value:50000,suffix:"+",label:"Radiographies analysées"},{icon:I.Brain,value:98,suffix:".5%",label:"Précision de détection"},{icon:I.Lungs,value:14,suffix:"+",label:"Pathologies couvertes"},{icon:I.Shield,value:100,suffix:"%",label:"Données sécurisées"}].map((s,i)=><motion.div key={i} className="pd3-platform-item" whileHover={{y:-4}}><div className="pd3-platform-icon"><s.icon size={30} color="#D4A500"/></div><div className="pd3-platform-value">{s.value}{s.suffix}</div><div className="pd3-platform-label">{s.label}</div>{i<3&&<div className="pd3-platform-div"/>}</motion.div>)}</div></section></Reveal>

        <footer className="hp-footer" style={{marginTop:40}}><div className="hp-footer-inner"><div className="hp-footer-grid"><div className="hp-footer-brand"><div className="hp-nav-logo" style={{marginBottom:16}}><div className="hp-logo-icon"><I.Lungs size={18} color="#fff"/></div><span style={{color:"#fff"}}>Med<span style={{color:"#FFD700"}}>AI</span></span></div><p>Plateforme médicale de diagnostic assisté par IA. Transformant la radiologie avec l'apprentissage profond depuis 2024.</p><div className="hp-footer-socials">{["LI","TW","GH","YT","IN"].map((s,i)=><div className="hp-footer-social" key={i}>{s}</div>)}</div></div><div><h4>PRODUIT</h4>{["Analyse IA","Radiologues","API Access","Mobile App","Tarifs"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div><div><h4>ENTREPRISE</h4>{["À propos","Carrières","Recherche","Blog","Contact"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div><div><h4>RESSOURCES</h4>{["Documentation","Études de cas","Whitepapers","Support","Statut"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div></div><div className="hp-footer-bottom"><span>© 2025 MedAI — Plateforme médicale certifiée · Tous droits réservés</span><div className="hp-footer-bottom-links">{["Confidentialité","Conditions","Sécurité","HIPAA","RGPD","Contact"].map(x=><a href="#" key={x}>{x}</a>)}</div></div></div></footer>
      </div>

      <AnimatePresence>{showCloseModal&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><motion.div initial={{scale:.95}} animate={{scale:1}} style={{background:"#fff",borderRadius:20,padding:28,maxWidth:460,width:"100%"}}><h2 style={{fontWeight:800,color:"#0A1628",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><I.Shield size={20} color="#6B7280"/> Clôturer la consultation</h2><textarea value={closeNotes} onChange={e=>setCloseNotes(e.target.value)} placeholder="Notes de clôture, recommandations..." rows={4} style={{width:"100%",padding:12,borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:"0.85rem",fontFamily:"inherit",resize:"none",outline:"none",marginBottom:18,boxSizing:"border-box"}}/><div style={{display:"flex",gap:10}}><button type="button" onClick={()=>{setShowCloseModal(false);setCloseNotes("");}} className="pd3-btn pd3-btn-outline" style={{flex:1}}>Annuler</button><button type="button" onClick={handleClose} className="pd3-btn pd3-btn-gold" style={{flex:1}}>Confirmer la clôture</button></div></motion.div></motion.div>)}</AnimatePresence>
    </div>
  );
}