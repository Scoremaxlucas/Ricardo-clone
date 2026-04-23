'use client'

import type { CreditCheckResult } from '@/lib/rental/types'
import { categoryLabelDe } from '@/lib/rental/badge-copy'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

export type RentalApplicationBadgeStatus =
  | 'pending_credit_check'
  | 'pending_manual_review'
  | 'approved'
  | 'rejected'

const footnote =
  'Das Originaldokument ist verschlüsselt gespeichert und kann auf begründete Anfrage eingesehen werden.'

type Props = {
  status: RentalApplicationBadgeStatus
  creditCheckResult: CreditCheckResult | null
}

export function CreditCheckBadge({ status, creditCheckResult }: Props) {
  if (status === 'pending_manual_review') {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-gray-500" />
          <div>
            <p className="font-semibold text-gray-800">Dokument wird geprüft</p>
            <p className="text-sm text-gray-600">Manuelle Überprüfung läuft — wir melden uns in Kürze.</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">{footnote}</p>
      </div>
    )
  }

  if (status === 'pending_credit_check') {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-teal-600" />
          <div>
            <p className="font-semibold text-teal-900">Betreibungsregisterauszug</p>
            <p className="text-sm text-teal-800">Automatische Auswertung läuft…</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">{footnote}</p>
      </div>
    )
  }

  if (status === 'rejected' || !creditCheckResult) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-900">Betreibungsregisterauszug</p>
            <p className="text-sm text-red-800">
              Auszug nicht akzeptiert (ungültig oder älter als 3 Monate).
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">{footnote}</p>
      </div>
    )
  }

  const r = creditCheckResult

  if (!r.hasEntries) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl border border-teal-300 bg-teal-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
          <div>
            <p className="font-semibold text-teal-900">Betreibungsregisterauszug</p>
            <p className="text-sm text-teal-800">
              Keine Einträge · Ausgestellt: {r.issueDate} · {r.canton}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500">{footnote}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-900">Betreibungsregisterauszug</p>
          <p className="text-sm text-amber-900">
            {r.entryCount} Einträge · Gesamtbetrag: {categoryLabelDe(r.totalAmountCategory)} · Ausgestellt:{' '}
            {r.issueDate}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500">{footnote}</p>
    </div>
  )
}
