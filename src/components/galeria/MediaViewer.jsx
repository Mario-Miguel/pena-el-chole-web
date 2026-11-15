import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaViewer({ items, currentIndex, onClose, onPrev, onNext }) {
  const item = items[currentIndex];
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [uiVisible, setUiVisible] = useState(true);
  const lastTouchDist = useRef(null);
  const isPinching = useRef(false);
  const dragStart = useRef(null);
  const swipeStartX = useRef(null);
  const swipeStartY = useRef(null);

  // Reset zoom/ui cuando cambia imagen
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setUiVisible(true);
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e) => {
      if (scale > 1) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, scale]);

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      lastTouchDist.current = getTouchDist(e.touches);
      swipeStartX.current = null;
    } else if (e.touches.length === 1) {
      swipeStartX.current = e.touches[0].clientX;
      swipeStartY.current = e.touches[0].clientY;
      if (scale > 1) {
        dragStart.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
      }
    }
  }, [offset, scale]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const newDist = getTouchDist(e.touches);
      const ratio = newDist / lastTouchDist.current;
      setScale(s => Math.min(Math.max(s * ratio, 1), 4));
      lastTouchDist.current = newDist;
    } else if (e.touches.length === 1 && scale > 1 && dragStart.current) {
      setOffset({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  }, [scale]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      lastTouchDist.current = null;
    }
    if (e.touches.length === 0) {
      // Detectar swipe horizontal para navegar (solo sin zoom)
      if (scale === 1 && swipeStartX.current !== null && e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - swipeStartX.current;
        const dy = e.changedTouches[0].clientY - swipeStartY.current;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
          if (dx < 0 && currentIndex < items.length - 1) onNext();
          else if (dx > 0 && currentIndex > 0) onPrev();
          swipeStartX.current = null;
          dragStart.current = null;
          return;
        }
      }
      dragStart.current = null;
      swipeStartX.current = null;
      setScale(s => {
        if (s <= 1) { setOffset({ x: 0, y: 0 }); return 1; }
        return s;
      });
    }
  }, [scale, currentIndex, items.length, onNext, onPrev]);

  // Tap: toggle UI / doble tap para zoom
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const handleImageTap = useCallback((e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // Doble tap → zoom
      clearTimeout(tapTimer.current);
      setScale(s => { if (s > 1) { setOffset({ x: 0, y: 0 }); return 1; } return 2.5; });
    } else {
      // Tap simple → toggle UI (con delay para no confundir con doble)
      tapTimer.current = setTimeout(() => {
        setUiVisible(v => !v);
      }, 200);
    }
    lastTap.current = now;
  }, []);

  if (!item) return null;

  const canGoLeft = currentIndex > 0 && scale === 1;
  const canGoRight = currentIndex < items.length - 1 && scale === 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* UI superpuesta con transición */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Gradiente superior */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
            {/* Gradiente inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones UI */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 flex gap-2 z-30"
            onClick={e => e.stopPropagation()}
          >
            {item.tipo !== "video" && (
              <a
                href={item.url}
                download={item.nombre || "foto"}
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center"
                title="Descargar"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flechas de navegación — encima de la imagen, siempre visibles si hay UI */}
      <AnimatePresence>
        {uiVisible && canGoLeft && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={e => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 z-30 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/30 text-white flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}
        {uiVisible && canGoRight && (
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            onClick={e => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 z-30 w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/30 text-white flex items-center justify-center"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Imagen — ocupa toda la pantalla */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {item.tipo === "video" ? (
          <div className="flex flex-col items-center justify-center bg-gray-900 rounded-xl p-10 text-center mx-8">
            <span className="text-5xl mb-4">🎬</span>
            <p className="text-white/70 text-sm mb-3">{item.nombre}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-sm transition-colors">
              Abrir vídeo ↗
            </a>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transition: isPinching.current ? "none" : "transform 0.15s ease",
              transformOrigin: "center center",
              cursor: scale > 1 ? "grab" : "default",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleImageTap}
          >
            <img
              src={item.url}
              alt={item.nombre}
              style={{ maxWidth: "100vw", maxHeight: "100vh", width: "auto", height: "auto", objectFit: "contain" }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Info inferior */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 z-30 pointer-events-none"
          >
            {item.nombre && <p className="text-white/70 text-sm px-4 text-center">{item.nombre}</p>}
            <p className="text-white/40 text-xs">
              {currentIndex + 1} / {items.length}
              {scale > 1 && <span className="ml-2">· {Math.round(scale * 100)}%</span>}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}