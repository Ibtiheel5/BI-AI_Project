// App.jsx — COMPLET ET CORRIGÉ
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Pages
import LoginPage           from "./pages/LoginPage";
import RegisterPage        from "./pages/RegisterPage";
import LandingPage         from "./pages/LandingPage";
import MedecinDashboard    from "./pages/MedecinDashboard";
import Classification      from "./pages/Classification";
import Pathologies         from "./pages/Pathologies";
import DoctorQueue         from "./pages/DoctorQueue";
import PatientDashboard    from "./pages/PatientDashboard";
import ConsultationRequest from "./pages/ConsultationRequest";
import ConsultationRoom    from "./pages/ConsultationRoom";
import AdminPage           from "./pages/AdminPage";
import CIM11ChatbotPage    from "./pages/CIM11ChatbotPage";
import Header              from "./components/Header";

import "./styles/index.css";

// ── Helpers ────────────────────────────────────────────────────────
function getDefaultRoute(user) {
  if (!user) return "/";
  if (user.is_admin || user.role === "Administrateur") return "/admin";
  if (user.role === "Patient") return "/patient";
  return "/home";
}

// ✅ FIX 1 : Comparaison insensible à la casse + trim pour éviter les bugs
// de type "Médecin" (avec accent) vs "Medecin" selon le backend
function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !user.is_admin) {
    const userRole = (user.role || "").trim().toLowerCase();
    const hasRole  = roles.some(r => r.trim().toLowerCase() === userRole);
    if (!hasRole) return <Navigate to={getDefaultRoute(user)} replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDefaultRoute(user)} replace />;
}

function WithHeader({ children }) {
  return <><Header /><main>{children}</main></>;
}

// ── Routes ─────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* ── Page d'accueil publique ── */}
      <Route path="/" element={
        user ? <RoleRedirect /> : <><Header /><LandingPage /></>
      } />

      {/* ── Auth ── */}
      <Route path="/login" element={
        user ? <RoleRedirect /> : <LoginPage />
      } />

      <Route path="/register" element={
        user ? <RoleRedirect /> : <RegisterPage />
      } />

      {/* ── Médecin ── */}
      <Route path="/home" element={
        <ProtectedRoute roles={["Medecin", "Médecin"]}>
          <WithHeader>
            <MedecinDashboard />
          </WithHeader>
        </ProtectedRoute>
      } />

      <Route path="/classification" element={
        <ProtectedRoute roles={["Medecin", "Médecin"]}>
          <WithHeader>
            <Classification />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* ✅ FIX 2 : /pathologies accessible Médecin ET Administrateur
          (Header l'affiche pour les deux rôles) */}
      <Route path="/pathologies" element={
        <ProtectedRoute roles={["Medecin", "Médecin", "Administrateur"]}>
          <WithHeader>
            <Pathologies />
          </WithHeader>
        </ProtectedRoute>
      } />

      <Route path="/doctor/queue" element={
        <ProtectedRoute roles={["Medecin", "Médecin"]}>
          <WithHeader>
            <DoctorQueue />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* ✅ FIX 3 : /cim11 accessible Médecin ET Administrateur
          (Header l'affiche pour les deux rôles, backend autorise les deux) */}
      <Route path="/cim11" element={
        <ProtectedRoute roles={["Medecin", "Médecin", "Administrateur"]}>
          <WithHeader>
            <CIM11ChatbotPage />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* ── Patient ── */}
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

      {/* ── Salle partagée (patient + médecin) ── */}
      <Route path="/consultation/:id" element={
        <ProtectedRoute>
          <WithHeader>
            <ConsultationRoom />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* ── Admin ── */}
      <Route path="/admin" element={
        <ProtectedRoute roles={["Administrateur"]}>
          <WithHeader>
            <AdminPage />
          </WithHeader>
        </ProtectedRoute>
      } />

      {/* ── Fallback ── */}
      <Route path="*" element={
        <Navigate to="/" replace />
      } />

    </Routes>
  );
}

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