import React from "react";
import KanbanTareas from "../components/tareas/KanbanTareas";
import { motion } from "framer-motion";

export default function TareasReunion() {
  return (
    <motion.div
      initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} className="mb-6">
        <h1 className="text-3xl font-black text-[#630027]">Tareas de reunión</h1>
        <p className="text-gray-400 text-sm mt-1">Tablero Kanban · Arrastra las tarjetas para cambiar el estado</p>
      </motion.div>

      <KanbanTareas />
    </motion.div>
  );
}