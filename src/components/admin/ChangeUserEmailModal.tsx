'use client'

import { AlertCircle, Check, Loader2, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface ChangeUserEmailModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
  currentEmail: string
  onEmailChanged: () => void
}

export function ChangeUserEmailModal({
  isOpen,
  onClose,
  userId,
  userName,
  currentEmail,
  onEmailChanged,
}: ChangeUserEmailModalProps) {
  const [newEmail, setNewEmail] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newEmail.trim()) {
      setError('Bitte geben Sie eine neue E-Mail-Adresse ein')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      return
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError('Die neue E-Mail-Adresse ist identisch mit der aktuellen')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`/api/admin/users/${userId}/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: newEmail.trim(),
          reason: reason.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Ein Fehler ist aufgetreten')
        return
      }

      toast.success(`E-Mail wurde geändert: ${data.newEmail}`, {
        duration: 4000,
        icon: '📧',
      })

      setNewEmail('')
      setReason('')
      onEmailChanged()
      onClose()
    } catch (err) {
      setError('Ein Netzwerkfehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewEmail('')
    setReason('')
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">E-Mail ändern</h2>
              <p className="text-sm text-gray-500">
                {userName || 'Benutzer'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Hinweis:</strong> Als Admin können Sie die E-Mail-Adresse direkt ändern.
            Die neue E-Mail wird <strong>ohne Verifizierung</strong> sofort aktiv.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Aktuelle E-Mail */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Aktuelle E-Mail
            </label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
            />
          </div>

          {/* Neue E-Mail */}
          <div>
            <label htmlFor="newEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
              Neue E-Mail-Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="neue@email.ch"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
          </div>

          {/* Begründung */}
          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-gray-700">
              Begründung (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="z.B. Tippfehler korrigiert, Benutzeranfrage..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Wird für die Admin-Protokollierung verwendet
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird geändert...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  E-Mail ändern
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
