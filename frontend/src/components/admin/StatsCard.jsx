export default function StatsCard({ label, value, icon: Icon, color, trend }) {
  return (
    <div className="glass-card p-5 group hover:border-primary-500/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <h3 className="text-2xl font-bold font-display text-white">
            {value}
          </h3>
          {trend && (
            <p className={`mt-2 text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color || 'from-primary-500 to-primary-600'} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
