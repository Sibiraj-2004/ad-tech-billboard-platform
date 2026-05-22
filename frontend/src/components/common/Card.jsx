/**
 * Card Component — Glass-morphism styled card
 */

export default function Card({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`glass-card ${hover ? 'hover:scale-[1.01]' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
