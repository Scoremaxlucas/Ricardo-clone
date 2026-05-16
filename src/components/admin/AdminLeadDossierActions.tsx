'use client'

import { useState } from 'react'
import { AdminResendLeadEmailButton } from '@/components/admin/AdminResendLeadEmailButton'

export function AdminLeadDossierActions({ applicationId }: { applicationId: string }) {
  const [sending, setSending] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  async function send() {
    setSending(true)
    setInfo(null)
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/send-dossier`, { method: 'POST' })
      const json = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) throw new Error(json.message || 'Versand fehlgeschlagen')
      setInfo('Dossier wurde per E-Mail an den Vermieter gesendet.')
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Versand fehlgeschlagen')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
      >
        Als PDF exportieren
      </button>
      <button
        type="button"
        onClick={() => void send()}
        disabled={sending}
        className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        Dossier-Mail senden
      </button>
      <AdminResendLeadEmailButton
        applicationId={applicationId}
        label="Lead-Mail erneut senden"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      />
      {info ? <p className="w-full text-sm text-slate-600">{info}</p> : null}
    </div>
  )
}
