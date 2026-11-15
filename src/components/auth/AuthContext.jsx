import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export const ADMIN_ID = "__admin__";
export const ADMIN_PASSWORD = "Adminadmin3366";

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("pena_sesion");
      if (saved) {
        try { setSesion(JSON.parse(saved)); } catch {}
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    if (username === ADMIN_ID) {
      if (password !== ADMIN_PASSWORD) throw new Error("Contraseña incorrecta");
      const s = { integranteId: ADMIN_ID, nombre: "Admin", cargo: null, avatarUrl: null, esAdmin: true };
      setSesion(s);
      localStorage.setItem("pena_sesion", JSON.stringify(s));
      return s;
    }
    const sesiones = await base44.entities.SesionUsuario.list();
    const sesionDB = sesiones.find(s => s.usuario && s.usuario.toLowerCase() === String(username).toLowerCase());
    if (!sesionDB) throw new Error("Usuario no encontrado");
    if (sesionDB.disabled) throw new Error("Usuario desactivado");
    if (sesionDB.contrasena !== password) throw new Error("Contraseña incorrecta");

    const ints = await base44.entities.Integrante.filter({ id: sesionDB.integrante_id });
    const integrante = ints[0] || { nombre: "Desconocido" };

    const s = {
      integranteId: sesionDB.integrante_id,
      nombre: integrante.nombre,
      cargo: integrante.cargo,
      avatarUrl: sesionDB.avatar_url || null,
      esAdmin: false,
    };
    setSesion(s);
    localStorage.setItem("pena_sesion", JSON.stringify(s));
    return s;
  };

  const logout = () => {
    setSesion(null);
    localStorage.removeItem("pena_sesion");
  };

  const puedeConfigurar = sesion?.esAdmin || sesion?.cargo === "presidente" || sesion?.cargo === "vicepresidente";

  return (
    <AuthContext.Provider value={{ sesion, loading, login, logout, puedeConfigurar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
