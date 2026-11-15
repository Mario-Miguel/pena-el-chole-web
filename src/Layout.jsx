import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import HamburgerMenu from "./components/HamburgerMenu";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import ChatBubble from "./components/chat/ChatBubble";
import NotasBubble from "./components/notas/NotasBubble";
import NotasButton from "./components/notas/NotasButton";
import NotifPushBanner from "./components/notifications/NotifPushBanner";
import NotificationBell from "./components/notifications/NotificationBell";
import { BottomNav } from "./components/layout/BottomNav";
import PageTitle from "./components/layout/PageTitle";
import Sidebar from "./components/layout/Sidebar";
import Breadcrumbs from "./components/layout/Breadcrumbs";
import GlobalSearch from "./components/layout/GlobalSearch";
import SocialButton from "./components/social/SocialButton";
import { api } from "@/api/client";
import ThemeToggle from "./components/layout/ThemeToggle";
import TourOverlay from "./components/tour/TourOverlay";
import { PanelLeft, CalendarDays, Compass, Eye } from "lucide-react";
import { TOUR_SECCIONES } from "./lib/tourData";

import { getPref } from "./lib/uiPrefs";
import { getStoredColor, getStoredNombre, syncAppConfigFromDB } from "./lib/appConfig";

// Cargar fuente Limelight
if (typeof document !== "undefined" && !document.getElementById("limelight-font")) {
  const link = document.createElement("link");
  link.id = "limelight-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Limelight&display=swap";
  document.head.appendChild(link);
}

const PUBLIC_PAGES = ["Acceso"];



function resolveUiPrefs() {
  return {
    showThemeToggle: getPref("pena_show_theme_toggle", true),
    showSearch:     getPref("pena_show_search", false),
    showNotifBell:  getPref("pena_show_notif_bell", true),
    showAvatar:     getPref("pena_show_avatar", true),
    showHamburger:  getPref("pena_show_hamburger", false),
    showInstagram:  getPref("pena_show_instagram", false),
    showTiktok:     getPref("pena_show_tiktok", false),
    showBreadcrumbs:getPref("pena_show_breadcrumbs", false),
    burbujaChat:    getPref("pena_burbuja_chat", false),
    burbujaNotas:   getPref("pena_burbuja_notas", false),
    showNotasHeader:getPref("pena_show_notas_header", false),
  };
}

function useUiPrefs() {
  const [prefs, setPrefs] = useState(resolveUiPrefs);

  useEffect(() => {
    const reload = () => setPrefs(resolveUiPrefs());
    window.addEventListener("uiPrefChanged", reload);
    // Compatibilidad con eventos anteriores
    window.addEventListener("pena_burbuja_chat_changed", reload);
    return () => {
      window.removeEventListener("uiPrefChanged", reload);
      window.removeEventListener("pena_burbuja_chat_changed", reload);
    };
  }, []);

  return prefs;
}

