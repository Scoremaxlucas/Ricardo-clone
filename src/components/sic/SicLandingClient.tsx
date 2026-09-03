'use client'

import { SicLogoMark } from '@/components/sic/SicLogo'
import { SIC_CERT_TAGLINE, SIC_COLORS, SIC_HERO_IMAGE, SIC_MODULE_ACCENT, SIC_TAGLINE } from '@/lib/sic/brand'
import { SIC_FAQ } from '@/lib/sic/faq'
import { sicCatalogPreviewRows } from '@/lib/sic/facts'
import { SIC_REVIEWS, SIC_USE_CASES, sicLandingHasReviews } from '@/lib/sic/reviews'
import {
  formatSicChf,
  getSicModule,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULE_BADGE,
  SIC_MODULES,
  SIC_VALIDITY_MONTHS,
  sicCompletenessLabel,
  sicIsFree,
  type SicModuleId,
} from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import type { SicLandingAccount } from '@/lib/sic/landing-account'
import { sicPaths, SIC_ISSUER_LINE, SIC_REVIEW_SLA, SIC_REVIEW_SLA_SENTENCE } from '@/lib/sic/config'
import { DocumentRule, HouseMark, ModuleGlyph } from '@/lib/sic/cert/art-web'
import {
  ArrowRight,
  Briefcase,
  ChevronDown,
  Globe,
  ListChecks,
  Mail,
  QrCode,
  ShieldCheck,
  Upload,
  UserCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const IS_FREE = sicIsFree()
/** Preisangabe für Copy: «Kostenlos» oder der Paketpreis. */
const PRICE_LABEL = IS_FREE ? 'Kostenlos' : formatSicChf(SIC_BUNDLE_ALL_MODULES_CHF)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MODULE_ICON: Record<SicModuleId, LucideIcon> = {
  BONITAET: ShieldCheck,
  ARBEIT_EINKOMMEN: Briefcase,
  ZUVERLAESSIGKEIT: UserCheck,
  AUFENTHALT: Globe,
}

const HOW_STEPS: { icon: LucideIcon; title: string; note: string }[] = [
  {
    icon: Mail,
    title: 'Zertifikat anlegen',
    note: 'Name und E-Mail, dann die Zahlung. Alle vier Angaben gehören dazu — kein Baukasten. Kein Passwort, danach ein Anmeldelink.',
  },
  {
    icon: Upload,
    title: 'Unterlagen nachliefern',
    note: 'Betreibungsauszug und Ausweis beschaffst du selbst. Für Lohn und Referenz braucht es eine Unterschrift Dritter.',
  },
  {
    icon: ListChecks,
    title: 'Wir prüfen jede Angabe einzeln',
    note: SIC_REVIEW_SLA_SENTENCE,
  },
  {
    icon: QrCode,
    title: 'Der Bewerbung beilegen',
    note: 'Ein PDF gibt es ab der ersten geprüften Angabe. Als Mieter-Zertifikat gilt es erst mit Betreibungsauszug und Ausweis.',
  },
]

const TODAY_SCENES = [
  'Eignung allein reicht nicht. Ungeprüfte Angaben bleiben Selbstauskunft.',
  'Lohn, Betreibung und Referenz sind bei den meisten Bewerbern Selbstauskunft. Ohne Prüfung bleibt die Unsicherheit bei ihm.',
]

/** Beispiel wie auf dem PDF — Zeilen aus denselben Bändern und der 3×-Regel. */
const CERT_PREVIEW = sicCatalogPreviewRows()

export function SicLandingClient({ account }: { account?: SicLandingAccount | null }) {
  const owned = useMemo(() => new Set<SicModuleId>(account?.ownedModules ?? []), [account])
  const verifiedModules = useMemo(() => new Set<SicModuleId>(account?.verifiedModules ?? []), [account])
  const isReturning = Boolean(account)
  const availableModules = useMemo(() => SIC_MODULES.filter(m => !owned.has(m.id)), [owned])

  const [firstName, setFirstName] = useState(account?.holderFirstName ?? '')
  const [lastName, setLastName] = useState(account?.holderLastName ?? '')
  const [firstName2, setFirstName2] = useState('')
  const [lastName2, setLastName2] = useState('')
  const [couple, setCouple] = useState(false)
  const [email, setEmail] = useState(account?.email ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showSticky, setShowSticky] = useState(false)
  const [loginInvalid, setLoginInvalid] = useState(false)
  const [serverQuote, setServerQuote] = useState<ReturnType<typeof quoteSicOrder> | null>(null)

  const moduleIds = useMemo(() => SIC_MODULES.map(m => m.id), [])
  const localQuote = useMemo(
    () => quoteSicOrder({ includeBaseFee: true, moduleIds }),
    [moduleIds]
  )
  const quote = serverQuote ?? localQuote
  const nothingToBuy = isReturning && availableModules.length === 0
  const verifiedCount = account?.verifiedModules.length ?? 0
  const statusLabel =
    account?.status === 'REVOKED' ? 'widerrufen'
    : account?.status === 'EXPIRED' ? 'abgelaufen'
    : verifiedCount >= SIC_MODULES.length ? 'vollständig'
    : verifiedCount > 0 ? 'teilweise geprüft'
    : 'in Bearbeitung'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('login') === 'invalid') {
      setLoginInvalid(true)
      params.delete('login')
      const qs = params.toString()
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', next)
    }
  }, [])

  useEffect(() => {
    const update = () => {
      const y = window.scrollY
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 200
      const vv = window.visualViewport
      const keyboardOpen = Boolean(vv && window.innerHeight - vv.height > 80)
      setShowSticky(y > 640 && !nearBottom && !keyboardOpen)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => {
    if (isReturning) return
    if (!EMAIL_RE.test(email.trim())) {
      setServerQuote(null)
      return
    }
    const controller = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/sic/quote', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), moduleIds }),
          signal: controller.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.ok || !data?.quote) return
        setServerQuote(data.quote)
      } catch {
        // ignore abort / network — keep local quote
      }
    }, 400)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [email, moduleIds, isReturning])

  async function checkout() {
    if (isReturning) {
      window.location.href = `${sicPaths.certificateWorkspace}#erganzen`
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Bitte Vor- und Nachname angeben.')
      const missingFirst = !firstName.trim()
      const field = document.getElementById(missingFirst ? 'sic-hero-first' : 'sic-hero-last')
      document.getElementById('anlegen')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (field instanceof HTMLInputElement) field.focus()
      return
    }
    if (couple && (!firstName2.trim() || !lastName2.trim())) {
      toast.error('Bitte Vor- und Nachname der zweiten Person angeben.')
      const field = document.getElementById(!firstName2.trim() ? 'sic-hero-first-2' : 'sic-hero-last-2')
      document.getElementById('anlegen')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (field instanceof HTMLInputElement) field.focus()
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse an.')
      const field = document.getElementById('sic-hero-email')
      document.getElementById('anlegen')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (field instanceof HTMLInputElement) field.focus()
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sic/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          moduleIds,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          ...(couple ?
            {
              householdKind: 'COUPLE',
              firstName2: firstName2.trim(),
              lastName2: lastName2.trim(),
            }
          : { householdKind: 'SINGLE' }),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.message || 'Zertifikat konnte nicht gestartet werden.')
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
      {loginInvalid ?
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900">
          Anmeldelink ungültig oder abgelaufen — fordere unter{' '}
          <a href={sicPaths.certificateWorkspace} className="touch-target-exempt font-semibold underline">
            Mein Zertifikat
          </a>{' '}
          einen neuen an.
        </div>
      : null}

      {isReturning && account ?
        <div className="border-b border-sic-navy/15 bg-sic-navy/[0.04] px-5 py-3.5">
          <div className="mx-auto max-w-6xl text-sm text-sic-navy">
            <span className="font-semibold">Dein Zertifikat ist {statusLabel}</span>
            <span className="mx-1.5 text-slate-400">·</span>
            <span className="break-all font-mono text-xs">{account.certificateCode}</span>
            {owned.size > 0 ?
              <span className="mt-0.5 block text-xs text-slate-600 sm:mt-0 sm:inline sm:before:mx-1.5 sm:before:content-['·']">
                {owned.size} von {SIC_MODULES.length} Angaben enthalten
                {availableModules.length > 0 ? ' — fehlende Angaben ergänzt du unter Mein Zertifikat' : ''}
              </span>
            : null}
          </div>
        </div>
      : null}
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-sic-navy-deep text-white">
        {/* Warmes Alpen-Motiv — später durch Wohnungsfoto unter demselben Pfad ersetzbar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-[0.35]"
          style={{ backgroundImage: `url('${SIC_HERO_IMAGE}')` }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, rgba(10,31,69,0.92) 0%, rgba(10,31,69,0.78) 45%, rgba(14,124,107,0.45) 100%), radial-gradient(70% 60% at 100% 0%, rgba(216,178,90,0.22) 0%, transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-10 sm:pt-16 lg:pb-20 lg:pt-20">
          {isReturning ?
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-sic-serif text-[1.7rem] font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
                Dein Mieter-Zertifikat
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
                {account?.status === 'REVOKED' ?
                  'Dieses Zertifikat ist widerrufen. Die Prüfseite weist es als ungültig aus.'
                : account?.status === 'EXPIRED' ?
                  'Die Gültigkeit ist abgelaufen. Mit einem frischen Betreibungsauszug kannst du verlängern.'
                : 'Stand und Nachweise findest du unter «Mein Zertifikat». Fehlende Angaben ergänzt du dort.'}
              </p>
              <div id="anlegen" className="mt-8 flex scroll-mt-[calc(4.5rem+env(safe-area-inset-top,0px))] flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                {account?.status === 'EXPIRED' ?
                  <a
                    href={sicPaths.renew}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 touch-manipulation transition-transform hover:bg-sic-action-deep sm:w-auto sm:hover:-translate-y-0.5"
                  >
                    Jetzt verlängern <ArrowRight className="h-4 w-4" />
                  </a>
                : account?.status === 'REVOKED' ?
                  <a
                    href={sicPaths.certificateWorkspace}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 touch-manipulation transition-transform hover:bg-sic-action-deep sm:w-auto sm:hover:-translate-y-0.5"
                  >
                    Zum Zertifikat <ArrowRight className="h-4 w-4" />
                  </a>
                : !nothingToBuy ?
                  <a
                    href={`${sicPaths.certificateWorkspace}#erganzen`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 touch-manipulation transition-transform hover:bg-sic-action-deep sm:w-auto sm:hover:-translate-y-0.5"
                  >
                    Angabe ergänzen <ArrowRight className="h-4 w-4" />
                  </a>
                : <a
                    href={sicPaths.certificateWorkspace}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 touch-manipulation transition-transform hover:bg-sic-action-deep sm:w-auto sm:hover:-translate-y-0.5"
                  >
                    Zum Zertifikat <ArrowRight className="h-4 w-4" />
                  </a>
                }
                <a
                  href={sicPaths.certificateWorkspace}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white touch-manipulation transition-colors hover:bg-white/5 sm:w-auto"
                >
                  Mein Zertifikat
                </a>
              </div>
            </div>
          : <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-sic-gold-light" />
                  {SIC_TAGLINE}
                </span>
                <h1 className="mt-6 font-sic-serif text-[1.7rem] font-bold leading-[1.12] tracking-tight text-white sm:text-5xl">
                  Damit der Vermieter dich ernst nimmt.{' '}
                  <span className="text-sic-gold-light">Nicht nur zur Kenntnis nimmt.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                  Ohne Prüfung bleibt jede Bewerbung Selbstauskunft. Swiss Immo Cert prüft Angaben auf
                  Vollständigkeit und Plausibilität — standardisiert und per QR nachvollziehbar. Keine
                  behördliche Auskunft.
                </p>
                <form
                  id="anlegen"
                  className="mt-8 max-w-md scroll-mt-[calc(4.5rem+env(safe-area-inset-top,0px))]"
                  onSubmit={e => {
                    e.preventDefault()
                    void checkout()
                  }}
                >
                  <div className="flex rounded-xl border border-white/15 bg-white/5 p-1">
                    <button
                      type="button"
                      aria-pressed={!couple}
                      onClick={() => setCouple(false)}
                      className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold ${
                        couple ? 'text-white/70 hover:text-white' : 'bg-white text-sic-navy'
                      }`}
                    >
                      Eine Person
                    </button>
                    <button
                      type="button"
                      aria-pressed={couple}
                      onClick={() => setCouple(true)}
                      className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold ${
                        couple ? 'bg-white text-sic-navy' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Zwei Personen
                    </button>
                  </div>
                  {couple ?
                    <p className="mt-2.5 text-xs leading-relaxed text-white/55">
                      Ein Dokument, zwei Namen. Zwei Betreibungsauszüge und zwei Ausweise, Einkommen
                      zusammengezählt, eine Vermieter-Referenz.
                    </p>
                  : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="sic-hero-first" className="block text-xs font-semibold text-white/75">
                        Vorname
                      </label>
                      <input
                        id="sic-hero-first"
                        type="text"
                        required
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Vorname"
                        autoComplete="given-name"
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-base text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="sic-hero-last" className="block text-xs font-semibold text-white/75">
                        Nachname
                      </label>
                      <input
                        id="sic-hero-last"
                        type="text"
                        required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Nachname"
                        autoComplete="family-name"
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-base text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                  </div>
                  {couple ?
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="sic-hero-first-2" className="block text-xs font-semibold text-white/75">
                          Vorname zweite Person
                        </label>
                        <input
                          id="sic-hero-first-2"
                          type="text"
                          required={couple}
                          value={firstName2}
                          onChange={e => setFirstName2(e.target.value)}
                          placeholder="Vorname"
                          autoComplete="off"
                          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-base text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                        />
                      </div>
                      <div>
                        <label htmlFor="sic-hero-last-2" className="block text-xs font-semibold text-white/75">
                          Nachname zweite Person
                        </label>
                        <input
                          id="sic-hero-last-2"
                          type="text"
                          required={couple}
                          value={lastName2}
                          onChange={e => setLastName2(e.target.value)}
                          placeholder="Nachname"
                          autoComplete="off"
                          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-base text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                        />
                      </div>
                    </div>
                  : null}
                  <label htmlFor="sic-hero-email" className="mt-3.5 block text-xs font-semibold text-white/75">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="sic-hero-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@beispiel.ch"
                    autoComplete="email"
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-base text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 touch-manipulation transition-transform hover:bg-sic-action-deep disabled:translate-y-0 disabled:opacity-60 sm:w-auto sm:hover:-translate-y-0.5"
                  >
                    {submitting ? 'Wird erstellt …' : 'Zertifikat anlegen'}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <p className="mt-2.5 text-xs leading-relaxed text-white/50">
                    Alle {SIC_MODULES.length} Angaben ·{' '}
                    {quote.totalChf > 0 ? formatSicChf(quote.totalChf) : 'Kostenlos'}. Unterlagen danach.
                  </p>
                </form>
                <p className="mt-3 max-w-md text-xs leading-relaxed text-white/45">
                  Kein Abo. Einmal anlegen, jeder Bewerbung beilegen.
                </p>
              </div>
              <div id="zertifikat" className="min-w-0">
                <CertUrkundeCard />
                <p className="mt-3 text-center text-xs leading-relaxed text-white/50">
                  So sieht das Zertifikat aus, das der Vermieter in der Hand hat.
                </p>
              </div>
            </div>
          }
        </div>
      </section>

      {!isReturning ?
        <>
          <section className="bg-sic-paper">
            <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
                Die Ausgangslage
              </p>
              <div className="mt-8">
                {TODAY_SCENES.map((scene, i) => (
                  <p
                    key={scene}
                    className={`font-sic-serif text-xl leading-snug text-sic-navy sm:text-[1.65rem] ${
                      i > 0 ? 'mt-6 border-t border-sic-gold/35 pt-6' : ''
                    }`}
                  >
                    {scene}
                  </p>
                ))}
              </div>
              <p className="mt-8 font-sic-serif text-lg font-semibold leading-snug text-sic-navy sm:text-xl">
                Ein SIC-Zertifikat weist aus, was geprüft ist. Es erhalten Bewerber, die sich ausweisen
                können.
              </p>
            </div>
          </section>

          <section className="bg-sic-paper-soft py-14 sm:py-16">
            <div className="mx-auto max-w-5xl px-5">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
                Herkömmliche Bewerbung und SIC
              </p>
              <h2 className="mt-3 text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
                Geprüft und einheitlich — nicht weitere Anhänge.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
                Bei einer herkömmlichen Bewerbung muss er den Angaben Glauben schenken. Ein Zertifikat weist
                aus, was geprüft ist — standardisiert und per QR nachvollziehbar.
              </p>
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Heute</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">Herkömmliche Bewerbung</p>
                  <ul className="mt-4 space-y-2">
                    {[
                      'Lohn selbst deklariert',
                      'Betreibungsauszug ungeprüft',
                      'Referenz fehlt oder unbelegt',
                      'Ausweis ungeprüft',
                    ].map(f => (
                      <li
                        key={f}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Selbstauskunft. Ungeprüft und nicht standardisiert.
                  </p>
                </div>
                <div className="rounded-2xl border border-sic-gold/40 bg-sic-paper p-5 ring-1 ring-sic-gold/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sic-gold-text">Mit SIC</p>
                  <p className="mt-1 text-sm font-semibold text-sic-navy">Geprüftes Mieter-Zertifikat</p>
                  <ul className="mt-4 space-y-2">
                    {[
                      'Keine offenen Betreibungen — geprüft',
                      'Einkommensband und 3×-Regel — geprüft',
                      'Schriftliche Vermieter-Referenz — geprüft',
                      'Gültiger Ausweis — geprüft',
                    ].map(f => (
                      <li
                        key={f}
                        className="flex items-center gap-2 rounded-lg border border-sic-navy/15 bg-white px-3 py-2 text-xs text-sic-navy"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-sic-navy" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-sic-navy/70">
                    Geprüfte Angaben, die der Vermieter nachvollziehen kann. Nicht jeder legt sie vor.
                  </p>
                </div>
              </div>
              <p className="mx-auto mt-8 max-w-xl text-center text-sm text-slate-500">
                <a href="#anlegen" className="font-semibold text-sic-action hover:underline">
                  Zertifikat anlegen
                </a>
                <span className="text-slate-400">
                  {' '}
                  · {IS_FREE ? 'kostenlos' : PRICE_LABEL}, Prüfung {SIC_REVIEW_SLA}
                </span>
              </p>
            </div>
          </section>
        </>
      : null}

      {!isReturning ?
        <section className="bg-sic-paper-soft py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center font-sic-serif text-3xl font-bold tracking-tight text-sic-navy">So läuft es ab</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
              Einmal anlegen, Unterlagen nachliefern. Ein PDF gibt es ab der ersten geprüften Angabe; als
              Mieter-Zertifikat gilt es erst mit Betreibungsauszug und Ausweis. {PRICE_LABEL},{' '}
              {SIC_VALIDITY_MONTHS} Monate gültig — gerechnet ab dem Betreibungsauszug.
            </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-sic-navy text-white">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-bold text-sic-gold-text">{i + 1}</span>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700">{step.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{step.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      : null}

      {/* ── Angaben im Paket (kein Shop) ──────────────────────────────── */}
      <section id="module" className="bg-sic-paper py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <div className="mx-auto flex w-fit items-center gap-2 text-sic-red">
              <SicLogoMark size={26} />
            </div>
            <h2 className="mt-3 font-sic-serif text-3xl font-bold tracking-tight text-sic-navy sm:text-4xl">
              {isReturning ? 'Zertifikat erweitern' : 'Das kommt aufs Zertifikat'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500">
              {isReturning ?
                nothingToBuy ?
                  'Alle vier Angaben sind bereits Teil deines Zertifikats.'
                : 'Fehlende Angaben ergänzt du unter Mein Zertifikat — nicht hier als Baukasten.'
              : 'Vier Angaben, die Vermieter für die Auswahl brauchen. Du legst sie zusammen an.'}
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {!isReturning ?
              // Erstkauf: nicht als „Shop-Karten“ zeigen, sondern als Inhalt des Zertifikats.
              <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                <p className="text-sm font-semibold text-sic-navy">Für den Vermieter geprüfte Angaben</p>
                <div className="mt-4 space-y-2">
                  {SIC_MODULES.map(m => {
                    const accent = SIC_MODULE_ACCENT[m.id]
                    const Icon = MODULE_ICON[m.id]
                    return (
                      <div key={m.id} className="flex items-start gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50">
                        <span
                          className="mt-0.5 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white"
                          style={{ backgroundColor: accent.hex }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-sic-navy">{m.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                            {m.landlordSees}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            :
              <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
                {verifiedModules.size > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-sic-navy">Auf deinem Zertifikat</p>
                    <div className="mt-4 space-y-2">
                      {SIC_MODULES.filter(m => verifiedModules.has(m.id)).map(m => {
                        const Icon = MODULE_ICON[m.id]
                        return (
                          <div key={m.id} className="flex items-start gap-3 rounded-2xl px-3 py-3">
                            <span
                              className="mt-0.5 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white"
                              style={{ backgroundColor: '#2f9e44' }}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-sic-navy">{m.title}</p>
                              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{m.landlordSees}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : null}

                {SIC_MODULES.filter(m => owned.has(m.id) && !verifiedModules.has(m.id)).length > 0 ? (
                  <>
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <p className="text-sm font-semibold text-sic-navy">Gekauft, noch nicht geprüft</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {SIC_MODULES.filter(m => owned.has(m.id) && !verifiedModules.has(m.id)).map(m => {
                        const accent = SIC_MODULE_ACCENT[m.id]
                        const Icon = MODULE_ICON[m.id]
                        return (
                          <div key={m.id} className="flex items-start gap-3 rounded-2xl px-3 py-3 bg-slate-50">
                            <span
                              className="mt-0.5 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white"
                              style={{ backgroundColor: accent.hex }}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-sic-navy">{m.title}</p>
                              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{m.youUpload}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : null}

                {availableModules.length ? (
                  <>
                    <div className="mt-6 border-t border-slate-200 pt-6">
                      <p className="text-sm font-semibold text-sic-navy">Noch offen</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {availableModules.map(m => {
                        const accent = SIC_MODULE_ACCENT[m.id]
                        const Icon = MODULE_ICON[m.id]
                        return (
                          <div key={m.id} className="flex items-start gap-3 rounded-2xl px-3 py-3">
                            <span
                              className="mt-0.5 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full text-white"
                              style={{ backgroundColor: accent.hex }}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-sic-navy">{m.title}</p>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                  Offen
                                </span>
                              </div>
                              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{m.youUpload}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            }
          </div>

          {isReturning ?
            <p className="mt-8 text-center">
              {nothingToBuy ?
                <a
                  href={sicPaths.certificateWorkspace}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep"
                >
                  Zum Zertifikat <ArrowRight className="h-4 w-4" />
                </a>
              : <a
                  href={`${sicPaths.certificateWorkspace}#erganzen`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep"
                >
                  Offene Angaben ergänzen <ArrowRight className="h-4 w-4" />
                </a>
              }
            </p>
          : <p className="mt-8 text-center">
              <a
                href="#anlegen"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep"
              >
                Zertifikat anlegen <ArrowRight className="h-4 w-4" />
              </a>
              <span className="mt-2 block text-xs text-slate-500">
                {quote.totalChf > 0 ? PRICE_LABEL : 'Kostenlos'} · alle {SIC_MODULES.length} Angaben.
              </span>
            </p>
          }
        </div>
      </section>

      {!isReturning ?
        <section className="border-y border-sic-hairline/70 bg-sic-paper-soft py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5">
            {sicLandingHasReviews() ?
              <>
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
                  Stimmen
                </p>
                <h2 className="mt-3 text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
                  Was Bewerberinnen und Bewerber sagen
                </h2>
                <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
                  {SIC_REVIEWS.map(review => (
                    <figure key={`${review.name}-${review.place}`} className="flex flex-col">
                      <blockquote className="font-sic-serif text-lg leading-snug text-sic-navy sm:text-[1.15rem]">
                        «{review.quote}»
                      </blockquote>
                      <figcaption className="mt-5 border-t border-sic-hairline pt-4 text-sm text-slate-600">
                        <span className="font-semibold text-sic-navy">{review.name}</span>
                        <span className="text-slate-400"> · </span>
                        {review.place}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            : <>
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
                  Das Zertifikat
                </p>
                <h2 className="mt-3 text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
                  Was sich für den Vermieter ändert
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-500">
                  Noch ohne Kundenstimmen. Drei Eigenschaften, die das Produkt hergibt.
                </p>
                <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
                  {SIC_USE_CASES.map(item => (
                    <article key={item.title} className="flex flex-col">
                      <h3 className="font-sic-serif text-lg font-bold text-sic-navy">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.body}</p>
                    </article>
                  ))}
                </div>
              </>
            }
          </div>
        </section>
      : null}

      {/* ── Inline-FAQ ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-16 pb-[max(7.5rem,calc(6rem+env(safe-area-inset-bottom,0px)))]">
        <h2 className="text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy">Häufige Fragen</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {SIC_FAQ.map((item, i) => {
            const open = openFaq === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left min-[400px]:px-5"
                >
                  <span className="min-w-0 text-sm font-semibold text-sic-navy">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <p className="px-4 pb-4 text-sm leading-relaxed text-slate-600 min-[400px]:px-5">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Sticky-CTA (deckende Bottom-Bar) ─────────────────────────────── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-sic-hairline bg-sic-paper/95 shadow-[0_-4px_20px_rgba(10,31,69,0.08)] backdrop-blur transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 py-3 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pl-[max(1.25rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.25rem,env(safe-area-inset-right,0px))]">
          <span className="hidden text-sm font-semibold text-sic-navy sm:block">
            {isReturning ?
              nothingToBuy ?
                'Dein Zertifikat ist vollständig.'
              : 'Fehlende Angabe ergänzen.'
            : IS_FREE ?
              'Zertifikat anlegen — für die nächste Bewerbung.'
            : `Anlegen für ${PRICE_LABEL}. Für die nächste Bewerbung.`}
          </span>
          {isReturning ?
            nothingToBuy ?
            <a
              href={sicPaths.certificateWorkspace}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-2.5 text-sm font-semibold text-white touch-manipulation transition-transform hover:bg-sic-action-deep sm:ml-auto sm:w-auto sm:hover:-translate-y-0.5"
            >
              Zum Zertifikat <ArrowRight className="h-4 w-4" />
            </a>
            : <a
              href={`${sicPaths.certificateWorkspace}#erganzen`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-2.5 text-sm font-semibold text-white touch-manipulation transition-transform hover:bg-sic-action-deep sm:ml-auto sm:w-auto sm:hover:-translate-y-0.5"
            >
              Angabe ergänzen <ArrowRight className="h-4 w-4" />
            </a>
          : <button
              type="button"
              onClick={() => void checkout()}
              disabled={submitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-2.5 text-sm font-semibold text-white touch-manipulation transition-transform hover:bg-sic-action-deep disabled:translate-y-0 disabled:opacity-60 sm:ml-auto sm:w-auto sm:hover:-translate-y-0.5"
            >
              {submitting ? 'Wird erstellt …' : 'Zertifikat anlegen'}{' '}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          }
        </div>
      </div>
    </div>
  )
}

function CertUrkundeCard() {
  return (
    <div className="relative min-w-0">
      <span className="absolute right-3 top-3 z-20 rounded-full bg-sic-navy-deep/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        Beispiel
      </span>
      <article className="relative overflow-hidden border border-sic-navy bg-sic-paper shadow-xl shadow-black/25">
        <header className="relative flex flex-col items-center bg-sic-navy px-4 pb-3.5 pt-5">
          <p className="absolute right-3 top-2 hidden font-mono text-[9px] font-semibold tracking-[0.12em] text-sic-gold-light/90 sm:block">
            SIC-2026-BEISPIEL
          </p>
          <HouseMark size={36} onDark />
          <p className="mt-1.5 text-sm font-bold tracking-tight text-white">
            Swiss <span style={{ color: SIC_COLORS.red }}>Immo</span> Cert
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px w-6 bg-sic-gold" />
            <span className="text-[9px] font-semibold tracking-[0.24em] text-sic-gold-light">
              MIETER-ZERTIFIKAT
            </span>
            <span className="h-px w-6 bg-sic-gold" />
          </div>
          <p className="mt-1.5 text-[10px] tracking-wide text-[#e8d5a3]">{SIC_CERT_TAGLINE}</p>
        </header>

        <div className="px-4 pb-4 pt-3 sm:px-5">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-sic-navy">
            {sicCompletenessLabel(SIC_MODULES.length)}
          </p>

          <div className="mt-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Ausgestellt für</p>
            <p className="mt-0.5 text-base font-bold text-sic-navy">Beispiel · Inhaberin</p>
            <div className="mt-1.5 flex justify-center">
              <DocumentRule width={120} />
            </div>
          </div>

          <ul className="mt-3 divide-y divide-sic-hairline">
            {CERT_PREVIEW.map(row => (
              <li key={row.id} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-sic-navy bg-sic-paper-soft">
                  <ModuleGlyph moduleId={row.id} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-sic-navy">{getSicModule(row.id).title}</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {row.lines.map(line => (
                      <li key={line} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-navy" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="mt-0.5 hidden flex-shrink-0 text-[8px] font-bold tracking-[0.1em] text-sic-navy min-[380px]:inline">
                  {SIC_MODULE_BADGE}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t border-sic-hairline pt-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Zertifikatsdatum</p>
                <p className="text-[10px] font-semibold text-sic-navy">12.06.2026</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Gültig bis</p>
                <p className="text-[10px] font-semibold text-sic-navy">12.09.2026</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold text-sic-navy">{SIC_ISSUER_LINE}</p>
                <p className="mt-0.5 text-[9px] text-slate-500">12.06.2026</p>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/sic/beispiel-qr.svg"
                  alt=""
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] bg-sic-paper"
                />
                <p className="mt-1 max-w-[4.75rem] text-center text-[7px] leading-tight text-slate-500">
                  Prüfseite: QR-Code scannen
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
