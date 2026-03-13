// AuthContext.jsx — Gestion authentification avec comptes dynamiques
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

// Comptes hardcodés de base
const BASE_USERS = [
  { id: 1, username: "dr.martin",  password: "chest123",  name: "Dr. Martin",     domains: ["chest"],                role: "Radiologue",     specialty: "Radiologie thoracique" },
  { id: 2, username: "dr.lambert", password: "neuro123",  name: "Dr. Lambert",    domains: ["brain"],                role: "Neurologue",     specialty: "Neurologie & IRM" },
  { id: 3, username: "dr.benali",  password: "lung123",   name: "Dr. Benali",     domains: ["lung"],                 role: "Pneumologue",    specialty: "Oncologie pulmonaire" },
  { id: 4, username: "admin",      password: "admin123",  name: "Administrateur", domains: ["chest","lung","brain"], role: "Administrateur", specialty: "Accès complet" },
];

export const USERS = BASE_USERS;

export const DOMAINS = {
  chest: { key: "chest", label: "Radiologie Thoracique", icon: "🫁", color: "#2D5F9E", bgColor: "rgba(45,95,158,0.08)", description: "Classification de 10 pathologies pulmonaires", model: "ResNet50 · 10 classes", accuracy: "97.3%" },
  brain: { key: "brain", label: "Neurologie",            icon: "🧠", color: "#6B4FA0", bgColor: "rgba(107,79,160,0.08)", description: "Détection de tumeurs cérébrales par IRM",    model: "ResNet50 · Brain MRI",  accuracy: "96.2%" },
  lung:  { key: "lung",  label: "Cancer Pulmonaire",     icon: "🔬", color: "#D62828", bgColor: "rgba(214,40,40,0.08)", description: "Détection de lésions pulmonaires sur CT",     model: "ResNet50 · CT Scan",    accuracy: "94.8%" },
};

// Charger les comptes approuvés depuis localStorage
function loadAllUsers() {
  try {
    const approved = JSON.parse(localStorage.getItem("chestai-approved") || "[]");
    const approvedUsers = approved
      .filter(r => r.status === "approved")
      .map(r => ({
        id:       parseInt(r.id) || Date.now(),
        username: r.username,
        password: r.password,
        name:     r.fullName,
        domains:  r.domains,
        role:     "Médecin",
        specialty: r.domains.map(k => DOMAINS[k]?.label).filter(Boolean).join(" · "),
      }));
    return [...BASE_USERS, ...approvedUsers];
  } catch { return BASE_USERS; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("chestai-user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [dynamicUsers, setDynamicUsers] = useState(() => loadAllUsers());

  const login = (username, password) => {
    const allUsers = loadAllUsers(); // Recharger à chaque login
    const found = allUsers.find(u => u.username === username && u.password === password);
    if (!found) throw new Error("Identifiants incorrects");
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    try { localStorage.setItem("chestai-user", JSON.stringify(safeUser)); } catch {}
    return safeUser;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem("chestai-user"); } catch {}
  };

  // Approuver un utilisateur depuis AdminPage
  const approveUser = (req) => {
    setDynamicUsers(prev => [...prev, {
      id:       parseInt(req.id) || Date.now(),
      username: req.username,
      password: req.password,
      name:     req.fullName,
      domains:  req.domains,
      role:     "Médecin",
      specialty: req.domains.map(k => DOMAINS[k]?.label).filter(Boolean).join(" · "),
    }]);
  };

  const userDomains = user?.domains?.map(key => DOMAINS[key]).filter(Boolean) || [];
  const currentDomain = userDomains.length === 1 ? userDomains[0] : null;
  const isAdmin = user?.username === "admin" || user?.domains?.length === 3;

  return (
    <AuthContext.Provider value={{ user, login, logout, approveUser, currentDomain, userDomains, DOMAINS, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}