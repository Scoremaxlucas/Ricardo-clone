/**
 * AuthHeader - Minimal header for authentication pages
 * 
 * Shows only:
 * - Logo (clickable → homepage)
 * - Optional "Zurück zur Startseite" link
 * 
 * Does NOT show: categories, favorites, auctions, sell CTA, notifications, profile menu, language flag
 */

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

interface AuthHeaderProps {
  showBackLink?: boolean
  /** Helvenda Wohnungen: softer chrome aligned with tenant UI. */
  isWohnen?: boolean
}

export function AuthHeader({ showBackLink = true, isWohnen = false }: AuthHeaderProps) {
  return (
    <header
      className={
        isWohnen
          ? 'border-b border-[#d4eee4] bg-white/90 backdrop-blur-sm'
          : 'border-b border-gray-200 bg-white'
      }
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo - Clickable to homepage */}
          <Link href="/" prefetch={true} className="inline-flex items-center">
            <Logo size="md" />
          </Link>

          {/* Optional Back Link */}
          {showBackLink && (
            <Link
              href="/"
              className={
                isWohnen
                  ? 'text-sm font-medium text-[#5a7a6e] transition-colors hover:text-[#107a5a]'
                  : 'text-sm font-medium text-gray-600 transition-colors hover:text-primary-600'
              }
            >
              Zurück zur Startseite
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
