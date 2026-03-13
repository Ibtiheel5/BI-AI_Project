// components/DoctorAvatar.jsx - New component
import { useState, useEffect } from 'react';

const DOCTORS = [
  { id: 1, name: 'Dr. Sarah Chen', specialty: 'Radiologue', status: 'en ligne', avatar: '👩‍⚕️' },
  { id: 2, name: 'Dr. James Wilson', specialty: 'Pneumologue', status: 'consultation', avatar: '👨‍⚕️' },
  { id: 3, name: 'Dr. Emma Laurent', specialty: 'Oncologue', status: 'en ligne', avatar: '👩‍⚕️' },
  { id: 4, name: 'Dr. Michael Ross', specialty: 'Urgentiste', status: 'disponible', avatar: '👨‍⚕️' },
];

export default function DoctorAvatar({ doctorId, showStatus = true, size = 'md' }) {
  const [isActive, setIsActive] = useState(false);
  const doctor = DOCTORS.find(d => d.id === doctorId) || DOCTORS[0];
  
  const sizes = {
    sm: { container: 40, icon: '1.2rem', badge: 12 },
    md: { container: 56, icon: '1.8rem', badge: 14 },
    lg: { container: 72, icon: '2.2rem', badge: 16 },
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsActive(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: sizes[size].container,
        height: sizes[size].container,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${doctor.status === 'en ligne' ? '#10b981' : '#f59e0b'}, ${doctor.status === 'en ligne' ? '#059669' : '#d97706'})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: sizes[size].icon,
        boxShadow: isActive ? '0 0 20px rgba(16,185,129,0.6)' : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        animation: doctor.status === 'en ligne' ? 'glow 2s infinite' : 'none',
      }}>
        {doctor.avatar}
      </div>
      
      {showStatus && (
        <div style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: sizes[size].badge,
          height: sizes[size].badge,
          borderRadius: '50%',
          background: doctor.status === 'en ligne' ? '#10b981' : doctor.status === 'disponible' ? '#f59e0b' : '#94a3b8',
          border: '2px solid white',
          animation: doctor.status === 'en ligne' ? 'pulse 1.5s infinite' : 'none',
        }} />
      )}
    </div>
  );
}