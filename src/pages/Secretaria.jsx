import React, { useState } from "react";
import { motion } from "framer-motion";
import GestionDocumentalContent from "../components/secretaria/GestionDocumentalContent";
import ActasReunionContent from "../components/secretaria/ActasReunionContent";

const TABS = [
  { id: "documentos", label: "Documentación", emoji: "📄" },
  { id: "actas",      label: "Actas",          emoji: "📋" },
];

export default function Secretaria() {
  const [tab, setTab] = useState("documentos");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <span className="text-xl">🗂️</span>
        </div>
        <div>
          <h1 className="text-[#630027] text-2xl font-black">Secretaría</h1>
          <p className="text-gray-400 text-xs">Documentos · Actas de reunión</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 bg-gray-50 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id
                ? "bg-white text-[#630027] shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {tab === "documentos" && <GestionDocumentalContent />}
        {tab === "actas"      && <ActasReunionContent />}
      </motion.div>
    </div>
  );
}