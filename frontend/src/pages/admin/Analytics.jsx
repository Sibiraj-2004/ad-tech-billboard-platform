/**
 * Admin Analytics Page
 * Visualises revenue and platform growth using Recharts
 */

import { useState, useEffect } from 'react'
import { HiTrendingUp, HiCurrencyRupee, HiCalendar } from 'react-icons/hi'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { adminAPI } from '../../api/admin'
import { formatCurrency } from '../../utils/formatters'
import { PageLoader } from '../../components/common/Spinner'
import Card from '../../components/common/Card'

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('monthly')
  const [revenueData, setRevenueData] = useState([])
  const [topBillboards, setTopBillboards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [revRes, topRes] = await Promise.all([
          adminAPI.getRevenue(period),
          adminAPI.getTopBillboards(10)
        ])
        setRevenueData(revRes.data.data.data || [])
        setTopBillboards(topRes.data.data || [])
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    fetchData()
  }, [period])

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-heading !mb-1">Platform <span className="gradient-text">Analytics</span></h1>
          <p className="text-surface-400">Track revenue, bookings and billboard performance</p>
        </div>
        
        <div className="flex bg-surface-800 rounded-xl p-1 border border-surface-700">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                period === p 
                ? 'bg-primary-600 text-white shadow-neon' 
                : 'text-surface-400 hover:text-white'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Chart */}
        <Card className="p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HiCurrencyRupee className="text-accent-400" /> Revenue Growth
            </h3>
            <span className="text-xs text-surface-400">Total in chosen period</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bookings Chart */}
        <Card className="p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HiCalendar className="text-primary-400" /> Booking Volume
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="period" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px' }}
                />
                <Bar dataKey="bookings_count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Billboards Rankings */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <HiTrendingUp className="text-emerald-400" /> Top Billboard Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-surface-400 uppercase tracking-wider border-b border-surface-700">
                <th className="pb-3 px-4">Rank</th>
                <th className="pb-3 px-4">Billboard</th>
                <th className="pb-3 px-4">Location</th>
                <th className="pb-3 px-4 text-center">Bookings</th>
                <th className="pb-3 px-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {topBillboards.map((b, idx) => (
                <tr key={b.billboard_id} className="hover:bg-surface-700/20 transition-colors">
                  <td className="py-4 px-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-primary-500 text-white' : 'bg-surface-700 text-surface-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-white">{b.title}</td>
                  <td className="py-4 px-4 text-sm text-surface-300">{b.city}</td>
                  <td className="py-4 px-4 text-center text-white">{b.total_bookings}</td>
                  <td className="py-4 px-4 text-right font-bold text-accent-400">{formatCurrency(b.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
