/**
 * Admin Manage Users Page
 */

import { useState, useEffect } from 'react'
import { adminAPI } from '../../api/admin'
import { formatDate } from '../../utils/formatters'
import { STATUS_COLORS } from '../../utils/constants'
import { PageLoader } from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.listUsers({ page, per_page: 20 })
      setUsers(data.data || [])
      setMeta(data.meta || {})
    } catch (err) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  const toggleActive = async (userId, currentActive) => {
    try {
      await adminAPI.updateUser(userId, { is_active: !currentActive })
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u))
      toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`)
    } catch (err) { toast.error('Failed') }
  }

  const changeRole = async (userId, role) => {
    try {
      await adminAPI.updateUser(userId, { role })
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Role updated')
    } catch (err) { toast.error('Failed') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <h1 className="section-heading">Manage <span className="gradient-text">Users</span></h1>
      <div className="glass-card overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-surface-400 uppercase tracking-wider bg-surface-800/50">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-700/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{u.full_name || u.username}</p>
                    <p className="text-xs text-surface-400">@{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="text-xs bg-surface-700 border border-surface-600 rounded-lg px-2 py-1 text-white">
                      <option value="advertiser">Advertiser (Client)</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={u.is_active ? 'badge-success' : 'badge-danger'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u.id, u.is_active)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
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
