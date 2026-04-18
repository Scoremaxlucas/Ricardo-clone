'use client'

import type { CreditCheckStatus } from '@prisma/client'
import { CreditCheckBadge } from '@/components/rental/CreditCheckBadge'
import type { CreditCheckResult } from '@/lib/rental/types'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

type Props = {
  creditCheckStatus: CreditCheckStatus
  creditCheckResult: CreditCheckResult | null
  creditCheckExpiresAt: Date | null
}

function isApprovedValid(status: CreditCheckStatus, expiresAt: Date | null): boolean {
  if (status !== 'APPROVED') return false
  if (!expiresAt) return false
  return expiresAt.getTime() > Date.now()
}

export function ProfilCreditPanel({ creditCheckStatus, creditCheckResult, creditCheckExpiresAt }: Props) {
  const approvedValid = isApprovedValid(creditCheckStatus, creditCheckExpiresAt)
  const approvedButExpired =
    creditCheckStatus === 'EXPIRED' ||
    (creditCheckStatus === 'APPROVED' &&
      (!creditCheckExpiresAt || creditCheckExpiresAt.getTime() <= Date.now()))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Betreibungsregisterauszug</h2>

      {creditCheckStatus === 'NONE' ? (
        <div className="mt-4 rounded-xl bg-slate-100 px-4 py-4 text-sm text-slate-700">
          <p>Noch kein Auszug hochgeladen</p>
          <Link
            href="/profil/betreibungsregister"
            className="mt-3 inline-flex w-full justify-center rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
          >
            Jetzt hochladen
          </Link>
        </div>
      ) : null}

      {creditCheckStatus === 'PENDING' ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-700" aria-hidden />
          <div>
            <p className="font-medium">Wird geprüft…</p>
            <p className="mt-1 text-amber-800">Bitte kurz warten — die automatische Auswertung läuft.</p>
          </div>
        </div>
      ) : null}

      {creditCheckStatus === 'PENDING_MANUAL_REVIEW' ? (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-950">
          <p className="font-medium">Manuelle Prüfung läuft — wir melden uns in Kürze.</p>
        </div>
      ) : null}

      {approvedValid && creditCheckResult ? (
        <div className="mt-4 space-y-3 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-4">
          <CreditCheckBadge status="approved" creditCheckResult={creditCheckResult} />
          <p className="text-sm text-teal-900">
            Gültig bis{' '}
            {creditCheckExpiresAt ? creditCheckExpiresAt.toLocaleDateString('de-CH') : '—'}
          </p>
          <Link href="/profil/betreibungsregister" className="text-xs font-semibold text-teal-800 underline-offset-2 hover:underline">
            Neuen Auszug hochladen
          </Link>
        </div>
      ) : null}

      {approvedButExpired ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-medium">Dein Auszug ist abgelaufen. Bitte lade einen neuen hoch.</p>
          <Link
            href="/profil/betreibungsregister"
            className="mt-3 inline-flex w-full justify-center rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
          >
            Jetzt erneuern
          </Link>
        </div>
      ) : null}

      {creditCheckStatus === 'REJECTED' && !approvedButExpired ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p>
            Das Dokument konnte nicht verarbeitet werden. Bitte lade einen gültigen, max. 3 Monate alten Schweizer
            Betreibungsregisterauszug hoch.
          </p>
          <Link
            href="/profil/betreibungsregister"
            className="mt-3 inline-flex w-full justify-center rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
          >
            Erneut versuchen
          </Link>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        🔒 Dein Originaldokument ist verschlüsselt gespeichert. Vermieter sehen ausschliesslich ob Einträge vorhanden
        sind — niemals den vollen Inhalt.
      </p>
    </div>
  )
}
