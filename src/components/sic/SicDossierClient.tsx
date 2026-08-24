'use client'

import { SicTemplateForm } from '@/components/sic/SicTemplateForm'
import { sicPaths } from '@/lib/sic/config'
import type { SicDossierView, SicUploadedDocMeta } from '@/lib/sic/dossier'
import type { SicModuleId } from '@/lib/sic/modules'
import { templatesForModule } from '@/lib/sic/templates'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FileUp,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

type ModuleStatus = SicDossierView['purchasedModules'][number]['status']

const STATUS_META: Record<ModuleStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  PENDING_DOCS: { label: 'Vorlage / Upload offen', className: 'bg-amber-50 text-amber-700', Icon: FileUp },
  IN_REVIEW: { label: 'In Prüfung', className: 'bg-blue-50 text-blue-700', Icon: Clock },
  VERIFIED: { label: 'Verifiziert', className: 'bg-[#2f9e44]/10 text-[#1f7a34]', Icon: CheckCircle2 },
  REJECTED: { label: 'Nachreichen', className: 'bg-rose-50 text-rose-700', Icon: AlertCircle },
}

const VERIFY_DEFINITION =
  'Verifiziert bedeutet: Der eingereichte Beleg wird auf Vollständigkeit und Plausibilität geprüft. Es erfolgt keine telefonische Rückfrage bei Dritten.'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function progressSummary(p: SicDossierView['progress']): string {
  if (p.totalModules === 0) return 'Noch keine Module erworben.'
  const parts: string[] = []
  parts.push(`${p.verifiedCount} von ${p.totalModules} Modul${p.totalModules === 1 ? '' : 'en'} verifiziert`)
  if (p.pendingDocsCount > 0) {
    parts.push(`${p.pendingDocsCount} mit offener Vorlage oder Upload`)
  }
  if (p.inReviewCount > 0) {
    parts.push(`${p.inReviewCount} in Prüfung`)
  }
  if (p.rejectedCount > 0) {
    parts.push(`${p.rejectedCount} nachreichen`)
  }
  return parts.join(' · ')
}

