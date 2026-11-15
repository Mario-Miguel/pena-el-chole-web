import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Plus, Trash2, Shield, Eye, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const SECCIONES = [
  { key: "Inicio", label: "🏠 Inicio" },
  { key: "Integrantes", label: "👥 Integrantes" },
  { key: "Calendario", label: "📅 Calendario" },
  { key: "Memoria", label: "📸 Galería" },
  { key: "Cuentas", label: "💳 Cuentas" },
  { key: "Cerveza", label: "🍺 Cerveza" },
  { key: "ToDo", label: "✅ Tareas" },
  { key: "Obra", label: "🎭 Obra" },
  { key: "Almacen", label: "📦 Almacén" },
  { key: "Concurso", label: "🏆 Concurso" },
  { key: "Resultados", label: "🏅 Resultados" },
  { key: "Presupuesto", label: "💰 Presupuesto" },
  { key: "Cuotas", label: "💳 Cuotas" },
  { key: "Sugerencias", label: "💡 Sugerencias" },
  { key: "Chat", label: "💬 Chat" },
  { key: "Votaciones", label: "🗳️ Votaciones" },
  { key: "NotasPersonales", label: "📝 Notas" },
  { key: "Notificaciones", label: "🔔 Notificaciones" },
];

const ROLES = [
  { key: "presidente", label: "Presidente" },
  { key: "vicepresidente", label: "Vicepresidente" },
  { key: "secretario", label: "Secretario" },
  { key: "tesorero", label: "Tesorero" },
  { key: "vocal", label: "Vocal" },
  { key: "socios", label: "Socios (categoría)" },
  { key: "contribuyentes", label: "Contribuyentes (categoría)" },
  { key: "socios_honorificos", label: "Socios Honoríficos (categoría)" },
];

