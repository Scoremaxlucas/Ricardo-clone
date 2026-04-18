'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import type { RentalListingStatus } from '@prisma/client'
import { HelpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const ROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5+'] as const

function roomsToSelect(r: number): string {
  if (r >= 5) return '5+'
  const s = String(r)
  return (ROOM_OPTIONS as readonly string[]).includes(s) ? s : '3'
}

export type RentalListingLandlordInitial = {
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
  photos: string[]
  status: RentalListingStatus
}

type Props = {
  mode: 'create' | 'edit'
  listingId?: string
  initial?: RentalListingLandlordInitial
  backHref?: string
}

export function RentalListingLandlordForm({ mode, listingId, initial, backHref = '/matching/properties' }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id
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
  const [requiresCreditCheck, setRequiresCreditCheck] = useState(true)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [listingStatus, setListingStatus] = useState<RentalListingStatus>('active')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!initial || mode !== 'edit') return
    setTitle(initial.title)
    setAddress(initial.address)
    setZip(initial.zip)
    setCity(initial.city)
    setCanton(initial.canton)
    setRooms(roomsToSelect(initial.rooms))
    setAreaSqm(String(initial.areaSqm))
    setFloor(initial.floor != null ? String(initial.floor) : '')
    setRentPerMonth(String(initial.rentPerMonth))
    setUtilitiesPerMonth(initial.utilitiesPerMonth != null ? String(initial.utilitiesPerMonth) : '')
    setDepositAmount(initial.depositAmount != null ? String(initial.depositAmount) : '')
    setAvailableFrom(initial.availableFrom.slice(0, 10))
    setDescription(initial.description)
    setRequiresCreditCheck(initial.requiresCreditCheck)
    setImageUrls(initial.photos)
    setListingStatus(initial.status)
  }, [initial, mode])

  const roomsValue = useMemo(() => (rooms === '5+' ? 5 : parseFloat(rooms)), [rooms])

  const uploadFiles = async (files: FileList | null) => {
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
          toast.error((data as { message?: string }).message || 'Upload fehlgeschlagen')
          continue
        }
        if ((data as { url?: string }).url) next.push((data as { url: string }).url)
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
    setSubmitting(true)
    try {
      const payload = {
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
        requiresCreditCheck,
        photos: imageUrls,
        ...(mode === 'edit' ? { status: listingStatus } : {}),
      }

      const url = mode === 'edit' && listingId ? `/api/rental-listings/${listingId}` : '/api/rental-listings'
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'Speichern fehlgeschlagen')
        return
      }
      toast.success(mode === 'edit' ? 'Inserat aktualisiert' : 'Inserat erstellt')
      router.push(mode === 'edit' ? '/matching/properties' : '/matching/properties')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-6">
        <Link href={backHref} className="text-sm font-medium text-teal-800 hover:underline">
          ← Zurück
        </Link>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Miet-Inserat</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">
        {mode === 'edit' ? 'Inserat bearbeiten' : 'Neues Inserat erstellen'}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Pflichtfelder ausfüllen. Fotos über den Helvenda-Upload (3–10 Bilder). Beschreibung mindestens 50 Zeichen.
      </p>

      {mode === 'edit' ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-slate-900">Status</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
              <input
                type="radio"
                name="listing-status"
                checked={listingStatus === 'active'}
                onChange={() => setListingStatus('active')}
              />
              <span className="font-medium text-emerald-900">Aktiv</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="radio"
                name="listing-status"
                checked={listingStatus === 'rented'}
                onChange={() => setListingStatus('rented')}
              />
              <span className="font-medium text-slate-800">Vermietet</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
              <input
                type="radio"
                name="listing-status"
                checked={listingStatus === 'archived'}
                onChange={() => setListingStatus('archived')}
              />
              <span className="font-medium text-slate-700">Archiviert</span>
            </label>
          </div>
          {listingStatus === 'archived' ? (
            <p className="mt-3 text-xs text-amber-900">Archivierte Inserate sind nicht mehr öffentlich sichtbar.</p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Titel *</label>
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Adresse (Strasse, Nr.) *</label>
          <input
            required
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">PLZ *</label>
            <input
              required
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ort *</label>
            <input
              required
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kanton *</label>
          <select
            required
            value={canton}
            onChange={e => setCanton(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Anzahl Zimmer *</label>
            <select
              required
              value={rooms}
              onChange={e => setRooms(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {ROOM_OPTIONS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Wohnfläche m² *</label>
            <input
              required
              type="number"
              min={1}
              step={1}
              value={areaSqm}
              onChange={e => setAreaSqm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Etage (optional)</label>
          <input
            type="number"
            value={floor}
            onChange={e => setFloor(e.target.value)}
            placeholder="z. B. 3"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Monatsmiete CHF *</label>
            <input
              required
              type="number"
              min={0}
              step={1}
              value={rentPerMonth}
              onChange={e => setRentPerMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nebenkosten CHF (optional)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={utilitiesPerMonth}
              onChange={e => setUtilitiesPerMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Kaution CHF (optional)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={depositAmount}
            onChange={e => setDepositAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Verfügbar ab *</label>
          <input
            required
            type="date"
            value={availableFrom}
            onChange={e => setAvailableFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fotos * (3–10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading || !userId}
            onChange={e => {
              if (!userId) {
                toast.error('Bitte anmelden')
                return
              }
              void uploadFiles(e.target.files)
            }}
            className="w-full text-sm"
          />
          {uploading && <p className="mt-1 text-xs text-slate-500">Lade hoch…</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {imageUrls.map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
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
          <p className="mt-1 text-xs text-slate-500">
            {imageUrls.length} / 3–10 Fotos · Beschreibung ({description.trim().length} Zeichen)
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Beschreibung * (min. 50 Zeichen)</label>
          <textarea
            required
            minLength={50}
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-teal-100 bg-teal-50/40 p-3">
          <input
            type="checkbox"
            checked={requiresCreditCheck}
            onChange={e => setRequiresCreditCheck(e.target.checked)}
            className="mt-1"
          />
          <span className="flex flex-1 items-start gap-2 text-sm text-slate-700">
            <span>Betreibungsregisterauszug von Interessenten erforderlich (empfohlen)</span>
            <span className="inline-flex shrink-0 text-teal-700" title="Schützt dich vor ungeeigneten Anfragen.">
              <HelpCircle className="h-4 w-4" aria-hidden />
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || imageUrls.length < 3 || description.trim().length < 50}
          className="w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? 'Wird gespeichert…' : mode === 'edit' ? 'Änderungen speichern' : 'Inserat veröffentlichen'}
        </button>
      </form>
    </main>
  )
}
