// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminPage from "./pages/AdminPage";
import Classification from "./pages/Classification";
import Pathologies from "./pages/Pathologies";
import ConsultationRequest from "./pages/ConsultationRequest";
import ConsultationRoom from "./pages/ConsultationRoom";
import VideoConsultation from "./pages/VideoConsultation";
import DoctorQueue from "./pages/DoctorQueue";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import DoctorRemindersPage from "./pages/doctor/DoctorRemindersPage";

import "./styles/globals.css";

// NOUVELLES IMPORTS - PAGES PATIENT
// Dans App.jsx, assurez-vous d'importer correctement les pages
import MedicalHistoryPage from "./pages/patient/MedicalHistoryPage";
import ProfilePage from "./pages/patient/ProfilePage";
import ResultsPage from "./pages/patient/ResultsPage";
import ResultDetailPage from "./pages/patient/ResultDetailPage";
import HealthEvolutionPage from "./pages/patient/HealthEvolutionPage";
import DocumentsPage from "./pages/patient/DocumentsPage";
import PreferencesPage from "./pages/patient/PreferencesPage";
import PrescriptionsPage from "./pages/patient/PrescriptionsPage";
import RemindersPage from "./pages/patient/RemindersPage";
import UpcomingCallsPage from "./pages/patient/UpcomingCallsPage";
import CallHistoryPage from "./pages/patient/CallHistoryPage";

// Composant de redirection selon le rôle
function DashboardRedirect() {
  const { user, isAdmin, isPatient } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isPatient) return <Navigate to="/patient" replace />;
  return <Navigate to="/home" replace />;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#F4F7FC"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48,
            height: 48,
            border: "3px solid #E2E8F0",
            borderTopColor: "#2D5F9E",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ color: "#64748B" }}>Chargement de MedAI...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ========== PAGES PUBLIQUES ========== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/classification" element={<Classification />} />
      <Route path="/pathologies" element={<Pathologies />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/features" element={<Contact />} />  
      <Route path="/process" element={<Contact />} />    
      <Route path="/testimonials" element={<Contact />} /> 
      
      {/* Redirection automatique */}
      <Route path="/dashboard" element={<DashboardRedirect />} />
      
      {/* ========== ESPACE PATIENT ========== */}
      {/* Dashboard principal */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/patient/dossiers" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <PatientDashboard initialTab="dossiers" />
        </ProtectedRoute>
      } />
      <Route path="/patient/messages" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <PatientDashboard initialTab="messages" />
        </ProtectedRoute>
      } />
      
      {/* Consultations */}
      <Route path="/patient/consultation/new" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <ConsultationRequest />
        </ProtectedRoute>
      } />
      <Route path="/patient/consultation/:id" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <ConsultationRoom />
        </ProtectedRoute>
      } />
      <Route path="/consultation/:id" element={<ConsultationRoom />} />
      <Route path="/video/:id" element={<VideoConsultation />} />
      <Route path="/video-consultation/:id" element={<VideoConsultation />} />

      {/* RÉSULTATS - NOUVEAU */}
      <Route path="/patient/resultats" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <ResultsPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/resultats/:id" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <ResultDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/resultats/evolution" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <HealthEvolutionPage />
        </ProtectedRoute>
      } />

      {/* PROFIL - NOUVEAU */}
      <Route path="/patient/profil" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/patient/profil/medical" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <MedicalHistoryPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/profil/documents" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <DocumentsPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/profil/preferences" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <PreferencesPage />
        </ProtectedRoute>
      } />

      {/* PRESCRIPTIONS - NOUVEAU */}
      <Route path="/patient/prescriptions" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <PrescriptionsPage />
        </ProtectedRoute>
      } />

      {/* RAPPELS - NOUVEAU */}
      <Route path="/patient/rappels" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <RemindersPage />
        </ProtectedRoute>
      } />

      {/* TÉLÉCONSULTATIONS - NOUVEAU */}
      <Route path="/patient/teleconsultation/upcoming" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <UpcomingCallsPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/teleconsultation/history" element={
        <ProtectedRoute allowedRoles={["Patient"]}>
          <CallHistoryPage />
        </ProtectedRoute>
      } />
      
      {/* ========== ESPACE MÉDECIN ========== */}
      <Route path="/home" element={
        <ProtectedRoute allowedRoles={["Medecin"]}>
          <DoctorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/doctor/queue" element={
        <ProtectedRoute allowedRoles={["Medecin"]}>
          <DoctorQueue />
        </ProtectedRoute>
      } />

      <Route path="/doctor/reminders" element={<DoctorRemindersPage />} />
      
      {/* ========== ADMINISTRATION ========== */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["Administrateur"]}>
          <AdminPage />
        </ProtectedRoute>
      } />

      {/* 404 - Rediriger vers la page d'accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}