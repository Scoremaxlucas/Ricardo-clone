'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  AlertCircle,
  AlertTriangle,
  FileCheck,
  Shield,
  BarChart3,
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

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
      console.log('Loading stats...')
      const res = await fetch('/api/admin/stats')
      console.log('Stats API response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
        console.error('Stats API error:', errorData)
        console.error('Error details:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData.error,
          errorName: errorData.errorName,
          errorCode: errorData.errorCode
        })
        const errorMsg = errorData.error || errorData.message || 'Unbekannter Fehler'
        alert('Fehler beim Laden der Statistiken: ' + errorMsg)
        setLoading(false)
        return
      }
      
      const data = await res.json()
      console.log('Stats data received:', data)
      console.log('Total users in data:', data.totalUsers)
      console.log('Data type:', typeof data)
      console.log('Full data object:', JSON.stringify(data, null, 2))
      
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
        pendingDisputes: Number(data.pendingDisputes) || 0
      }
      
      console.log('Cleaned stats data:', cleanedData)
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
        console.warn('Dashboard: Session timeout, redirecting to login...')
        setLoading(false)
        router.push('/login')
      }
    }, 10000)

    if (status === 'loading') {
      console.log('Dashboard: Session is loading...')
      setLoading(true)
      return () => clearTimeout(timeoutId)
    }

    // Session ist fertig geladen
    console.log('Dashboard: Session status:', status, 'User:', session?.user?.email)

    // Prüfe Admin-Status und lade Statistiken
    const checkAdminAndLoad = async () => {
      if (!session?.user) {
        console.log('Dashboard: No user in session')
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
      
      console.log('Dashboard: Admin check - isAdminInSession:', isAdminInSession)
      
      if (isAdminInSession) {
        console.log('Dashboard: Admin confirmed, loading stats...')
        await loadStats()
        clearTimeout(timeoutId)
        return
      }

      // Falls nicht in Session, prüfe in DB
      try {
        console.log('Dashboard: Checking admin status via API...')
        const res = await fetch('/api/user/admin-status')
        console.log('Admin status API response:', res.status)
        const data = await res.json()
        console.log('Admin status data:', data)
        if (data.isAdmin) {
          console.log('Dashboard: Admin confirmed via API, loading stats...')
          await loadStats()
        } else {
          console.log('Dashboard: Not admin, redirecting...')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Session wird geladen...</p>
          <Link 
            href="/" 
            className="mt-6 inline-block text-primary-600 hover:text-primary-700 underline"
          >
            Zur Hauptseite (falls Session zu lange lädt)
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin-Dashboard</h1>
          <p className="mt-2 text-gray-600">Übersicht und Verwaltung der Plattform</p>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  href 
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
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
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
    return (
      <Link href={href}>
        {content}
      </Link>
    )
  }

  return content
}

function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  badge
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
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`${colorClasses[color as keyof typeof colorClasses]} rounded-lg p-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {badge !== undefined && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
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
