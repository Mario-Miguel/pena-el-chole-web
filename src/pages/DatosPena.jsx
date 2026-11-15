import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

const CAMPOS = [
  { clave: "pena_nombre_oficial", label: "Nombre oficial de la asociación" },
  { clave: "pena_nif",            label: "NIF / CIF" },
  { clave: "pena_num_registro",   label: "Número de registro" },
  { clave: "pena_iban",           label: "Número de cuenta (IBAN)" },
  { clave: "pena_banco",          label: "Banco" },
  { clave: "pena_domicilio",      label: "Domicilio social" },
  { clave: "pena_localidad",      label: "Localidad / municipio" },
  { clave: "pena_telefono",       label: "Teléfono de contacto" },
  { clave: "pena_email",          label: "Email de contacto" },
  { clave: "pena_web",            label: "Página web" },
  { clave: "pena_fundacion",      label: "Año de fundación" },
  { clave: "pena_notario",        label: "Notario / Registro notarial" },
  { clave: "pena_seguro_poliza",  label: "Nº póliza de seguro" },
  { clave: "pena_seguro_cia",     label: "Compañía aseguradora" },
];

function Campo({ label, valor, canEdit, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(valor || "");

  const handleSave = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(valor || ""); setEditing(false); };

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <p className="text-[11px] text-gray-400 font-medium">{label}</p>
        {canEdit && !editing && (
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-[#630027]"><Pencil size={12} /></button>
            {onDelete && <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Trash2 size={12} /></button>}
          </div>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2 mt-1">
          <input className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm" value={draft} onChange={e => setDraft(e.target.value)} autoFocus onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") cancel(); }} />
          <button onClick={handleSave} className="p-1.5 bg-[#630027] text-white rounded-lg"><Check size={14} /></button>
          <button onClick={cancel} className="p-1.5 border border-gray-200 rounded-lg text-gray-400"><X size={14} /></button>
        </div>
      ) : (
        <p className={`text-sm ${valor ? "text-gray-800 font-medium" : "text-gray-300 italic"}`}>
          {valor || (canEdit ? "Pulsa el lápiz para rellenar" : "—")}
        </p>
      )}
    </div>
  );
}

export default function DatosPena() {
  const qc = useQueryClient();
  const { sesion } = useAuth();
  const canEdit = sesion?.esAdmin === true || !!sesion?.cargo;

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["app_config_pena"],
    queryFn: () => base44.entities.AppConfig.list("clave"),
  });

  const map = configs.reduce((m, c) => { m[c.clave] = c; return m; }, {});

  const upsert = async ({ clave, valor }) => {
    const existing = map[clave];
    if (existing) await base44.entities.AppConfig.update(existing.id, { valor });
    else await base44.entities.AppConfig.create({ clave, valor });
    qc.invalidateQueries({ queryKey: ["app_config_pena"] });
  };

  const del = async (clave) => {
    const existing = map[clave];
    if (existing) { await base44.entities.AppConfig.delete(existing.id); qc.invalidateQueries({ queryKey: ["app_config_pena"] }); }
  };

  // Campos personalizados
  const CLAVES_FIJAS = CAMPOS.map(c => c.clave);
  const extras = configs.filter(c => c.clave.startsWith("pena_extra_"));
  const getLabelExtra = (c) => map[c.clave + "__label"]?.valor || c.clave.replace("pena_extra_", "").replace(/_/g, " ");

  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevoLabel, setNuevoLabel] = useState("");
  const [nuevoValor, setNuevoValor] = useState("");

  const addExtra = async () => {
    const label = nuevoLabel.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const clave = `pena_extra_${slug}_${Date.now()}`;
    await upsert({ clave, valor: nuevoValor.trim() });
    await upsert({ clave: clave + "__label", valor: label });
    setNuevoLabel(""); setNuevoValor(""); setShowNuevo(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f6]">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Building2 size={22} className="text-[#630027]" />Datos de la Peña</h1>
          <p className="text-xs text-gray-400 mt-0.5">Información oficial de la asociación</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Campos fijos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-1">
              {CAMPOS.map(({ clave, label }) => (
                <Campo
                  key={clave}
                  label={label}
                  valor={map[clave]?.valor}
                  canEdit={canEdit}
                  onSave={(v) => upsert({ clave, valor: v })}
                />
              ))}
            </div>

            {/* Campos adicionales */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-1">
              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Campos adicionales</p>
                {canEdit && (
                  <button onClick={() => setShowNuevo(v => !v)} className="text-xs text-[#630027] font-medium flex items-center gap-0.5 hover:underline">
                    <Plus size={13} />Añadir
                  </button>
                )}
              </div>

              {showNuevo && (
                <div className="py-3 border-b border-gray-50 space-y-2">
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nombre del campo (ej: Presidente honorario)" value={nuevoLabel} onChange={e => setNuevoLabel(e.target.value)} autoFocus />
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Valor (opcional)" value={nuevoValor} onChange={e => setNuevoValor(e.target.value)} onKeyDown={e => e.key === "Enter" && addExtra()} />
                  <div className="flex gap-2">
                    <button onClick={addExtra} className="flex-1 bg-[#630027] text-white rounded-xl py-2 text-sm font-medium">Añadir</button>
                    <button onClick={() => setShowNuevo(false)} className="px-3 border border-gray-200 rounded-xl text-gray-400"><X size={16} /></button>
                  </div>
                </div>
              )}

              {extras.filter(c => !c.clave.endsWith("__label")).map(c => (
                <Campo
                  key={c.clave}
                  label={getLabelExtra(c)}
                  valor={c.valor}
                  canEdit={canEdit}
                  onSave={(v) => upsert({ clave: c.clave, valor: v })}
                  onDelete={canEdit ? () => { del(c.clave); del(c.clave + "__label"); } : null}
                />
              ))}

              {extras.filter(c => !c.clave.endsWith("__label")).length === 0 && !showNuevo && (
                <p className="text-xs text-gray-400 py-3">{canEdit ? "Sin campos adicionales. Pulsa «Añadir» para crear uno." : "Sin campos adicionales."}</p>
              )}
            </div>

            {!canEdit && <p className="text-xs text-gray-400 text-center">Solo los cargos y administradores pueden editar esta información.</p>}
          </>
        )}
      </div>
    </div>
  );
}