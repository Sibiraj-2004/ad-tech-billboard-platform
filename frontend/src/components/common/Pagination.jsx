/**
 * Pagination Component
 */

import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-1.5 rounded-lg text-sm text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">1</button>
          {start > 2 && <span className="text-surface-500">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-primary-600 text-white shadow-neon'
              : 'text-surface-400 hover:text-white hover:bg-surface-700'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-surface-500">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-3 py-1.5 rounded-lg text-sm text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
