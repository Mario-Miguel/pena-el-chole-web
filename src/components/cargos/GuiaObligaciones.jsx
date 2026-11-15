import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Info, FileText, Scale, Calendar, Shield, Users, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ──────────────────────────────────────────────────────────
// Base de conocimiento: obligaciones y guías por cargo
// ──────────────────────────────────────────────────────────

const OBLIGACIONES_COMUNES = [
  {
    id: "estatutos",
    titulo: "Estatutos y legalidad de la asociación",
    icono: "📜",
    urgencia: "alta",
    categoria: "Legal",
    resumen: "Toda peña participante en el Desfile de Carrozas de Valdesoto es una asociación civil sin ánimo de lucro regulada por la Ley Orgánica 1/2002.",
    detalle: `La peña debe tener sus estatutos depositados en el Registro de Asociaciones del Principado de Asturias (Servicio de Asesoramiento Jurídico Administrativo). Cualquier modificación de estatutos debe ser aprobada en Asamblea General con quórum mínimo y registrada formalmente.

OBLIGACIONES:
• Inscripción inicial en el Registro de Asociaciones del Principado de Asturias (si no consta ya). La tasa de inscripción es de 42,12 € (modelo tributario 046).
• El plazo de resolución de los procedimientos de inscripción es de 3 meses desde la entrada de la solicitud.
• Actualizar el registro cuando cambien datos: domicilio, junta directiva, estatutos.
• Conservar una copia de los estatutos vigentes accesible a todos los socios.
• Comunicar altas y bajas de la junta directiva al Registro.

PLAZOS: Los cambios en la junta directiva deben comunicarse en el plazo de 1 mes desde el cambio.
TRAMITACIÓN: Presencial en las Oficinas de Atención al Ciudadano del Principado de Asturias o telemáticamente a través del Registro Electrónico del Principado de Asturias (miprincipado.asturias.es).`,
  },
  {
    id: "asamblea",
    titulo: "Asamblea General anual obligatoria",
    icono: "🏛️",
    urgencia: "alta",
    categoria: "Burocrática",
    resumen: "La Asamblea General Ordinaria debe celebrarse al menos una vez al año.",
    detalle: `La Asamblea General Ordinaria (AGO) es el máximo órgano de gobierno de la asociación.

OBLIGACIONES:
• Convocarla con al menos 15 días de antelación (según estatutos).
• Incluir en el orden del día: aprobación de cuentas del ejercicio anterior, presupuesto del nuevo ejercicio y memoria de actividades.
• Levantar acta firmada por el Secretario y el Presidente.
• Depositar el acta en el archivo de la peña y comunicar cambios al Registro si procede.

CONTENIDO MÍNIMO DEL ACTA:
- Lugar, fecha y hora
- Lista de asistentes y representados
- Orden del día
- Acuerdos adoptados con resultado de votaciones
- Firma del Secretario con visto bueno del Presidente`,
  },
  {
    id: "nif",
    titulo: "NIF de la asociación y obligaciones con Hacienda",
    icono: "🏦",
    urgencia: "alta",
    categoria: "Fiscal",
    resumen: "La asociación debe tener NIF propio y cumplir obligaciones fiscales básicas.",
    detalle: `OBTENCIÓN Y MANTENIMIENTO DEL NIF:
• El NIF se solicita en la Agencia Tributaria (Modelo 036).
• Debe actualizarse si cambia el representante legal o el domicilio fiscal.

OBLIGACIONES FISCALES GENERALES:
• Declaración anual del Impuesto sobre Sociedades (Modelo 200) si se obtienen rentas, aunque sean mínimas.
• Si los ingresos son inferiores a 75.000€ y no se ejercen actividades económicas ajenas al objeto social, puede acogerse al régimen simplificado.
• Las asociaciones declaradas de utilidad pública tienen beneficios fiscales adicionales (Ley 49/2002).
• IVA: si se realizan actividades económicas sujetas (venta de entradas, barra de bar...) pueden generarse obligaciones de IVA.

MODELOS FRECUENTES:
- Modelo 036/037: Alta y modificaciones censales
- Modelo 200: Impuesto sobre Sociedades
- Modelo 347: Operaciones con terceros (si supera 3.005,06€ con un proveedor)`,
  },
  {
    id: "cuotas",
    titulo: "Gestión de cuotas de socios",
    icono: "💳",
    urgencia: "media",
    categoria: "Financiera",
    resumen: "El cobro de cuotas debe estar regulado en los estatutos y registrado contablemente.",
    detalle: `Las cuotas de los socios son la principal fuente de financiación de la peña.

BUENAS PRÁCTICAS:
• Las cuotas deben estar definidas en los estatutos o aprobadas en Asamblea.
• Llevar un registro de quién ha pagado y quién no (libro de socios).
• Emitir recibos o justificantes de pago.
• No cobrar cuotas sin aprobación asamblearia.

GESTIÓN CONTABLE:
• Registrar todos los ingresos por cuotas con fecha y concepto.
• Diferenciar entre cuota ordinaria y cuota extraordinaria.
• Los socios morosos deben ser notificados formalmente antes de tomar medidas.

IMPORTANTE: Las cuotas deben ser iguales para todos los socios de la misma categoría, salvo excepciones aprobadas en Asamblea.`,
  },
  {
    id: "seguro",
    titulo: "Seguro de responsabilidad civil",
    icono: "🛡️",
    urgencia: "alta",
    categoria: "Legal",
    resumen: "Es imprescindible tener seguro de responsabilidad civil activo, especialmente durante el Desfile de Carrozas de Valdesoto.",
    detalle: `El seguro de responsabilidad civil cubre los daños que la peña pueda causar a terceros durante sus actividades.

OBLIGACIONES:
• Contratar un seguro de RC que cubra todas las actividades de la peña.
• Renovarlo anualmente antes de su vencimiento.
• Verificar que la póliza cubre el desfile, actos públicos y uso de la sede social.
• Las estructuras y andamiajes de las carrozas pueden requerir coberturas adicionales dado su tamaño y complejidad.

DURANTE EL DESFILE DE CARROZAS:
• El Ayuntamiento de Siero puede exigir seguro de RC para la participación en el desfile y actos oficiales de las fiestas de San Félix de Valdesoto.
• El seguro debe estar vigente durante toda la celebración del Desfile de Carrozas.
• Guardar copia del seguro y presentarla cuando sea requerida por la organización del Desfile o el Ayuntamiento de Siero.

RECOMENDACIÓN: El Desfile está declarado Fiesta de Interés Turístico del Principado de Asturias desde 2002. Consultar con la organización del evento los requisitos de seguro vigentes para cada edición, ya que pueden variar.`,
  },
  {
    id: "proteccion-datos",
    titulo: "Protección de datos (RGPD / LOPDGDD)",
    icono: "🔒",
    urgencia: "alta",
    categoria: "Legal",
    resumen: "La peña trata datos personales de socios y debe cumplir el Reglamento General de Protección de Datos.",
    detalle: `El RGPD (Reglamento UE 2016/679) y la LOPDGDD (Ley Orgánica 3/2018) son de aplicación obligatoria.

OBLIGACIONES BÁSICAS:
• Informar a los socios de cómo se usan sus datos (cláusula informativa).
• Obtener consentimiento expreso para comunicaciones (WhatsApp, email, fotos).
• Mantener un Registro de Actividades de Tratamiento (RAT) — documento interno.
• No ceder datos a terceros sin consentimiento.
• Aplicar medidas de seguridad básicas (contraseñas, acceso limitado a datos).

FOTOS Y VÍDEOS:
• No publicar fotos de personas reconocibles sin su consentimiento.
• Especial cuidado con menores de edad.
• Tener una política clara de publicación en redes sociales.

DERECHOS DE LOS SOCIOS:
• Derecho de acceso, rectificación, supresión ("derecho al olvido"), portabilidad y oposición.
• Designar un punto de contacto para ejercer estos derechos.`,
  },
  {
    id: "contabilidad",
    titulo: "Contabilidad y transparencia económica",
    icono: "📊",
    urgencia: "alta",
    categoria: "Financiera",
    resumen: "La asociación debe llevar una contabilidad ordenada y presentarla en Asamblea.",
    detalle: `Aunque no existe obligación legal de seguir el PGC completo para asociaciones pequeñas, sí se exige llevar cuentas claras.

OBLIGACIONES:
• Libro de caja o libro diario de ingresos y gastos.
• Conservar facturas y justificantes de todos los gastos durante al menos 5 años.
• Elaborar un presupuesto anual para presentar en Asamblea.
• Rendir cuentas anualmente ante los socios (informe económico en AGO).

DOCUMENTOS OBLIGATORIOS:
- Libro de actas
- Libro de socios
- Libro de cuentas (ingresos y gastos)
- Inventario de bienes

RECOMENDACIÓN: Usar la sección de Finanzas de esta app para llevar el libro de caja y la sección de Presupuesto para planificar el ejercicio.`,
  },
];

