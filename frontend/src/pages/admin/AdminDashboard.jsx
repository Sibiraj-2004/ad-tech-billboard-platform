import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiUsers, HiCube, HiClipboardList, HiCurrencyRupee, HiClock, HiExclamation, HiPlusCircle } from 'react-icons/hi'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { adminAPI } from '../../api/admin'
import { formatCurrency } from '../../utils/formatters'
import { PageLoader } from '../../components/common/Spinner'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [topBillboards, setTopBillboards] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [dashRes, topRes] = await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getTopBillboards(5),
        ])
        setStats(dashRes.data.data)
        setTopBillboards(topRes.data.data || [])
      } catch (err) { /* ignore */ }
    }
    loadStats()
  }, [])

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const revRes = await adminAPI.getRevenue(period)
        setRevenueData(revRes.data.data.data || [])
      } catch (err) { /* ignore */ }
      setLoading(false)
    }
    loadRevenue()
  }, [period])

  if (loading) return <PageLoader />

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: HiUsers, color: 'from-blue-500 to-indigo-600', to: '/admin/users' },
    { label: 'Billboards', value: stats?.total_billboards || 0, icon: HiCube, color: 'from-primary-500 to-primary-600', to: '/admin/billboards' },
    { label: 'Total Bookings', value: stats?.total_bookings || 0, icon: HiClipboardList, color: 'from-emerald-500 to-emerald-600', to: '/admin/bookings' },
    { label: 'Global Revenue', value: formatCurrency(stats?.total_revenue || 0), icon: HiCurrencyRupee, color: 'from-accent-500 to-accent-600', to: '/admin/invoices' },
    { label: 'Active Bookings', value: stats?.active_bookings || 0, icon: HiClock, color: 'from-violet-500 to-violet-600', to: '/admin/bookings' },
    { label: 'Booking Request',  icon: HiPlusCircle, color: 'from-rose-500 to-rose-600', to: '/admin/requests' },
  ]

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-heading">Platform <span className="gradient-text">Analytics</span></h1>
          <p className="text-surface-400">Comprehensive overview of platform performance and revenue.</p>
        </div>
        <div className="flex gap-2">
            <Link to="/billboards/create" className="btn-primary text-sm flex items-center gap-2">
                <HiPlusCircle className="w-5 h-5" /> Add New Billboard
            </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(s => (
          <Link key={s.label} to={s.to} className="glass-card p-4 text-center border-b-2 border-b-transparent hover:border-b-primary-500 transition-all hover:scale-[1.02] transform group">
            <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-white leading-none">{s.value}</p>
            <p className="text-[10px] text-surface-400 mt-2 uppercase tracking-wider">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Graph */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Revenue Growth</h2>
            <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-surface-800 border-none rounded-lg text-xs text-white px-3 py-1.5 outline-none ring-1 ring-surface-700 cursor-pointer hover:ring-primary-500 transition-all"
            >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly View</option>
                <option value="monthly">Monthly View</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                    dataKey="period" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => {
                        const d = new Date(val);
                        if (period === 'daily') return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                        if (period === 'weekly') return `W${d.getDate()}/${d.getMonth()+1}`;
                        return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                    }}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#FB923C' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toDateString()}
                />
                <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#FB923C" 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    strokeWidth={3}
                    animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Billboards */}
        <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-6">Hot Inventory</h2>
            <div className="space-y-4">
                {topBillboards.map((b, i) => (
                    <div key={b.billboard_id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-surface-500 w-4">{i + 1}</span>
                            <div>
                                <p className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">{b.title}</p>
                                <p className="text-[10px] text-surface-400 uppercase">{b.city}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-white">{formatCurrency(b.total_revenue)}</p>
                            <p className="text-[10px] text-emerald-400 font-medium">{b.total_bookings} bookings</p>
                        </div>
                    </div>
                ))}
            </div>
            <Link to="/admin/billboards" className="mt-8 block text-center py-2 rounded-lg bg-surface-800 text-sm text-surface-400 hover:text-white transition-colors">
                View All Listings
            </Link>
        </div>
      </div>

    </div>
  )
}
