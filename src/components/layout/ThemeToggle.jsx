import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Botón de toggle modo claro/oscuro.
 * @param {string} variant - "header" (icono blanco sobre fondo de color) | "sidebar" (icono gris sobre blanco)
 */
export default function ThemeToggle({ variant = "header" }) {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const handler = () => setDark(document.documentElement.classList.contains("dark"));
    window.addEventListener("themeChanged", handler);
    return () => window.removeEventListener("themeChanged", handler);
  }, []);

  const toggle = () => {
    const newVal = !dark;
    setDark(newVal);
    if (newVal) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    localStorage.setItem("pena_dark_mode", String(newVal));
    window.dispatchEvent(new Event("themeChanged"));
  };

  const base = "flex items-center justify-center rounded-xl transition-colors flex-shrink-0";
  const cls =
    variant === "header"
      ? "w-9 h-9 text-white/80 hover:text-white hover:bg-white/15"
      : "w-9 h-9 text-gray-500 hover:text-[#630027] hover:bg-[#630027]/5";

  return (
    <button
      onClick={toggle}
      className={`${base} ${cls}`}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      data-tour="theme-toggle"
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}