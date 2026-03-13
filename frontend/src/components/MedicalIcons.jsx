// components/MedicalIcons.jsx - Custom SVG medical icons
export const MedicalIcons = {
  Heart: ({ size = 24, color = '#D62828', animated = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5C22 12.27 18.6 15.36 13.45 20.03L12 21.35Z" 
        fill={color} fillOpacity="0.9"/>
      {animated && (
        <animate 
          attributeName="fillOpacity" 
          values="0.9;0.6;0.9" 
          dur="1.5s" 
          repeatCount="indefinite" 
        />
      )}
    </svg>
  ),

  Lungs: ({ size = 24, color = '#2D5F9E' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3V21M12 3C10 3 8 5 8 8V12C8 15 10 17 12 17M12 3C14 3 16 5 16 8V12C16 15 14 17 12 17" 
        stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M6 8L2 12L6 16M18 8L22 12L18 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),

  Brain: ({ size = 24, color = '#6B9AC4' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4C8 4 5 7 5 11C5 15 8 18 12 18M12 4C16 4 19 7 19 11C19 15 16 18 12 18M12 4V18" 
        stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="11" r="2" fill={color} fillOpacity="0.3"/>
    </svg>
  ),

  Stethoscope: ({ size = 24, color = '#1B3B6F' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6V13C6 15 8 17 12 17C16 17 18 15 18 13V6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="18" cy="6" r="2" stroke={color} strokeWidth="1.8"/>
      <path d="M12 17V21M12 21H9M12 21H15" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),

  XRay: ({ size = 24, color = '#2D5F9E' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="1.6"/>
      <line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="8" y1="14" x2="16" y2="14" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="8" y1="18" x2="12" y2="18" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),

  ECG: ({ size = 24, color = '#D62828', animated = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M2 12H5L7 8L10 16L13 10L15 14L18 8L20 12H22" 
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={animated ? '100' : '0'}
        strokeDashoffset={animated ? '100' : '0'}>
        {animated && (
          <animate 
            attributeName="stroke-dashoffset" 
            values="100;0" 
            dur="2s" 
            repeatCount="indefinite" 
          />
        )}
      </path>
    </svg>
  ),
};