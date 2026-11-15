import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { buildNavOptions, getNavItems, BOTTOM_NAV_KEY } from "./bottomNavOptions";
import { api } from "@/api/client";
import AppDrawer from "./AppDrawer";
import { getPref } from "../../lib/uiPrefs";

function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    () => window.matchMedia("(orientation: landscape) and (max-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-width: 1024px)");
    const handler = (e) => setLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return landscape;
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [navItems, setNavItems] = useState(getNavItems);
  const [visible, setVisible] = useState(() => localStorage.getItem("pena_bottom_nav_hidden") !== "true");
  const [showDrawer, setShowDrawer] = useState(() => getPref("pena_show_app_drawer", true));
  const [showAppsLabel, setShowAppsLabel] = useState(() => getPref("pena_show_apps_label", false));
  const isLandscape = useIsLandscape();

  useEffect(() => {
    const handler = () => {
      setShowDrawer(getPref("pena_show_app_drawer", true));
      setShowAppsLabel(getPref("pena_show_apps_label", false));
    };
    window.addEventListener("uiPrefChanged", handler);
    return () => window.removeEventListener("uiPrefChanged", handler);
  }, []);

  const reloadItems = (disabled = []) => {
    const validKeys = buildNavOptions(disabled).map((o) => o.key);
    const items = getNavItems().filter((i) => validKeys.includes(i.key));
    setNavItems(items.length >= 2 ? items : buildNavOptions(disabled).slice(0, 5));
  };

  useEffect(() => {
    api.entities.AppConfig.filter({ clave: "menu_desactivado" }).
    then((configs) => {
      const disabled = configs[0]?.valor ? JSON.parse(configs[0].valor) : [];
      reloadItems(disabled);
    }).
    catch(() => reloadItems([]));
  }, []);

  useEffect(() => {
    const handler = () => reloadItems([]);
    const visHandler = () => setVisible(localStorage.getItem("pena_bottom_nav_hidden") !== "true");
    window.addEventListener("bottomNavUpdated", handler);
    window.addEventListener("bottomNavVisibilityChanged", visHandler);
    return () => {
      window.removeEventListener("bottomNavUpdated", handler);
      window.removeEventListener("bottomNavVisibilityChanged", visHandler);
    };
  }, []);

  if (!visible && !showDrawer) return null;

  // Modo apaisado: barra vertical a la izquierda
  if (isLandscape) {
    return (
      <nav
        className="fixed top-0 left-0 bottom-0 z-50 bg-white/95 backdrop-blur-md border-r border-[#E8E0DC] md:hidden flex flex-col items-center justify-around py-2"
        style={{ paddingLeft: "env(safe-area-inset-left, 0px)", width: 56 }}>
        
        {navItems.map(({ icon: Icon, label, path, key }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={key}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 px-1 py-1 relative w-12 min-h-[48px] justify-center">
              
              {isActive &&
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#630027]/10 rounded-xl"
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }} />

              }
              <Icon
                size={20}
                className={isActive ? "text-[#630027]" : "text-gray-400"}
                strokeWidth={isActive ? 2.5 : 1.8} />
              
              <span className={`text-[8px] font-medium leading-tight text-center ${isActive ? "text-[#630027]" : "text-gray-400"}`}>
                {label}
              </span>
            </motion.button>);

        })}
      </nav>);

  }

  // Modo cajón de apps: solo se muestra el botón del cajón centrado
  if (showDrawer) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E8E0DC] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-center px-1 py-2">
          <div className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[48px] min-h-[48px] justify-center">
            <AppDrawer openUp />
            {showAppsLabel && <span className="text-[10px] font-medium text-gray-400">Apps</span>}
          </div>
        </div>
      </nav>);
  }

  const mid = Math.floor(navItems.length / 2);
  const leftItems = navItems.slice(0, mid);
  const rightItems = navItems.slice(mid);
  const isSettingsActive = location.pathname === "/Ajustes";

  return (
    <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E8E0DC] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around px-1 py-2">
        {leftItems.map(({ icon: Icon, label, path, key }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={key}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 px-2 py-1 relative min-w-[48px] min-h-[48px] justify-center">
              {isActive &&
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#630027]/10 rounded-xl"
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }} />
              }
              <Icon size={22} className={isActive ? "text-[#630027]" : "text-gray-400"} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#630027]" : "text-gray-400"}`}>{label}</span>
            </motion.button>);
        })}

        {/* Ajustes — acceso directo fijo e inmutable en el centro */}
        <motion.button
          onClick={() => navigate("/Ajustes")}
          whileTap={{ scale: 0.85 }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 relative min-w-[48px] min-h-[48px] justify-center">
          {isSettingsActive &&
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-[#630027]/10 rounded-xl"
            transition={{ type: "spring", bounce: 0.3, duration: 0.4 }} />
          }
          <Settings size={22} className={isSettingsActive ? "text-[#630027]" : "text-gray-400"} strokeWidth={isSettingsActive ? 2.5 : 1.8} />
          <span className={`text-[10px] font-medium ${isSettingsActive ? "text-[#630027]" : "text-gray-400"}`}>Ajustes</span>
        </motion.button>

        {rightItems.map(({ icon: Icon, label, path, key }) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={key}
              onClick={() => navigate(path)}
              whileTap={{ scale: 0.85 }}
              className="flex flex-col items-center gap-0.5 px-2 py-1 relative min-w-[48px] min-h-[48px] justify-center">
              {isActive &&
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[#630027]/10 rounded-xl"
                transition={{ type: "spring", bounce: 0.3, duration: 0.4 }} />
              }
              <Icon size={22} className={isActive ? "text-[#630027]" : "text-gray-400"} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${isActive ? "text-[#630027]" : "text-gray-400"}`}>{label}</span>
            </motion.button>);
        })}
      </div>
    </nav>);

}