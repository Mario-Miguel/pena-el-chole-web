import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Heart, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Phone } from "lucide-react";

// ─── PRIMEROS AUXILIOS ───────────────────────────────────────────────────────
const PRIMEROS_AUXILIOS = [
  { id:"cortes", emoji:"🩹", titulo:"Cortes y heridas", color:"text-red-600", bg:"bg-red-50",
    pasos:["Lávate las manos antes de tocar la herida.","Limpia con agua corriente durante 5 minutos.","Aplica presión con una gasa limpia para detener el sangrado.","Desinfecta con antiséptico (betadine o clorhexidina).","Cubre con apósito estéril.","🚨 Urgencias si: sangrado abundante, herida profunda, objeto incrustado o mordedura."] },
  { id:"quemaduras", emoji:"🔥", titulo:"Quemaduras", color:"text-orange-600", bg:"bg-orange-50",
    pasos:["Aleja de la fuente de calor.","Enfría con agua fría (15-20°C) 10-20 min. Nunca hielo.","Retira ropa y joyas si no están pegadas.","Cubre con apósito húmedo no adhesivo.","No revientes ampollas ni apliques mantequilla.","🚨 Urgencias si: mayor de la palma, en cara/manos/genitales, circular en extremidad, química o eléctrica."] },
  { id:"golpes", emoji:"🫀", titulo:"Golpes y contusiones", color:"text-blue-600", bg:"bg-blue-50",
    pasos:["Aplica hielo envuelto en un paño 15-20 min (nunca directo).","Eleva la zona afectada si es posible.","Reposa la zona lesionada.","🚨 Sospecha fractura si: dolor muy intenso, deformidad visible, hinchazón rápida."] },
  { id:"caidas", emoji:"🦴", titulo:"Caídas y posibles fracturas", color:"text-purple-600", bg:"bg-purple-50",
    pasos:["No muevas a la persona si hay sospecha de lesión de columna.","Inmoviliza la zona en la posición en que está.","Aplica frío local.","Llama al 112 si hay pérdida de consciencia, deformidad grave o lesión cervical.","Mantén a la persona abrigada y tranquila."] },
  { id:"ojos", emoji:"👁️", titulo:"Partícula en el ojo / irritación", color:"text-cyan-600", bg:"bg-cyan-50",
    pasos:["No frotes el ojo.","Lava con agua limpia o suero fisiológico 10-15 min.","Si es producto químico: lavar mínimo 20 min y urgencias.","Parpadea repetidamente para expulsar la partícula.","🚨 Urgencias si: visión borrosa, objeto incrustado o exposición química."] },
  { id:"electrico", emoji:"⚡", titulo:"Descarga eléctrica", color:"text-yellow-600", bg:"bg-yellow-50",
    pasos:["🚨 NO toques a la persona si sigue en contacto con la corriente.","Desconecta desde el interruptor o caja de luz.","Si no puedes, usa un objeto no conductor (madera seca) para apartar a la víctima.","Llama al 112 inmediatamente.","Si no respira, inicia RCP."] },
  { id:"rcp", emoji:"💓", titulo:"RCP básica (paro cardiaco)", color:"text-rose-600", bg:"bg-rose-50",
    pasos:["Comprueba que la escena es segura. Llama al 112.","Comprueba si responde: sacude los hombros.","Si no respira: inclina cabeza hacia atrás, eleva el mentón.","30 compresiones en el centro del pecho, 5-6 cm, 100-120/min.","Tras 30 compresiones: 2 insuflaciones de 1 seg.","Continúa 30:2 hasta que llegue ayuda o respire.","💡 Si hay DEA cerca, úsalo en cuanto esté disponible."] },
  { id:"calor", emoji:"🌡️", titulo:"Golpe de calor", color:"text-amber-600", bg:"bg-amber-50",
    pasos:["Traslada a lugar fresco y a la sombra.","Afloja o quita ropa ajustada.","Aplica paños mojados en cuello, axilas e ingles.","Abánica o usa ventilador.","Da agua fresca si está consciente y puede tragar.","🚨 Llama al 112 si: confusión, temperatura muy alta o pérdida de consciencia."] },
  { id:"aplastamiento", emoji:"🦾", titulo:"Aplastamiento / atrapamiento", color:"text-gray-700", bg:"bg-gray-50",
    pasos:["No intentes liberar a la persona sin ayuda profesional si el peso es grande.","Llama al 112 inmediatamente.","Controla el sangrado visible sin mover el miembro atrapado.","🚨 Al liberar puede producirse 'síndrome de aplastamiento': mantén a la víctima tumbada y avisa al 112.","Nunca des de beber a alguien con posible lesión interna."] },
  { id:"inhalacion", emoji:"😷", titulo:"Inhalación de gases / humos", color:"text-teal-600", bg:"bg-teal-50",
    pasos:["Saca a la persona al aire libre inmediatamente.","Afloja ropa y coloca en posición semiincorporada.","Si no respira, inicia RCP.","Llama al 112 aunque parezca recuperada: los efectos pueden retrasarse.","Ventila bien el espacio antes de volver a entrar."] },
];

