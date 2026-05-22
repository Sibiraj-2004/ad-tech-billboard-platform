export default function DataTable({ headers, data, renderRow, loading }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-800/50 border-b border-surface-700">
              {headers.map((header) => (
                <th key={header} className="px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-widest">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {headers.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-surface-700/50 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-surface-500">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((item, index) => renderRow(item, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
