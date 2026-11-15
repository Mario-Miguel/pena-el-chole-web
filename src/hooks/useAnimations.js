/**
 * Variantes de animación reutilizables para toda la app.
 * Importar y usar con framer-motion en cualquier componente.
 */

export const pageVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } }
};

export const slideRight = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } }
};

export const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
};

export const collapseVariants = {
  hidden: { height: 0, opacity: 0 },
  show: { height: "auto", opacity: 1, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }
};

/** Props de hover/tap para tarjetas interactivas */
export const cardHover = {
  whileHover: { y: -2, boxShadow: "0 8px 24px rgba(99,0,39,0.10)" },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 }
};

/** Props de tap para botones */
export const btnTap = {
  whileTap: { scale: 0.93 },
  transition: { type: "spring", stiffness: 500, damping: 30 }
};