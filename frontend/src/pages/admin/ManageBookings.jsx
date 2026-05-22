/**
 * Admin Manage Bookings Page
 */

import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { STATUS_COLORS } from '../../utils/constants'
import { PageLoader } from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

export default function ManageBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (statusFilter) params.status = statusFilter
      const { data } = await adminAPI.listBookings(params)
      setBookings(data.data || [])
      setMeta(data.meta || {})
    } catch (err) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, statusFilter])

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateBooking(id, status)
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b))
      toast.success(`Booking ${status}`)
    } catch (err) { toast.error('Failed') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading !mb-0">Manage <span className="gradient-text">Bookings</span></h1>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field !w-auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-surface-400 uppercase tracking-wider bg-surface-800/50">
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-surface-700/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-surface-300 font-mono">{b.id?.substring(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-surface-300">{formatDate(b.start_date)} — {formatDate(b.end_date)}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{formatCurrency(b.total_price)}</td>
                  <td className="px-4 py-3">
                    <span className={STATUS_COLORS[b.status]}>
                      {(b.status === 'confirmed' && new Date() >= new Date(b.start_date) && new Date() <= new Date(b.end_date)) 
                        ? 'LIVE' 
                        : b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(b.id, 'confirmed')} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Confirm</button>
                          <button onClick={() => updateStatus(b.id, 'cancelled')} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Cancel</button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateStatus(b.id, 'completed')} className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30">Complete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
    </div>
  )
}
