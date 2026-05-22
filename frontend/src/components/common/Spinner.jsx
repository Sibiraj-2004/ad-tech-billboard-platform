/**
 * Spinner — Loading indicator
 */

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-surface-600 border-t-primary-500`} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-surface-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
