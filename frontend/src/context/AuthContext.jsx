// context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const AuthContext = createContext(null);

const API_BASE = "http://localhost:8000/api/v1";

// ── Comptes locaux fallback (offline) ─────────────────────────────
const LOCAL_USERS = [
  {
    id: 1, username: "dr.martin", password: "chest123",
    full_name: "Dr. Martin", name: "Dr. Martin",
    domains: ["chest"], role: "Medecin", specialty: "Radiologie thoracique",
    status: "approved", is_admin: false,
  },
  {
    id: 2, username: "dr.lambert", password: "neuro123",
    full_name: "Dr. Lambert", name: "Dr. Lambert",
    domains: ["brain"], role: "Medecin", specialty: "Neurologie & IRM",
    status: "approved", is_admin: false,
  },
  {
    id: 3, username: "dr.benali", password: "lung123",
    full_name: "Dr. Benali", name: "Dr. Benali",
    domains: ["lung"], role: "Medecin", specialty: "Oncologie pulmonaire",
    status: "approved", is_admin: false,
  },
  {
    id: 4, username: "admin", password: "admin123",
    full_name: "Administrateur", name: "Administrateur",
    domains: ["chest", "lung", "brain"], role: "Administrateur",
    specialty: "Accès complet", status: "approved", is_admin: true,
  },
  {
    id: 5, username: "patient", password: "patient123",
    full_name: "Ahmed Ben Ali", name: "Ahmed Ben Ali",
    domains: [], role: "Patient",
    specialty: "", status: "approved", is_admin: false,
  },
];

export const DOMAINS = {
  chest: { 
    key: "chest", 
    label: "Radiologie Thoracique", 
    icon: "🫁", 
    color: "#2D5F9E", 
    bgColor: "rgba(45,95,158,0.08)", 
    description: "Classification de 10 pathologies pulmonaires", 
    model: "ResNet50 · 10 classes", 
    accuracy: "97.3%" 
  },
  brain: { 
    key: "brain", 
    label: "Neurologie", 
    icon: "🧠", 
    color: "#6B4FA0", 
    bgColor: "rgba(107,79,160,0.08)", 
    description: "Détection de tumeurs cérébrales par IRM", 
    model: "ResNet50 · Brain MRI", 
    accuracy: "96.2%" 
  },
  lung: { 
    key: "lung", 
    label: "Cancer Pulmonaire", 
    icon: "🔬", 
    color: "#D62828", 
    bgColor: "rgba(214,40,40,0.08)", 
    description: "Détection de lésions pulmonaires sur CT", 
    model: "ResNet50 · CT Scan", 
    accuracy: "94.8%" 
  },
};

// ── Helpers session ────────────────────────────────────────────────
function getToken() { 
  return localStorage.getItem("medai-token"); 
}

function saveSession(token, user) { 
  localStorage.setItem("medai-token", token); 
  localStorage.setItem("medai-user", JSON.stringify(user)); 
}

function clearSession() { 
  localStorage.removeItem("medai-token"); 
  localStorage.removeItem("medai-user"); 
}

function loadSavedUser() { 
  try { 
    const s = localStorage.getItem("medai-user"); 
    return s ? JSON.parse(s) : null; 
  } catch { 
    return null; 
  } 
}

async function isBackendOnline() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch("http://localhost:8000/health", { 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    return res.ok;
  } catch { 
    return false; 
  }
}

