/**
 * Admin Logs Page
 * Auditing admin activities and system events
 */

import { useState, useEffect } from 'react'
import { HiShieldCheck, HiOutlineFingerPrint } from 'react-icons/hi'
import { adminAPI } from '../../api/admin'
import { formatDateTime } from '../../utils/formatters'
import { PageLoader } from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import Card from '../../components/common/Card'

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data } = await adminAPI.getLogs({ page, per_page: 20 })
        setLogs(data.data || [])
        setMeta(data.meta || { total_pages: 1 })
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    fetchData()
  }, [page])

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="section-heading">Audit <span className="gradient-text">Logs</span></h1>
        <p className="text-surface-400">Detailed record of admin actions and platform changes</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-surface-400 uppercase tracking-wider bg-surface-800/50">
                <th className="px-6 py-4">Event Time</th>
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Entity</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {logs.length === 0 ? (
                 <tr>
                    <td colSpan="6" className="py-20 text-center text-surface-500">No logs found</td>
                 </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-800/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-surface-400 font-mono">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary-500/10 flex items-center justify-center">
                          <HiShieldCheck className="w-3.5 h-3.5 text-primary-400" />
                        </div>
                        <span className="text-sm font-medium text-white">{log.admin_id.substring(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-700 text-surface-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-surface-300">
                        <span className="font-semibold text-white">{log.entity_type}</span>
                        <p className="text-xs text-surface-500 font-mono">{log.entity_id?.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-surface-400">
                        <HiOutlineFingerPrint />
                        {log.ip_address || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => alert(JSON.stringify(log.details, null, 2))}
                        className="text-xs text-primary-400 hover:text-primary-300 underline"
                      >
                        View JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
    </div>
  )
}
