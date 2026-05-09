'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  parseSellReturnTo,
  sellBackTarget,
  SELL_RETURN_QUERY,
} from '@/lib/sell-navigation'
import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const ROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'] as const

export function SellRentPageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sellBack = useMemo(
    () => sellBackTarget(parseSellReturnTo(searchParams.get(SELL_RETURN_QUERY))),
    [searchParams]
  )

  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [canton, setCanton] = useState('')
  const [rooms, setRooms] = useState<string>('3')
  const [areaSqm, setAreaSqm] = useState('')
  const [floor, setFloor] = useState('')
  const [rentPerMonth, setRentPerMonth] = useState('')
  const [utilitiesPerMonth, setUtilitiesPerMonth] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [listingExpiresOn, setListingExpiresOn] = useState(() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() + 90)
    return d.toISOString().slice(0, 10)
  })
  const [landlordNotifyEmail, setLandlordNotifyEmail] = useState('')
  const notifyEmailSeeded = useRef(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const roomsValue = rooms === '5+' ? 5 : parseFloat(rooms)

  useEffect(() => {
    if (notifyEmailSeeded.current) return
    const em = (session?.user as { email?: string | null })?.email?.trim()
    if (!em) return
    notifyEmailSeeded.current = true
    setLandlordNotifyEmail(prev => (prev.trim() ? prev : em))
  }, [session?.user])

  const uploadFiles = async (files: FileList | null) => {
    const userId = (session?.user as { id?: string })?.id
    if (!files?.length || !userId) return
    setUploading(true)
    try {
      const next = [...imageUrls]
      for (let i = 0; i < files.length; i++) {
        if (next.length >= 10) {
          toast.error('Maximal 10 Fotos')
          break
        }
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          toast.error('Nur Bilder erlaubt')
          continue
        }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'rental-listing')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data.message || 'Upload fehlgeschlagen')
          continue
        }
        if (data.url) next.push(data.url)
      }
      setImageUrls(next)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrls.length < 3) {
      toast.error('Mindestens 3 Fotos erforderlich')
      return
    }
    if (description.trim().length < 50) {
      toast.error('Beschreibung mindestens 50 Zeichen')
      return
    }
    if (!listingExpiresOn.trim()) {
      toast.error('Bitte «Gültig bis» setzen.')
      return
    }
    const notifyTrim = landlordNotifyEmail.trim()
    if (notifyTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyTrim)) {
      toast.error('Ungültige E-Mail für Bewerbungs-Benachrichtigungen.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/rental-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          address,
          zip,
          city,
          canton,
          rooms: roomsValue,
          areaSqm: parseInt(areaSqm, 10),
          floor: floor.trim() === '' ? null : floor,
          rentPerMonth: parseInt(rentPerMonth, 10),
          utilitiesPerMonth: utilitiesPerMonth.trim() === '' ? null : utilitiesPerMonth,
          depositAmount: depositAmount.trim() === '' ? null : depositAmount,
          availableFrom,
          description,
          requiresCreditCheck: true,
          photos: imageUrls,
          listingExpiresOn: listingExpiresOn.trim(),
          landlordNotifyEmail: notifyTrim || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Speichern fehlgeschlagen')
        return
      }
      toast.success('Inserat erstellt')
      if (data.id) {
        router.push(`/wohnungen/${data.id}`)
      } else {
        router.push('/wohnungen')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session) {
    const cb = `/sell/rent${typeof window !== 'undefined' ? window.location.search : ''}`
    if (typeof window !== 'undefined') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(cb)}`)
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        <div className="mb-6">
          <Link
            href={sellBack.href}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← {sellBack.label}
          </Link>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Mietwohnung inserieren</h1>
        <p className="mb-8 text-sm text-gray-600">
          Pflichtfelder ausfüllen. Fotos werden über den bestehenden Upload sicher gespeichert (3–10 Bilder).
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-teal-100 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Titel *</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Adresse (Strasse, Nr.) *</label>
            <input
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">PLZ *</label>
              <input
                required
                value={zip}
                onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ort *</label>
              <input
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kanton *</label>
            <select
              required
              value={canton}
              onChange={e => setCanton(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Bitte wählen</option>
              {SWISS_CANTONS.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Anzahl Zimmer *</label>
              <select
                required
                value={rooms}
                onChange={e => setRooms(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                {ROOM_OPTIONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Wohnfläche m² *</label>
              <input
                required
                type="number"
                min={1}
                step={1}
                value={areaSqm}
                onChange={e => setAreaSqm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Etage (optional)</label>
            <input
              type="number"
              value={floor}
              onChange={e => setFloor(e.target.value)}
              placeholder="z. B. 3"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monatsmiete CHF *</label>
              <input
                required
                type="number"
                min={0}
                step={1}
                value={rentPerMonth}
                onChange={e => setRentPerMonth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nebenkosten CHF (optional)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={utilitiesPerMonth}
                onChange={e => setUtilitiesPerMonth(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Kaution CHF (optional)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Verfügbar ab *</label>
            <input
              required
              type="date"
              value={availableFrom}
              onChange={e => setAvailableFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">E-Mail für Bewerbungs-Benachrichtigungen</label>
            <input
              type="email"
              autoComplete="email"
              value={landlordNotifyEmail}
              onChange={e => setLandlordNotifyEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Standard: Ihre Konto-E-Mail"
            />
            <p className="mt-1 text-xs text-gray-500">
              An diese Adresse melden wir qualifizierte Bewerbungen. Leer lassen, um Ihre Konto-E-Mail zu verwenden.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Gültig bis * (Kalendertag, Schweiz)</label>
            <input
              required
              type="date"
              value={listingExpiresOn}
              onChange={e => setListingExpiresOn(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ohne https-Original-URL ist ein Enddatum Pflicht; danach wird das Inserat automatisch archiviert.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fotos * (3–10)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={e => uploadFiles(e.target.files)}
              className="w-full text-sm"
            />
            {uploading && <p className="mt-1 text-xs text-gray-500">Lade hoch…</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {imageUrls.map((url, idx) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-0 top-0 bg-black/60 px-1 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {imageUrls.length} / 3–10 Fotos · Beschreibung mind. 50 Zeichen ({description.trim().length})
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Beschreibung * (min. 50 Zeichen)</label>
            <textarea
              required
              minLength={50}
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3 text-sm leading-relaxed text-gray-700">
            <span className="font-semibold text-gray-900">Qualifizierte Bewerbungen: </span>
            Interessenten benötigen ein vollständiges Mieterprofil, einen von Helvenda geprüften Betreibungsregisterauszug
            und die 3×-Mietregel — das gilt für alle Inserate und ist nicht abschaltbar.
          </div>

          <button
            type="submit"
            disabled={
              submitting ||
              imageUrls.length < 3 ||
              description.trim().length < 50 ||
              !listingExpiresOn.trim()
            }
            className="w-full rounded-xl bg-primary-600 py-3 font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Wird gespeichert…' : 'Inserat veröffentlichen'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}
