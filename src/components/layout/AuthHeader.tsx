import Link from 'next/link'
import { AuthBrandLogo } from '@/components/layout/AuthBrandLogo'

interface AuthHeaderProps {
  showBackLink?: boolean
  isSic?: boolean
}

export function AuthHeader({ showBackLink = true, isSic = false }: AuthHeaderProps) {
  return (
    <header
      className={
        isSic
          ? 'border-b border-[#e7ddc4] bg-[#fbf9f3]/90 backdrop-blur-sm'
          : 'border-b border-gray-200 bg-white'
      }
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" prefetch={true} className="inline-flex items-center">
            <AuthBrandLogo isSic={isSic} />
          </Link>

          {showBackLink && (
            <Link
              href="/"
              className={
                isSic
                  ? 'text-sm font-medium text-slate-500 transition-colors hover:text-[#0e7c6b]'
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
