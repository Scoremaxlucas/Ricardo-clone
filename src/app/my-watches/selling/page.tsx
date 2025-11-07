'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, FileText, TrendingUp, CheckCircle, Wallet, Plus } from 'lucide-react'

export default function MySellingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const menuItems = [
    {
      title: 'Entwürfe',
      description: 'Noch nicht veröffentlichte Anzeigen',
      icon: FileText,
      href: '/my-watches/selling/drafts',
      color: 'bg-gray-100 text-gray-600',
      count: 0
    },
    {
      title: 'Am Verkaufen',
      description: 'Ihre aktiven Verkaufsanzeigen',
      icon: TrendingUp,
      href: '/my-watches/selling/active',
      color: 'bg-green-100 text-green-600',
      count: 0
    },
    {
      title: 'Verkauft',
      description: 'Ihre erfolgreichen Verkäufe',
      icon: CheckCircle,
      href: '/my-watches/selling/sold',
      color: 'bg-blue-100 text-blue-600',
      count: 0
    },
    {
      title: 'Gebühren',
      description: 'Übersicht der fälligen Gebühren',
      icon: Wallet,
      href: '/my-watches/selling/fees',
      color: 'bg-yellow-100 text-yellow-600',
      count: 0
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <Link
          href="/my-watches"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Zurück zu Meine Uhren
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Package className="h-8 w-8 mr-3 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mein Verkaufen
              </h1>
              <p className="text-gray-600 mt-1">
                Verwalten Sie Ihre Verkaufsanzeigen
              </p>
            </div>
          </div>
          <Link
            href="/sell"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Uhr verkaufen
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex p-3 rounded-lg ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {item.count > 0 && (
                    <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.count}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Statistiken
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
              <div className="text-sm text-gray-600">Aktive Anzeigen</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Erfolgreiche Verkäufe</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-primary-600 mb-2">0%</div>
              <div className="text-sm text-gray-600">Erfolgsrate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
