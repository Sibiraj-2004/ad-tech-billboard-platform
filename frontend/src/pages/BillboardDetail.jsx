/**
 * Billboard Detail Page
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HiLocationMarker, HiStar, HiCalendar, HiHeart, HiCurrencyRupee } from 'react-icons/hi'
import { billboardsAPI } from '../api/billboards'
import { favoritesAPI } from '../api/favorites'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getImageUrl } from '../utils/helpers'
import { PageLoader } from '../components/common/Spinner'
import Button from '../components/common/Button'
import toast from 'react-hot-toast'

export default function BillboardDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const [billboard, setBillboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [isCurrentlyBooked, setIsCurrentlyBooked] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: bbData }, { data: availData }] = await Promise.all([
          billboardsAPI.getById(id),
          billboardsAPI.getAvailability(id).catch(() => ({ data: { data: { booked_ranges: [] } } }))
        ])
        setBillboard(bbData.data)
        
        // Check if booked today
        const today = new Date().toISOString().split('T')[0]
        const ranges = availData.data?.booked_ranges || []
        const isBooked = ranges.some(r => r.status === 'confirmed' && r.start_date <= today && r.end_date >= today)
        setIsCurrentlyBooked(isBooked)
      } catch (err) {
        toast.error('Billboard not found')
      }
      setLoading(false)
    }
    load()
  }, [id])

  const toggleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); return }
    try {
      if (isFav) { await favoritesAPI.remove(id); setIsFav(false); toast.success('Removed from favorites') }
      else { await favoritesAPI.add(id); setIsFav(true); toast.success('Added to favorites') }
    } catch (err) { toast.error('Failed to update favorites') }
  }

  if (loading) return <PageLoader />
  if (!billboard) return <div className="page-container text-center py-20"><p className="text-surface-400 text-xl">Billboard not found</p></div>

  const images = billboard.images || []
  const currentImg = images[selectedImage]

  return (
    <div className="page-container animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="glass-card overflow-hidden">
            <div className="relative h-72 sm:h-96">
              <img
                src={getImageUrl(currentImg?.file_path)}
                alt={billboard.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-900/50 to-transparent" />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === selectedImage ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={getImageUrl(img.thumbnail_path || img.file_path)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="glass-card p-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">{billboard.title}</h1>
            <div className="flex items-center gap-2 mt-3 text-surface-300">
              <HiLocationMarker className="w-5 h-5 text-primary-400" />
              <span>{billboard.address}</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="badge-info capitalize">{billboard.size_type}</span>
              <span className={isCurrentlyBooked ? "badge-error" : "badge-success"}>
                {isCurrentlyBooked ? 'INACTIVE (BOOKED)' : billboard.status}
              </span>
              {billboard.is_illuminated && (
                <span className="badge-warning flex items-center gap-1"><HiStar className="w-3 h-3" /> Illuminated</span>
              )}
            </div>
            {billboard.description && (
              <div className="mt-6 pt-6 border-t border-surface-700/50">
                <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-surface-300 leading-relaxed">{billboard.description}</p>
              </div>
            )}
            {billboard.specifications && Object.keys(billboard.specifications).length > 0 && (
              <div className="mt-6 pt-6 border-t border-surface-700/50">
                <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(billboard.specifications).map(([key, val]) => (
                    <div key={key} className="bg-surface-700/30 rounded-lg p-3">
                      <p className="text-xs text-surface-400 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-white font-medium mt-0.5">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Pricing + Actions */}
        <div className="space-y-6">
          <div className="glass-card p-6 sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <HiCurrencyRupee className="w-5 h-5 text-accent-400" /> Pricing
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-surface-700/30 rounded-xl">
                <span className="text-surface-300">Per Day</span>
                <span className="text-xl font-bold text-white">{formatCurrency(billboard.price_per_day)}</span>
              </div>
              {billboard.price_per_week && (
                <div className="flex justify-between items-center p-3 bg-surface-700/30 rounded-xl">
                  <span className="text-surface-300">Per Week</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(billboard.price_per_week)}</span>
                </div>
              )}
              {billboard.price_per_month && (
                <div className="flex justify-between items-center p-3 bg-surface-700/30 rounded-xl">
                  <span className="text-surface-300">Per Month</span>
                  <span className="text-lg font-bold text-white">{formatCurrency(billboard.price_per_month)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Link to={isAuthenticated ? `/billboards/${id}/book` : '/login'} 
                className={`btn-primary w-full text-center block ${isCurrentlyBooked ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <HiCalendar className="w-5 h-5 inline mr-2" /> {isCurrentlyBooked ? 'Unavailable' : 'Book Now'}
              </Link>
              <Button variant="secondary" className="w-full" onClick={toggleFavorite}>
                <HiHeart className={`w-5 h-5 ${isFav ? 'text-red-500' : ''}`} />
                {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-700/50">
              <p className="text-xs text-surface-400">
                Location: {billboard.city}, {billboard.state}
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Listed on {formatDate(billboard.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
