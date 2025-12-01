'use client'

import { useState } from 'react'
import { X, Flag, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReportUserModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fraud', label: 'Betrug / Scam' },
  { value: 'harassment', label: 'Belästigung' },
  { value: 'inappropriate', label: 'Unangemessenes Verhalten' },
  { value: 'fake_account', label: 'Fake-Account' },
  { value: 'other', label: 'Sonstiges' },
]

export function ReportUserModal({ isOpen, onClose, userId, userName }: ReportUserModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      toast.error('Bitte wählen Sie einen Grund aus', {
        position: 'top-right',
        duration: 3000,
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/users/${userId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          description: description.trim() || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('User erfolgreich gemeldet. Vielen Dank für Ihre Meldung!', {
          position: 'top-right',
          duration: 5000,
        })
        // Reset form
        setReason('')
        setDescription('')
        onClose()
      } else {
        toast.error(data.message || 'Fehler beim Melden des Users', {
          position: 'top-right',
          duration: 4000,
        })
      }
    } catch (error: any) {
      console.error('Error reporting user:', error)
      toast.error('Fehler beim Melden des Users', {
        position: 'top-right',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2">
              <Flag className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">User melden</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/80 transition-colors hover:text-white disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <p className="mb-1 font-semibold">Wichtiger Hinweis</p>
              <p>
                Sie melden den User <strong>{userName || 'Unbekannt'}</strong>. Bitte melden Sie
                nur echte Verstöße. Falsche Meldungen können zu Konsequenzen führen.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Grund für die Meldung <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map(r => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center rounded-lg border-2 p-3 transition-all ${
                      reason === r.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={e => setReason(e.target.value)}
                      className="mr-3 h-4 w-4 border-gray-300 text-red-600 focus:ring-red-500"
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-gray-900">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Zusätzliche Informationen <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Beschreiben Sie bitte kurz, warum Sie diesen User melden..."
                rows={4}
                className="w-full resize-y rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 transition-all focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || !reason}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Wird gesendet...</span>
                  </>
                ) : (
                  <>
                    <Flag className="h-5 w-5" />
                    <span>User melden</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

