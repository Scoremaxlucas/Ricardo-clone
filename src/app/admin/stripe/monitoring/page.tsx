'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Bell,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface WebhookMetrics {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  averageProcessingTime: number
  lastEventAt: string | null
  lastErrorAt: string | null
  errorRate: number
}

export default function StripeMonitoringPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<WebhookMetrics | null>(null)
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [checkingAlerts, setCheckingAlerts] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true

    if (!isAdminInSession) {
      router.push('/')
      return
    }

    loadData()
  }, [session, status, router])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load metrics
      const metricsRes = await fetch('/api/admin/stripe/metrics')
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData.metrics)
      }

      // Load health status
      const healthRes = await fetch('/api/stripe/health')
      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealthStatus(healthData)
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/admin/dashboard"
          className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Zurück zum Dashboard
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stripe Integration Monitoring</h1>
            <p className="text-sm text-gray-600">Überwachung der Stripe-Webhook-Performance</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={checkAlerts}
              disabled={checkingAlerts}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Bell className={`mr-2 h-4 w-4 ${checkingAlerts ? 'animate-pulse' : ''}`} />
              {checkingAlerts ? 'Prüfe...' : 'Alerts prüfen'}
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">System Health</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(healthStatus.checks || {}).map(([key, check]: [string, any]) => (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    check.status === 'ok' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {check.status === 'ok' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                  </div>
                  <span
                    className={`text-sm ${check.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {check.status === 'ok' ? 'OK' : check.message || 'Error'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webhook Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gesamt Events</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
                </div>
                <Activity className="h-8 w-8 text-primary-600" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Erfolgreich</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    {metrics.successfulEvents}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Fehlgeschlagen</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">{metrics.failedEvents}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Fehlerrate</p>
                  <p className="mt-2 text-2xl font-bold text-orange-600">
                    {metrics.errorRate.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Performance</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Durchschnittliche Verarbeitungszeit</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {metrics.averageProcessingTime}ms
                </p>
              </div>
              {metrics.lastEventAt && (
                <div>
                  <p className="text-sm text-gray-500">Letztes Event</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {new Date(metrics.lastEventAt).toLocaleString('de-CH')}
                  </p>
                </div>
              )}
              {metrics.lastErrorAt && (
                <div>
                  <p className="text-sm text-gray-500">Letzter Fehler</p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {new Date(metrics.lastErrorAt).toLocaleString('de-CH')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Diese Metriken zeigen die Performance der letzten 24 Stunden.
            Die Webhook-Verarbeitung wird automatisch überwacht und bei Fehlern protokolliert.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
