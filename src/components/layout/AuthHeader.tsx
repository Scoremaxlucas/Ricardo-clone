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
}

export function AuthHeader({ showBackLink = true }: AuthHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
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
              className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600"
            >
              Zurück zur Startseite
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
