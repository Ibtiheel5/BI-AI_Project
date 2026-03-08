// Pathologies.jsx ─ Version visuelle ultra-riche, double thème
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────────────────────── */
const PTCLS = Array.from({ length: 20 }, (_, i) => ({
  id: i, x: ((i*53+11)%94), y: ((i*37+9)%91),
  size:(i%3)+1.2, dur:11+(i%9), delay:(i*1.7)%11, op:0.07+(i%5)*0.04
}));

function Particles() {
  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
      {PTCLS.map(p => (
        <div key={p.id} style={{
          position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
          width:p.size, height:p.size, borderRadius:"50%",
          background:"var(--accent)", opacity:p.op,
          animation:`floatPP ${p.dur}s ease-in-out ${p.delay}s infinite alternate`
        }}/>
      ))}
      <style>{`@keyframes floatPP{0%{transform:translateY(0) translateX(0)}50%{transform:translateY(-16px) translateX(8px)}100%{transform:translateY(10px) translateX(-12px)}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BG AMBIANCE
───────────────────────────────────────────────────────────── */
function BgAmbiance() {
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-20%", right:"-15%", width:"65%", height:"65%",
        background:"radial-gradient(ellipse, var(--info-light) 0%, transparent 70%)" }}/>
      <div style={{ position:"absolute", bottom:"5%", left:"-10%", width:"55%", height:"55%",
        background:"radial-gradient(ellipse, var(--accent-light) 0%, transparent 70%)" }}/>
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:.05 }}>
        <defs>
          <pattern id="dotGP" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="var(--accent)"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGP)"/>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LUNG MINI SVG (respiration animée)
───────────────────────────────────────────────────────────── */
function LungMini({ colorVar = "var(--accent)", pulse = false }) {
  const id = colorVar.replace(/[^a-z0-9]/gi, "x");
  return (
    <svg viewBox="0 0 80 80" fill="none" style={{ width:54, height:54, flexShrink:0 }}>
      <defs>
        <radialGradient id={`lg${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colorVar} stopOpacity=".28"/>
          <stop offset="100%" stopColor={colorVar} stopOpacity=".04"/>
        </radialGradient>
      </defs>
      <path
        d="M40,18 C39,17 34,17 30,19 C23,22 18,28 17,36 C15,45 16,54 19,60 C22,66 27,70 32,71 C35,72 38,71 40,69 L40,18Z"
        fill={`url(#lg${id})`} stroke={colorVar} strokeWidth="1.2" strokeOpacity=".75"
        style={pulse ? { animation:"breathLung 3s ease-in-out infinite", transformOrigin:"40px 65px" } : {}}
      />
      <path
        d="M40,18 C41,17 46,17 50,19 C57,22 62,28 63,36 C65,45 64,54 61,60 C58,66 53,70 48,71 C45,72 42,71 40,69 L40,18Z"
        fill={`url(#lg${id})`} stroke={colorVar} strokeWidth="1.2" strokeOpacity=".75"
        style={pulse ? { animation:"breathLung 3s ease-in-out .3s infinite", transformOrigin:"40px 65px" } : {}}
      />
      <path d="M40,10 L40,20" stroke={colorVar} strokeWidth="2.2" strokeLinecap="round" strokeOpacity=".9"/>
      <path d="M40,20 C37,22 33,24 30,26 M40,20 C43,22 47,24 50,26"
        stroke={colorVar} strokeWidth="1.5" strokeLinecap="round" strokeOpacity=".55"/>
      <style>{`@keyframes breathLung{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.07)}}`}</style>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   RADAR CHART SVG
───────────────────────────────────────────────────────────── */
function RadarChart({ scores = [.8,.7,.65,.75,.6], colorVar = "var(--accent)" }) {
  const cx=50, cy=50, r=34;
  const angs = scores.map((_,i) => (i*2*Math.PI)/scores.length - Math.PI/2);
  const inner = angs.map((a,i) => ({ x: cx+r*scores[i]*Math.cos(a), y: cy+r*scores[i]*Math.sin(a) }));
  const path  = inner.map((p,i) => `${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";
  return (
    <svg viewBox="0 0 100 100" style={{ width:82, height:82 }}>
      {[.33,.66,1].map((s,i) => (
        <polygon key={i}
          points={angs.map(a => `${(cx+r*s*Math.cos(a)).toFixed(1)},${(cy+r*s*Math.sin(a)).toFixed(1)}`).join(" ")}
          fill="none" stroke="var(--border-dim)" strokeWidth="1"/>
      ))}
      {angs.map((a,i) => (
        <line key={i} x1={cx} y1={cy}
          x2={(cx+r*Math.cos(a)).toFixed(1)} y2={(cy+r*Math.sin(a)).toFixed(1)}
          stroke="var(--border-faint)" strokeWidth="1"/>
      ))}
      <path d={path} fill="var(--accent-light)" stroke={colorVar} strokeWidth="1.6" strokeOpacity=".85"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   ACCURACY BAR ANIMÉE
───────────────────────────────────────────────────────────── */
function AccuBar({ value, colorVar }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 250); return () => clearTimeout(t); }, [value]);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:"0.62rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)",
          textTransform:"uppercase", letterSpacing:"0.08em" }}>Précision modèle</span>
        <span style={{ fontSize:"0.76rem", fontWeight:800, color:colorVar, fontFamily:"var(--font-mono)" }}>
          {value}%
        </span>
      </div>
      <div style={{ height:5, background:"var(--bg-muted)", borderRadius:3, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:3,
          background:`linear-gradient(90deg, ${colorVar}, ${colorVar})`,
          width:`${w}%`, transition:"width 1.1s cubic-bezier(.34,1.56,.64,1)",
          boxShadow:`0 0 8px ${colorVar}60`, opacity:.9
        }}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PATHOLOGY DATA
───────────────────────────────────────────────────────────── */
const PATHOLOGIES = [
  { id:"covid",        name:"COVID-19",            icon:"🦠", colorVar:"var(--danger)",  severity:"Urgence",      accuracy:91, model:"COVID",
    description:"Pneumonie virale SARS-CoV-2. Opacités bilatérales en verre dépoli, périphériques et basales.",
    xray_signs:["Opacités en verre dépoli","Distribution bilatérale","Consolidations périphériques","Crazy paving"],
    gradcam_zones:"Zones périphériques bilatérales, lobes inférieurs",
    stats:{ sensitivity:"89%", specificity:"93%", auc:"0.96" }, radar:[.91,.85,.78,.88,.82] },
  { id:"cardiomegaly", name:"Cardiomégalie",        icon:"❤️", colorVar:"var(--danger)",  severity:"Urgence",      accuracy:88, model:"Thorax RX",
    description:"Élargissement pathologique du cœur. ICT > 0.5. Peut signer une insuffisance cardiaque.",
    xray_signs:["ICT > 0.5","Élargissement médiastinal","Redistribution vasculaire"],
    gradcam_zones:"Zone centrale, silhouette cardiaque",
    stats:{ sensitivity:"85%", specificity:"91%", auc:"0.94" }, radar:[.88,.82,.75,.85,.80] },
  { id:"effusion",     name:"Épanchement pleural",  icon:"💧", colorVar:"var(--warning)", severity:"Surveillance", accuracy:90, model:"Thorax RX",
    description:"Accumulation de liquide dans l'espace pleural. Opacité basale avec effacement du cul-de-sac.",
    xray_signs:["Opacité basale homogène","Ligne de Damoiseau","Déplacement médiastinal"],
    gradcam_zones:"Bases pulmonaires, sinus costo-phréniques",
    stats:{ sensitivity:"88%", specificity:"92%", auc:"0.95" }, radar:[.90,.88,.72,.82,.85] },
  { id:"infiltration", name:"Infiltration",          icon:"🔬", colorVar:"var(--warning)", severity:"Surveillance", accuracy:72, model:"Thorax RX",
    description:"Opacités diffuses infectieuses, inflammatoires ou œdémateuses. Aspect flou bilatéral fréquent.",
    xray_signs:["Opacités floues bilatérales","Distribution péri-hilaire","Bronchogramme aérique"],
    gradcam_zones:"Zones péri-hilaires et basales",
    stats:{ sensitivity:"70%", specificity:"74%", auc:"0.78" }, radar:[.72,.65,.60,.70,.68] },
  { id:"mass",         name:"Masse pulmonaire",      icon:"⚫", colorVar:"var(--danger)",  severity:"Urgence",      accuracy:82, model:"Thorax RX",
    description:"Lésion > 3 cm nécessitant investigation pour éliminer une néoplasie.",
    xray_signs:["Opacité dense bien délimitée","Taille > 3 cm","Possible excavation"],
    gradcam_zones:"Variable selon localisation tumorale",
    stats:{ sensitivity:"80%", specificity:"84%", auc:"0.88" }, radar:[.82,.78,.70,.80,.75] },
  { id:"nodule",       name:"Nodule",                icon:"🔴", colorVar:"var(--warning)", severity:"Surveillance", accuracy:79, model:"Thorax RX",
    description:"Lésion arrondie < 3 cm. Peut être bénigne ou maligne. Suivi radiologique obligatoire.",
    xray_signs:["Opacité arrondie","Taille < 3 cm","Contours nets ou spiculés"],
    gradcam_zones:"Variable, unique ou multiple",
    stats:{ sensitivity:"76%", specificity:"82%", auc:"0.85" }, radar:[.79,.75,.68,.76,.72] },
  { id:"pneumonia",    name:"Pneumonie",             icon:"🦠", colorVar:"var(--danger)",  severity:"Urgence",      accuracy:86, model:"Thorax RX",
    description:"Infection bactérienne/virale avec condensation alvéolaire, souvent lobaire.",
    xray_signs:["Condensation lobaire","Bronchogramme aérique","Distribution unilatérale"],
    gradcam_zones:"Lobe inférieur droit principalement",
    stats:{ sensitivity:"84%", specificity:"88%", auc:"0.92" }, radar:[.86,.80,.75,.84,.78] },
  { id:"pneumothorax", name:"Pneumothorax",          icon:"💨", colorVar:"var(--danger)",  severity:"Urgence",      accuracy:89, model:"Thorax RX",
    description:"Air dans l'espace pleural causant un collapsus. Urgence médicale si sous tension.",
    xray_signs:["Liseré pleural visible","Collapsus pulmonaire","Déviation médiastinale"],
    gradcam_zones:"Apex pulmonaire, bord latéral",
    stats:{ sensitivity:"87%", specificity:"91%", auc:"0.94" }, radar:[.89,.86,.80,.88,.84] },
  { id:"consolidation",name:"Consolidation",         icon:"🧱", colorVar:"var(--warning)", severity:"Surveillance", accuracy:83, model:"Thorax RX",
    description:"Condensation alvéolaire remplaçant l'air. Opaque avec bronchogramme aérique.",
    xray_signs:["Opacité dense","Bronchogramme aérique","Effacement des vaisseaux"],
    gradcam_zones:"Lobes inférieurs, distribution variable",
    stats:{ sensitivity:"81%", specificity:"85%", auc:"0.89" }, radar:[.83,.78,.72,.82,.76] },
  { id:"normal",       name:"Normal",                icon:"✅", colorVar:"var(--success)", severity:"Suivi",        accuracy:95, model:"Tous",
    description:"Pas d'anomalie. Parenchyme normalement aéré, silhouette cardiaque normale.",
    xray_signs:["Parenchyme normalement aéré","ICT < 0.5","Sinus costo-phréniques libres"],
    gradcam_zones:"N/A — aucune anomalie détectée",
    stats:{ sensitivity:"94%", specificity:"96%", auc:"0.98" }, radar:[.95,.94,.92,.96,.93] },
  { id:"benign",       name:"Nodule bénin",          icon:"🟢", colorVar:"var(--success)", severity:"Suivi",        accuracy:88, model:"Cancer CT",
    description:"Tumeur bénigne : hamartomes, granulomes. Surveillance régulière recommandée.",
    xray_signs:["Contours nets réguliers","Calcifications centrales","Taille stable"],
    gradcam_zones:"Centre et bords de la lésion",
    stats:{ sensitivity:"86%", specificity:"90%", auc:"0.94" }, radar:[.88,.84,.90,.82,.86] },
  { id:"malignant",    name:"Tumeur maligne",         icon:"🔴", colorVar:"var(--danger)",  severity:"Urgence",      accuracy:85, model:"Cancer CT",
    description:"Cancer pulmonaire malin. Prise en charge oncologique urgente requise.",
    xray_signs:["Contours irréguliers spiculés","Croissance rapide","Atteinte ganglionnaire"],
    gradcam_zones:"Masse principale, ganglions hilaires",
    stats:{ sensitivity:"83%", specificity:"87%", auc:"0.92" }, radar:[.85,.80,.83,.78,.82] },
];

const SEV = {
  Urgence:     { bg:"var(--danger-light)",  color:"var(--danger)" },
  Surveillance:{ bg:"var(--warning-light)", color:"var(--warning)" },
  Suivi:       { bg:"var(--success-light)", color:"var(--success)" },
};

/* ─────────────────────────────────────────────────────────────
   PATHOLOGY CARD
───────────────────────────────────────────────────────────── */
function PathologyCard({ patho, isSelected, onSelect, index }) {
  const sev = SEV[patho.severity];
  return (
    <div
      onClick={() => onSelect(isSelected ? null : patho.id)}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, var(--accent-light), var(--info-light))`
          : "var(--bg-surface)",
        border:`1.5px solid ${isSelected ? "rgba(14,165,233,.4)" : "var(--border-dim)"}`,
        borderRadius:16, padding:"1.25rem", cursor:"pointer",
        transition:"all .3s",
        boxShadow: isSelected ? "var(--shadow-accent)" : "var(--shadow-xs)",
        animation:`fadeUpP .5s ease ${index*.065}s both`,
        position:"relative", overflow:"hidden"
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.borderColor = "var(--border-strong)";
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "var(--shadow-xs)";
          e.currentTarget.style.borderColor = "var(--border-dim)";
        }
      }}
    >
      {/* Color top bar */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg, ${patho.colorVar}, transparent)`,
        opacity: isSelected ? 1 : 0, transition:"opacity .3s" }}/>

      {/* Top row */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:"1rem" }}>
        <LungMini colorVar={patho.colorVar} pulse={patho.severity==="Urgence"}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:"1.15rem" }}>{patho.icon}</span>
            <span style={{
              fontSize:"0.95rem", fontWeight:700, letterSpacing:"-0.01em",
              color: isSelected ? "var(--accent)" : "var(--text-primary)",
              transition:"color .3s"
            }}>{patho.name}</span>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <span style={{
              padding:"3px 10px", borderRadius:20, background:sev.bg,
              fontSize:"0.62rem", color:sev.color, fontFamily:"var(--font-mono)", fontWeight:700
            }}>{patho.severity}</span>
            <span style={{
              padding:"3px 10px", borderRadius:20, background:"var(--info-light)",
              border:"1px solid rgba(129,140,248,.15)",
              fontSize:"0.62rem", color:"var(--info)", fontFamily:"var(--font-mono)"
            }}>{patho.model}</span>
          </div>
        </div>
        {isSelected && (
          <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)",
            boxShadow:"0 0 10px var(--accent)", flexShrink:0, marginTop:4,
            animation:"pulseDotP 1.8s infinite" }}/>
        )}
      </div>

      <p style={{
        fontSize:"0.78rem", color:"var(--text-tertiary)", lineHeight:1.65,
        marginBottom:".875rem", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"
      }}>{patho.description}</p>

      <AccuBar value={patho.accuracy} colorVar={patho.colorVar}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DETAIL PANEL
───────────────────────────────────────────────────────────── */
function DetailPanel({ patho, onClose }) {
  const sev = SEV[patho.severity];
  return (
    <div style={{
      background:"var(--bg-surface)", border:"1px solid var(--border-dim)",
      borderRadius:20, overflow:"hidden", boxShadow:"var(--shadow-lg)",
      animation:"fadeUpP .4s ease both", position:"sticky", top:88
    }}>
      {/* Colored bar top */}
      <div style={{ height:3, background:`linear-gradient(90deg, ${patho.colorVar}, var(--info))` }}/>

      {/* Header */}
      <div style={{
        padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border-faint)",
        background:"var(--bg-elevated)",
        display:"flex", alignItems:"center", justifyContent:"space-between"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <LungMini colorVar={patho.colorVar} pulse={patho.severity==="Urgence"}/>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
              <span style={{ fontSize:"1.2rem" }}>{patho.icon}</span>
              <h2 style={{ fontSize:"1.2rem", fontWeight:800, color:"var(--text-primary)",
                letterSpacing:"-0.025em" }}>{patho.name}</h2>
            </div>
            <span style={{
              padding:"3px 10px", borderRadius:20, display:"inline-block",
              background:sev.bg, fontSize:"0.62rem", color:sev.color,
              fontFamily:"var(--font-mono)", fontWeight:700
            }}>{patho.severity}</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          width:30, height:30, borderRadius:"50%",
          border:"1px solid var(--border-base)", background:"var(--bg-muted)",
          color:"var(--text-muted)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"1rem", transition:"all .2s", fontFamily:"inherit"
        }}
          onMouseEnter={e => { e.currentTarget.style.background="var(--bg-elevated)"; e.currentTarget.style.color="var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background="var(--bg-muted)"; e.currentTarget.style.color="var(--text-muted)"; }}>
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{
        padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1.25rem",
        maxHeight:"calc(100vh - 280px)", overflowY:"auto"
      }}>
        <p style={{ fontSize:"0.85rem", color:"var(--text-secondary)", lineHeight:1.78 }}>
          {patho.description}
        </p>

        {/* Stats pills */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[["Sensibilité", patho.stats.sensitivity], ["Spécificité", patho.stats.specificity], ["AUC", patho.stats.auc]].map(([k,v]) => (
            <div key={k} style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:"10px 8px", borderRadius:10,
              background:"var(--bg-elevated)", border:"1px solid var(--border-faint)"
            }}>
              <div style={{ fontSize:"1.05rem", fontWeight:800, color:patho.colorVar }}>{v}</div>
              <div style={{ fontSize:"0.6rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)",
                textTransform:"uppercase", letterSpacing:"0.06em", marginTop:2, textAlign:"center" }}>{k}</div>
            </div>
          ))}
        </div>

        {/* Radar + Accuracy */}
        <div style={{
          display:"flex", alignItems:"center", gap:"1.25rem",
          padding:"1rem", borderRadius:14,
          background:"var(--bg-elevated)", border:"1px solid var(--border-faint)"
        }}>
          <RadarChart scores={patho.radar} colorVar={patho.colorVar}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"0.6rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)",
              textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              Performance globale
            </div>
            <AccuBar value={patho.accuracy} colorVar={patho.colorVar}/>
            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
              {["Précision","Rappel","F1-Score","AUC-ROC","Kappa"].map((l,i) => (
                <span key={l} style={{
                  fontSize:"0.58rem", color:patho.colorVar,
                  fontFamily:"var(--font-mono)", opacity:.45 + patho.radar[i] * .55
                }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* X-ray signs */}
        <div>
          <div style={{
            fontSize:"0.6rem", color:"var(--accent)", fontFamily:"var(--font-mono)",
            textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:".75rem",
            display:"flex", alignItems:"center", gap:8
          }}>
            <div style={{ width:16, height:1, background:"var(--accent)", opacity:.6 }}/>
            Signes radiologiques
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {patho.xray_signs.map((sign, i) => (
              <div key={i} style={{
                display:"flex", alignItems:"flex-start", gap:10,
                padding:"7px 10px", borderRadius:8,
                background:"var(--bg-elevated)", border:"1px solid var(--border-faint)",
                animation:`slideRightP .4s ease ${i*.07}s both`
              }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:patho.colorVar,
                  flexShrink:0, marginTop:4, boxShadow:`0 0 6px ${patho.colorVar}` }}/>
                <span style={{ fontSize:"0.8rem", color:"var(--text-secondary)", lineHeight:1.5 }}>{sign}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grad-CAM zones */}
        <div style={{
          padding:".875rem 1rem", borderRadius:12,
          background:"var(--danger-light)", border:"1px solid rgba(239,68,68,.22)"
        }}>
          <div style={{
            fontSize:"0.6rem", color:"var(--danger)", fontFamily:"var(--font-mono)",
            textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6,
            display:"flex", alignItems:"center", gap:6
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--danger)",
              boxShadow:"0 0 6px var(--danger)", animation:"pulseDotP 2s infinite" }}/>
            Zones Grad-CAM
          </div>
          <p style={{ fontSize:"0.78rem", color:"var(--text-secondary)", lineHeight:1.65 }}>
            {patho.gradcam_zones}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────────────────── */
const FILTERS = ["Toutes","Urgence","Surveillance","Suivi"];

export default function Pathologies() {
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("Toutes");
  const [visible,  setVisible]  = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold:.05 });
    if (gridRef.current) obs.observe(gridRef.current);
    return () => obs.disconnect();
  }, []);

  const filtered = PATHOLOGIES.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase())
      || p.description.toLowerCase().includes(search.toLowerCase());
    const mf = filter==="Toutes" || p.severity===filter;
    return ms && mf;
  });

  const selectedPatho = PATHOLOGIES.find(p => p.id===selected);

  return (
    <div style={{ position:"relative", minHeight:"100vh" }}>
      <Particles/>
      <BgAmbiance/>

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── Page header ── */}
        <div style={{ paddingBottom:"1.5rem", animation:"fadeUpP .7s ease both" }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8, marginBottom:"1.25rem",
            padding:"7px 18px", borderRadius:50, background:"var(--accent-light)",
            border:"1px solid rgba(14,165,233,.2)", fontSize:"0.68rem", color:"var(--accent)",
            letterSpacing:"0.1em", fontFamily:"var(--font-mono)", textTransform:"uppercase"
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)",
              boxShadow:"0 0 8px var(--accent)", animation:"pulseDotP 2s infinite" }}/>
            Catalogue pathologique · {PATHOLOGIES.length} pathologies
          </div>
          <h1 style={{
            fontSize:"clamp(1.9rem,3.5vw,2.9rem)", fontWeight:800,
            letterSpacing:"-0.035em", color:"var(--text-primary)", marginBottom:".6rem", lineHeight:1.1
          }}>
            Pathologies{" "}
            <span style={{
              background:"linear-gradient(135deg, var(--accent), var(--info))",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text"
            }}>détectables</span>
          </h1>
          <p style={{ fontSize:"0.93rem", color:"var(--text-secondary)", maxWidth:500, lineHeight:1.72 }}>
            Cliquez sur une fiche pour consulter les détails cliniques, signes radiologiques et performances IA.
          </p>
        </div>

        {/* ── Filters bar ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
          marginBottom:"1.5rem", padding:"1rem 1.25rem", borderRadius:14,
          background:"var(--bg-surface)", border:"1px solid var(--border-dim)",
          boxShadow:"var(--shadow-sm)"
        }}>
          {/* Search */}
          <div style={{ position:"relative", flex:"1 1 200px", minWidth:160 }}>
            <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:"var(--text-muted)", pointerEvents:"none" }}
              width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une pathologie…"
              style={{
                width:"100%", padding:"8px 12px 8px 34px",
                background:"var(--bg-elevated)", border:"1px solid var(--border-dim)",
                borderRadius:10, color:"var(--text-primary)", fontSize:"0.85rem",
                fontFamily:"var(--font-body)", outline:"none", transition:"border-color .2s"
              }}
              onFocus={e => e.target.style.borderColor="var(--accent)"}
              onBlur={e  => e.target.style.borderColor="var(--border-dim)"}/>
          </div>

          {/* Pills */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {FILTERS.map(f => {
              const active = filter===f;
              const count  = f==="Toutes" ? PATHOLOGIES.length : PATHOLOGIES.filter(p => p.severity===f).length;
              const cs = {
                Toutes:"var(--accent)", Urgence:"var(--danger)",
                Surveillance:"var(--warning)", Suivi:"var(--success)"
              }[f];
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding:"7px 16px", borderRadius:50, cursor:"pointer",
                  background: active ? "var(--accent-light)" : "var(--bg-elevated)",
                  border:`1px solid ${active ? "rgba(14,165,233,.3)" : "var(--border-dim)"}`,
                  color: active ? cs : "var(--text-secondary)",
                  fontSize:"0.78rem", fontWeight: active ? 700 : 400,
                  transition:"all .15s", fontFamily:"var(--font-body)",
                  display:"flex", alignItems:"center", gap:6
                }}>
                  {active && <div style={{ width:5, height:5, borderRadius:"50%",
                    background:cs, boxShadow:`0 0 5px ${cs}` }}/>}
                  {f}
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.6rem", opacity:.7 }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily:"var(--font-mono)", fontSize:"0.65rem",
            color:"var(--text-muted)", marginLeft:"auto" }}>
            {filtered.length}/{PATHOLOGIES.length}
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 390px", gap:"1.5rem", alignItems:"start" }}>

          {/* Cards grid */}
          <div ref={gridRef}>
            {filtered.length === 0 ? (
              <div style={{
                padding:"4rem 2rem", textAlign:"center",
                background:"var(--bg-surface)", border:"1px solid var(--border-dim)",
                borderRadius:20, display:"flex", flexDirection:"column", alignItems:"center", gap:"1rem",
                boxShadow:"var(--shadow-sm)"
              }}>
                <div style={{ fontSize:"2.8rem" }}>🔍</div>
                <div style={{ color:"var(--text-muted)", fontSize:"0.9rem" }}>
                  Aucune pathologie trouvée pour «{search}»
                </div>
                <button onClick={() => { setSearch(""); setFilter("Toutes"); }} style={{
                  padding:"8px 22px", borderRadius:50, background:"var(--accent-light)",
                  border:"1px solid rgba(14,165,233,.2)", color:"var(--accent)",
                  fontSize:"0.8rem", cursor:"pointer", fontFamily:"var(--font-body)"
                }}>Réinitialiser</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem",
                opacity: visible ? 1 : 0, transition:"opacity .4s ease" }}>
                {filtered.map((p, i) => (
                  <PathologyCard key={p.id} patho={p}
                    isSelected={selected===p.id}
                    onSelect={setSelected} index={i}/>
                ))}
              </div>
            )}
          </div>

          {/* Detail col */}
          <div>
            {selectedPatho ? (
              <DetailPanel patho={selectedPatho} onClose={() => setSelected(null)}/>
            ) : (
              <div style={{
                position:"sticky", top:88,
                background:"var(--bg-surface)", border:"1px solid var(--border-dim)",
                borderRadius:20, padding:"3rem 2rem",
                display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:"1.25rem", minHeight:440, textAlign:"center",
                boxShadow:"var(--shadow-sm)"
              }}>
                {/* Rotating rings */}
                <div style={{ position:"relative", width:86, height:86,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%",
                    border:"1.5px dashed var(--border-base)",
                    animation:"rotateSlow 12s linear infinite" }}/>
                  <div style={{ position:"absolute", inset:8, borderRadius:"50%",
                    border:"1.5px dashed rgba(14,165,233,.15)",
                    animation:"rotateSlow 7s linear infinite reverse" }}/>
                  <div style={{ width:54, height:54, borderRadius:"50%",
                    background:"var(--accent-light)", border:"1px solid rgba(14,165,233,.2)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1.6rem", animation:"breathLung 3s ease-in-out infinite" }}>🫁</div>
                </div>
                <div>
                  <div style={{ fontSize:"0.92rem", fontWeight:700, color:"var(--text-secondary)", marginBottom:6 }}>
                    Sélectionnez une pathologie
                  </div>
                  <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", lineHeight:1.65, maxWidth:230 }}>
                    Détails cliniques, signes radiologiques et performances IA s'afficheront ici
                  </p>
                </div>

                {/* Legend */}
                <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:6 }}>
                  {[
                    { label:"Urgence",      color:"var(--danger)",  count:PATHOLOGIES.filter(p=>p.severity==="Urgence").length },
                    { label:"Surveillance", color:"var(--warning)", count:PATHOLOGIES.filter(p=>p.severity==="Surveillance").length },
                    { label:"Suivi",        color:"var(--success)", count:PATHOLOGIES.filter(p=>p.severity==="Suivi").length },
                  ].map(({ label, color, count }) => (
                    <div key={label} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"8px 12px", borderRadius:10,
                      background:"var(--bg-elevated)", border:"1px solid var(--border-faint)"
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:color,
                          boxShadow:`0 0 6px ${color}` }}/>
                        <span style={{ fontSize:"0.8rem", color:"var(--text-secondary)" }}>{label}</span>
                      </div>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.72rem",
                        color, fontWeight:700 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeUpP{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes slideRightP{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        @keyframes pulseDotP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.75)}}
        @keyframes rotateSlow{to{transform:rotate(360deg)}}
        @keyframes breathLung{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @media(max-width:900px){
          .patho-main-grid{grid-template-columns:1fr !important}
        }
      `}</style>
    </div>
  );
}