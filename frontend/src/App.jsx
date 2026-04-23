// App.jsx — ARCHITECTURE UNIFIÉE MÉDECIN
// Dashboard tout-en-un : plus besoin de naviguer entre plusieurs pages
import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Pages Publiques
import LoginPage           from "./pages/LoginPage";
import RegisterPage        from "./pages/RegisterPage";
import LandingPage         from "./pages/LandingPage";

// Pages Médecin (UNIFIÉES)
import DoctorDashboard     from "./pages/DoctorDashboard";     // Nouveau dashboard tout-en-un
import Classification      from "./pages/Classification";       // Analyse libre
import Pathologies         from "./pages/Pathologies";          // Catalogue pathologies
import VideoConsultation   from "./pages/VideoConsultation";    // Visioconférence

// Pages Patient
import PatientDashboard    from "./pages/PatientDashboard";
import ConsultationRequest from "./pages/ConsultationRequest";
import ConsultationRoom    from "./pages/ConsultationRoom";

// Pages Admin
import AdminPage           from "./pages/AdminPage";

// Composants
import Header              from "./components/Header";

import "./styles/index.css";

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function getDefaultRoute(user) {
  if (!user) return "/";
  if (user.is_admin || user.role === "Administrateur") return "/admin";
  if (user.role === "Patient") return "/patient";
  return "/doctor";  // ← Route unifiée pour les médecins
}

function FullPageLoader({ label = "Chargement..." }) {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
      color: "#0A2647",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 42,
          height: 42,
          margin: "0 auto 12px",
          borderRadius: "50%",
          border: "3px solid #DCE7F3",
          borderTopColor: "#0A2647",
          animation: "app-spin 0.8s linear infinite",
        }} />
        <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{label}</div>
      </div>
      <style>{`
        @keyframes app-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleResetSession = this.handleResetSession.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route rendering failed:", error, errorInfo);
  }

  handleResetSession() {
    try {
      localStorage.removeItem("medai-token");
      localStorage.removeItem("medai-user");
    } catch {}
    window.location.href = "/login";
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
        padding: 24,
      }}>
        <div style={{
          maxWidth: 520,
          width: "100%",
          background: "white",
          border: "1px solid #E2E8F0",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        }}>
          <h2 style={{ margin: "0 0 10px", color: "#0A2647" }}>
            Le dashboard n'a pas pu s'afficher
          </h2>
          <p style={{ margin: 0, color: "#64748B", lineHeight: 1.6 }}>
            Un composant a planté pendant le rendu. Rechargez la page ou reconnectez-vous
            pour réinitialiser la session.
          </p>
          <button
            onClick={this.handleResetSession}
            style={{
              marginTop: 18,
              padding: "10px 16px",
              borderRadius: 10,
              border: "none",
              background: "#0A2647",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Réinitialiser la session
          </button>
        </div>
      </main>
    );
  }
}

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader label="Vérification de la session..." />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (roles && !roles.includes(user.role) && !user.is_admin) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }
  
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader label="Préparation de votre espace..." />;
  return <Navigate to={getDefaultRoute(user)} replace />;
}

function WithHeader({ children }) {
  return (
    <>
      <Header />
      <main style={{ minHeight: "calc(100vh - 64px)" }}>
        {children}
      </main>
    </>
  );
}

// Layout sans header pour les pages qui ont leur propre design
function WithoutHeader({ children }) {
  return <main>{children}</main>;
}

// ═══════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader label="Initialisation de l'application..." />;
  }

  return (
    <RouteErrorBoundary>
      <Routes>

      {/* ═══════════════════════════════════════════════════════════
          ROUTES PUBLIQUES
          ═══════════════════════════════════════════════════════ */}
      
      <Route path="/" element={
        user ? <RoleRedirect /> : (
          <WithoutHeader>
            <LandingPage />
          </WithoutHeader>
        )
      } />

      <Route path="/login" element={
        user ? <RoleRedirect /> : <LoginPage />
      } />
      
      <Route path="/register" element={
        user ? <RoleRedirect /> : <RegisterPage />
      } />

      {/* ═══════════════════════════════════════════════════════════
          ROUTES MÉDECIN — ARCHITECTURE UNIFIÉE
          ═══════════════════════════════════════════════════════ */}
      
      {/* Dashboard principal — TOUT le workflow médical intégré */}
      <Route path="/doctor" element={
        <ProtectedRoute roles={["Medecin"]}>
          <WithHeader>
            <DoctorDashboard />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* Redirections depuis les anciennes routes */}
      <Route path="/home" element={<Navigate to="/doctor" replace />} />
      <Route path="/doctor/queue" element={<Navigate to="/doctor" replace />} />

      {/* Analyse libre (classification directe sans consultation) */}
      <Route path="/classification" element={
        <ProtectedRoute roles={["Medecin"]}>
          <WithHeader>
            <Classification />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* Catalogue des pathologies */}
      <Route path="/pathologies" element={
        <ProtectedRoute roles={["Medecin"]}>
          <WithHeader>
            <Pathologies />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* Visioconférence (accessible depuis le dashboard) */}
      <Route path="/video/:id" element={
        <ProtectedRoute roles={["Medecin"]}>
          <WithoutHeader>
            <VideoConsultation />
          </WithoutHeader>
        </ProtectedRoute>
      } />

      {/* ═══════════════════════════════════════════════════════════
          ROUTES PATIENT
          ═══════════════════════════════════════════════════════ */}
      
      <Route path="/patient" element={
        <ProtectedRoute roles={["Patient"]}>
          <WithHeader>
            <PatientDashboard />
          </WithHeader>
        </ProtectedRoute>
      } />

      <Route path="/patient/consultation/new" element={
        <ProtectedRoute roles={["Patient"]}>
          <WithHeader>
            <ConsultationRequest />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* ═══════════════════════════════════════════════════════════
          ROUTES PARTAGÉES (PATIENT + MÉDECIN)
          ═══════════════════════════════════════════════════════ */}
      
      <Route path="/consultation/:id" element={
        <ProtectedRoute roles={["Medecin", "Patient"]}>
          <WithHeader>
            <ConsultationRoom />
          </WithHeader>
        </ProtectedRoute>
      } />

      <Route path="/video/consultation/:id" element={
        <ProtectedRoute roles={["Medecin", "Patient"]}>
          <WithoutHeader>
            <VideoConsultation />
          </WithoutHeader>
        </ProtectedRoute>
      } />

      {/* ═══════════════════════════════════════════════════════════
          ROUTES ADMIN
          ═══════════════════════════════════════════════════════ */}
      
      <Route path="/admin" element={
        <ProtectedRoute roles={["Administrateur"]}>
          <WithHeader>
            <AdminPage />
          </WithHeader>
        </ProtectedRoute>
      } />

      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

      {/* ═══════════════════════════════════════════════════════════
          FALLBACK
          ═══════════════════════════════════════════════════════ */}
      
      <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </RouteErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
