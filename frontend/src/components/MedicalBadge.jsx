// components/MedicalBadge.jsx - New component
export default function MedicalBadge({ type, value, unit, trend }) {
  const getColor = () => {
    switch(type) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'normal': return '#10b981';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: `linear-gradient(135deg, ${getColor()}15, ${getColor()}05)`,
      border: `1px solid ${getColor()}30`,
      borderRadius: '100px',
      backdropFilter: 'blur(8px)',
      fontSize: '0.85rem',
      fontWeight: 600,
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: getColor(),
        animation: type === 'critical' ? 'pulse 1s infinite' : 'none',
      }} />
      <span style={{ color: getColor() }}>{value}</span>
      {unit && <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{unit}</span>}
      {trend && (
        <span style={{ marginLeft: 4 }}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
  );
}