import React, { useState, useRef } from "react";
import { api } from "@/api/client";
import {
  Download, Upload, Database, RefreshCw, ChevronDown, ChevronRight,
  FileJson, AlertTriangle, CheckCircle2, Search, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Orden pensado para que los padres se restauren antes que los hijos
// (las referencias por _id se remapean usando un mapa global de IDs).
const ENTIDADES = [
  { key: "Integrante", label: "Integrantes", emoji: "👤" },
  { key: "SesionUsuario", label: "Accesos", emoji: "🔑" },
  { key: "ItemCompra", label: "Compras", emoji: "🛒" },
  { key: "CompraArchivo", label: "Compras archivadas", emoji: "🗃️" },
  { key: "TicketFactura", label: "Tickets/Facturas", emoji: "🧾" },
  { key: "Proveedor", label: "Proveedores", emoji: "🏪" },
  { key: "DeudaProveedor", label: "Deudas externas", emoji: "💸" },
  { key: "MovimientoCaja", label: "Movimientos de caja", emoji: "💵" },
  { key: "PagoRegistrado", label: "Pagos", emoji: "💰" },
  { key: "Cuota", label: "Cuotas", emoji: "💶" },
  { key: "Presupuesto", label: "Presupuestos", emoji: "📊" },
  { key: "CervezaEntrada", label: "Cerveza (entradas)", emoji: "🍺" },
  { key: "ConsumoCerveza", label: "Consumo cerveza", emoji: "🍻" },
  { key: "CervezaPago", label: "Pagos cerveza", emoji: "🪙" },
  { key: "LoteCerveza", label: "Lotes cerveza", emoji: "📦" },
  { key: "ItemAlmacen", label: "Almacén", emoji: "📦" },
  { key: "MovimientoAlmacen", label: "Movimientos almacén", emoji: "🔄" },
  { key: "PrestamoAlmacen", label: "Préstamos almacén", emoji: "🤝" },
  { key: "Vehiculo", label: "Vehículos", emoji: "🚗" },
  { key: "VehiculoPieza", label: "Piezas vehículo", emoji: "🔧" },
  { key: "VehiculoRevision", label: "Revisiones", emoji: "🔩" },
  { key: "VehiculoTarea", label: "Tareas vehículo", emoji: "🚛" },
  { key: "Loteria", label: "Lotería", emoji: "🎟️" },
  { key: "TalonarioLoteria", label: "Talonarios", emoji: "📑" },
  { key: "EntregaTalonario", label: "Entregas talonario", emoji: "📨" },
  { key: "ChatGrupo", label: "Grupos de chat", emoji: "💬" },
  { key: "ChatMensaje", label: "Mensajes", emoji: "✉️" },
  { key: "Votacion", label: "Votaciones", emoji: "🗳️" },
  { key: "VotoRespuesta", label: "Respuestas votación", emoji: "✅" },
  { key: "Sugerencia", label: "Sugerencias", emoji: "💡" },
  { key: "SugerenciaActividad", label: "Sugerencias actividad", emoji: "🎯" },
  { key: "Actividad", label: "Actividades", emoji: "📅" },
  { key: "Tarea", label: "Tareas", emoji: "📋" },
  { key: "GrupoTrabajo", label: "Grupos de trabajo", emoji: "👷" },
  { key: "ConcursoSeccion", label: "Concursos", emoji: "🏆" },
  { key: "ObraAnio", label: "Obras por año", emoji: "🎭" },
  { key: "ResultadoAnio", label: "Resultados por año", emoji: "🥇" },
  { key: "ObraDocumento", label: "Documentos de obra", emoji: "📐" },
  { key: "MediaItem", label: "Imágenes/Vídeos", emoji: "🖼️" },
  { key: "Carpeta", label: "Carpetas", emoji: "📁" },
  { key: "NotaPersonal", label: "Notas personales", emoji: "📝" },
  { key: "Documento", label: "Documentos", emoji: "📄" },
  { key: "ActaReunion", label: "Actas", emoji: "📋" },
  { key: "DiaCalendario", label: "Días calendario", emoji: "📆" },
  { key: "PlazoCalendario", label: "Plazos", emoji: "🗓️" },
  { key: "CuentaAtras", label: "Cuentas atrás", emoji: "⏳" },
  { key: "EnlaceUtil", label: "Enlaces útiles", emoji: "🔗" },
  { key: "Mascota", label: "Mascotas", emoji: "🐾" },
  { key: "Notificacion", label: "Notificaciones", emoji: "🔔" },
  { key: "Logro", label: "Logros", emoji: "🎖️" },
  { key: "PermisoSeccion", label: "Permisos", emoji: "🛡️" },
  { key: "AppConfig", label: "Configuración app", emoji: "⚙️" },
  { key: "AdminLog", label: "Log de actividad", emoji: "📃" },
  { key: "Papelera", label: "Papelera", emoji: "🗑️" },
  { key: "FeedbackApp", label: "Feedback", emoji: "📣" },
  { key: "IAConversacion", label: "Conversaciones IA", emoji: "🤖" },
  { key: "IARegistro", label: "Registro IA", emoji: "🧠" },
];

const SKIP_FIELDS = ["id", "created_date", "updated_date", "created_by"];
const EXTRA_FK = { MediaItem: ["subido_por"] };
const EXTRA_ARRAY_FK = { Notificacion: ["leida_por"] };
const LS_PREFIXES = ["pena_", "tickets_carpetas_v1"];

function getLabel(r) {
  return r.nombre || r.titulo || r.tema || r.persona || r.clave
    || r.proveedor || r.descripcion || r.concepto || r.texto
    || r.id?.substring(0, 8) || "—";
}

async function fetchAll(name, onProgress) {
  const all = [];
  let skip = 0;
  const limit = 500;
  while (true) {
    const batch = await api.entities[name].list("-created_date", limit, skip);
    all.push(...batch);
    onProgress?.(name, all.length);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

function remapRecord(rec, entity, idMap) {
  const out = {};
  for (const [k, v] of Object.entries(rec)) {
    if (SKIP_FIELDS.includes(k)) continue;
    if (v == null) { out[k] = v; continue; }
    const isSingularFk = k.endsWith("_id") || (EXTRA_FK[entity] || []).includes(k);
    const isArrayFk = k.endsWith("_ids") || (EXTRA_ARRAY_FK[entity] || []).includes(k);
    if (isSingularFk) {
      out[k] = (typeof v === "string" && idMap[v]) ? idMap[v] : v;
    } else if (isArrayFk && Array.isArray(v)) {
      out[k] = v.map(x => (typeof x === "string" && idMap[x]) ? idMap[x] : x);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function exportLocalStorage() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (LS_PREFIXES.some(p => k.startsWith(p))) {
      let val;
      try { val = JSON.parse(localStorage.getItem(k)); } catch { val = localStorage.getItem(k); }
      data[k] = val;
    }
  }
  return data;
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function CopiaSeguridad({ sesion }) {
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [viewerEntity, setViewerEntity] = useState(null);
  const [viewerData, setViewerData] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerSearch, setViewerSearch] = useState("");
  const [expandedRec, setExpandedRec] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);
  const fileRef = useRef(null);

  const handleExport = async () => {
    setExporting(true);
    setExportMsg("Recopilando datos de todas las secciones…");
    try {
      const entities = {};
      let total = 0;
      for (const { key, label } of ENTIDADES) {
        setExportMsg(`Exportando: ${label}…`);
        const recs = await fetchAll(key);
        entities[key] = recs;
        total += recs.length;
      }
      const backup = {
        meta: {
          app: "chole",
          exported_at: new Date().toISOString(),
          version: 1,
          record_count: total,
          entity_count: ENTIDADES.length,
        },
        entities,
        localStorage: exportLocalStorage(),
      };
      const name = `copia_chole_${new Date().toISOString().split("T")[0]}.json`;
      downloadFile(name, JSON.stringify(backup, null, 2));
      setExportMsg(`✓ Copia descargada: ${total.toLocaleString("es-ES")} registros de ${ENTIDADES.length} secciones.`);
    } catch (e) {
      setExportMsg("Error al exportar: " + (e.message || e));
    } finally {
      setExporting(false);
    }
  };

  const openViewer = async (key, label) => {
    if (viewerEntity === key) { setViewerEntity(null); return; }
    setViewerEntity(key);
    setViewerLoading(true);
    setViewerSearch("");
    setExpandedRec(null);
    try {
      const recs = await fetchAll(key);
      setViewerData(recs);
    } catch (e) {
      setViewerData([]);
    } finally {
      setViewerLoading(false);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result);
        if (!backup.entities) throw new Error("Formato no válido");
        const counts = ENTIDADES.map(({ key, label, emoji }) => ({
          key, label, emoji, count: (backup.entities[key] || []).length,
        })).filter(c => c.count > 0);
        const total = counts.reduce((s, c) => s + c.count, 0);
        setRestorePreview({ backup, counts, total, name: file.name, hasLS: !!backup.localStorage });
      } catch (err) {
        alert("No se pudo leer el archivo: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const doRestore = async () => {
    const { backup } = restorePreview;
    setRestoring(true);
    setRestoreResult(null);
    const idMap = {};
    const results = [];
    try {
      for (let i = 0; i < ENTIDADES.length; i++) {
        const { key, label } = ENTIDADES[i];
        const records = backup.entities[key] || [];
        setProgress({ index: i + 1, total: ENTIDADES.length, label, count: records.length, phase: "borrando" });
        try {
          const existing = await fetchAll(key);
          for (let j = 0; j < existing.length; j += 500) {
            const ids = existing.slice(j, j + 500).map(r => r.id);
            if (ids.length) await api.entities[key].deleteMany({ id: { $in: ids } });
          }
          setProgress(p => ({ ...p, phase: "creando" }));
          for (let j = 0; j < records.length; j += 400) {
            const chunk = records.slice(j, j + 400);
            const remapped = chunk.map(r => remapRecord(r, key, idMap));
            const created = await api.entities[key].bulkCreate(remapped);
            (created || []).forEach((c, idx) => {
              if (chunk[idx]?.id) idMap[chunk[idx].id] = c.id;
            });
          }
          results.push({ label, ok: true, count: records.length });
        } catch (err) {
          results.push({ label, ok: false, count: records.length, error: err.message || String(err) });
        }
      }
      // Restaurar configuración local (carpetas de tickets, color, etc.)
      if (backup.localStorage) {
        for (const [k, v] of Object.entries(backup.localStorage)) {
          try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {}
        }
      }
      const failed = results.filter(r => !r.ok);
      setRestoreResult({ results, failed: failed.length });
    } catch (e) {
      setRestoreResult({ results, failed: -1, fatal: e.message || String(e) });
    } finally {
      setRestoring(false);
      setProgress(null);
      setRestorePreview(null);
    }
  };

  const filteredViewer = viewerData.filter(r =>
    !viewerSearch || getLabel(r).toLowerCase().includes(viewerSearch.toLowerCase()) ||
    JSON.stringify(r).toLowerCase().includes(viewerSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Copia de seguridad completa de la aplicación: descarga <b>toda</b> la información de todas las secciones
        (datos, carpetas, configuración) en un archivo y restáurala cuando quieras para volver al estado exacto.
      </p>

      {/* Tarjetas exportar / importar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Exportar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#630027]/10 flex items-center justify-center">
              <Download className="w-4 h-4 text-[#630027]" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Descargar copia</p>
              <p className="text-[11px] text-gray-400">Genera un archivo JSON con todo</p>
            </div>
          </div>
          <button onClick={handleExport} disabled={exporting}
            className="w-full bg-[#630027] hover:bg-[#4a001d] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Generando…" : "Descargar copia de seguridad"}
          </button>
          {exportMsg && <p className="text-[11px] text-gray-500 leading-relaxed">{exportMsg}</p>}
        </div>

        {/* Importar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#630027]/10 flex items-center justify-center">
              <Upload className="w-4 h-4 text-[#630027]" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Restaurar copia</p>
              <p className="text-[11px] text-gray-400">Sube un archivo para recuperar</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
          <button onClick={() => fileRef.current?.click()} disabled={restoring}
            className="w-full bg-white border border-[#630027]/40 hover:bg-[#630027]/5 disabled:opacity-60 text-[#630027] rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Upload className="w-4 h-4" /> Seleccionar archivo
          </button>
          <div className="flex items-start gap-1.5 text-[11px] text-amber-600 bg-amber-50 rounded-lg p-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>Restaurar <b>borra</b> todos los datos actuales y los sustituye por los del archivo. Haz una copia antes por seguridad.</span>
          </div>
        </div>
      </div>

      {/* Visor de datos por sección */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-[#630027]" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ver datos por sección</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ENTIDADES.map(e => {
            const active = viewerEntity === e.key;
            return (
              <button key={e.key} onClick={() => openViewer(e.key, e.label)}
                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all text-xs font-semibold ${
                  active ? "bg-[#630027] text-white border-[#630027]" : "bg-white border-gray-200 text-gray-600 hover:border-[#630027]/40"
                }`}>
                <span className="text-base">{e.emoji}</span>
                <span className="flex-1 leading-tight">{e.label}</span>
                {active ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {viewerEntity && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 border-t border-gray-50 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Buscar en esta sección…" value={viewerSearch} onChange={e => setViewerSearch(e.target.value)} />
                  </div>
                  <button onClick={() => openViewer(viewerEntity)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
                </div>
                {viewerLoading ? (
                  <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>
                ) : filteredViewer.length === 0 ? (
                  <p className="text-gray-300 text-sm text-center py-6">Sin registros</p>
                ) : (
                  <>
                    <p className="text-[11px] text-gray-400 mb-2">{filteredViewer.length} registro(s)</p>
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {filteredViewer.slice(0, 200).map(r => (
                        <div key={r.id}>
                          <button onClick={() => setExpandedRec(expandedRec === r.id ? null : r.id)}
                            className="w-full bg-white rounded-xl border border-gray-100 px-3 py-2 flex items-center gap-2 text-left hover:border-[#630027]/20 transition-colors">
                            <FileJson className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate flex-1">{getLabel(r)}</span>
                            <span className="text-[10px] text-gray-300 font-mono">{r.id?.substring(0, 8)}</span>
                          </button>
                          <AnimatePresence>
                            {expandedRec === r.id && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <pre className="mt-1 mb-1 bg-gray-50 rounded-xl p-2 text-[10px] text-gray-600 overflow-x-auto max-h-60 font-mono">{JSON.stringify(r, null, 2)}</pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                      {filteredViewer.length > 200 && <p className="text-[11px] text-gray-300 text-center py-2">Mostrando 200 de {filteredViewer.length}. Usa la búsqueda.</p>}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de confirmación de restauración */}
      <AnimatePresence>
        {restorePreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-gray-800">Confirmar restauración</h2>
              </div>
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Se <b>borrarán todos los datos actuales</b> y se sustituirán por los del archivo <b>{restorePreview.name}</b>. Esta acción no se puede deshacer.</span>
                </div>
                <div className="text-xs text-gray-500">
                  Se restaurarán <b className="text-[#630027]">{restorePreview.total.toLocaleString("es-ES")}</b> registros de <b>{restorePreview.counts.length}</b> sección(es){restorePreview.hasLS ? " + configuración local" : ""}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {restorePreview.counts.map(c => (
                    <span key={c.key} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg flex items-center gap-1">
                      <span>{c.emoji}</span><span>{c.label}</span><span className="font-semibold text-[#630027]">{c.count}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
                <button onClick={() => setRestorePreview(null)} disabled={restoring}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
                <button onClick={doRestore} disabled={restoring}
                  className="flex-1 bg-[#630027] hover:bg-[#4a001d] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                  {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {restoring ? "Restaurando…" : "Sí, restaurar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progreso de restauración */}
      <AnimatePresence>
        {progress && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] bg-white rounded-2xl border border-gray-100 shadow-lg px-4 py-3 w-[90%] max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-[#630027] animate-spin" />
              <p className="text-xs font-semibold text-gray-700">
                {progress.index}/{progress.total} · {progress.label}
              </p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#630027] transition-all" style={{ width: `${(progress.index / progress.total) * 100}%` }} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 capitalize">{progress.phase} {progress.count} registro(s)…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultado de restauración */}
      <AnimatePresence>
        {restoreResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-4 space-y-3">
              <div className="flex items-center gap-2">
                {restoreResult.failed === 0
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                <h2 className="font-bold text-gray-800">Restauración completada</h2>
              </div>
              <p className="text-sm text-gray-600">
                {restoreResult.failed === 0
                  ? "Todos los datos se han restaurado correctamente."
                  : `Completado con ${restoreResult.failed} sección(es) con errores.`}
              </p>
              {restoreResult.fatal && <p className="text-xs text-red-500">Error grave: {restoreResult.fatal}</p>}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {restoreResult.results.filter(r => !r.ok).map(r => (
                  <div key={r.label} className="text-[11px] bg-red-50 text-red-600 rounded-lg px-2 py-1">
                    {r.label}: {r.error}
                  </div>
                ))}
              </div>
              <button onClick={() => { setRestoreResult(null); window.location.reload(); }}
                className="w-full bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl py-2.5 text-sm font-semibold">
                Recargar la app
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}