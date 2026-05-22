import { useState, useEffect } from 'react'
import { HiUsers, HiMail, HiPhone, HiBadgeCheck, HiBriefcase } from 'react-icons/hi'
import { invoicesAPI } from '../../api/invoices'
import { toast } from 'react-hot-toast'
import { PageLoader } from '../../components/common/Spinner'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await invoicesAPI.listClients()
      setClients(response.data)
    } catch (error) {
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-heading">My <span className="gradient-text">Clients</span></h1>
          <p className="text-surface-400">Manage and view details of advertisers who have booked your inventory.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 glass-card p-12 text-center">
            <HiUsers className="w-12 h-12 text-surface-500 mx-auto mb-4" />
            <p className="text-surface-400">No clients found yet. Clients appear once they book your billboards.</p>
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="glass-card overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-800 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                    <HiUsers className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary-400 transition-colors">
                      {client.full_name || client.username}
                    </h3>
                    <p className="text-sm text-surface-400">@{client.username}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-surface-800">
                  <div className="flex items-center gap-3 text-sm text-surface-400">
                    <HiMail className="w-4 h-4 text-surface-500" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-3 text-sm text-surface-400">
                      <HiPhone className="w-4 h-4 text-surface-500" />
                      {client.phone}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-surface-800/50 p-3 rounded-xl border border-surface-700/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400 uppercase tracking-wider mb-1">
                      <HiBriefcase className="w-3 h-3" /> Bookings
                    </div>
                    <p className="text-xl font-bold text-white">{client.total_bookings}</p>
                  </div>
                  <div className="bg-surface-800/50 p-3 rounded-xl border border-surface-700/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent-400 uppercase tracking-wider mb-1">
                      <HiBadgeCheck className="w-3 h-3" /> Total Spent
                    </div>
                    <p className="text-xl font-bold text-white">${client.total_spent}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
