import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Sparkles, Copy, Check, RotateCcw, ScrollText } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SYSTEM_CONTEXT = `Eres la "IA del Creador" de la app "Peña El Chole", una aplicación de gestión para una peña fallera construida con React + Tailwind CSS + Base44.

La app tiene las siguientes páginas: Inicio, Acceso, Admin, Integrantes, Calendario, Memoria, Cuentas, Cerveza, ToDo, Obra, Almacen, Concurso, Resultados, Sugerencias, NotasPersonales, Notificaciones, Chat, Votaciones, Ajustes, Perfil, PanelCargos.

Entidades disponibles en la base de datos: Integrante, ItemCompra, Notificacion, Votacion, VotoRespuesta, Tarea, MediaItem, Carpeta, DeudaProveedor, PagoRegistrado, ChatGrupo, ChatMensaje, DiaCalendario, PlazoCalendario, CuentaAtras, ItemAlmacen, ObraAnio, ObraDocumento, AppConfig, AdminLog, Papelera, SesionUsuario, FeedbackApp, ConcursoSeccion, ResultadoAnio, CervezaEntrada, Sugerencia, NotaPersonal.

El stack técnico es: React 18, Tailwind CSS, shadcn/ui, lucide-react, framer-motion, recharts, react-router-dom, @tanstack/react-query, base44 SDK.

El color principal de la app es #630027 (granate). El fondo es #faf8f6.

Tu rol es ayudar al administrador a:
1. Generar código React/JSX listo para copiar y pegar en los archivos correspondientes
2. Sugerir mejoras de diseño y funcionalidad
3. Explicar cómo añadir nuevas secciones, componentes o páginas
4. Resolver problemas y bugs
5. Describir los cambios de forma clara indicando en qué archivo van

Cuando generes código, indícalo siempre en bloques de código con el nombre del archivo. Sé preciso y directo. Responde siempre en español.`;

