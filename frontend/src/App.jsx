// App.jsx — Racine de l'application avec ThemeProvider
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Classification from "./pages/Classification";
import Pathologies from "./pages/Pathologies";
import "./styles/index.css";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="app-body">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/classification" element={<Classification />} />
              <Route path="/pathologies" element={<Pathologies />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}