// ─── PREVENCIÓN DE RIESGOS ───────────────────────────────────────────────────
const PREVENCION = [
  { emoji:"🔩", titulo:"Trabajos de corte y amolado", color:"text-red-700", bg:"bg-red-50",
    riesgos:["Proyección de partículas metálicas o chispas.","Cortes profundos por disco de amoladora.","Ruido intenso (>90 dB) que provoca daños auditivos.","Incendio por chispas en zonas con material inflamable."],
    medidas:["Usar gafas de seguridad o pantalla facial siempre.","Guantes anticorte (nivel 5) para trabajos de corte.","Protectores auditivos cuando el trabajo supere 10 minutos.","Alejar materiales inflamables al menos 5 metros antes de amolar.","Comprobar que el disco no esté dañado antes de montarlo."] },
  { emoji:"🔥", titulo:"Soldadura", color:"text-orange-700", bg:"bg-orange-50",
    riesgos:["Quemaduras por salpicaduras de metal fundido.","Gases y humos tóxicos (manganeso, ozono, CO).","Radiación ultravioleta que daña ojos y piel.","Incendio por proyección de chispas."],
    medidas:["Usar máscara de soldar con filtro adecuado al proceso.","Guantes de cuero para soldar y ropa ignífuga o de algodón grueso.","Ventilar el espacio de trabajo: nunca soldar en espacios cerrados sin extracción.","Tener un extintor CO2 o polvo a mano.","Cubrir con mantas ignífugas las zonas adyacentes."] },
  { emoji:"⚡", titulo:"Instalación eléctrica", color:"text-yellow-700", bg:"bg-yellow-50",
    riesgos:["Electrocución por contacto con conductores activos.","Arco eléctrico al conectar sin desconectar.","Incendio por sobrecarga o cortocircuito.","Caída por shock eléctrico en altura."],
    medidas:["Desconectar siempre el suministro antes de trabajar.","Verificar ausencia de tensión con comprobador antes de tocar.","Usar herramientas con mango aislado.","Instalar diferenciales y magnetotérmicos en todo el cuadro.","No trabajar con electricidad en mojado."] },
  { emoji:"🪜", titulo:"Trabajos en altura", color:"text-blue-700", bg:"bg-blue-50",
    riesgos:["Caídas desde escaleras, andamios o plataformas.","Caída de herramientas sobre personas en la zona inferior.","Vuelco de escaleras mal posicionadas."],
    medidas:["Usar arnés de seguridad cuando se trabaje a más de 2 m.","Acotar la zona inferior con cinta o vallas.","La escalera debe sobrepasar 1 m el punto de apoyo superior.","Nunca inclinación mayor de 75° ni menor de 65° en escaleras de mano.","Trabajar siempre con las dos manos libres cuando sea posible.","No sobrepasar el penúltimo peldaño de una escalera."] },
  { emoji:"🧴", titulo:"Productos químicos y disolventes", color:"text-purple-700", bg:"bg-purple-50",
    riesgos:["Inhalación de vapores tóxicos.","Quemaduras químicas en piel y ojos.","Incendio o explosión (acetona, gasolina, disolventes).","Intoxicación por contacto cutáneo prolongado."],
    medidas:["Usar guantes de nitrilo o neopreno según el producto.","Gafas de seguridad y máscara con filtro para vapores orgánicos.","Almacenar en armario ventilado, lejos del fuego.","Leer siempre la ficha de seguridad (SDS) del producto.","Nunca usar en espacios sin ventilación.","Tener agua abundante cerca para enjuagues de emergencia."] },
  { emoji:"🪚", titulo:"Herramientas manuales y eléctricas", color:"text-green-700", bg:"bg-green-50",
    riesgos:["Cortes y atrapamientos.","Proyección de fragmentos.","Vibraciones que causan lesiones musculoesqueléticas.","Caída de herramientas."],
    medidas:["Revisar el estado de las herramientas antes de usarlas.","Usar la herramienta adecuada para cada trabajo.","No retirar los protectores de las máquinas.","Sujetar siempre la pieza de trabajo, nunca con la mano libre.","Desconectar la herramienta eléctrica cuando no se use.","Almacenar con fundas o en paneles para evitar caídas y daños."] },
  { emoji:"🏋️", titulo:"Manipulación manual de cargas", color:"text-indigo-700", bg:"bg-indigo-50",
    riesgos:["Lesiones lumbares y hernias por mal levantamiento.","Aplastamientos por caída de cargas.","Sobreesfuerzo muscular."],
    medidas:["Doblar las rodillas, no la espalda, al levantar del suelo.","Cargas superiores a 25 kg: usar transpaleta, carretilla o pedir ayuda.","Mantener la carga cerca del cuerpo al transportarla.","Girar moviendo los pies, nunca solo la cintura con carga.","Planifica el recorrido antes de mover una pieza pesada."] },
  { emoji:"🌫️", titulo:"Polvo y partículas", color:"text-stone-700", bg:"bg-stone-100",
    riesgos:["Enfermedades respiratorias por polvo de madera, cemento o yeso.","Polvo de madera tropical: cancerígeno si exposición prolongada.","Silicosis por polvo de sílice (piedra, cemento, arena)."],
    medidas:["Mascarilla FFP2 para polvo de madera, FFP3 para sílice o materiales tóxicos.","Usar aspiración en origen (lijadora con bolsa, sierra con colector).","Regar ligeramente antes de barrer polvo de cemento.","Ventilar el espacio durante y después de trabajos polvorientos."] },
];

