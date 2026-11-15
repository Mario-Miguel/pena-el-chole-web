import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Plus, Trash2, Sparkles, ToggleLeft, ToggleRight, RefreshCw, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LOGROS_POR_DEFECTO, CATEGORIAS_LOGRO, computarGamificacion } from "@/lib/gamificaciones";
import { registrarLog } from "@/lib/registrarLog";

const GAMIF_KEY = "gamificaciones_activadas";

export default function GamificacionesPanel({ sesion }) {
  const [activada, setActivada] = useState(false);
  const [logros, setLogros] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editLogro, setEditLogro] = useState(null);
  const [computando, setComputando] = useState(false);

  const cargar = useCallback(async () => {
    const [cfg, lg, ints] = await Promise.all([
      api.entities.AppConfig.filter({ clave: GAMIF_KEY }),
      api.entities.Logro.list(),
      api.entities.Integrante.list(),
    ]);
    setActivada(cfg[0]?.valor === "true");
    setLogros(lg.sort((a, b) => (a.categoria || "").localeCompare(b.categoria || "")));
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleActivacion = async () => {
    const nuevo = !activada;
    setGuardando(true);
    const existing = await api.entities.AppConfig.filter({ clave: GAMIF_KEY });
    if (existing.length > 0) {
      await api.entities.AppConfig.update(existing[0].id, { valor: String(nuevo) });
    } else {
      await api.entities.AppConfig.create({ clave: GAMIF_KEY, valor: String(nuevo) });
    }
    setActivada(nuevo);
    setGuardando(false);
    window.dispatchEvent(new Event("gamificacionChanged"));
    await registrarLog({ accion: "editar", entidad: "AppConfig", descripcion: `Gamificaciones ${nuevo ? "activadas" : "desactivadas"}`, autorNombre: sesion?.nombre });
  };

  const generarPorDefecto = async () => {
    if (!confirm("Esto creará los logros sugeridos según el contenido de la app. ¿Continuar?")) return;
    setGuardando(true);
    await api.entities.Logro.bulkCreate(LOGROS_POR_DEFECTO);
    await registrarLog({ accion: "crear", entidad: "Logro", descripcion: `Generados ${LOGROS_POR_DEFECTO.length} logros por defecto`, autorNombre: sesion?.nombre });
    setGuardando(false);
    cargar();
  };

  const guardarLogro = async () => {
    if (!editLogro?.nombre || !editLogro?.categoria || !editLogro?.umbral) return;
    setGuardando(true);
    if (editLogro.id) {
      await api.entities.Logro.update(editLogro.id, { ...editLogro });
    } else {
      await api.entities.Logro.create({ ...editLogro });
    }
    await registrarLog({ accion: editLogro.id ? "editar" : "crear", entidad: "Logro", descripcion: `Logro "${editLogro.nombre}"`, autorNombre: sesion?.nombre });
    setGuardando(false);
    setEditLogro(null);
    cargar();
  };

  const eliminarLogro = async (id) => {
    if (!confirm("¿Eliminar este logro?")) return;
    await api.entities.Logro.delete(id);
    await registrarLog({ accion: "eliminar", entidad: "Logro", descripcion: `Logro eliminado`, autorNombre: sesion?.nombre });
    cargar();
  };

  const toggleLogro = async (logro) => {
    await api.entities.Logro.update(logro.id, { activo: !logro.activo });
    cargar();
  };

  const verRanking = async () => {
    setComputando(true);
    const res = await computarGamificacion(integrantes, logros);
    setRanking(res);
    setComputando(false);
  };

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">Cargando…</div>;

  return (
    <div className="space-y-4">
      {/* Activación global */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activada ? "bg-amber-100" : "bg-gray-100"}`}>
            <Trophy className={`w-5 h-5 ${activada ? "text-amber-500" : "text-gray-300"}`} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">Gamificaciones</p>
            <p className="text-xs text-gray-400">{activada ? "Activadas para todos los usuarios" : "Desactivadas"}</p>
          </div>
          <button onClick={toggleActivacion} disabled={guardando} className={`transition-colors ${activada ? "text-amber-500" : "text-gray-300"}`}>
            {activada ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
          </button>
        </div>
        {activada && (
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            Los usuarios verán sus logros y la clasificación en la sección <span className="font-semibold text-[#630027]">Logros</span>.
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button onClick={generarPorDefecto} disabled={guardando} variant="outline" className="flex-1 rounded-xl text-xs h-9 border-[#630027]/20 text-[#630027]">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generar según contenido
        </Button>
        <Button onClick={() => setEditLogro({ nombre: "", descripcion: "", icono: "🏆", categoria: "cerveza", puntos: 10, umbral: 1, activo: true })} className="flex-1 bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo logro
        </Button>
      </div>

      {/* Ranking */}
      <Button onClick={verRanking} disabled={computando} variant="outline" className="w-full rounded-xl text-xs h-9">
        {computando ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Calculando…</> : <><Medal className="w-3.5 h-3.5 mr-1.5" /> Ver clasificación</>}
      </Button>

      <AnimatePresence>
        {ranking.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">Clasificación actual</p>
            {ranking.filter(r => r.puntos > 0).slice(0, 10).map((r, i) => (
              <div key={r.integrante.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2 flex items-center gap-3">
                <span className={`w-6 text-center font-bold text-sm ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700">{r.integrante.nombre}</span>
                <span className="text-xs font-bold text-[#630027]">{r.puntos} pts</span>
                <span className="text-xs text-gray-400">{r.completadosCount} 🏆</span>
              </div>
            ))}
            {ranking.filter(r => r.puntos > 0).length === 0 && <p className="text-xs text-gray-400 text-center py-3">Aún nadie tiene puntos</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de logros */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">{logros.length} logro(s)</p>
        <div className="space-y-2">
          {logros.map(logro => {
            const cat = CATEGORIAS_LOGRO[logro.categoria] || { emoji: "🏆", label: logro.categoria };
            return (
              <div key={logro.id} className={`bg-white rounded-xl border px-3 py-2.5 flex items-center gap-3 ${logro.activo ? "border-gray-100 shadow-sm" : "border-gray-100 opacity-50"}`}>
                <span className="text-2xl flex-shrink-0">{logro.icono || "🏆"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{logro.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{logro.descripcion}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{cat.emoji} {cat.label}</span>
                    <span className="text-[10px] text-gray-400">Umbral: {logro.umbral}</span>
                    <span className="text-[10px] font-bold text-[#630027]">{logro.puntos} pts</span>
                  </div>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <button onClick={() => toggleLogro(logro)} title={logro.activo ? "Desactivar" : "Activar"} className={`p-1.5 rounded-lg ${logro.activo ? "text-amber-500" : "text-gray-300"}`}>
                    {logro.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditLogro(logro)} title="Editar" className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => eliminarLogro(logro.id)} title="Eliminar" className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {logros.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">No hay logros creados</p>
              <p className="text-xs text-gray-300">Pulsa "Generar según contenido" para crearlos automáticamente</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal editar/crear logro */}
      <AnimatePresence>
        {editLogro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 200 }}
            onClick={() => setEditLogro(null)}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-4 space-y-3 max-h-[85vh] overflow-y-auto">
              <h3 className="font-bold text-gray-800 text-sm">{editLogro.id ? "Editar logro" : "Nuevo logro"}</h3>
              <div>
                <Label className="text-xs text-gray-500">Icono (emoji)</Label>
                <Input className="mt-1 rounded-xl text-2xl h-10 text-center" maxLength={2} value={editLogro.icono || ""} onChange={e => setEditLogro(f => ({ ...f, icono: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Nombre</Label>
                <Input className="mt-1 rounded-xl" value={editLogro.nombre || ""} onChange={e => setEditLogro(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Descripción</Label>
                <Textarea className="mt-1 rounded-xl text-sm" rows={2} value={editLogro.descripcion || ""} onChange={e => setEditLogro(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-gray-500">Categoría</Label>
                <Select value={editLogro.categoria} onValueChange={v => setEditLogro(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIAS_LOGRO).map(([k, c]) => (
                      <SelectItem key={k} value={k}>{c.emoji} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">Umbral (cantidad)</Label>
                  <Input type="number" min={1} className="mt-1 rounded-xl" value={editLogro.umbral || 0} onChange={e => setEditLogro(f => ({ ...f, umbral: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Puntos</Label>
                  <Input type="number" min={0} className="mt-1 rounded-xl" value={editLogro.puntos || 0} onChange={e => setEditLogro(f => ({ ...f, puntos: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" onClick={() => setEditLogro(null)} className="rounded-xl text-xs h-8">Cancelar</Button>
                <Button onClick={guardarLogro} disabled={guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-8">{guardando ? "..." : "Guardar"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}