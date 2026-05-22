import BillboardCard from './BillboardCard';

export default function BillboardGrid({ billboards, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[400px] bg-surface-800 rounded-2xl border border-surface-700" />
        ))}
      </div>
    );
  }

  if (billboards.length === 0) {
    return (
      <div className="text-center py-20 bg-surface-800/50 rounded-2xl border border-dashed border-surface-700">
        <p className="text-surface-400 text-lg">No billboards found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {billboards.map((billboard) => (
        <BillboardCard key={billboard.id} billboard={billboard} />
      ))}
    </div>
  );
}
