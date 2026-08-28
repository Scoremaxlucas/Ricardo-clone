'use client'

import { SicLogoMark } from '@/components/sic/SicLogo'
import { SIC_CERT_TAGLINE, SIC_HERO_IMAGE, SIC_MODULE_ACCENT } from '@/lib/sic/brand'
import { SIC_FAQ } from '@/lib/sic/faq'
import { SIC_SCENARIOS } from '@/lib/sic/reviews'
import {
  formatSicChf,
  getSicModule,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULES,
  SIC_VALIDITY_MONTHS,
  sicCompletenessLabel,
  sicIsFree,
  type SicModuleId,
} from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { SIC_DOCS_RETENTION_DAYS } from '@/lib/sic/validity'
import type { SicLandingAccount } from '@/lib/sic/landing-account'
import { sicPaths, SIC_BRAND_NAME, SIC_REVIEW_SLA, SIC_REVIEW_SLA_SENTENCE } from '@/lib/sic/config'
import {
  CornerFlourish,
  CrestWithLaurel,
  GuillocheRule,
  ModuleGlyph,
  Seal,
} from '@/lib/sic/cert/art-web'
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Globe,
  ListChecks,
  Lock,
  Mail,
  Paperclip,
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

/** Neukunden: Komplett-Paket vorausgewählt (stärkster Auftritt, eine Entscheidung). */
const RECOMMENDED: SicModuleId[] = SIC_MODULES.map(m => m.id)

const MODULE_ICON: Record<SicModuleId, LucideIcon> = {
  BONITAET: ShieldCheck,
  ARBEIT_EINKOMMEN: Briefcase,
  ZUVERLAESSIGKEIT: UserCheck,
  AUFENTHALT: Globe,
}

const HOW_STEPS: { icon: LucideIcon; title: string; note: string }[] = [
  {
    icon: Mail,
    title: 'E-Mail angeben — dein Zertifikat ist angelegt',
    note: 'Kein Passwort. Anmelden per Link.',
  },
  {
    icon: Upload,
    title: 'Unterlagen hochladen, Angabe für Angabe',
    note: 'Betreibungsauszug und Ausweis hast du selbst. Für Lohn und Referenz brauchst du eine Unterschrift — das dauert.',
  },
  {
    icon: ListChecks,
    title: 'Wir prüfen jede Angabe einzeln',
    note: SIC_REVIEW_SLA_SENTENCE,
  },
  {
    icon: QrCode,
    title: 'PDF herunterladen und der Bewerbung beilegen',
    note: 'Geht schon ab der ersten geprüften Angabe — auch wenn die Referenz vom Vermieter noch Wochen dauert.',
  },
]

const TODAY_SCENES = [
  'Für eine Wohnung kommen oft Dutzende Bewerbungen. Dreissig Leute an der Besichtigung sind keine Ausnahme.',
  'Der Vermieter öffnet ein paar Dossiers. Der Rest — Lohn, Betreibung, Ausweis — bleibt ungelesen. Die Wohnung ist trotzdem weg.',
]

/** Beispiel wie auf dem PDF: eine Angabe, geprüfte Zeilen, Badge VERIFIZIERT. */
const CERT_PREVIEW: { id: SicModuleId; lines: string[] }[] = [
  { id: 'BONITAET', lines: ['Keine offenen Betreibungen · Auszug vom 12.06.2026'] },
  {
    id: 'ARBEIT_EINKOMMEN',
    lines: ['CHF 90’000 – 110’000', 'Unbefristet seit März 2020', 'Tragbare Miete bis CHF 2’500 (3×-Regel)'],
  },
  { id: 'ZUVERLAESSIGKEIT', lines: ['Seit 2021, Miete immer pünktlich'] },
  { id: 'AUFENTHALT', lines: ['Schweizer Pass, gültig bis Mai 2031'] },
]

