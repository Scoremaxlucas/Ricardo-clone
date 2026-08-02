'use client'

import { SicLogoMark } from '@/components/sic/SicLogo'
import { SIC_COLORS, SIC_MODULE_ACCENT } from '@/lib/sic/brand'
import { SIC_BASE_FEE_CHF, SIC_MODULES, SIC_VALIDITY_MONTHS, type SicModuleId } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  Clock,
  Globe,
  Lock,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MODULE_ICON: Record<SicModuleId, LucideIcon> = {
  BONITAET: ShieldCheck,
  ARBEIT_EINKOMMEN: Briefcase,
  ZUVERLAESSIGKEIT: UserCheck,
  AUFENTHALT: Globe,
}

const PROBLEM_POINTS = [
  'Wohnungsmarkt stark überlastet',
  'Bis zu 100 Bewerbungen pro Wohnung',
  'Hoher Aufwand für Vermieter',
  'Gute Bewerber gehen unter',
]

const TENANT_POINTS = [
  'Persönliches Profil',
  'Arbeitsverhältnis (Dauer, Status, Jahreslohn)',
  'Betreibungsauszug',
  'Arbeitgeberbestätigung',
  'Referenzen der letzten Vermieter',
  'Alle Dokumente zentral und geprüft',
]

const TENANT_BENEFITS = ['Höhere Glaubwürdigkeit', 'Schnellere Bewerbung', 'Mehr Erfolgschancen']

const LANDLORD_POINTS = [
  'Weniger Administrationsaufwand',
  'Geprüfte, einheitliche Informationen',
  'Einheitliche Bewerbungsunterlagen',
  'Schnellere & fundiertere Entscheidungsfindung',
]

const LANDLORD_BENEFITS = ['Zeit sparen', 'Risiko minimieren', 'Bessere Mieter finden']

const CERT_PREVIEW: { label: string; value: string }[] = [
  { label: 'Bonität', value: 'Keine Betreibungen' },
  { label: 'Bruttojahreseinkommen', value: 'CHF 90’000' },
  { label: 'Arbeitsverhältnis', value: 'Ungekündigt' },
  { label: 'Arbeitgeber', value: 'Seit 6 Jahren beschäftigt' },
  { label: 'Aktuelle Wohnung', value: 'Seit 5 Jahren wohnhaft' },
  { label: 'Aufenthaltsstatus', value: 'Gültige Bewilligung' },
]

