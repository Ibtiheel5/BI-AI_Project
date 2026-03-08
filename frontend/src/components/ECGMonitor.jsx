// components/ECGMonitor.jsx - New animated ECG component
import { useEffect, useRef } from 'react';

export default function ECGMonitor({ isActive = true, heartRate = 72 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    let offset = 0;
    
    const drawECG = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(37,99,235,0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw ECG line
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#2563eb';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      ctx.moveTo(0, height/2);
      
      for (let x = 0; x < width; x += 2) {
        const t = (x + offset) * 0.02;
        let y = height/2;
        
        // Simulate QRS complex
        if (Math.sin(t * 10) > 0.8) {
          y = height/4;
        } else if (Math.sin(t * 10) < -0.8) {
          y = height * 0.75;
        } else {
          y = height/2 + Math.sin(t) * 10;
        }
        
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      
      offset += 2;
      requestAnimationFrame(drawECG);
    };
    
    drawECG();
    
    return () => cancelAnimationFrame(drawECG);
  }, [isActive]);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      padding: '12px',
      border: '1px solid rgba(37,99,235,0.1)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>MONITORING ECG</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10b981',
            animation: 'pulse 1s infinite',
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{heartRate} BPM</span>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 80 }} />
    </div>
  );
}