const OBLIGACIONES_POR_CARGO = {
  presidente: [
    {
      id: "rep-legal",
      titulo: "Representación legal y firma",
      icono: "👑",
      urgencia: "alta",
      categoria: "Legal",
      resumen: "El presidente es el representante legal de la asociación ante terceros, administraciones y tribunales.",
      detalle: `RESPONSABILIDADES EXCLUSIVAS DEL PRESIDENTE:
• Representar a la asociación en todos los actos y contratos.
• Firmar contratos, convenios y documentos oficiales.
• Convocar y presidir las reuniones de la Junta Directiva y la Asamblea General.
• Velar por el cumplimiento de los estatutos y los acuerdos asamblearios.
• Autorizar los pagos y gastos de la asociación (junto al tesorero).

ANTE LAS ADMINISTRACIONES:
• Es el interlocutor oficial con el Ayuntamiento, Junta Central Fallera y otras instituciones.
• Debe firmar las solicitudes de subvenciones, permisos de plantà, etc.
• Es responsable solidario junto a la Junta Directiva en caso de irregularidades.

DELEGACIÓN:
• Puede delegar funciones en el Vicepresidente mediante acuerdo de Junta.`,
    },
    {
      id: "subvenciones",
      titulo: "Gestión de subvenciones y ayudas",
      icono: "💰",
      urgencia: "media",
      categoria: "Financiera",
      resumen: "Las peñas del Desfile de Carrozas de Valdesoto pueden acceder a subvenciones del Ayuntamiento de Siero, el Principado de Asturias y otras entidades.",
      detalle: `TIPOS DE SUBVENCIONES DISPONIBLES:
      • Ayuntamiento de Siero: convocatorias anuales para asociaciones culturales y festivas del concejo. Consultar la sede electrónica del Ayuntamiento de Siero.
      • Consejería de Cultura, Política Lingüística y Turismo del Principado de Asturias: ayudas para actividades de promoción cultural y fiestas de interés turístico.
      • Principado de Asturias (otras consejerías): programas de apoyo a entidades locales y asociaciones sin ánimo de lucro.
      • Al estar declarado el Desfile como Fiesta de Interés Turístico del Principado de Asturias desde 2002, puede existir acceso a líneas de financiación específicas para su promoción y conservación.

      REQUISITOS GENERALES:
      • Estar inscrita en el Registro de Asociaciones del Principado de Asturias.
      • Estar al corriente de obligaciones fiscales y con la Seguridad Social.
      • Presentar memoria de actividades y cuenta justificativa.
      • No tener deudas pendientes con las administraciones.

      PROCESO:
      1. Vigilar las convocatorias (BOPA — Boletín Oficial del Principado de Asturias, tablón de anuncios, web del Ayuntamiento de Siero y asturias.es).
      2. Preparar la documentación con antelación.
      3. Presentar en plazo (suelen ser en concurrencia competitiva).
      4. Si se concede: justificar el gasto en los plazos marcados.

      IMPORTANTE: Las subvenciones no justificadas deben devolverse con intereses.`,
    },
  ],
  vicepresidente: [
    {
      id: "suplencia",
      titulo: "Funciones de suplencia y apoyo",
      icono: "🤝",
      urgencia: "media",
      categoria: "Organizativa",
      resumen: "El vicepresidente sustituye al presidente en caso de ausencia y coordina las comisiones de trabajo.",
      detalle: `FUNCIONES PRINCIPALES:
• Sustituir al presidente en todas sus funciones cuando este no pueda ejercerlas.
• Coordinar las diferentes comisiones o grupos de trabajo de la peña.
• Apoyar al presidente en la representación institucional.
• Supervisar el cumplimiento del plan de actividades.

EN AUSENCIA DEL PRESIDENTE:
• Asume plena capacidad de representación legal.
• Puede firmar documentos urgentes.
• Debe informar al presidente de todas las decisiones tomadas.

COORDINACIÓN INTERNA:
• Hacer seguimiento de las tareas asignadas a los vocales.
• Reportar al presidente sobre el estado de los proyectos.
• Mediar en posibles conflictos internos.`,
    },
  ],
  secretario: [
    {
      id: "libro-actas",
      titulo: "Libro de actas y registro oficial",
      icono: "📋",
      urgencia: "alta",
      categoria: "Burocrática",
      resumen: "El secretario debe llevar el libro de actas, el censo de socios y toda la documentación oficial.",
      detalle: `OBLIGACIONES DOCUMENTALES:
• Redactar y custodiar las actas de todas las reuniones de Junta y Asamblea.
• Mantener actualizado el libro de socios (nombre, DNI, domicilio, fecha de alta/baja).
• Expedir certificaciones de los acuerdos cuando se soliciten.
• Custodiar el sello oficial de la asociación.
• Archivar y conservar toda la documentación de la peña.

REQUISITOS DE LAS ACTAS:
• Deben reflejar fielmente los debates y acuerdos.
• Firmadas por el Secretario con Visto Bueno del Presidente.
• Aprobadas en la siguiente reunión.
• Numeradas correlativamente.

COMUNICACIONES OFICIALES:
• Redactar y enviar convocatorias de reunión (con el orden del día y antelación mínima).
• Gestionar la correspondencia oficial de la peña.
• Notificar a los socios los acuerdos que les afecten.

REGISTRO DE ASOCIACIONES:
• Comunicar cambios en la junta directiva en el plazo de 1 mes.
• Actualizar el domicilio social si cambia.
• Tramitar modificaciones de estatutos si se aprueban.`,
    },
    {
      id: "censo-socios",
      titulo: "Gestión del censo de socios",
      icono: "👥",
      urgencia: "alta",
      categoria: "Burocrática",
      resumen: "Mantener actualizado el libro de socios es obligación legal del Secretario.",
      detalle: `EL LIBRO DE SOCIOS DEBE CONTENER:
• Nombre y apellidos de cada socio.
• Número de socio (correlativo).
• DNI/NIE.
• Domicilio y datos de contacto.
• Fecha de alta en la asociación.
• Categoría (socio de número, socio honorífico, etc.).
• Fecha y motivo de baja, si procede.

ALTAS:
• Solicitud escrita del interesado.
• Aprobación por la Junta Directiva (según estatutos).
• Comunicación al socio de la aceptación.

BAJAS:
• Voluntaria: comunicación por escrito del socio.
• Por impago de cuotas: siguiendo el procedimiento estatutario.
• Por sanción: resolución de expediente disciplinario.

PROTECCIÓN DE DATOS:
• El libro de socios contiene datos personales — tratarlo conforme al RGPD.
• Acceso restringido a la Junta Directiva.`,
    },
    {
      id: "convocatorias",
      titulo: "Convocatorias y plazos",
      icono: "📅",
      urgencia: "alta",
      categoria: "Burocrática",
      resumen: "Las convocatorias de Asamblea y Junta deben cumplir los plazos y requisitos estatutarios.",
      detalle: `ASAMBLEA GENERAL ORDINARIA:
• Convocar con al menos 15 días de antelación (revisar estatutos, puede ser más).
• Incluir el orden del día completo en la convocatoria.
• Enviar convocatoria a todos los socios con derecho a voto.
• Publicar en el tablón de anuncios de la sede.

ASAMBLEA GENERAL EXTRAORDINARIA:
• Puede convocarse en cualquier momento.
• Mismos requisitos de plazo y forma que la ordinaria.
• Solo puede tratar los temas del orden del día.

JUNTA DIRECTIVA:
• Frecuencia mínima según estatutos (normalmente mensual o bimestral).
• Convocatoria con el orden del día, aunque puede ser más informal.
• Siempre levantar acta.

QUÓRUM:
• Para acuerdos válidos suele requerirse mayoría simple de presentes.
• Para reformas estatutarias: mayoría cualificada (2/3 o más).
• En segunda convocatoria: quórum reducido (revisar estatutos).`,
    },
  ],
  tesorero: [
    {
      id: "libro-caja",
      titulo: "Libro de caja y contabilidad",
      icono: "📒",
      urgencia: "alta",
      categoria: "Financiera",
      resumen: "El tesorero debe llevar un registro ordenado de todos los ingresos y gastos de la peña.",
      detalle: `OBLIGACIONES CONTABLES:
• Llevar el libro de caja con todos los movimientos de tesorería.
• Conservar todos los justificantes de pago (facturas, recibos, tickets).
• Elaborar el presupuesto anual para presentar en Asamblea.
• Rendir cuentas en la Asamblea General Ordinaria.
• Conservar la documentación contable durante 5 años mínimo.

BUENAS PRÁCTICAS:
• Distinguir entre ingresos (cuotas, subvenciones, barra, actividades) y gastos (obra, materiales, seguros, actos).
• No realizar pagos en efectivo por importes superiores a 1.000€ (Ley antifraude).
• Pedir siempre factura, no solo ticket.
• Nunca mezclar fondos de la peña con fondos personales.

TESORERÍA SANA:
• Mantener un fondo de reserva para imprevistos.
• No comprometer gastos sin aprobación previa.
• Alertar a la Junta cuando se prevean desviaciones del presupuesto.`,
    },
    {
      id: "fiscalidad",
      titulo: "Obligaciones fiscales del tesorero",
      icono: "🏛️",
      urgencia: "alta",
      categoria: "Fiscal",
      resumen: "El tesorero gestiona las relaciones con Hacienda y asegura el cumplimiento de las obligaciones fiscales.",
      detalle: `DECLARACIONES PERIÓDICAS:
• Modelo 200 (Impuesto de Sociedades): anual, plazo 25 días naturales desde los 6 meses del cierre del ejercicio (habitualmente, 25 de julio para ejercicios que cierran el 31 de diciembre).
• Modelo 347 (Operaciones con terceros): anual, si algún proveedor supera 3.005,06€. Presentación en febrero.
• IVA (Modelos 303/390): solo si la asociación realiza actividades económicas sujetas a IVA.

RETENCIONES:
• Si se pagan honorarios a colaboradores externos (artistas, técnicos...), puede ser necesario practicar retención del IRPF (Modelo 111 trimestral + 190 anual).

DONACIONES Y LIBERALIDADES:
• Las aportaciones de empresas pueden dar derecho a deducción si la asociación está declarada de utilidad pública.

CUENTA BANCARIA:
• La peña debe tener cuenta bancaria a nombre de la asociación (no a nombre personal de ningún cargo).
• Tener autorizados en la cuenta, al menos, el Presidente y el Tesorero.
• Exigir firma doble para disposiciones de importe elevado.

PREMIOS EN METÁLICO:
• El Desfile de Carrozas de Valdesoto reparte premios en metálico a las mejores carrozas, decididos por el jurado al finalizar el desfile. Registrar correctamente estos ingresos en la contabilidad de la peña.`,
    },
    {
      id: "presupuesto",
      titulo: "Presupuesto anual y planificación",
      icono: "📈",
      urgencia: "media",
      categoria: "Financiera",
      resumen: "El tesorero elabora el proyecto de presupuesto anual y hace seguimiento de su ejecución.",
      detalle: `ESTRUCTURA DEL PRESUPUESTO:
INGRESOS:
- Cuotas de socios
- Subvenciones esperadas
- Ingresos por actividades (barra, eventos, rifas...)
- Patrocinios

GASTOS:
- Construcción de la carroza (materiales, mano de obra, maquinaria, decoración...)
- Seguros (RC, accidentes...)
- Sede social (alquiler, suministros...)
- Actos y actividades culturales
- Gastos administrativos y representación
- Fondo de reserva (recomendable: 10% del presupuesto)

SEGUIMIENTO:
• Revisar mensualmente la ejecución del presupuesto.
• Informar a la Junta de desviaciones significativas.
• Proponer medidas correctoras si se detectan desfases.

APROBACIÓN:
• El presupuesto debe ser aprobado por la Asamblea General.
• Cualquier modificación relevante requiere aprobación de la Junta o nueva Asamblea.`,
    },
    {
      id: "pagos-proveedores",
      titulo: "Pagos a proveedores y deudas",
      icono: "🤝",
      urgencia: "media",
      categoria: "Financiera",
      resumen: "Gestión de deudas con proveedores y correcta documentación de pagos.",
      detalle: `BUENAS PRÁCTICAS CON PROVEEDORES:
• Firmar contratos por escrito para servicios de importes relevantes.
• Conservar todas las facturas con sus datos completos (NIF proveedor, concepto, importe, fecha).
• Pagar en el plazo acordado para mantener buena relación comercial.
• No comprometer pagos sin disponibilidad en caja.

FACTURAS CORRECTAS DEBEN INCLUIR:
- NIF/CIF del emisor y receptor
- Número de factura correlativo
- Fecha de emisión
- Descripción del servicio/producto
- Base imponible, tipo de IVA y cuota de IVA
- Importe total

CIERRE DEL EJERCICIO FESTIVO:
• Al terminar el Desfile de Carrozas de Valdesoto (celebrado el lunes siguiente al segundo fin de semana de agosto), liquidar todos los pagos pendientes.
• Solicitar factura definitiva a todos los proveedores.
• Cerrar el ejercicio contable de la temporada.`,
    },
  ],
  vocal: [
    {
      id: "comisiones",
      titulo: "Gestión de comisiones y grupos de trabajo",
      icono: "👷",
      urgencia: "media",
      categoria: "Organizativa",
      resumen: "Los vocales coordinan los grupos de trabajo y son responsables de áreas específicas de la peña.",
      detalle: `RESPONSABILIDADES DEL VOCAL:
• Responsabilizarse de un área o comisión específica (obra, festejos, infantil, etc.).
• Coordinar a los voluntarios de su área.
• Reportar regularmente a la Junta Directiva.
• Proponer mejoras y actividades dentro de su ámbito.

BUENAS PRÁCTICAS:
• Convocar reuniones periódicas de su comisión.
• Documentar los avances y decisiones.
• Gestionar los recursos asignados de forma responsable.
• Comunicar necesidades de presupuesto con antelación.

DELEGACIÓN:
• El vocal puede delegar tareas concretas en otros socios voluntarios.
• Siempre supervisar y mantener la responsabilidad sobre los resultados.`,
    },
    {
      id: "actividades",
      titulo: "Organización de actividades y eventos",
      icono: "🎉",
      urgencia: "media",
      categoria: "Organizativa",
      resumen: "La organización de eventos públicos puede requerir permisos y seguros específicos.",
      detalle: `PERMISOS NECESARIOS PARA EVENTOS:
• Celebraciones en vía pública: permiso del Ayuntamiento (solicitar con antelación suficiente, mínimo 15-30 días).
• Música amplificada: autorización por horario y nivel sonoro.
• Venta de alimentos/bebidas: licencia de manipulador de alimentos para los implicados.
• Actividades con menores: revisar normativa específica (protocolo de protección de la infancia).

SEGURIDAD EN EVENTOS:
• Designar un responsable de seguridad.
• Conocer las salidas de emergencia y capacidad del espacio.
• Tener un botiquín básico disponible.
• En eventos grandes: contratar servicio de seguridad privado si lo exige la normativa.

LICENCIAS DE MÚSICA:
• Si se interpreta música en público (DJ, banda, etc.), puede ser necesario abonar derechos a la SGAE/AGEDI.
• Consultar con la asociación correspondiente.`,
    },
  ],
};

