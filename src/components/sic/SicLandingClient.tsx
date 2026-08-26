'use client'

import { SicLogoMark } from '@/components/sic/SicLogo'
import { SIC_COLORS, SIC_MODULE_ACCENT } from '@/lib/sic/brand'
import { SIC_FAQ } from '@/lib/sic/faq'
import { SIC_MODULES, SIC_VALIDITY_MONTHS, type SicModuleId } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import type { SicLandingAccount } from '@/lib/sic/landing-account'
import { sicPaths } from '@/lib/sic/config'
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

function formatSicPrice(chf: number): string {
  return chf <= 0 ? 'Kostenlos' : `CHF ${chf}.–`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Neukunden: Komplett-Paket vorausgewählt (stärkster Auftritt, eine Entscheidung). */
const RECOMMENDED: SicModuleId[] = SIC_MODULES.map(m => m.id)

const MODULE_ICON: Record<SicModuleId, LucideIcon> = {
  BONITAET: ShieldCheck,
  ARBEIT_EINKOMMEN: Briefcase,
  ZUVERLAESSIGKEIT: UserCheck,
  AUFENTHALT: Globe,
}

const HOW_STEPS: { icon: LucideIcon; title: string }[] = [
  { icon: Mail, title: 'E-Mail angeben — dein Zertifikat ist angelegt' },
  { icon: Upload, title: 'Unterlagen hochladen: Auszug, Lohn, Formulare' },
  { icon: ListChecks, title: 'Wir prüfen — meist innert 24 Stunden' },
  { icon: QrCode, title: 'Fertiges PDF der Bewerbung beilegen' },
]

const TODAY_SCENES = [
  'Für eine Wohnung kommen oft Dutzende Bewerbungen. Dreissig Leute an der Besichtigung sind keine Ausnahme.',
  'Der Vermieter öffnet ein paar Dossiers. Der Rest — Lohn, Betreibung, Ausweis — bleibt ungelesen. Die Wohnung ist trotzdem weg.',
]

const CERT_PREVIEW: { label: string; value: string; module: SicModuleId }[] = [
  { label: 'Betreibungen', value: 'Keine offenen', module: 'BONITAET' },
  { label: 'Jahreslohn', value: 'CHF 90’000', module: 'ARBEIT_EINKOMMEN' },
  { label: 'Arbeitsstelle', value: 'Ungekündigt, seit 6 Jahren', module: 'ARBEIT_EINKOMMEN' },
  { label: 'Aktuelle Wohnung', value: 'Seit 5 Jahren', module: 'ZUVERLAESSIGKEIT' },
  { label: 'Referenz Vermieter', value: 'Positiv', module: 'ZUVERLAESSIGKEIT' },
  { label: 'Ausweis', value: 'Gültig', module: 'AUFENTHALT' },
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
  const [name, setName] = useState(account?.holderName ?? '')
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
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse an.')
      return
    }
    if (isBaseOnly && !baseOnlyAck) {
      toast.error('Bitte bestätige, dass du das Zertifikat ohne Angaben anlegen möchtest.')
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
        body: JSON.stringify({ email: email.trim(), moduleIds, name: name.trim() || undefined }),
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
    <div className="bg-white">
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
        <div className="border-b border-[#0f2b5e]/15 bg-[#0f2b5e]/[0.04] px-5 py-3.5">
          <div className="mx-auto max-w-6xl text-sm text-[#0f2b5e]">
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
      <section className="relative overflow-hidden bg-[#0a1f45] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(60% 60% at 80% 0%, rgba(28,61,120,0.9) 0%, rgba(10,31,69,0) 60%), radial-gradient(50% 50% at 0% 100%, rgba(184,145,47,0.18) 0%, rgba(10,31,69,0) 60%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pt-16 lg:pb-20 lg:pt-20">
          {isReturning ?
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
                Dein Mieter-Zertifikat
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
                Status und Uploads findest du unter «Mein Zertifikat». Hier kannst du fehlende Angaben
                ergänzen.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {!nothingToBuy ?
                  <a
                    href="#module"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                  >
                    Angabe ergänzen <ArrowRight className="h-4 w-4" />
                  </a>
                : <a
                    href={sicPaths.certificateWorkspace}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
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
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: SIC_COLORS.goldLight }} />
                  Für Wohnungssuchende in der Schweiz
                </span>
                <h1 className="mt-6 text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl">
                  Du schickst die Unterlagen.{' '}
                  <span style={{ color: SIC_COLORS.goldLight }}>Es kommt keine Antwort.</span>
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                  Lohn, Betreibung, Ausweis — und trotzdem still. Nicht weil du ungeeignet bist: weil Dutzende
                  dasselbe schicken. Ein Mieter-Zertifikat ist das eine PDF, das der Vermieter in Sekunden
                  scannen und verstehen kann.
                </p>
                <a
                  href="#module"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                >
                  Zertifikat anlegen <ArrowRight className="h-4 w-4" />
                </a>
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
          <section className="bg-[#fbf9f3]">
            <div className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b8912f]">
                So ist es heute
              </p>
              <div className="mt-8">
                {TODAY_SCENES.map((scene, i) => (
                  <p
                    key={scene}
                    className={`text-xl leading-snug text-[#0f2b5e] sm:text-[1.65rem] ${
                      i > 0 ? 'mt-6 border-t border-[#b8912f]/35 pt-6' : ''
                    }`}
                  >
                    {scene}
                  </p>
                ))}
              </div>
              <p className="mt-8 text-lg font-semibold leading-snug text-[#0f2b5e] sm:text-xl">
                Deshalb ein Dokument mit QR: er sieht die Angaben in einer Ansicht — du erklärst nicht fünf
                Anhänge.
              </p>
            </div>
          </section>

          <section className="bg-white py-14 sm:py-16">
            <div className="mx-auto max-w-5xl px-5">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b8912f]">
                Was der Vermieter öffnet
              </p>
              <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-[#0f2b5e] sm:text-3xl">
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
                <div className="rounded-2xl border border-[#b8912f]/40 bg-[#fbf9f3] p-5 ring-1 ring-[#b8912f]/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#b8912f]">Mit SIC</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f2b5e]">Bewerbung — 1 Anhang</p>
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#0f2b5e]/15 bg-white px-3 py-3">
                    <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#0f2b5e]" />
                    <div>
                      <p className="text-sm font-semibold text-[#0f2b5e]">Mieter-Zertifikat.pdf</p>
                      <p className="text-xs text-slate-500">
                        Betreibungen, Lohn, Referenz, Ausweis — mit QR-Code
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#0f2b5e]/70">
                    Wir haben die Unterlagen vorher angeschaut. Über den QR-Code sieht er, dass das Dokument
                    echt ist.
                  </p>
                </div>
              </div>
              <p className="mx-auto mt-8 max-w-xl text-center text-sm text-slate-500">
                <a href="#module" className="font-semibold text-[#c8102e] hover:underline">
                  Zertifikat anlegen
                </a>
                <span className="text-slate-400"> · kostenlos, meist innert 24 Stunden geprüft</span>
              </p>
            </div>
          </section>
        </>
      : null}

      {/* ── So funktioniert's ────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f2b5e]">So läuft es ab</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
            Zum Start reicht deine E-Mail. Die Unterlagen sammelst du danach in deinem Tempo — das fertige PDF
            gibt es, wenn alles geprüft ist. Kostenlos, {SIC_VALIDITY_MONTHS} Monate gültig.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0f2b5e] text-white">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-bold text-[#b8912f]">{i + 1}</span>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700">{step.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Module (Builder + Live-Vorschau) ─────────────────────────────── */}
      <section id="module" className="py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="text-center">
            <div className="mx-auto flex w-fit items-center gap-2 text-[#c8102e]">
              <SicLogoMark size={26} />
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0f2b5e] sm:text-4xl">
              {isReturning ? 'Zertifikat erweitern' : 'Das kommt aufs Zertifikat'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-500">
              {isReturning ?
                'Was du schon hast, ist markiert. Fehlendes kannst du ergänzen.'
              : 'Vier Dinge will fast jeder Vermieter sehen. Alle vier sind vorausgewählt — du kannst etwas weglassen.'}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#0f2b5e]/10 bg-[#0f2b5e]/[0.03] px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-[#0f2b5e]">Dein Zertifikat</p>
              <p className="text-sm tabular-nums text-slate-600">
                {coveredCount} von {SIC_MODULES.length}
              </p>
            </div>
            <div className="mt-2.5 flex gap-1.5" aria-hidden>
              {SIC_MODULES.map((m, i) => (
                <span
                  key={m.id}
                  className={`h-2 flex-1 rounded-full ${
                    i < coveredCount ? 'bg-[#0f2b5e]' : 'bg-slate-200'
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
                  'border-[#0f2b5e] bg-[#0f2b5e]/[0.04]'
                : 'border-slate-200 hover:border-[#0f2b5e]/40'
              } disabled:opacity-50`}
            >
              <span
                className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-md border ${
                  allAvailableSelected ? 'border-[#0f2b5e] bg-[#0f2b5e] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {allAvailableSelected && <Check className="h-4 w-4" />}
              </span>
              <span className="text-sm font-semibold text-[#0f2b5e]">
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
                      'cursor-default border-[#2f9e44]/25 bg-[#2f9e44]/[0.04] opacity-90'
                    : on ?
                      `border-transparent shadow-md ring-2 ${accent.ring}`
                    : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {alreadyOwned ?
                    <span className="absolute right-3 top-3 rounded-full bg-[#1f7a34] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
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
                  <p className="mt-4 text-lg font-bold leading-tight text-[#0f2b5e]">{m.title}</p>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{m.youUpload}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    {alreadyOwned ?
                      <span className="text-xs font-bold uppercase tracking-wide text-[#1f7a34]">Enthalten</span>
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
                      <span className="text-xs font-semibold text-slate-500">{formatSicPrice(m.priceChf)}</span>
                    : null}
                  </div>
                </button>
              )
            })}
          </div>

          {nothingToBuy ?
            <p className="mt-6 rounded-xl border border-[#2f9e44]/20 bg-[#2f9e44]/[0.06] px-4 py-3 text-center text-sm text-[#1f7a34]">
              Alle vier Angaben sind bereits Teil deines Zertifikats. Uploads und Status findest du unter{' '}
              <a href={sicPaths.certificateWorkspace} className="font-semibold underline">
                Mein Zertifikat
              </a>{' '}
              verwalten.
            </p>
          : null}

          {/* Ein Formular, eine Spalte — die Auswahl steht bereits oben */}
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#0f2b5e]/10 bg-[#0f2b5e]/[0.03] p-6 sm:p-7">
            <label htmlFor="sic-name" className="block text-sm font-semibold text-[#0f2b5e]">
              Dein Name
            </label>
            <input
              id="sic-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Vorname Nachname"
              autoComplete="name"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-[#0f2b5e]/15 focus:border-[#0f2b5e] focus:ring-2"
            />
            <p className="mt-1.5 text-xs text-slate-500">So steht er später auf dem Zertifikat.</p>

            <label htmlFor="sic-email" className="mt-5 block text-sm font-semibold text-[#0f2b5e]">
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
              className={`mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-[#0f2b5e]/15 focus:border-[#0f2b5e] focus:ring-2 ${
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
                      className={`flex justify-between ${l.kind === 'discount' ? 'text-[#2f9e44]' : 'text-slate-600'}`}
                    >
                      <dt>{l.label}</dt>
                      <dd className="tabular-nums">
                        {l.amountChf < 0 ? `− ${formatSicPrice(Math.abs(l.amountChf))}` : formatSicPrice(l.amountChf)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex items-baseline justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm font-medium text-slate-500">Total</span>
                  <span className="text-xl font-bold tabular-nums text-[#0f2b5e]">
                    {formatSicPrice(quote.totalChf)}
                  </span>
                </div>
              </div>
            : <p className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold text-[#0f2b5e]">
                Kostenlos — {SIC_VALIDITY_MONTHS} Monate gültig.
              </p>
            }
            {quoteNote ?
              <p className="mt-2 text-xs font-medium text-[#1f7a34]">{quoteNote}</p>
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
              type="button"
              onClick={checkout}
              disabled={
                submitting ||
                nothingToBuy ||
                (isBaseOnly && !baseOnlyAck) ||
                (isReturning && moduleIds.length === 0)
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-5 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
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
                <ShieldCheck className="h-3.5 w-3.5 text-[#0f2b5e]" /> Schweizer Datenschutz (revDSG)
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="h-3.5 w-3.5 text-[#0f2b5e]" /> Verschlüsselt gespeichert
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-[#0f2b5e]" /> Unterlagen 30 Tage nach Ablauf gelöscht
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Inline-FAQ ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#0f2b5e]">Häufige Fragen</h2>
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
                  <span className="text-sm font-semibold text-[#0f2b5e]">{item.q}</span>
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
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(10,31,69,0.08)] backdrop-blur transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <span className="hidden text-sm font-semibold text-[#0f2b5e] sm:block">
            {isReturning ?
              nothingToBuy ?
                'Dein Zertifikat ist vollständig.'
              : 'Fehlende Angabe ergänzen.'
            : 'Kostenlos anlegen. Unterlagen lädst du danach in deinem Tempo hoch.'}
          </span>
          {isReturning && nothingToBuy ?
            <a
              href={sicPaths.certificateWorkspace}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#0f2b5e] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Zum Zertifikat <ArrowRight className="h-4 w-4" />
            </a>
          : <a
              href="#module"
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#c8102e] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {isReturning ? 'Angabe ergänzen' : 'Zertifikat anlegen'} <ArrowRight className="h-4 w-4" />
            </a>
          }
        </div>
      </div>
    </div>
  )
}

function CertUrkundeCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#fbf9f3] p-1.5 shadow-xl shadow-black/25 ring-1 ring-[#b8912f]/50">
      <span className="absolute right-4 top-4 z-10 rounded-full bg-[#0a1f45]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        Beispiel
      </span>
      <div className="overflow-hidden rounded-xl border border-[#b8912f]/60">
        <div className="bg-[#0f2b5e] px-5 py-5 text-center">
          <div className="mx-auto flex w-fit justify-center">
            <SicLogoMark size={36} />
          </div>
          <p className="mt-2 text-sm font-bold tracking-[0.18em] text-white">SWISS IMMO CERT</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d8b25a]">Mieter-Zertifikat</p>
        </div>
        <div className="bg-[#fbf9f3] px-5 pb-5 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ausgestellt für</p>
          <p className="font-serif text-base font-bold text-[#0f2b5e]">Beispiel · Inhaberin</p>
          <dl className="mt-3 divide-y divide-[#e7ddc4]">
            {CERT_PREVIEW.map(row => (
              <div key={row.label} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-[#0f2b5e]">{row.label}</dt>
                  <dd className="truncate text-xs text-slate-500">{row.value}</dd>
                </div>
                <span className="inline-flex flex-shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#b8912f]">
                  <Check className="h-3 w-3" /> Verifiziert
                </span>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-center justify-between border-t border-[#e7ddc4] pt-3 text-[10px] text-slate-400">
            <span>Geprüft. Verifiziert. Vertrauenswürdig.</span>
            <span className="rounded bg-[#0f2b5e] px-2 py-0.5 font-semibold text-white">QR-geschützt</span>
          </div>
        </div>
      </div>
    </div>
  )
}
