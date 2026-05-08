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
import "./styles/globals.css";

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
      {/* Pages publiques */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/classification" element={<Classification />} />
      <Route path="/pathologies" element={<Pathologies />} />
      
      {/* Redirection automatique */}
      <Route path="/dashboard" element={<DashboardRedirect />} />
      
      {/* Espace Patient */}
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
      
      {/* Espace Médecin */}
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
      
      {/* Administration */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["Administrateur"]}>
          <AdminPage />
        </ProtectedRoute>
      } />
      
      <Route path="/video-consultation/:id" element={<VideoConsultation />} />


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