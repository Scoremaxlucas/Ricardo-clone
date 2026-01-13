'use client'

import { AlertCircle, Check, Clock, Loader2, Mail, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

interface EmailChangeSectionProps {
  currentEmail: string
}

interface PendingStatus {
  hasPendingChange: boolean
  pendingEmail: string | null
  expiresAt: string | null
}

export function EmailChangeSection({ currentEmail }: EmailChangeSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  // Status beim Laden prüfen
  useEffect(() => {
    const checkPendingStatus = async () => {
      try {
        const res = await fetch('/api/account/change-email')
        if (res.ok) {
          const data = await res.json()
          setPendingStatus(data)
        }
      } catch (err) {
        console.error('Fehler beim Prüfen des Status:', err)
      } finally {
        setIsLoadingStatus(false)
      }
    }
    checkPendingStatus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!newEmail.trim()) {
      setError('Bitte geben Sie eine E-Mail-Adresse ein')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      return
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError('Die neue E-Mail-Adresse ist identisch mit Ihrer aktuellen')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/account/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail: newEmail.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Ein Fehler ist aufgetreten')
        return
      }

      toast.success('Bestätigungs-E-Mail wurde gesendet!')
      setIsEditing(false)
      setNewEmail('')
      setPassword('')

      // Status neu laden
      const statusRes = await fetch('/api/account/change-email')
      if (statusRes.ok) {
        setPendingStatus(await statusRes.json())
      }
    } catch (err) {
      setError('Ein Netzwerkfehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!pendingStatus?.hasPendingChange) return

    try {
      const res = await fetch('/api/account/change-email', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Ausstehende E-Mail-Änderung wurde abgebrochen')
        setPendingStatus({ hasPendingChange: false, pendingEmail: null, expiresAt: null })
      }
    } catch (err) {
      toast.error('Fehler beim Abbrechen')
    }
  }

  const formatExpiresAt = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours} Std. ${minutes} Min.`
    }
    return `${minutes} Min.`
  }

  if (isLoadingStatus) {
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center text-sm font-medium text-gray-700">
          <Mail className="mr-2 h-4 w-4" />
          E-Mail-Adresse
        </div>
        <div className="flex h-[44px] items-center justify-center rounded-md border border-gray-300 bg-gray-50">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <label className="mb-2 flex items-center text-sm font-medium text-gray-700">
        <Mail className="mr-2 h-4 w-4" />
        E-Mail-Adresse
      </label>

      {/* Ausstehende Änderung anzeigen */}
      {pendingStatus?.hasPendingChange && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-800">Ausstehende E-Mail-Änderung</p>
              <p className="mt-1 text-amber-700">
                Eine Bestätigungs-E-Mail wurde an{' '}
                <span className="font-medium">{pendingStatus.pendingEmail}</span> gesendet.
              </p>
              {pendingStatus.expiresAt && (
                <p className="mt-1 text-xs text-amber-600">
                  Gültig für noch: {formatExpiresAt(pendingStatus.expiresAt)}
                </p>
              )}
              <button
                type="button"
                onClick={handleCancel}
                className="mt-2 text-sm font-medium text-amber-700 underline hover:text-amber-800"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aktuelle E-Mail */}
      <div className="flex gap-2">
        <input
          type="email"
          value={currentEmail}
          disabled
          className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
        />
        {!isEditing && !pendingStatus?.hasPendingChange && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-shrink-0 rounded-md border border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            Ändern
          </button>
        )}
      </div>

      {/* Änderungsformular */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <label htmlFor="newEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
              Neue E-Mail-Adresse
            </label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="neue@email.ch"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Passwort zur Bestätigung
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ihr aktuelles Passwort"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">Optional, aber empfohlen für zusätzliche Sicherheit</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Senden...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Bestätigung senden
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setNewEmail('')
                setPassword('')
                setError('')
              }}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Abbrechen
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Nach dem Absenden erhalten Sie eine E-Mail an die neue Adresse. Klicken Sie auf den
            Bestätigungslink, um die Änderung abzuschließen.
          </p>
        </form>
      )}

      {!isEditing && !pendingStatus?.hasPendingChange && (
        <p className="mt-1 text-xs text-gray-500">
          Klicken Sie auf "Ändern", um Ihre E-Mail-Adresse zu aktualisieren. Eine Bestätigung per E-Mail ist erforderlich.
        </p>
      )}
    </div>
  )
}
