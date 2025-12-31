'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  Wrench,
} from 'lucide-react'

interface OutageData {
  id: string
  title: string
  description?: string
  startedAt: string
  endedAt?: string
  durationMinutes?: number
  severity: string
  affectedServices: string[]
  isPlanned: boolean
  extensionApplied?: boolean
  extensionMinutes?: number
  auctionsExtended?: number
}

interface ServiceStatus {
  name: string
  slug: string
  status: 'operational' | 'degraded' | 'major_outage'
}

interface StatusData {
  status: 'operational' | 'degraded' | 'major_outage' | 'maintenance' | 'unknown'
  statusMessage: string
  lastUpdated: string
  activeOutages: OutageData[]
  recentOutages: OutageData[]
  services: ServiceStatus[]
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/status')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const statusData = await response.json()
      setData(statusData)
      setError(null)
    } catch (err) {
      setError('Status konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Auto-refresh alle 60 Sekunden
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'major_outage':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'maintenance':
        return <Wrench className="h-5 w-5 text-blue-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'major_outage':
        return 'bg-red-500'
      case 'maintenance':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 border-green-200'
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200'
      case 'major_outage':
        return 'bg-red-50 border-red-200'
      case 'maintenance':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} Minuten`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} Stunde${hours > 1 ? 'n' : ''}`
    return `${hours} Stunde${hours > 1 ? 'n' : ''} ${mins} Minuten`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Systemstatus</h1>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Hauptstatus */}
            <div className={`mb-8 rounded-lg border p-6 ${getStatusBg(data.status)}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(data.status)}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{data.statusMessage}</h2>
                  <p className="text-sm text-gray-600">
                    Zuletzt aktualisiert: {formatDate(data.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>

            {/* Aktive Ausfälle */}
            {data.activeOutages.length > 0 && (
              <div className="mb-8">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Aktive Störungen</h3>
                <div className="space-y-4">
                  {data.activeOutages.map((outage) => (
                    <div
                      key={outage.id}
                      className="rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        {outage.isPlanned ? (
                          <Wrench className="mt-0.5 h-5 w-5 text-blue-500" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{outage.title}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                outage.severity === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : outage.severity === 'major'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {outage.severity === 'critical'
                                ? 'Kritisch'
                                : outage.severity === 'major'
                                  ? 'Schwerwiegend'
                                  : 'Gering'}
                            </span>
                          </div>
                          {outage.description && (
                            <p className="mt-1 text-sm text-gray-600">{outage.description}</p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Beginn: {formatDate(outage.startedAt)}
                          </p>
                          {outage.affectedServices.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {outage.affectedServices.map((service) => (
                                <span
                                  key={service}
                                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dienste-Status */}
            <div className="mb-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Dienste</h3>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {data.services.map((service, index) => (
                  <div
                    key={service.slug}
                    className={`flex items-center justify-between p-4 ${
                      index !== data.services.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <span className="font-medium text-gray-900">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm ${
                          service.status === 'operational'
                            ? 'text-green-600'
                            : service.status === 'degraded'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {service.status === 'operational'
                          ? 'Funktioniert'
                          : service.status === 'degraded'
                            ? 'Eingeschränkt'
                            : 'Ausfall'}
                      </span>
                      <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(service.status)}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Letzte Vorfälle */}
            {data.recentOutages.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Vergangene Vorfälle (letzte 7 Tage)
                </h3>
                <div className="space-y-4">
                  {data.recentOutages.map((outage) => (
                    <div key={outage.id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{outage.title}</h4>
                          {outage.description && (
                            <p className="mt-1 text-sm text-gray-600">{outage.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>Beginn: {formatDate(outage.startedAt)}</span>
                            {outage.endedAt && <span>Ende: {formatDate(outage.endedAt)}</span>}
                            {outage.durationMinutes && (
                              <span>Dauer: {formatDuration(outage.durationMinutes)}</span>
                            )}
                          </div>
                          {outage.extensionApplied && outage.auctionsExtended && outage.auctionsExtended > 0 && (
                            <p className="mt-2 text-xs text-blue-600">
                              ℹ️ {outage.auctionsExtended} Auktionen wurden um{' '}
                              {outage.extensionMinutes === 60 ? '1 Stunde' : '24 Stunden'} verlängert
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info-Box */}
            <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-medium text-blue-900">Hinweis bei Systemausfällen</h4>
              <p className="mt-1 text-sm text-blue-700">
                Bei einem Systemausfall werden laufende Auktionen automatisch verlängert:
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-blue-700">
                <li>Bei Ausfällen bis 15 Minuten: Verlängerung um 1 Stunde</li>
                <li>Bei Ausfällen über 15 Minuten: Verlängerung um 24 Stunden</li>
              </ul>
              <p className="mt-2 text-sm text-blue-700">
                <Link href="/help/system-outages" className="underline hover:no-underline">
                  Mehr erfahren →
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
