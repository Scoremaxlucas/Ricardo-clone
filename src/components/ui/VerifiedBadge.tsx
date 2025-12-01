import { Check } from 'lucide-react'

interface VerifiedBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function VerifiedBadge({ className = '', size = 'sm' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-green-500 text-white ${sizeClasses[size]} ${className}`}
      title="Verifiziertes Konto"
      aria-label="Verifiziertes Konto"
    >
      <Check className={`${sizeClasses[size]}`} strokeWidth={3} />
    </span>
  )
}