export function SicLandingClient() {
  const [selected, setSelected] = useState<Set<SicModuleId>>(new Set())
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
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a1f45] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(60% 60% at 80% 0%, rgba(28,61,120,0.9) 0%, rgba(10,31,69,0) 60%), radial-gradient(50% 50% at 0% 100%, rgba(184,145,47,0.18) 0%, rgba(10,31,69,0) 60%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: SIC_COLORS.goldLight }} />
              SIC — Der Fast Track zur Wunschwohnung
            </span>
            <h1 className="mt-6 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Das geprüfte Schweizer <span style={{ color: SIC_COLORS.goldLight }}>Mieter-Zertifikat</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Bonität, Einkommen, Zuverlässigkeit und Aufenthaltsstatus — anhand eingereichter Belege
              geprüft und per QR-Code fälschungssicher überprüfbar. Ein Dokument, das Vermieter überzeugt.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#module"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
              >
                Zertifikat erstellen <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#zertifikat"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
              >
                So sieht es aus
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/60">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: SIC_COLORS.goldLight }} /> Ab CHF {SIC_BASE_FEE_CHF}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: SIC_COLORS.goldLight }} /> {SIC_VALIDITY_MONTHS} Monate gültig</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: SIC_COLORS.goldLight }} /> Ohne Konto, per E-Mail</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem / Lösung ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-[#c8102e]/15 bg-[#c8102e]/[0.03] p-7">
            <span className="inline-block rounded-full bg-[#c8102e] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Das Problem
            </span>
            <ul className="mt-5 space-y-3">
              {PROBLEM_POINTS.map(p => (
                <li key={p} className="flex items-start gap-3 text-[15px] text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#c8102e]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-[#2f9e44]/15 bg-[#2f9e44]/[0.04] p-7">
            <span className="inline-block rounded-full bg-[#1f7a34] px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Die Lösung
            </span>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-700">
              <strong className="font-semibold text-[#0f2b5e]">Swiss Immo Cert (SIC)</strong> ist ein digitales
              Qualitätszertifikat für Wohnungssuchende. Alle relevanten Informationen — geprüft, vollständig
              und per QR-Code überprüfbar — in einem einzigen Zertifikat.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Geprüft', 'Vollständig', 'QR-überprüfbar'].map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1f7a34] ring-1 ring-[#2f9e44]/20">
                  <Check className="h-3.5 w-3.5" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Zielgruppen-Panels ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-5 lg:grid-cols-2">
          <AudiencePanel icon={Users} title="Für Mietsuchende" points={TENANT_POINTS} benefits={TENANT_BENEFITS} />
          <AudiencePanel icon={Building2} title="Für Wohnungsvermieter" points={LANDLORD_POINTS} benefits={LANDLORD_BENEFITS} />
        </div>
      </section>

      {/* ── Module (Flyer) + Checkout ────────────────────────────────────── */}
      <section id="module" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <div className="mx-auto flex w-fit items-center gap-2 text-[#c8102e]">
              <SicLogoMark size={26} />
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0f2b5e] sm:text-4xl">4 verifizierte Module</h2>
            <p className="mt-2 text-slate-500">Einfach. Transparent. Vertrauenswürdig.</p>
            <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-slate-400">
              Verifiziert bedeutet: Der eingereichte Beleg wurde von Swiss Immo Cert gesichtet und auf
              Vollständigkeit und Plausibilität geprüft. Es erfolgt keine telefonische Rückfrage bei Dritten
              (z. B. Arbeitgeber).
            </p>
          </div>

          {/* Basisgebühr */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#b8912f]/30 bg-[#b8912f]/[0.06] p-6 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-[#8a6d1f]">Basis · Einschreibegebühr</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Erstellen Sie Ihr persönliches Zertifikat und wählen Sie die gewünschten Module. Die Basis ist
                immer enthalten.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#0f2b5e]">CHF {SIC_BASE_FEE_CHF}.–</p>
              <p className="text-xs text-slate-500">Einmalig · {SIC_VALIDITY_MONTHS} Monate gültig</p>
            </div>
          </div>

          {/* Modul-Kacheln */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SIC_MODULES.map(m => {
              const on = selected.has(m.id)
              const accent = SIC_MODULE_ACCENT[m.id]
              const Icon = MODULE_ICON[m.id]
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  aria-pressed={on}
                  className={`group relative flex flex-col rounded-2xl border bg-white p-6 text-left transition-all ${
                    on ? `border-transparent shadow-md ring-2 ${accent.ring}` : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full text-white transition-opacity ${on ? '' : 'opacity-40'}`}
                    style={{ backgroundColor: accent.hex }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: accent.hex }}>
                    Modul {m.order}
                  </p>
                  <p className="text-lg font-bold leading-tight text-[#0f2b5e]">{m.title}</p>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{m.summary}</p>
                  <ul className="mt-3 space-y-1.5">
                    {m.lineItems.map(li => (
                      <li key={li} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600">
                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: accent.hex }} /> {li}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="rounded-md bg-[#0f2b5e] px-2.5 py-1 text-xs font-bold text-white">CHF {m.priceChf}.–</span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-opacity ${on ? '' : 'opacity-30'}`}
                      style={{ color: accent.hex }}
                    >
                      {on ? <><Check className="h-3.5 w-3.5" /> Ausgewählt</> : 'Hinzufügen'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Checkout */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
              <div className="flex items-center gap-2 text-[#0f2b5e]">
                <BadgeCheck className="h-5 w-5" />
                <h3 className="text-lg font-bold">Sie entscheiden</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Wählen Sie die Module, die Sie benötigen. Nur bezahlte Module erscheinen als
                <span className="font-semibold text-[#2f9e44]"> verifiziert</span> auf Ihrem Zertifikat.
              </p>
              <dl className="mt-5 space-y-2.5 text-sm">
                {quote.lines.map((l, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <dt>{l.label}</dt>
                    <dd className="tabular-nums">CHF {l.amountChf}.–</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-2xl font-bold tabular-nums text-[#0f2b5e]">CHF {quote.totalChf}.–</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#0f2b5e]/10 bg-[#0f2b5e]/[0.03] p-6 sm:p-7">
              <label htmlFor="sic-email" className="block text-sm font-semibold text-[#0f2b5e]">
                E-Mail-Adresse
              </label>
              <input
                id="sic-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@beispiel.ch"
                autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-[#0f2b5e]/15 focus:border-[#0f2b5e] focus:ring-2"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Ihre E-Mail ist Ihr Zugang — kein Passwort nötig. Sie erhalten danach einen Anmeldelink zum Hochladen
                der Nachweise.
              </p>
              <button
                type="button"
                onClick={checkout}
                disabled={submitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-5 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                {submitting ? 'Wird geöffnet …' : 'Weiter zur Zahlung'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Lock className="h-3.5 w-3.5" /> Sichere Zahlung über Stripe
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Ist ein eingereichter Beleg unvollständig oder nicht plausibel, bitten wir dich, einen gültigen
                Nachweis nachzureichen — damit dein Zertifikat sauber verifiziert werden kann.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Zertifikat-Vorschau ──────────────────────────────────────────── */}
      <section id="zertifikat" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0f2b5e]">So sieht Ihr Zertifikat aus</h2>
            <p className="mt-4 max-w-md text-slate-600">
              Ein seriöses Dokument mit geprüften Angaben und einem QR-Code, mit dem Vermieter die Echtheit des
              Zertifikats in Sekunden fälschungssicher prüfen können.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2.5"><BadgeCheck className="h-5 w-5 text-[#b8912f]" /> Fälschungssicher — Online-Verifikation per QR</li>
              <li className="flex items-center gap-2.5"><Target className="h-5 w-5 text-[#b8912f]" /> Überall einsetzbar — auch bei anderen Portalen</li>
              <li className="flex items-center gap-2.5"><Clock className="h-5 w-5 text-[#b8912f]" /> {SIC_VALIDITY_MONTHS} Monate gültig, jederzeit erweiterbar</li>
            </ul>
          </div>

          {/* Zertifikat-Karte */}
          <div className="relative rounded-2xl bg-white p-1.5 shadow-xl shadow-[#0a1f45]/10 ring-1 ring-[#b8912f]/40">
            <span className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              Beispiel
            </span>
            <div className="rounded-xl border-2 border-[#b8912f]/50 bg-gradient-to-b from-white to-slate-50 p-6">
              <div className="text-center">
                <div className="mx-auto flex w-fit justify-center">
                  <SicLogoMark size={40} />
                </div>
                <p className="mt-3 text-lg font-bold tracking-[0.15em] text-[#0f2b5e]">SWISS IMMO CERT</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#b8912f]">Mieter-Zertifikat</p>
              </div>
              <dl className="mt-5 divide-y divide-slate-100">
                {CERT_PREVIEW.map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <dt className="text-xs font-semibold text-[#0f2b5e]">{row.label}</dt>
                      <dd className="truncate text-xs text-slate-500">{row.value}</dd>
                    </div>
                    <span className="inline-flex flex-shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#2f9e44]">
                      <Check className="h-3.5 w-3.5" /> Verifiziert
                    </span>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                <span>Geprüft. Verifiziert. Vertrauenswürdig.</span>
                <span className="rounded bg-[#0f2b5e] px-2 py-0.5 font-semibold text-white">QR-geschützt</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function AudiencePanel({
  icon: Icon,
  title,
  points,
  benefits,
}: {
  icon: LucideIcon
  title: string
  points: string[]
  benefits: string[]
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 bg-[#0f2b5e] px-6 py-4 text-white">
        <Icon className="h-5 w-5" style={{ color: SIC_COLORS.goldLight }} />
        <h3 className="text-base font-bold uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-6">
        <ul className="space-y-2.5">
          {points.map(p => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2f9e44]" /> {p}
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4">
          {benefits.map(b => (
            <p key={b} className="flex items-center gap-2 text-sm font-semibold text-[#0f2b5e]">
              <ArrowRight className="h-4 w-4 text-[#c8102e]" /> {b}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
