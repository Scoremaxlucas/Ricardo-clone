'use client'

import { Calendar, Flag, Trash2, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface UserReport {
  id: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reporter: {
    id: string
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    nickname: string | null
  }
  reviewer: {
    id: string
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    nickname: string | null
  } | null
  reviewedAt: string | null
  resolution: string | null
}

interface UserReportsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
  onReportRemoved?: () => void
}

const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  fraud: 'Betrug',
  harassment: 'Belästigung',
  inappropriate: 'Unangemessen',
  scam: 'Betrüger',
  fake_account: 'Fake-Account',
  other: 'Sonstiges',
}

const statusLabels: Record<string, string> = {
  pending: 'Ausstehend',
  reviewing: 'In Prüfung',
  resolved: 'Erledigt',
  dismissed: 'Abgelehnt',
}

export function UserReportsModal({
  isOpen,
  onClose,
  userId,
  userName,
  onReportRemoved,
}: UserReportsModalProps) {
  const [reports, setReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadReports()
    }
  }, [isOpen, userId])

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reports`)
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      } else {
        toast.error('Fehler beim Laden der Meldungen')
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Fehler beim Laden der Meldungen')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const getReporterName = (reporter: UserReport['reporter']) => {
    return (
      reporter.name ||
      `${reporter.firstName} ${reporter.lastName}` ||
      reporter.nickname ||
      reporter.email
    )
  }

  const handleRemoveReport = async (reportId: string) => {
    if (
      !confirm(
        'Möchten Sie diese Meldung wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden.'
      )
    ) {
      return
    }

    setDeletingReportId(reportId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Meldung wurde entfernt')
        // Entferne Report aus der Liste
        setReports(reports.filter(r => r.id !== reportId))
        // Benachrichtige Parent-Komponente
        if (onReportRemoved) {
          onReportRemoved()
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        toast.error(errorData.message || 'Fehler beim Entfernen der Meldung')
      }
    } catch (error) {
      console.error('Error removing report:', error)
      toast.error('Fehler beim Entfernen der Meldung')
    } finally {
      setDeletingReportId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Flag className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Meldungen</h2>
              <p className="text-sm text-gray-500">
                {userName || 'Benutzer'} - {reports.length} Meldung
                {reports.length !== 1 ? 'en' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <Flag className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Keine Meldungen vorhanden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div
                  key={report.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            report.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : report.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusLabels[report.status] || report.status}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          {reasonLabels[report.reason] || report.reason}
                        </span>
                      </div>

                      <div className="mb-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Gemeldet von:</span>
                          <span>{getReporterName(report.reporter)}</span>
                          <span className="text-gray-400">({report.reporter.email})</span>
                        </div>
                      </div>

                      {report.description && (
                        <div className="mb-2 rounded-lg bg-gray-50 p-3">
                          <p className="text-sm text-gray-700">{report.description}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.createdAt).toLocaleString('de-CH', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {report.reviewer && report.reviewedAt && (
                        <div className="mt-2 rounded-lg bg-blue-50 p-3">
                          <div className="text-xs text-gray-600">
                            <div className="font-medium">Bearbeitet von:</div>
                            <div>
                              {report.reviewer.name ||
                                `${report.reviewer.firstName} ${report.reviewer.lastName}` ||
                                report.reviewer.nickname ||
                                report.reviewer.email}
                            </div>
                            <div className="mt-1">
                              {new Date(report.reviewedAt).toLocaleString('de-CH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            {report.resolution && (
                              <div className="mt-1 font-medium">Lösung: {report.resolution}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {report.status === 'pending' && (
                        <button
                          onClick={() => handleRemoveReport(report.id)}
                          disabled={deletingReportId === report.id}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Meldung entfernen"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
