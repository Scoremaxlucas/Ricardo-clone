'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  DollarSign,
  FileCheck,
  Receipt,
  Shield,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Stats {
  totalUsers: number
  activeUsers: number
  blockedUsers: number
  totalWatches: number
  activeWatches: number
  soldWatches: number
  totalRevenue: number
  platformMargin: number
  pendingVerifications: number
  verifiedUsers: number
  pendingDisputes: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Stats API error:', errorData)
        const errorMsg = errorData.error || errorData.message || 'Unbekannter Fehler'
        alert('Fehler beim Laden der Statistiken: ' + errorMsg)
        setLoading(false)
        return
      }

      const data = await res.json()

      // Stelle sicher, dass alle Werte Zahlen sind
      const cleanedData = {
        totalUsers: Number(data.totalUsers) || 0,
        activeUsers: Number(data.activeUsers) || 0,
        blockedUsers: Number(data.blockedUsers) || 0,
        totalWatches: Number(data.totalWatches) || 0,
        activeWatches: Number(data.activeWatches) || 0,
        soldWatches: Number(data.soldWatches) || 0,
        totalRevenue: Number(data.totalRevenue) || 0,
        platformMargin: Number(data.platformMargin) || 0,
        verifiedUsers: Number(data.verifiedUsers) || 0,
        pendingVerifications: Number(data.pendingVerifications) || 0,
        pendingDisputes: Number(data.pendingDisputes) || 0,
      }

      setStats(cleanedData)
    } catch (error: any) {
      console.error('Error loading stats:', error)
      const errorMessage = error?.message || String(error)
      alert('Fehler beim Laden der Statistiken: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Timeout: Wenn Session zu lange lädt (10 Sekunden), weiterleiten
    const timeoutId = setTimeout(() => {
      if (status === 'loading') {
        setLoading(false)
        router.push('/login')
      }
    }, 10000)

    if (status === 'loading') {
      setLoading(true)
      return () => clearTimeout(timeoutId)
    }

    // Prüfe Admin-Status und lade Statistiken
    const checkAdminAndLoad = async () => {
      if (!session?.user) {
        if (status === 'unauthenticated') {
          setLoading(false)
          const currentPath = window.location.pathname
          router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
        } else {
          setLoading(false)
        }
        return
      }

      const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

      if (isAdminInSession) {
        await loadStats()
        clearTimeout(timeoutId)
        return
      }

      // Falls nicht in Session, prüfe in DB
      try {
        const res = await fetch('/api/user/admin-status')
        const data = await res.json()
        if (data.isAdmin) {
          await loadStats()
        } else {
          setLoading(false)
          router.push('/')
        }
        clearTimeout(timeoutId)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setLoading(false)
        router.push('/')
        clearTimeout(timeoutId)
      }
    }

    checkAdminAndLoad()

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  // Zeige Ladebildschirm während Session oder Daten geladen werden
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Session wird geladen...</p>
          <Link
            href="/"
            className="mt-6 inline-block text-primary-600 underline hover:text-primary-700"
          >
            Zur Hauptseite (falls Session zu lange lädt)
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Daten werden geladen...</p>
        </div>
      </div>
    )
  }

  // Prüfe Admin-Status nur aus Session
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

  // Wenn keine Session, zeige Fehlermeldung (redirect sollte bereits passiert sein)
  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Bitte melden Sie sich an, um das Dashboard zu verwenden.</p>
          <Link href="/login" className="mt-4 text-primary-600 hover:text-primary-700">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    )
  }

  // Wenn nicht Admin, zeige Fehlermeldung (redirect sollte bereits passiert sein)
  if (!isAdminInSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin-Dashboard</h1>
          <p className="mt-2 text-gray-600">Übersicht und Verwaltung der Plattform</p>
        </div>

        {/* Statistiken */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Benutzer"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.activeUsers || 0} aktiv, ${stats?.blockedUsers || 0} blockiert`}
            icon={Users}
            color="blue"
            href="/admin/users"
          />
          <StatCard
            title="Aktive Angebote"
            value={stats?.activeWatches || 0}
            subtitle={`${stats?.totalWatches || 0} gesamt, ${stats?.soldWatches || 0} verkauft`}
            icon={ShoppingBag}
            color="green"
            href="/admin/watches"
          />
          <StatCard
            title="Gesamtumsatz"
            value={`CHF ${(stats?.totalRevenue || 0).toLocaleString('de-CH')}`}
            subtitle={`Marge: CHF ${(stats?.platformMargin || 0).toLocaleString('de-CH')}`}
            icon={DollarSign}
            color="purple"
            href="/admin/transactions"
          />
          <StatCard
            title="Verifizierungen"
            value={stats?.pendingVerifications || 0}
            subtitle={`${stats?.pendingVerifications || 0} ausstehend, ${stats?.verifiedUsers || 0} verifiziert`}
            icon={FileCheck}
            color="orange"
            href="/admin/verifications"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="Benutzerverwaltung"
            description="Benutzer verwalten, blockieren, mahnen"
            icon={Users}
            href="/admin/users"
            color="blue"
          />
          <ActionCard
            title="Verifizierungen prüfen"
            description="Ausweis-Kopien prüfen und freigeben"
            icon={FileCheck}
            href="/admin/verifications"
            color="orange"
            badge={stats?.pendingVerifications || 0}
          />
          <ActionCard
            title="Transaktionen"
            description="Alle Käufe und Verkäufe einsehen"
            icon={TrendingUp}
            href="/admin/transactions"
            color="green"
          />
          <ActionCard
            title="Angebote moderieren"
            description="Angebote prüfen und verwalten"
            icon={ShoppingBag}
            href="/admin/moderate-watches"
            color="purple"
          />
          <ActionCard
            title="Kontaktanfragen"
            description="Support-Anfragen bearbeiten"
            icon={AlertCircle}
            href="/admin/contact-requests"
            color="blue"
            badge={0}
          />
          <ActionCard
            title="Statistiken"
            description="Detaillierte Statistiken und Reports"
            icon={BarChart3}
            href="/admin/statistics"
            color="indigo"
          />
          <ActionCard
            title="Sicherheit"
            description="Blockierte Benutzer und Warnungen"
            icon={Shield}
            href="/admin/security"
            color="red"
          />
          <ActionCard
            title="Pricing verwalten"
            description="Plattform-Gebühren und Margen einstellen"
            icon={DollarSign}
            href="/admin/pricing"
            color="yellow"
          />
          <ActionCard
            title="Rechnungen & Mahnwesen"
            description="Überfällige Zahlungen verwalten"
            icon={Receipt}
            href="/admin/invoices"
            color="red"
            badge={0}
          />
          <ActionCard
            title="Disputes verwalten"
            description="Streitfälle bearbeiten und lösen"
            icon={AlertTriangle}
            href="/admin/disputes"
            color="orange"
            badge={stats?.pendingDisputes || 0}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: any
  color: string
  href?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  }

  const content = (
    <div className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-full p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}

function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  badge,
}: {
  title: string
  description: string
  icon: any
  href: string
  color: string
  badge?: number
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    red: 'text-red-600 bg-red-50',
    yellow: 'text-yellow-600 bg-yellow-50',
  }

  return (
    <Link href={href} className="block">
      <div className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {badge !== undefined && badge > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
