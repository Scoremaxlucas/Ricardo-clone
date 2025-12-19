'use client'

import { formatIban, validateIban } from '@/lib/iban-validator'
import { AlertCircle, Banknote, CheckCircle2, Clock, Loader2, Shield, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface PayoutProfile {
  status: 'UNSET' | 'ACTIVE' | 'CHANGE_REQUESTED' | 'SUSPENDED'
  hasProfile?: boolean
  accountHolderName?: string
  ibanMasked?: string
  ibanLast4?: string
  country?: string
  hasOpenChangeRequest?: boolean
  verifiedAt?: string | null
  lockedReason?: string | null
}

interface PayoutSectionProps {
  userId: string
}

export function PayoutSection({ userId }: PayoutSectionProps) {
  const [profile, setProfile] = useState<PayoutProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInitialForm, setShowInitialForm] = useState(false)
  const [showChangeForm, setShowChangeForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state for initial setup
  const [initialForm, setInitialForm] = useState({
    accountHolderName: '',
    iban: '',
    confirmAccountOwner: false,
  })

  // Form state for change request
  const [changeForm, setChangeForm] = useState({
    accountHolderName: '',
    iban: '',
    reason: '',
  })

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/payout/profile')
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'UNSET' || !data.hasProfile) {
          setProfile({ status: 'UNSET', hasProfile: false })
        } else {
          setProfile(data)
        }
        setShowInitialForm(false)
        setShowChangeForm(false)
      }
    } catch (error) {
      console.error('Error loading payout profile:', error)
      toast.error('Fehler beim Laden der Bankverbindung')
    } finally {
      setLoading(false)
    }
  }

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate IBAN format
      const ibanValidation = validateIban(initialForm.iban.trim())
      if (!ibanValidation.valid) {
        toast.error(ibanValidation.error || 'Ungültige IBAN')
        return
      }

      const res = await fetch('/api/payout/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountHolderName: initialForm.accountHolderName.trim(),
          iban: initialForm.iban.trim(),
          confirmAccountOwner: initialForm.confirmAccountOwner,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Bankverbindung erfolgreich hinterlegt')
        setShowInitialForm(false)
        setInitialForm({ accountHolderName: '', iban: '', confirmAccountOwner: false })
        // Use response data directly to update profile immediately
        console.log('Payout profile POST response:', data)
        if (data.hasProfile || data.status === 'ACTIVE') {
          setProfile({
            status: data.status || 'ACTIVE',
            hasProfile: true,
            accountHolderName: data.accountHolderName,
            ibanMasked: data.ibanMasked,
            ibanLast4: data.ibanLast4,
            country: data.country || 'CH',
            hasOpenChangeRequest: data.hasOpenChangeRequest || false,
            verifiedAt: data.verifiedAt,
            lockedReason: data.lockedReason,
          })
        } else {
          await loadProfile()
        }
      } else {
        toast.error(data.message || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error submitting payout profile:', error)
      toast.error('Fehler beim Speichern der Bankverbindung')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate IBAN format
      const ibanValidation = validateIban(changeForm.iban.trim())
      if (!ibanValidation.valid) {
        toast.error(ibanValidation.error || 'Ungültige IBAN')
        return
      }

      const res = await fetch('/api/payout/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountHolderName: changeForm.accountHolderName.trim(),
          iban: changeForm.iban.trim(),
          reason: changeForm.reason.trim() || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Änderungsanfrage erfolgreich eingereicht')
        setShowChangeForm(false)
        setChangeForm({ accountHolderName: '', iban: '', reason: '' })
        await loadProfile()
      } else {
        toast.error(data.message || 'Fehler beim Einreichen der Anfrage')
      }
    } catch (error) {
      console.error('Error submitting change request:', error)
      toast.error('Fehler beim Einreichen der Änderungsanfrage')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const status = profile?.status || 'UNSET'

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 flex items-center text-lg font-semibold text-gray-900">
            <Banknote className="mr-2 h-5 w-5" />
            Auszahlungen / Bankverbindung
          </h3>
          <p className="text-xs text-gray-500">
            {status === 'UNSET'
              ? 'Damit wir Ihnen Verkäufe auszahlen können, hinterlegen Sie Ihre IBAN. Diese Information wird nie öffentlich angezeigt.'
              : 'Ihre Bankverbindung für Auszahlungen'}
          </p>
        </div>
      </div>

      {/* Status Display */}
      {status !== 'UNSET' && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {profile?.accountHolderName}
                </span>
                {status === 'ACTIVE' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Aktiv
                  </span>
                )}
                {status === 'CHANGE_REQUESTED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" />
                    Änderungsanfrage offen
                  </span>
                )}
                {status === 'SUSPENDED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <AlertCircle className="h-3 w-3" />
                    Gesperrt
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                IBAN: {profile?.ibanMasked || '•••• •••• •••• •••• •••• ••••'}
              </div>
              {profile?.lockedReason && (
                <div className="mt-2 text-xs text-amber-600">{profile.lockedReason}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {status === 'UNSET' && !showInitialForm && (
          <button
            type="button"
            onClick={() => setShowInitialForm(true)}
            className="w-full rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            Bankverbindung hinterlegen
          </button>
        )}

        {status === 'ACTIVE' && !showChangeForm && (
          <button
            type="button"
            onClick={() => {
              setChangeForm({
                accountHolderName: profile?.accountHolderName || '',
                iban: '',
                reason: '',
              })
              setShowChangeForm(true)
            }}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            Änderung beantragen
          </button>
        )}

        {status === 'CHANGE_REQUESTED' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                Wir prüfen Ihre Anfrage. Sie erhalten eine Benachrichtigung, sobald diese bearbeitet
                wurde.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Initial Setup Form */}
      {showInitialForm && (
        <form
          onSubmit={handleInitialSubmit}
          className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Bankverbindung hinterlegen</h4>
            <button
              type="button"
              onClick={() => {
                setShowInitialForm(false)
                setInitialForm({ accountHolderName: '', iban: '', confirmAccountOwner: false })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Kontoinhaber-Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={initialForm.accountHolderName}
              onChange={e => setInitialForm({ ...initialForm, accountHolderName: e.target.value })}
              required
              maxLength={100}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              IBAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={initialForm.iban}
              onChange={e => {
                const formatted = formatIban(e.target.value)
                setInitialForm({ ...initialForm, iban: formatted })
              }}
              required
              maxLength={25}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="CH12 3456 7890 1234 5678 9"
            />
            <p className="mt-1 text-xs text-gray-500">
              Nur Schweizer IBANs (CH) werden unterstützt
            </p>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirmAccountOwner"
              checked={initialForm.confirmAccountOwner}
              onChange={e =>
                setInitialForm({ ...initialForm, confirmAccountOwner: e.target.checked })
              }
              required
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="confirmAccountOwner" className="text-sm text-gray-700">
              Ich bestätige, dass ich Kontoinhaber bin <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </span>
              ) : (
                'Speichern'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInitialForm(false)
                setInitialForm({ accountHolderName: '', iban: '', confirmAccountOwner: false })
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Change Request Form */}
      {showChangeForm && (
        <form
          onSubmit={handleChangeRequestSubmit}
          className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">Änderung beantragen</h4>
            <button
              type="button"
              onClick={() => {
                setShowChangeForm(false)
                setChangeForm({ accountHolderName: '', iban: '', reason: '' })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-800">
                Änderungen der Bankverbindung müssen von uns geprüft werden. Dies kann 1-2 Werktage
                dauern.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Neuer Kontoinhaber-Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={changeForm.accountHolderName}
              onChange={e => setChangeForm({ ...changeForm, accountHolderName: e.target.value })}
              required
              maxLength={100}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Max Mustermann"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Neue IBAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={changeForm.iban}
              onChange={e => {
                const formatted = formatIban(e.target.value)
                setChangeForm({ ...changeForm, iban: formatted })
              }}
              required
              maxLength={25}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="CH12 3456 7890 1234 5678 9"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Grund für die Änderung (optional)
            </label>
            <textarea
              value={changeForm.reason}
              onChange={e => setChangeForm({ ...changeForm, reason: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Bitte geben Sie einen Grund für die Änderung an..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird eingereicht...
                </span>
              ) : (
                'Anfrage einreichen'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowChangeForm(false)
                setChangeForm({ accountHolderName: '', iban: '', reason: '' })
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
