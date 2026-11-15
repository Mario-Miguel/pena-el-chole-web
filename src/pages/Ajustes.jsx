import React, { useState, useEffect } from "react";
import {
  Settings, Sun, Moon, GripVertical, Bell, BellOff,
  MessageSquarePlus, Send, MessageCircle, PanelLeft,
  Eye, EyeOff, Smartphone, Check
} from "lucide-react";
import HelpIcon from "../components/layout/HelpIcon";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import BottomNavConfig from "../components/layout/BottomNavConfig";
import { motion } from "framer-motion";
import { useAuth } from "../components/auth/AuthContext";
import { usePushNotifications } from "../components/notifications/usePushNotifications";
import { api } from "@/api/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ALL_PAGES, getSavedMenuOrder } from "../lib/menuConfig";
import { getSelectedApps, saveSelectedApps, LS_KEY as DRAWER_LS_KEY } from "../components/layout/AppDrawer";
import { UI_PREFS, getPref, setPref } from "../lib/uiPrefs";

const FIXED_FIRST   = ALL_PAGES.filter(p => p.fixedFirst);
const REORDERABLE   = ALL_PAGES.filter(p => !p.fixedFirst && !p.fixedLast);
const FIXED         = ALL_PAGES.filter(p => p.fixedLast);
const DEFAULT_REORDER = REORDERABLE.map(p => p.page);

// Agrupar UI_PREFS por grupo
const UI_GROUPS = UI_PREFS.reduce((acc, pref) => {
  if (!acc[pref.group]) acc[pref.group] = [];
  acc[pref.group].push(pref);
  return acc;
}, {});

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-[#630027]" : "bg-gray-200"}`}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
      />
    </button>
  );
}