const URGENCIA_STYLES = {
  alta:  "bg-red-50 border-red-200 text-red-700",
  media: "bg-amber-50 border-amber-200 text-amber-700",
  baja:  "bg-green-50 border-green-200 text-green-700",
};

const URGENCIA_LABELS = {
  alta: "⚠️ Importante",
  media: "📌 Relevante",
  baja: "ℹ️ Informativo",
};

function FichaObligacion({ ob }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${URGENCIA_STYLES[ob.urgencia] || "bg-white border-gray-100"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-black/5 transition-colors"
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">{ob.icono}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm">{ob.titulo}</p>
            <span className="text-xs font-semibold bg-white/60 px-2 py-0.5 rounded-full flex-shrink-0">{ob.categoria}</span>
          </div>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{ob.resumen}</p>
          <span className="text-xs font-semibold mt-1.5 inline-block opacity-70">{URGENCIA_LABELS[ob.urgencia]}</span>
        </div>
        <div className="flex-shrink-0 mt-1">
          {open ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-current/10">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans opacity-90">{ob.detalle}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TABS = [
  { id: "comun",         label: "Para todos", emoji: "📚" },
  { id: "presidente",    label: "Presidente", emoji: "👑" },
  { id: "vicepresidente",label: "Vicepresi.", emoji: "🤝" },
  { id: "secretario",    label: "Secretario", emoji: "📋" },
  { id: "tesorero",      label: "Tesorero",   emoji: "💰" },
  { id: "vocal",         label: "Vocal",      emoji: "📣" },
];

export default function GuiaObligaciones({ cargoActivo = null }) {
  const [tabActiva, setTabActiva] = useState(cargoActivo || "comun");
  const obligaciones = tabActiva === "comun" ? OBLIGACIONES_COMUNES : (OBLIGACIONES_POR_CARGO[tabActiva] || []);

  return (
    <div className="space-y-4">
      {/* Banner informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-700">Guía de obligaciones — Peñas del Desfile de Carrozas de Valdesoto</p>
          <p className="text-xs text-blue-600 mt-0.5">Información de referencia para la correcta gestión de peñas del Desfile de Carrozas de Valdesoto (concejo de Siero, Principado de Asturias). Ante dudas jurídicas, consulta siempre con un asesor especializado.</p>
        </div>
      </div>

      {/* Tabs de cargo */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTabActiva(t.id)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              tabActiva === t.id
                ? "bg-[#630027] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#630027]/30"
            }`}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Fichas */}
      <div className="space-y-3">
        {obligaciones.length === 0 ? (
          <div className="text-center py-10 text-gray-300 text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No hay obligaciones específicas para este cargo aún</p>
          </div>
        ) : (
          obligaciones.map(ob => <FichaObligacion key={ob.id} ob={ob} />)
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pb-2">Última revisión: 2026 · Normativa española y asturiana vigente (Principado de Asturias)</p>
    </div>
  );
}