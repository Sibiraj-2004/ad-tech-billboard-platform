/**
 * MyBookings Page — Client's full booking history
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiClipboardList, HiExternalLink, HiSearch, HiFilter } from 'react-icons/hi'
import { bookingsAPI } from '../api/bookings'
import { formatCurrency, formatDate } from '../utils/formatters'
import { STATUS_COLORS } from '../utils/constants'
import { PageLoader } from '../components/common/Spinner'
import toast from 'react-hot-toast'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await bookingsAPI.list({ 
        per_page: 50,
        status: filter === 'all' ? null : filter 
      })
      setBookings(res.data.data || [])
    } catch (err) {
      toast.error('Failed to load bookings')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [filter])

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-heading mb-1">My Bookings</h1>
          <p className="text-surface-400 text-sm">View and manage all your billboard reservations.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 w-4 h-4" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface-800 border border-surface-700 rounded-xl text-sm text-white focus:outline-none focus:border-primary-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiClipboardList className="w-8 h-8 text-surface-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No bookings found</h3>
            <p className="text-surface-400 mb-6">You haven't made any reservations yet.</p>
            <Link to="/billboards" className="btn-primary">Browse Billboards</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-surface-400 uppercase tracking-wider bg-surface-800/50 border-b border-surface-700">
                  <th className="px-6 py-4">Billboard</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Total Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-surface-700/20 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{booking.billboard_title}</span>
                        <span className="text-xs text-surface-400">{booking.billboard_city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-surface-300">
                        {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-white">{formatCurrency(booking.total_price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={STATUS_COLORS[booking.status] || 'badge-info'}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/billboards/${booking.billboard_id}`}
                        className="p-2 inline-flex items-center justify-center text-surface-400 hover:text-primary-400 bg-surface-800 rounded-lg transition-colors"
                        title="View Billboard"
                      >
                        <HiExternalLink className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
