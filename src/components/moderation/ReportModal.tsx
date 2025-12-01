'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useLanguage } from '@/contexts/LanguageContext'

interface ReportModalProps {
  itemId: string
  itemTitle: string
  isOpen: boolean
  onClose: () => void
}

export function ReportModal({ itemId, itemTitle, isOpen, onClose }: ReportModalProps) {
  const { t } = useLanguage()
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const REPORT_REASONS = [
    { value: 'spam', label: t.moderation.spam },
    { value: 'fraud', label: t.moderation.fraud },
    { value: 'wrong_category', label: t.moderation.wrongCategory },
    { value: 'inappropriate', label: t.moderation.inappropriate },
    { value: 'duplicate', label: t.moderation.duplicate },
    { value: 'other', label: t.moderation.other },
  ]

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) {
      toast.error(t.moderation.selectReason)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/watches/${itemId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description }),
      })

      const data = await res.json().catch(() => ({ message: t.moderation.unknownError }))

      if (res.ok) {
        toast.success(t.moderation.success)
        setReason('')
        setDescription('')
        onClose()
      } else {
        console.error('Report API error:', data)
        toast.error(data.message || t.moderation.error)
      }
    } catch (error: any) {
      console.error('Error reporting:', error)
      toast.error(error.message || t.moderation.tryAgain)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">{t.moderation.reportOffer}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label={t.common.cancel}
            title={t.common.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="mb-4 text-sm text-gray-600">{t.moderation.description}</p>
            <p className="mb-2 text-sm font-medium text-gray-900">"{itemTitle}"</p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t.moderation.reason} *
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              required
              aria-label={t.moderation.reason}
              title={t.moderation.reason}
            >
              <option value="">{t.common.loading}...</option>
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t.moderation.description} ({t.common.optional || 'Optional'})
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder={t.moderation.describeProblem}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? t.moderation.submitting : t.moderation.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
