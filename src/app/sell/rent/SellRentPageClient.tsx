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
import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

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
  const [postalCode, setPostalCode] = useState('')
  const [canton, setCanton] = useState('')
  const [rooms, setRooms] = useState('3')
  const [livingAreaM2, setLivingAreaM2] = useState('')
  const [floor, setFloor] = useState('')
  const [monthlyRentChf, setMonthlyRentChf] = useState('')
  const [extraCostsChf, setExtraCostsChf] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [depositChf, setDepositChf] = useState('')
  const [description, setDescription] = useState('')
  const [requiresCreditCheck, setRequiresCreditCheck] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const uploadFiles = async (files: FileList | null) => {
    const userId = (session?.user as { id?: string })?.id
    if (!files?.length || !userId) return
    setUploading(true)
    try {
      const next = [...imageUrls]
      for (let i = 0; i < files.length; i++) {
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
    setSubmitting(true)
    try {
      const res = await fetch('/api/rental-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          address,
          postalCode,
          canton,
          rooms: parseFloat(rooms),
          livingAreaM2: parseFloat(livingAreaM2),
          floor,
          monthlyRentChf: parseFloat(monthlyRentChf),
          extraCostsChf: parseFloat(extraCostsChf),
          availableFrom,
          depositChf: depositChf.trim() === '' ? null : depositChf,
          description,
          requiresCreditCheck,
          images: imageUrls,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Speichern fehlgeschlagen')
        return
      }
      toast.success('Inserat erstellt')
      router.push('/wohnungen')
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
          Pflichtfelder ausfüllen. Fotos werden über den bestehenden Upload sicher gespeichert.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow">
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Adresse *</label>
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
                value={postalCode}
                onChange={e => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Zimmer * (0,5er Schritte)
              </label>
              <input
                required
                type="number"
                step={0.5}
                min={0.5}
                value={rooms}
                onChange={e => setRooms(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Wohnfläche m² *</label>
              <input
                required
                type="number"
                min={1}
                step={1}
                value={livingAreaM2}
                onChange={e => setLivingAreaM2(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Etage *</label>
            <input
              required
              value={floor}
              onChange={e => setFloor(e.target.value)}
              placeholder="z. B. EG, 3, UG"
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
                value={monthlyRentChf}
                onChange={e => setMonthlyRentChf(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nebenkosten CHF *</label>
              <input
                required
                type="number"
                min={0}
                step={1}
                value={extraCostsChf}
                onChange={e => setExtraCostsChf(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Kaution CHF (optional)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={depositChf}
              onChange={e => setDepositChf(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fotos * (mind. 3)</label>
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
            <p className="mt-1 text-xs text-gray-500">{imageUrls.length} / mind. 3 Fotos</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Beschreibung *</label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={requiresCreditCheck}
              onChange={e => setRequiresCreditCheck(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-gray-700">
              Betreibungsregisterauszug von Interessenten erforderlich (empfohlen)
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || imageUrls.length < 3}
            className="w-full rounded-xl bg-primary-600 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? 'Wird gespeichert…' : 'Inserat veröffentlichen'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}
