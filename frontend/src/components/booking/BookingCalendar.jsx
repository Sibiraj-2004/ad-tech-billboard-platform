export default function BookingCalendar({ availability }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-white mb-4">Availability</h3>
      <div className="p-8 text-center bg-surface-800/50 rounded-xl border border-dashed border-surface-700">
        <p className="text-surface-400">Interactive availability calendar coming soon.</p>
        <p className="text-xs text-surface-500 mt-2">Currently showing limited booking slots.</p>
      </div>
    </div>
  );
}
