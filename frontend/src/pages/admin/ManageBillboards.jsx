/**
 * Admin Manage Billboards Page
 */

import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { STATUS_COLORS } from '../../utils/constants'
import { PageLoader } from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

export default function ManageBillboards() {
  const [billboards, setBillboards] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })
  const [statusFilter, setStatusFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20 }
      if (statusFilter) params.status = statusFilter
      const { data } = await adminAPI.listBillboards(params)
      setBillboards(data.data || [])
      setMeta(data.meta || {})
    } catch (err) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, statusFilter])

  const moderate = async (id, status) => {
    try {
      await adminAPI.moderateBillboard(id, status)
      setBillboards(billboards.map(b => b.id === id ? { ...b, status } : b))
      toast.success(`Billboard ${status}`)
    } catch (err) { toast.error('Failed') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-heading !mb-0">Manage <span className="gradient-text">Billboards</span></h1>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field !w-auto">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-surface-400 uppercase tracking-wider bg-surface-800/50">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Price/Day</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {billboards.map(b => (
                <tr key={b.id} className="hover:bg-surface-700/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white max-w-[200px] truncate">{b.title}</td>
                  <td className="px-4 py-3 text-sm text-surface-300">{b.city}, {b.state}</td>
                  <td className="px-4 py-3 text-sm text-white">{formatCurrency(b.price_per_day)}</td>
                  <td className="px-4 py-3"><span className={STATUS_COLORS[b.status]}>{b.status}</span></td>
                  <td className="px-4 py-3 text-sm text-surface-400">{formatDate(b.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {b.status === 'pending' && (
                        <>
                          <button onClick={() => moderate(b.id, 'active')} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Approve</button>
                          <button onClick={() => moderate(b.id, 'rejected')} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Reject</button>
                        </>
                      )}
                      {b.status === 'active' && (
                        <button onClick={() => moderate(b.id, 'rejected')} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Disable</button>
                      )}
                      {b.status === 'rejected' && (
                        <button onClick={() => moderate(b.id, 'active')} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Approve</button>
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