function DrawerAppsConfig() {
  const [drawerSelected, setDrawerSelected] = useState(() => getSelectedApps());

  useEffect(() => {
    const onUpdate = () => setDrawerSelected(getSelectedApps());
    window.addEventListener("drawerAppsChanged", onUpdate);
    return () => window.removeEventListener("drawerAppsChanged", onUpdate);
  }, []);

  const toggle = (page) => {
    const next = drawerSelected.includes(page)
      ? drawerSelected.filter(p => p !== page)
      : [...drawerSelected, page];
    setDrawerSelected(next);
    saveSelectedApps(next);
  };

  const resetAll = () => {
    const all = ALL_PAGES.map(p => p.page);
    setDrawerSelected(all);
    saveSelectedApps(all);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[#630027] font-bold">Accesos directos del cajón</h2>
        <button onClick={resetAll} className="text-xs text-gray-400 hover:text-[#630027] underline">Activar todos</button>
      </div>
      <p className="text-xs text-gray-400 mb-4">Elige qué secciones aparecen en el cajón de aplicaciones.</p>
      <div className="space-y-1">
        {ALL_PAGES.map(page => {
          const on = drawerSelected.includes(page.page);
          return (
            <button
              key={page.page}
              onClick={() => toggle(page.page)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${on ? "bg-[#630027]/5" : "hover:bg-gray-50"}`}
            >
              <span className="text-base w-6 text-center">{page.emoji}</span>
              <span className={`flex-1 text-sm font-medium ${on ? "text-gray-700" : "text-gray-400"}`}>{page.label}</span>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${on ? "bg-[#630027] border-[#630027]" : "border-gray-200"}`}>
                {on && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Ajustes() {
  const { sesion } = useAuth();
  const { requestPermission, permission } = usePushNotifications();
  const [notifPermission, setNotifPermission] = useState(permission);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains("dark"));
  const [modoApaisado, setModoApaisado] = useState(() => {
    const saved = localStorage.getItem("pena_modo_apaisado");
    if (saved !== null) return saved === "true";
    // Por defecto: activado en tablet (≥768px), desactivado en móvil
    return window.screen.width >= 768 || window.screen.height >= 768;
  });
  const [feedback, setFeedback] = useState({ tipo: "sugerencia", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Estado unificado de UI prefs
  const initUiState = () => {
    const state = {};
    UI_PREFS.forEach(p => {
      const rawVal = getPref(p.key, p.default);
      // Si la clave es "invertida" (ej: pena_sidebar_hidden → true = oculto), invertimos para el toggle
      state[p.key] = p.invertedKey ? !rawVal : rawVal;
    });
    // Caso especial legacy: pena_burbuja_chat default false
    state["pena_burbuja_chat"] = localStorage.getItem("pena_burbuja_chat") === "true";
    return state;
  };

  const [uiState, setUiState] = useState(() => initUiState());

  const toggleUi = (key, invertedKey = false) => {
    const newVal = !uiState[key];
    const updates = { [key]: newVal };
    const toStore = invertedKey ? !newVal : newVal;
    setPref(key, toStore);

    // Sincronización: cajón de apps ↔ menú hamburguesa + barra inferior
    if (key === "pena_show_app_drawer") {
      if (newVal) {
        // Activar cajón → desactivar hamburguesa y barra de accesos rápidos
        updates["pena_show_hamburger"] = false;
        setPref("pena_show_hamburger", false);
        updates["pena_bottom_nav_hidden"] = false; // invertedKey: false = oculto
        setPref("pena_bottom_nav_hidden", true);
        window.dispatchEvent(new Event("bottomNavVisibilityChanged"));
      } else {
        // Desactivar cajón → activar hamburguesa y barra de accesos rápidos
        updates["pena_show_hamburger"] = true;
        setPref("pena_show_hamburger", true);
        updates["pena_bottom_nav_hidden"] = true; // invertedKey: true = visible
        setPref("pena_bottom_nav_hidden", false);
        window.dispatchEvent(new Event("bottomNavVisibilityChanged"));
      }
    }
    // Si se activa la hamburguesa → desactivar cajón
    if (key === "pena_show_hamburger" && newVal) {
      updates["pena_show_app_drawer"] = false;
      setPref("pena_show_app_drawer", false);
    }

    setUiState(prev => ({ ...prev, ...updates }));
    window.dispatchEvent(new Event("uiPrefChanged"));
    if (key === "pena_burbuja_chat") window.dispatchEvent(new Event("pena_burbuja_chat_changed"));
    if (key === "pena_sidebar_hidden") window.dispatchEvent(new Event("sidebarVisibilityChanged"));
    if (key === "pena_bottom_nav_hidden") window.dispatchEvent(new Event("bottomNavVisibilityChanged"));
  };

  // Orden del menú
  const [menuOrder, setMenuOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("pena_menu_order");
      if (saved) {
        const parsed = JSON.parse(saved);
        const reord = parsed.filter((p) => REORDERABLE.find((i) => i.page === p));
        REORDERABLE.forEach((i) => { if (!reord.includes(i.page)) reord.push(i.page); });
        return reord;
      }
    } catch {}
    return DEFAULT_REORDER;
  });

  const toggleApaisado = () => {
    const newVal = !modoApaisado;
    setModoApaisado(newVal);
    localStorage.setItem("pena_modo_apaisado", String(newVal));
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
      vp.content = newVal
        ? "width=device-width, initial-scale=1.0, viewport-fit=cover"
        : "width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover";
    }
  };

  const toggleDark = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    if (newVal) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    localStorage.setItem("pena_dark_mode", String(newVal));
  };

  useEffect(() => {
    const saved = localStorage.getItem("pena_dark_mode") === "true";
    setDarkMode(saved);
    if (saved) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const handleEnviarFeedback = async () => {
    if (!feedback.mensaje.trim()) return;
    setEnviando(true);
    await api.entities.FeedbackApp.create({
      tipo: feedback.tipo,
      mensaje: feedback.mensaje.trim(),
      autor_nombre: sesion?.nombre || "Anónimo",
      leido: false,
    });
    setFeedback({ tipo: "sugerencia", mensaje: "" });
    setEnviado(true);
    setTimeout(() => setEnviado(false), 3000);
    setEnviando(false);
  };

  const saveOrder = (order) => {
    setMenuOrder(order);
    localStorage.setItem("pena_menu_order", JSON.stringify([
      ...FIXED_FIRST.map(i => i.page),
      ...order,
      ...FIXED.map(i => i.page),
    ]));
  };

  const orderedItems = menuOrder.map(page => REORDERABLE.find(i => i.page === page)).filter(Boolean);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = [...menuOrder];
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    saveOrder(newOrder);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#4B1924]/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-[#4B1924]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#630027] text-3xl font-black">Ajustes</h1>
            <HelpIcon section="ajustes" />
          </div>
          <p className="text-gray-400 text-sm">Personaliza la app</p>
        </div>
      </div>

      {/* ── Tema ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="text-[#630027] mb-4 font-bold">Tema</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            <div>
              <p className="text-sm font-semibold text-gray-700">{darkMode ? "Modo oscuro" : "Modo claro"}</p>
              <p className="text-xs text-gray-400">Cambia el tema de la app</p>
            </div>
          </div>
          <Toggle value={darkMode} onChange={toggleDark} />
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Modo apaisado</p>
              <p className="text-xs text-gray-400">Permite girar la pantalla en móvil y tablet</p>
            </div>
          </div>
          <Toggle value={modoApaisado} onChange={toggleApaisado} />
        </div>
      </div>

      {/* ── Elementos de la interfaz ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="text-[#630027] mb-1 font-bold flex items-center gap-2">
          <Eye className="w-5 h-5" /> Elementos de la interfaz
        </h2>
        <p className="text-xs text-gray-400 mb-5">Activa o desactiva cada elemento de la app. Los cambios son inmediatos.</p>

        {Object.entries(UI_GROUPS).map(([groupName, items], gi) => (
          <div key={groupName} className={gi > 0 ? "mt-5 pt-5 border-t border-gray-50" : ""}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{groupName}</p>
            <div className="space-y-3">
              {items.map(pref => {
                const isOn = !!uiState[pref.key];
                return (
                  <div key={pref.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isOn
                        ? <Eye className="w-4 h-4 text-[#630027]" />
                        : <EyeOff className="w-4 h-4 text-gray-300" />
                      }
                      <p className={`text-sm font-medium ${isOn ? "text-gray-700" : "text-gray-400"}`}>{pref.label}</p>
                    </div>
                    <Toggle value={isOn} onChange={() => toggleUi(pref.key, pref.invertedKey)} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Cajón de apps: accesos directos ───────────────────── */}
      <DrawerAppsConfig />

      {/* ── Tamaño del cajón de apps ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="text-[#630027] mb-1 font-bold">Tamaño icono del cajón</h2>
        <p className="text-xs text-gray-400 mb-4">Elige el tamaño del icono del cajón de aplicaciones.</p>
        <div className="flex gap-2">
          {[
            { key: "sm", label: "S", px: 26 },
            { key: "md", label: "M", px: 34 },
            { key: "lg", label: "L", px: 44 },
            { key: "xl", label: "XL", px: 54 },
          ].map(({ key, label, px }) => {
            const active = (localStorage.getItem("pena_drawer_icon_size") || "xl") === key;
            return (
              <button
                key={key}
                onClick={() => {
                  localStorage.setItem("pena_drawer_icon_size", key);
                  window.dispatchEvent(new Event("drawerIconSizeChanged"));
                  // forzar re-render del botón
                  const el = document.activeElement;
                  if (el) el.blur();
                }}
                className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-xl border-2 transition-colors ${
                  active ? "border-[#630027] bg-[#630027]/5" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <svg width={px} height={px} viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
                  <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
                  <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
                  <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity="0.7"/>
                </svg>
                <span className={`text-xs font-bold ${active ? "text-[#630027]" : "text-gray-400"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notificaciones ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="text-[#630027] mb-4 font-bold">Notificaciones y permisos</h2>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {notifPermission === "granted"
              ? <Bell className="w-5 h-5 text-[#630027]" />
              : <BellOff className="w-5 h-5 text-gray-400" />}
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {notifPermission === "granted" ? "Notificaciones activadas" : notifPermission === "denied" ? "Bloqueadas por el sistema" : "Notificaciones desactivadas"}
              </p>
              <p className="text-xs text-gray-400">
                {notifPermission === "denied"
                  ? "Bloqueadas — actívalas desde el navegador"
                  : notifPermission === "granted"
                  ? "Recibirás alertas de mensajes y avisos"
                  : "Toca el botón para activarlas"}
              </p>
            </div>
          </div>
          {notifPermission === "default" && (
            <button
              onClick={async () => { const r = await requestPermission(); setNotifPermission(r); }}
              className="bg-[#630027] hover:bg-[#4a001d] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Activar
            </button>
          )}
          {notifPermission === "granted" && (
            <button
              onClick={() => alert("Para desactivar las notificaciones, ve a:\n• Chrome: 🔒 en la barra de URL → Permisos → Notificaciones\n• Safari: Ajustes → Notificaciones → Esta página\n• Firefox: Menú → Permisos → Notificaciones")}
              className="bg-green-100 text-green-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-green-200 transition-colors"
            >
              ✓ Activadas
            </button>
          )}
          {notifPermission === "denied" && (
            <button
              onClick={() => alert("Para desbloquear las notificaciones, ve a la configuración de tu navegador:\n• Chrome: 🔒 en la barra de URL → Permisos de sitio → Notificaciones\n• Safari: Preferencias → Sitios web → Notificaciones\n• Firefox: Menú ☰ → Permisos → Notificaciones")}
              className="bg-red-100 text-red-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-red-200 transition-colors"
            >
              Cómo activar
            </button>
          )}
        </div>

        <div className="border-t border-gray-50 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Permisos del navegador</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Los permisos de notificación se gestionan desde la configuración del navegador. Toca el icono 🔒 en la barra de URL para ver y cambiar los permisos de esta página.
          </p>
        </div>
      </div>

      {/* ── Orden del menú ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h2 className="text-[#630027] mb-1 font-bold">Orden del menú</h2>
        <p className="text-xs text-gray-400 mb-4">Arrastra para reordenar · Inicio, Votaciones, Perfil y Ajustes tienen posición fija</p>

        <div className="space-y-1.5 mb-1.5">
          {FIXED_FIRST.map(item => (
            <div key={item.page} className="flex items-center gap-3 bg-[#4B1924]/5 rounded-xl px-3 py-2.5 opacity-60">
              <GripVertical className="w-4 h-4 text-gray-200 flex-shrink-0" />
              <span className="text-base">{item.emoji}</span>
              <span className="flex-1 text-sm font-medium text-gray-500">{item.label}</span>
              <span className="text-xs text-gray-400">fijo</span>
            </div>
          ))}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="menu-order">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                {orderedItems.map((item, idx) => (
                  <Draggable key={item.page} draggableId={item.page} index={idx}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${snapshot.isDragging ? "bg-[#630027]/5 shadow-lg" : "bg-gray-50"}`}
                      >
                        <div {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-base">{item.emoji}</span>
                        <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="space-y-1.5 mt-1.5">
          {FIXED.map(item => (
            <div key={item.page} className="flex items-center gap-3 bg-[#4B1924]/5 rounded-xl px-3 py-2.5 opacity-60">
              <GripVertical className="w-4 h-4 text-gray-200 flex-shrink-0" />
              <span className="text-base">{item.emoji}</span>
              <span className="flex-1 text-sm font-medium text-gray-500">{item.label}</span>
              <span className="text-xs text-gray-400">fijo</span>
            </div>
          ))}
        </div>

        <button onClick={() => saveOrder(DEFAULT_REORDER)} className="mt-4 text-xs text-gray-400 hover:text-[#4B1924] underline">
          Restablecer orden por defecto
        </button>
      </div>

      {/* ── Navegación inferior ────────────────────────────────── */}
      <BottomNavConfig />

      {/* ── Feedback ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-5">
        <h2 className="text-[#630027] mb-1 font-bold flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5" /> Enviar feedback
        </h2>
        <p className="text-xs text-gray-400 mb-4">Errores, sugerencias o ideas para mejorar la app. Solo lo ve el administrador.</p>
        <div className="space-y-3">
          <Select value={feedback.tipo} onValueChange={v => setFeedback(f => ({ ...f, tipo: v }))}>
            <SelectTrigger className="rounded-xl border-gray-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">🐛 Error / Bug</SelectItem>
              <SelectItem value="sugerencia">💡 Sugerencia</SelectItem>
              <SelectItem value="mejora">🚀 Mejora</SelectItem>
              <SelectItem value="otro">📝 Otro</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Describe el error o tu sugerencia..."
            className="rounded-xl border-gray-200 resize-none text-sm"
            rows={4}
            value={feedback.mensaje}
            onChange={e => setFeedback(f => ({ ...f, mensaje: e.target.value }))}
          />
          <button
            onClick={handleEnviarFeedback}
            disabled={!feedback.mensaje.trim() || enviando}
            className="w-full bg-[#630027] hover:bg-[#4a001d] disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2"
          >
            {enviado ? "✓ Enviado" : enviando ? "Enviando..." : <><Send className="w-4 h-4" /> Enviar</>}
          </button>
        </div>
      </div>
    </div>
  );
}