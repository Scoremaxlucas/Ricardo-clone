'use client'

import { SicLogoMark } from '@/components/sic/SicLogo'
import { SIC_COLORS, SIC_MODULE_ACCENT } from '@/lib/sic/brand'
import {
  SIC_BASE_FEE_CHF,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_MODULE_FEE_CHF,
  SIC_MODULES,
  SIC_VALIDITY_MONTHS,
  type SicModuleId,
} from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Globe,
  ListChecks,
  Lock,
  QrCode,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Standardmässig empfohlene (vorausgewählte) Module. */
const RECOMMENDED: SicModuleId[] = ['BONITAET', 'ARBEIT_EINKOMMEN']
const FULL_PRICE_CHF = SIC_BASE_FEE_CHF + SIC_MODULES.length * SIC_MODULE_FEE_CHF

const MODULE_ICON: Record<SicModuleId, LucideIcon> = {
  BONITAET: ShieldCheck,
  ARBEIT_EINKOMMEN: Briefcase,
  ZUVERLAESSIGKEIT: UserCheck,
  AUFENTHALT: Globe,
}

function moduleOrder(id: SicModuleId): number {
  return SIC_MODULES.find(m => m.id === id)?.order ?? 0
}

const HOW_STEPS: { icon: LucideIcon; title: string }[] = [
  { icon: ListChecks, title: 'Module wählen & Zertifikat als Vorschau sehen' },
  { icon: CreditCard, title: 'Sicher bezahlen (Stripe) — schaltet den Upload frei' },
  { icon: Upload, title: 'Belege hochladen — wir prüfen sie' },
  { icon: QrCode, title: 'Fertiges Zertifikat mit QR-Code erhalten' },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Was passiert, wenn ein Beleg nicht anerkannt wird?',
    a: 'Wir bitten dich, einen gültigen Nachweis nachzureichen; das Modul wird danach verifiziert.',
  },
  {
    q: 'Wie lange dauert die Prüfung?',
    a: 'In der Regel innert 24 Std. nach vollständigem Upload.',
  },
  {
    q: 'Wer sieht meine Daten?',
    a: 'Nur Swiss Immo Cert zur Prüfung. Vermieter sehen nur dein fertiges Zertifikat, das du selbst teilst.',
  },
  {
    q: 'Akzeptieren Vermieter das Zertifikat?',
    a: 'Swiss Immo Cert ist ein unabhängiges, standardisiertes Zertifikat, das du deiner Bewerbung als PDF beilegst — bei jeder Wohnung, über jedes Portal. Ob ein Vermieter es berücksichtigt, entscheidet er selbst; das geprüfte, einheitliche Format macht deine Bewerbung nachvollziehbarer.',
  },
]

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

const CERT_PREVIEW: { label: string; value: string; module: SicModuleId }[] = [
  { label: 'Bonität', value: 'Keine Betreibungen', module: 'BONITAET' },
  { label: 'Bruttojahreseinkommen', value: 'CHF 90’000', module: 'ARBEIT_EINKOMMEN' },
  { label: 'Arbeitsverhältnis', value: 'Ungekündigt', module: 'ARBEIT_EINKOMMEN' },
  { label: 'Arbeitgeber', value: 'Seit 6 Jahren beschäftigt', module: 'ARBEIT_EINKOMMEN' },
  { label: 'Aktuelle Wohnung', value: 'Seit 5 Jahren wohnhaft', module: 'ARBEIT_EINKOMMEN' },
  { label: 'Vermieterreferenz', value: 'Positiv bestätigt', module: 'ZUVERLAESSIGKEIT' },
  { label: 'Aufenthaltsstatus', value: 'Gültige Bewilligung', module: 'AUFENTHALT' },
]

