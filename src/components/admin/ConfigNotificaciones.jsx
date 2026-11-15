import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Bell, Mail, Smartphone } from "lucide-react";

const CONFIG_KEY = "config_notificaciones";

const OPCIONES = [
  { key: "correo", label: "Notificaciones por correo", icon: Mail },
  { key: "sms",    label: "Notificaciones por SMS",    icon: Smartphone },
  { key: "push",   label: "Notificaciones push",       icon: Bell },
];

const DEFAULT_CONFIG = { correo: true, sms: false, push: true };

export default function ConfigNotificaciones() {
  const [config, setConfig]     = useState(DEFAULT_CONFIG);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.entities.AppConfig.filter({ clave: CONFIG_KEY }).then(data => {
      if (data.length > 0) {
        setConfigId(data[0].id);
        try { setConfig(JSON.parse(data[0].valor)); } catch {}
      }
      setLoading(false);
    });
  }, []);

  const handleToggle = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    setGuardado(false);
  };

  const handleGuardar = async () => {
    setGuardando(true);
    const valor = JSON.stringify(config);
    if (configId) {
      await api.entities.AppConfig.update(configId, { valor });
    } else {
      const created = await api.entities.AppConfig.create({ clave: CONFIG_KEY, valor });
      setConfigId(created.id);
    }
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-7 h-7 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">Configura qué canales de notificación estarán activos para la app.</p>
      {OPCIONES.map(({ key, label, icon: Icon }) => (
        <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config[key] ? "bg-[#630027]/10" : "bg-gray-100"}`}>
            <Icon className={`w-5 h-5 ${config[key] ? "text-[#630027]" : "text-gray-300"}`} />
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
          <button
            onClick={() => handleToggle(key)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config[key] ? "bg-[#630027]" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config[key] ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleGuardar} disabled={guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl">
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Button>
        {guardado && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </div>
  );
}