// frontend/src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = "http://localhost:8000/api/v1";

// SVG Components
const MedAILogo = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80">
        <stop stopColor="#0A2647"/>
        <stop offset="0.5" stopColor="#1B3B6F"/>
        <stop offset="1" stopColor="#2563EB"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="80" y2="80">
        <stop stopColor="#FFD700"/>
        <stop offset="1" stopColor="#FFA500"/>
      </linearGradient>
    </defs>
    <rect width="80" height="80" rx="20" fill="url(#logoGrad)"/>
    <path d="M26 40L32 26L38 40L44 26L50 40" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="38" cy="50" r="3.5" fill="white"/>
  </svg>
);

const SuccessIcon = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
  >
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#10B981"/>
      <path d="M24 40L34 50L56 28" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  </motion.div>
);

const WarningIcon = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
  >
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#F59E0B"/>
      <path d="M40 24V44M40 52H40.01" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  </motion.div>
);

const ErrorIcon = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
  >
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="40" fill="#EF4444"/>
      <path d="M28 28L52 52M52 28L28 52" stroke="white" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  </motion.div>
);

const LoaderIcon = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
  >
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="4" fill="none"/>
      <circle cx="32" cy="32" r="28" stroke="#0A2647" strokeWidth="4" strokeLinecap="round" strokeDasharray="176" strokeDashoffset="100" fill="none"/>
    </svg>
  </motion.div>
);

const ParticleBackground = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  }}>
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        }}
        animate={{
          y: [null, -100, -200],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 5,
        }}
        style={{
          position: 'absolute',
          width: 4 + Math.random() * 6,
          height: 4 + Math.random() * 6,
          background: `rgba(37, 99, 235, ${0.1 + Math.random() * 0.2})`,
          borderRadius: '50%',
        }}
      />
    ))}
  </div>
);

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien de verification invalide');
      return;
    }

    fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async response => {
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Reponse serveur invalide');
        }
        
        if (response.ok && data.success) {
          if (data.message.includes('deja') || data.message.includes('déjà')) {
            setStatus('warning');
            setMessage('Email deja verifie');
          } else {
            setStatus('success');
            setMessage('Email verifie avec succes');
          }
        } else {
          setStatus('error');
          setMessage(data.message || 'Erreur lors de la verification');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Serveur indisponible');
      });
  }, [token]);

  useEffect(() => {
    if (status === 'success' || status === 'warning') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const renderIcon = () => {
    switch (status) {
      case 'success': return <SuccessIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <LoaderIcon />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'success': return 'Verification reussie';
      case 'warning': return 'Deja verifie';
      case 'error': return 'Erreur';
      default: return 'Verification en cours';
    }
  };

  const getTitleColor = () => {
    switch (status) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#0A2647';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F4F7FC 0%, #E8EEF5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <ParticleBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{
          maxWidth: 500,
          width: '100%',
          background: 'white',
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Header avec animation de vague */}
        <div style={{
          background: 'linear-gradient(135deg, #0A2647 0%, #1B3B6F 100%)',
          padding: '40px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
              borderRadius: '50%'
            }}
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              position: 'absolute',
              bottom: -50,
              left: -50,
              width: 180,
              height: 180,
              background: 'radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)',
              borderRadius: '50%'
            }}
          />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          >
            <MedAILogo />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ color: 'white', fontSize: 28, marginTop: 16, marginBottom: 4 }}
          >
            Med<span style={{ color: '#FFD700' }}>AI</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}
          >
            Plateforme de telemedecine
          </motion.p>
        </div>

        {/* Body avec animations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ padding: '40px 32px', textAlign: 'center' }}
        >
          <div style={{ marginBottom: 24 }}>
            {renderIcon()}
          </div>
          
          <motion.h2
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 12,
              color: getTitleColor()
            }}
          >
            {getTitle()}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ color: '#475569', lineHeight: 1.6, marginBottom: 28, fontSize: 15 }}
          >
            {message}
          </motion.p>
          
          {(status === 'success' || status === 'warning') && (
            <>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5 }}
                style={{
                  height: 4,
                  background: 'linear-gradient(90deg, #10B981, #0A2647)',
                  borderRadius: 4,
                  marginBottom: 20
                }}
              />
              <p style={{ color: '#64748B', fontSize: 13, marginBottom: 20 }}>
                Redirection automatique vers la page de connexion
              </p>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.02 }}
              >
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'linear-gradient(135deg, #0A2647, #1B3B6F)',
                    color: 'white',
                    border: 'none',
                    padding: '14px 32px',
                    borderRadius: 40,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s'
                  }}
                >
                  Se connecter maintenant
                </button>
              </motion.div>
            </>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <button
                onClick={() => navigate('/')}
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: 40,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Retour a l'accueil
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Footer avec effet de brillance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            padding: '20px',
            textAlign: 'center',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC'
          }}
        >
          <p style={{ color: '#94A3B8', fontSize: 11, margin: 0 }}>
            Securite • Confidentialite • Innovation
          </p>
          <p style={{ color: '#CBD5E1', fontSize: 10, marginTop: 8 }}>
            © 2024 MedAI. Tous droits reserves.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}