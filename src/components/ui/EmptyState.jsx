import { motion } from 'framer-motion';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center px-6"
    >
      <div className="w-20 h-20 bg-[#630027]/[0.08] rounded-full flex items-center justify-center mb-4">
        {Icon && <Icon size={36} className="text-[#630027]/50" />}
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 max-w-xs mb-4">{description}</p>
      )}
      {action && action}
    </motion.div>
  );
}