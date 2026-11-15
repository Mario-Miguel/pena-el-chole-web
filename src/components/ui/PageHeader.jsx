export function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 bg-[#630027]/10 rounded-xl flex items-center justify-center">
            <Icon size={20} className="text-[#630027]" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}