'use client'

import { sicPaths } from '@/lib/sic/config'
import type { SicDossierView } from '@/lib/sic/dossier'
import type { SicModuleId } from '@/lib/sic/modules'
import { AlertCircle, CheckCircle2, Clock, Download, FileUp, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'

type ModuleStatus = SicDossierView['purchasedModules'][number]['status']

const STATUS_META: Record<ModuleStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  PENDING_DOCS: { label: 'Nachweise ausstehend', className: 'bg-amber-50 text-amber-700', Icon: FileUp },
  IN_REVIEW: { label: 'In Prüfung', className: 'bg-blue-50 text-blue-700', Icon: Clock },
  VERIFIED: { label: 'Verifiziert', className: 'bg-[#2f9e44]/10 text-[#1f7a34]', Icon: CheckCircle2 },
  REJECTED: { label: 'Abgelehnt', className: 'bg-rose-50 text-rose-700', Icon: AlertCircle },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SicDossierClient({ dossier }: { dossier: SicDossierView }) {
  const router = useRouter()
  const [uploading, setUploading] = useState<SicModuleId | null>(null)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [savingName, setSavingName] = useState(false)

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

  const expired = new Date(dossier.expiresAt).getTime() <= Date.now()

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2b5e]">Mein Dossier</h1>
          <p className="mt-1 text-sm text-slate-500">{dossier.email}</p>
        </div>
        <form action="/api/sic/logout" method="post">
          <button className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            Abmelden
          </button>
        </form>
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
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              expired ? 'bg-rose-50 text-rose-700' : 'bg-[#2f9e44]/10 text-[#1f7a34]'
            }`}
          >
            {expired ? 'Abgelaufen' : 'Aktiv'}
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

        {dossier.holderName ?
          <a
            href={`/api/sic/certificate/${encodeURIComponent(dossier.certificateCode)}/pdf`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0f2b5e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f45]"
          >
            <Download className="h-4 w-4" /> Zertifikat als PDF
          </a>
        : <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Name auf dem Zertifikat</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Geben Sie Ihren Namen an, damit wir das Zertifikat erstellen können.
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
        }
      </div>

      {/* Purchased modules */}
          <h2 className="mt-8 text-lg font-semibold text-[#0f2b5e]">Ihre Module</h2>
      <ul className="mt-3 space-y-3">
        {dossier.purchasedModules.map(m => {
          const meta = STATUS_META[m.status]
          const canUpload = m.status === 'PENDING_DOCS' || m.status === 'REJECTED'
          return (
            <li key={m.moduleKind} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{m.title}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                  <meta.Icon className="h-3.5 w-3.5" /> {meta.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">{m.summary}</p>

              {m.reviewNote && m.status === 'REJECTED' ?
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{m.reviewNote}</p>
              : null}

              {canUpload ?
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500">Benötigte Nachweise:</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-slate-500">
                    {m.requiredDocuments.map(d => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
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
                  {m.documentCount > 0 ?
                    <span className="ml-3 text-xs text-slate-400">{m.documentCount} Datei(en) hochgeladen</span>
                  : null}
                </div>
              : null}

              {m.status === 'IN_REVIEW' ?
                <p className="mt-3 text-sm text-slate-500">
                  Ihre Nachweise werden geprüft. Sie werden benachrichtigt, sobald das Modul freigegeben ist.
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
            Weitere Module hinzufügen — die Gültigkeit Ihres Zertifikats verlängert sich entsprechend.
          </p>
          <ul className="mt-3 space-y-2">
            {dossier.availableModules.map(a => (
              <li key={a.moduleKind} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{a.title}</span>
                <span className="text-slate-500">CHF {a.priceChf}</span>
              </li>
            ))}
          </ul>
          <Link
            href={sicPaths.landing}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f2b5e] hover:underline"
          >
            <Plus className="h-4 w-4" /> Module hinzufügen
          </Link>
        </div>
      : null}
    </div>
  )
}
