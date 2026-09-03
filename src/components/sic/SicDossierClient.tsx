'use client'

import { SicTemplateForm } from '@/components/sic/SicTemplateForm'
import { SIC_REVIEW_SLA, sicPaths, sicVerifyUrl } from '@/lib/sic/config'
import type { SicDossierView, SicUploadedDocMeta } from '@/lib/sic/dossier'
import { templatePrefillNamesForModule } from '@/lib/sic/dossier'
import { formatSicChf, SIC_MODULES, sicCompletenessLabel, type SicModuleId } from '@/lib/sic/modules'
import { sicNextStep } from '@/lib/sic/next-step'
import { quoteSicOrder } from '@/lib/sic/pricing'
import { sicVerifyMailtoHref, sicVerifyWhatsAppHref } from '@/lib/sic/share'
import { templatesForModule } from '@/lib/sic/templates'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileUp,
  KeyRound,
  Link2,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

type ModuleStatus = SicDossierView['purchasedModules'][number]['status']

const STATUS_META: Record<ModuleStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  PENDING_DOCS: { label: 'Unterlagen fehlen', className: 'bg-sic-pending-bg text-sic-pending-text', Icon: FileUp },
  IN_REVIEW: { label: 'Bei uns in Prüfung', className: 'bg-sic-review-bg text-sic-review-text', Icon: Clock },
  VERIFIED: { label: 'Geprüft', className: 'bg-sic-verified-bg text-sic-verified-text', Icon: CheckCircle2 },
  REJECTED: { label: 'Bitte nachreichen', className: 'bg-sic-danger-bg text-sic-danger-text', Icon: AlertCircle },
}

const PROGRESS_SHORT: Record<SicModuleId, string> = {
  BONITAET: 'Betreibung',
  AUFENTHALT: 'Ausweis',
  ARBEIT_EINKOMMEN: 'Lohn',
  ZUVERLAESSIGKEIT: 'Referenz',
}

const VERIFY_DEFINITION =
  'PDF oder Foto, mehrere Dateien möglich. Wir prüfen jede Angabe einzeln auf Vollständigkeit und Plausibilität.'

const INPUT_CLASS =
  'min-h-11 w-full rounded-xl border border-sic-hairline bg-sic-paper px-3 py-2 text-base outline-none ring-sic-action/20 focus:border-sic-action focus:ring-2'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function progressSummary(p: SicDossierView['progress']): string {
  if (p.totalModules === 0) return 'Noch keine Angaben enthalten.'
  const parts: string[] = [`${p.verifiedCount} von ${p.catalogModules} Angaben geprüft`]
  if (p.pendingDocsCount > 0) parts.push(`${p.pendingDocsCount} wartet auf Unterlagen`)
  if (p.inReviewCount > 0) parts.push(`${p.inReviewCount} bei uns in Prüfung`)
  if (p.rejectedCount > 0) parts.push(`${p.rejectedCount} nachreichen`)
  return parts.join(' · ')
}

