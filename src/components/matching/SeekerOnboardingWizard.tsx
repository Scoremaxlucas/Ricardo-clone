'use client'

import {
  registerSeekerMatchingDocumentAction,
} from '@/lib/matching/register-seeker-document-action'
import {
  saveSeekerEmploymentStepAction,
  saveSeekerFinancialStepAction,
  saveSeekerHouseholdStepAction,
  saveSeekerSearchStepAction,
} from '@/lib/matching/save-seeker-onboarding-action'
import { computeSeekerProfileCompleteness } from '@/lib/matching/seeker-profile-completeness'
import type { SeekerOnboardingSnapshot } from '@/lib/matching/seeker-account'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import toast from 'react-hot-toast'

const STEPS = ['Suchkriterien', 'Haushalt', 'Beruf', 'Finanzen', 'Nachweise'] as const

const CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW',
  'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const

const INCOME_BANDS = [
  { value: '', label: 'Bitte wählen …' },
  { value: 'bis 3000 CHF', label: 'bis 3’000 CHF / Monat' },
  { value: '3000–5000 CHF', label: '3’000–5’000 CHF / Monat' },
  { value: '5000–8000 CHF', label: '5’000–8’000 CHF / Monat' },
  { value: '8000+ CHF', label: 'über 8’000 CHF / Monat' },
] as const

function isoDate(d: string | null | undefined): string {
  if (!d) return ''
  return d.slice(0, 10)
}

