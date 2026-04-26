'use client'

import { Logo } from '@/components/ui/Logo'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type VerifyCertificatePayload = {
  certificateCode: string
  issuedAt: string
  expiresAt: string
  holderName: string
  employmentLine: string
  incomeCategory: string
  incomeQualifiesUpTo: number
  creditCheckStatus: string
  creditCheckDate: string
  creditCheckCanton: string
}

type VerifyOk = { valid: true; certificate: VerifyCertificatePayload }

type VerifyFail =
  | { valid: false; reason: 'NOT_FOUND' | 'REVOKED' }
  | { valid: false; reason: 'EXPIRED'; expiredAt?: string; certificate?: VerifyCertificatePayload }

type State = { loading: true } | { loading: false; data: VerifyOk | VerifyFail }

function daysRemaining(expiresAtIso: string): number {
  const end = new Date(expiresAtIso).getTime()
  return Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000))
}

export function VerifyPageClient({ code }: { code: string }) {
  const [state, setState] = useState<State>({ loading: true })
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    const enc = encodeURIComponent(code)
    void fetch(`/api/certificate/verify/${enc}`)
      .then(r => r.json())
      .then((data: VerifyOk | VerifyFail) => {
        setState({ loading: false, data })
      })
      .catch(() => {
        setState({ loading: false, data: { valid: false, reason: 'NOT_FOUND' } })
      })
  }, [code])

  return (
    <div className="min-h-screen bg-[#f5fdfb] text-[#0d2b1f]">
      <header className="border-b border-[#e8f7f2] bg-white/90 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-3 text-[#0d2b1f]">
          <Logo className="h-10 w-10" />
          <span className="text-sm font-bold tracking-tight">Helvenda Wohnungen</span>
        </Link>
      </header>

      <main className="mx-auto max-w-[600px] px-6 py-10 pb-16 sm:px-10 sm:py-12">
        <p className="text-center text-sm text-[#8aa89e]">Zertifikats-Verifizierung</p>

        {state.loading ?
          <p className="mt-10 text-center text-slate-600">Wird geprüft…</p>
        : !state.data.valid && state.data.reason === 'NOT_FOUND' ?
          <NotFound code={code} />
        : !state.data.valid && state.data.reason === 'REVOKED' ?
          <Revoked />
        : !state.data.valid && state.data.reason === 'EXPIRED' ?
          <Expired payload={state.data} />
        : state.data.valid ?
          <Valid cert={state.data.certificate} />
        : null}
      </main>
    </div>
  )
}

function NotFound({ code }: { code: string }) {
  return (
    <div className="mt-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-3xl text-slate-500">
        ?
      </div>
      <h1 className="mt-6 text-xl font-bold text-slate-800">Zertifikat nicht gefunden</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#8aa89e]">
        Der Code <span className="font-mono text-slate-700">{code}</span> ist nicht in unserem System. Bitte prüfe, ob der
        Code korrekt eingegeben wurde.
      </p>
    </div>
  )
}

function Revoked() {
  return (
    <div className="mt-10 text-center">
      <div className="mx-auto text-5xl text-red-600">✕</div>
      <h1 className="mt-6 text-[22px] font-bold text-red-800">Zertifikat widerrufen</h1>
      <p className="mt-3 text-sm text-[#8aa89e]">Dieses Zertifikat wurde vom Inhaber widerrufen.</p>
    </div>
  )
}

function Expired({ payload }: { payload: Extract<VerifyFail, { reason: 'EXPIRED' }> }) {
  const c = payload.certificate
  const expStr = payload.expiredAt ? formatDate(payload.expiredAt) : '—'
  return (
    <div className="mt-10">
      <div className="text-center">
        <div className="mx-auto text-5xl text-amber-500">!</div>
        <h1 className="mt-6 text-[22px] font-bold text-amber-900">Zertifikat abgelaufen</h1>
        <p className="mt-3 text-sm text-[#8aa89e]">Dieses Zertifikat war gültig bis {expStr}.</p>
      </div>
      {c ?
        <div className="relative mx-auto mt-10">
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="-rotate-12 text-3xl font-black uppercase tracking-widest text-slate-400/90">
              Abgelaufen
            </span>
          </div>
          <div className="opacity-60">
            <CertificateCard cert={c} />
          </div>
        </div>
      : null}
    </div>
  )
}

function Valid({ cert }: { cert: VerifyCertificatePayload }) {
  return (
    <div className="mt-10">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-4xl text-[#107a5a]">
          ✓
        </div>
      </div>
      <h1 className="mt-4 text-center text-[22px] font-bold text-[#107a5a]">Gültiges Helvenda-Zertifikat</h1>
      <p className="mt-3 text-center font-mono text-[13px] font-semibold tracking-[0.2em] text-[#8aa89e]">
        {cert.certificateCode}
      </p>
      <div className="mt-8">
        <CertificateCard cert={cert} />
      </div>
      <p className="mx-auto mt-8 max-w-lg text-center text-xs leading-relaxed text-[#8aa89e]">
        Helvenda Wohnungen hat die oben genannten Angaben zum Zeitpunkt der Ausstellung verifiziert. Dieses Zertifikat
        ersetzt keine offizielle Bonitätsprüfung und stellt keine rechtlich bindende Garantie dar.
      </p>
      <p className="mt-4 text-center text-[11px] text-[#8aa89e]">
        Verifizierung: {WOHNEN_SITE_ORIGIN}/verify/{cert.certificateCode}
      </p>
    </div>
  )
}

function CertificateCard({ cert }: { cert: VerifyCertificatePayload }) {
  const betr =
    cert.creditCheckStatus === 'CLEAR' ?
      'Keine Einträge ✓'
    : 'Einträge gemäss Betreibungsregisterauszug'
  const rem = daysRemaining(cert.expiresAt)
  const remLabel =
    rem < 0 ? 'Abgelaufen'
    : rem === 0 ? 'Heute letzter Tag'
    : `${rem} Tag${rem === 1 ? '' : 'e'} verbleibend`
  const remOrange = rem >= 0 && rem < 14

  return (
    <div className="rounded-[20px] border border-slate-100 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <Row k="Inhaberin / Inhaber" v={cert.holderName} />
      <Row k="Beschäftigung" v={cert.employmentLine} />
      <Row
        k="Haushaltseinkommen"
        v={
          <>
            {cert.incomeCategory}
            <br />
            <span className="text-[15px] text-slate-700">
              Qualifiziert für Wohnungen bis {formatCHF(cert.incomeQualifiesUpTo)} / Monat
            </span>
          </>
        }
      />
      <Row
        k="Betreibungsregister"
        v={
          <>
            {betr}
            <br />
            <span className="text-[14px] font-medium text-slate-600">
              Ausgestellt: {formatDate(cert.creditCheckDate)} · Kanton {cert.creditCheckCanton}
            </span>
          </>
        }
      />
      <Row k="Ausgestellt am" v={formatDate(cert.issuedAt)} />
      <Row
        k="Gültig bis"
        v={
          <>
            {formatDate(cert.expiresAt)}
            <span className={remOrange ? ' ml-2 text-sm font-semibold text-orange-600' : ' ml-2 text-sm text-[#8aa89e]'}>
              · {remLabel}
            </span>
          </>
        }
        last
      />
    </div>
  )
}

function Row({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div className={`py-3.5 ${last ? '' : 'border-b border-[#f0f0f0]'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">{k}</p>
      <div className="mt-1 text-base font-semibold text-[#0d2b1f]">{v}</div>
    </div>
  )
}
