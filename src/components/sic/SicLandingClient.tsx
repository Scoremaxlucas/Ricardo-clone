'use client'

import { SIC_BASE_FEE_CHF, SIC_MODULES, type SicModuleId } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { ArrowRight, BadgeCheck, Check, Lock, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STEPS = [
  { title: 'Module wählen', text: 'Stellen Sie Ihr Zertifikat zusammen — Sie zahlen nur, was Sie brauchen.' },
  { title: 'Nachweise hochladen', text: 'Nach der Zahlung laden Sie Ihre Dokumente sicher hoch. Passwortlos per E-Mail.' },
  { title: 'Geprüft & fertig', text: 'Wir verifizieren und Sie erhalten ein PDF mit QR-Code — sofort einsetzbar.' },
]

const CERT_PREVIEW = [
  { label: 'Bonität', value: 'Keine Betreibungen' },
  { label: 'Bruttojahreseinkommen', value: 'verifiziert' },
  { label: 'Arbeitsverhältnis', value: 'ungekündigt' },
  { label: 'Arbeitgeber', value: 'Anstellungsdauer geprüft' },
  { label: 'Aktuelle Wohnung', value: 'Mietverhältnis geprüft' },
  { label: 'Aufenthaltsstatus', value: 'geprüft' },
]

export function SicLandingClient() {
  const [selected, setSelected] = useState<Set<SicModuleId>>(new Set(SIC_MODULES.map(m => m.id)))
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const moduleIds = useMemo(() => SIC_MODULES.filter(m => selected.has(m.id)).map(m => m.id), [selected])
  const quote = useMemo(() => quoteSicOrder({ includeBaseFee: true, moduleIds }), [moduleIds])

  function toggle(id: SicModuleId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function checkout() {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse an.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sic/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), moduleIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.message || 'Zahlung konnte nicht gestartet werden.')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pb-4 pt-16 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Geprüftes Mieterdossier
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Bewerben Sie sich mit einem
            <span className="text-teal-700"> geprüften Zertifikat</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Bonität, Einkommen, Zuverlässigkeit und Aufenthaltsstatus — unabhängig verifiziert und in
            Sekunden per QR-Code überprüfbar. Ein Dokument, das Vermieter überzeugt.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-teal-600" /> Ab CHF {SIC_BASE_FEE_CHF}</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-teal-600" /> 3 Monate gültig</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-teal-600" /> Ohne Konto, per E-Mail</span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-teal-700 text-sm font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Builder + preview */}
      <section id="builder" className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Module builder */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Ihr Zertifikat zusammenstellen</h2>
            <p className="mt-1 text-sm text-slate-500">
              Die Basis erstellt Ihr Zertifikat. Jedes Modul fügt eine unabhängig geprüfte Angabe hinzu.
            </p>

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Basis · Zertifikat erstellen</p>
                <p className="text-xs text-slate-500">Immer enthalten</p>
              </div>
              <span className="text-sm font-semibold text-slate-900">CHF {SIC_BASE_FEE_CHF}</span>
            </div>

            <ul className="mt-3 space-y-3">
              {SIC_MODULES.map(m => {
                const on = selected.has(m.id)
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m.id)}
                      aria-pressed={on}
                      className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                        on ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border ${
                          on ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {on && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-900">{m.title}</span>
                          <span className="text-sm font-semibold text-slate-900">CHF {m.priceChf}</span>
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{m.summary}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Summary / checkout */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7">
              <h3 className="text-base font-semibold text-slate-900">Zusammenfassung</h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                {quote.lines.map((l, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <dt>{l.label}</dt>
                    <dd className="tabular-nums">CHF {l.amountChf}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-2xl font-bold tabular-nums text-slate-900">CHF {quote.totalChf}</span>
              </div>

              <div className="mt-5">
                <label htmlFor="sic-email" className="block text-sm font-medium text-slate-700">
                  E-Mail-Adresse
                </label>
                <input
                  id="sic-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@beispiel.ch"
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-teal-600/20 focus:border-teal-600 focus:ring-2"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Ihre E-Mail ist Ihr Zugang — kein Passwort nötig. Sie erhalten danach einen Anmeldelink.
                </p>
              </div>

              <button
                type="button"
                onClick={checkout}
                disabled={submitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? 'Wird geöffnet …' : 'Weiter zur Zahlung'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" /> Sichere Zahlung über Stripe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate preview */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">So sieht Ihr Zertifikat aus</h2>
            <p className="mt-3 max-w-md text-slate-600">
              Ein klares, seriöses Dokument mit allen verifizierten Angaben und einem QR-Code, mit dem Vermieter die
              Echtheit in Sekunden prüfen können.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-teal-600" /> Fälschungssicher — Online-Verifikation per QR</li>
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-teal-600" /> Überall einsetzbar — auch bei anderen Portalen</li>
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-teal-600" /> 3 Monate gültig, jederzeit erweiterbar</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-7 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">Swiss Immo Cert</span>
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">VERIFIZIERT</span>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">Mieterzertifikat</p>
            <dl className="mt-4 divide-y divide-slate-100">
              {CERT_PREVIEW.map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5 text-sm">
                  <dt className="text-slate-500">{row.label}</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-slate-800">
                    {row.value} <Check className="h-3.5 w-3.5 text-teal-600" />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  )
}