async function authFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Erreur ${res.status}`);
  }
  
  return res.json();
}

// ── Normaliser l'utilisateur ──────────────────────────────────────
function normalizeUser(u) {
  if (!u) return null;
  
  const name = u.full_name || u.name || u.username;
  let role = u.role || "Medecin";

  // Normalisation : si is_admin → Administrateur
  if (u.is_admin) {
    role = "Administrateur";
  }

  return { 
    ...u, 
    name, 
    full_name: name,
    role 
  };
}

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Important : true au démarrage
  const [mode, setMode] = useState(null);

  // ✅ Vérifier le token au montage
  useEffect(() => {
    const initAuth = async () => {
      console.log("🔐 AuthContext: Initializing...");
      
      const token = getToken();
      const savedUser = loadSavedUser();

      if (!token || !savedUser) {
        console.log("⚠️ No token or saved user");
        setLoading(false);
        return;
      }

      // Token local (mode offline)
      if (token === "local-token") {
        console.log("✅ Local mode active");
        const normalized = normalizeUser(savedUser);
        setUser(normalized);
        setMode("local");
        setLoading(false);
        return;
      }

      // Token backend : vérifier s'il est encore valide
      try {
        const online = await isBackendOnline();
        
        if (online) {
          console.log("🌐 Backend online - verifying token");
          const userData = await authFetch("/auth/me");
          const normalized = normalizeUser(userData);
          setUser(normalized);
          setMode("backend");
          console.log("✅ User restored:", normalized);
        } else {
          console.warn("⚠️ Backend offline - using cached user");
          const normalized = normalizeUser(savedUser);
          setUser(normalized);
          setMode("local");
        }
      } catch (error) {
        console.error("❌ Token verification failed:", error);
        clearSession();
        setUser(null);
        setMode(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    console.log("🔐 Attempting login:", username);
    setLoading(true);
    
    try {
      const online = await isBackendOnline();

      if (online) {
        console.log("🌐 Backend login");
        const form = new URLSearchParams({ username, password });
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Identifiants incorrects");
        }
        
        const { access_token, user: u } = await res.json();
        const normalized = normalizeUser(u);
        
        saveSession(access_token, normalized);
        setUser(normalized);
        setMode("backend");
        
        console.log("✅ Backend login successful:", normalized);
        return normalized;

      } else {
        console.warn("⚠️ Backend offline — local login");
        const found = LOCAL_USERS.find(
          u => u.username === username && u.password === password
        );
        
        if (!found) {
          throw new Error("Identifiants incorrects");
        }
        
        const { password: _, ...safeUser } = found;
        const normalized = normalizeUser(safeUser);
        
        saveSession("local-token", normalized);
        setUser(normalized);
        setMode("local");
        
        console.log("✅ Local login successful:", normalized);
        return normalized;
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    console.log("🚪 Logging out");
    clearSession();
    setUser(null);
    setMode(null);
  }, []);

  // ── Register ──────────────────────────────────────────────────
  const register = useCallback(async ({ 
    username, 
    password, 
    fullName, 
    domains, 
    specialty, 
    role = "Medecin" 
  }) => {
    console.log("📝 Registering user:", username, role);
    
    return authFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
        full_name: fullName,
        domains,
        specialty: specialty || "",
        role,
      }),
    });
  }, []);

  // ── Admin helpers ──────────────────────────────────────────────
  const getAllUsers = useCallback(async () => {
    const token = getToken();
    if (!token || token === "local-token") {
      return LOCAL_USERS.map(({ password: _, ...u }) => normalizeUser(u));
    }
    const users = await authFetch("/auth/users");
    return users.map(normalizeUser);
  }, []);

  const getPendingUsers = useCallback(async () => {
    const token = getToken();
    if (!token || token === "local-token") return [];
    const users = await authFetch("/auth/pending");
    return users.map(normalizeUser);
  }, []);

  const approveUser = useCallback((userId) =>
    authFetch("/auth/approve", { 
      method: "POST", 
      body: JSON.stringify({ user_id: userId, action: "approve" }) 
    }), 
  []);

  const rejectUser = useCallback((userId) =>
    authFetch("/auth/approve", { 
      method: "POST", 
      body: JSON.stringify({ user_id: userId, action: "reject" }) 
    }), 
  []);

  const deleteUser = useCallback((userId) =>
    authFetch(`/auth/users/${userId}`, { method: "DELETE" }), 
  []);

  // ── Données dérivées ───────────────────────────────────────────
  const userDomains = user?.domains?.map(key => DOMAINS[key]).filter(Boolean) || [];
  const currentDomain = userDomains.length === 1 ? userDomains[0] : null;
  const isAdmin = Boolean(user?.is_admin || user?.role === "Administrateur");
  const isPatient = user?.role === "Patient";
  const isDoctor = !isAdmin && !isPatient && !!user;

  console.log("🔐 AuthContext state:", { 
    user: user?.username, 
    role: user?.role,
    loading, 
    mode,
    isAdmin,
    isPatient,
    isDoctor
  });

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      mode,
      login,
      logout,
      register,
      getPendingUsers,
      getAllUsers,
      approveUser,
      rejectUser,
      deleteUser,
      currentDomain,
      userDomains,
      DOMAINS,
      isAdmin,
      isPatient,
      isDoctor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}