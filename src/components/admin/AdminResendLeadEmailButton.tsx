'use client'

import { useState } from 'react'

export function AdminResendLeadEmailButton({
  applicationId,
  label = 'Lead-Mail erneut senden',
  className = 'rounded-lg border border-teal-700 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60',
}: {
  applicationId: string
  label?: string
  className?: string
}) {
  const [sending, setSending] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  async function send() {
    setSending(true)
    setInfo(null)
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/resend-lead-email`, {
        method: 'POST',
      })
      const json = (await res.json().catch(() => ({}))) as {
        message?: string
        deliveredTo?: string
        intendedTo?: string
        isOverride?: boolean
      }
      if (!res.ok) throw new Error(json.message || 'Versand fehlgeschlagen')
      const parts = [`Gesendet an ${json.deliveredTo || '?'}`]
      if (json.isOverride && json.intendedTo) {
        parts.push(`(Inserat-Ziel: ${json.intendedTo}, Test-Override aktiv)`)
      }
      setInfo(parts.join(' '))
    } catch (e) {
      setInfo(e instanceof Error ? e.message : 'Versand fehlgeschlagen')
    } finally {
      setSending(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => void send()} disabled={sending} className={className}>
        {sending ? 'Sende…' : label}
      </button>
      {info ? <span className="max-w-xs text-[10px] text-slate-600">{info}</span> : null}
    </span>
  )
}
