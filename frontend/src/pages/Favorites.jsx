/**
 * Favorites Page
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiHeart, HiTrash } from 'react-icons/hi'
import { favoritesAPI } from '../api/favorites'
import { formatCurrency } from '../utils/formatters'
import { getImageUrl } from '../utils/helpers'
import { PageLoader } from '../components/common/Spinner'
import Pagination from '../components/common/Pagination'
import toast from 'react-hot-toast'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await favoritesAPI.list({ page, per_page: 12 })
      setFavorites(data.data || [])
      setMeta(data.meta || { total_pages: 1 })
    } catch (err) { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  const removeFav = async (billboardId) => {
    try {
      await favoritesAPI.remove(billboardId)
      setFavorites(favorites.filter(f => f.billboard_id !== billboardId))
      toast.success('Removed from favorites')
    } catch (err) { toast.error('Failed to remove') }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <HiHeart className="w-8 h-8 text-red-400" />
        <h1 className="section-heading !mb-0">My Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <HiHeart className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-xl text-surface-400">No favorites yet</p>
          <p className="text-surface-500 mt-2">Browse billboards and save your favorites</p>
          <Link to="/billboards" className="btn-primary mt-6 inline-block">Browse Billboards</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(fav => (
            <div key={fav.id} className="glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="relative h-44 overflow-hidden">
                <img src={getImageUrl(fav.billboard_primary_image)} alt={fav.billboard_title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />
                <button onClick={() => removeFav(fav.billboard_id)} className="absolute top-3 right-3 p-2 rounded-full bg-red-600/80 text-white hover:bg-red-500 transition-colors">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
              <Link to={`/billboards/${fav.billboard_id}`} className="block p-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">{fav.billboard_title}</h3>
                <p className="text-sm text-surface-400 mt-1">{fav.billboard_city}</p>
                <p className="text-lg font-bold text-white mt-2">{formatCurrency(fav.billboard_price_per_day)}<span className="text-sm text-surface-400 font-normal">/day</span></p>
              </Link>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={meta.total_pages} onPageChange={setPage} />
    </div>
  )
}