export function SeekerOnboardingWizard({ initial }: { initial: SeekerOnboardingSnapshot }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const sp = initial.searchProfile
  const hh = initial.household
  const em = initial.employment
  const fi = initial.financial

  const [searchForm, setSearchForm] = useState({
    cantonPreference: sp?.cantonPreference ?? '',
    postalCodesWanted: sp?.postalCodesWanted ?? '',
    budgetMin: sp?.budgetMin != null ? String(sp.budgetMin) : '',
    budgetMax: sp?.budgetMax != null ? String(sp.budgetMax) : '',
    minRooms: sp?.minRooms != null ? String(sp.minRooms) : '',
    maxRooms: sp?.maxRooms != null ? String(sp.maxRooms) : '',
    moveInEarliest: isoDate(sp?.moveInEarliest),
    moveInLatest: isoDate(sp?.moveInLatest),
  })

  const [householdForm, setHouseholdForm] = useState({
    adults: hh != null ? String(hh.adults) : '1',
    children: hh != null ? String(hh.children) : '0',
    petsDescription: hh?.petsDescription ?? '',
  })

  const [employmentForm, setEmploymentForm] = useState({
    employmentStatus: em?.employmentStatus ?? '',
    employerName: em?.employerName ?? '',
  })

  const [financialForm, setFinancialForm] = useState({
    monthlyNetIncomeBand: fi?.monthlyNetIncomeBand ?? '',
  })

  const [docKind, setDocKind] = useState<'id_proof' | 'income' | 'other'>('id_proof')
  const [docUploading, setDocUploading] = useState(false)

  const completeness = useMemo(() => computeSeekerProfileCompleteness(initial), [initial])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const saveSearch = () => {
    startTransition(() => {
      void (async () => {
        const res = await saveSeekerSearchStepAction({
          cantonPreference: searchForm.cantonPreference || undefined,
          postalCodesWanted: searchForm.postalCodesWanted || null,
          budgetMin: searchForm.budgetMin,
          budgetMax: searchForm.budgetMax,
          minRooms: searchForm.minRooms,
          maxRooms: searchForm.maxRooms,
          moveInEarliest: searchForm.moveInEarliest || undefined,
          moveInLatest: searchForm.moveInLatest || undefined,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Suchprofil gespeichert.')
        refresh()
        setStep(1)
      })()
    })
  }

  const saveHousehold = () => {
    startTransition(() => {
      void (async () => {
        const res = await saveSeekerHouseholdStepAction({
          adults: householdForm.adults,
          children: householdForm.children,
          petsDescription: householdForm.petsDescription || null,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Haushalt gespeichert.')
        refresh()
        setStep(2)
      })()
    })
  }

  const saveEmployment = () => {
    startTransition(() => {
      void (async () => {
        const res = await saveSeekerEmploymentStepAction({
          employmentStatus: employmentForm.employmentStatus || undefined,
          employerName: employmentForm.employerName || undefined,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Berufliches Profil gespeichert.')
        refresh()
        setStep(3)
      })()
    })
  }

  const saveFinancial = () => {
    startTransition(() => {
      void (async () => {
        const res = await saveSeekerFinancialStepAction({
          monthlyNetIncomeBand: financialForm.monthlyNetIncomeBand || undefined,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Finanzen gespeichert.')
        refresh()
        setStep(4)
      })()
    })
  }

  const uploadDocument = async (file: File | null) => {
    if (!file) {
      toast.error('Bitte eine Datei wählen.')
      return
    }
    setDocUploading(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      fd.set('folder', 'matching-seeker')
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = (await r.json()) as { success?: boolean; url?: string; type?: string; message?: string }
      if (!r.ok || !json.success || !json.url) {
        toast.error(json.message || 'Upload fehlgeschlagen.')
        return
      }
      const reg = await registerSeekerMatchingDocumentAction({
        fileKey: json.url,
        kind: docKind,
        mimeType: json.type ?? file.type,
      })
      if (!reg.ok) {
        toast.error(reg.error)
        return
      }
      toast.success('Nachweis hochgeladen und zur Prüfung eingereicht.')
      refresh()
    } catch (e) {
      console.error(e)
      toast.error('Upload fehlgeschlagen.')
    } finally {
      setDocUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Matching · Wohnungssuche</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Suchprofil & Unterlagen</h1>
      <p className="mt-2 text-slate-600">
        Schrittweise erfassen — je vollständiger das Profil, desto besser können Treffer zu passenden Objekten
        berechnet werden. Nachweise werden von der Helvenda-Ops geprüft (minimaler Prozess).
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-800">Profilvollständigkeit</span>
          <span className="text-sm font-semibold text-teal-800">{completeness.totalPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${completeness.totalPercent}%` }}
          />
        </div>
        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {completeness.sections.map(s => (
            <li key={s.id} className="flex justify-between gap-2">
              <span>{s.label}</span>
              <span className={s.done ? 'font-medium text-teal-800' : 'text-slate-400'}>
                {s.done ? 'OK' : 'offen'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              step === i ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Suchkriterien</h2>
            <p className="text-sm text-slate-600">
              Mindestens <strong className="font-medium text-slate-800">Kanton oder PLZ-Liste</strong>, ein
              Budgetfeld und eine Zimmer-Angabe.
            </p>
            <label className="block text-sm font-medium text-slate-800">Kanton (optional wenn PLZ-Liste)</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={searchForm.cantonPreference}
              onChange={e => setSearchForm(s => ({ ...s, cantonPreference: e.target.value }))}
            >
              <option value="">—</option>
              {CANTONS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium text-slate-800">PLZ-Liste (kommagetrennt)</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              placeholder="z.B. 8001, 8004, 8008"
              value={searchForm.postalCodesWanted}
              onChange={e => setSearchForm(s => ({ ...s, postalCodesWanted: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-800">Budget min (CHF)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={searchForm.budgetMin}
                  onChange={e => setSearchForm(s => ({ ...s, budgetMin: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Budget max (CHF)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={searchForm.budgetMax}
                  onChange={e => setSearchForm(s => ({ ...s, budgetMax: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-800">Zimmer min</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="z.B. 3.5"
                  value={searchForm.minRooms}
                  onChange={e => setSearchForm(s => ({ ...s, minRooms: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Zimmer max</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={searchForm.maxRooms}
                  onChange={e => setSearchForm(s => ({ ...s, maxRooms: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-800">Einzug frühestens</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={searchForm.moveInEarliest}
                  onChange={e => setSearchForm(s => ({ ...s, moveInEarliest: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Einzug spätestens</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={searchForm.moveInLatest}
                  onChange={e => setSearchForm(s => ({ ...s, moveInLatest: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={saveSearch}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Speichern & weiter
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Haushalt</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-800">Erwachsene</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={householdForm.adults}
                  onChange={e => setHouseholdForm(s => ({ ...s, adults: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800">Kinder</label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={householdForm.children}
                  onChange={e => setHouseholdForm(s => ({ ...s, children: e.target.value }))}
                />
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-800">Haustiere (optional)</label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              placeholder="z.B. eine Katze — leer lassen wenn keine Haustiere"
              value={householdForm.petsDescription}
              onChange={e => setHouseholdForm(s => ({ ...s, petsDescription: e.target.value }))}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={saveHousehold}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Speichern & weiter
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Beruf / Anstellung</h2>
            <label className="block text-sm font-medium text-slate-800">Status</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="z.B. Angestellt 100%"
              value={employmentForm.employmentStatus}
              onChange={e => setEmploymentForm(s => ({ ...s, employmentStatus: e.target.value }))}
            />
            <label className="block text-sm font-medium text-slate-800">Arbeitgeber (optional)</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={employmentForm.employerName}
              onChange={e => setEmploymentForm(s => ({ ...s, employerName: e.target.value }))}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={saveEmployment}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Speichern & weiter
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Finanzen</h2>
            <label className="block text-sm font-medium text-slate-800">Haushalts-Nettoeinkommen (Band)</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={financialForm.monthlyNetIncomeBand}
              onChange={e => setFinancialForm(s => ({ ...s, monthlyNetIncomeBand: e.target.value }))}
            >
              {INCOME_BANDS.map(o => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPending}
              onClick={saveFinancial}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Speichern & weiter
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Nachweise</h2>
            <p className="text-sm text-slate-600">
              PDF oder Bild (max. 5 MB), wie beim Marktplatz-Upload. Nach dem Upload erscheint der Eintrag in der
              Ops-Warteschlange zur Freigabe.
            </p>
            <label className="block text-sm font-medium text-slate-800">Dokumenttyp</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={docKind}
              onChange={e => setDocKind(e.target.value as typeof docKind)}
            >
              <option value="id_proof">Ausweis / Identität</option>
              <option value="income">Einkommensnachweis</option>
              <option value="other">Sonstiges</option>
            </select>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={docUploading}
              onChange={e => void uploadDocument(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {docUploading ? <p className="text-xs text-slate-500">Upload läuft…</p> : null}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800">Eingereichte Dokumente</h3>
              {initial.documents.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Noch keine Nachweise.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {initial.documents.map(d => (
                    <li key={d.id}>
                      {d.kind} — <span className="text-slate-500">{d.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
