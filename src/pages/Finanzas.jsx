import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { useAuth } from "../components/auth/AuthContext";
import { motion } from "framer-motion";
import { BookOpen, Euro, PiggyBank } from "lucide-react";

// ── Sub-páginas importadas directamente como componentes ──
import LibroCajaContent from "../components/finanzas/LibroCajaContent";
import CuotasContent from "../components/finanzas/CuotasContent";
import PresupuestoContent from "../components/finanzas/PresupuestoContent";

const TABS = [
  { id: "caja",       label: "Libro de Caja",  emoji: "📒", icon: BookOpen },
  { id: "cuotas",     label: "Cuotas",          emoji: "💵", icon: Euro },
  { id: "presupuesto",label: "Presupuesto",      emoji: "💰", icon: PiggyBank },
];

export default function Finanzas() {
  const [tab, setTab] = useState("caja");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <span className="text-xl">💰</span>
        </div>
        <div>
          <h1 className="text-[#630027] text-2xl font-black">Finanzas</h1>
          <p className="text-gray-400 text-xs">Caja · Cuotas · Presupuesto</p>
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
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {tab === "caja"        && <LibroCajaContent />}
        {tab === "cuotas"      && <CuotasContent />}
        {tab === "presupuesto" && <PresupuestoContent />}
      </motion.div>
    </div>
  );
}