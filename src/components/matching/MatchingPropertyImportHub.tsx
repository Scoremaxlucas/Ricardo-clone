'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { MatchingPropertyImport } from '@/components/matching/MatchingPropertyImport'
import { MatchingPropertyWizard, type UrlImportReviewMeta } from '@/components/matching/MatchingPropertyWizard'
import { mapAiImportToWizardSnapshot } from '@/lib/rental/listing-url-import-map'
import type { ImportListingAiResult } from '@/lib/rental/listing-url-import-types'

type Tab = 'url' | 'file'

function ManualLink() {
  return (
    <p className="mt-4 text-center text-sm text-slate-600">
      <Link href="/matching/properties/new" className="font-medium text-teal-800 underline-offset-2 hover:underline">
        Stattdessen manuell inserieren →
      </Link>
    </p>
  )
}

export function MatchingPropertyImportHub() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('url')
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [review, setReview] = useState<{
    snapshot: import('@/lib/matching/landlord-matching-properties').MatchingPropertyWizardSnapshot
    meta: UrlImportReviewMeta
  } | null>(null)

  const runAnalyze = useCallback(async () => {
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

      if (res.status === 403 && j.code === 'blocked_http') {
        toast.error(
          j.message ||
            'Diese Plattform erlaubt keinen automatischen Zugriff. Bitte fülle das Formular manuell aus.'
        )
        router.push('/matching/properties/new')
        return
      }

      if (!j.ok || !j.data) {
        const msg =
          j.message ||
          (res.status >= 500
            ? 'Seite nicht erreichbar. Ist die URL öffentlich zugänglich?'
            : 'Automatische Analyse nicht möglich. Bitte fülle das Formular manuell aus.')
        setErrorMsg(msg)
        toast.error(msg)
        return
      }

      const mapped = mapAiImportToWizardSnapshot(j.data)
      setReview({
        snapshot: mapped.snapshot,
        meta: {
          filledFieldCount: mapped.filledFieldCount,
          confidence: j.data.confidence,
          platformLabel: j.data.originalPlatform || 'Unbekannt',
          cantonFromAi: mapped.cantonFromAi,
        },
      })
      toast.success('Analyse abgeschlossen — bitte Daten prüfen.')
    } catch {
      const msg = 'Seite nicht erreichbar. Ist die URL öffentlich zugänglich?'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setAnalyzing(false)
    }
  }, [router, url])

  const resetUrlFlow = () => {
    setReview(null)
    setErrorMsg(null)
    setUrl('')
  }

  if (review) {
    return (
      <div>
        <div className="mx-auto max-w-2xl px-4 pt-6">
          <button
            type="button"
            onClick={resetUrlFlow}
            className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline"
          >
            ← Anderen Link analysieren
          </button>
        </div>
        <MatchingPropertyWizard
          mode="create"
          initialSnapshot={review.snapshot}
          urlImportReview={review.meta}
          cancelHref="/matching/properties/import"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Import</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Objekte importieren</h1>
      <p className="mt-2 text-sm text-slate-600">
        Link zu einem bestehenden Inserat analysieren oder eine Datei mit mehreren Objekten importieren.
      </p>

      <div className="mt-6 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
            tab === 'url' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Von URL
        </button>
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
            tab === 'file' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          CSV / Excel
        </button>
      </div>

      {tab === 'url' ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label htmlFor="listing-import-url" className="block text-base font-semibold text-slate-900">
            Link zu deinem bestehenden Inserat einfügen
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
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Wir importieren nur Inserate, für die du als Vermieter berechtigt bist. Durch das Importieren bestätigst du,
            dass du der Eigentümer oder Verwalter dieses Objekts bist.
          </p>
          <button
            type="button"
            onClick={() => void runAnalyze()}
            disabled={analyzing}
            className="mt-6 w-full rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
          >
            {analyzing ? 'Analyse läuft…' : 'Inserat analysieren'}
          </button>
          {errorMsg ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {errorMsg}
            </div>
          ) : null}
          <ManualLink />
        </div>
      ) : (
        <div className="mt-6">
          <MatchingPropertyImport embedded />
        </div>
      )}

      {tab === 'file' ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/matching/properties" className="font-medium text-teal-800 underline-offset-2 hover:underline">
            Zu «Meine Objekte»
          </Link>
        </p>
      ) : null}
    </div>
  )
}
