'use client'

import { SicTemplateForm } from '@/components/sic/SicTemplateForm'
import { sicPaths, SIC_REVIEW_SLA, sicVerifyUrl } from '@/lib/sic/config'
import type { SicDossierView, SicUploadedDocMeta } from '@/lib/sic/dossier'
import { formatSicChf, sicCompletenessLabel, type SicModuleId } from '@/lib/sic/modules'
import { sicVerifyMailtoHref, sicVerifyWhatsAppHref } from '@/lib/sic/share'
import { templatesForModule } from '@/lib/sic/templates'
import {
  AlertCircle,
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

type ModuleStatus = SicDossierView['purchasedModules'][number]['status']

const STATUS_META: Record<ModuleStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  PENDING_DOCS: { label: 'Unterlagen fehlen', className: 'bg-sic-pending-bg text-sic-pending-text', Icon: FileUp },
  IN_REVIEW: { label: 'Bei uns in Prüfung', className: 'bg-sic-review-bg text-sic-review-text', Icon: Clock },
  VERIFIED: { label: 'Geprüft', className: 'bg-sic-verified-bg text-sic-verified-text', Icon: CheckCircle2 },
  REJECTED: { label: 'Bitte nachreichen', className: 'bg-sic-danger-bg text-sic-danger-text', Icon: AlertCircle },
}

const VERIFY_DEFINITION =
  'Wir schauen deine Unterlagen an: sind sie vollständig und plausibel? Wir rufen niemanden an — weder Arbeitgeber noch Vermieter.'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function progressSummary(p: SicDossierView['progress']): string {
  if (p.totalModules === 0) return 'Noch keine Angaben gewählt.'
  const parts: string[] = [`${p.verifiedCount} von ${p.totalModules} geprüft`]
  if (p.pendingDocsCount > 0) parts.push(`${p.pendingDocsCount} wartet auf Unterlagen`)
  if (p.inReviewCount > 0) parts.push(`${p.inReviewCount} bei uns in Prüfung`)
  if (p.rejectedCount > 0) parts.push(`${p.rejectedCount} nachreichen`)
  return parts.join(' · ')
}

function certificateStatusMeta(dossier: SicDossierView): { label: string; className: string } {
  if (dossier.status === 'REVOKED') {
    return { label: 'Widerrufen', className: 'bg-sic-danger-bg text-sic-danger-text' }
  }
  if (dossier.expired) {
    return { label: 'Abgelaufen', className: 'bg-sic-danger-bg text-sic-danger-text' }
  }
  const { verifiedCount, totalModules } = dossier.progress
  if (totalModules > 0 && verifiedCount === totalModules) {
    return { label: 'Vollständig', className: 'bg-sic-verified-bg text-sic-verified-text' }
  }
  if (verifiedCount > 0) {
    return { label: 'Gültig, noch nicht vollständig', className: 'bg-sic-action-bg text-sic-action-deep' }
  }
  return { label: 'In Arbeit', className: 'bg-slate-100 text-slate-700' }
}

