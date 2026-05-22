/**
 * Billboard Listing Page — Browse with search, filters, pagination
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HiSearch, HiAdjustments, HiX } from 'react-icons/hi'
import { billboardsAPI } from '../api/billboards'
import BillboardCard from '../components/billboard/BillboardCard'
import Pagination from '../components/common/Pagination'
import { PageLoader } from '../components/common/Spinner'
import { SIZE_TYPES, POPULAR_CITIES } from '../utils/constants'

export default function BillboardListing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [billboards, setBillboards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0 })

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    size_type: searchParams.get('size_type') || '',
    price_min: searchParams.get('price_min') || '',
    price_max: searchParams.get('price_max') || '',
    is_illuminated: searchParams.get('is_illuminated') || '',
    sort_by: 'created_at',
    order: 'desc',
  })

  const page = parseInt(searchParams.get('page') || '1')

  const fetchBillboards = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 12 }
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) params[key] = val
      })
      const { data } = await billboardsAPI.list(params)
      setBillboards(data.data || [])
      setMeta(data.meta || { page: 1, total_pages: 1, total: 0 })
    } catch (err) {
      setBillboards([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchBillboards() }, [page, searchParams])

  const applyFilters = (options = {}) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && val !== null && val !== undefined) params.set(key, val)
    })
    params.set('page', '1')
    setSearchParams(params, options)
  }

  const handleSearch = (e) => {
    if (e) e.preventDefault()
    applyFilters() // Manual trigger (Button/Enter) creates history entry
  }

  // Effect for debounced search (typed input for both Search and City)
  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    const currentCity = searchParams.get('city') || ''

    // Check if either field differs from URL state
    if (filters.search === currentSearch && filters.city === currentCity) return

    const timer = setTimeout(() => {
      applyFilters({ replace: true }) // Auto search replaces history to avoid back-button spam
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search, filters.city])

  const clearFilters = () => {
    setFilters({ search: '', city: '', size_type: '', price_min: '', price_max: '', is_illuminated: '', sort_by: 'created_at', order: 'desc' })
    setSearchParams({})
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="section-heading">Browse <span className="gradient-text">Billboards</span></h1>
        <p className="text-surface-400">Find the perfect advertising space for your campaign</p>
      </div>

      {/* Search + Filter Bar */}
      <form onSubmit={handleSearch} className="glass-card p-4 mb-6 relative z-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search billboards..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field !pl-12"
            />
          </div>
          <div className="relative sm:w-48 group z-[100]">
            <input
              type="text"
              placeholder="City..."
              value={filters.city}
              onChange={(e) => {
                setFilters({ ...filters, city: e.target.value })
                setShowCitySuggestions(true)
              }}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
              className="input-field w-full"
            />

            {showCitySuggestions && (
              <div className="absolute top-full left-0 w-full bg-gray-700 mt-2 glass-card !rounded-xl overflow-hidden py-1 border-surface-600 animate-slide-down max-h-60 overflow-y-auto shadow-2xl ring-1 ring-black/5">
                {POPULAR_CITIES.filter(c =>
                  c.toLowerCase().includes(filters.city.toLowerCase())
                ).length > 0 ? (
                  POPULAR_CITIES.filter(c =>
                    c.toLowerCase().includes(filters.city.toLowerCase())
                  ).map(city => (
                    <button
                      key={city}
                      type="button"
                      onMouseDown={() => {
                        setFilters({ ...filters, city })
                        setShowCitySuggestions(false)
                        applyFilters()
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-surface-300 hover:bg-primary-500/20 hover:text-white transition-colors"
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-xs text-surface-500 italic">No matches found</div>
                )}
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-secondary inline-flex items-center gap-2">
            <HiAdjustments className="w-5 h-5" /> Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-surface-700/50 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-down">
            <select
              value={filters.size_type}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, size_type: val });
                const params = new URLSearchParams(searchParams);
                if (val) params.set('size_type', val); else params.delete('size_type');
                params.set('page', '1');
                setSearchParams(params);
              }}
              className="input-field"
            >
              <option value="">All Sizes</option>
              {SIZE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <input type="number" placeholder="Min Price" value={filters.price_min} onChange={(e) => setFilters({ ...filters, price_min: e.target.value })} className="input-field" />
            <input type="number" placeholder="Max Price" value={filters.price_max} onChange={(e) => setFilters({ ...filters, price_max: e.target.value })} className="input-field" />
            <select
              value={filters.is_illuminated}
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, is_illuminated: val });
                const params = new URLSearchParams(searchParams);
                if (val) params.set('is_illuminated', val); else params.delete('is_illuminated');
                params.set('page', '1');
                setSearchParams(params);
              }}
              className="input-field"
            >
              <option value="">All Lighting</option>
              <option value="true">Illuminated</option>
              <option value="false">Non-illuminated</option>
            </select>
            <div className="col-span-full flex justify-end">
              <button type="button" onClick={clearFilters} className="text-sm text-surface-400 hover:text-white flex items-center gap-1">
                <HiX className="w-4 h-4" /> Clear Filters
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Results Count */}
      <p className="text-sm text-surface-400 mb-4">{meta.total} billboard{meta.total !== 1 ? 's' : ''} found</p>

      {/* Billboard Grid */}
      {loading ? (
        <PageLoader />
      ) : billboards.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-surface-400">No billboards found</p>
          <p className="text-surface-500 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {billboards.map(b => <BillboardCard key={b.id} billboard={b} />)}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={meta.page}
        totalPages={meta.total_pages}
        onPageChange={(p) => { searchParams.set('page', p); setSearchParams(searchParams) }}
      />
    </div>
  )
}
