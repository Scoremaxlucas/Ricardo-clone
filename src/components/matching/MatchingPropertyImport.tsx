'use client'

import { importMatchingPropertiesFromUpload } from '@/lib/matching/import-matching-properties-action'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import toast from 'react-hot-toast'

type MatchingPropertyImportProps = {
  /** Innerhalb des Import-Hubs: kein doppelter Seitentitel / weniger Aussenabstand. */
  embedded?: boolean
}

export function MatchingPropertyImport({ embedded = false }: MatchingPropertyImportProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [lastErrors, setLastErrors] = useState<{ index: number; message: string }[]>([])

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const input = inputRef.current
    const file = input?.files?.[0]
    if (!file) {
      toast.error('Bitte eine Datei wählen.')
      return
    }

    const fd = new FormData()
    fd.set('file', file)

    startTransition(() => {
      void (async () => {
        const res = await importMatchingPropertiesFromUpload(fd)
        if (!res.ok) {
          toast.error(res.error)
          setLastErrors([])
          return
        }
        setLastErrors(res.errors)
        if (res.created > 0) {
          toast.success(`${res.created} Objekt(e) importiert.`)
        }
        if (res.errors.length > 0) {
          toast.error(`${res.errors.length} Zeile(n) mit Fehlern — siehe Liste unten.`)
        } else if (res.created === 0) {
          toast.error('Keine Zeilen importiert.')
        }
        if (res.created > 0) {
          router.refresh()
        }
        if (input) input.value = ''
      })()
    })
  }

  return (
    <div className={embedded ? '' : 'mx-auto max-w-2xl px-4 py-10 sm:py-14'}>
      {embedded ? (
        <h2 className="text-lg font-bold text-slate-900">CSV / Excel</h2>
      ) : (
        <>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">Import</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">CSV / Excel importieren</h1>
        </>
      )}
      <p className={embedded ? 'mt-2 text-sm text-slate-600' : 'mt-3 text-slate-600'}>
        Erste Zeile = Spaltenüberschriften (Deutsch oder Englisch). Pro Zeile ein Objekt — gleiche Pflichtfelder wie
        beim manuellen Erfassen (Titel, PLZ, Ort, Kanton, Zimmer, Miete, Einzug ab).
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          <a
            href="/matching-properties-import-template.csv"
            download
            className="font-semibold text-teal-800 underline-offset-2 hover:underline"
          >
            Beispiel-CSV herunterladen
          </a>
        </p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="matching-import-file" className="block text-sm font-medium text-slate-800">
              Datei (.csv, .xlsx)
            </label>
            <input
              ref={inputRef}
              id="matching-import-file"
              name="file"
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60"
          >
            {isPending ? 'Import läuft…' : 'Import starten'}
          </button>
        </form>
      </div>

      {lastErrors.length > 0 ? (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Zeilenfehler</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {lastErrors.slice(0, 50).map(e => (
              <li key={`${e.index}-${e.message}`}>
                Zeile {e.index}: {e.message}
              </li>
            ))}
            {lastErrors.length > 50 ? <li>… und weitere</li> : null}
          </ul>
        </div>
      ) : null}

      <p className="mt-10 text-sm text-slate-500">
        <Link href="/matching/match-objekte/new" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Manuell erfassen
        </Link>
        {' · '}
        <Link href="/matching" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Zurück zur Übersicht
        </Link>
      </p>

      <section className="mt-12 rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-sm text-slate-700">
        <h2 className="font-semibold text-slate-900">API / Feed (JSON)</h2>
        <p className="mt-2">
          Für automatisierte Anbindung:{' '}
          <code className="rounded bg-white px-1 py-0.5 text-xs text-slate-800">POST /api/matching/properties/import</code>{' '}
          mit Body <code className="rounded bg-white px-1 py-0.5 text-xs">{'{ "items": [ … ] }'}</code> — pro Eintrag
          dieselben Felder wie im Wizard (camelCase). Auth: eingeloggte Session oder{' '}
          <code className="rounded bg-white px-1 py-0.5 text-xs">Authorization: Bearer …</code> wenn{' '}
          <code className="rounded bg-white px-1 py-0.5 text-xs">MATCHING_IMPORT_API_SECRET</code> und{' '}
          <code className="rounded bg-white px-1 py-0.5 text-xs">MATCHING_IMPORT_USER_ID</code> in Vercel gesetzt sind.
        </p>
        <p className="mt-2">
          Liste:{' '}
          <code className="rounded bg-white px-1 py-0.5 text-xs">GET /api/matching/properties</code> (nur mit Session).
        </p>
      </section>
    </div>
  )
}
