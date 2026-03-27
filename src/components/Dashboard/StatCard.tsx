export function StatCard({
  icon,
  label,
  value,
  color,
  onClick
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  onClick?: () => void
}) {

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center cursor-pointer hover:shadow-md transition"
    >
      <div className={`w-12 h-12 rounded-xl ${colorMap[color] || colorMap.blue} flex items-center justify-center mr-4`}>
        {icon}
      </div>

      <div>
        <div className="text-2xl font-black text-gray-900">{value}</div>
        {label && (
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}