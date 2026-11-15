import { motion } from 'framer-motion';

export function FallaCard({ children, className = '', onClick, highlighted = false }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(99,0,39,0.15)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-[#E8E0DC] p-5
        shadow-[0_2px_12px_rgba(99,0,39,0.08)]
        ${highlighted ? 'border-l-4 border-l-[#630027]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}