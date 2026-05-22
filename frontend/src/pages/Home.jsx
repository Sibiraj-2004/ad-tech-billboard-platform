/**
 * Home / Landing Page
 * Premium hero section with gradient backgrounds, stats, and featured billboards
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiSearch, HiLocationMarker, HiTrendingUp, HiUsers, HiCube } from 'react-icons/hi'
import { billboardsAPI } from '../api/billboards'
import BillboardCard from '../components/billboard/BillboardCard'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const { data } = await billboardsAPI.list({ per_page: 6, sort_by: 'created_at', order: 'desc' })
        setFeatured(data.data || [])
      } catch (err) {
        // Silently fail — landing page should still render
      }
    }
    loadFeatured()
  }, [])

  return (
    <div>
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950 via-surface-950 to-secondary-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6 animate-fade-in">
              <HiTrendingUp className="w-4 h-4" />
              <span>The Future of Billboard Advertising</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold font-display tracking-tight animate-fade-in">
              <span className="text-white">Book Premium</span>
              <br />
              <span className="gradient-text">Billboard Spaces</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-surface-300 max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Discover and book outdoor advertising spaces across the country. 
              Find the perfect location, compare prices, and launch your campaign in minutes.
            </p>

            {/* Search Bar */}
            <div className="mt-10 max-w-2xl mx-auto animate-slide-up">
              <div className="flex items-center bg-surface-800/80 backdrop-blur-xl rounded-2xl border border-surface-700/50 p-2 shadow-glass-lg focus-within:border-primary-500/50 transition-all">
                <HiLocationMarker className="w-5 h-5 text-primary-400 ml-4" />
                <input
                  type="text"
                  placeholder="Search by city, location, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-surface-400 focus:outline-none"
                />
                <Link
                  to={`/billboards${searchQuery ? `?search=${searchQuery}` : ''}`}
                  className="btn-primary !rounded-xl flex items-center gap-2"
                >
                  <HiSearch className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────── */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: HiCube, label: 'Billboards', value: '500+', color: 'from-primary-500 to-primary-600' },
              { icon: HiUsers, label: 'Advertisers', value: '1,200+', color: 'from-secondary-500 to-secondary-600' },
              { icon: HiLocationMarker, label: 'Cities', value: '50+', color: 'from-accent-500 to-accent-600' },
              { icon: HiTrendingUp, label: 'Campaigns', value: '3,000+', color: 'from-emerald-500 to-emerald-600' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-5 text-center group hover:scale-105 transition-all duration-300">
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold font-display text-white">{stat.value}</p>
                <p className="text-sm text-surface-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Billboards ───────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
              Featured <span className="gradient-text">Billboards</span>
            </h2>
            <p className="mt-3 text-surface-400 text-lg">
              Explore top billboard spaces available for your next campaign
            </p>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((billboard) => (
                <BillboardCard key={billboard.id} billboard={billboard} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-surface-400">No billboards available yet. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/billboards" className="btn-secondary inline-flex items-center gap-2">
              View All Billboards →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      {/* <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-10 sm:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-secondary-600/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
                Ready to Advertise?
              </h2>
              <p className="mt-4 text-surface-300 text-lg max-w-xl mx-auto">
                Join thousands of businesses scaling their reach with Ad-Tech.
                Sign up as a client and book your first billboard today.
              </p>
              <Link to="/register" className="btn-primary mt-8 inline-flex items-center gap-2 text-lg !px-8 !py-3">
                Join as Client →
              </Link>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  )
}