// ─── BUENAS PRÁCTICAS ────────────────────────────────────────────────────────
const BUENAS_PRACTICAS = [
  { emoji:"📋", titulo:"Planificación y organización", color:"text-blue-700", bg:"bg-blue-50",
    items:["Diseña y dibuja en papel antes de construir. Medir sobre plano cuesta 0 euros.","Divide el trabajo en fases y asigna responsables para cada una.","Establece horarios de trabajo y comunícalos a todo el equipo.","Crea una lista de materiales con medidas y cantidades antes de ir a comprar.","Guarda los planos y bocetos en la carpeta de documentación de la peña."] },
  { emoji:"🧰", titulo:"Mantenimiento de herramientas", color:"text-gray-700", bg:"bg-gray-50",
    items:["Limpia las herramientas después de cada uso. Duran el doble.","Afila periódicamente sierras, formones y brocas: es más seguro y eficiente.","Engrasa las partes móviles de las máquinas según el manual del fabricante.","Almacena las herramientas eléctricas con su carcasa o en sus cajas originales.","Revisa los cables de las herramientas antes de cada uso: si están pelados, no las uses.","Calibra niveles, escuadras y cintas métricas periódicamente."] },
  { emoji:"🤝", titulo:"Trabajo en equipo", color:"text-green-700", bg:"bg-green-50",
    items:["Comunica siempre qué vas a hacer antes de hacerlo cuando haya otras personas cerca.","Si vas a encender una máquina, avisa en voz alta.","Nunca dejes herramientas en bordes altos donde puedan caer.","Comparte el conocimiento: si sabes algo que otros no, enséñalo.","Respeta los roles y el coordinador de cada trabajo.","Cuando estés cansado, descansa. Los accidentes ocurren por fatiga."] },
  { emoji:"🌿", titulo:"Medio ambiente y residuos", color:"text-emerald-700", bg:"bg-emerald-50",
    items:["Separa los residuos: madera, metal, plástico, químicos en contenedores distintos.","Los disolventes, pinturas y aerosoles van al punto limpio, nunca al cubo de basura.","Minimiza los recortes planificando bien los cortes (optimización de tableros).","Reutiliza piezas de ediciones anteriores siempre que sea posible.","Recoge los retales de metal para llevarlos al chatarrero o reciclarlos."] },
  { emoji:"⏱️", titulo:"Gestión del tiempo en obra", color:"text-amber-700", bg:"bg-amber-50",
    items:["Empieza siempre por las tareas estructurales que condicionan el resto.","Bloquea tiempo en el calendario para imprevistos (al menos un 20% extra).","Haz reuniones cortas de seguimiento (15 min) al inicio de cada jornada.","Documenta con fotos el avance: sirve para el archivo histórico y para detectar errores.","Prioriza según el plazo del concurso, no según la urgencia del momento."] },
  { emoji:"💡", titulo:"Ahorro de materiales", color:"text-yellow-700", bg:"bg-yellow-50",
    items:["Dibuja los patrones de corte sobre el material antes de cortar para minimizar desperdicios.","Guarda los retales grandes etiquetados: pueden usarse en otras partes.","Las mezclas de cemento o mortero sobrantes se endurecen rápido: haz solo lo que vayas a usar.","Limpia los rodillos y brochas entre manos de pintura para reutilizarlos.","Compra materiales a granel cuando sea posible: sale más barato."] },
  { emoji:"🔍", titulo:"Control de calidad", color:"text-purple-700", bg:"bg-purple-50",
    items:["Revisa cada fase antes de taparla o avanzar: lo que se cubre no se puede corregir.","Haz pruebas de carga en la estructura antes de poner decoración encima.","Comprueba que todos los cables eléctricos están fijos y protegidos antes del desfile.","Haz una inspección visual completa la semana antes del evento.","Simula el recorrido del desfile para detectar vibraciones o elementos que se sueltan."] },
  { emoji:"📦", titulo:"Almacenaje en obra", color:"text-rose-700", bg:"bg-rose-50",
    items:["Almacena los materiales en zonas cubiertas y fuera de zonas de paso.","La madera debe almacenarse horizontal o vertical perfecta; si se tuerce, queda inservible.","El cemento abierto absorbe humedad: ciérralo herméticamente después de cada uso.","Etiqueta todo: tableros, perfiles, cajas. Lo que no está etiquetado se pierde.","Deja siempre un pasillo de acceso despejado de al menos 80 cm en el taller."] },
];

