'use client'

import { createMatchingPropertyFromWizard } from '@/lib/matching/create-property-action'
import type { MatchingPropertyWizardSnapshot } from '@/lib/matching/landlord-matching-properties'
import { updateMatchingPropertyFromWizard } from '@/lib/matching/update-matching-property-action'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import toast from 'react-hot-toast'

const STEPS = ['Stammdaten', 'Adresse', 'Objekt & Miete', 'Regeln & Veröffentlichung'] as const

const CANTONS = [
  'AG',
  'AI',
  'AR',
  'BE',
  'BL',
  'BS',
  'FR',
  'GE',
  'GL',
  'GR',
  'JU',
  'LU',
  'NE',
  'NW',
  'OW',
  'SG',
  'SH',
  'SO',
  'SZ',
  'TG',
  'TI',
  'UR',
  'VD',
  'VS',
  'ZG',
  'ZH',
] as const

type FormState = {
  title: string
  description: string
  addressLine: string
  zip: string
  city: string
  canton: string
  rooms: string
  areaSqm: string
  floor: string
  rentPerMonth: string
  availableFrom: string
  availableTo: string
  petPolicyNote: string
  allowPets: boolean
  status: 'draft' | 'active' | 'paused' | 'archived'
}

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  addressLine: '',
  zip: '',
  city: '',
  canton: 'ZH',
  rooms: '3.5',
  areaSqm: '',
  floor: '',
  rentPerMonth: '',
  availableFrom: '',
  availableTo: '',
  petPolicyNote: '',
  allowPets: true,
  status: 'draft',
})

function formFromSnapshot(s: MatchingPropertyWizardSnapshot): FormState {
  return {
    title: s.title,
    description: s.description,
    addressLine: s.addressLine,
    zip: s.zip,
    city: s.city,
    canton: s.canton,
    rooms: s.rooms,
    areaSqm: s.areaSqm,
    floor: s.floor,
    rentPerMonth: s.rentPerMonth,
    availableFrom: s.availableFrom,
    availableTo: s.availableTo,
    petPolicyNote: s.petPolicyNote,
    allowPets: s.allowPets,
    status: s.status,
  }
}

export type UrlImportReviewMeta = {
  filledFieldCount: number
  confidence: 'high' | 'medium' | 'low'
  platformLabel: string
  cantonFromAi: boolean
}

type MatchingPropertyWizardProps = {
  mode?: 'create' | 'edit'
  propertyId?: string
  initialSnapshot?: MatchingPropertyWizardSnapshot | null
  /** Nach URL-Import: Banner, Fotos (min. 3), Pflicht-Checkbox, Highlights. */
  urlImportReview?: UrlImportReviewMeta | null
  cancelHref?: string
}

