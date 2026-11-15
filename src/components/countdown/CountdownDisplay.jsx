import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const units = [
  { key: "months", label: "Meses" },
  { key: "days", label: "Días" },
  { key: "hours", label: "Horas" },
  { key: "minutes", label: "Minutos" },
  { key: "seconds", label: "Segundos" },
];

// memo: el contenedor no se re-anima si solo cambia el valor
const CountdownCard = memo(function CountdownCard({ value, label, index }) {
  const display = String(value).padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      <div className="relative w-20 h-24 sm:w-28 sm:h-32 md:w-32 md:h-36 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center overflow-hidden" style={{ willChange: "contents" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#630027]/5 to-transparent pointer-events-none" />
        {/* AnimatePresence para flip suave solo cuando cambia el número */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold text-[#630027] relative z-10 tabular-nums"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-3 text-xs sm:text-sm font-semibold text-[#630027]/60 uppercase tracking-[0.2em]">
        {label}
      </span>
    </motion.div>
  );
});

export default function CountdownDisplay({ timeLeft }) {
  if (!timeLeft) return null;

  const isExpired = Object.values(timeLeft).every((v) => v <= 0);

  if (isExpired) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-12"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-[#630027]">¡Ha llegado el día!</h2>
        <p className="text-[#630027]/50 mt-2">La cuenta atrás ha terminado</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-5 md:gap-6">
      {units.map((unit, i) => (
        <CountdownCard key={unit.key} value={timeLeft[unit.key]} label={unit.label} index={i} />
      ))}
    </div>
  );
}