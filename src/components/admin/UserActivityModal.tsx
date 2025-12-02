'use client'

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Flag,
  History,
  Package,
  Shield,
  ShoppingCart,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Activity {
  id: string
  action: string
  details: any
  createdAt: Date | string
  type: string
}

interface UserActivityModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
}

const actionLabels: Record<string, { label: string; icon: any; color: string }> = {
  watch_created: {
    label: 'Artikel erstellt',
    icon: Package,
    color: 'text-blue-600 bg-blue-100',
  },
  watch_sold: {
    label: 'Artikel verkauft',
    icon: ShoppingCart,
    color: 'text-green-600 bg-green-100',
  },
  purchase_completed: {
    label: 'Kauf abgeschlossen',
    icon: ShoppingCart,
    color: 'text-green-600 bg-green-100',
  },
  user_reported: {
    label: 'Gemeldet worden',
    icon: Flag,
    color: 'text-red-600 bg-red-100',
  },
  reported_user: {
    label: 'Benutzer gemeldet',
    icon: Flag,
    color: 'text-orange-600 bg-orange-100',
  },
  contact_form_sent: {
    label: 'Kontaktformular gesendet',
    icon: FileText,
    color: 'text-purple-600 bg-purple-100',
  },
  verification_submitted: {
    label: 'Verifizierung eingereicht',
    icon: Shield,
    color: 'text-blue-600 bg-blue-100',
  },
  verification_approved: {
    label: 'Verifizierung genehmigt',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
  },
  verification_rejected: {
    label: 'Verifizierung abgelehnt',
    icon: XCircle,
    color: 'text-red-600 bg-red-100',
  },
  user_blocked: {
    label: 'Benutzer blockiert',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-100',
  },
  user_unblocked: {
    label: 'Benutzer entblockt',
    icon: UserCheck,
    color: 'text-green-600 bg-green-100',
  },
  warned: {
    label: 'Verwarnt',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-100',
  },
  admin_note_added: {
    label: 'Admin-Notiz hinzugefügt',
    icon: FileText,
    color: 'text-gray-600 bg-gray-100',
  },
  user_report_dismissed: {
    label: 'Meldung entfernt',
    icon: Flag,
    color: 'text-green-600 bg-green-100',
  },
  admin_rights_granted: {
    label: 'Admin-Rechte vergeben',
    icon: Shield,
    color: 'text-purple-600 bg-purple-100',
  },
  admin_rights_removed: {
    label: 'Admin-Rechte entfernt',
    icon: Shield,
    color: 'text-gray-600 bg-gray-100',
  },
}

