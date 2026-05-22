/**
 * Reusable Button Component
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'px-4 py-2 text-surface-300 hover:text-white hover:bg-surface-700/50 rounded-xl transition-all duration-200',
  }

  const sizes = {
    sm: 'text-sm px-4 py-1.5',
    md: '',
    lg: 'text-lg px-8 py-3',
  }

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} inline-flex items-center justify-center gap-2 font-medium ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