// ─── Componentes de acordeón ─────────────────────────────────────────────────
function AcordeonItem({ emoji, titulo, color, bg, children }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={()=>setAbierto(v=>!v)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <span className={`flex-1 font-semibold text-sm ${color}`}>{titulo}</span>
        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0"/> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0"/>}
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}} className="overflow-hidden">
            <div className={`px-4 pb-4 pt-3 border-t border-gray-50 ${bg}`}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrimerAuxilioItem({ item }) {
  return (
    <AcordeonItem emoji={item.emoji} titulo={item.titulo} color={item.color} bg={item.bg}>
      <ol className="space-y-2">
        {item.pasos.map((paso,i)=>(
          <li key={i} className={`flex items-start gap-2 text-sm ${paso.startsWith("🚨")||paso.startsWith("💡")?"font-semibold text-red-700":"text-gray-700"}`}>
            {!paso.startsWith("🚨")&&!paso.startsWith("💡")&&(
              <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#630027] flex items-center justify-center text-xs font-bold text-white">{i+1}</span>
            )}
            <span>{paso}</span>
          </li>
        ))}
      </ol>
    </AcordeonItem>
  );
}

function PrevencionItem({ item }) {
  return (
    <AcordeonItem emoji={item.emoji} titulo={item.titulo} color={item.color} bg={item.bg}>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold text-red-600 uppercase mb-1.5">⚠️ Riesgos</p>
          <ul className="space-y-1">{item.riesgos.map((r,i)=>(
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>{r}</li>
          ))}</ul>
        </div>
        <div>
          <p className="text-xs font-bold text-green-600 uppercase mb-1.5">✅ Medidas preventivas</p>
          <ul className="space-y-1">{item.medidas.map((m,i)=>(
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{m}</li>
          ))}</ul>
        </div>
      </div>
    </AcordeonItem>
  );
}

