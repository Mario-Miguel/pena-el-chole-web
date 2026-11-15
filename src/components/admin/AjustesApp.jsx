import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { registrarLog } from "../../lib/registrarLog";
import {
  applyAppColor, applyAppColorSec, applyAppNombre, applyLabels,
  getStoredColor, getStoredColorSec, getStoredNombre, getStoredLabels,
  COLOR_KEY, COLOR_SEC_KEY, NOMBRE_KEY, LABELS_KEY,
  DEFAULT_COLOR, DEFAULT_COLOR_SEC, DEFAULT_NOMBRE
} from "../../lib/appConfig";
import { ALL_PAGES } from "../../lib/menuConfig";

export default function AjustesApp() {
  const [colorPrimario, setColorPrimario] = useState(getStoredColor);
  const [colorSecundario, setColorSecundario] = useState(getStoredColorSec);
  const [nombreApp, setNombreApp]         = useState(getStoredNombre);
  const [labels, setLabels]               = useState(getStoredLabels);
  const [guardando, setGuardando]         = useState(false);
  const [guardado, setGuardado]           = useState(false);
  const [configs, setConfigs]             = useState([]);
  const [showLabels, setShowLabels]       = useState(false);

  useEffect(() => {
    api.entities.AppConfig.list().then(data => {
      setConfigs(data);
      const color    = data.find(c => c.clave === COLOR_KEY);
      const colorSec = data.find(c => c.clave === COLOR_SEC_KEY);
      const nombre   = data.find(c => c.clave === NOMBRE_KEY);
      const lbls     = data.find(c => c.clave === LABELS_KEY);
      if (color)    { setColorPrimario(color.valor); applyAppColor(color.valor); }
      if (colorSec) { setColorSecundario(colorSec.valor); applyAppColorSec(colorSec.valor); }
      if (nombre)   { setNombreApp(nombre.valor); applyAppNombre(nombre.valor); }
      if (lbls)     { try { const parsed = JSON.parse(lbls.valor); setLabels(parsed); applyLabels(parsed); } catch {} }
    });
  }, []);

  const handleColorChange = (hex) => {
    setColorPrimario(hex);
    applyAppColor(hex);
  };

  const handleColorSecChange = (hex) => {
    setColorSecundario(hex);
    applyAppColorSec(hex);
  };

  const handleNombreChange = (val) => {
    setNombreApp(val);
    applyAppNombre(val);
  };

  const handleLabelChange = (page, val) => {
    const updated = { ...labels, [page]: val };
    setLabels(updated);
    applyLabels(updated);
  };

  const upsert = async (clave, valor) => {
    const existing = configs.find(c => c.clave === clave);
    if (existing) {
      return api.entities.AppConfig.update(existing.id, { valor });
    } else {
      return api.entities.AppConfig.create({ clave, valor });
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    await Promise.all([
      upsert(COLOR_KEY, colorPrimario),
      upsert(COLOR_SEC_KEY, colorSecundario),
      upsert(NOMBRE_KEY, nombreApp),
      upsert(LABELS_KEY, JSON.stringify(labels)),
    ]);
    const data = await api.entities.AppConfig.list();
    setConfigs(data);
    setGuardando(false);
    setGuardado(true);
    await registrarLog({ accion: "editar", entidad: "AppConfig", descripcion: `Ajustes de la app actualizados (color, nombre, labels)` });
    setTimeout(() => setGuardado(false), 2500);
  };

  const handleRestablecer = () => {
    setColorPrimario(DEFAULT_COLOR);
    applyAppColor(DEFAULT_COLOR);
  };

  const handleRestablecerNombre = () => {
    setNombreApp(DEFAULT_NOMBRE);
    applyAppNombre(DEFAULT_NOMBRE);
  };

  const handleRestablecerLabels = () => {
    const reset = {};
    setLabels(reset);
    applyLabels(reset);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">Los cambios se aplican al instante para ti y se guardan para todos al pulsar "Guardar".</p>

      {/* Color primario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-bold text-gray-700">Color primario</p>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={colorPrimario}
            onChange={e => handleColorChange(e.target.value)}
            className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-gray-600">{colorPrimario}</p>
            <p className="text-xs text-gray-400">Color de la cabecera, botones y acentos</p>
          </div>
          <button onClick={handleRestablecer} className="text-xs text-gray-400 hover:text-red-500 underline flex-shrink-0">
            Restablecer
          </button>
        </div>
        {/* Previsualización */}
        <div className="flex gap-2 pt-1">
          {[colorPrimario, colorPrimario + "cc", colorPrimario + "66", colorPrimario + "22"].map((c, i) => (
            <div key={i} className="h-6 flex-1 rounded-lg" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Color secundario */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-bold text-gray-700">Color secundario / acento</p>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={colorSecundario}
            onChange={e => handleColorSecChange(e.target.value)}
            className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-gray-600">{colorSecundario}</p>
            <p className="text-xs text-gray-400">Color de acento secundario (badges, destacados)</p>
          </div>
          <button onClick={() => handleColorSecChange(DEFAULT_COLOR_SEC)} className="text-xs text-gray-400 hover:text-red-500 underline flex-shrink-0">
            Restablecer
          </button>
        </div>
        <div className="flex gap-2 pt-1">
          {[colorSecundario, colorSecundario + "cc", colorSecundario + "66", colorSecundario + "22"].map((c, i) => (
            <div key={i} className="h-6 flex-1 rounded-lg" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Nombre de la app */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Nombre de la aplicación</p>
          <button onClick={handleRestablecerNombre} className="text-xs text-gray-400 hover:text-red-500 underline">
            Restablecer
          </button>
        </div>
        <input
          type="text"
          value={nombreApp}
          onChange={e => handleNombreChange(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
          placeholder="Nombre de la peña"
          maxLength={40}
        />
        <p className="text-xs text-gray-400">Aparece en la cabecera de la app (cambio instantáneo)</p>
      </div>

      {/* Nombres de secciones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <button
          onClick={() => setShowLabels(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <p className="text-sm font-bold text-gray-700">Nombres de las secciones</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Personaliza los nombres del menú</span>
            {showLabels ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>

        {showLabels && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-end mb-2">
              <button onClick={handleRestablecerLabels} className="text-xs text-gray-400 hover:text-red-500 underline">
                Restablecer todos
              </button>
            </div>
            {ALL_PAGES.map(p => (
              <div key={p.page} className="flex items-center gap-3">
                <span className="w-6 text-center text-base flex-shrink-0">{p.emoji}</span>
                <span className="text-xs text-gray-400 w-24 flex-shrink-0 truncate">{p.label}</span>
                <input
                  type="text"
                  value={labels[p.page] ?? ""}
                  onChange={e => handleLabelChange(p.page, e.target.value)}
                  placeholder={p.label}
                  maxLength={30}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón guardar */}
      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-colors disabled:opacity-60"
        style={{ backgroundColor: colorPrimario }}
      >
        {guardando ? "Guardando…" : guardado ? "✓ Cambios guardados" : "Guardar cambios"}
      </button>
    </div>
  );
}