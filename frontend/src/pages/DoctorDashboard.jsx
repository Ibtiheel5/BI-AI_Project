// DoctorDashboard.jsx — Version Finale Complète (Premium Gold/Navy)
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import "./patient/PatientDashboard.css";
import { useAuth } from "../context/AuthContext";

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
};

// ═══════════════════════════════════════
// Helper: Display name without double Dr.
// ═══════════════════════════════════════
const getDisplayName = (fullName) => {
  if (!fullName) return "Médecin";
  const cleanName = fullName.trim();
  // Check if already starts with "Dr." or "Dr "
  if (/^dr[.\s]/i.test(cleanName)) return cleanName;
  return `Dr. ${cleanName}`;
};

const getFirstName = (fullName) => {
  if (!fullName) return "Médecin";
  // Remove "Dr." prefix if present
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
          <button onClick={e=>{e.stopPropagation();onAccept();}} disabled={actionLoading} className="pd3-btn pd3-btn-gold pd3-btn-sm">{actionLoading?"...":"Accepter"}</button>
          <button onClick={e=>{e.stopPropagation();onReject();}} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{color:"#EF4444",borderColor:"#FCA5A5"}}>Refuser</button>
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

  // Parse explain sections
  const sections = useMemo(() => {
    if (!explainText) return [];
    const result = [];
    let current = null;
    let lines = [];
    for (const line of explainText.split("\n")) {
      if (line.startsWith("## ")) {
        if (current) result.push({title:current,content:lines.join("\n").trim()});
        current = line.replace(/^## /,"").trim();
        lines = [];
      } else if (current) {
        lines.push(line);
      }
    }
    if (current) result.push({title:current,content:lines.join("\n").trim()});
    return result;
  }, [explainText]);

  if (!consultationData) {
    return (
      <div className="pd3-health-card" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 280px)"}}>
        <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
        <div className="pd3-health-content" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
          <div style={{color:"rgba(255,255,255,0.4)"}}>
            <I.Brain size={48} color="rgba(255,255,255,0.15)" style={{marginBottom:16}}/>
            <div style={{fontWeight:600,fontSize:"0.95rem",color:"rgba(255,255,255,0.5)",marginBottom:4}}>Analyse IA</div>
            <div style={{fontSize:"0.8rem"}}>Sélectionnez une consultation pour voir l'analyse</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pd3-health-card" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 280px)"}}>
      <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
      <div className="pd3-health-content" style={{flex:1,display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <I.Brain size={18} color="#FFD700"/>
            <span style={{fontWeight:700,color:"#FFD700",fontSize:"0.9rem"}}>Analyse IA</span>
            {analysis && !analysisLoading && <span style={{fontSize:"0.65rem",padding:"2px 8px",borderRadius:10,background:"rgba(16,185,129,0.15)",color:"#10B981",fontWeight:600}}>Complète</span>}
          </div>
          {analysis && <span style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)"}}>{model?.label}</span>}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {analysisLoading ? (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1.5,ease:"linear"}}>
                <I.Sparkles size={32} color="#FFD700"/>
              </motion.div>
              <div style={{marginTop:12,color:"rgba(255,255,255,0.6)",fontSize:"0.85rem"}}>Analyse en cours...</div>
              <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.3)",marginTop:4}}>Traitement par le modèle {model?.label}</div>
            </div>
          ) : analysis ? (
            <>
              {/* Prediction Card */}
              <div style={{padding:14,background:"rgba(16,185,129,0.08)",borderRadius:14,border:"1px solid rgba(16,185,129,0.2)",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <I.Check size={16} color="#10B981"/>
                  <span style={{fontWeight:700,color:"#10B981",fontSize:"0.9rem"}}>Diagnostic : {analysis.prediction}</span>
                </div>
                <div style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.4)"}}>Confiance</span>
                    <span style={{fontSize:"0.72rem",fontWeight:700,color:"#fff"}}>{(analysis.confidence*100).toFixed(1)}%</span>
                  </div>
                  <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3}}>
                    <motion.div style={{height:"100%",background:"linear-gradient(90deg,#10B981,#34D399)",borderRadius:3}} initial={{width:0}} animate={{width:`${analysis.confidence*100}%`}} transition={{duration:1,delay:.3}}/>
                  </div>
                </div>
              </div>

              {/* Probabilities */}
              {probabilities.length > 0 && (
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Distribution des probabilités</div>
                  {probabilities.slice(0,6).map(([cls,prob])=>(
                    <div key={cls} style={{marginBottom:6}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                        <span style={{fontSize:"0.72rem",color:cls===analysis.prediction?"#10B981":"rgba(255,255,255,0.5)",fontWeight:cls===analysis.prediction?700:400}}>{cls===analysis.prediction&&"► "}{cls}</span>
                        <span style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.6)"}}>{(prob*100).toFixed(1)}%</span>
                      </div>
                      <div style={{height:3,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                        <motion.div style={{height:"100%",background:cls===analysis.prediction?"#10B981":"rgba(255,255,255,0.15)",borderRadius:2}} initial={{width:0}} animate={{width:`${(prob/Math.max(...probabilities.map(([,p])=>p)))*100}%`}} transition={{duration:.8,delay:.4}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Explain Text */}
              {sections.length > 0 ? (
                <div>
                  <div style={{fontSize:"0.7rem",fontWeight:600,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Explication clinique</div>
                  {sections.map((sec,idx)=>(
                    <div key={idx} style={{marginBottom:12}}>
                      <div style={{padding:"6px 12px",background:"rgba(255,215,0,0.08)",borderLeft:"3px solid #FFD700",borderRadius:"0 8px 8px 0",marginBottom:6,fontSize:"0.72rem",fontWeight:700,color:"#FFD700"}}>{sec.title}</div>
                      <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.55)",lineHeight:1.7,padding:"0 8px",whiteSpace:"pre-wrap"}}>{sec.content}</div>
                    </div>
                  ))}
                </div>
              ) : explainText ? (
                <div style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.55)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{explainText}</div>
              ) : null}

              {explaining && (
                <div style={{display:"flex",gap:4,padding:"8px 0"}}>
                  {[0,0.15,0.3].map((d,i)=>(<div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#FFD700",animation:`typing 1s ease-in-out ${d}s infinite`}}/>))}
                </div>
              )}
            </>
          ) : consultationData?.status === "accepted" ? (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <I.Brain size={40} color="rgba(255,255,255,0.2)" style={{marginBottom:14}}/>
              <div style={{fontSize:"0.88rem",fontWeight:600,color:"rgba(255,255,255,0.6)",marginBottom:6}}>Prêt pour l'analyse</div>
              <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.35)",marginBottom:16,lineHeight:1.5}}>Lancez l'analyse IA pour obtenir<br/>le diagnostic et l'explication.</div>
              <button onClick={onRunAnalysis} className="pd3-btn pd3-btn-gold" style={{display:"inline-flex",alignItems:"center",gap:8}}>
                <I.Sparkles size={16}/> Lancer l'analyse IA
              </button>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.3)"}}>
              <I.Clock size={36} style={{marginBottom:12}}/>
              <div style={{fontSize:"0.85rem",fontWeight:600}}>Analyse non disponible</div>
              <div style={{fontSize:"0.72rem",marginTop:4}}>Acceptez d'abord la consultation</div>
            </div>
          )}
        </div>

        {/* Actions */}
        {analysis && (
          <div style={{paddingTop:12,borderTop:"1px solid rgba(232,184,48,0.1)",flexShrink:0}}>
            <button onClick={onDownloadPDF} className="pd3-btn pd3-btn-gold" style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <I.Download size={14}/> Télécharger le rapport PDF
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
const ChatSection = ({ consultationData, messages, msgInput, setMsgInput, onSend, canMessage, onClose, model, loading }) => {
  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  if (!consultationData) {
    return (
      <div className="pd3-health-card" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 280px)"}}>
        <div className="pd3-health-bg-pattern"/><div className="pd3-health-glow-1"/><div className="pd3-health-glow-2"/>
        <div className="pd3-health-content" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
          <div style={{color:"rgba(255,255,255,0.4)"}}>
            <I.Message size={48} color="rgba(255,255,255,0.15)" style={{marginBottom:16}}/>
            <div style={{fontWeight:600,fontSize:"0.95rem",color:"rgba(255,255,255,0.5)",marginBottom:4}}>Messagerie</div>
            <div style={{fontSize:"0.8rem"}}>Sélectionnez une consultation pour voir les messages</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pd3-health-card" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 280px)"}}>
      {/* Header */}
      <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(232,184,48,0.1)",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {model?.icon||<I.Scan size={18} color="#FFD700"/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:"#fff",fontSize:"0.9rem"}}>{consultationData.patient_name}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <span style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.4)"}}>#{consultationData.id}</span>
            <StatusBadge status={consultationData.status}/>
          </div>
        </div>
        {canMessage && (
          <button onClick={onClose} className="pd3-btn pd3-btn-outline pd3-btn-sm" style={{color:"#fff",borderColor:"rgba(255,255,255,0.2)"}}>
            <I.Shield size={14}/> Clôturer
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
        {messages.length === 0 ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",textAlign:"center",color:"rgba(255,255,255,0.3)"}}>
            <I.Message size={40} style={{marginBottom:12}}/>
            <div style={{fontSize:"0.88rem",fontWeight:600,color:"rgba(255,255,255,0.4)"}}>Aucun message</div>
            <div style={{fontSize:"0.75rem",marginTop:4}}>Commencez la discussion avec le patient</div>
          </div>
        ) : (
          messages.map(m => <MessageBubble key={m.id} message={m} isDoctor={true}/>)
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input */}
      {canMessage ? (
        <div style={{padding:"12px 16px",borderTop:"1px solid rgba(232,184,48,0.1)",display:"flex",gap:8,flexShrink:0,background:"rgba(0,0,0,0.1)"}}>
          <input 
            value={msgInput} 
            onChange={e=>setMsgInput(e.target.value)} 
            onKeyDown={e=>e.key==="Enter"&&onSend()} 
            placeholder="Écrire un message au patient..." 
            style={{flex:1,padding:"10px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",color:"#fff",outline:"none",fontFamily:"inherit",fontSize:"0.85rem"}} 
          />
          <button onClick={onSend} disabled={!msgInput.trim()} className="pd3-btn pd3-btn-gold pd3-btn-sm" style={{width:42,height:42,minWidth:42,padding:0}}>
            <I.Send size={14}/>
          </button>
        </div>
      ) : (
        <div style={{padding:"12px 20px",background:"rgba(0,0,0,0.1)",borderTop:"1px solid rgba(232,184,48,0.1)",fontSize:"0.75rem",color:"rgba(255,255,255,0.3)",textAlign:"center",flexShrink:0}}>
          Messages disponibles après acceptation de la consultation
        </div>
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

  useEffect(() => { const h = new Date().getHours(); setGreeting(h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir"); }, []);
  useEffect(() => { const i = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(i); }, []);
  useEffect(() => { const h = () => setIsScrolled(window.scrollY > 40); window.addEventListener("scroll",h,{passive:true}); return () => window.removeEventListener("scroll",h); }, []);
  useEffect(() => { const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false); }; document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h); }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, aRes, nRes] = await Promise.all([
        fetch(`${API}/consultations/queue`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/consultations/assigned`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/consultations/notifications/me?unread_only=false`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (qRes.ok) setQueue((await qRes.json()).consultations || []);
      if (aRes.ok) setAssigned((await aRes.json()).consultations || []);
      if (nRes.ok) setNotifications((await nRes.json()).notifications || []);
    } catch (e) {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 30000); return () => clearInterval(i); }, [fetchAll]);

  useEffect(() => {
    if (!selectedConsultation) { setConsultationData(null); setMessages([]); setAnalysis(null); setExplainText(""); return; }
    fetch(`${API}/consultations/${selectedConsultation}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setConsultationData(d.consultation); setMessages(d.messages || []); setAnalysis(d.analysis); if (d.analysis?.explain_text) setExplainText(d.analysis.explain_text); } });
  }, [selectedConsultation, token]);

  const handleAccept = async (id) => { setActionLoading(id); await fetch(`${API}/consultations/${id}/accept`, {method:"POST",headers:{Authorization:`Bearer ${token}`}}); setActionLoading(null); fetchAll(); setSelectedConsultation(id); setActiveTab("messages"); };
  const handleReject = async (id) => { setActionLoading(id); await fetch(`${API}/consultations/${id}/reject`, {method:"POST",headers:{Authorization:`Bearer ${token}`},body:new URLSearchParams({reason:""})}); setActionLoading(null); fetchAll(); };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedConsultation) return;
    await fetch(`${API}/consultations/${selectedConsultation}/messages`, {method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({content:msgInput.trim(),msg_type:"text"})});
    setMsgInput("");
    const r = await fetch(`${API}/consultations/${selectedConsultation}`, {headers:{Authorization:`Bearer ${token}`}});
    if (r.ok) setMessages((await r.json()).messages || []);
  };

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true); setExplainText(""); setExplaining(true);
    try {
      const res = await fetch(`${API}/consultations/${selectedConsultation}/run-analysis`, {method:"POST",headers:{Authorization:`Bearer ${token}`}});
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = "", fullExplain = "";
      while (true) {
        const {done, value} = await reader.read(); if (done) break;
        buffer += decoder.decode(value, {stream:true}); const lines = buffer.split("\n"); buffer = lines.pop();
        for (const line of lines) { if (line.startsWith("data: ")) { try { const evt = JSON.parse(line.slice(6)); if (evt.type === "explain_chunk") { fullExplain += evt.text; setExplainText(fullExplain); } if (evt.type === "done"||evt.type==="saved") setExplaining(false); } catch {} } }
      }
      const dR = await fetch(`${API}/consultations/${selectedConsultation}`, {headers:{Authorization:`Bearer ${token}`}});
      if (dR.ok) { const d = await dR.json(); setAnalysis(d.analysis); setConsultationData(d.consultation); }
    } catch (e) {} finally { setAnalysisLoading(false); setExplaining(false); }
  };

  const handleDownloadPDF = async () => {
    if (!analysis || !consultationData) return;
    setPdfLoading(true);
    try {
      const imgRes = await fetch(`http://localhost:8000/${consultationData.image_path}`);
      const blob = await imgRes.blob();
      const form = new FormData(); form.append("file", new File([blob], "image.jpg", {type:blob.type}));
      form.append("explain_text", explainText || analysis.explain_text || "");
      const params = new URLSearchParams({model:consultationData.model_key||"chest",patient_id:consultationData.patient_name||"Patient",prediction:analysis.prediction,confidence:String(analysis.confidence),probabilities:JSON.stringify(analysis.probabilities||{}),report_id:`DOC-${Date.now().toString(36).toUpperCase()}`});
      const res = await fetch(`${API}/report?${params}`, {method:"POST",body:form});
      const pdfBlob = await res.blob();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a"); a.href = url; a.download = `rapport_${consultationData.id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert("Erreur PDF: " + e.message); } finally { setPdfLoading(false); }
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

  return (
    <div className="pd3">
      {/* NAVIGATION */}
      <motion.nav className={`pd3-nav ${isScrolled?"scrolled":""}`} initial={{y:-80}} animate={{y:0}} transition={{duration:.5,type:"spring",stiffness:100}}>
        <div className="pd3-nav-brand" onClick={()=>navigate("/")}>
          <div className="pd3-nav-logo"><div className="pd3-nav-logo-inner"><I.Lungs size={22} color="#0A1628"/></div></div>
          <span className="pd3-nav-name">Med<span className="accent">AI</span></span>
        </div>
        <div className="pd3-nav-links">
          {[{id:"overview",label:"Vue d'ensemble"},{id:"consultations",label:"Consultations"},{id:"messages",label:"Messages & Analyse"},{id:"analytics",label:"Statistiques"}].map(tab=>(
            <button key={tab.id} className={`pd3-nav-link ${activeTab===tab.id?"active":""}`} onClick={()=>setActiveTab(tab.id)} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>{tab.label}</button>
          ))}
        </div>
        <div className="pd3-nav-actions">
          <div ref={profileRef} style={{position:"relative"}}>
            <button className="pd3-btn pd3-btn-outline pd3-btn-sm" onClick={()=>setShowProfileMenu(!showProfileMenu)}>
              <I.User size={15}/> {firstName}
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{position:"absolute",top:"calc(100% + 8px)",right:0,width:240,background:"#fff",borderRadius:16,border:"1px solid #E5E7EB",boxShadow:"0 12px 40px rgba(0,0,0,0.12)",overflow:"hidden",zIndex:1001}}>
                  <div style={{padding:"16px 20px",borderBottom:"1px solid #F1F5F9",background:"#FAFBFC"}}>
                    <div style={{fontWeight:700,fontSize:"0.88rem",color:"#0A1628"}}>{displayName}</div>
                    <div style={{fontSize:"0.72rem",color:"#8899AA"}}>{user?.specialty}</div>
                  </div>
                  <button onClick={()=>{setShowProfileMenu(false);logout();navigate("/login");}} style={{width:"100%",padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:10,fontSize:"0.82rem",color:"#EF4444",fontWeight:600,fontFamily:"inherit"}}><I.LogOut size={16}/> Déconnexion</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div ref={notifRef} style={{position:"relative"}}>
            <motion.button className="pd3-btn-icon" onClick={()=>setShowNotif(!showNotif)} whileHover={{scale:1.05}}>
              <I.Bell size={18} color="#fff"/>
              {unreadCount>0 && <span className="pd3-btn-badge">{unreadCount>9?"9+":unreadCount}</span>}
            </motion.button>
            <AnimatePresence>{showNotif&&(<motion.div className="pd3-notif-panel" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}><div className="pd3-notif-header"><span className="pd3-notif-title"><I.Bell size={15} color="#D4A500"/> Notifications</span><button onClick={()=>setShowNotif(false)} className="pd3-notif-action"><I.X size={16}/></button></div><div className="pd3-notif-body" style={{maxHeight:350,overflowY:"auto"}}>{notifications.length===0?<div className="pd3-notif-empty"><I.Bell size={26} color="#D4A500"/><div className="pd3-notif-empty-text">Aucune notification</div></div>:notifications.map(n=><div key={n.id} className="pd3-notif-item" onClick={()=>{try{const d=JSON.parse(n.data||"{}");if(d.consultation_id){setSelectedConsultation(d.consultation_id);setActiveTab("messages")}}catch{}setShowNotif(false)}}><div className="pd3-notif-item-content"><div className="pd3-notif-item-title">{n.title}</div><div className="pd3-notif-item-msg">{n.message?.substring(0,80)}</div></div></div>)}</div></motion.div>)}</AnimatePresence>
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
            <motion.p className="pd3-hero-subtitle" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.25}}>{user?.specialty||"Spécialiste"} · Gérez vos consultations et analyses médicales</motion.p>
            <motion.div className="pd3-hero-actions" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.6,delay:.35}}>
              <button className="pd3-btn pd3-btn-gold pd3-btn-lg" onClick={()=>setActiveTab("consultations")}><I.Folder size={18}/> File d'attente ({stats.queue})</button>
              <button className="pd3-btn pd3-btn-outline-light pd3-btn-lg" onClick={()=>navigate("/classification")}><I.Scan size={16}/> Analyse libre</button>
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
        <Reveal><div className="pd3-tabs">{[{id:"overview",label:"Vue d'ensemble",icon:<I.Activity size={16}/>},{id:"consultations",label:"Consultations",icon:<I.Folder size={16}/>},{id:"messages",label:"Messages & Analyse",icon:<I.Message size={16}/>},{id:"analytics",label:"Statistiques",icon:<I.Star size={16}/>}].map(tab=>(<button key={tab.id} className={`pd3-tab ${activeTab===tab.id?"active":""}`} onClick={()=>setActiveTab(tab.id)}><span className="pd3-tab-icon">{tab.icon}</span> {tab.label}</button>))}</div></Reveal>

        <AnimatePresence mode="wait">
          {activeTab==="overview"&&(<motion.div key="overview" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Activity size={12}/> VUE D'ENSEMBLE</div><h2 className="pd3-section-title">Tableau de bord <span className="accent">médecin</span></h2><p className="pd3-section-sub">Gérez vos consultations en temps réel</p></div></Reveal><div className="pd3-metrics-grid">{[{icon:I.Folder,label:"En attente",value:stats.queue,color:"#D4A500",bg:"rgba(212,165,0,0.08)"},{icon:I.Clock,label:"En cours",value:stats.active,color:"#3B82F6",bg:"rgba(59,130,246,0.08)"},{icon:I.Check,label:"Analysées",value:stats.analyzed,color:"#10B981",bg:"rgba(16,185,129,0.08)"},{icon:I.Shield,label:"Terminées",value:stats.closed,color:"#6B7280",bg:"rgba(107,114,128,0.08)"}].map((s,i)=>(<Reveal key={i} delay={i*.06}><motion.div className="pd3-metric" style={{"--metric-color":s.color}} whileHover={{y:-6}}><div className="pd3-metric-icon" style={{background:s.bg,color:s.color}}><s.icon size={24}/></div><div className="pd3-metric-value" style={{color:s.color}}>{s.value}</div><div className="pd3-metric-label">{s.label}</div></motion.div></Reveal>))}</div><Reveal delay={.1}><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Sparkles size={16} color="#D4A500"/> Actions rapides</span></div></Reveal><div className="pd3-actions-grid">{[{icon:I.Folder,label:"File d'attente",desc:"Gérer les demandes",color:"#D4A500",bg:"rgba(212,165,0,0.08)",action:()=>setActiveTab("consultations")},{icon:I.Scan,label:"Analyse libre",desc:"Classifier une image",color:"#8B5CF6",bg:"rgba(139,92,246,0.08)",action:()=>navigate("/classification")},{icon:I.Message,label:"Messages",desc:"Communiquer avec patients",color:"#10B981",bg:"rgba(16,185,129,0.08)",action:()=>setActiveTab("messages")},{icon:I.BarChart,label:"Statistiques",desc:"Vue globale",color:"#3B82F6",bg:"rgba(59,130,246,0.08)",action:()=>setActiveTab("analytics")}].map((a,i)=>(<Reveal key={i} delay={.12+i*.06}><motion.button className="pd3-action" onClick={a.action} whileHover={{y:-5}}><div className="pd3-action-top"><div className="pd3-action-icon" style={{background:a.bg,color:a.color}}><a.icon size={22}/></div><div className="pd3-action-arrow"><I.ChevronRight size={14}/></div></div><div className="pd3-action-label">{a.label}</div><div className="pd3-action-desc">{a.desc}</div></motion.button></Reveal>))}</div><Reveal delay={.15}><div className="pd3-section-row"><span className="pd3-section-row-title"><I.Folder size={16} color="#D4A500"/> Consultations récentes</span></div><div style={{display:"flex",flexDirection:"column",gap:8}}>{loading?<div style={{textAlign:"center",padding:40}}><I.Sparkles size={32} color="#D4A500"/></div>:[...assigned.slice(0,3),...queue.slice(0,2)].slice(0,5).map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}}/>)}</div></Reveal></motion.div>)}

          {activeTab==="consultations"&&(<motion.div key="consultations" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Folder size={12}/> CONSULTATIONS</div><h2 className="pd3-section-title">File d'attente <span className="accent">({queue.length})</span></h2></div></Reveal><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:32}}>{queue.map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}} onAccept={()=>handleAccept(c.id)} onReject={()=>handleReject(c.id)} actionLoading={actionLoading===c.id}/>)}</div>{assigned.filter(c=>c.status!=="closed").length>0&&<><Reveal><h2 className="pd3-section-title" style={{marginBottom:24}}>Mes dossiers <span className="accent">actifs</span></h2></Reveal><div style={{display:"flex",flexDirection:"column",gap:8}}>{assigned.filter(c=>c.status!=="closed").map(c=><ConsultationCard key={c.id} consultation={c} onClick={()=>{setSelectedConsultation(c.id);setActiveTab("messages");}}/>)}</div></>}</motion.div>)}

          {activeTab==="messages"&&(<motion.div key="messages" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} style={{display:"grid",gridTemplateColumns:"1fr 420px",gap:20}}>
            <ChatSection consultationData={consultationData} messages={messages} msgInput={msgInput} setMsgInput={setMsgInput} onSend={handleSendMessage} canMessage={canMessage} onClose={()=>setShowCloseModal(true)} model={model} loading={loading}/>
            <AnalysisSection analysis={analysis} analysisLoading={analysisLoading} explainText={explainText} explaining={explaining} onRunAnalysis={handleRunAnalysis} onDownloadPDF={handleDownloadPDF} consultationData={consultationData} model={model}/>
          </motion.div>)}

          {activeTab==="analytics"&&(<motion.div key="analytics" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><Reveal><div className="pd3-section-header"><div className="pd3-section-badge"><I.Star size={12}/> STATISTIQUES</div><h2 className="pd3-section-title">Vue <span className="accent">globale</span></h2></div></Reveal><div className="pd3-metrics-grid">{[{icon:I.Folder,label:"Total",value:queue.length+assigned.length,color:"#0A1628"},{icon:I.Clock,label:"En attente",value:stats.queue,color:"#D4A500"},{icon:I.Activity,label:"En cours",value:stats.active,color:"#3B82F6"},{icon:I.Check,label:"Analysées",value:stats.analyzed,color:"#10B981"}].map((s,i)=><Reveal key={i} delay={i*.06}><motion.div className="pd3-metric"><div className="pd3-metric-icon" style={{background:`${s.color}15`,color:s.color}}><s.icon size={24}/></div><div className="pd3-metric-value" style={{color:s.color}}>{s.value}</div><div className="pd3-metric-label">{s.label}</div></motion.div></Reveal>)}</div></motion.div>)}
        </AnimatePresence>

        <Reveal><section className="pd3-platform"><div className="pd3-platform-grid">{[{icon:I.Scan,value:50000,suffix:"+",label:"Radiographies analysées"},{icon:I.Brain,value:98,suffix:".5%",label:"Précision de détection"},{icon:I.Lungs,value:14,suffix:"+",label:"Pathologies couvertes"},{icon:I.Shield,value:100,suffix:"%",label:"Données sécurisées"}].map((s,i)=><motion.div key={i} className="pd3-platform-item" whileHover={{y:-4}}><div className="pd3-platform-icon"><s.icon size={30} color="#D4A500"/></div><div className="pd3-platform-value">{s.value}{s.suffix}</div><div className="pd3-platform-label">{s.label}</div>{i<3&&<div className="pd3-platform-div"/>}</motion.div>)}</div></section></Reveal>

        <footer className="hp-footer" style={{marginTop:40}}><div className="hp-footer-inner"><div className="hp-footer-grid"><div className="hp-footer-brand"><div className="hp-nav-logo" style={{marginBottom:16}}><div className="hp-logo-icon"><I.Lungs size={18} color="#fff"/></div><span style={{color:"#fff"}}>Med<span style={{color:"#FFD700"}}>AI</span></span></div><p>Plateforme médicale de diagnostic assisté par IA. Transformant la radiologie avec l'apprentissage profond depuis 2024.</p><div className="hp-footer-socials">{["LI","TW","GH","YT","IN"].map((s,i)=><div className="hp-footer-social" key={i}>{s}</div>)}</div></div><div><h4>PRODUIT</h4>{["Analyse IA","Radiologues","API Access","Mobile App","Tarifs"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div><div><h4>ENTREPRISE</h4>{["À propos","Carrières","Recherche","Blog","Contact"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div><div><h4>RESSOURCES</h4>{["Documentation","Études de cas","Whitepapers","Support","Statut"].map(x=><a className="hp-footer-link" href="#" key={x}>{x}</a>)}</div></div><div className="hp-footer-bottom"><span>© 2025 MedAI — Plateforme médicale certifiée · Tous droits réservés</span><div className="hp-footer-bottom-links">{["Confidentialité","Conditions","Sécurité","HIPAA","RGPD","Contact"].map(x=><a href="#" key={x}>{x}</a>)}</div></div></div></footer>
      </div>

      <AnimatePresence>{showCloseModal&&(<motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}><motion.div initial={{scale:.95}} animate={{scale:1}} style={{background:"#fff",borderRadius:20,padding:28,maxWidth:460,width:"100%"}}><h2 style={{fontWeight:800,color:"#0A1628",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><I.Shield size={20} color="#6B7280"/> Clôturer la consultation</h2><textarea value={closeNotes} onChange={e=>setCloseNotes(e.target.value)} placeholder="Notes de clôture, recommandations..." rows={4} style={{width:"100%",padding:12,borderRadius:12,border:"1.5px solid #E5E7EB",fontSize:"0.85rem",fontFamily:"inherit",resize:"none",outline:"none",marginBottom:18,boxSizing:"border-box"}}/><div style={{display:"flex",gap:10}}><button onClick={()=>{setShowCloseModal(false);setCloseNotes("");}} className="pd3-btn pd3-btn-outline" style={{flex:1}}>Annuler</button><button onClick={handleClose} className="pd3-btn pd3-btn-gold" style={{flex:1}}>Confirmer la clôture</button></div></motion.div></motion.div>)}</AnimatePresence>
    </div>
  );
}