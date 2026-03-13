// components/MedicalTimeline.jsx - New component
export default function MedicalTimeline({ events }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    }}>
      <h3 style={{ fontSize: '0.9rem', color: '#2563eb', marginBottom: 16 }}>HISTORIQUE MÉDICAL</h3>
      
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: 7,
          top: 8,
          bottom: 8,
          width: 2,
          background: 'linear-gradient(to bottom, #2563eb, #10b981)',
        }} />
        
        {events.map((event, index) => (
          <div key={index} style={{
            display: 'flex',
            gap: 16,
            marginBottom: 20,
            position: 'relative',
          }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: event.type === 'diagnostic' ? '#2563eb' : '#10b981',
              border: '3px solid white',
              boxShadow: '0 0 0 2px rgba(37,99,235,0.2)',
              zIndex: 1,
            }} />
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>
                {event.time}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{event.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>{event.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}