function NuevoPermisoForm({ integrantes, onGuardado, onCancelar }) {
  const [seccion, setSeccion] = useState("Almacen");
  const [tipo, setTipo] = useState("visualizar");
  const [modoAsignacion, setModoAsignacion] = useState("rol"); // "rol" | "integrante"
  const [rol, setRol] = useState("socios");
  const [integranteId, setIntegranteId] = useState("");
  const [permitido, setPermitido] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    const integrante = integrantes.find(i => i.id === integranteId);
    await api.entities.PermisoSeccion.create({
      seccion,
      tipo,
      rol: modoAsignacion === "rol" ? rol : "",
      integrante_id: modoAsignacion === "integrante" ? integranteId : "",
      integrante_nombre: modoAsignacion === "integrante" ? (integrante?.nombre || "") : "",
      permitido,
    });
    setGuardando(false);
    onGuardado();
  };

  const esValido = modoAsignacion === "rol" ? !!rol : !!integranteId;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 mb-4"
    >
      <p className="font-bold text-amber-800 text-sm">Nuevo permiso granular</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sección</p>
          <select value={seccion} onChange={e => setSeccion(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none bg-white">
            {SECCIONES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tipo</p>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none bg-white">
            <option value="visualizar">Visualizar</option>
            <option value="editar">Editar</option>
          </select>
        </div>
      </div>

      {/* Modo asignación */}
      <div className="flex gap-2">
        {["rol", "integrante"].map(m => (
          <button
            key={m}
            onClick={() => setModoAsignacion(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              modoAsignacion === m ? "bg-[#630027] text-white" : "bg-white border border-gray-200 text-gray-500"
            }`}
          >
            {m === "rol" ? "Por cargo/categoría" : "Por integrante"}
          </button>
        ))}
      </div>

      {modoAsignacion === "rol" ? (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cargo / Categoría</p>
          <select value={rol} onChange={e => setRol(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none bg-white">
            {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Integrante</p>
          <select value={integranteId} onChange={e => setIntegranteId(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none bg-white">
            <option value="">Seleccionar…</option>
            {integrantes.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
        </div>
      )}

      {/* Permitido / Denegado */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Acción</p>
        <div className="flex gap-2">
          {[true, false].map(v => (
            <button
              key={String(v)}
              onClick={() => setPermitido(v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                permitido === v
                  ? v ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500"
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              {v ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              {v ? "Permitir" : "Denegar"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="outline" size="sm" onClick={onCancelar} className="rounded-xl text-xs h-8">Cancelar</Button>
        <Button size="sm" onClick={handleGuardar} disabled={!esValido || guardando} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-8">
          {guardando ? "Guardando…" : "Guardar permiso"}
        </Button>
      </div>
    </motion.div>
  );
}

export default function PermisosPanel() {
  const [permisos, setPermisos] = useState([]);
  const [integrantes, setIntegrantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seccionFiltro, setSeccionFiltro] = useState("todos");

  const cargar = useCallback(async () => {
    const [ps, ints] = await Promise.all([
      api.entities.PermisoSeccion.list(),
      api.entities.Integrante.list(),
    ]);
    setPermisos(ps);
    setIntegrantes(ints.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDelete = async (id) => {
    await api.entities.PermisoSeccion.delete(id);
    cargar();
  };

  const filtrados = seccionFiltro === "todos"
    ? permisos
    : permisos.filter(p => p.seccion === seccionFiltro);

  const seccionesConPermisos = [...new Set(permisos.map(p => p.seccion))];

  const getEtiqueta = (permiso) => {
    if (permiso.integrante_nombre) return permiso.integrante_nombre;
    const rol = ROLES.find(r => r.key === permiso.rol);
    return rol?.label || permiso.rol;
  };

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-700">Permisos granulares</p>
          <p className="text-xs text-gray-400 mt-0.5">Define qué cargos o integrantes pueden ver o editar secciones específicas. Los administradores siempre tienen acceso total.</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)} className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl text-xs h-8 px-3">
          <Plus className="w-3 h-3 mr-1" /> Añadir
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <NuevoPermisoForm
            integrantes={integrantes}
            onGuardado={() => { cargar(); setShowForm(false); }}
            onCancelar={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Filtro por sección */}
      {seccionesConPermisos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSeccionFiltro("todos")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${seccionFiltro === "todos" ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-500"}`}
          >
            Todos
          </button>
          {seccionesConPermisos.map(s => {
            const info = SECCIONES.find(x => x.key === s);
            return (
              <button
                key={s}
                onClick={() => setSeccionFiltro(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${seccionFiltro === s ? "bg-[#630027] text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {info?.label || s}
              </button>
            );
          })}
        </div>
      )}

      {/* Info: los permisos son informativos */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
        <Shield className="w-3.5 h-3.5 inline mr-1.5" />
        Los permisos aquí configurados complementan la lógica de la app. Los cargos con panel propio (presidente, vicepresidente, tesorero, secretario) mantienen sus privilegios existentes.
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center text-gray-300 text-sm py-8">
          {permisos.length === 0
            ? "No hay permisos configurados. Todos los integrantes ven todo por defecto."
            : "No hay permisos para esta sección."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtrados.map(permiso => {
            const seccionInfo = SECCIONES.find(s => s.key === permiso.seccion);
            return (
              <motion.div
                key={permiso.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl border px-4 py-3 flex items-center gap-3 ${
                  permiso.permitido ? "border-green-100" : "border-red-100"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${permiso.permitido ? "bg-green-100" : "bg-red-100"}`}>
                  {permiso.permitido
                    ? <Check className="w-4 h-4 text-green-600" />
                    : <X className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{seccionInfo?.label || permiso.seccion}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      permiso.tipo === "editar" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {permiso.tipo === "editar" ? <><Edit3 className="w-2.5 h-2.5 inline mr-0.5" />Editar</> : <><Eye className="w-2.5 h-2.5 inline mr-0.5" />Ver</>}
                    </span>
                    <span className={`text-xs font-semibold ${permiso.permitido ? "text-green-600" : "text-red-500"}`}>
                      {permiso.permitido ? "✓ Permitido" : "✗ Denegado"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {permiso.integrante_nombre ? `👤 ${permiso.integrante_nombre}` : `🏷️ ${ROLES.find(r => r.key === permiso.rol)?.label || permiso.rol}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(permiso.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}