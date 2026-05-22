/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom'
import { HiArrowLeft } from 'react-icons/hi'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-9xl font-black text-surface-800 drop-shadow-neon select-none">404</h1>
      <div className="mt-4 space-y-2">
        <h2 className="text-3xl font-bold font-display gradient-text">Page Lost in Space</h2>
        <p className="text-surface-400 max-w-md mx-auto">
          The page you're looking for was moved, removed, or never existed in the first place.
        </p>
      </div>
      
      <div className="mt-10">
        <Link to="/" className="btn-primary flex items-center gap-2 group">
          <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Safety
        </Link>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 blur-[120px] rounded-full" />
      </div>
    </div>
  )
}
