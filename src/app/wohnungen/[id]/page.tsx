'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Loader2, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

type ListingDetail = {
  id: string
  title: string
  description: string
  address: string
  zip: string
  city: string
  canton: string
  rooms: number
  areaSqm: number
  floor: number | null
  rentPerMonth: number
  utilitiesPerMonth: number | null
  depositAmount: number | null
  availableFrom: string
  requiresCreditCheck: boolean
  images: string[]
  userId: string
  landlord: {
    id: string
    name: string | null
    firstName: string | null
    nickname: string | null
    image: string | null
    verified: boolean
  } | null
}

export default function WohnungDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [message, setMessage] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [confirmPersonal, setConfirmPersonal] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/rental-listings/${id}`)
        const data = await res.json()
        if (!res.ok) {
          if (!cancelled) setListing(null)
          return
        }
        if (!cancelled) setListing(data.listing)
      } catch {
        if (!cancelled) setListing(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(session?.user as { id?: string })?.id) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/wohnungen/${id}`)}`)
      return
    }
    if (!listing) return
    if (listing.requiresCreditCheck) {
      if (!pdfFile) {
        toast.error('Bitte Betreibungsregisterauszug (PDF) hochladen.')
        return
      }
      if (!confirmPersonal) {
        toast.error('Bitte die Bestätigung zum Dokument ankreuzen.')
        return
      }
    }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('message', message)
      if (pdfFile) fd.append('file', pdfFile)
      if (listing.requiresCreditCheck) {
        fd.append('confirmPersonal', confirmPersonal ? 'true' : 'false')
      }
      const res = await fetch(`/api/rental-listings/${id}/contact`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Senden fehlgeschlagen')
        return
      }
      toast.success(data.message || 'Anfrage gesendet')
      setSent(true)
      setMessage('')
      setPdfFile(null)
      setConfirmPersonal(false)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-gray-600">Inserat nicht gefunden.</p>
          <Link href="/wohnungen" className="mt-4 inline-block text-primary-600 hover:underline">
            Zur Übersicht
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const isOwner = (session?.user as { id?: string })?.id === listing.userId

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/wohnungen" className="text-sm text-primary-600 hover:underline">
          ← Alle Mietwohnungen
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">{listing.title}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-gray-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {listing.address}, {listing.zip} {listing.city} ({listing.canton})
          </span>
          {listing.requiresCreditCheck && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
              Betreibungsregister erforderlich
            </span>
          )}
        </p>
        <p className="mt-2 text-xl font-semibold text-primary-700">
          CHF {listing.rentPerMonth.toLocaleString('de-CH')} / Monat
          {listing.utilitiesPerMonth != null && (
            <span className="ml-2 text-base font-normal text-gray-600">
              + NK CHF {listing.utilitiesPerMonth.toLocaleString('de-CH')}
            </span>
          )}
        </p>
        {listing.depositAmount != null && (
          <p className="text-sm text-gray-600">
            Kaution: CHF {listing.depositAmount.toLocaleString('de-CH')}
          </p>
        )}
        <p className="mt-1 text-sm text-gray-600">
          {listing.rooms} Zimmer · {listing.areaSqm} m²
          {listing.floor != null ? ` · Etage ${listing.floor}` : ''} · verfügbar ab{' '}
          {new Date(listing.availableFrom).toLocaleDateString('de-CH')}
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {listing.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-48 w-full rounded-lg object-cover" />
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Beschreibung</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{listing.description}</p>
        </div>

        {listing.landlord && (
          <div className="mt-6 text-sm text-gray-600">
            Inserent: {listing.landlord.nickname || listing.landlord.name || 'Privat'}
            {listing.landlord.verified ? ' · verifiziert' : ''}
          </div>
        )}

        {!isOwner && (
          <div className="mt-10 rounded-xl border border-teal-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Anfrage senden</h2>
            {sent ? (
              <p className="mt-2 text-sm text-green-700">Deine Anfrage wurde übermittelt.</p>
            ) : (
              <form onSubmit={submitContact} className="mt-4 space-y-4">
                {listing.requiresCreditCheck && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Betreibungsregisterauszug (PDF) *
                      </label>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        required={listing.requiresCreditCheck}
                        onChange={e => setPdfFile(e.target.files?.[0] || null)}
                        className="w-full text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-600">
                        Lade deinen Betreibungsregisterauszug hoch (max. 3 Monate alt). Dein Dokument wird
                        verschlüsselt gespeichert — dem Vermieter werden nur relevante Informationen angezeigt.
                      </p>
                    </div>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={confirmPersonal}
                        onChange={e => setConfirmPersonal(e.target.checked)}
                        className="mt-1"
                        required={listing.requiresCreditCheck}
                      />
                      <span>
                        Ich bestätige, dass dieses Dokument auf mich ausgestellt ist und aktuell ist. *
                      </span>
                    </label>
                  </>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nachricht *</label>
                  <textarea
                    required
                    minLength={20}
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Stelle dich kurz vor und beschreibe dein Interesse."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {sending ? 'Senden…' : 'Anfrage senden'}
                </button>
              </form>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
