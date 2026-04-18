'use client'

import { createMatchingPropertyFromWizard } from '@/lib/matching/create-property-action'
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
  status: 'draft' | 'active'
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

export function MatchingPropertyWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

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

  const submit = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      toast.error('Bitte Eingaben prüfen.')
      return
    }
    startTransition(async () => {
      const res = await createMatchingPropertyFromWizard(payload)
      if (!res.ok) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        toast.error(res.error)
        return
      }
      toast.success('Objekt gespeichert. Matching wird neu berechnet.')
      router.push('/matching?saved=1')
      router.refresh()
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Matching · Vermieter</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Objekt erfassen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manuelles Erfassen eines Matching-Objekts (getrennt von klassischen Miet-Inseraten).
        </p>
      </div>

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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={form.addressLine}
                onChange={e => set('addressLine', e.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-800">PLZ *</span>
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-600">{fieldErrors.city}</p>}
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Kanton *</span>
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
              </div>
            </fieldset>
          </div>
        )}

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
              disabled={isPending}
              className="rounded-md bg-teal-700 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? 'Speichern…' : 'Speichern'}
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        <button type="button" onClick={() => router.push('/matching')} className="text-teal-800 underline">
          Abbrechen
        </button>
      </p>
    </main>
  )
}
