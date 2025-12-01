'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: string
  onDisputeOpened?: () => void
  isSeller?: boolean // Gibt an, ob der aktuelle Benutzer der Verkäufer ist
}

// Dispute-Gründe für Käufer
const BUYER_DISPUTE_REASONS = [
  { value: 'item_not_received', label: 'Artikel nicht erhalten' },
  { value: 'item_damaged', label: 'Artikel beschädigt' },
  { value: 'item_wrong', label: 'Falscher Artikel geliefert' },
  { value: 'payment_not_confirmed', label: 'Zahlung nicht bestätigt' },
  { value: 'seller_not_responding', label: 'Verkäufer antwortet nicht' },
  { value: 'other', label: 'Sonstiges' },
]

// Dispute-Gründe für Verkäufer
const SELLER_DISPUTE_REASONS = [
  { value: 'payment_not_confirmed', label: 'Zahlung nicht bestätigt' },
  { value: 'buyer_not_responding', label: 'Käufer antwortet nicht' },
  { value: 'other', label: 'Sonstiges' },
]

export function DisputeModal({
  isOpen,
  onClose,
  purchaseId,
  onDisputeOpened,
  isSeller = false,
}: DisputeModalProps) {
  // Wähle die passenden Gründe basierend auf der Rolle
  const DISPUTE_REASONS = isSeller ? SELLER_DISPUTE_REASONS : BUYER_DISPUTE_REASONS
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason || !description.trim()) {
      toast.error('Bitte wählen Sie einen Grund aus und geben Sie eine Beschreibung ein')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          description: description.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Dispute erfolgreich eröffnet. Ein Admin wird sich in Kürze darum kümmern.')
        setReason('')
        setDescription('')
        onDisputeOpened?.()
        onClose()
      } else {
        toast.error(data.message || 'Fehler beim Eröffnen des Disputes')
      }
    } catch (error) {
      console.error('Error opening dispute:', error)
      toast.error('Fehler beim Eröffnen des Disputes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Dispute eröffnen</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Wichtig:</strong> Ein Dispute sollte nur eröffnet werden, wenn Sie ein Problem
              haben, das nicht durch direkte Kommunikation gelöst werden kann. Ein Admin wird sich
              in Kürze um Ihren Dispute kümmern.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Grund für den Dispute <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Bitte wählen...</option>
              {DISPUTE_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Beschreibung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="Bitte beschreiben Sie das Problem im Detail..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Je detaillierter Ihre Beschreibung ist, desto schneller kann der Admin helfen.
            </p>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                'Dispute eröffnen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
