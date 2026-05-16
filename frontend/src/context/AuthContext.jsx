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
    id: 4, username: "dr.seddik", password: "retina123",
    full_name: "Dr. Seddik", name: "Dr. Seddik",
    domains: ["retina"], role: "Medecin", specialty: "Ophtalmologie & Rétinopathie",
    status: "approved", is_admin: false,
  },
  {
    id: 5, username: "admin", password: "admin123",
    full_name: "Administrateur", name: "Administrateur",
    domains: ["chest", "lung", "brain", "retina"], role: "Administrateur",
    specialty: "Accès complet", status: "approved", is_admin: true,
  },
  {
    id: 6, username: "patient", password: "patient123",
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
  retina: {
    key: "retina",
    label: "Rétinopathie Diabétique",
    icon: "👁️",
    color: "#0E7490",
    bgColor: "rgba(14,116,144,0.08)",
    description: "Classification de 5 stades de rétinopathie diabétique (APTOS 2019)",
    model: "EfficientNet-B4 · 5 classes",
    accuracy: "92.1%"
  },
};

// ── Helpers session ────────────────────────────────────────────────
function getToken() {
  try {
    return localStorage.getItem("medai-token");
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  try {
    localStorage.setItem("medai-token", token);
    localStorage.setItem("medai-user", JSON.stringify(user));
    console.log("💾 Session sauvegardée:", user.username);
  } catch (e) {
    console.error("❌ Erreur sauvegarde session:", e);
  }
}

function clearSession() {
  try {
    localStorage.removeItem("medai-token");
    localStorage.removeItem("medai-user");
    console.log("🗑️ Session effacée");
  } catch (e) {
    console.error("❌ Erreur suppression session:", e);
  }
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
    console.log("🔍 Vérification connexion backend...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Augmenté à 3s
    const res = await fetch("http://localhost:8000/health", {
      signal: controller.signal,
      cache: "no-cache"
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      console.log("✅ Backend connecté");
      return true;
    }
    
    console.warn("⚠️ Backend répond mais avec erreur:", res.status);
    return false;
  } catch (e) {
    console.warn("⚠️ Backend offline:", e.message);
    return false;
  }
}

async function authFetch(path, options = {}) {
  const token = getToken();
  
  try {
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
  } catch (error) {
    console.error(`❌ Erreur API ${path}:`, error);
    throw error;
  }
}

// ── Normaliser l'utilisateur ──────────────────────────────────────
function normalizeUser(u) {
  if (!u) return null;

  const name = u.full_name || u.name || u.username || "Utilisateur";
  let role = u.role || "Medecin";

  if (u.is_admin) {
    role = "Administrateur";
  }

  return {
    ...u,
    name,
    full_name: name,
    role,
    id: u.id || Date.now(), // Fallback ID
  };
}

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // 'backend' | 'local' | null
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  // Initialisation
  useEffect(() => {
    const initAuth = async () => {
      console.log("🔐 AuthContext: Initialisation...");

      const token = getToken();
      const savedUser = loadSavedUser();

      // Vérifier le statut du backend
      const online = await isBackendOnline();
      setBackendStatus(online ? 'online' : 'offline');

      // Pas de session sauvegardée
      if (!token || !savedUser) {
        console.log("ℹ️ Aucune session sauvegardée");
        setLoading(false);
        return;
      }

      // Mode local explicite
      if (token === "local-token") {
        console.log("✅ Mode local actif");
        const normalized = normalizeUser(savedUser);
        setUser(normalized);
        setMode("local");
        setLoading(false);
        return;
      }

      // Tentative de connexion backend
      if (online) {
        console.log("🌐 Backend online - vérification token...");
        try {
          const userData = await authFetch("/auth/me");
          const normalized = normalizeUser(userData);
          setUser(normalized);
          setMode("backend");
          console.log("✅ Session backend restaurée:", normalized.username);
        } catch (error) {
          console.warn("⚠️ Token invalide ou expiré:", error.message);
          
          // Utiliser la sauvegarde locale si dispo
          if (savedUser) {
            console.log("📦 Utilisation du cache local");
            const normalized = normalizeUser(savedUser);
            setUser(normalized);
            setMode("local");
            
            // Mettre à jour le token pour éviter les erreurs futures
            saveSession("local-token", normalized);
          } else {
            clearSession();
            setUser(null);
            setMode(null);
          }
        }
      } else {
        // Backend offline — utiliser les données locales
        console.warn("⚠️ Backend offline — utilisation du cache local");
        const normalized = normalizeUser(savedUser);
        setUser(normalized);
        setMode("local");
      }

      setLoading(false);
    };

    initAuth();

    // Surveillance périodique du backend
    const interval = setInterval(async () => {
      const online = await isBackendOnline();
      setBackendStatus(online ? 'online' : 'offline');
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    console.log("🔐 Tentative de connexion:", username);
    setLoading(true);

    try {
      // Vérifier d'abord si le backend est en ligne
      const online = await isBackendOnline();
      setBackendStatus(online ? 'online' : 'offline');

      if (online) {
        console.log("🌐 Connexion via backend...");
        try {
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

          const { access_token, user: userData } = await res.json();
          const normalized = normalizeUser(userData);

          saveSession(access_token, normalized);
          setUser(normalized);
          setMode("backend");

          console.log("✅ Connexion backend réussie:", normalized.username);
          return normalized;
        } catch (apiError) {
          console.warn("⚠️ Échec connexion backend:", apiError.message);
          
          // Si le backend est en ligne mais que la connexion échoue
          // Essayer de trouver l'utilisateur en local quand même
          const found = LOCAL_USERS.find(
            u => u.username === username && u.password === password
          );
          
          if (found) {
            console.log("📦 Fallback local après échec API");
            const { password: _, ...safeUser } = found;
            const normalized = normalizeUser(safeUser);
            
            saveSession("local-token", normalized);
            setUser(normalized);
            setMode("local");
            
            return normalized;
          }
          
          // Si vraiment pas trouvé, relancer l'erreur
          throw apiError;
        }
      } else {
        // Mode complètement offline
        console.warn("⚠️ Backend offline — connexion locale");
        const found = LOCAL_USERS.find(
          u => u.username === username && u.password === password
        );

        if (!found) {
          throw new Error(
            "Identifiants incorrects. Vérifiez vos identifiants ou démarrez le serveur backend.\n\n" +
            "Pour démarrer le backend:\n" +
            "cd backend && uvicorn main:app --port 8000 --reload"
          );
        }

        const { password: _, ...safeUser } = found;
        const normalized = normalizeUser(safeUser);

        saveSession("local-token", normalized);
        setUser(normalized);
        setMode("local");

        console.log("✅ Connexion locale réussie:", normalized.username);
        return normalized;
      }
    } catch (error) {
      console.error("❌ Échec connexion:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    console.log("🚪 Déconnexion");
    clearSession();
    setUser(null);
    setMode(null);
  }, []);

  // ── Register ──────────────────────────────────────────────────
 // Dans AuthContext.jsx - modifiez la fonction register

const register = useCallback(async ({
  username,
  email,      // <-- AJOUTEZ email ici
  password,
  fullName,
  domains,
  specialty,
  role = "Medecin"
}) => {
  console.log("📝 Inscription:", username, email, role);
  
  const online = await isBackendOnline();
  
  if (!online) {
    throw new Error(
      "Le serveur backend n'est pas accessible. " +
      "Veuillez démarrer le serveur avec:\n" +
      "uvicorn main:app --port 8000 --reload"
    );
  }

  return authFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      email,      // <-- AJOUTEZ email ici
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

  // Dans AuthContext.jsx
// Dans AuthContext.jsx - remplacez getPendingUsers par :
const getPendingUsers = useCallback(async () => {
  const token = getToken();
  if (!token || token === "local-token") return [];
  
  try {
    const response = await fetch(`${API_BASE}/auth/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erreur API /pending:", response.status, errorData);
      return [];
    }
    
    const users = await response.json();
    console.log("✅ Pending users reçus:", users.length, users);
    return users.map(normalizeUser);
  } catch (error) {
    console.error("❌ Erreur getPendingUsers:", error);
    return [];
  }
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
    backendStatus,
    isAdmin,
    isPatient,
    isDoctor
  });

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      mode,
      backendStatus,
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