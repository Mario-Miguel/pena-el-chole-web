import React, { useState, useEffect } from "react";
import { GripVertical, Plus, X, Smartphone, Grid, Zap } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { buildNavOptions, BOTTOM_NAV_KEY, DEFAULT_NAV, getNavItems } from "./bottomNavOptions";
import { api } from "@/api/client";
import { getPref, setPref } from "../../lib/uiPrefs";

const LS_WIDGETS_ACTIVOS = "pena_widgets_activos_v2";
const LS_WIDGETS_ORDEN   = "pena_widgets_orden_v2";

function getWidgetsActivos() {
  try { const s = localStorage.getItem(LS_WIDGETS_ACTIVOS); if (s) return JSON.parse(s); } catch {}
  return [];
}

function setWidgetsActivos(arr) {
  localStorage.setItem(LS_WIDGETS_ACTIVOS, JSON.stringify(arr));
}

function setWidgetsOrden(arr) {
  localStorage.setItem(LS_WIDGETS_ORDEN, JSON.stringify(arr));
}

export default function BottomNavConfig() {
  const [active, setActive] = useState(() => getNavItems().map(i => i.key));
  const [navOptions, setNavOptions] = useState(() => buildNavOptions([]));
  const [showDrawer, setShowDrawer] = useState(() => getPref("pena_show_app_drawer", true));
  const [showAppsLabel, setShowAppsLabel] = useState(() => getPref("pena_show_apps_label", false));

  const toggleAppsLabel = (val) => {
    setShowAppsLabel(val);
    setPref("pena_show_apps_label", val);
    window.dispatchEvent(new Event("uiPrefChanged"));
  };

  const selectMode = (useDrawer) => {
    setShowDrawer(useDrawer);
    setPref("pena_show_app_drawer", useDrawer);
    window.dispatchEvent(new Event("uiPrefChanged"));
    // Sincronizar widget "accesos"
    const activos = getWidgetsActivos();
    if (useDrawer) {
      // Desactivar widget accesos
      const next = activos.filter(id => id !== "accesos");
      setWidgetsActivos(next);
    } else {
      // Activar widget accesos si no está
      if (!activos.includes("accesos")) {
        const next = ["accesos", ...activos];
        setWidgetsActivos(next);
        // Asegurar en el orden
        try {
          const ord = JSON.parse(localStorage.getItem(LS_WIDGETS_ORDEN) || "[]");
          if (!ord.includes("accesos")) ord.unshift("accesos");
          setWidgetsOrden(ord);
        } catch {}
      }
    }
  };

  useEffect(() => {
    api.entities.AppConfig.filter({ clave: "menu_desactivado" })
      .then(configs => {
        const disabled = configs[0]?.valor ? JSON.parse(configs[0].valor) : [];
        const opts = buildNavOptions(disabled);
        setNavOptions(opts);
        // Quitar activos que ya no existen o están desactivados
        const validKeys = opts.map(o => o.key);
        setActive(prev => prev.filter(k => validKeys.includes(k)));
      })
      .catch(() => {});
  }, []);

  const save = (newActive) => {
    setActive(newActive);
    localStorage.setItem(BOTTOM_NAV_KEY, JSON.stringify(newActive));
    window.dispatchEvent(new Event("bottomNavUpdated"));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const n = [...active];
    const [moved] = n.splice(result.source.index, 1);
    n.splice(result.destination.index, 0, moved);
    save(n);
  };

  const remove = (key) => {
    if (active.length <= 2) return;
    save(active.filter(k => k !== key));
  };

  const add = (key) => {
    if (active.length >= 6) return;
    save([...active, key]);
  };

  const available = navOptions.filter(o => !active.includes(o.key));
  const activeItems = active.map(k => navOptions.find(o => o.key === k)).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-5">
      <div className="flex items-center gap-3 mb-1">
        <Smartphone className="w-5 h-5 text-[#630027]" />
        <h2 className="text-[#630027] font-bold">Navegación inferior</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">Personaliza los accesos directos del menú inferior (mín. 2, máx. 6)</p>

      {/* Selector exclusivo: cajón vs accesos directos */}
      <div className="mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Acceso rápido a secciones</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => selectMode(true)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
              showDrawer ? "bg-[#630027]/10 border-[#630027]/40 text-[#630027]" : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <Grid className={`w-5 h-5 ${showDrawer ? "text-[#630027]" : "text-gray-300"}`} />
            Cajón de apps
            <span className="text-[10px] font-normal text-center leading-tight">
              {showDrawer ? "✓ Activado" : "Cuadrícula de todas las secciones"}
            </span>
            </button>
            <button
            onClick={() => selectMode(false)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
              !showDrawer ? "bg-[#630027]/10 border-[#630027]/40 text-[#630027]" : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <Zap className={`w-5 h-5 ${!showDrawer ? "text-[#630027]" : "text-gray-300"}`} />
            Accesos directos
            <span className="text-[10px] font-normal text-center leading-tight">
              {!showDrawer ? "✓ Activado" : "Widget en el dashboard de inicio"}
            </span>
          </button>
        </div>
      </div>

      {/* Opción: mostrar etiqueta "Apps" */}
      {showDrawer && (
        <div className="mb-5 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Mostrar etiqueta "Apps"</p>
            <p className="text-xs text-gray-400">Texto debajo del icono del cajón</p>
          </div>
          <button
            onClick={() => toggleAppsLabel(!showAppsLabel)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              showAppsLabel ? "bg-[#630027]" : "bg-gray-200"
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              showAppsLabel ? "translate-x-5" : "translate-x-0"
            }`} />
          </button>
        </div>
      )}

      {/* Botones activos con drag & drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="bottom-nav">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5 mb-4">
              {activeItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Draggable key={item.key} draggableId={item.key} index={idx}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${snapshot.isDragging ? "bg-[#630027]/5 shadow-md" : "bg-gray-50"}`}
                      >
                        <div {...prov.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <Icon className="w-4 h-4 text-[#630027] flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                        <button
                          onClick={() => remove(item.key)}
                          disabled={active.length <= 2}
                          className="p-1 rounded-lg hover:bg-red-50 disabled:opacity-20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Opciones para añadir */}
      {available.length > 0 && active.length < 6 && (
        <div>
          <p className="text-xs text-gray-400 font-semibold mb-2">Añadir acceso directo</p>
          <div className="flex flex-wrap gap-2">
            {available.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => add(item.key)}
                  className="flex items-center gap-1.5 bg-[#4B1924]/5 hover:bg-[#4B1924]/10 text-[#4B1924] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <Plus className="w-3 h-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => save(DEFAULT_NAV)}
        className="mt-4 text-xs text-gray-400 hover:text-[#4B1924] underline"
      >
        Restablecer por defecto
      </button>
    </div>
  );
}