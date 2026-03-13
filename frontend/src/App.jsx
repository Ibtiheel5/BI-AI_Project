// App.jsx — Racine de l'application avec Auth + ThemeProvider
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import WelcomeModal from "./components/WelcomeModal";
import Home from "./pages/Home";
import Classification from "./pages/Classification";
import Pathologies from "./pages/Pathologies";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";
import "./styles/index.css";

// Composant interne qui a accès au contexte Auth
function AppContent() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const [prevUser, setPrevUser] = useState(null);

  useEffect(() => {
    if (user && !prevUser) setShowWelcome(true);
    setPrevUser(user);
  }, [user]);

  return (
    <>
      {showWelcome && user && (
        <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />
      )}
      <Routes>
        {/* Routes publiques */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes protégées */}
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app">
              <Header />
              <main className="app-body">
                <Routes>
                  <Route path="/"               element={<Home />} />
                  <Route path="/classification" element={<Classification />} />
                  <Route path="/pathologies"    element={<Pathologies />} />
                  <Route path="/admin"          element={<AdminPage />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}