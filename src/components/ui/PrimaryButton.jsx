import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function PrimaryButton({ children, loading, icon: Icon, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      disabled={loading}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-xl
        bg-[#630027] text-white font-semibold text-sm
        shadow-[0_4px_12px_rgba(99,0,39,0.30)]
        hover:bg-[#8B0038] active:bg-[#420019]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
      `}
      {...props}
    >
      {loading
        ? <Loader2 size={16} className="animate-spin" />
        : Icon && <Icon size={16} />
      }
      {children}
    </motion.button>
  );
}