export function UserActivityModal({ isOpen, onClose, userId, userName }: UserActivityModalProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && userId) {
      loadActivities()
    }
  }, [isOpen, userId])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      } else {
        toast.error('Fehler beim Laden der Aktivitäten')
      }
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Fehler beim Laden der Aktivitäten')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderActivityDetails = (activity: Activity) => {
    const actionInfo = actionLabels[activity.action] || {
      label: activity.action,
      icon: History,
      color: 'text-gray-600 bg-gray-100',
    }
    const Icon = actionInfo.icon

    switch (activity.action) {
      case 'watch_created':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.title && (
                <div className="mt-1 text-sm text-gray-600">
                  Artikel: {activity.details.title}
                  {activity.details.articleNumber && (
                    <span className="text-gray-400"> (#{activity.details.articleNumber})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 'watch_sold':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.title && (
                <div className="mt-1 text-sm text-gray-600">
                  Artikel: {activity.details.title}
                  {activity.details.articleNumber && (
                    <span className="text-gray-400"> (#{activity.details.articleNumber})</span>
                  )}
                </div>
              )}
              {activity.details?.price && (
                <div className="mt-1 text-sm text-gray-600">
                  Preis: CHF {activity.details.price.toFixed(2)}
                </div>
              )}
              {activity.details?.buyer && (
                <div className="mt-1 text-sm text-gray-600">
                  Käufer: {activity.details.buyer.name || activity.details.buyer.email}
                </div>
              )}
            </div>
          </div>
        )

      case 'purchase_completed':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.title && (
                <div className="mt-1 text-sm text-gray-600">
                  Artikel: {activity.details.title}
                  {activity.details.articleNumber && (
                    <span className="text-gray-400"> (#{activity.details.articleNumber})</span>
                  )}
                </div>
              )}
              {activity.details?.price && (
                <div className="mt-1 text-sm text-gray-600">
                  Preis: CHF {activity.details.price.toFixed(2)}
                </div>
              )}
              {activity.details?.status && (
                <div className="mt-1 text-sm text-gray-600">Status: {activity.details.status}</div>
              )}
            </div>
          </div>
        )

      case 'user_reported':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.reporter && (
                <div className="mt-1 text-sm text-gray-600">
                  Gemeldet von: {activity.details.reporter.name || activity.details.reporter.email}
                </div>
              )}
              {activity.details?.reason && (
                <div className="mt-1 text-sm text-gray-600">Grund: {activity.details.reason}</div>
              )}
              {activity.details?.description && (
                <div className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-600">
                  {activity.details.description}
                </div>
              )}
              {activity.details?.status && (
                <div className="mt-1 text-sm text-gray-600">Status: {activity.details.status}</div>
              )}
            </div>
          </div>
        )

      case 'reported_user':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.reportedUser && (
                <div className="mt-1 text-sm text-gray-600">
                  Gemeldeter Benutzer:{' '}
                  {activity.details.reportedUser.name || activity.details.reportedUser.email}
                </div>
              )}
              {activity.details?.reason && (
                <div className="mt-1 text-sm text-gray-600">Grund: {activity.details.reason}</div>
              )}
              {activity.details?.description && (
                <div className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-600">
                  {activity.details.description}
                </div>
              )}
            </div>
          </div>
        )

      case 'contact_form_sent':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.category && (
                <div className="mt-1 text-sm text-gray-600">
                  Kategorie: {activity.details.category}
                </div>
              )}
              {activity.details?.subject && (
                <div className="mt-1 text-sm text-gray-600">
                  Betreff: {activity.details.subject}
                </div>
              )}
              {activity.details?.status && (
                <div className="mt-1 text-sm text-gray-600">Status: {activity.details.status}</div>
              )}
            </div>
          </div>
        )

      case 'verification_approved':
      case 'verification_rejected':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.verificationStatus && (
                <div className="mt-1 text-sm text-gray-600">
                  Status: {activity.details.verificationStatus}
                </div>
              )}
            </div>
          </div>
        )

      case 'user_blocked':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.blockedByName && (
                <div className="mt-1 text-sm text-gray-600">
                  Blockiert von: {activity.details.blockedByName}
                  {activity.details?.blockedByEmail && (
                    <span className="text-gray-400"> ({activity.details.blockedByEmail})</span>
                  )}
                </div>
              )}
              {activity.details?.reason && (
                <div className="mt-1 text-sm text-gray-600">Grund: {activity.details.reason}</div>
              )}
            </div>
          </div>
        )

      case 'user_unblocked':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.unblockedByName && (
                <div className="mt-1 text-sm text-gray-600">
                  Entblockt von: {activity.details.unblockedByName}
                  {activity.details?.unblockedByEmail && (
                    <span className="text-gray-400"> ({activity.details.unblockedByEmail})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 'admin_rights_granted':
      case 'admin_rights_removed':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.changedByName && (
                <div className="mt-1 text-sm text-gray-600">
                  Geändert von: {activity.details.changedByName}
                  {activity.details?.changedByEmail && (
                    <span className="text-gray-400"> ({activity.details.changedByEmail})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case 'warned':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.adminName && (
                <div className="mt-1 text-sm text-gray-600">
                  Verwarnung von: {activity.details.adminName}
                  {activity.details?.adminEmail && (
                    <span className="text-gray-400"> ({activity.details.adminEmail})</span>
                  )}
                </div>
              )}
              {!activity.details?.adminName && activity.details?.adminEmail && (
                <div className="mt-1 text-sm text-gray-600">
                  Verwarnung von: {activity.details.adminEmail}
                </div>
              )}
              {activity.details?.reason && (
                <div className="mt-1 text-sm text-gray-600">Grund: {activity.details.reason}</div>
              )}
              {activity.details?.message && (
                <div className="mt-1 rounded bg-gray-50 p-2 text-sm text-gray-600">
                  {activity.details.message}
                </div>
              )}
              {activity.details?.warningCount && (
                <div className="mt-1 text-xs text-gray-500">
                  Warnung #{activity.details.warningCount}
                </div>
              )}
            </div>
          </div>
        )

      case 'admin_note_added':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.adminName && (
                <div className="mt-1 text-sm text-gray-600">
                  Admin: {activity.details.adminName}
                  {activity.details?.adminEmail && (
                    <span className="text-gray-400"> ({activity.details.adminEmail})</span>
                  )}
                </div>
              )}
              {!activity.details?.adminName && activity.details?.adminEmail && (
                <div className="mt-1 text-sm text-gray-600">
                  Admin: {activity.details.adminEmail}
                </div>
              )}
            </div>
          </div>
        )

      case 'user_report_dismissed':
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details?.reporter && (
                <div className="mt-1 text-sm text-gray-600">
                  Meldung von: {activity.details.reporter}
                </div>
              )}
              {activity.details?.reason && (
                <div className="mt-1 text-sm text-gray-600">Grund: {activity.details.reason}</div>
              )}
              {activity.details?.dismissedByName && (
                <div className="mt-1 text-sm text-gray-600">
                  Entfernt von: {activity.details.dismissedByName}
                </div>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{actionInfo.label}</div>
              {activity.details && (
                <div className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-600">
                  {JSON.stringify(activity.details, null, 2)}
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Aktivitäts-Historie</h2>
              <p className="text-sm text-gray-500">
                {userName || 'Benutzer'} - {activities.length} Aktivität
                {activities.length !== 1 ? 'en' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Schließen"
            aria-label="Schließen"
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
          ) : activities.length === 0 ? (
            <div className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">Keine Aktivitäten vorhanden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                  <div className="flex-1">{renderActivityDetails(activity)}</div>
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