function DocumentChip({
  doc,
  canRemove,
  onRemove,
  removing,
}: {
  doc: SicUploadedDocMeta
  canRemove: boolean
  onRemove: () => void
  removing: boolean
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <FileText className="h-4 w-4 text-sic-navy" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800" title={doc.fileName}>
          {doc.fileName}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{formatBytes(doc.sizeBytes)}</p>
      </div>
      <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-sic-review-bg px-2 py-0.5 text-[10px] font-semibold text-sic-review-text">
        <Clock className="h-3 w-3" /> In Prüfung
      </span>
      {canRemove ?
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          title="Entfernen"
          aria-label={`Datei «${doc.fileName}» entfernen`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-sic-danger-bg hover:text-sic-danger-text disabled:opacity-50"
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [recoding, setRecoding] = useState(false)

  const certStatus = certificateStatusMeta(dossier)
  const pdfReady = dossier.landlordPdfReady
  const { verifiedCount } = dossier.progress

  async function saveName() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Bitte Vor- und Nachname angeben.')
      return
    }
    setSavingName(true)
    try {
      const res = await fetch('/api/sic/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.message || 'Speichern fehlgeschlagen.')
        return
      }
      toast.success('Name gespeichert.')
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setSavingName(false)
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
        'Neuen Code erzeugen? Bereits verschickte PDFs und QR-Codes werden damit ungültig. Du kannst das Zertifikat danach neu herunterladen.'
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
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sic-navy">Mein Zertifikat</h1>
          <p className="mt-1 text-sm text-slate-500">{dossier.email}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            {verifiedCount > 0 ?
              'Dein Zertifikat ist da und weist aus, was bereits geprüft ist. Jede weitere Angabe kommt automatisch dazu und verlängert die Gültigkeit.'
            : `Sobald die erste Angabe geprüft ist, kannst du dein Zertifikat herunterladen — und erst dann starten die ${dossier.validityMonths} Monate Gültigkeit. Wartezeit kostet dich keinen Tag.`
            }
          </p>
        </div>
        <form action="/api/sic/logout" method="post">
          <button className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            Abmelden
          </button>
        </form>
      </div>

      {dossier.expired && dossier.renewal.available ?
        <div className="mt-6 rounded-2xl border border-sic-danger/30 bg-sic-danger-bg p-5">
          <h2 className="text-sm font-bold text-sic-danger-text">Gültigkeit abgelaufen</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
            Vermieter sehen beim Prüfen kein gültiges Zertifikat mehr. Für die Verlängerung brauchst du
            einen frischen Auszug vom Betreibungsamt — dessen Alter ist der Grund für die
            Gültigkeitsdauer.
            {dossier.renewal.refreshes.length > 0 ?
              ` Neu einzureichen: ${dossier.renewal.refreshes.map(r => r.title).join(', ')}.`
            : ''}
          </p>
          <button
            type="button"
            onClick={startRenewal}
            disabled={renewing}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sic-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${renewing ? 'animate-spin' : ''}`} />
            Verlängern für {formatSicChf(dossier.renewal.priceChf)}
          </button>
        </div>
      : null}

      <div className="mt-4 rounded-xl border border-sic-navy/15 bg-sic-navy/[0.03] px-4 py-3 text-sm text-sic-navy">
        {progressSummary(dossier.progress)}
      </div>

      {/* Certificate summary */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sic-navy" />
            <span className="font-mono text-sm font-semibold tracking-wide text-slate-900">
              {dossier.certificateCode}
            </span>
          </div>
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${certStatus.className}`}>
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
              : `${dossier.validityMonths} Monate ab der ersten Freigabe`}
            </dd>
          </div>
        </div>

        {verifiedCount > 0 ?
          <p className="mt-3 text-xs text-slate-500">
            Auf dem Dokument steht «{sicCompletenessLabel(verifiedCount)}». Nicht geprüfte Angaben sind
            nicht aufgeführt.
          </p>
        : null}

        {!dossier.holderName ?
          <div className="mt-5 rounded-xl bg-sic-paper-soft p-4">
            <p className="text-sm font-medium text-slate-700">Name auf dem Zertifikat</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Gib deinen Namen an, damit wir das Zertifikat erstellen können.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Vorname"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sic-action"
              />
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Nachname"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sic-action"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="rounded-lg bg-sic-action px-4 py-2 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
              >
                {savingName ? '…' : 'Speichern'}
              </button>
            </div>
          </div>
        : pdfReady ?
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/api/sic/certificate/${encodeURIComponent(dossier.certificateCode)}/pdf`}
                className="inline-flex items-center gap-2 rounded-xl bg-sic-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-sic-action-deep"
              >
                <Download className="h-4 w-4" /> Zertifikat als PDF
              </a>
              <button
                type="button"
                onClick={() => void copyVerifyLink()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-sic-navy hover:bg-slate-50"
              >
                <Link2 className="h-4 w-4" /> Link kopieren
              </button>
              <button
                type="button"
                onClick={regenerateCode}
                disabled={recoding}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <KeyRound className="h-3.5 w-3.5" /> Neuen Code erzeugen
              </button>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <a
                href={sicVerifyMailtoHref(dossier.certificateCode)}
                className="inline-flex items-center gap-1.5 font-semibold text-sic-navy hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> Per E-Mail senden
              </a>
              <a
                href={sicVerifyWhatsAppHref(dossier.certificateCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-sic-navy hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Per WhatsApp senden
              </a>
            </p>
          </div>
        : <div className="mt-5">
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              <Download className="h-4 w-4" /> Zertifikat als PDF
            </span>
            <p className="mt-2 text-xs text-slate-500">
              {dossier.expired ?
                'Die Gültigkeit ist abgelaufen — verlängere, um das PDF wieder abzurufen.'
              : 'Kommt, sobald die erste Angabe geprüft ist.'}
            </p>
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
      <h2 className="mt-8 text-lg font-semibold text-sic-navy">Deine Unterlagen</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{VERIFY_DEFINITION}</p>
      <ul className="mt-3 space-y-3">
        {dossier.purchasedModules.map(m => {
          const meta = STATUS_META[m.status]
          const canUpload = m.status !== 'VERIFIED' && dossier.status !== 'REVOKED'
          const canRemoveDocs = m.status !== 'VERIFIED'
          return (
            <li key={m.moduleKind} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{m.title}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${meta.className}`}
                >
                  <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">{m.summary}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Der Vermieter sieht: {m.landlordSees}
              </p>

              {m.reviewNote && m.status === 'REJECTED' ?
                <p className="mt-2 rounded-lg bg-sic-danger-bg px-3 py-2 text-sm text-sic-danger-text">
                  {m.reviewNote}
                </p>
              : null}

              {canUpload ?
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500">Das brauchst du dafür:</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Sobald die erste Datei da ist, schauen wir sie an.
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {m.checklist.map(item => (
                      <li key={item.id} className="flex items-start gap-2 text-xs text-slate-600">
                        <span
                          className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            item.kind === 'template' ?
                              'bg-sic-navy/10 text-sic-navy'
                            : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.kind === 'template' ? 'Formular' : 'Upload'}
                        </span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>

                  {templatesForModule(m.moduleKind).map(t => (
                    <SicTemplateForm key={t.id} template={t} holderName={dossier.holderName} />
                  ))}

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
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-sic-action px-4 py-2 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
                  >
                    <FileUp className="h-4 w-4" />
                    {uploading === m.moduleKind ? 'Wird hochgeladen …' : 'Datei hochladen'}
                  </button>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    PDF oder Foto. Mehrere Dateien nacheinander sind möglich.
                  </p>
                  {m.documents.length > 0 ?
                    <ul className="mt-3 space-y-2">
                      {m.documents.map(d => (
                        <DocumentChip
                          key={d.id}
                          doc={d}
                          canRemove={canRemoveDocs}
                          removing={removingId === d.id}
                          onRemove={() => removeDocument(d.id)}
                        />
                      ))}
                    </ul>
                  : null}
                </div>
              : null}

              {m.status === 'IN_REVIEW' ?
                <p className="mt-3 text-sm text-slate-500">
                  Wir schauen es an, {SIC_REVIEW_SLA}. Du bekommst eine E-Mail, sobald es durch ist.
                </p>
              : null}

              {m.status === 'VERIFIED' ?
                <div className="mt-3 rounded-xl bg-sic-verified-bg px-4 py-3">
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
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6">
          <h3 className="text-sm font-semibold text-slate-900">Später ergänzen</h3>
          <p className="mt-1 text-sm text-slate-500">
            Für dein aktuelles Zertifikat brauchst du das nicht. Jede zusätzliche Angabe verlängert die
            Gültigkeit ab dem Tag der Freigabe:
          </p>
          <ul className="mt-3 space-y-2">
            {dossier.availableModules.map(a => (
              <li key={a.moduleKind} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-700">{a.title}</span>
                  <span className="flex-shrink-0 text-slate-500">{formatSicChf(a.priceChf)}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{a.landlordSees}</p>
              </li>
            ))}
          </ul>
          <Link
            href={sicPaths.landing}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sic-action hover:underline"
          >
            <Plus className="h-4 w-4" /> Auf der Startseite ergänzen
          </Link>
        </div>
      : null}
    </div>
  )
}