export function MatchingPropertyWizard({
  mode = 'create',
  propertyId,
  initialSnapshot = null,
  urlImportReview = null,
  cancelHref,
}: MatchingPropertyWizardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const isEdit = mode === 'edit'
  const isUrlImport = Boolean(urlImportReview)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(() =>
    initialSnapshot ? formFromSnapshot(initialSnapshot) : emptyForm()
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [importPhotoUrls, setImportPhotoUrls] = useState<string[]>([])
  const [rightsConfirmed, setRightsConfirmed] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }, [])

  const validateStep = useCallback(
    (s: number): boolean => {
      if (s === 3) return true
      const err: Record<string, string> = {}
      if (s === 0) {
        if (form.title.trim().length < 3) err.title = 'Titel mindestens 3 Zeichen'
      }
      if (s === 1) {
        if (!/^\d{4}$/.test(form.zip.trim())) err.zip = 'PLZ 4 Ziffern'
        if (!form.city.trim()) err.city = 'Ort erforderlich'
        if (!form.canton || form.canton.length !== 2) err.canton = 'Kanton wählen'
      }
      if (s === 2) {
        const rooms = Number(form.rooms)
        if (Number.isNaN(rooms) || rooms < 0.5) err.rooms = 'Zimmer ungültig'
        const rent = Number(form.rentPerMonth)
        if (!Number.isFinite(rent) || rent < 1) err.rentPerMonth = 'Miete erforderlich'
        if (!form.availableFrom) err.availableFrom = 'Verfügbar ab erforderlich'
      }
      setFieldErrors(err)
      return Object.keys(err).length === 0
    },
    [form]
  )

  const next = () => {
    if (!validateStep(step)) {
      toast.error('Bitte fehlende Felder ausfüllen.')
      return
    }
    setStep(s => Math.min(STEPS.length - 1, s + 1))
  }

  const back = () => setStep(s => Math.max(0, s - 1))

  const payload = useMemo(() => {
    const availableFrom = form.availableFrom ? new Date(form.availableFrom) : undefined
    const availableTo = form.availableTo ? new Date(form.availableTo) : undefined
    return {
      title: form.title,
      description: form.description || null,
      addressLine: form.addressLine || null,
      zip: form.zip.trim(),
      city: form.city.trim(),
      canton: form.canton,
      rooms: Number(form.rooms),
      areaSqm: form.areaSqm.trim() === '' ? undefined : Number(form.areaSqm),
      floor: form.floor.trim() === '' ? undefined : Number(form.floor),
      rentPerMonth: Number(form.rentPerMonth),
      availableFrom: availableFrom?.toISOString(),
      availableTo: availableTo ? availableTo.toISOString() : undefined,
      petPolicyNote: form.petPolicyNote || null,
      allowPets: form.allowPets,
      status: form.status,
    }
  }, [form])

  const importRequiredOk = useMemo(() => {
    const titleOk = form.title.trim().length >= 3
    const zipOk = /^\d{4}$/.test(form.zip.trim())
    const cityOk = form.city.trim().length > 0
    const roomsN = Number(form.rooms)
    const roomsOk = Number.isFinite(roomsN) && roomsN >= 0.5
    const rentN = Number(form.rentPerMonth)
    const rentOk = Number.isFinite(rentN) && rentN >= 1
    const dateOk = Boolean(form.availableFrom)
    return titleOk && zipOk && cityOk && roomsOk && rentOk && dateOk
  }, [form])

  const highlightImportRequired = useCallback(
    (key: keyof FormState) => {
      if (!urlImportReview) return false
      if (key === 'title') return form.title.trim().length < 3
      if (key === 'zip') return !/^\d{4}$/.test(form.zip.trim())
      if (key === 'city') return !form.city.trim()
      if (key === 'rooms') {
        const n = Number(form.rooms)
        return !form.rooms.trim() || !Number.isFinite(n) || n < 0.5
      }
      if (key === 'rentPerMonth') {
        const n = Number(form.rentPerMonth)
        return !Number.isFinite(n) || n < 1
      }
      if (key === 'availableFrom') return !form.availableFrom
      if (key === 'canton') return !urlImportReview.cantonFromAi
      return false
    },
    [form, urlImportReview]
  )

  const inputRing = (key: keyof FormState) =>
    highlightImportRequired(key)
      ? 'border-amber-400 ring-2 ring-amber-200 focus:border-teal-600 focus:ring-teal-600'
      : 'border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600'

  const uploadImportPhotos = async (files: FileList | null) => {
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!files?.length || !userId) return
    setUploadingPhotos(true)
    try {
      const next = [...importPhotoUrls]
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
        fd.append('folder', 'matching-listing-import')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string }
        if (!res.ok) {
          toast.error(data.message || 'Upload fehlgeschlagen')
          continue
        }
        if (data.url) next.push(data.url)
      }
      setImportPhotoUrls(next)
    } finally {
      setUploadingPhotos(false)
    }
  }

  const removeImportPhoto = (idx: number) => {
    setImportPhotoUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const submit = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      toast.error('Bitte Eingaben prüfen.')
      return
    }
    if (urlImportReview) {
      if (!importRequiredOk) {
        toast.error('Bitte alle markierten Pflichtfelder ausfüllen.')
        return
      }
      if (importPhotoUrls.length < 3) {
        toast.error('Mindestens 3 Fotos hochladen.')
        return
      }
      if (!rightsConfirmed) {
        toast.error('Bitte die Bestätigung am Ende des Formulars aktivieren.')
        return
      }
    }
    startTransition(async () => {
      let submitPayload: typeof payload = payload
      if (urlImportReview && importPhotoUrls.length > 0) {
        const base = (form.description || '').trim()
        const block = `\n\n[Referenzfotos Import]\n${importPhotoUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}`
        const merged = (base + block).slice(0, 12000)
        submitPayload = { ...payload, description: merged || null }
      }
      const res =
        isEdit && propertyId
          ? await updateMatchingPropertyFromWizard(propertyId, submitPayload)
          : await createMatchingPropertyFromWizard(submitPayload)
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        toast.error(res.error)
        return
      }
      toast.success(
        isEdit ? 'Änderungen gespeichert. Matching wurde aktualisiert.' : 'Objekt gespeichert. Matching wird neu berechnet.'
      )
      router.push(isEdit ? '/matching/properties' : '/matching?saved=1')
      router.refresh()
    })
  }

  const cancelTarget = cancelHref ?? (isEdit ? '/matching/properties' : '/matching')
  const finalSubmitDisabled =
    isPending ||
    (urlImportReview ? !rightsConfirmed || importPhotoUrls.length < 3 || !importRequiredOk : false)

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Matching · Vermieter</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          {isEdit ? 'Objekt bearbeiten' : isUrlImport ? 'Inserat prüfen & speichern' : 'Objekt erfassen'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isEdit
            ? 'Stammdaten, Miete und Veröffentlichungsstatus anpassen — getrennt vom klassischen Marktplatz.'
            : isUrlImport
              ? 'Die Angaben wurden aus dem externen Inserat übernommen. Bitte alles prüfen und bei Bedarf anpassen.'
              : 'Manuelles Erfassen eines Matching-Objekts (getrennt von klassischen Miet-Inseraten).'}
        </p>
      </div>

      {urlImportReview ? (
        <div className="mb-6 space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            Wir haben {urlImportReview.filledFieldCount} Felder automatisch ausgefüllt. Bitte prüfe alle Angaben vor
            dem Speichern.
          </div>
          {urlImportReview.confidence === 'low' ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Einige Felder konnten nicht automatisch erkannt werden. Bitte fülle die markierten Pflichtfelder manuell
              aus.
            </div>
          ) : null}
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">Erkannte Plattform:</span>{' '}
            {urlImportReview.platformLabel || 'Unbekannt'} ✓
          </p>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Fotos können nicht automatisch importiert werden. Bitte mindestens 3 Bilder hochladen (Referenz-URLs werden
            der Beschreibung angehängt).
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-800">Referenzfotos (mind. 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingPhotos}
              aria-label="Referenzfotos hochladen"
              title="Referenzfotos hochladen"
              onChange={e => void uploadImportPhotos(e.target.files)}
              className="mt-2 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800 disabled:opacity-50"
            />
            {importPhotoUrls.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {importPhotoUrls.map((u, idx) => (
                  <li
                    key={`${u}-${idx}`}
                    className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    <span className="max-w-[180px] truncate">{u}</span>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => removeImportPhoto(idx)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-1 text-xs text-slate-500">{importPhotoUrls.length} / mind. 3 Fotos</p>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex gap-1">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-md border px-2 py-2 text-center text-xs font-medium ${
              i === step
                ? 'border-teal-600 bg-teal-50 text-teal-900'
                : i < step
                  ? 'border-teal-200 bg-white text-teal-800'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {step === 0 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Titel *</span>
              <input
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('title')}`}
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="z. B. Helle 3.5-Zi.-Wohnung nahe Bahnhof"
              />
              {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Beschreibung (optional)</span>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Ausstattung, Umgebung, Besonderheiten …"
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Strasse, Nr. (optional)</span>
              <input
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                value={form.addressLine}
                onChange={e => set('addressLine', e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">PLZ *</span>
                <input
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('zip')}`}
                  value={form.zip}
                  onChange={e => set('zip', e.target.value)}
                  inputMode="numeric"
                  maxLength={4}
                />
                {fieldErrors.zip && <p className="mt-1 text-xs text-red-600">{fieldErrors.zip}</p>}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-800">Ort *</span>
                <input
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('city')}`}
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Kanton *</span>
              <select
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('canton')}`}
                value={form.canton}
                onChange={e => set('canton', e.target.value)}
              >
                {CANTONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fieldErrors.canton && <p className="mt-1 text-xs text-red-600">{fieldErrors.canton}</p>}
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">Zimmer *</span>
                <input
                  type="number"
                  step="0.5"
                  min={0.5}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('rooms')}`}
                  value={form.rooms}
                  onChange={e => set('rooms', e.target.value)}
                />
                {fieldErrors.rooms && <p className="mt-1 text-xs text-red-600">{fieldErrors.rooms}</p>}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-800">Wohnfläche m² (optional)</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.areaSqm}
                  onChange={e => set('areaSqm', e.target.value)}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Etage (optional)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.floor}
                onChange={e => set('floor', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Monatsmiete CHF *</span>
              <input
                type="number"
                min={1}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('rentPerMonth')}`}
                value={form.rentPerMonth}
                onChange={e => set('rentPerMonth', e.target.value)}
              />
              {fieldErrors.rentPerMonth && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.rentPerMonth}</p>
              )}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">Verfügbar ab *</span>
                <input
                  type="date"
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none ${inputRing('availableFrom')}`}
                  value={form.availableFrom}
                  onChange={e => set('availableFrom', e.target.value)}
                />
                {fieldErrors.availableFrom && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.availableFrom}</p>
                )}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-800">Verfügbar bis (optional)</span>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.availableTo}
                  onChange={e => set('availableTo', e.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Haustier-Hinweis (optional)</span>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.petPolicyNote}
                onChange={e => set('petPolicyNote', e.target.value)}
                placeholder="z. B. Kleine Hunde nach Absprache"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.allowPets}
                onChange={e => set('allowPets', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-700"
              />
              <span className="text-sm text-slate-800">Haustiere in den Matching-Regeln erlaubt</span>
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-slate-800">Veröffentlichung</legend>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pub"
                    checked={form.status === 'draft'}
                    onChange={() => set('status', 'draft')}
                  />
                  <span className="text-sm text-slate-700">Entwurf (nicht im aktiven Matching)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pub"
                    checked={form.status === 'active'}
                    onChange={() => set('status', 'active')}
                  />
                  <span className="text-sm text-slate-700">Aktiv (für Matching sichtbar)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pub"
                    checked={form.status === 'paused'}
                    onChange={() => set('status', 'paused')}
                  />
                  <span className="text-sm text-slate-700">Pausiert (vorübergehend aus dem Matching)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pub"
                    checked={form.status === 'archived'}
                    onChange={() => set('status', 'archived')}
                  />
                  <span className="text-sm text-slate-700">Archiviert (dauerhaft ohne aktives Matching)</span>
                </label>
              </div>
            </fieldset>
          </div>
        )}

        {urlImportReview && step === STEPS.length - 1 ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/90 px-4 py-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={rightsConfirmed}
                onChange={e => setRightsConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-700"
              />
              <span>
                Ich bestätige, dass ich berechtigt bin, dieses Objekt auf Helvenda zu inserieren, und dass alle Angaben
                korrekt sind.
              </span>
            </label>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || isPending}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Zurück
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              disabled={isPending}
              className="rounded-md bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              Weiter
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={finalSubmitDisabled}
              className="rounded-md bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? 'Speichern…' : 'Speichern'}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        <button type="button" onClick={() => router.push(cancelTarget)} className="text-teal-800 underline">
          Abbrechen
        </button>
      </p>
    </main>
  )
}
