import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";

const AuthContext = createContext(null);

// Usuario especial de administración; la contraseña la valida el backend
export const ADMIN_ID = "__admin__";

const SESION_KEY = "pena_sesion";

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);

  const guardarSesion = (s) => {
    setSesion(s);
    localStorage.setItem(SESION_KEY, JSON.stringify(s));
  };

  useEffect(() => {
    const saved = localStorage.getItem(SESION_KEY);
    if (saved && api.auth.isAuthenticated()) {
      try { setSesion(JSON.parse(saved)); } catch {}
    } else {
      localStorage.removeItem(SESION_KEY);
    }
    setLoading(false);
  }, []);

  // El backend valida usuario/contraseña y devuelve { token, sesion }
  const login = async (username, password) => {
    const s = await api.auth.login(username, password);
    guardarSesion(s);
    return s;
  };

  const logout = () => {
    api.auth.logout();
    setSesion(null);
    localStorage.removeItem(SESION_KEY);
  };

  // Vuelve a leer la sesión del backend (p. ej. tras cambiar el avatar)
  const refreshSesion = useCallback(async () => {
    const s = await api.auth.me();
    guardarSesion(s);
    return s;
  }, []);

  const puedeConfigurar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  return (
    <AuthContext.Provider value={{ sesion, loading, login, logout, refreshSesion, puedeConfigurar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
