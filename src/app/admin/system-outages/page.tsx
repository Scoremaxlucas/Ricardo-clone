'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Square,
  Zap,
  Plus,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Trash2,
  Eye,
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
  extensionApplied: boolean
  extensionMinutes?: number
  auctionsExtended?: number
  extensionAppliedAt?: string
  createdAt: string
  creator?: { id: string; name: string; email: string }
  resolver?: { id: string; name: string; email: string }
  extender?: { id: string; name: string; email: string }
}

interface PreviewData {
  outageId: string
  durationMinutes: number
  extensionMinutes: number
  extensionLabel: string
  affectedCount: number
  affectedAuctions: Array<{
    id: string
    title: string
    currentEnd: string
    proposedEnd: string
    currentPrice: number
    seller: { id: string; name: string; email: string }
  }>
  alreadyApplied: boolean
}

const SERVICES = [
  { slug: 'website', name: 'Website' },
  { slug: 'search', name: 'Suche' },
  { slug: 'bidding', name: 'Auktionen & Gebote' },
  { slug: 'payments', name: 'Zahlungen' },
  { slug: 'notifications', name: 'Benachrichtigungen' },
  { slug: 'uploads', name: 'Bilder & Uploads' },
]

export default function SystemOutagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [outages, setOutages] = useState<OutageData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCount, setActiveCount] = useState(0)

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [selectedOutageId, setSelectedOutageId] = useState<string | null>(null)

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSeverity, setFormSeverity] = useState<'minor' | 'major' | 'critical'>('major')
  const [formServices, setFormServices] = useState<string[]>([])
  const [formIsPlanned, setFormIsPlanned] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const isAdminInSession = (session?.user as { isAdmin?: boolean })?.isAdmin === true

  useEffect(() => {
    if (status === 'loading') return
    if (!isAdminInSession) {
      router.push('/')
      return
    }
    loadOutages()
  }, [status, isAdminInSession, router])

  const loadOutages = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system-outages')
      if (res.ok) {
        const data = await res.json()
        setOutages(data.outages)
        setActiveCount(data.activeCount)
      }
    } catch (error) {
      console.error('Error loading outages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOutage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    setFormSubmitting(true)
    try {
      const res = await fetch('/api/admin/system-outages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || undefined,
          severity: formSeverity,
          affectedServices: formServices,
          isPlanned: formIsPlanned,
        }),
      })

      if (res.ok) {
        setShowCreateModal(false)
        resetForm()
        loadOutages()
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Erstellen')
      }
    } catch (error) {
      alert('Fehler beim Erstellen des Ausfalls')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleEndOutage = async (id: string) => {
    if (!confirm('Systemausfall als beendet markieren?')) return

    try {
      const res = await fetch(`/api/admin/system-outages/${id}`, {
        method: 'PATCH',
      })

      if (res.ok) {
        loadOutages()
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Beenden')
      }
    } catch (error) {
      alert('Fehler beim Beenden des Ausfalls')
    }
  }

  const handleDeleteOutage = async (id: string) => {
    if (!confirm('Diesen Ausfall-Eintrag löschen?')) return

    try {
      const res = await fetch(`/api/admin/system-outages/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadOutages()
      } else {
        const data = await res.json()
        alert(data.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      alert('Fehler beim Löschen')
    }
  }

  const handleShowPreview = async (id: string) => {
    setSelectedOutageId(id)
    setPreviewLoading(true)
    setShowPreviewModal(true)

    try {
      const res = await fetch(`/api/admin/system-outages/${id}/extend-auctions`)
      if (res.ok) {
        const data = await res.json()
        setPreviewData(data)
      }
    } catch (error) {
      console.error('Error loading preview:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleExtendAuctions = async () => {
    if (!selectedOutageId) return
    if (!confirm('Auktionen jetzt verlängern? Diese Aktion kann nicht rückgängig gemacht werden.'))
      return

    try {
      const res = await fetch(`/api/admin/system-outages/${selectedOutageId}/extend-auctions`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        setShowPreviewModal(false)
        loadOutages()
      } else {
        alert(data.error || 'Fehler bei der Verlängerung')
      }
    } catch (error) {
      alert('Fehler bei der Verlängerung')
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormSeverity('major')
    setFormServices([])
    setFormIsPlanned(false)
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min.`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} Std.`
    return `${hours} Std. ${mins} Min.`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Systemausfälle verwalten</h1>
              <p className="mt-1 text-sm text-gray-600">
                Ausfälle melden und Auktionsverlängerungen verwalten
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/status"
                target="_blank"
                className="flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Status-Seite
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={activeCount > 0}
                className="flex items-center gap-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <Plus className="h-4 w-4" />
                Ausfall melden
              </button>
            </div>
          </div>
        </div>

        {/* Aktiver Ausfall Warning */}
        {activeCount > 0 && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Es gibt {activeCount} aktive(n) Systemausfall/-älle</span>
            </div>
          </div>
        )}

        {/* Outages List */}
        <div className="space-y-4">
          {outages.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4 text-gray-600">Keine Systemausfälle verzeichnet</p>
            </div>
          ) : (
            outages.map((outage) => (
              <div
                key={outage.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${
                  !outage.endedAt ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {!outage.endedAt ? (
                      <div className="mt-0.5 animate-pulse">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                    ) : (
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{outage.title}</h3>
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
                        {outage.isPlanned && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Geplant
                          </span>
                        )}
                        {!outage.endedAt && (
                          <span className="animate-pulse rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            AKTIV
                          </span>
                        )}
                      </div>
                      {outage.description && (
                        <p className="mt-1 text-sm text-gray-600">{outage.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          Start: {formatDate(outage.startedAt)}
                        </span>
                        {outage.endedAt && (
                          <>
                            <span className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              Ende: {formatDate(outage.endedAt)}
                            </span>
                            {outage.durationMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Dauer: {formatDuration(outage.durationMinutes)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {outage.affectedServices.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {outage.affectedServices.map((service) => (
                            <span
                              key={service}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {SERVICES.find((s) => s.slug === service)?.name || service}
                            </span>
                          ))}
                        </div>
                      )}
                      {outage.extensionApplied && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                          <Zap className="h-3 w-3" />
                          {outage.auctionsExtended} Auktionen um{' '}
                          {outage.extensionMinutes === 60 ? '1 Stunde' : '24 Stunden'} verlängert
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!outage.endedAt ? (
                      <button
                        onClick={() => handleEndOutage(outage.id)}
                        className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        <Square className="h-4 w-4" />
                        Beenden
                      </button>
                    ) : (
                      <>
                        {!outage.extensionApplied && (
                          <button
                            onClick={() => handleShowPreview(outage.id)}
                            className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                          >
                            <Zap className="h-4 w-4" />
                            Auktionen verlängern
                          </button>
                        )}
                        {!outage.extensionApplied && (
                          <button
                            onClick={() => handleDeleteOutage(outage.id)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Systemausfall melden</h2>
            <form onSubmit={handleCreateOutage}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Titel *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="z.B. Serverausfall"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Beschreibung
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={2}
                    placeholder="Optionale Beschreibung..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Schweregrad
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="minor">Gering</option>
                    <option value="major">Schwerwiegend</option>
                    <option value="critical">Kritisch</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Betroffene Dienste
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((service) => (
                      <label
                        key={service.slug}
                        className="flex cursor-pointer items-center gap-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={formServices.includes(service.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormServices([...formServices, service.slug])
                            } else {
                              setFormServices(formServices.filter((s) => s !== service.slug))
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formIsPlanned}
                      onChange={(e) => setFormIsPlanned(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Geplante Wartung</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || !formTitle.trim()}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {formSubmitting ? 'Wird erstellt...' : 'Ausfall melden'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Auktionsverlängerung - Vorschau
            </h2>

            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : previewData ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Ausfallsdauer:</strong> {formatDuration(previewData.durationMinutes)}
                    <br />
                    <strong>Verlängerung:</strong> {previewData.extensionLabel}
                    <br />
                    <strong>Betroffene Auktionen:</strong> {previewData.affectedCount}
                  </p>
                </div>

                {previewData.alreadyApplied && (
                  <div className="rounded-lg bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Die Verlängerung wurde bereits angewendet.
                    </p>
                  </div>
                )}

                {previewData.affectedAuctions.length > 0 ? (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-700">Betroffene Auktionen:</h3>
                    <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                              Artikel
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                              Aktuelles Ende
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">
                              Neues Ende
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {previewData.affectedAuctions.map((auction) => (
                            <tr key={auction.id}>
                              <td className="px-3 py-2 text-gray-900">
                                <div className="max-w-[200px] truncate">{auction.title}</div>
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {formatDate(auction.currentEnd)}
                              </td>
                              <td className="px-3 py-2 font-medium text-green-600">
                                {formatDate(auction.proposedEnd)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Keine Auktionen betroffen.</p>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Fehler beim Laden der Vorschau</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewData(null)
                  setSelectedOutageId(null)
                }}
                className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
              >
                Schließen
              </button>
              {previewData && !previewData.alreadyApplied && previewData.affectedCount > 0 && (
                <button
                  onClick={handleExtendAuctions}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Zap className="mr-1 inline h-4 w-4" />
                  {previewData.affectedCount} Auktionen verlängern
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
