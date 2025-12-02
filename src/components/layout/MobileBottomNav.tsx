'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, Heart, Plus, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/LanguageContext'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useLanguage()

  // Verstecke auf bestimmten Seiten (z.B. Login, Register, Admin)
  const hideOnPages = ['/login', '/register', '/admin']
  const shouldHide = hideOnPages.some(page => pathname?.startsWith(page))

  if (shouldHide) return null

  const navItems = [
    {
      href: '/',
      label: t.header.home || 'Home',
      icon: Home,
      exact: true,
    },
    {
      href: '/search',
      label: t.header.search || 'Suche',
      icon: Search,
    },
    {
      href: '/sell',
      label: t.header.sell || 'Verkaufen',
      icon: Plus,
      highlight: true,
    },
    {
      href: '/favorites',
      label: t.header.favorites || 'Favoriten',
      icon: Heart,
      requiresAuth: true,
    },
    {
      href: session?.user ? `/users/${session.user.id}` : '/login',
      label: session?.user ? (t.header.profile || 'Profil') : (t.header.login || 'Anmelden'),
      icon: User,
    },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.href, item.exact)
          const showItem = !item.requiresAuth || session?.user

          if (!showItem) return null

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition-colors ${
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div
                className={`relative flex items-center justify-center ${
                  item.highlight
                    ? 'rounded-full bg-primary-600 p-2 text-white'
                    : ''
                }`}
              >
                <Icon className={`h-6 w-6 ${item.highlight ? 'text-white' : ''}`} />
              </div>
              <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

