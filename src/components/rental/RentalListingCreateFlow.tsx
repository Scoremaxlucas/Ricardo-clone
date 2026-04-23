'use client'

import { mapAiImportToRentalLandlordInitial } from '@/lib/rental/listing-ai-to-rental-initial'
import type { ImportListingAiResult } from '@/lib/rental/listing-url-import-types'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'

type Tab = 'manual' | 'url'

export function RentalListingCreateFlow() {
  const [tab, setTab] = useState<Tab>('manual')
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [importedInitial, setImportedInitial] = useState<import('@/lib/rental/rental-landlord-initial').RentalListingLandlordInitial | null>(null)

  const runAnalyze = async () => {
    setErrorMsg(null)
    const trimmed = url.trim()
    if (!trimmed) {
      toast.error('Bitte eine URL einfügen.')
      return
    }

    setAnalyzing(true)
    try {
      const res = await fetch('/api/rental/import-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        code?: string
        message?: string
        data?: ImportListingAiResult
      }

      if (!j.ok || !j.data) {
        const msg =
          j.message ||
          (res.status >= 500
            ? 'Seite nicht erreichbar. Ist die URL öffentlich zugänglich?'
            : 'Automatische Analyse nicht möglich. Bitte Formular manuell ausfüllen.')
        setErrorMsg(msg)
        toast.error(msg)
        return
      }

      setImportedInitial(mapAiImportToRentalLandlordInitial(j.data))
      setTab('manual')
      toast.success('Analyse abgeschlossen — Inserat wurde vorgefüllt.')
    } catch {
      const msg = 'Seite nicht erreichbar. Ist die URL öffentlich zugänglich?'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              tab === 'manual' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manuell
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              tab === 'url' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            URL scannen
          </button>
        </div>
      </div>

      {tab === 'url' ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <label htmlFor="listing-import-url" className="block text-sm font-semibold text-slate-900">
            Link zum bestehenden Inserat einfügen
          </label>
          <input
            id="listing-import-url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.homegate.ch/mieten/..."
            className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none ring-teal-600/30 focus:border-teal-600 focus:ring-2"
            autoComplete="url"
          />
          <p className="mt-3 text-xs text-slate-500">
            Wir übernehmen nur öffentlich verfügbare Angaben. Bitte prüfe alle Felder vor dem Veröffentlichen.
          </p>
          <button
            type="button"
            onClick={() => void runAnalyze()}
            disabled={analyzing}
            className="mt-5 w-full rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
          >
            {analyzing ? 'Analyse läuft…' : 'Inserat scannen'}
          </button>
          {errorMsg ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{errorMsg}</div>
          ) : null}
        </div>
      ) : null}

      <div className={tab === 'url' ? 'mt-5' : 'mt-2'}>
        <RentalListingLandlordForm mode="create" initial={importedInitial ?? undefined} />
      </div>
    </div>
  )
}