function AppContent({ children, currentPageName }) {
  const { sesion, loading } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("pena_sidebar_collapsed") === "true");
  const prefs = useUiPrefs();
  const [headerColor, setHeaderColor] = useState(getStoredColor);
  const [appNombre, setAppNombre] = useState(getStoredNombre);
  const [sidebarHidden, setSidebarHidden] = useState(() => localStorage.getItem("pena_sidebar_hidden") === "true");
  const [activeTour, setActiveTour] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onColor  = (e) => setHeaderColor(e.detail || getStoredColor());
    const onNombre = (e) => setAppNombre(e.detail || getStoredNombre());
    const onSidebar = () => setSidebarHidden(localStorage.getItem("pena_sidebar_hidden") === "true");
    const onStartTour = (e) => setActiveTour(e.detail);
    window.addEventListener("appColorChanged", onColor);
    window.addEventListener("appNombreChanged", onNombre);
    window.addEventListener("sidebarVisibilityChanged", onSidebar);
    window.addEventListener("startTour", onStartTour);
    // Sincronizar desde DB al montar
    syncAppConfigFromDB(api);
    return () => {
      window.removeEventListener("appColorChanged", onColor);
      window.removeEventListener("appNombreChanged", onNombre);
      window.removeEventListener("sidebarVisibilityChanged", onSidebar);
      window.removeEventListener("startTour", onStartTour);
    };
  }, []);

  // Recargar al volver a la pestaña inactiva >5min
  useEffect(() => {
    let hiddenAt = null;
    const onVisible = () => {
      if (document.visibilityState === "hidden") { hiddenAt = Date.now(); }
      else if (document.visibilityState === "visible" && hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000) { window.location.reload(); }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Push notifications
  useEffect(() => {
    if (!sesion || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const unsubTarea = api.entities.Tarea.subscribe(event => {
      if (event.type === "create" && event.data?.nombre)
        new Notification("📋 Nueva tarea en la peña", { body: event.data.nombre });
    });
    const unsubVotacion = api.entities.Votacion.subscribe(event => {
      if (event.type === "create" && event.data?.tema)
        new Notification("🗳️ Nueva votación", { body: event.data.tema });
    });
    const unsubActa = api.entities.ActaReunion.subscribe(event => {
      if (event.type === "create" && event.data?.fecha)
        new Notification("📋 Nueva acta de reunión", { body: `Reunión del ${event.data.fecha}` });
    });
    const unsubActividad = api.entities.Actividad.subscribe(event => {
      if (event.type === "create" && event.data?.titulo)
        new Notification("🎯 Nueva actividad", { body: event.data.titulo });
    });
    return () => { unsubTarea(); unsubVotacion(); unsubActa(); unsubActividad(); };
  }, [sesion]);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PAGES.includes(currentPageName);
    if (!sesion && !isPublic) { window.location.href = createPageUrl("Acceso"); }
    if (sesion && currentPageName === "Acceso") { window.location.href = createPageUrl("Inicio"); }
  }, [sesion, loading, currentPageName]);



  if (loading) return (
    <div className="min-h-screen bg-[#faf8f6] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  if (PUBLIC_PAGES.includes(currentPageName)) return <>{children}</>;
  if (!sesion) return null;

  const startContextualTour = () => {
    const pageTour = TOUR_SECCIONES.find(t => t.page === currentPageName);
    if (pageTour) {
      setActiveTour(pageTour);
    } else {
      navigate("/TourGuia");
    }
  };

  const toggleSidebarVisibility = () => {
    const next = !sidebarHidden;
    setSidebarHidden(next);
    localStorage.setItem("pena_sidebar_hidden", String(next));
    window.dispatchEvent(new Event("sidebarVisibilityChanged"));
  };

  const fechaStr = new Date().toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

  const getIniciales = (nombre) => nombre ? nombre.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?";
  const showBubble = currentPageName !== "Chat" && prefs.burbujaChat;
  const showNotasBubble = currentPageName !== "NotasPersonales" && prefs.burbujaNotas;

  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col">
      <header className="sticky top-0 z-40 shadow-lg" style={{ backgroundColor: headerColor }}>
        <div className="mx-auto px-3 max-w-7xl h-16 flex items-center justify-between gap-2" style={{ backgroundColor: headerColor }}>
          {/* Logo + título */}
          <Link to={createPageUrl("Inicio")} className="flex items-center gap-2 text-white">
            <img
              src="/logo.jpg"
              alt="logo"
              className="w-12 h-12 object-cover flex-shrink-0 rounded-lg shadow-md"
            />
            <div className="flex flex-col justify-center">
              <span style={{ fontFamily: "'Limelight', cursive", fontSize: "clamp(1.15rem, 5vw, 1.75rem)", letterSpacing: "0.05em", lineHeight: 1 }}>
                {appNombre}
              </span>
              <div className="flex items-center gap-1">
                <PageTitle />
              </div>
            </div>
          </Link>

          {/* Fecha central (solo escritorio) */}
          <div className="hidden lg:flex items-center gap-1.5 text-white/60 text-xs font-medium">
            <CalendarDays className="w-4 h-4" />
            <span className="capitalize">{fechaStr}</span>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-1">
            {/* Toggle barra lateral (solo escritorio) */}
            <button
              onClick={toggleSidebarVisibility}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              data-tour="sidebar-toggle"
              title={sidebarHidden ? "Mostrar barra lateral" : "Ocultar barra lateral"}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            {sesion?.soloLectura && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 text-white/90 text-[10px] font-bold uppercase tracking-wide">
                <Eye className="w-3 h-3" /> Solo lectura
              </span>
            )}
            {prefs.showThemeToggle && <ThemeToggle />}
            <button
              onClick={startContextualTour}
              data-tour="tour-button"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              title="Tour guiado de esta sección"
            >
              <Compass className="w-5 h-5" />
            </button>
            {prefs.showInstagram && <SocialButton red="instagram" />}
            {prefs.showTiktok    && <SocialButton red="tiktok" />}
            {prefs.showSearch    && <GlobalSearch />}
            {prefs.showNotasHeader && <NotasButton variant="header" />}
            {prefs.showNotifBell && <NotificationBell />}

            {/* Avatar (oculto en Inicio, ya que la página lo muestra) */}
            {prefs.showAvatar && currentPageName !== "Inicio" && (
              <Link to={createPageUrl("Perfil")} className="flex items-center group">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 bg-white/20 flex items-center justify-center hover:border-white/60 transition-colors shadow">
                  {sesion.avatarUrl
                    ? <img src={sesion.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-sm">{getIniciales(sesion.nombre)}</span>
                  }
                </div>
              </Link>
            )}

            {prefs.showHamburger && <HamburgerMenu />}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => {
            const next = !sidebarCollapsed;
            setSidebarCollapsed(next);
            localStorage.setItem("pena_sidebar_collapsed", String(next));
          }}
        />
        <div className="flex-1 flex flex-col min-w-0">
          {prefs.showBreadcrumbs && <Breadcrumbs />}
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {showBubble && <ChatBubble />}
      {showNotasBubble && <NotasBubble />}
      <BottomNav />
      <NotifPushBanner />
      {activeTour && (
        <TourOverlay
          tour={activeTour}
          onClose={() => setActiveTour(null)}
          onComplete={() => setActiveTour(null)}
        />
      )}
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <AuthProvider>
      <AppContent currentPageName={currentPageName}>
        {children}
      </AppContent>
    </AuthProvider>
  );
}