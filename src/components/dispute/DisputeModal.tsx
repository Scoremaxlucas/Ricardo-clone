'use client'

import { AlertTriangle, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface DisputeModalProps {
  purchaseId: string
  watchTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const BUYER_REASONS = [
  { value: 'item_not_received', label: 'Artikel nicht erhalten' },
  { value: 'item_damaged', label: 'Artikel beschädigt' },
  { value: 'item_wrong', label: 'Falscher Artikel geliefert' },
  { value: 'item_not_as_described', label: 'Artikel entspricht nicht der Beschreibung' },
  { value: 'seller_not_responding', label: 'Verkäufer antwortet nicht' },
  { value: 'other', label: 'Sonstiges' },
]

export function DisputeModal({
  purchaseId,
  watchTitle,
  isOpen,
  onClose,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Bitte wählen Sie einen Grund')
      return
    }
    if (!description || description.length < 20) {
      toast.error('Bitte beschreiben Sie das Problem ausführlicher (mind. 20 Zeichen)')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/purchases/${purchaseId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Problem wurde gemeldet. Unser Team wird sich darum kümmern.')
        onSuccess?.()
        onClose()
        // Reset form
        setReason('')
        setDescription('')
      } else {
        toast.error(data.message || 'Fehler beim Melden des Problems')
      }
    } catch (error) {
      console.error('Error submitting dispute:', error)
      toast.error('Ein Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Problem melden</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Schliessen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 text-sm text-gray-600">
            Artikel: <span className="font-semibold text-gray-900">{watchTitle}</span>
          </div>

          {/* Warning */}
          <div className="mb-6 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
            <p className="font-medium">Bitte beachten Sie:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Versuchen Sie zuerst, das Problem mit dem Verkäufer zu klären</li>
              <li>Ein Dispute wird von unserem Team innerhalb von 14 Tagen bearbeitet</li>
              <li>Der Kaufprozess wird während der Bearbeitung eingefroren</li>
            </ul>
          </div>

          {/* Reason Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Was ist das Problem? <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Bitte wählen...</option>
              {BUYER_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Beschreibung <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Bitte beschreiben Sie das Problem so genau wie möglich..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/20 Zeichen (Minimum)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason || description.length < 20}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Problem melden
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