function BuenasPracticasItem({ item }) {
  return (
    <AcordeonItem emoji={item.emoji} titulo={item.titulo} color={item.color} bg={item.bg}>
      <ul className="space-y-2">{item.items.map((it,i)=>(
        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
          <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#630027] flex items-center justify-center text-xs font-bold text-white">{i+1}</span>
          <span>{it}</span>
        </li>
      ))}</ul>
    </AcordeonItem>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  { id:"auxilios", label:"Primeros Auxilios", icon:Heart },
  { id:"prevencion", label:"Prevención", icon:AlertTriangle },
  { id:"practicas", label:"Buenas Prácticas", icon:CheckCircle },
];

export default function Seguridad() {
  const [tab, setTab] = useState("auxilios");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.35}} className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <Shield className="w-7 h-7 text-red-600"/>
        </div>
        <div>
          <h1 className="text-3xl font-black text-red-700">Seguridad</h1>
          <p className="text-gray-400 text-sm">Primeros auxilios, prevención y buenas prácticas</p>
        </div>
      </motion.div>

      {/* Banner 112 */}
      <div className="bg-red-600 text-white rounded-2xl px-5 py-4 flex items-center gap-3 shadow-lg mb-6">
        <AlertTriangle className="w-8 h-8 flex-shrink-0"/>
        <div>
          <p className="font-black text-lg">EMERGENCIAS: 112</p>
          <p className="text-red-200 text-xs mt-0.5">Llama siempre primero al 112 en emergencias</p>
        </div>
        <a href="tel:112" className="ml-auto flex-shrink-0 bg-white text-red-600 font-black text-lg rounded-xl px-4 py-2 hover:bg-red-50 transition-colors flex items-center gap-1.5">
          <Phone className="w-4 h-4"/> Llamar
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {TABS.map(t=>{
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${tab===t.id?"bg-white shadow text-red-700":"text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-4 h-4 flex-shrink-0"/><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === "auxilios" && (
          <motion.div key="auxilios" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{duration:0.2}} className="space-y-3">
            <p className="text-xs text-gray-400 text-center pb-1">Manual orientativo. Llama al 112 en emergencias graves.</p>
            {PRIMEROS_AUXILIOS.map(item=><PrimerAuxilioItem key={item.id} item={item}/>)}
          </motion.div>
        )}
        {tab === "prevencion" && (
          <motion.div key="prevencion" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{duration:0.2}} className="space-y-3">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm text-amber-700 font-medium">
              ⚠️ Identifica los riesgos de cada trabajo y aplica las medidas preventivas antes de comenzar.
            </div>
            {PREVENCION.map((item,i)=><PrevencionItem key={i} item={item}/>)}
          </motion.div>
        )}
        {tab === "practicas" && (
          <motion.div key="practicas" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:0.2}} className="space-y-3">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-sm text-green-700 font-medium">
              ✅ Seguir estas prácticas mejora la seguridad, eficiencia y calidad del trabajo.
            </div>
            {BUENAS_PRACTICAS.map((item,i)=><BuenasPracticasItem key={i} item={item}/>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}