import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

export default function TourOverlay({ tour, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [showFaqs, setShowFaqs] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const totalSteps = tour?.steps?.length || 0;
  const currentStep = tour?.steps?.[step];
  const isLast = step === totalSteps - 1;

  // Navegar a la página del tour al iniciar
  useEffect(() => {
    if (tour?.page) {
      const targetPath = `/${tour.page}`;
      if (window.location.pathname !== targetPath) navigate(targetPath);
    }
  }, [tour]);

  // Localizar y resaltar el elemento objetivo del paso actual
  useEffect(() => {
    document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));
    setTargetRect(null);
    if (!currentStep?.target) return;

    let attempts = 0;
    const find = () => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
          el.classList.add("tour-highlight");
        }, 450);
      } else if (attempts++ < 25) {
        setTimeout(find, 200);
      }
    };
    find();

    const update = () => {
      const el = document.querySelector(currentStep.target);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.querySelectorAll(".tour-highlight").forEach(el => el.classList.remove("tour-highlight"));
    };
  }, [step, tour, location.pathname]);

  if (!tour) return null;

  const next = () => {
    if (isLast) onComplete?.();
    else setStep(s => s + 1);
  };
  const prev = () => step > 0 && setStep(s => s - 1);

  // Posición de la tarjeta de explicación junto al elemento
  const CARD_WIDTH = Math.min(320, window.innerWidth - 24);
  const CARD_MAX_H = 260;
  const MARGIN = 12;
  const pad = 8; // espacio del spotlight alrededor del elemento

  let cardStyle = {};
  let placement = "bottom";

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    placement = spaceBelow >= CARD_MAX_H + MARGIN ? "bottom" : (spaceAbove >= CARD_MAX_H + MARGIN ? "top" : "bottom");

    const centerX = targetRect.left + targetRect.width / 2;
    let left = centerX - CARD_WIDTH / 2;
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - CARD_WIDTH - MARGIN));

    if (placement === "bottom") {
      cardStyle = { top: targetRect.bottom + MARGIN, left, width: CARD_WIDTH };
    } else {
      cardStyle = { top: Math.max(MARGIN, targetRect.top - MARGIN - CARD_MAX_H), left, width: CARD_WIDTH };
    }
  } else {
    cardStyle = { left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: CARD_WIDTH };
  }

  // Rectángulo del spotlight (transparente con sombra que oscurece el resto)
  const spotlightStyle = targetRect ? {
    position: "fixed",
    top: Math.max(0, targetRect.top - pad),
    left: Math.max(0, targetRect.left - pad),
    width: targetRect.width + pad * 2,
    height: targetRect.height + pad * 2,
    borderRadius: 12,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
    zIndex: 330,
    pointerEvents: "none",
    transition: "all 0.3s ease",
  } : null;

  return (
    <>
      {/* Capa oscura con recorte del elemento */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tarjeta de explicación junto al elemento */}
      <AnimatePresence mode="wait">
        {showFaqs ? (
          <motion.div
            key="faqs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ ...cardStyle, maxHeight: CARD_MAX_H, zIndex: 350 }}
          >
            <div className={`flex items-center justify-between px-4 py-3 ${tour.bg}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{tour.emoji}</span>
                <div>
                  <h3 className={`font-bold text-xs ${tour.color}`}>{tour.titulo}</h3>
                  <p className="text-[10px] text-gray-500">Preguntas frecuentes</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowFaqs(false)} className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-gray-600 hover:bg-gray-50">← Tour</button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 text-gray-400"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tour.faqs?.map((faq, i) => <FAQItem key={i} faq={faq} />)}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`tour-${step}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ ...cardStyle, zIndex: 350 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 ${tour.bg}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{tour.emoji}</span>
                <div>
                  <h3 className={`font-bold text-xs ${tour.color}`}>{tour.titulo}</h3>
                  <p className="text-[10px] text-gray-500">Paso {step + 1} de {totalSteps}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="h-1 bg-gray-100">
              <div
                className={`h-full transition-all duration-300 ${tour.color.replace("text-", "bg-")}`}
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>

            {/* Contenido del paso */}
            <div className="px-4 py-3.5">
              <h4 className="font-bold text-gray-800 text-sm mb-1.5">{currentStep.titulo}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{currentStep.descripcion}</p>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-50 flex items-center justify-between">
              <div className="flex gap-1">
                {tour.faqs?.length > 0 && (
                  <button onClick={() => setShowFaqs(true)} className="text-xs font-bold text-gray-400 hover:text-[#630027] px-2 py-1.5" title="Preguntas frecuentes">❓</button>
                )}
                <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-[#630027] px-2 py-1.5">Saltar</button>
              </div>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button onClick={prev} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <button onClick={next} className="flex items-center gap-1.5 bg-[#630027] text-white rounded-xl px-4 py-2 text-xs font-bold">
                  {isLast ? (<><Check className="w-3.5 h-3.5" /> Finalizar</>) : (<>Siguiente <ChevronRight className="w-3.5 h-3.5" /></>)}
                </button>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1 pb-2.5">
              {tour.steps.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all ${i === step ? `w-4 ${tour.color.replace("text-", "bg-")}` : "w-1.5 bg-gray-200"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-gray-50">
        <span className="text-xs font-medium text-gray-700">{faq.pregunta}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-gray-300 flex-shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-3 pb-2.5 text-xs text-gray-500 leading-relaxed">{faq.respuesta}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}