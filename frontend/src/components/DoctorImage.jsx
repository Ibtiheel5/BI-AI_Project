// components/DoctorImage.jsx - Real medical professional images
export default function DoctorImage({ doctor, size = 'md' }) {
  const sizes = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 120
  };

  // Real doctor photos from Unsplash Medical collection
  const doctorImages = {
    'dr-sarah': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces',
    'dr-james': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=faces',
    'dr-emma': 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=faces',
    'dr-michael': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces',
    'dr-consultat': 'https://images.unsplash.com/photo-1666214280280-4ff80e34bcf6?w=400&h=400&fit=crop&crop=faces',
    'dr-radio': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=faces'
  };

  const imageUrl = doctorImages[doctor] || doctorImages['dr-sarah'];

  return (
    <div style={{
      width: sizes[size],
      height: sizes[size],
      borderRadius: '50%',
      overflow: 'hidden',
      border: '3px solid white',
      boxShadow: '0 4px 12px rgba(10, 38, 71, 0.15)',
      position: 'relative',
    }}>
      <img 
        src={imageUrl}
        alt="Medical professional"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: '#00A86B',
        border: '2px solid white',
        animation: 'pulse 2s infinite',
      }} />
    </div>
  );
}