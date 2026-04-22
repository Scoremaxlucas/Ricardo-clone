'use client'

import type { CreditCheckStatus } from '@prisma/client'
import { useState } from 'react'

const STATUS_OPTIONS: CreditCheckStatus[] = ['NONE', 'PENDING', 'PENDING_MANUAL_REVIEW', 'APPROVED', 'EXPIRED', 'REJECTED']

export function AdminCreditCheckActions({
  userId,
  currentStatus,
  showManualReview,
}: {
  userId: string
  currentStatus: CreditCheckStatus
  showManualReview: boolean
}) {
  const [status, setStatus] = useState<CreditCheckStatus>(currentStatus)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function update(next: CreditCheckStatus, rejectionReason?: string) {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/credit-check/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, rejectionReason }),
      })
      const json = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(json.message || 'Update fehlgeschlagen')
      setStatus(next)
      setMessage('Status erfolgreich aktualisiert.')
      setTimeout(() => window.location.reload(), 500)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      {showManualReview && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm font-semibold text-orange-900">Manuelle Prüfung erforderlich</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={`/api/admin/credit-check/${userId}/document`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Dokument anzeigen
            </a>
            <button
              type="button"
              disabled={busy}
              onClick={() => void update('APPROVED')}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Genehmigen ✅
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void update('REJECTED', reason)}
              className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Ablehnen ❌
            </button>
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ablehnungsgrund für E-Mail an User"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-slate-900">Status manuell überschreiben</p>
        <div className="mt-2 flex gap-2">
          <select
            title="Neuen Credit-Check-Status auswählen"
            value={status}
            onChange={e => setStatus(e.target.value as CreditCheckStatus)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() => void update(status, status === 'REJECTED' ? reason : undefined)}
            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Speichern
          </button>
        </div>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  )
}