function certificateStatusMeta(
  dossier: SicDossierView,
  expired: boolean
): { label: string; className: string } {
  if (dossier.status === 'REVOKED') {
    return { label: 'Widerrufen', className: 'bg-rose-50 text-rose-700' }
  }
  if (expired || dossier.status === 'EXPIRED') {
    return { label: 'Abgelaufen', className: 'bg-rose-50 text-rose-700' }
  }
  const { verifiedCount, totalModules } = dossier.progress
  if (totalModules > 0 && verifiedCount === totalModules) {
    return { label: 'Verifiziert', className: 'bg-[#2f9e44]/10 text-[#1f7a34]' }
  }
  if (verifiedCount > 0) {
    return { label: 'Teilweise verifiziert', className: 'bg-amber-50 text-amber-800' }
  }
  return { label: 'In Bearbeitung', className: 'bg-slate-100 text-slate-700' }
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
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
        <FileText className="h-4 w-4 text-[#0f2b5e]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800" title={doc.fileName}>
          {doc.fileName}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{formatBytes(doc.sizeBytes)}</p>
      </div>
      <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
        <Clock className="h-3 w-3" /> In Prüfung
      </span>
      {canRemove ?
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          title="Entfernen"
          aria-label={`Datei «${doc.fileName}» entfernen`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
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

  const expired = new Date(dossier.expiresAt).getTime() <= Date.now()
  const certStatus = certificateStatusMeta(dossier, expired)
  const pdfReady = dossier.landlordPdfReady

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
          <h1 className="text-2xl font-bold text-[#0f2b5e]">Mein Zertifikat</h1>
          <p className="mt-1 text-sm text-slate-500">{dossier.email}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Vorlagen von Dritten einholen und hochladen kann über Tage dauern — das ist vorgesehen. Das PDF
            für Vermieter gibt es, wenn alle gewählten Module verifiziert sind.
          </p>
        </div>
        <form action="/api/sic/logout" method="post">
          <button className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            Abmelden
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-xl border border-[#0f2b5e]/15 bg-[#0f2b5e]/[0.03] px-4 py-3 text-sm text-[#0f2b5e]">
        {progressSummary(dossier.progress)}
      </div>

      {/* Certificate summary */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#0f2b5e]" />
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
            <dd className="font-medium text-slate-800">{formatDate(dossier.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Gültig bis</dt>
            <dd className="font-medium text-slate-800">{formatDate(dossier.expiresAt)}</dd>
          </div>
        </div>

        {!dossier.holderName ?
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Name auf dem Zertifikat</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Gib deinen Namen an, damit wir das Zertifikat erstellen können.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Vorname"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f2b5e]"
              />
              <input
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Nachname"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0f2b5e]"
              />
              <button
                type="button"
                onClick={saveName}
                disabled={savingName}
                className="rounded-lg bg-[#0f2b5e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a1f45] disabled:opacity-60"
              >
                {savingName ? '…' : 'Speichern'}
              </button>
            </div>
          </div>
        : pdfReady ?
          <a
            href={`/api/sic/certificate/${encodeURIComponent(dossier.certificateCode)}/pdf`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0f2b5e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f45]"
          >
            <Download className="h-4 w-4" /> Zertifikat als PDF
          </a>
        : <div className="mt-5">
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
            >
              <Download className="h-4 w-4" /> Zertifikat als PDF
            </span>
            <p className="mt-2 text-xs text-slate-500">
              Verfügbar, sobald alle gewählten Module verifiziert sind.
            </p>
          </div>
        }
      </div>

      {/* Purchased modules */}
      <h2 className="mt-8 text-lg font-semibold text-[#0f2b5e]">Deine Module</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{VERIFY_DEFINITION}</p>
      <ul className="mt-3 space-y-3">
        {dossier.purchasedModules.map(m => {
          const meta = STATUS_META[m.status]
          const canUpload =
            m.status === 'PENDING_DOCS' || m.status === 'REJECTED' || m.status === 'IN_REVIEW'
          const canRemoveDocs = m.status !== 'VERIFIED'
          return (
            <li key={m.moduleKind} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{m.title}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                  <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">{m.summary}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">Für den Vermieter: {m.landlordSees}</p>

              {m.reviewNote && m.status === 'REJECTED' ?
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{m.reviewNote}</p>
              : null}

              {canUpload ?
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500">Checkliste — benötigte Nachweise:</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Modul geht in Prüfung, sobald mindestens ein Nachweis hochgeladen ist.
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {m.checklist.map(item => (
                      <li key={item.id} className="flex items-start gap-2 text-xs text-slate-600">
                        <span
                          className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                            item.kind === 'template' ?
                              'bg-[#0f2b5e]/10 text-[#0f2b5e]'
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
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#0f2b5e] px-4 py-2 text-sm font-semibold text-[#0f2b5e] hover:bg-[#0f2b5e]/5 disabled:opacity-60"
                  >
                    <FileUp className="h-4 w-4" />
                    {uploading === m.moduleKind ? 'Wird hochgeladen …' : 'Nachweis hochladen'}
                  </button>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Du kannst mehrere Dateien nacheinander hochladen (z. B. Lohnausweis und Betreibungsauszug).
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
                  Deine Nachweise werden geprüft. In der Regel innert 24 Std. nach vollständigem Upload.
                  Wir benachrichtigen dich per E-Mail, sobald das Modul freigegeben oder abgelehnt wird.
                </p>
              : null}

                  {m.status === 'VERIFIED' ?
                <p className="mt-3 text-sm text-[#1f7a34]">
                  {pdfReady ?
                    'Dieses Modul ist freigegeben und erscheint auf dem Zertifikat-PDF.'
                  : 'Dieses Modul ist freigegeben. Das PDF für Vermieter folgt, sobald die übrigen gewählten Module ebenfalls verifiziert sind.'}
                </p>
              : null}
            </li>
          )
        })}
      </ul>

      {/* Add more modules */}
      {dossier.availableModules.length > 0 ?
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-6">
          <h3 className="text-sm font-semibold text-slate-900">Zertifikat erweitern</h3>
          <p className="mt-1 text-sm text-slate-500">
            Später erweitern — nicht nötig für das aktuelle Zertifikat. Zusätzliche Module auf der Startseite
            wählen.
          </p>
          <ul className="mt-3 space-y-2">
            {dossier.availableModules.map(a => (
              <li key={a.moduleKind} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-700">{a.title}</span>
                  <span className="flex-shrink-0 text-slate-500">{a.priceChf <= 0 ? 'Kostenlos' : `CHF ${a.priceChf}`}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{a.landlordSees}</p>
              </li>
            ))}
          </ul>
          <Link
            href={sicPaths.landing}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f2b5e] hover:underline"
          >
            <Plus className="h-4 w-4" /> Zur Startseite — Module hinzufügen
          </Link>
        </div>
      : null}
    </div>
  )
}
