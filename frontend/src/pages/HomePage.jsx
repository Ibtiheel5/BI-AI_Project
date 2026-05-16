// HomePage.jsx - Version Fonctionnelle avec Navigation Réelle
import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";
import chestXrayImage from '../assets/chest-xray.jpg';

// Icons optimisés (version simplifiée qui fonctionne)
const Ico = ({ d, size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const LungIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M12 4v12" />
    <path d="M8 8c-2 0-4 1-4 4s1 6 4 6" />
    <path d="M16 8c2 0 4 1 4 4s-1 6-4 6" />
    <path d="M8 8c1.5 0 3 1 4 2" />
    <path d="M16 8c-1.5 0-3 1-4 2" />
  </svg>
);

const BrainIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M12 4a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V14a2 2 0 0 1-4 0v-2.5c-1.2-.7-2-2-2-3.5a4 4 0 0 1 4-4z" />
    <path d="M12 4v16" />
    <path d="M8 12.5c-1.2.7-2 2-2 3.5a4 4 0 0 0 8 0c0-1.5-.8-2.8-2-3.5" />
  </svg>
);

const HeartIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M3 12h3l2-5 2 10 2-8 2 4 2-6 2 5h3" />
  </svg>
);

const ShieldIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const ScanIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ClockIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const UsersIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UploadIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const AwardIco = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const XRayIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ChevR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const StarIco = ({ size = 14, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="#D4A500" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const Counter = ({ value, suffix = "", duration = 1400 }) => {
  const [c, setC] = useState(0);
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { 
      if (e.isIntersecting) setVis(true); 
    }, { threshold: .3 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  
  useEffect(() => {
    if (!vis) return;
    let s = 0;
    const inc = value / (duration / 16);
    const t = setInterval(() => {
      s += inc;
      if (s >= value) { 
        setC(value); 
        clearInterval(t); 
      } else setC(Math.floor(s));
    }, 16);
    return () => clearInterval(t);
  }, [vis, value, duration]);
  
  return <div ref={ref}><span className="hp-metric-value">{c}{suffix}</span></div>;
};

const R = ({ children, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 35 }} 
    whileInView={{ opacity: 1, y: 0 }} 
    viewport={{ once: true, margin: "-60px" }} 
    transition={{ duration: .6, delay, ease: [.22, .61, .36, 1] }}
  >
    {children}
  </motion.div>
);

const Particles = () => {
  const particles = useRef([]);
  return (
    <div className="hp-particles">
      {[...Array(25)].map((_, i) => (
        <div 
          key={i} 
          className="hp-particle" 
          style={{ 
            left: `${Math.random() * 100}%`, 
            width: `${Math.random() * 3 + 1}px`, 
            height: `${Math.random() * 3 + 1}px`, 
            animationDuration: `${Math.random() * 12 + 8}s`, 
            animationDelay: `${Math.random() * 8}s`, 
            bottom: `-${Math.random() * 30}px`,
            boxShadow: i % 5 === 0 ? '0 0 8px rgba(255,215,0,.5)' : 'none'
          }} 
        />
      ))}
    </div>
  );
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, .25], [0, -40]);
  const sY = useSpring(heroY, { stiffness: 80, damping: 25 });
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fonctions de navigation fonctionnelles
  const handleGetStarted = () => {
    if (user) {
      // Si déjà connecté, rediriger selon le rôle
      if (user.role === "Patient") navigate("/patient");
      else if (user.role === "Medecin") navigate("/home");
      else if (user.is_admin) navigate("/admin");
      else navigate("/classification");
    } else {
      navigate("/login");
    }
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleGetStartedClassification = () => {
    navigate("/classification");
  };

  const features = [
    { I: LungIco, t: "Pneumonia Detection", d: "98.5% accuracy in detecting pneumonia patterns with subclinical findings recognition.", color: "#FFD700" },
    { I: BrainIco, t: "Nodule Analysis", d: "Automated lung nodule detection with size tracking and malignancy risk assessment.", color: "#FFD700" },
    { I: HeartIco, t: "Cardiomegaly", d: "Accurate cardiothoracic ratio calculation for heart enlargement detection.", color: "#FFD700" },
    { I: ScanIco, t: "Pneumothorax", d: "Critical finding detection for collapsed lung with emergency flagging system.", color: "#FFD700" },
    { I: ScanIco, t: "Consolidation", d: "Identifying infectious consolidation and infiltrates with high precision.", color: "#FFD700" },
    { I: ShieldIco, t: "Pleural Effusion", d: "Automated quantification of pleural fluid levels with severity grading.", color: "#FFD700" },
  ];

  const steps = [
    { n: "01", t: "Upload Image", d: "Drag & drop chest X-ray or DICOM files. HIPAA-compliant encryption." },
    { n: "02", t: "AI Processing", d: "Deep learning models analyze up to 28 pathologies in under 30 seconds." },
    { n: "03", t: "Radiologist Review", d: "Board-certified radiologists validate every critical finding." },
    { n: "04", t: "Clinical Report", d: "Comprehensive report with annotated images and treatment guidance." },
  ];

  const testi = [
    { nm: "Dr. Sarah Chen", rl: "Chief of Radiology", r: 5, tx: "ChestAI has transformed our workflow. The AI accuracy combined with radiologist review gives us confidence in every diagnosis.", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&h=120&fit=crop" },
    { nm: "Dr. James Wilson", rl: "Pulmonology Director", r: 5, tx: "The nodule detection algorithm caught a 4mm lesion that was initially missed. This tool is saving lives.", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop" },
    { nm: "Dr. Maria Garcia", rl: "Emergency Medicine", r: 5, tx: "In the ER, every second counts. ChestAI's critical finding alerts have significantly improved our response time.", img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=120&h=120&fit=crop" },
  ];

  const stats = [
    { v: 125000, l: "X-Rays Analyzed", sf: "+", I: ScanIco, trend: "+342% YoY" },
    { v: 98.5, l: "Detection Accuracy", sf: "%", I: BrainIco, trend: "Clinical Grade" },
    { v: 28, l: "Pathologies", sf: "+", I: XRayIcon, trend: "Comprehensive" },
    { v: 24, l: "Second Response", sf: "s", I: ClockIco, trend: "-45% faster" },
  ];

  return (
    <div className="hp">
      {/* NAVIGATION */}
      <motion.nav className={`hp-nav ${scrolled ? "scrolled" : ""}`} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: .5, type: "spring", stiffness: 100 }}>
        <div className="hp-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="hp-logo-icon"><LungIco size={20} color="white" /></div>
          <span>Med<span className="accent">AI</span></span>
        </div>
        <div className="hp-nav-links">
          <a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: "smooth" }); }}>Features</a>
          <a href="#process" onClick={(e) => { e.preventDefault(); document.getElementById('process')?.scrollIntoView({ behavior: "smooth" }); }}>Process</a>
          <a href="#testimonials" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: "smooth" }); }}>Testimonials</a>
        </div>
        <div className="hp-nav-actions">
          <button className="hp-btn hp-btn-ghost hp-btn-sm" onClick={handleSignIn}>
            Sign In
          </button>
          <button className="hp-btn hp-btn-primary hp-btn-sm" onClick={handleGetStarted}>
            Start Free Trial <ChevR />
          </button>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <motion.section className="hp-hero" style={{ y: sY }}>
        <div className="hp-hero-grid-bg" />
        <div className="hp-hero-glow hp-hero-glow-1" />
        <div className="hp-hero-glow hp-hero-glow-2" />
        <div className="hp-hero-glow hp-hero-glow-3" />
        <div className="hp-hero-ring" style={{ width: "80%", height: "80%" }} />
        <div className="hp-hero-ring" style={{ width: "65%", height: "65%", animationDirection: "reverse", animationDuration: "25s" }} />
        <div className="hp-hero-ring" style={{ width: "50%", height: "50%", animationDuration: "20s", borderWidth: "0.5px" }} />
        <Particles />
        
        <div className="hp-hero-content">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}>
              <div className="hp-badge">
                <span className="hp-badge-dot" />
                <span>FDA CLEARED</span>
                <span className="hp-badge-sep">•</span>
                <span>CE MARKED</span>
                <span className="hp-badge-sep">•</span>
                <span>CLINICALLY VALIDATED</span>
              </div>
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .1 }}>
              AI-Powered<br />
              <span className="gd">MedAI</span><br />
              Diagnostics
            </motion.h1>
            
            <motion.p className="hp-hero-desc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .2 }}>
              The most advanced deep learning platform for chest radiography analysis. 
              Detect 28+ pathologies with 98.5% accuracy and receive clinical-grade reports in seconds.
            </motion.p>
            
            <motion.div className="hp-hero-btns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, delay: .3 }}>
              <button 
    className="hp-btn hp-btn-gold hp-btn-lg" 
    onClick={() => navigate("/login")}
              >
                <UploadIco size={18} color="#0F1B2D" />
                Start Free Trial
                <span className="hp-btn-badge">No credit card</span>
              </button>
              <button className="hp-btn hp-btn-outline hp-btn-lg" onClick={() => navigate("/case-studies")} style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Case Studies
              </button>
            </motion.div>
            
            <motion.div className="hp-hero-trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .5, delay: .45 }}>
              {[{ I: ShieldIco, l: "HIPAA Compliant" }, { I: AwardIco, l: "ISO 13485" }, { I: ShieldIco, l: "SOC 2 Type II" }].map((x, i) => (
                <div className="hp-hero-trust-item" key={i}>
                  <x.I size={14} color="#FFD700" />
                  {x.l}
                </div>
              ))}
            </motion.div>

            <motion.div className="hp-hero-rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }}>
              <div className="hp-rating-stars">
                {[...Array(5)].map((_, i) => <StarIco key={i} fill="#FFD700" size={16} />)}
              </div>
              <span>Rated 4.9/5 by 500+ radiologists</span>
            </motion.div>
          </div>
          
          <motion.div className="hp-hero-visual" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .2 }}>
            <div className="hp-hero-img-wrapper" style={{ maxWidth: '850px', margin: '0 auto' }}>
              <div className="hp-hero-img-glow" />
              <div className="hp-hero-img" style={{ transform: 'scale(1)' }}>
                <img 
                  src={chestXrayImage}
                  alt="Chest X-Ray Medical Analysis"
                  className="hp-hero-main-img"
                  style={{ width: '100%', height: 'auto', minHeight: '550px', objectFit: 'cover' }}
                  loading="eager"
                  fetchpriority="high"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.pexels.com/photos/7089019/pexels-photo-7089019.jpeg?auto=compress&cs=tinysrgb&w=1200";
                  }}
                />
                <div className="hp-img-overlay">
                  <div className="hp-scan-line" />
                  <div className="hp-hotspot hp-hotspot-1" />
                  <div className="hp-hotspot hp-hotspot-2" />
                  <div className="hp-hotspot hp-hotspot-3" />
                </div>
              </div>
            </div>
            
            {/* Floating cards */}
            <motion.div className="hp-fcard hp-fc1" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <div className="ib"><BrainIco size={20} color="#FFD700" /></div>
              <div><div className="v">98.5%</div><div className="l">Detection Accuracy</div></div>
              <div className="hp-card-trend up">↑ Clinical Grade</div>
            </motion.div>
            
            <motion.div className="hp-fcard hp-fc2" animate={{ y: [0, -8, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut" }}>
              <div className="ib"><ClockIco size={20} color="#FFD700" /></div>
              <div><div className="v">&lt; 24s</div><div className="l">Avg Analysis</div></div>
              <div className="hp-card-trend up">↑ 45% faster</div>
            </motion.div>
            
            <motion.div className="hp-fcard hp-fc3" animate={{ boxShadow: ["0 0 0px rgba(255,215,0,.15)", "0 0 25px rgba(255,215,0,.4)", "0 0 0px rgba(255,215,0,.15)"] }} transition={{ repeat: Infinity, duration: 2.5 }}>
              <div className="ib"><XRayIcon size={20} color="#FFD700" /></div>
              <div><div className="v">28+</div><div className="l">Pathologies</div></div>
            </motion.div>
            
            <motion.div className="hp-fcard hp-fc4" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.5, delay: 2 }}>
              <div className="ib"><UsersIco size={20} color="#FFD700" /></div>
              <div><div className="v">500+</div><div className="l">Hospitals</div></div>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="hp-hero-scroll">
          <span>Scroll to explore</span>
          <div className="hp-scroll-mouse">
            <div className="hp-scroll-wheel" />
          </div>
        </div>
      </motion.section>

      {/* TRUST SECTION */}
      <R>
        <div className="hp-trust">
          <div className="hp-trust-inner">
            <p>TRUSTED BY LEADING HEALTHCARE INSTITUTIONS WORLDWIDE</p>
            <div className="hp-trust-logos">
              {["Mayo Clinic", "Johns Hopkins", "Cleveland Clinic", "Stanford Medicine", "Mass General", "Kaiser Permanente"].map((n, i) => (
                <motion.span key={i} whileHover={{ color: "#D4A500", scale: 1.05 }}>{n}</motion.span>
              ))}
            </div>
          </div>
        </div>
      </R>

      {/* METRICS SECTION */}
      <section className="hp-metrics">
        <R>
          <div className="hp-metrics-grid">
            {stats.map((m, i) => (
              <motion.div className="hp-metric" key={i} whileHover={{ y: -4 }}>
                <div className="hp-metric-icon"><m.I size={28} color="#D4A500" /></div>
                <Counter value={m.v} suffix={m.sf} />
                <div className="hp-metric-label">{m.l}</div>
                <div className="hp-metric-trend">{m.trend}</div>
                {i < stats.length - 1 && <div className="hp-metric-div" />}
              </motion.div>
            ))}
          </div>
        </R>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="hp-features">
        <R>
          <div className="hp-stitle">
            <div className="hp-sbadge">AI DIAGNOSTIC PLATFORM</div>
            <h2>Comprehensive <span className="gd">chest pathology</span> detection</h2>
            <p>Our deep learning models are trained on over 500,000 clinical images, validated by world-class radiologists.</p>
          </div>
        </R>
        <div className="hp-fgrid">
          {features.map((f, i) => (
            <R key={i} delay={i * .07}>
              <motion.div 
                className="hp-fcard-f" 
                onHoverStart={() => setHoveredFeature(i)}
                onHoverEnd={() => setHoveredFeature(null)}
                whileHover={{ y: -8 }}
              >
                <div className="hp-ficon"><f.I size={26} color="currentColor" /></div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
                <div className="hp-fcard-arrow">
                  <ChevR />
                </div>
              </motion.div>
            </R>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <R>
        <div className="hp-dash hp-scanline">
          <div className="hp-dash-hdr">
            <div>
              <h3>Live Diagnostic Dashboard</h3>
              <p>Real-time AI analysis and predictions</p>
            </div>
            <div className="hp-dash-badges">
              <span className="hp-live"><span className="hp-pulse" /> Live Demo</span>
              <span className="hp-dash-badge">98.5% Accuracy</span>
              <span className="hp-dash-badge">HIPAA Compliant</span>
            </div>
          </div>
          <div className="hp-dash-stats">
            <motion.div className="hp-ds" whileHover={{ scale: 1.02 }}>
              <div className="hp-ds-icon"><ScanIco size={20} color="#FFD700" /></div>
              <div className="hp-ds-l">Total Scans Today</div>
              <div className="hp-ds-v">847</div>
              <div className="hp-ds-c">↑ 12% vs yesterday</div>
            </motion.div>
            <motion.div className="hp-ds" whileHover={{ scale: 1.02 }}>
              <div className="hp-ds-icon"><ClockIco size={20} color="#FFD700" /></div>
              <div className="hp-ds-l">Avg Response Time</div>
              <div className="hp-ds-v">24.3s</div>
              <div className="hp-ds-c">↓ 8% improvement</div>
            </motion.div>
            <motion.div className="hp-ds" whileHover={{ scale: 1.02 }}>
              <div className="hp-ds-icon"><BrainIco size={20} color="#FFD700" /></div>
              <div className="hp-ds-l">Detection Rate</div>
              <div className="hp-ds-v">99.2%</div>
              <div className="hp-ds-c">↑ 2.1% after update</div>
            </motion.div>
            <motion.div className="hp-ds" whileHover={{ scale: 1.02 }}>
              <div className="hp-ds-icon"><UsersIco size={20} color="#FFD700" /></div>
              <div className="hp-ds-l">Active Users</div>
              <div className="hp-ds-v">2,341</div>
              <div className="hp-ds-c">↑ 156 new today</div>
            </motion.div>
          </div>
          <div className="hp-dash-footer">
            <span>AI model: ChestNet-v3.2 • Last training: March 2025 • 500k+ clinical images</span>
          </div>
        </div>
      </R>

      {/* HOW IT WORKS */}
      <section id="process" className="hp-steps">
        <div className="hp-steps-inner">
          <R>
            <div className="hp-stitle">
              <div className="hp-sbadge">HOW IT WORKS</div>
              <h2>From upload to diagnosis in <span className="gd">four steps</span></h2>
              <p>Seamless workflow integrated with major PACS systems and EMR platforms.</p>
            </div>
          </R>
          <div className="hp-sgrid">
            {steps.map((s, i) => (
              <R key={i} delay={i * .09}>
                <div className="hp-step">
                  {i < 3 && <div className="hp-step-line" />}
                  <motion.div className="hp-step-n" whileHover={{ scale: 1.1, rotate: 5 }}>
                    {s.n}
                  </motion.div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
<section id="testimonials" className="hp-testi">
  <R>
    <div className="hp-stitle">
      <div className="hp-sbadge">TESTIMONIALS</div>
      <h2>Trusted by <span className="gd">medical experts</span> worldwide</h2>
      <p>Join over 500 healthcare institutions using MedAI for clinical decision support.</p>
    </div>
  </R>
  <div className="hp-tgrid">
    {testi.map((t, i) => (
      <R key={i} delay={i * .09}>
        <motion.div className="hp-tcard" whileHover={{ y: -8 }}>
          {/* ... contenu existant ... */}
        </motion.div>
      </R>
    ))}
  </div>
  
  {/* AJOUTEZ CE LIEN CONTACT SOUS LES TÉMOIGNAGES */}
  <div style={{ textAlign: "center", marginTop: 40 }}>
    <a href="/contact" onClick={(e) => { e.preventDefault(); navigate("/contact"); }} style={{ color: "#D4A500", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
      📧 Vous avez des questions ? Contactez-nous
    </a>
  </div>
</section>


      {/* CTA SECTION */}
      <section className="hp-cta">
        <div className="hp-cta-glow" />
        <div className="hp-cta-inner">
          <R>
            <div className="hp-cta-badge">Start your free trial</div>
            <h2>Ready to transform<br />chest X-ray diagnostics?</h2>
            <p>Join thousands of radiologists who have reduced interpretation time by 45%<br />while improving diagnostic accuracy.</p>
            <div className="hp-cta-btns">
              <button className="hp-btn hp-btn-gold hp-btn-lg" onClick={handleGetStarted}>
                Start Free Trial <ChevR />
              </button>
              <button className="hp-btn hp-btn-outline hp-btn-lg" onClick={handleGetStartedClassification} style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>
                Try Demo
              </button>
            </div>
            <div className="hp-cta-footer">
              <span>✓ No credit card required</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 14-day full access</span>
            </div>
          </R>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-grid">
            <div className="hp-footer-brand">
              <div className="hp-nav-logo" style={{ marginBottom: 16 }}>
                <div className="hp-logo-icon"><LungIco size={18} color="white" /></div>
                <span style={{ color: "#fff" }}>Med<span style={{ color: "#FFD700" }}>AI</span></span>
              </div>
              <p>AI-powered chest X-ray diagnostics for modern healthcare. Transforming radiology with deep learning.</p>
              <div className="hp-footer-socials">
                {["LI", "TW", "GH", "YT", "IN"].map((s, i) => (
                  <div className="hp-footer-social" key={i}>{s}</div>
                ))}
              </div>
            </div>
            <div>
              <h4>PRODUCT</h4>
              {["Chest X-Ray Analysis", "AI Detection Engine", "Radiologist Review", "API Access", "Mobile App"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
            </div>
            <div>
              <h4>COMPANY</h4>
              {["About Us", "Careers", "Research", "Blog", "Press Kit", "Contact"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
            </div>
            <div>
              <h4>RESOURCES</h4>
              {["Documentation", "Case Studies", "Whitepapers", "Webinars", "Support", "Status"].map(x => <a className="hp-footer-link" href="#" key={x}>{x}</a>)}
            </div>
          </div>
          <div className="hp-footer-bottom">
            <span>© 2025 MedAI. All rights reserved. Patent pending.</span>
            <div className="hp-footer-bottom-links">
              {["Privacy", "Terms", "Security", "HIPAA", "GDPR", "Sitemap"].map(x => <a href="#" key={x}>{x}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}