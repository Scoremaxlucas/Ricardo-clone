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
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-sic-action focus:ring-1 focus:ring-sic-action/25'

/**
 * SIC-Nachweisformular: optional Namen/eigene Angaben vorausfüllen,
 * dann PDF für den Dritten (Arbeitgeber/Vermieter) herunterladen —
 * ausfüllen und unterzeichnen (digital oder Ausdruck), danach Upload.
 */
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
      // Nur Mieter-Felder mitschicken — Felder für den Dritten bleiben im PDF leer
      const tenantOnly: SicTemplateValues = {}
      for (const f of template.fields) {
        if (f.section === 'tenant') tenantOnly[f.key] = values[f.key] ?? ''
        else tenantOnly[f.key] = ''
      }

      const res = await fetch(`/api/sic/templates/${template.id}/pdf`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ values: tenantOnly }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.message || 'Vorlage konnte nicht erstellt werden.')
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
      toast.success(
        `Vorlage heruntergeladen — vom ${template.thirdPartyLabel} ausfüllen und unterzeichnen lassen, danach hier hochladen.`
      )
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(false)
    }
  }

  const tenantFields = template.fields.filter(f => f.section === 'tenant')

  return (
    <div className="mt-4 rounded-xl border border-sic-navy/15 bg-sic-navy/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-sic-navy">
            <FileText className="h-4 w-4 flex-shrink-0" /> {template.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{template.subtitle}</p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[11px] text-slate-500">
            {template.howTo.map(step => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="min-h-11 rounded-lg border border-sic-navy/20 px-3 py-1.5 text-xs font-semibold text-sic-navy hover:bg-white"
          >
            {open ? 'Schliessen' : 'Deinen Namen vorausfüllen'}
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-sic-action px-3 py-1.5 text-xs font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {busy ? 'Wird erstellt …' : 'Vorlage herunterladen'}
          </button>
        </div>
      </div>

      {open ?
        <div className="mt-4 space-y-3 border-t border-sic-navy/10 pt-4">
          <p className="text-[11px] text-slate-500">
            Optional: Deinen Namen vorausfüllen, dann Vorlage herunterladen. Die Felder für den{' '}
            {template.thirdPartyLabel} bleiben in der Vorlage leer zum Ausfüllen — digital oder ausgedruckt.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {tenantFields.map(f => (
              <label key={f.key} className="block text-xs font-medium text-slate-600">
                {f.label}
                {f.required ? <span className="text-sic-danger"> *</span> : null}
                {f.kind === 'date' ?
                  <input
                    type="date"
                    value={values[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                    className={inputCls}
                  />
                : f.kind === 'number' ?
                  <input
                    type="number"
                    value={values[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                : <input
                    type="text"
                    value={values[f.key] ?? ''}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputCls}
                  />
                }
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={busy}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sic-action px-4 py-2.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {busy ?
              'Vorlage wird erstellt …'
            : template.thirdPartyLabel === 'Arbeitgeber' ?
              'Arbeitgeber-Vorlage herunterladen'
            : 'Vorlage herunterladen'
            }
          </button>
        </div>
      : null}
    </div>
  )
}