function CodeBlock({ code, lang }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => {
    navigator.clipboard.writeText(code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden my-2">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
        <span className="text-xs text-gray-400 font-mono">{lang || "jsx"}</span>
        <button onClick={copiar} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
          {copiado ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>
      <pre className="p-3 text-xs text-gray-100 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{code}</pre>
    </div>);

}

function MensajeIA({ texto }) {
  // Parsear bloques de código
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: texto.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < texto.length) {
    parts.push({ type: "text", content: texto.slice(lastIndex) });
  }

  return (
    <div>
      {parts.map((p, i) =>
      p.type === "code" ?
      <CodeBlock key={i} code={p.content} lang={p.lang} /> :
      <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{p.content}</p>
      )}
    </div>);

}

const SUGERENCIAS = [
"¿Cómo añado un campo de teléfono a los integrantes?",
"Genera una nueva página de Estadísticas con gráficas",
"¿Cómo puedo mejorar el diseño de la página de Inicio?",
"Añade un sistema de eventos con fecha y hora",
"¿Cómo exportar los datos de compras a Excel?"];


const MENSAJE_BIENVENIDA = {
  rol: "ia",
  texto: "¡Hola! Soy la **IA del Creador** de Peña El Chole. Puedo ayudarte a generar código, añadir nuevas funcionalidades, mejorar el diseño o resolver cualquier duda técnica de la app. ¿Qué quieres crear hoy?"
};

export default function IACreador() {
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [reiniciando, setReiniciando] = useState(false);
  const [verRegistro, setVerRegistro] = useState(false);
  const [registro, setRegistro] = useState([]);
  const [confirmReiniciar, setConfirmReiniciar] = useState(false);
  const sesionId = useRef(`sesion_${Date.now()}`);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Cargar historial persistido al montar
  useEffect(() => {
    const cargar = async () => {
      const historial = await base44.entities.IAConversacion.list('created_date', 200);
      if (historial && historial.length > 0) {
        setMensajes([MENSAJE_BIENVENIDA, ...historial]);
      }
      setCargandoHistorial(false);
    };
    cargar();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async (texto) => {
    const msg = texto || input.trim();
    if (!msg || cargando) return;
    setInput("");
    const nuevoMensajeUser = { rol: "user", texto: msg };
    setMensajes((prev) => [...prev, nuevoMensajeUser]);
    setCargando(true);

    // Persistir mensaje del usuario (conversación activa + registro permanente)
    await Promise.all([
    base44.entities.IAConversacion.create({ rol: "user", texto: msg }),
    base44.entities.IARegistro.create({ rol: "user", texto: msg, sesion_id: sesionId.current })]
    );

    // Construir historial para el LLM
    const historial = mensajes.slice(-8).map((m) =>
    `${m.rol === "user" ? "Admin" : "IA del Creador"}: ${m.texto}`
    ).join("\n\n");

    const prompt = `${SYSTEM_CONTEXT}

--- HISTORIAL DE CONVERSACIÓN ---
${historial}

Admin: ${msg}

IA del Creador:`;

    const respuesta = await base44.integrations.Core.InvokeLLM({ prompt });

    // Persistir respuesta de la IA (conversación activa + registro permanente)
    await Promise.all([
    base44.entities.IAConversacion.create({ rol: "ia", texto: respuesta }),
    base44.entities.IARegistro.create({ rol: "ia", texto: respuesta, sesion_id: sesionId.current })]
    );

    setMensajes((prev) => [...prev, { rol: "ia", texto: respuesta }]);
    setCargando(false);
  };

  const abrirRegistro = async () => {
    const data = await base44.entities.IARegistro.list('created_date', 500);
    setRegistro(data);
    setVerRegistro(true);
  };

  const reiniciar = () => setConfirmReiniciar(true);
  const confirmarReiniciar = async () => {
    setConfirmReiniciar(false);
    setReiniciando(true);
    const todos = await base44.entities.IAConversacion.list('created_date', 500);
    await Promise.all(todos.map((m) => base44.entities.IAConversacion.delete(m.id)));
    setMensajes([MENSAJE_BIENVENIDA]);
    setInput("");
    setCargando(false);
    setReiniciando(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <ConfirmDialog open={confirmReiniciar} mensaje="¿Borrar todo el historial de conversación con la IA?" textoConfirmar="Borrar historial" onConfirm={confirmarReiniciar} onCancel={() => setConfirmReiniciar(false)} />
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#630027] to-[#9b1a4a] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">IA del Creador</p>
          <p className="text-xs text-gray-400">Powered by Claude — usa créditos de integración</p>
        </div>
        <div className="ml-auto flex gap-1">
          <button
            onClick={abrirRegistro}
            title="Ver registro completo" className="text-gray-400 mx-4 p-1.5 rounded-lg hover:text-[#630027] hover:bg-[#630027]/5 transition-colors">


            <ScrollText className="w-4 h-4" />
          </button>
          <button
            onClick={reiniciar}
            disabled={reiniciando}
            title="Reiniciar conversación"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">

            <RotateCcw className={`w-4 h-4 ${reiniciando ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Panel registro histórico */}
      {verRegistro &&
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setVerRegistro(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[#630027]" />
                <span className="font-bold text-gray-800">Registro completo de la IA</span>
                <span className="text-xs text-gray-400">({registro.length} mensajes)</span>
              </div>
              <button onClick={() => setVerRegistro(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {registro.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Sin mensajes en el registro</p>}
              {registro.map((m, i) =>
            <div key={i} className={`flex gap-2 ${m.rol === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${m.rol === "ia" ? "bg-gradient-to-br from-[#630027] to-[#9b1a4a]" : "bg-gray-200"}`}>
                    {m.rol === "ia" ? <Sparkles className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-gray-500" />}
                  </div>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${m.rol === "ia" ? "bg-gray-50 border border-gray-100 text-gray-700" : "bg-[#630027] text-white"}`}>
                    {m.texto}
                    {m.created_date &&
                <div className={`mt-1 text-[10px] ${m.rol === "ia" ? "text-gray-400" : "text-white/60"}`}>
                        {new Date(m.created_date).toLocaleString("es-ES")}
                      </div>
                }
                  </div>
                </div>
            )}
            </div>
          </div>
        </div>
      }

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 max-h-[50vh] min-h-48 pr-1">
        {cargandoHistorial &&
        <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-[#630027]/20 border-t-[#630027] rounded-full animate-spin" />
          </div>
        }
        {mensajes.map((m, i) =>
        <div key={i} className={`flex gap-2 ${m.rol === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.rol === "ia" ? "bg-gradient-to-br from-[#630027] to-[#9b1a4a]" : "bg-gray-200"}`}>
              {m.rol === "ia" ? <Sparkles className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-gray-500" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.rol === "ia" ? "bg-white border border-gray-100 shadow-sm" : "bg-[#630027] text-white"}`}>
              {m.rol === "ia" ?
            <MensajeIA texto={m.texto} /> :
            <p className="text-sm leading-relaxed">{m.texto}</p>
            }
            </div>
          </div>
        )}

        {cargando &&
        <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#630027] to-[#9b1a4a] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-[#630027] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-[#630027] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-[#630027] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        }
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias rápidas */}
      {mensajes.length <= 1 &&
      <div className="flex gap-2 overflow-x-auto pb-1">
          {SUGERENCIAS.map((s, i) =>
        <button
          key={i}
          onClick={() => enviar(s)}
          className="flex-shrink-0 text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:border-[#630027]/30 hover:bg-[#630027]/5 transition-all">

              {s}
            </button>
        )}
        </div>
      }

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          placeholder="Escribe una instrucción o pregunta… (Enter para enviar)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 rounded-xl border-gray-200 text-sm resize-none"
          disabled={cargando} />

        <Button
          onClick={() => enviar()}
          disabled={!input.trim() || cargando}
          className="bg-[#630027] hover:bg-[#4a001d] text-white rounded-xl h-10 w-10 p-0 flex-shrink-0">

          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>);

}