export function SicLandingClient({ account }: { account?: SicLandingAccount | null }) {
  const owned = useMemo(() => new Set<SicModuleId>(account?.ownedModules ?? []), [account])
  const isReturning = Boolean(account)
  const availableModules = useMemo(() => SIC_MODULES.filter(m => !owned.has(m.id)), [owned])

  const initialSelected = useMemo(() => {
    if (!isReturning) return new Set<SicModuleId>(RECOMMENDED)
    // Bereits gekaufte Module nicht vorauswählen; empfohlen nur unter den verfügbaren
    const next = RECOMMENDED.filter(id => !owned.has(id))
    return new Set<SicModuleId>(next.length > 0 ? next : [])
  }, [isReturning, owned])

  const [selected, setSelected] = useState<Set<SicModuleId>>(initialSelected)
  const [firstName, setFirstName] = useState(account?.holderFirstName ?? '')
  const [lastName, setLastName] = useState(account?.holderLastName ?? '')
  const [email, setEmail] = useState(account?.email ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showSticky, setShowSticky] = useState(false)
  const [loginInvalid, setLoginInvalid] = useState(false)
  const [baseOnlyAck, setBaseOnlyAck] = useState(false)
  const [serverQuote, setServerQuote] = useState<ReturnType<typeof quoteSicOrder> | null>(null)
  const [quoteNote, setQuoteNote] = useState<string | null>(null)

  const moduleIds = useMemo(
    () => SIC_MODULES.filter(m => selected.has(m.id) && !owned.has(m.id)).map(m => m.id),
    [selected, owned]
  )
  const includeBaseFee = !isReturning
  const localQuote = useMemo(
    () => quoteSicOrder({ includeBaseFee, moduleIds }),
    [includeBaseFee, moduleIds]
  )
  const quote = serverQuote ?? localQuote
  const allAvailableSelected =
    availableModules.length > 0 && availableModules.every(m => selected.has(m.id))
  const coveredCount = SIC_MODULES.filter(m => owned.has(m.id) || selected.has(m.id)).length
  const missingTitles = SIC_MODULES.filter(m => !owned.has(m.id) && !selected.has(m.id)).map(m => m.title)
  const isBaseOnly = !isReturning && moduleIds.length === 0
  const nothingToBuy = isReturning && availableModules.length === 0
  const verifiedCount = account?.verifiedModules.length ?? 0
  const ownedCount = owned.size
  const statusLabel =
    account?.status === 'REVOKED' ? 'widerrufen'
    : account?.status === 'EXPIRED' ? 'abgelaufen'
    : ownedCount > 0 && verifiedCount === ownedCount ? 'verifiziert'
    : verifiedCount > 0 ? 'teilweise verifiziert'
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
    const onScroll = () => {
      const y = window.scrollY
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 200
      setShowSticky(y > 640 && !nearBottom)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    // Quote nur wenn E-Mail gültig; Returning nutzt Session-Mail
    if (!EMAIL_RE.test(email.trim())) {
      if (!isReturning) {
        setServerQuote(null)
        setQuoteNote(null)
      }
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
        setQuoteNote(typeof data.note === 'string' ? data.note : null)
      } catch {
        // ignore abort / network — keep local quote
      }
    }, 400)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [email, moduleIds, isReturning])

  useEffect(() => {
    if (!isBaseOnly) setBaseOnlyAck(false)
  }, [isBaseOnly])

  function toggle(id: SicModuleId) {
    if (owned.has(id)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleBundle() {
    if (availableModules.length === 0) return
    setSelected(prev => {
      if (availableModules.every(m => prev.has(m.id))) {
        // Nur verfügbare abwählen; owned bleiben irrelevant
        return new Set()
      }
      return new Set(availableModules.map(m => m.id))
    })
  }

  async function checkout() {
    if (nothingToBuy) {
      toast.error('Alles ist bereits Teil deines Zertifikats.')
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Bitte Vor- und Nachname angeben.')
      const missingFirst = !firstName.trim()
      const field = document.getElementById(
        isReturning ? (missingFirst ? 'sic-first' : 'sic-last') : missingFirst ? 'sic-hero-first' : 'sic-hero-last'
      )
      const anchor = document.getElementById('anlegen') || document.getElementById('module')
      anchor?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (field instanceof HTMLInputElement) field.focus()
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse an.')
      const field = document.getElementById(isReturning ? 'sic-email' : 'sic-hero-email')
      const anchor = document.getElementById('anlegen') || document.getElementById('module')
      anchor?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (field instanceof HTMLInputElement) field.focus()
      return
    }
    if (isBaseOnly && !baseOnlyAck) {
      toast.error('Bitte bestätige, dass du das Zertifikat ohne Angaben anlegen möchtest.')
      document.getElementById('module')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (isReturning && moduleIds.length === 0) {
      toast.error('Bitte wähle mindestens eine neue Angabe.')
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
          <a href={sicPaths.certificateWorkspace} className="font-semibold underline">
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
            <span className="font-mono text-xs">{account.certificateCode}</span>
            {owned.size > 0 ?
              <span className="mt-0.5 block text-xs text-slate-600 sm:mt-0 sm:inline sm:before:mx-1.5 sm:before:content-['·']">
                {owned.size} von {SIC_MODULES.length} Angaben enthalten
                {availableModules.length > 0 ? ' — du kannst ergänzen' : ' — vollständig'}
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
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-16 lg:pb-20 lg:pt-20">
          {isReturning ?
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-sic-serif text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
                Dein Mieter-Zertifikat
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
                Status und Uploads findest du unter «Mein Zertifikat». Hier kannst du fehlende Angaben
                ergänzen.
              </p>
              <div id="anlegen" className="mt-8 flex scroll-mt-24 flex-col items-center justify-center gap-3 sm:flex-row">
                {!nothingToBuy ?
                  <a
                    href="#module"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sic-action hover:bg-sic-action-deep px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                  >
                    Angabe ergänzen <ArrowRight className="h-4 w-4" />
                  </a>
                : <a
                    href={sicPaths.certificateWorkspace}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sic-action hover:bg-sic-action-deep px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                  >
                    Zum Zertifikat <ArrowRight className="h-4 w-4" />
                  </a>
                }
                <a
                  href={sicPaths.certificateWorkspace}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
                >
                  Mein Zertifikat
                </a>
              </div>
            </div>
          : <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-sic-gold-light" />
                  Für Wohnungssuchende in der Schweiz
                </span>
                <h1 className="mt-6 font-sic-serif text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl">
                  Du schickst die Unterlagen.{' '}
                  <span className="text-sic-gold-light">Es kommt keine Antwort.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                  Lohn, Betreibung, Ausweis — und trotzdem still. Nicht weil du ungeeignet bist: weil Dutzende
                  dasselbe schicken. Ein Mieter-Zertifikat ist das eine PDF, das der Vermieter in Sekunden
                  scannen und verstehen kann.
                </p>
                <form
                  id="anlegen"
                  className="mt-8 max-w-md scroll-mt-24"
                  onSubmit={e => {
                    e.preventDefault()
                    void checkout()
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
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
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-sm text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
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
                        className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-sm text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                      />
                    </div>
                  </div>
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
                    className="mt-1.5 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-sm text-sic-navy outline-none ring-sic-gold/30 placeholder:text-slate-400 focus:ring-2"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 hover:bg-sic-action-deep disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? 'Wird erstellt …' : 'Zertifikat anlegen'}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <p className="mt-2.5 text-xs leading-relaxed text-white/50">
                    {coveredCount} von {SIC_MODULES.length} Angaben ·{' '}
                    {quote.totalChf > 0 ? formatSicChf(quote.totalChf) : 'Kostenlos'}. Unterlagen danach.
                  </p>
                  <a
                    href="#module"
                    className="mt-3 inline-block text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
                  >
                    Angaben anpassen
                  </a>
                </form>
                <p className="mt-3 max-w-md text-xs leading-relaxed text-white/45">
                  Keine Wohnungszusage – aber eine übersichtliche Bewerbung, die Vertrauen schafft.
                </p>
              </div>
              <div id="zertifikat">
                <CertUrkundeCard />
                <p className="mt-3 text-center text-xs leading-relaxed text-white/50">
                  Er scannt den QR. Du musst nicht fünf Anhänge erklären.
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
                So ist es heute
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
                Deshalb ein Dokument mit QR: er sieht die Angaben in einer Ansicht — du erklärst nicht fünf
                Anhänge.
              </p>
            </div>
          </section>

          <section className="bg-sic-paper-soft py-14 sm:py-16">
            <div className="mx-auto max-w-5xl px-5">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
                Was der Vermieter öffnet
              </p>
              <h2 className="mt-3 text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
                Fünf Dateien, oder ein Dokument
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
                Er hat drei Minuten. Ein einheitliches PDF mit QR ist schneller zu prüfen als ein Stapel aus
                Lohn, Betreibung, ID und Referenz.
              </p>
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Heute</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">Bewerbung — 5 Anhänge</p>
                  <ul className="mt-4 space-y-2">
                    {[
                      'Lohnabrechnung.pdf',
                      'Betreibungsauszug.pdf',
                      'Pass_ID.jpg',
                      'Arbeitsvertrag.pdf',
                      'Referenz.pdf',
                    ].map(f => (
                      <li
                        key={f}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">Oft ungelesen, weil der Stapel zu lang ist.</p>
                </div>
                <div className="rounded-2xl border border-sic-gold/40 bg-sic-paper p-5 ring-1 ring-sic-gold/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sic-gold-text">Mit SIC</p>
                  <p className="mt-1 text-sm font-semibold text-sic-navy">Bewerbung — 1 Anhang</p>
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-sic-navy/15 bg-white px-3 py-3">
                    <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-sic-navy" />
                    <div>
                      <p className="text-sm font-semibold text-sic-navy">Mieter-Zertifikat.pdf</p>
                      <p className="text-xs text-slate-500">
                        Betreibungen, Lohn, Referenz, Ausweis — mit QR-Code
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-sic-navy/70">
                    Wir haben die Unterlagen vorher angeschaut. Über den QR-Code sieht er, dass das Dokument
                    echt ist.
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

      {/* ── So funktioniert's ────────────────────────────────────────────── */}
      <section className="bg-sic-paper-soft py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-sic-serif text-3xl font-bold tracking-tight text-sic-navy">So läuft es ab</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
            Zum Start reicht deine E-Mail. Die Unterlagen sammelst du danach in deinem Tempo — das PDF gibt es
            schon ab der ersten geprüften Angabe. {PRICE_LABEL}, {SIC_VALIDITY_MONTHS} Monate gültig ab der
            ersten Freigabe.
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

      {/* ── Module (Builder + Live-Vorschau) ─────────────────────────────── */}
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
                'Was du schon hast, ist markiert. Fehlendes kannst du ergänzen.'
              : 'Vier Dinge will fast jeder Vermieter sehen. Alle vier sind vorausgewählt — hier kannst du etwas weglassen.'}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-sic-navy/10 bg-sic-navy/[0.03] px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-sic-navy">Dein Zertifikat</p>
              <p className="text-sm tabular-nums text-slate-600">
                {coveredCount} von {SIC_MODULES.length}
              </p>
            </div>
            <div className="mt-2.5 flex gap-1.5" aria-hidden>
              {SIC_MODULES.map((m, i) => (
                <span
                  key={m.id}
                  className={`h-2 flex-1 rounded-full ${
                    i < coveredCount ? 'bg-sic-navy' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
              {coveredCount === SIC_MODULES.length ?
                'Vollständig — der Vermieter muss nichts nachfragen. Dein Name und der Prüfcode sind immer dabei.'
              : `Noch offen: ${missingTitles.join(', ')}. Danach fragt der Vermieter vermutlich selbst.`}
            </p>
          </div>

          {/* Alle auswählen — eine Entscheidung, kein Preisblock */}
          {!isReturning || availableModules.length > 1 ?
            <button
              type="button"
              onClick={toggleBundle}
              aria-pressed={allAvailableSelected}
              disabled={availableModules.length === 0}
              className={`mt-6 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                allAvailableSelected ?
                  'border-sic-navy bg-sic-navy/[0.04]'
                : 'border-slate-200 hover:border-sic-navy/40'
              } disabled:opacity-50`}
            >
              <span
                className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-md border ${
                  allAvailableSelected ? 'border-sic-navy bg-sic-navy text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {allAvailableSelected && <Check className="h-4 w-4" />}
              </span>
              <span className="text-sm font-semibold text-sic-navy">
                {isReturning ? `Alle ${availableModules.length} offenen ergänzen` : 'Alle vier — empfohlen'}
              </span>
            </button>
          : null}

          {/* Modul-Kacheln */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SIC_MODULES.map(m => {
              const alreadyOwned = owned.has(m.id)
              const on = selected.has(m.id) && !alreadyOwned
              const accent = SIC_MODULE_ACCENT[m.id]
              const Icon = MODULE_ICON[m.id]
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  disabled={alreadyOwned}
                  aria-pressed={on}
                  aria-disabled={alreadyOwned}
                  aria-label={`${m.title} — beantwortet: ${m.landlordQuestion}`}
                  className={`group relative flex flex-col rounded-2xl border bg-white p-6 text-left transition-all ${
                    alreadyOwned ?
                      'cursor-default border-sic-verified/25 bg-sic-verified/[0.04] opacity-90'
                    : on ?
                      `border-transparent shadow-md ring-2 ${accent.ring}`
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {alreadyOwned ?
                    <span className="absolute right-3 top-3 rounded-full bg-sic-verified-text px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Bereits enthalten
                    </span>
                  : null}
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full text-white transition-opacity ${
                      alreadyOwned || on ? '' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: alreadyOwned ? '#2f9e44' : accent.hex }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-lg font-bold leading-tight text-sic-navy">{m.title}</p>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{m.youUpload}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    {alreadyOwned ?
                      <span className="text-xs font-bold uppercase tracking-wide text-sic-verified-text">Enthalten</span>
                    : <span
                        className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide ${
                          on ? '' : 'text-slate-400'
                        }`}
                        style={on ? { color: accent.hex } : undefined}
                      >
                        {on ?
                          <>
                            <Check className="h-3.5 w-3.5" /> Ausgewählt
                          </>
                        : 'Hinzufügen'}
                      </span>
                    }
                    {!alreadyOwned && m.priceChf > 0 ?
                      <span className="text-xs font-semibold text-slate-500">{formatSicChf(m.priceChf)}</span>
                    : null}
                  </div>
                </button>
              )
            })}
          </div>

          {nothingToBuy ?
            <p className="mt-6 rounded-xl border border-sic-verified/20 bg-sic-verified/[0.06] px-4 py-3 text-center text-sm text-sic-verified-text">
              Alle vier Angaben sind bereits Teil deines Zertifikats. Uploads und Status findest du unter{' '}
              <a href={sicPaths.certificateWorkspace} className="font-semibold underline">
                Mein Zertifikat
              </a>{' '}
              verwalten.
            </p>
          : null}

          {/* Ein Formular, eine Spalte — die Auswahl steht bereits oben */}
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-sic-navy/10 bg-sic-navy/[0.03] p-6 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="sic-first" className="block text-sm font-semibold text-sic-navy">
                  Vorname
                </label>
                <input
                  id="sic-first"
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Vorname"
                  autoComplete="given-name"
                  readOnly={Boolean(account?.holderFirstName && account?.holderLastName)}
                  className={`mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sic-navy/15 focus:border-sic-navy focus:ring-2 ${
                    account?.holderFirstName && account?.holderLastName ? 'cursor-default bg-slate-50 text-slate-600' : ''
                  }`}
                />
              </div>
              <div>
                <label htmlFor="sic-last" className="block text-sm font-semibold text-sic-navy">
                  Nachname
                </label>
                <input
                  id="sic-last"
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Nachname"
                  autoComplete="family-name"
                  readOnly={Boolean(account?.holderFirstName && account?.holderLastName)}
                  className={`mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sic-navy/15 focus:border-sic-navy focus:ring-2 ${
                    account?.holderFirstName && account?.holderLastName ? 'cursor-default bg-slate-50 text-slate-600' : ''
                  }`}
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">So steht er auf dem Zertifikat — Vor- und Nachname.</p>

            <label htmlFor="sic-email" className="mt-5 block text-sm font-semibold text-sic-navy">
              E-Mail-Adresse
            </label>
            <input
              id="sic-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@beispiel.ch"
              autoComplete="email"
              readOnly={isReturning}
              className={`mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-sic-navy/15 focus:border-sic-navy focus:ring-2 ${
                isReturning ? 'cursor-default bg-slate-50 text-slate-600' : ''
              }`}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {isReturning ?
                'Angemeldet — die neue Angabe kommt auf dein Zertifikat.'
              : 'Damit meldest du dich an, ohne Passwort. Unterlagen lädst du danach hoch — auch über mehrere Tage.'}
            </p>

            {quote.totalChf > 0 ?
              <div className="mt-5 border-t border-slate-200 pt-4">
                <dl className="space-y-2.5 text-sm">
                  {quote.lines.map((l, i) => (
                    <div
                      key={i}
                      className={`flex justify-between ${l.kind === 'discount' ? 'text-sic-verified' : 'text-slate-600'}`}
                    >
                      <dt>{l.label}</dt>
                      <dd className="tabular-nums">
                        {l.amountChf < 0 ? `− ${formatSicChf(Math.abs(l.amountChf))}` : formatSicChf(l.amountChf)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex items-baseline justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-medium text-slate-500">Total</span>
                  <span className="text-xl font-bold tabular-nums text-sic-navy">
                    {formatSicChf(quote.totalChf)}
                  </span>
                </div>
              </div>
            : <p className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold text-sic-navy">
                Kostenlos — {SIC_VALIDITY_MONTHS} Monate gültig.
              </p>
            }
            {quoteNote ?
              <p className="mt-2 text-xs font-medium text-sic-verified-text">{quoteNote}</p>
            : null}

            {isBaseOnly ?
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="text-xs leading-relaxed">
                  Ohne Angaben sieht der Vermieter nur deinen Namen und den Prüfcode. Du kannst später ergänzen.
                </p>
                <label className="mt-2.5 flex items-start gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={baseOnlyAck}
                    onChange={e => setBaseOnlyAck(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>Ist mir klar — trotzdem anlegen.</span>
                </label>
              </div>
            : null}

            <button
              id="sic-checkout-submit"
              type="button"
              onClick={checkout}
              disabled={
                submitting ||
                nothingToBuy ||
                (isBaseOnly && !baseOnlyAck) ||
                (isReturning && moduleIds.length === 0)
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sic-action hover:bg-sic-action-deep px-5 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
            >
              {submitting ?
                'Wird erstellt …'
              : nothingToBuy ?
                'Alles bereits enthalten'
              : isReturning ?
                'Hinzufügen'
              : 'Zertifikat anlegen'}
              {!submitting && !nothingToBuy && <ArrowRight className="h-4 w-4" />}
            </button>

            <ul className="mt-4 space-y-1.5 border-t border-slate-200 pt-3">
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-sic-navy" /> Schweizer Datenschutz (revDSG)
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5 text-sic-navy" /> Verschlüsselt gespeichert
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-sic-navy" /> Unterlagen {SIC_DOCS_RETENTION_DAYS} Tage nach
                Ablauf gelöscht
              </li>
            </ul>
          </div>
        </div>
      </section>

      {!isReturning ?
        <section className="border-y border-sic-hairline/70 bg-sic-paper-soft py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
              Beispielszenarien
            </p>
            <h2 className="mt-3 text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
              So kann eine Bewerbung laufen
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-500">
              Fiktive Beispiele — keine Kundenbewertungen. Echte Stimmen folgen, sobald wir sie haben.
            </p>
            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {SIC_SCENARIOS.map(scenario => (
                <figure key={scenario.name} className="flex flex-col">
                  <blockquote className="font-sic-serif text-lg leading-snug text-sic-navy sm:text-[1.15rem]">
                    «{scenario.quote}»
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-sic-hairline pt-4 text-sm text-slate-600">
                    <span
                      className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-sic-navy text-[11px] font-semibold tracking-wide text-white"
                      aria-hidden
                    >
                      {scenario.initials}
                    </span>
                    <span>
                      <span className="font-semibold text-sic-navy">{scenario.name}</span>
                      <span className="text-slate-400"> · </span>
                      {scenario.place}
                      <span className="mt-0.5 block text-xs text-slate-500">Beispiel</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      : null}

      {/* ── Inline-FAQ ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-16 pb-24">
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
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-sic-navy">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.a}</p>}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Sticky-CTA (deckende Bottom-Bar) ─────────────────────────────── */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-sic-hairline bg-sic-paper/95 shadow-[0_-4px_20px_rgba(10,31,69,0.08)] backdrop-blur transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <span className="hidden text-sm font-semibold text-sic-navy sm:block">
            {isReturning ?
              nothingToBuy ?
                'Dein Zertifikat ist vollständig.'
              : 'Fehlende Angabe ergänzen.'
            : IS_FREE ?
              'Kostenlos anlegen. Unterlagen lädst du danach in deinem Tempo hoch.'
            : `Anlegen für ${PRICE_LABEL}. Unterlagen lädst du danach in deinem Tempo hoch.`}
          </span>
          {isReturning && nothingToBuy ?
            <a
              href={sicPaths.certificateWorkspace}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sic-action px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-sic-action-deep"
            >
              Zum Zertifikat <ArrowRight className="h-4 w-4" />
            </a>
          : <button
              type="button"
              onClick={() => void checkout()}
              disabled={submitting}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-sic-action px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-sic-action-deep disabled:translate-y-0 disabled:opacity-60"
            >
              {submitting ?
                'Wird erstellt …'
              : isReturning ?
                'Angabe ergänzen'
              : 'Zertifikat anlegen'}{' '}
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
    <div className="relative">
      <span className="absolute right-3 top-3 z-20 rounded-full bg-sic-navy-deep/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        Beispiel
      </span>
      <article className="relative border-[2.4px] border-sic-navy bg-sic-paper p-1 shadow-xl shadow-black/25">
        <div className="relative overflow-hidden border border-sic-gold px-4 pb-5 pt-0 sm:px-5">
          <span className="pointer-events-none absolute left-1 top-1">
            <CornerFlourish corner="tl" size={22} />
          </span>
          <span className="pointer-events-none absolute right-1 top-1">
            <CornerFlourish corner="tr" size={22} />
          </span>
          <span className="pointer-events-none absolute bottom-1 left-1">
            <CornerFlourish corner="bl" size={22} />
          </span>
          <span className="pointer-events-none absolute bottom-1 right-1">
            <CornerFlourish corner="br" size={22} />
          </span>

          <header className="relative -mx-4 mt-2 flex flex-col items-center bg-sic-navy px-3 pb-3 pt-4 sm:-mx-5">
            <p className="absolute right-2.5 top-1.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-sic-gold-light/90">
              SIC-2026-BEISPIEL
            </p>
            <CrestWithLaurel size={56} />
            <p className="mt-0.5 font-sic-serif text-base font-bold tracking-[0.08em] text-white">
              {SIC_BRAND_NAME}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-px w-7 bg-sic-gold" />
              <span className="text-[9px] font-semibold tracking-[0.28em] text-sic-gold-light">
                MIETER-ZERTIFIKAT
              </span>
              <span className="h-px w-7 bg-sic-gold" />
            </div>
            <p className="mt-1.5 text-[10px] tracking-wide text-[#e8d5a3]">{SIC_CERT_TAGLINE}</p>
          </header>

          <p className="mx-auto mt-3 w-fit border border-sic-gold-light bg-sic-paper-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sic-gold-text">
            {sicCompletenessLabel(SIC_MODULES.length)}
          </p>

          <div className="mt-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Ausgestellt für</p>
            <p className="mt-0.5 font-sic-serif text-lg font-bold text-sic-navy">Beispiel · Inhaberin</p>
            <div className="mt-1.5 flex justify-center">
              <GuillocheRule width={120} />
            </div>
          </div>

          <ul className="mt-3 divide-y divide-sic-hairline">
            {CERT_PREVIEW.map(row => (
              <li key={row.id} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-sic-gold bg-sic-paper-soft">
                  <ModuleGlyph moduleId={row.id} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-sic-navy">{getSicModule(row.id).title}</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {row.lines.map(line => (
                      <li key={line} className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-600">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-gold" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="mt-0.5 flex-shrink-0 border border-sic-gold bg-sic-paper-soft px-1 py-0.5 text-[8px] font-bold tracking-[0.1em] text-sic-gold">
                  VERIFIZIERT
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-end justify-between gap-2 border-t border-sic-hairline pt-3">
            <Seal size={44} />
            <div className="mb-0.5 hidden flex-1 flex-col items-center sm:flex">
              <span className="h-px w-24 bg-sic-navy" />
              <p className="mt-1 text-center text-[9px] text-slate-500">
                {SIC_BRAND_NAME} · {SIC_CERT_TAGLINE}
              </p>
            </div>
            <p className="mb-0.5 max-w-[4.75rem] border border-sic-gold bg-sic-paper-soft px-1.5 py-1.5 text-center text-[8px] font-bold uppercase leading-tight tracking-[0.08em] text-sic-gold-text">
              Online bestätigt
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}