function ModuleProgressStrip({ dossier }: { dossier: SicDossierView }) {
  const byKind = new Map(dossier.purchasedModules.map(m => [m.moduleKind, m]))
  return (
    <div className="mt-6 border-y border-sic-hairline py-4">
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
        {SIC_MODULES.map((mod, index) => {
          const purchased = byKind.get(mod.id)
          const status = purchased?.status
          const meta = status ? STATUS_META[status] : null
          const short = PROGRESS_SHORT[mod.id]
          const href = purchased ? `#modul-${mod.id}` : dossier.availableModules.some(a => a.moduleKind === mod.id) ? '#erganzen' : undefined
          const inner = (
            <>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  status === 'VERIFIED'
                    ? 'bg-sic-verified text-white'
                  : status === 'IN_REVIEW'
                    ? 'bg-sic-review-text text-white'
                  : status === 'REJECTED'
                    ? 'bg-sic-danger-text text-white'
                  : status === 'PENDING_DOCS'
                    ? 'bg-sic-navy text-white'
                  : 'bg-sic-paper-soft text-slate-400 ring-1 ring-sic-hairline'
                }`}
              >
                {status === 'VERIFIED' ?
                  <CheckCircle2 className="h-4 w-4" />
                : status === 'IN_REVIEW' ?
                  <Clock className="h-4 w-4" />
                : status === 'REJECTED' ?
                  <AlertCircle className="h-4 w-4" />
                : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-sic-navy">{short}</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {meta?.label ?? (purchased ? '—' : 'Noch nicht enthalten')}
                </span>
              </span>
            </>
          )
          return (
            <li key={mod.id}>
              {href ?
                <a
                  href={href}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-sic-paper-soft"
                  title={mod.title}
                >
                  {inner}
                </a>
              : <div className="flex items-center gap-2.5 px-1 py-1" title={mod.title}>
                  {inner}
                </div>
              }
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-xs leading-relaxed text-sic-navy/80">{progressSummary(dossier.progress)}</p>
    </div>
  )
}

function certificateStatusMeta(dossier: SicDossierView): { label: string; className: string } {
  if (dossier.status === 'REVOKED') {
    return { label: 'Widerrufen', className: 'bg-sic-danger-bg text-sic-danger-text' }
  }
  if (dossier.expired) {
    return { label: 'Abgelaufen', className: 'bg-sic-danger-bg text-sic-danger-text' }
  }
  if (dossier.certificateSealReady) {
    const { verifiedCount, catalogModules } = dossier.progress
    if (catalogModules > 0 && verifiedCount >= catalogModules) {
      return { label: 'Mieter-Zertifikat · vollständig', className: 'bg-sic-verified-bg text-sic-verified-text' }
    }
    return { label: 'Mieter-Zertifikat', className: 'bg-sic-verified-bg text-sic-verified-text' }
  }
  if (dossier.progress.verifiedCount > 0) {
    return { label: 'Prüfstand · noch kein Siegel', className: 'bg-sic-action-bg text-sic-action-deep' }
  }
  return { label: 'In Arbeit', className: 'bg-slate-100 text-slate-700' }
}

function DocumentChip({
  doc,
  status,
  canRemove,
  onRemove,
  removing,
}: {
  doc: SicUploadedDocMeta
  status: ModuleStatus
  canRemove: boolean
  onRemove: () => void
  removing: boolean
}) {
  const meta = STATUS_META[status]
  return (
    <li className="flex items-center gap-3 border border-sic-hairline bg-sic-paper px-3 py-2.5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-sic-hairline bg-sic-paper-soft">
        <FileText className="h-4 w-4 text-sic-navy" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800" title={doc.fileName}>
          {doc.fileName}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{formatBytes(doc.sizeBytes)}</p>
      </div>
      <span
        className={`inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
      >
        <meta.Icon className="h-3 w-3" /> {meta.label}
      </span>
      {canRemove ?
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          title="Entfernen"
          aria-label={`Datei «${doc.fileName}» entfernen`}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-sic-danger-bg hover:text-sic-danger-text disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      : null}
    </li>
  )
}

export function SicDossierClient({ dossier }: { dossier: SicDossierView }) {
  const router = useRouter()
  const [uploading, setUploading] = useState<SicModuleId | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})
  const [firstName, setFirstName] = useState(dossier.holderFirstName ?? '')
  const [lastName, setLastName] = useState(dossier.holderLastName ?? '')
  const [firstName2, setFirstName2] = useState(dossier.holder2FirstName ?? '')
  const [lastName2, setLastName2] = useState(dossier.holder2LastName ?? '')
  const [coupleMode, setCoupleMode] = useState(dossier.couple)
  const [editingName, setEditingName] = useState(!dossier.holderName)
  const [savingName, setSavingName] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [recoding, setRecoding] = useState(false)
  const [addonSelected, setAddonSelected] = useState<Set<SicModuleId>>(
    () => new Set(dossier.availableModules.map(a => a.moduleKind))
  )
  const [adding, setAdding] = useState(false)
  const [emailOpen, setEmailOpen] = useState(!!dossier.pendingEmail)
  const [nextEmail, setNextEmail] = useState(dossier.pendingEmail ?? '')
  const [savingEmail, setSavingEmail] = useState(false)

  const certStatus = certificateStatusMeta(dossier)
  const pdfReady = dossier.landlordPdfReady
  const sealReady = dossier.certificateSealReady
  const { verifiedCount } = dossier.progress
  const nextStep = sicNextStep(dossier)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.get('email') !== 'changed') return
    toast.success('E-Mail-Adresse bestätigt. Das ist ab jetzt dein Zugang.')
    url.searchParams.delete('email')
    const qs = url.searchParams.toString()
    window.history.replaceState({}, '', `${url.pathname}${qs ? `?${qs}` : ''}`)
  }, [])

  useEffect(() => {
    if (!sealReady || typeof window === 'undefined') return
    const key = `sic-seal-ready:${dossier.certificateCode}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    toast.success('Dein Mieter-Zertifikat ist bereit.')
  }, [sealReady, dossier.certificateCode])

  async function requestEmailChange() {
    const email = nextEmail.trim()
    if (!email) {
      toast.error('Bitte eine E-Mail-Adresse angeben.')
      return
    }
    setSavingEmail(true)
    try {
      const res = await fetch('/api/sic/email/change', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Änderung fehlgeschlagen.')
        return
      }
      toast.success(data?.message || 'Bestätigung gesendet.')
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setSavingEmail(false)
    }
  }

  async function saveName() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Bitte Vor- und Nachname angeben.')
      return
    }
    if (coupleMode && (!firstName2.trim() || !lastName2.trim())) {
      toast.error('Bitte Vor- und Nachname der zweiten Person angeben.')
      return
    }
    setSavingName(true)
    try {
      const res = await fetch('/api/sic/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          householdKind: coupleMode ? 'COUPLE' : 'SINGLE',
          ...(coupleMode ?
            { firstName2: firstName2.trim(), lastName2: lastName2.trim() }
          : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Speichern fehlgeschlagen.')
        return
      }
      toast.success('Gespeichert.')
      setEditingName(false)
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setSavingName(false)
    }
  }

  async function startAddons() {
    if (addonSelected.size === 0) {
      toast.error('Bitte mindestens eine Angabe wählen.')
      return
    }
    const given = (dossier.holderFirstName ?? firstName).trim()
    const family = (dossier.holderLastName ?? lastName).trim()
    if (!given || !family) {
      toast.error('Bitte zuerst Vor- und Nachname speichern.')
      document.getElementById('sic-first')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/sic/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: dossier.email,
          moduleIds: Array.from(addonSelected),
          firstName: given,
          lastName: family,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.message || 'Ergänzung konnte nicht gestartet werden.')
        return
      }
      window.location.href = data.url as string
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setAdding(false)
    }
  }

  async function startRenewal() {
    setRenewing(true)
    try {
      const res = await fetch('/api/sic/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ renewal: true, moduleIds: [] }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        toast.error(data?.message || 'Verlängerung konnte nicht gestartet werden.')
        return
      }
      window.location.href = data.url as string
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setRenewing(false)
    }
  }

  async function regenerateCode() {
    if (
      !window.confirm(
        'Neuen Code erzeugen? Bereits verschickte PDFs und QR-Codes werden ungültig. Die Prüfseite sagt dann, dass das Zertifikat ersetzt wurde — ohne deine Angaben. Danach das PDF neu herunterladen.'
      )
    ) {
      return
    }
    setRecoding(true)
    try {
      const res = await fetch('/api/sic/certificate/regenerate-code', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Neuer Code fehlgeschlagen.')
        return
      }
      toast.success('Neuer Code erzeugt. Bitte das PDF neu herunterladen.')
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setRecoding(false)
    }
  }

  async function copyVerifyLink() {
    const text = sicVerifyUrl(dossier.certificateCode)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Prüf-Link kopiert')
      return
    } catch {
      /* fallback below */
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) toast.success('Prüf-Link kopiert')
      else toast.error('Kopieren fehlgeschlagen')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }

  async function upload(moduleKind: SicModuleId, file: File) {
    setUploading(moduleKind)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('moduleKind', moduleKind)
      const res = await fetch('/api/sic/documents', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Upload fehlgeschlagen.')
        return
      }
      toast.success('Nachweis hochgeladen — wird geprüft.')
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setUploading(null)
    }
  }

  async function removeDocument(docId: string) {
    setRemovingId(docId)
    try {
      const res = await fetch(`/api/sic/documents?id=${encodeURIComponent(docId)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Entfernen fehlgeschlagen.')
        return
      }
      toast.success('Datei entfernt.')
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
            Mein Zertifikat
          </h1>
          <p className="mt-1 break-all text-sm text-slate-500">{dossier.email}</p>
          {dossier.pendingEmail ?
            <p className="mt-2 max-w-xl border-l-2 border-sic-action bg-sic-action-bg/60 px-3 py-2 text-xs leading-relaxed text-slate-600">
              Bestätigung ausstehend an {dossier.pendingEmail}. Öffne die Mail und tippe auf «Bestätigen».
              Erst dieser Klick ändert die Adresse.{' '}
              <a href="#sic-zugang" className="font-semibold text-sic-navy hover:underline">
                Zugang verwalten
              </a>
            </p>
          : null}
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            {verifiedCount > 0 ?
              sealReady ?
                dossier.couple ?
                  'Das Mieter-Zertifikat für beide ist da — legt das PDF der nächsten Bewerbung bei.'
                : 'Dein Mieter-Zertifikat ist da — leg das PDF der nächsten Bewerbung bei.'
              : dossier.couple ?
                'Der Prüfstand ist als PDF bereit. Zum Mieter-Zertifikat fehlen noch beide Betreibungsauszüge und beide Ausweise.'
              : 'Der Prüfstand ist als PDF bereit. Zum Mieter-Zertifikat fehlen noch Betreibungsauszug und Ausweis.'
            : dossier.couple ?
              'Sobald die erste Angabe geprüft ist, gibt es das PDF. Als Mieter-Zertifikat gilt es mit beiden Betreibungsauszügen und beiden Ausweisen.'
            : 'Sobald die erste Angabe geprüft ist, gibt es das PDF. Als Mieter-Zertifikat gilt es mit Betreibungsauszug und Ausweis.'}
          </p>
        </div>
        <a
          href={sicPaths.logout}
          className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        >
          Abmelden
        </a>
      </div>

      {nextStep ?
        <div
          className={`mt-6 border-l-[3px] px-4 py-4 sm:px-5 ${
            nextStep.kind === 'wait'
              ? 'border-sic-review-text bg-sic-review-bg'
              : nextStep.kind === 'done'
                ? sealReady
                  ? 'border-sic-verified bg-sic-verified-bg'
                  : 'border-sic-action bg-sic-action-bg'
                : 'border-sic-action bg-sic-action-bg'
          }`}
        >
          {sealReady && nextStep.kind === 'done' ?
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-sic-verified" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sic-verified-text">
                  Geschafft
                </p>
                <p className="mt-1 font-semibold text-sic-navy">{nextStep.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{nextStep.detail}</p>
                <a
                  href={nextStep.anchor ?? '#sic-pdf'}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sic-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
                >
                  <Download className="h-4 w-4" /> PDF herunterladen
                </a>
              </div>
            </div>
          : <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {nextStep.kind === 'wait' ? 'In Prüfung' : 'Nächster Schritt'}
              </p>
              <p className="mt-1 font-semibold text-sic-navy">{nextStep.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{nextStep.detail}</p>
              {nextStep.anchor ?
                <a
                  href={nextStep.anchor}
                  className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-sic-action hover:underline"
                >
                  {nextStep.kind === 'wait' ? 'Zur Angabe' : nextStep.kind === 'done' ? 'Zum PDF' : 'Jetzt erledigen'}
                  <ArrowRight className="h-4 w-4" />
                </a>
              : null}
            </>
          }
        </div>
      : null}

      {dossier.expired && dossier.renewal.available ?
        <div id="verlaengern" className="mt-6 scroll-mt-24 border border-sic-danger/30 bg-sic-danger-bg p-5">
          <h2 className="text-sm font-bold text-sic-danger-text">Gültigkeit abgelaufen</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
            Ein Scan zeigt das Zertifikat als abgelaufen. Für die nächste Bewerbung brauchst du eine
            Verlängerung — mit {dossier.couple ? 'frischen Auszügen vom Betreibungsamt' : 'einem frischen Auszug vom Betreibungsamt'}.
            Dessen Alter ist der Grund für die Gültigkeitsdauer.
            {dossier.renewal.refreshes.length > 0 ?
              ` Neu einzureichen: ${dossier.renewal.refreshes.map(r => r.title).join(', ')}.`
            : ''}
          </p>
          <button
            type="button"
            onClick={startRenewal}
            disabled={renewing}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${renewing ? 'animate-spin' : ''}`} />
            Verlängern für {formatSicChf(dossier.renewal.priceChf)}
          </button>
        </div>
      : null}

      <ModuleProgressStrip dossier={dossier} />

      {/* Certificate summary */}
      <div className="mt-8 border-t border-sic-hairline pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {sealReady ? 'Mieter-Zertifikat' : 'Stand der Prüfung'}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-sic-navy" />
              <span className="break-all font-mono text-sm font-semibold tracking-wide text-slate-900">
                {dossier.certificateCode}
              </span>
            </div>
          </div>
          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${certStatus.className}`}>
            {certStatus.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Ausgestellt</dt>
            <dd className="font-medium text-slate-800">
              {dossier.certifiedAt ? formatDate(dossier.certifiedAt) : 'nach der ersten Freigabe'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Gültig bis</dt>
            <dd className="font-medium text-slate-800">
              {dossier.expiresAt ?
                formatDate(dossier.expiresAt)
              : `${dossier.validityMonths} Monate ab ${dossier.couple ? 'dem älteren Betreibungsauszug' : 'dem Betreibungsauszug'}`}
            </dd>
          </div>
        </div>

        {verifiedCount > 0 ?
          <p className="mt-3 text-xs text-slate-500">
            Auf dem Dokument steht «{sicCompletenessLabel(verifiedCount)}». Nicht geprüfte Angaben sind
            nicht aufgeführt.
          </p>
        : null}

        {!dossier.holderName || editingName ?
          <div id="sic-name" className="mt-5 scroll-mt-24 border border-sic-hairline bg-sic-paper-soft/60 p-4">
            <p className="text-sm font-medium text-slate-700">Name auf dem Zertifikat</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {coupleMode ?
                'Beide Namen erscheinen auf dem Dokument. Pro Person brauchst du eigene Nachweise (Auszug, Ausweis, Lohn).'
              : 'Gib deinen Namen an, damit wir das Zertifikat erstellen können.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCoupleMode(false)}
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${
                  !coupleMode ? 'bg-sic-navy text-white' : 'border border-sic-hairline text-slate-600'
                }`}
              >
                Eine Person
              </button>
              <button
                type="button"
                onClick={() => setCoupleMode(true)}
                className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${
                  coupleMode ? 'bg-sic-navy text-white' : 'border border-sic-hairline text-slate-600'
                }`}
              >
                Zu zweit
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="sic-first"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder={coupleMode ? 'Vorname Person 1' : 'Vorname'}
                autoComplete="given-name"
                className={INPUT_CLASS}
              />
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder={coupleMode ? 'Nachname Person 1' : 'Nachname'}
                autoComplete="family-name"
                className={INPUT_CLASS}
              />
            </div>
            {coupleMode ?
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={firstName2}
                  onChange={e => setFirstName2(e.target.value)}
                  placeholder="Vorname Person 2"
                  autoComplete="off"
                  className={INPUT_CLASS}
                />
                <input
                  value={lastName2}
                  onChange={e => setLastName2(e.target.value)}
                  placeholder="Nachname Person 2"
                  autoComplete="off"
                  className={INPUT_CLASS}
                />
              </div>
            : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="min-h-11 w-full rounded-xl bg-sic-action px-4 py-2 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60 sm:w-auto"
              >
                {savingName ? '…' : 'Speichern'}
              </button>
              {dossier.holderName ?
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false)
                    setCoupleMode(dossier.couple)
                    setFirstName(dossier.holderFirstName ?? '')
                    setLastName(dossier.holderLastName ?? '')
                    setFirstName2(dossier.holder2FirstName ?? '')
                    setLastName2(dossier.holder2LastName ?? '')
                  }}
                  className="min-h-11 px-3 text-sm text-slate-500 hover:text-slate-800"
                >
                  Abbrechen
                </button>
              : null}
            </div>
          </div>
        : pdfReady ?
          <div id="sic-pdf" className="mt-5 scroll-mt-24">
            <a
              href={`/api/sic/certificate/${encodeURIComponent(dossier.certificateCode)}/pdf`}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep sm:w-auto sm:min-w-[14rem]"
            >
              <Download className="h-4 w-4" /> {sealReady ? 'Zertifikat als PDF' : 'Stand als PDF'}
            </a>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => void copyVerifyLink()}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-sic-hairline bg-sic-paper px-4 py-2.5 text-sm font-semibold text-sic-navy hover:bg-sic-paper-soft sm:w-auto"
              >
                <Link2 className="h-4 w-4" /> Prüf-Link kopieren
              </button>
              <a
                href={sicVerifyMailtoHref(dossier.certificateCode, sealReady)}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 px-1 text-sm font-medium text-sic-navy/80 hover:text-sic-navy hover:underline sm:justify-start"
              >
                <Mail className="h-3.5 w-3.5" /> E-Mail
              </a>
              <a
                href={sicVerifyWhatsAppHref(dossier.certificateCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 px-1 text-sm font-medium text-sic-navy/80 hover:text-sic-navy hover:underline sm:justify-start"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>
            <button
              type="button"
              onClick={regenerateCode}
              disabled={recoding}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {recoding ? 'Code wird erzeugt …' : 'Neuen Code erzeugen (alter Link wird ersetzt)'}
            </button>
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="mt-3 block text-xs font-medium text-slate-500 hover:text-sic-navy hover:underline"
            >
              Namen oder Haushalt ändern
            </button>
          </div>
        : <div className="mt-5">
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              <Download className="h-4 w-4" /> {sealReady ? 'Zertifikat als PDF' : 'Stand als PDF'}
            </span>
            <p className="mt-2 text-xs text-slate-500">
              {dossier.expired ?
                'Die Gültigkeit ist abgelaufen — verlängere, um das PDF wieder abzurufen.'
              : 'Kommt, sobald die erste Angabe geprüft ist. Als Zertifikat gilt es erst mit Betreibungsauszug und Ausweis.'}
            </p>
            {dossier.holderName ?
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="mt-3 text-xs font-medium text-slate-500 hover:text-sic-navy hover:underline"
              >
                Namen oder Haushalt ändern
              </button>
            : null}
          </div>
        }

        {!dossier.expired && dossier.renewal.recommended ?
          <button
            type="button"
            onClick={startRenewal}
            disabled={renewing}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sic-action hover:underline disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${renewing ? 'animate-spin' : ''}`} />
            Frühzeitig verlängern für {formatSicChf(dossier.renewal.priceChf)}
          </button>
        : null}
      </div>

      {/* Purchased modules */}
      <h2 className="mt-10 font-sic-serif text-xl font-semibold tracking-tight text-sic-navy">Deine Unterlagen</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{VERIFY_DEFINITION}</p>
      {!sealReady && (dossier.progress.pendingDocsCount > 0 || dossier.progress.inReviewCount > 0) ?
        <p className="mt-1.5 text-xs leading-relaxed text-sic-navy/75">
          Eingereichte Unterlagen prüfen wir {SIC_REVIEW_SLA}.
        </p>
      : null}
      <ul className="mt-4 divide-y divide-sic-hairline border-y border-sic-hairline">
        {dossier.purchasedModules.map(m => {
          const meta = STATUS_META[m.status]
          const canUpload = m.status !== 'VERIFIED' && dossier.status !== 'REVOKED'
          const canRemoveDocs = m.status !== 'VERIFIED'
          // Formular-Zeilen stehen schon im Vorlagen-Block darunter — hier nur echte Uploads.
          const uploadItems = m.checklist.filter(item => item.kind !== 'template')
          return (
            <li
              key={m.moduleKind}
              id={`modul-${m.moduleKind}`}
              className="scroll-mt-24 py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{m.title}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                >
                  <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{m.summary}</p>

              {m.reviewNote && m.status === 'REJECTED' ?
                <p className="mt-2 border-l-2 border-sic-danger-text bg-sic-danger-bg px-3 py-2 text-sm text-sic-danger-text">
                  {m.reviewNote}
                </p>
              : null}

              {canUpload ?
                <div className="mt-4">
                  {uploadItems.length > 0 ?
                    <ul className="space-y-1.5">
                      {uploadItems.map(item => (
                        <li key={item.id} className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
                          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-navy/40" />
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  : null}

                  {templatesForModule(m.moduleKind).map(t => {
                    const names = templatePrefillNamesForModule(m.moduleKind, dossier)
                    return (
                      <SicTemplateForm
                        key={t.id}
                        template={t}
                        holderName={names.primary}
                        holderName2={names.secondary}
                      />
                    )
                  })}

                  <input
                    ref={el => {
                      inputs.current[m.moduleKind] = el
                    }}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) upload(m.moduleKind, f)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputs.current[m.moduleKind]?.click()}
                    disabled={uploading === m.moduleKind}
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sic-action px-4 py-2 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60 sm:w-auto"
                  >
                    <FileUp className="h-4 w-4" />
                    {uploading === m.moduleKind ? 'Wird hochgeladen …' : 'Datei hochladen'}
                  </button>
                </div>
              : null}

              {m.documents.length > 0 ?
                <ul className="mt-3 space-y-2">
                  {m.documents.map(d => (
                    <DocumentChip
                      key={d.id}
                      doc={d}
                      status={m.status}
                      canRemove={canRemoveDocs}
                      removing={removingId === d.id}
                      onRemove={() => removeDocument(d.id)}
                    />
                  ))}
                </ul>
              : null}

              {m.status === 'IN_REVIEW' ?
                <p className="mt-3 text-sm text-slate-500">
                  Wir schauen es an, {SIC_REVIEW_SLA}. Du bekommst eine E-Mail, sobald es durch ist.
                </p>
              : null}

              {m.status === 'VERIFIED' ?
                <div className="mt-3 border-l-2 border-sic-verified bg-sic-verified-bg px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sic-verified-text">
                    Das steht auf deinem Zertifikat
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {m.certificateLines.map(line => (
                      <li key={line} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-sic-verified" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              : null}
            </li>
          )
        })}
      </ul>

      {/* Add more modules */}
      {dossier.availableModules.length > 0 ?
        <div id="erganzen" className="mt-10 scroll-mt-20 border-t border-sic-hairline pt-8">
          <h3 className="font-sic-serif text-lg font-semibold tracking-tight text-sic-navy">
            Noch fehlende Angaben
          </h3>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
            Beim Anlegen gehören alle vier dazu. Was noch fehlt, kannst du hier ergänzen — einzeln oder
            alle offenen auf einmal.
          </p>
          <ul className="mt-5 divide-y divide-sic-hairline border-y border-sic-hairline">
            {dossier.availableModules.map(a => {
              const on = addonSelected.has(a.moduleKind)
              return (
                <li key={a.moduleKind}>
                  <label className="flex cursor-pointer items-start justify-between gap-3 py-3.5">
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => {
                          setAddonSelected(prev => {
                            const next = new Set(prev)
                            if (next.has(a.moduleKind)) next.delete(a.moduleKind)
                            else next.add(a.moduleKind)
                            return next
                          })
                        }}
                        className="mt-1 accent-sic-action"
                      />
                      <span>
                        <span className="block font-medium text-slate-800">{a.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {a.landlordSees}
                        </span>
                      </span>
                    </span>
                    <span className="flex-shrink-0 text-sm tabular-nums text-slate-500">
                      {formatSicChf(a.priceChf)}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm tabular-nums text-sic-navy">
              {addonSelected.size > 0 ?
                <>
                  Total{' '}
                  <span className="font-semibold">
                    {formatSicChf(
                      quoteSicOrder({ includeBaseFee: false, moduleIds: Array.from(addonSelected) }).totalChf
                    )}
                  </span>
                </>
              : <span className="text-slate-400">Keine Angabe gewählt</span>}
            </p>
            <button
              type="button"
              onClick={() => void startAddons()}
              disabled={adding || addonSelected.size === 0}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-sic-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {adding ? 'Wird vorbereitet …' : 'Ausgewählte ergänzen'}
            </button>
          </div>
        </div>
      : null}

      {(dossier.canChangeEmail || dossier.pendingEmail) ?
        <div id="sic-zugang" className="mt-10 scroll-mt-24 border-t border-sic-hairline pt-8">
          <h3 className="font-sic-serif text-lg font-semibold tracking-tight text-sic-navy">Zugang</h3>
          <p className="mt-1.5 text-sm text-slate-500">
            Deine E-Mail ist der Zugang zum Zertifikat — ohne Passwort, nur per Anmeldelink.
          </p>
          <p className="mt-3 break-all text-sm font-medium text-slate-800">{dossier.email}</p>
          {dossier.pendingEmail ?
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Bestätigung ausstehend an {dossier.pendingEmail}.
            </p>
          : null}
          {dossier.canChangeEmail ?
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setEmailOpen(open => !open)}
                className="text-sm font-semibold text-sic-navy hover:underline"
              >
                {dossier.pendingEmail ? 'Andere Adresse angeben' : 'E-Mail falsch geschrieben?'}
              </button>
              {emailOpen ?
                <form
                  className="mt-3 flex max-w-md flex-col gap-2 sm:flex-row"
                  onSubmit={e => {
                    e.preventDefault()
                    void requestEmailChange()
                  }}
                >
                  <input
                    type="email"
                    value={nextEmail}
                    onChange={e => setNextEmail(e.target.value)}
                    placeholder="neue@adresse.ch"
                    autoComplete="email"
                    className={INPUT_CLASS}
                  />
                  <button
                    type="submit"
                    disabled={savingEmail}
                    className="min-h-11 w-full rounded-xl bg-sic-action px-4 py-2 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60 sm:w-auto"
                  >
                    {savingEmail ? '…' : 'Bestätigung senden'}
                  </button>
                </form>
              : null}
              {emailOpen ?
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-400">
                  Einmalig änderbar. Wir schreiben an die neue Adresse — dort tippst du auf «Bestätigen».
                  An die bisherige Adresse geht eine Mitteilung.
                </p>
              : null}
            </div>
          : null}
        </div>
      : null}
    </div>
  )
}
