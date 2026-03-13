// Home.jsx — Professional medical homepage with real imagery
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorImage from "../components/DoctorImage";
import { MedicalIcons } from "../components/MedicalIcons";

export default function Home() {
  const navigate = useNavigate();
  const [stats] = useState({
    patients: 15247,
    analyses: 12483,
    precision: 97.8,
    radiologues: 8,
  });

  // Real medical imagery from Unsplash
  const medicalImages = {
    hero: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&auto=format',
    xray: 'https://images.unsplash.com/photo-1516069677018-378515003d35?w=800&auto=format',
    team: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800&auto=format',
    consultation: 'https://images.unsplash.com/photo-1666214280280-4ff80e34bcf6?w=400&auto=format',
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section with Medical Background */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0A2647 0%, #1B3B6F 50%, #2D5F9E 100%)',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Medical pattern overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 10L50 22L50 38L30 50L10 38L10 22L30 10Z' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
          opacity: 0.5,
        }} />

        {/* Background medical imagery */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          background: `linear-gradient(90deg, #0A2647 0%, transparent 100%), url(${medicalImages.hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
        }} />

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px',
          position: 'relative',
          zIndex: 2,
          width: '100%',
        }}>
          <div style={{ maxWidth: 600 }}>
            {/* Medical team indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
              background: 'rgba(255,255,255,0.1)',
              padding: '12px 24px',
              borderRadius: 60,
              backdropFilter: 'blur(10px)',
              width: 'fit-content',
            }}>
              <div style={{ display: 'flex' }}>
                <DoctorImage doctor="dr-sarah" size="sm" />
                <DoctorImage doctor="dr-james" size="sm" />
                <DoctorImage doctor="dr-emma" size="sm" />
                <DoctorImage doctor="dr-michael" size="sm" />
              </div>
              <span style={{ color: 'white', fontSize: '0.9rem' }}>
                Équipe médicale disponible 24/7
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: 24,
            }}>
              Intelligence Artificielle<br />
              au service du diagnostic<br />
              <span style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>radiologique</span>
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 40,
              lineHeight: 1.7,
            }}>
              Plateforme certifiée par la Société Française de Radiologie. 
              Analysez vos radiographies avec une précision de 97.8% grâce à nos 
              modèles entraînés sur plus de 100 000 cas cliniques.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                onClick={() => navigate('/classification')}
                style={{
                  padding: '16px 36px',
                  background: 'white',
                  border: 'none',
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0A2647',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <MedicalIcons.Stethoscope size={20} color="#0A2647" />
                Commencer l'analyse
              </button>
              <button
                onClick={() => navigate('/pathologies')}
                style={{
                  padding: '16px 36px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 40,
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'white',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Explorer les pathologies
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
              marginTop: 60,
            }}>
              {[
                { value: '15k+', label: 'Patients analysés' },
                { value: '97.8%', label: 'Précision clinique' },
                { value: '<3s', label: 'Temps d\'analyse' },
              ].map((stat, i) => (
                <div key={i}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            background: 'rgba(43, 95, 158, 0.1)',
            borderRadius: 40,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#1B3B6F',
            marginBottom: 16,
          }}>
            TECHNOLOGIE MÉDICALE CERTIFIÉE
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#0A2647',
            marginBottom: 20,
          }}>
            Une solution complète pour les<br />professionnels de santé
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 30,
        }}>
          {[
            {
              icon: <MedicalIcons.Heart size={32} color="#D62828" animated />,
              title: 'Détection précoce',
              description: 'Algorithmes entraînés pour détecter les anomalies dès les premiers stades avec une sensibilité de 96.8%.'
            },
            {
              icon: <MedicalIcons.Brain size={32} color="#2D5F9E" />,
              title: 'IA explicable',
              description: 'Visualisation Grad-CAM des zones ayant influencé la décision du modèle pour une transparence totale.'
            },
            {
              icon: <MedicalIcons.XRay size={32} color="#1B3B6F" />,
              title: 'Multi-modalités',
              description: 'Support radiographie, CT scan et IRM avec modèles spécialisés pour chaque type d\'imagerie.'
            },
          ].map((feature, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: 24,
              padding: 40,
              boxShadow: '0 10px 30px -5px rgba(10, 38, 71, 0.1)',
              border: '1px solid rgba(43, 95, 158, 0.1)',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'rgba(43, 95, 158, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#0A2647',
                marginBottom: 12,
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: '#64748B',
                lineHeight: 1.7,
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div style={{
        background: '#F8FAFC',
        padding: '80px 32px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60,
            alignItems: 'center',
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                padding: '8px 24px',
                background: 'rgba(43, 95, 158, 0.1)',
                borderRadius: 40,
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1B3B6F',
                marginBottom: 16,
              }}>
                NOTRE ÉQUIPE MÉDICALE
              </div>
              <h2 style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                color: '#0A2647',
                marginBottom: 24,
              }}>
                Des radiologues experts<br />à votre service
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#64748B',
                lineHeight: 1.8,
                marginBottom: 32,
              }}>
                Notre équipe de radiologues certifiés supervise chaque analyse et 
                valide les résultats avant leur transmission. Une collaboration 
                unique entre l'IA et l'expertise humaine.
              </p>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { count: '12', label: 'Radiologues' },
                  { count: '50k+', label: 'Cas validés' },
                  { count: '24/7', label: 'Disponibilité' },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1B3B6F' }}>
                      {item.count}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(10, 38, 71, 0.2)',
            }}>
              <img 
                src={medicalImages.team}
                alt="Medical team"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        maxWidth: 1000,
        margin: '60px auto',
        padding: '60px 40px',
        background: 'linear-gradient(135deg, #0A2647, #1B3B6F)',
        borderRadius: 32,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px',
        }} />
        
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{
            fontSize: '2.2rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: 20,
          }}>
            Prêt à transformer votre pratique ?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: 40,
            maxWidth: 500,
            margin: '0 auto 40px',
          }}>
            Rejoignez les 150+ établissements de santé qui utilisent ChestAI 
            quotidiennement pour améliorer leurs diagnostics.
          </p>
          <button
            onClick={() => navigate('/classification')}
            style={{
              padding: '16px 48px',
              background: 'white',
              border: 'none',
              borderRadius: 40,
              fontSize: '1rem',
              fontWeight: 700,
              color: '#0A2647',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            Commencer maintenant
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        maxWidth: 1200,
        margin: '0 auto 40px',
        padding: '20px 32px',
        borderTop: '1px solid rgba(43, 95, 158, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#64748B',
        fontSize: '0.8rem',
      }}>
        <div>© 2024 ChestAI - Tous droits réservés</div>
        <div>Certifié CE-IVD · Dispositif médical de classe IIa</div>
      </footer>
    </div>
  );
}