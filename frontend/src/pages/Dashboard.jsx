/**
 * Dashboard Page — User's bookings, stats, quick actions
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiClipboardList, HiHeart, HiCube, HiPlusCircle, HiUsers, HiDocumentText } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { bookingsAPI } from '../api/bookings'
import { favoritesAPI } from '../api/favorites'
import { invoicesAPI } from '../api/invoices'
import { formatCurrency, formatDate } from '../utils/formatters'
import { STATUS_COLORS, ROLES } from '../utils/constants'
import { PageLoader } from '../components/common/Spinner'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [myBillboards, setMyBillboards] = useState([])
  const [stats, setStats] = useState({ bookings: 0, favorites: 0, requests: 0, invoices: 0, myBillboards: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === ROLES.ADMIN) {
          const [invoicesRes, billboardsRes] = await Promise.all([
            invoicesAPI.listAdmin({ per_page: 1 }),
            billboardsAPI.listAdminListings({ per_page: 5 }),
          ])
          setMyBillboards(billboardsRes.data.data || [])
          setStats(prev => ({
            ...prev,
            invoices: invoicesRes.data.meta?.total || 0,
            myBillboards: billboardsRes.data.meta?.total || 0,
          }))
        } else {
          const [bookingsRes, favRes, invRes] = await Promise.all([
            bookingsAPI.list({ per_page: 5 }),
            favoritesAPI.list({ per_page: 1 }),
            invoicesAPI.listClient({ per_page: 1 }),
          ])
          setBookings(bookingsRes.data.data || [])
          setStats(prev => ({
            ...prev,
            bookings: bookingsRes.data.meta?.total || 0,
            favorites: favRes.data.meta?.total || 0,
            invoices: invRes.data.meta?.total || 0,
          }))
        }
      } catch (err) { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="section-heading">
          Welcome back, <span className="gradient-text">{user?.full_name || user?.username}</span>
        </h1>
        <p className="text-surface-400">Here's what's happening with your account.</p>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role === ROLES.ADMIN ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6 mb-10`}>
        {user?.role === ROLES.ADMIN ? (
          <>
            <Link to="/admin/billboards" className="stat-card hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <HiCube className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.myBillboards}</p>
                <p className="text-sm text-surface-400">My Listings</p>
              </div>
            </Link>
            <Link to="/admin/invoices" className="stat-card hover:scale-[1.02] transition-transform">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <HiDocumentText className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.invoices}</p>
                <p className="text-sm text-surface-400">Platform Invoices</p>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link to="/bookings" className="stat-card hover:scale-[1.02] hover:border-b-primary-500 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <HiClipboardList className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.bookings}</p>
                <p className="text-sm text-surface-400">Total Bookings</p>
              </div>
            </Link>
            <Link to="/favorites" className="stat-card hover:scale-[1.02] hover:border-b-primary-500 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <HiHeart className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.favorites}</p>
                <p className="text-sm text-surface-400">Favorites</p>
              </div>
            </Link>
            <Link to="/invoices" className="stat-card hover:scale-[1.02] hover:border-b-primary-500 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <HiDocumentText className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.invoices}</p>
                <p className="text-sm text-surface-400">Total Invoices</p>
              </div>
            </Link>
          </>
        )}
      </div>


      {/* Recent Activity */}
      <div className="flex flex-col gap-8">
        {/* Bookings Table - Only for Clients */}
        {user?.role !== ROLES.ADMIN && (
          <div className="glass-card p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
              <Link
                to="/bookings"
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                View all →
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-surface-400">No bookings yet.</p>
                <Link to="/billboards" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">Browse billboards →</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-surface-400 uppercase tracking-wider border-b border-surface-700">
                      <th className="pb-3 pr-4">Billboard</th>
                      <th className="pb-3 pr-4">Dates</th>
                      <th className="pb-3 pr-4">Price</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-700/50">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-surface-700/20 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="text-sm text-white font-medium truncate max-w-[200px]">
                            {booking.billboard_title}
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-sm text-surface-300">
                          {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
                        </td>
                        <td className="py-3 pr-4 text-sm text-white font-medium">
                          {formatCurrency(booking.total_price)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={STATUS_COLORS[booking.status] || 'badge-info'}>
                              {(booking.status === 'confirmed' && new Date() >= new Date(booking.start_date) && new Date() <= new Date(booking.end_date))
                                ? 'LIVE'
                                : booking.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* My Billboards Section (Admin Only) */}
        {user?.role === ROLES.ADMIN && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">My Billboard Listings</h2>
              <Link to="/billboards/create" className="text-sm text-primary-400 hover:text-primary-300">Add New +</Link>
            </div>

            {myBillboards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-surface-400">No billboards listed yet.</p>
                <Link to="/billboards/create" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">Create your first listing →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myBillboards.map(bb => (
                  <div key={bb.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                    <div>
                      <p className="text-sm font-medium text-white">{bb.title}</p>
                      <p className="text-xs text-surface-400">{bb.city}, {bb.state}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${bb.status === 'active' ? 'bg-green-500/10 text-green-400' :
                        bb.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                        {bb.status}
                      </span>
                      <p className="text-xs text-white font-bold mt-1">${bb.price_per_day}/day</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
