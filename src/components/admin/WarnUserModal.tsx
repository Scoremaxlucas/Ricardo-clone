'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface WarnUserModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
  onWarned: () => void
}

const warningReasons = [
  {
    value: 'inappropriate_content',
    label: 'Unangemessener Inhalt',
    description: 'Der User hat unangemessene Inhalte veröffentlicht',
    defaultMessage:
      'Sie haben unangemessene Inhalte auf unserer Plattform veröffentlicht. Bitte beachten Sie unsere Nutzungsbedingungen und entfernen Sie solche Inhalte in Zukunft. Bei wiederholten Verstößen müssen wir Ihr Konto möglicherweise sperren.',
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Der User hat Spam-Inhalte veröffentlicht',
    defaultMessage:
      'Sie haben Spam-Inhalte auf unserer Plattform veröffentlicht. Bitte unterlassen Sie solche Aktivitäten. Wenn weiterer Spam von Ihnen festgestellt wird, müssen wir Ihr Konto blockieren.',
  },
  {
    value: 'fraud',
    label: 'Betrug',
    description: 'Verdacht auf betrügerisches Verhalten',
    defaultMessage:
      'Wir haben verdächtige Aktivitäten auf Ihrem Konto festgestellt, die auf betrügerisches Verhalten hindeuten. Bitte kontaktieren Sie unseren Support, um diese Angelegenheit zu klären. Bei bestätigtem Betrug behalten wir uns vor, Ihr Konto zu sperren.',
  },
  {
    value: 'harassment',
    label: 'Belästigung',
    description: 'Der User hat andere User belästigt',
    defaultMessage:
      'Wir haben Beschwerden über belästigendes Verhalten von Ihnen erhalten. Bitte respektieren Sie andere Nutzer unserer Plattform. Belästigung wird nicht toleriert und kann zur Sperrung Ihres Kontos führen.',
  },
  {
    value: 'terms_violation',
    label: 'Verstoß gegen Nutzungsbedingungen',
    description: 'Der User hat gegen unsere Nutzungsbedingungen verstoßen',
    defaultMessage:
      'Sie haben gegen unsere Nutzungsbedingungen verstoßen. Bitte lesen Sie unsere Nutzungsbedingungen sorgfältig durch und halten Sie sich daran. Wiederholte Verstöße können zur Sperrung Ihres Kontos führen.',
  },
  {
    value: 'fake_account',
    label: 'Fake-Account',
    description: 'Verdacht auf Fake-Account',
    defaultMessage:
      'Wir haben Anhaltspunkte dafür, dass es sich bei Ihrem Konto um einen Fake-Account handelt. Bitte kontaktieren Sie unseren Support, um Ihre Identität zu verifizieren. Unverifizierte Konten können gesperrt werden.',
  },
  {
    value: 'other',
    label: 'Sonstiges',
    description: 'Anderer Grund',
    defaultMessage:
      'Sie haben eine Verwarnung von einem Administrator erhalten. Bitte beachten Sie unsere Nutzungsbedingungen und verhalten Sie sich entsprechend den Regeln unserer Plattform.',
  },
]

export function WarnUserModal({ isOpen, onClose, userId, userName, onWarned }: WarnUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customMessage, setCustomMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Bitte wählen Sie einen Grund aus')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/warn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          message: customMessage.trim() || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Warnung wurde gesendet (Warnung #${data.warningCount})`)
        setSelectedReason('')
        setCustomMessage('')
        onWarned()
        onClose()
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unbekannter Fehler' }))
        toast.error(errorData.message || 'Fehler beim Senden der Warnung')
      }
    } catch (error) {
      console.error('Error warning user:', error)
      toast.error('Fehler beim Senden der Warnung')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setSelectedReason('')
      setCustomMessage('')
      onClose()
    }
  }

  // Setze Standardtext wenn Grund ausgewählt wird
  const handleReasonChange = (reasonValue: string) => {
    setSelectedReason(reasonValue)
    const selectedReasonData = warningReasons.find(r => r.value === reasonValue)
    if (selectedReasonData) {
      // Setze Standardtext nur wenn Textfeld leer ist oder wenn der aktuelle Text einem Standardtext entspricht
      const isDefaultText = warningReasons.some(r => r.defaultMessage === customMessage)
      if (!customMessage || isDefaultText) {
        setCustomMessage(selectedReasonData.defaultMessage)
      }
    }
  }

  if (!isOpen) return null

  const selectedReasonData = warningReasons.find(r => r.value === selectedReason)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative flex h-[90vh] max-h-[800px] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Benutzer verwarnen</h2>
              <p className="text-sm text-gray-500">
                {userName || 'Benutzer'} wird eine Verwarnung erhalten
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Grund der Verwarnung <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {warningReasons.map(reason => (
                <label
                  key={reason.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    selectedReason === reason.value
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={e => handleReasonChange(e.target.value)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{reason.label}</div>
                    <div className="text-sm text-gray-500">{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedReason && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Zusätzliche Nachricht (optional)
              </label>
              <textarea
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder="Fügen Sie hier eine zusätzliche Nachricht hinzu, die dem User angezeigt wird..."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                Diese Nachricht wird dem User zusammen mit der Verwarnung angezeigt.
              </p>
            </div>
          )}

          {selectedReasonData && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                <div className="flex-1">
                  <div className="font-medium text-orange-900">Vorschau der Verwarnung</div>
                  <div className="mt-1 text-sm text-orange-800">
                    <strong>Grund:</strong> {selectedReasonData.label}
                  </div>
                  {customMessage && (
                    <div className="mt-2 text-sm text-orange-800">
                      <strong>Nachricht:</strong> {customMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || saving}
              className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Wird gesendet...' : 'Verwarnung senden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
