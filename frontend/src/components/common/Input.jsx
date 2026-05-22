/**
 * Reusable Input Component
 */

import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-surface-300">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          ref={ref}
          className={`input-field resize-none ${error ? 'border-red-500 focus:ring-red-500/50' : ''} ${className}`}
          rows={4}
          {...props}
        />
      ) : (
        <input
          ref={ref}
          type={type}
          className={`input-field ${error ? 'border-red-500 focus:ring-red-500/50' : ''} ${className}`}
          {...props}
        />
      )}
      {error && (
        <p className="text-sm text-red-400 mt-1">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
