'use client'

import { formatTenantBonusChf } from '@/lib/wohnen/pricing'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Props = {
  initialIban: string | null
  initialAlertsEnabled: boolean
}

export function ProfilBonusSettings({ initialIban, initialAlertsEnabled }: Props) {
  const [iban, setIban] = useState(initialIban ?? '')
  const [alertsEnabled, setAlertsEnabled] = useState(initialAlertsEnabled)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setIban(initialIban ?? '')
    setAlertsEnabled(initialAlertsEnabled)
  }, [initialIban, initialAlertsEnabled])

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/tenant-profile/bonus-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonusPayoutIban: iban.trim() || null,
          listingMatchAlertsEnabled: alertsEnabled,
        }),
      })
      const data = (await res.json()) as { message?: string }
      if (!res.ok) {
        toast.error(data.message || 'Speichern fehlgeschlagen')
        return
      }
      toast.success('Gespeichert')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Einzugsbonus & Benachrichtigungen</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {formatTenantBonusChf()} Einzugsbonus von Helvenda, wenn du über uns einziehst.{' '}
        <Link href="/help/wohnungen-einzugsbonus" className="font-semibold text-teal-800 hover:underline">
          Bedingungen
        </Link>
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-800">
        IBAN für Bonus-Auszahlung (optional)
        <input
          value={iban}
          onChange={e => setIban(e.target.value)}
          placeholder="CH…"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm focus:border-[#18a87c] focus:outline-none focus:ring-2 focus:ring-[#18a87c]/20"
        />
      </label>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={alertsEnabled}
          onChange={e => setAlertsEnabled(e.target.checked)}
          className="mt-1"
        />
        <span>E-Mail, wenn ein neues Inserat zu meiner Suche passt</span>
      </label>

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="mt-5 rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? 'Speichert…' : 'Speichern'}
      </button>
    </section>
  )
}
