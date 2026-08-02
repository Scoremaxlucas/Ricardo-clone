'use client'

import {
  emptyTemplateValues,
  type SicTemplateDefinition,
  type SicTemplateValues,
} from '@/lib/sic/templates'
import { Download, FileText } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f2b5e] focus:ring-1 focus:ring-[#0f2b5e]/20'

export function SicTemplateForm({
  template,
  holderName,
}: {
  template: SicTemplateDefinition
  holderName: string | null
}) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<SicTemplateValues>(() => emptyTemplateValues(template, holderName))
  const [busy, setBusy] = useState(false)

  function set(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function downloadPdf() {
    setBusy(true)
    try {
      const res = await fetch(`/api/sic/templates/${template.id}/pdf`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.message || 'PDF konnte nicht erstellt werden.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SIC-${template.id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('PDF heruntergeladen — lass es unterschreiben und lade es danach hoch.')
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(false)
    }
  }

  const tenantFields = template.fields.filter(f => f.section === 'tenant')
  const thirdFields = template.fields.filter(f => f.section === 'third_party')

  return (
    <div className="mt-4 rounded-xl border border-[#0f2b5e]/15 bg-[#0f2b5e]/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#0f2b5e]">
            <FileText className="h-4 w-4 flex-shrink-0" /> {template.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{template.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="rounded-lg border border-[#0f2b5e]/20 px-3 py-1.5 text-xs font-semibold text-[#0f2b5e] hover:bg-white"
        >
          {open ? 'Schliessen' : 'Digital ausfüllen'}
        </button>
      </div>

      {open ?
        <div className="mt-4 space-y-5">
          <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-500">
            {template.howTo.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-[#0f2b5e]">
              Deine Angaben
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {tenantFields.map(f => (
                <Field key={f.key} field={f} value={values[f.key] ?? ''} onChange={v => set(f.key, v)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wide text-[#0f2b5e]">
              Vom {template.thirdPartyLabel} — digital ausfüllen oder leer lassen
            </legend>
            <p className="mt-1 text-[11px] text-slate-400">
              Fehlende Felder erscheinen im PDF als Linien zum handschriftlichen Ausfüllen.
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {thirdFields.map(f => (
                <Field key={f.key} field={f} value={values[f.key] ?? ''} onChange={v => set(f.key, v)} wide={f.kind === 'textarea'} />
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={downloadPdf}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0f2b5e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a1f45] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {busy ? 'PDF wird erstellt …' : 'Als PDF herunterladen'}
          </button>
        </div>
      : null}
    </div>
  )
}

function Field({
  field,
  value,
  onChange,
  wide,
}: {
  field: SicTemplateDefinition['fields'][number]
  value: string
  onChange: (v: string) => void
  wide?: boolean
}) {
  const wrap = wide ? 'sm:col-span-2' : ''
  return (
    <label className={`block text-xs font-medium text-slate-600 ${wrap}`}>
      {field.label}
      {field.required ? <span className="text-[#c8102e]"> *</span> : null}
      {field.kind === 'textarea' ?
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={inputCls}
        />
      : field.kind === 'select' ?
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">Bitte wählen</option>
          {(field.options ?? []).map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      : field.kind === 'yesno' ?
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
          <option value="">Bitte wählen</option>
          <option value="ja">Ja</option>
          <option value="nein">Nein</option>
        </select>
      : <input
          type={field.kind === 'date' ? 'date' : field.kind === 'number' ? 'number' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputCls}
        />
      }
    </label>
  )
}
