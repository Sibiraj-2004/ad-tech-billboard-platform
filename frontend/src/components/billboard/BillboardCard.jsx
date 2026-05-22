/**
 * BillboardCard — Card for billboard grid/list views
 */

import { Link } from 'react-router-dom'
import { HiLocationMarker, HiStar, HiHeart } from 'react-icons/hi'
import { formatCurrency } from '../../utils/formatters'
import { getImageUrl } from '../../utils/helpers'
import { STATUS_COLORS } from '../../utils/constants'

export default function BillboardCard({ billboard, onFavorite, isFavorited = false }) {
  const primaryImage = billboard.images?.find(img => img.is_primary) || billboard.images?.[0]

  return (
    <div className="glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl(primaryImage?.file_path || billboard.primary_image)}
          alt={billboard.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/80 to-transparent" />

        {/* Status Badge */}
        <span className={`absolute top-3 left-3 ${STATUS_COLORS[billboard.status] || 'badge-info'}`}>
          {billboard.status}
        </span>

        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onFavorite(billboard.id) }}
            className="absolute top-3 right-3 p-2 rounded-full bg-surface-900/50 backdrop-blur-sm hover:bg-surface-800 transition-all"
          >
            <HiHeart className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} />
          </button>
        )}

        {/* Price */}
        <div className="absolute bottom-3 right-3">
          <span className="px-3 py-1.5 rounded-lg bg-surface-900/80 backdrop-blur-sm text-white font-bold text-sm">
            {formatCurrency(billboard.price_per_day)}<span className="text-surface-400 font-normal">/day</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <Link to={`/billboards/${billboard.id}`} className="block p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
          {billboard.title}
        </h3>

        <div className="flex items-center gap-1.5 mt-2 text-sm text-surface-400">
          <HiLocationMarker className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <span className="line-clamp-1">{billboard.city}, {billboard.state}</span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-700/50">
          <span className="text-xs px-2.5 py-1 rounded-full bg-surface-700/50 text-surface-300 capitalize">
            {billboard.size_type}
          </span>
          {billboard.is_illuminated && (
            <span className="text-xs text-amber-400 flex items-center gap-1">
              <HiStar className="w-3.5 h-3.5" /> Illuminated
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
