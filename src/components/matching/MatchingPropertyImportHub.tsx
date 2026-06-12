'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'
import { mapAiImportToRentalLandlordInitial } from '@/lib/rental/listing-ai-to-rental-initial'
import type { ImportListingAiResult } from '@/lib/rental/listing-url-import-types'

type Props = {
  /** Admin: nach Analyse Miet-Inserat (RentalListing) statt MatchingProperty-Wizard */
  forAdminRental?: boolean
}

function ManualLink() {
  return (
    <p className="mt-8 text-center text-base text-slate-600">
      <Link href="/matching/properties/new/erfassen" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
        Stattdessen manuell inserieren →
      </Link>
    </p>
  )
}

export function MatchingPropertyImportHub({ forAdminRental = false }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [rentalReview, setRentalReview] = useState<{
    initial: import('@/lib/rental/rental-landlord-initial').RentalListingLandlordInitial
    sourceUrl: string
    variant: 'landlord' | 'admin'
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
        router.push('/matching/properties/new/erfassen')
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

      const initial = mapAiImportToRentalLandlordInitial(j.data)
      setRentalReview({
        initial,
        sourceUrl: trimmed,
        variant: forAdminRental ? 'admin' : 'landlord',
      })
      toast.success('Analyse abgeschlossen — bitte Daten und Quelle prüfen.')
    } catch {
      const msg = 'Seite nicht erreichbar. Ist die URL öffentlich zugänglich?'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setAnalyzing(false)
    }
  }, [router, url, forAdminRental])

  const resetUrlFlow = () => {
    setRentalReview(null)
    setErrorMsg(null)
    setUrl('')
  }

  if (rentalReview) {
    const isAdmin = rentalReview.variant === 'admin'
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
        <RentalListingLandlordForm
          mode="create"
          variant={rentalReview.variant}
          minPhotos={0}
          initial={rentalReview.initial}
          importMetaLocked={{ importedFrom: rentalReview.sourceUrl }}
          submitApiPath={isAdmin ? '/api/admin/rental-listings' : undefined}
          afterSaveRedirect={isAdmin ? '/admin/listings' : '/matching/properties'}
          backHref="/matching/properties/import"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 sm:text-sm">Import</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:mt-3 sm:text-4xl">Objekte importieren</h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
        Füge den Link zu einem bestehenden Inserat ein — wir analysieren die öffentlichen Angaben und füllen das Formular für dich vor.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:mt-12 sm:p-10">
        <label htmlFor="listing-import-url" className="block text-lg font-semibold text-slate-900 sm:text-xl">
          Link zu deinem bestehenden Inserat einfügen
        </label>
        <input
          id="listing-import-url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.homegate.ch/mieten/..."
          className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-4 text-lg text-slate-900 outline-none ring-teal-600/30 focus:border-teal-600 focus:ring-2 sm:py-5 sm:text-xl"
          autoComplete="url"
        />
        <p className="mt-5 text-sm leading-relaxed text-slate-500 sm:text-base">
          Wir importieren nur Inserate, für die du als Vermieter berechtigt bist. Durch das Importieren bestätigst du,
          dass du der Eigentümer oder Verwalter dieses Objekts bist.
        </p>
        <button
          type="button"
          onClick={() => void runAnalyze()}
          disabled={analyzing}
          className="mt-8 min-h-[52px] w-full rounded-xl bg-teal-700 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60 sm:w-auto sm:px-10 sm:text-lg"
        >
          {analyzing ? 'Analyse läuft…' : 'Inserat analysieren'}
        </button>
        {errorMsg ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-900">{errorMsg}</div>
        ) : null}
        <ManualLink />
      </div>
    </div>
  )
}