export function SicLandingClient() {
  const [selected, setSelected] = useState<Set<SicModuleId>>(new Set(RECOMMENDED))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [showSticky, setShowSticky] = useState(false)

  const moduleIds = useMemo(() => SIC_MODULES.filter(m => selected.has(m.id)).map(m => m.id), [selected])
  const quote = useMemo(() => quoteSicOrder({ includeBaseFee: true, moduleIds }), [moduleIds])
  const allSelected = SIC_MODULES.every(m => selected.has(m.id))

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

  function toggle(id: SicModuleId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleBundle() {
    setSelected(allSelected ? new Set(RECOMMENDED) : new Set(SIC_MODULES.map(m => m.id)))
  }

  async function checkout() {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse an.')
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
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: SIC_COLORS.goldLight }} /> Ohne Passwort</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: SIC_COLORS.goldLight }} /> Prüfung innert 24 Std. nach vollständigem Upload</span>
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

      {/* ── Beispiel-Zertifikat (vor dem Geld) ───────────────────────────── */}
      <section id="zertifikat" className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#0f2b5e]">So sieht dein Zertifikat aus</h2>
            <p className="mt-4 max-w-md text-slate-600">
              Ein seriöses Dokument mit geprüften Angaben und einem QR-Code, mit dem Vermieter die Echtheit des
              Zertifikats in Sekunden fälschungssicher prüfen können.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2.5"><BadgeCheck className="h-5 w-5 text-[#b8912f]" /> Fälschungssicher — Online-Verifikation per QR</li>
              <li className="flex items-center gap-2.5"><FileText className="h-5 w-5 text-[#b8912f]" /> Als PDF überall beilegbar — auch bei anderen Portalen</li>
              <li className="flex items-center gap-2.5"><Clock className="h-5 w-5 text-[#b8912f]" /> {SIC_VALIDITY_MONTHS} Monate gültig — in dieser Zeit ohne erneuten Upload verlängerbar</li>
            </ul>
            <a
              href="#module"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0f2b5e] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Zertifikat erstellen <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Beispiel-Karte */}
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
                {CERT_PREVIEW.map(row => {
                  const accent = SIC_MODULE_ACCENT[row.module]
                  return (
                    <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <dt className="text-xs font-semibold text-[#0f2b5e]">{row.label}</dt>
                          <span
                            className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white"
                            style={{ backgroundColor: accent.hex }}
                          >
                            Modul {moduleOrder(row.module)}
                          </span>
                        </div>
                        <dd className="truncate text-xs text-slate-500">{row.value}</dd>
                      </div>
                      <span className="inline-flex flex-shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#2f9e44]">
                        <Check className="h-3.5 w-3.5" /> Verifiziert
                      </span>
                    </div>
                  )
                })}
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                <span>Geprüft. Verifiziert. Vertrauenswürdig.</span>
                <span className="rounded bg-[#0f2b5e] px-2 py-0.5 font-semibold text-white">QR-geschützt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── So funktioniert's ────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#0f2b5e]">In 4 Schritten zum Zertifikat</h2>
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
                Erstelle dein persönliches Zertifikat — die Basis ist immer enthalten. Wähle darunter die Module,
                die verifiziert werden sollen.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#0f2b5e]">CHF {SIC_BASE_FEE_CHF}.–</p>
              <p className="text-xs text-slate-500">Einmalig · {SIC_VALIDITY_MONTHS} Monate gültig</p>
            </div>
          </div>

          {/* Komplett-Paket */}
          <button
            type="button"
            onClick={toggleBundle}
            aria-pressed={allSelected}
            className={`mt-4 flex w-full flex-col items-start justify-between gap-3 rounded-2xl border-2 p-5 text-left transition-all sm:flex-row sm:items-center ${
              allSelected ? 'border-[#0f2b5e] bg-[#0f2b5e]/[0.04] ring-2 ring-[#0f2b5e]/15' : 'border-slate-200 hover:border-[#0f2b5e]/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-md border ${
                  allSelected ? 'border-[#0f2b5e] bg-[#0f2b5e] text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {allSelected && <Check className="h-4 w-4" />}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-[#0f2b5e]">Komplett-Paket — alle 4 Module</p>
                  <span className="rounded-full bg-[#c8102e] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Beliebteste Wahl
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  Alle Angaben verifiziert, inkl. Basisgebühr — der stärkste Auftritt bei Vermietern.
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0f2b5e]">
                CHF {SIC_BUNDLE_ALL_MODULES_CHF}.– <span className="text-sm font-medium text-slate-400 line-through">CHF {FULL_PRICE_CHF}.–</span>
              </p>
              <p className="text-xs font-semibold text-[#2f9e44]">
                Inkl. Basis · du sparst CHF {FULL_PRICE_CHF - SIC_BUNDLE_ALL_MODULES_CHF}.–
              </p>
            </div>
          </button>

          {/* Modul-Kacheln */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SIC_MODULES.map(m => {
              const on = selected.has(m.id)
              const accent = SIC_MODULE_ACCENT[m.id]
              const Icon = MODULE_ICON[m.id]
              const recommended = RECOMMENDED.includes(m.id)
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
                  {recommended && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#0f2b5e] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                      Empfohlen
                    </span>
                  )}
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

          {/* Live-Vorschau + Checkout */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            {/* Live-Vorschau des Zertifikats */}
            <div className="rounded-2xl border-2 border-[#b8912f]/40 bg-gradient-to-b from-white to-slate-50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SicLogoMark size={24} />
                  <span className="text-sm font-bold tracking-[0.1em] text-[#0f2b5e]">SWISS IMMO CERT</span>
                </div>
                <span className="rounded-full bg-[#0f2b5e]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#0f2b5e]">
                  Vorschau
                </span>
              </div>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#b8912f]">Mieter-Zertifikat</p>

              <div className="mt-3 rounded-lg bg-[#0f2b5e]/[0.04] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ausgestellt für</p>
                <p className={`text-sm font-bold ${name.trim() ? 'text-[#0f2b5e]' : 'text-slate-400'}`}>
                  {name.trim() || 'Dein Name'}
                </p>
              </div>

              <ul className="mt-4 divide-y divide-slate-100">
                <li className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-semibold text-[#0f2b5e]">Basis · Zertifikat</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <Check className="h-3.5 w-3.5 text-[#2f9e44]" /> Enthalten
                  </span>
                </li>
                {SIC_MODULES.map(m => {
                  const on = selected.has(m.id)
                  return (
                    <li key={m.id} className={`flex items-center justify-between gap-3 py-2.5 ${on ? '' : 'opacity-40'}`}>
                      <span className="text-sm font-semibold text-[#0f2b5e]">{m.title}</span>
                      {on ?
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Lock className="h-3.5 w-3.5" /> Gesperrt — nach Zahlung verifizierbar
                        </span>
                      : <span className="text-[11px] font-medium text-slate-400">Nicht gewählt</span>}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 rounded-lg bg-[#0f2b5e]/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
                Nach der Zahlung lädst du deine Belege hoch — dann prüfen wir sie und jedes Modul wechselt auf
                „Verifiziert".
              </p>
            </div>

            {/* Checkout */}
            <div className="rounded-2xl border border-[#0f2b5e]/10 bg-[#0f2b5e]/[0.03] p-6 sm:p-7">
              <h3 className="text-lg font-bold text-[#0f2b5e]">Deine Auswahl</h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                {allSelected ?
                  <div className="flex justify-between text-slate-700">
                    <dt>Komplett-Paket (inkl. Basis)</dt>
                    <dd className="tabular-nums">CHF {SIC_BUNDLE_ALL_MODULES_CHF}.–</dd>
                  </div>
                : quote.lines.map((l, i) => (
                    <div key={i} className={`flex justify-between ${l.kind === 'discount' ? 'text-[#2f9e44]' : 'text-slate-600'}`}>
                      <dt>{l.label}</dt>
                      <dd className="tabular-nums">
                        {l.amountChf < 0 ? `− CHF ${Math.abs(l.amountChf)}.–` : `CHF ${l.amountChf}.–`}
                      </dd>
                    </div>
                  ))
                }
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-2xl font-bold tabular-nums text-[#0f2b5e]">CHF {quote.totalChf}.–</span>
              </div>

              <label htmlFor="sic-name" className="mt-5 block text-sm font-semibold text-[#0f2b5e]">
                Name <span className="font-normal text-slate-400">(für dein Zertifikat)</span>
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

              <label htmlFor="sic-email" className="mt-4 block text-sm font-semibold text-[#0f2b5e]">
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
                Deine E-Mail ist dein Zugang — kein Passwort nötig. Du erhältst nach der Zahlung einen Anmeldelink
                zum Hochladen der Nachweise.
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
              <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3">
                <li className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-[#0f2b5e]" /> Schweizer Datenschutz (revDSG)</li>
                <li className="flex items-center gap-2 text-xs text-slate-500"><Lock className="h-3.5 w-3.5 text-[#0f2b5e]" /> Daten verschlüsselt gespeichert</li>
                <li className="flex items-center gap-2 text-xs text-slate-500"><Clock className="h-3.5 w-3.5 text-[#0f2b5e]" /> Nach Ablauf + Aufbewahrungsfrist gelöscht</li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Deine Daten bleiben während der {SIC_VALIDITY_MONTHS} Monate gespeichert; eine Verlängerung ist in
                dieser Zeit ohne erneuten Upload möglich. Nach Ablauf werden die Nachweise nach einer
                Aufbewahrungsfrist gelöscht — die QR-Prüfseite zeigt danach nur noch „abgelaufen".
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Ist ein eingereichter Beleg unvollständig oder nicht plausibel, bitten wir dich, einen gültigen
                Nachweis nachzureichen — damit dein Zertifikat sauber verifiziert werden kann.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inline-FAQ ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-24">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#0f2b5e]">Häufige Fragen</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQ.map((item, i) => {
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
            Bereit? Stell dein Mieter-Zertifikat zusammen.
          </span>
          <a
            href="#module"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#c8102e] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Zertifikat erstellen <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
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
