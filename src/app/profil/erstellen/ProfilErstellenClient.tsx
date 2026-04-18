'use client'

import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import { employmentLabelDe } from '@/lib/tenant-profile/labels'
import { wohnenToast } from '@/lib/wohnen-toast'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; icon: string; label: string }[] = [
  { value: 'EMPLOYED', icon: '💼', label: 'Angestellt' },
  { value: 'SELF_EMPLOYED', icon: '🏢', label: 'Selbständig' },
  { value: 'STUDENT', icon: '🎓', label: 'Student/in' },
  { value: 'RETIRED', icon: '🏖', label: 'Pensioniert' },
  { value: 'UNEMPLOYED', icon: '🔍', label: 'Stellensuchend' },
  { value: 'OTHER', icon: '➕', label: 'Andere' },
]

const INCOME_OPTIONS: { value: IncomeCategory; label: string }[] = [
  { value: 'UNDER_2000', label: "Unter CHF 2'000" },
  { value: 'FROM_2000_TO_3000', label: "CHF 2'000 – 3'000" },
  { value: 'FROM_3000_TO_4000', label: "CHF 3'000 – 4'000" },
  { value: 'FROM_4000_TO_5000', label: "CHF 4'000 – 5'000" },
  { value: 'FROM_5000_TO_7000', label: "CHF 5'000 – 7'000" },
  { value: 'ABOVE_7000', label: "Über CHF 7'000" },
]

export type ProfilFormInitial = {
  firstName: string
  lastName: string
  dateOfBirth: string
  currentAddress: string
  currentZip: string
  currentCity: string
  employmentStatus: EmploymentStatus
  employer: string
  jobTitle: string
  employedSinceYear: string
  employedSinceMonth: string
  monthlyIncomeCategory: IncomeCategory
  referenceName: string
  referencePhone: string
  referenceRelation: string
}

function defaultForm(): ProfilFormInitial {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    currentAddress: '',
    currentZip: '',
    currentCity: '',
    employmentStatus: 'EMPLOYED',
    employer: '',
    jobTitle: '',
    employedSinceYear: '',
    employedSinceMonth: '',
    monthlyIncomeCategory: 'FROM_3000_TO_4000',
    referenceName: '',
    referencePhone: '',
    referenceRelation: '',
  }
}

function dobInputValue(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildInitialFromApi(p: Record<string, unknown> | null | undefined): ProfilFormInitial {
  if (!p) return defaultForm()
  const employedSince = p.employedSince as string | null | undefined
  let employedSinceYear = ''
  let employedSinceMonth = ''
  if (employedSince) {
    const d = new Date(employedSince)
    if (!Number.isNaN(d.getTime())) {
      employedSinceYear = String(d.getUTCFullYear())
      employedSinceMonth = String(d.getUTCMonth() + 1)
    }
  }
  return {
    firstName: String(p.firstName ?? ''),
    lastName: String(p.lastName ?? ''),
    dateOfBirth: dobInputValue(String(p.dateOfBirth ?? '')),
    currentAddress: String(p.currentAddress ?? ''),
    currentZip: String(p.currentZip ?? ''),
    currentCity: String(p.currentCity ?? ''),
    employmentStatus: (p.employmentStatus as EmploymentStatus) || 'EMPLOYED',
    employer: String(p.employer ?? ''),
    jobTitle: String(p.jobTitle ?? ''),
    employedSinceYear,
    employedSinceMonth,
    monthlyIncomeCategory: (p.monthlyIncomeCategory as IncomeCategory) || 'FROM_3000_TO_4000',
    referenceName: String(p.referenceName ?? ''),
    referencePhone: String(p.referencePhone ?? ''),
    referenceRelation: String(p.referenceRelation ?? ''),
  }
}

type Props = {
  mode: 'create' | 'edit'
  initial: ProfilFormInitial
  redirectAfterSave: string
}

function minAge18(dobStr: string): boolean {
  const dob = new Date(dobStr)
  if (Number.isNaN(dob.getTime())) return false
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age >= 18
}

export function ProfilErstellenClient({ mode, initial, redirectAfterSave }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ProfilFormInitial>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const needsEmployer = form.employmentStatus === 'EMPLOYED' || form.employmentStatus === 'SELF_EMPLOYED'
  const [confirmTruth, setConfirmTruth] = useState(false)

  const years = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 45 }, (_, i) => y - i)
  }, [])

  const setField = useCallback((key: keyof ProfilFormInitial, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => {
      const n = { ...e }
      delete n[key]
      return n
    })
  }, [])

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Vorname ist erforderlich'
    if (!form.lastName.trim()) e.lastName = 'Nachname ist erforderlich'
    if (!form.dateOfBirth) e.dateOfBirth = 'Geburtsdatum ist erforderlich'
    else if (!minAge18(form.dateOfBirth)) e.dateOfBirth = 'Du musst mindestens 18 Jahre alt sein'
    if (!form.currentAddress.trim()) e.currentAddress = 'Adresse ist erforderlich'
    if (!/^\d{4}$/.test(form.currentZip.trim())) e.currentZip = 'PLZ muss genau 4 Ziffern haben'
    if (!form.currentCity.trim()) e.currentCity = 'Ort ist erforderlich'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {}
    if (needsEmployer && !form.employer.trim()) {
      e.employer = 'Arbeitgeber / Firma ist erforderlich'
    }
    if (form.employedSinceYear || form.employedSinceMonth) {
      if (!form.employedSinceYear || !form.employedSinceMonth) {
        e.employedSinceMonth = 'Bitte Monat und Jahr angeben'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {}
    if (!confirmTruth) e.confirmTruth = 'Bitte bestätige die Richtigkeit deiner Angaben'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const goNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => Math.min(3, s + 1))
  }

  const goBack = () => {
    setStep(s => Math.max(1, s - 1))
  }

  const submit = async () => {
    if (!validateStep3()) return
    setSubmitting(true)
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        currentAddress: form.currentAddress.trim(),
        currentZip: form.currentZip.trim(),
        currentCity: form.currentCity.trim(),
        employmentStatus: form.employmentStatus,
        employer: needsEmployer ? form.employer.trim() : null,
        jobTitle: form.jobTitle.trim() || null,
        employedSinceYear: form.employedSinceYear ? Number(form.employedSinceYear) : null,
        employedSinceMonth: form.employedSinceMonth ? Number(form.employedSinceMonth) : null,
        monthlyIncomeCategory: form.monthlyIncomeCategory,
        referenceName: form.referenceName.trim() || null,
        referencePhone: form.referencePhone.trim() || null,
        referenceRelation: form.referenceRelation.trim() || null,
      }
      const res = await fetch('/api/tenant-profile', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const field = data.field as string | undefined
        if (field) setErrors({ [field]: data.message || 'Fehler' })
        else setErrors({ _form: data.message || 'Speichern fehlgeschlagen' })
        return
      }
      wohnenToast.profileSaved()
      router.push(redirectAfterSave.startsWith('/') ? redirectAfterSave : '/profil')
      router.refresh()
    } catch {
      wohnenToast.genericError()
    } finally {
      setSubmitting(false)
    }
  }

  const summaryIncome = INCOME_OPTIONS.find(o => o.value === form.monthlyIncomeCategory)?.label ?? ''

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {mode === 'edit' ? 'Profil bearbeiten' : 'Mieterprofil erstellen'}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Mit einem vollständigen Profil kannst du dich auf Wohnungen bewerben — dein Einkommen erscheint nur als Kategorie.
      </p>

      <ol className="mt-8 flex items-center justify-between gap-2 text-xs font-medium text-slate-500 sm:text-sm">
        {[1, 2, 3].map(n => (
          <li key={n} className="flex flex-1 items-center gap-2">
            <span
              className={
                step >= n
                  ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#18a87c] text-white'
                  : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white'
              }
            >
              {n}
            </span>
            <span className="hidden min-w-0 sm:inline">
              {n === 1 ? 'Persönlich' : n === 2 ? 'Beruf' : 'Referenz'}
            </span>
            {n < 3 ? <span className="hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden /> : null}
          </li>
        ))}
      </ol>

      {errors._form ? <p className="mt-4 text-sm text-red-600">{errors._form}</p> : null}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Schritt 1 — Persönliche Angaben</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Vorname *</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.firstName}
                onChange={e => setField('firstName', e.target.value)}
              />
              {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName}</p> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nachname *</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.lastName}
                onChange={e => setField('lastName', e.target.value)}
              />
              {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName}</p> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Geburtsdatum *</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.dateOfBirth}
                onChange={e => setField('dateOfBirth', e.target.value)}
              />
              {errors.dateOfBirth ? <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Aktuelle Strasse und Hausnummer *</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.currentAddress}
                onChange={e => setField('currentAddress', e.target.value)}
              />
              {errors.currentAddress ? <p className="mt-1 text-xs text-red-600">{errors.currentAddress}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">PLZ (Schweiz) *</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.currentZip}
                  onChange={e => setField('currentZip', e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                {errors.currentZip ? <p className="mt-1 text-xs text-red-600">{errors.currentZip}</p> : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Ort *</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.currentCity}
                  onChange={e => setField('currentCity', e.target.value)}
                />
                {errors.currentCity ? <p className="mt-1 text-xs text-red-600">{errors.currentCity}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Schritt 2 — Beschäftigung &amp; Einkommen</h2>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Beschäftigungsstatus *</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {EMPLOYMENT_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      form.employmentStatus === opt.value
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="employment"
                      className="sr-only"
                      checked={form.employmentStatus === opt.value}
                      onChange={() => setField('employmentStatus', opt.value)}
                    />
                    <span aria-hidden>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {needsEmployer ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Arbeitgeber / Firma *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.employer}
                    onChange={e => setField('employer', e.target.value)}
                  />
                  {errors.employer ? <p className="mt-1 text-xs text-red-600">{errors.employer}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Berufsbezeichnung (optional)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={form.jobTitle}
                    onChange={e => setField('jobTitle', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Angestellt seit — Monat (optional)</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={form.employedSinceMonth}
                      onChange={e => setField('employedSinceMonth', e.target.value)}
                    >
                      <option value="">—</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1)}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Angestellt seit — Jahr (optional)</label>
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={form.employedSinceYear}
                      onChange={e => setField('employedSinceYear', e.target.value)}
                    >
                      <option value="">—</option>
                      {years.map(y => (
                        <option key={y} value={String(y)}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {errors.employedSinceMonth ? (
                  <p className="text-xs text-red-600">{errors.employedSinceMonth}</p>
                ) : null}
              </>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-slate-700">Monatliches Nettoeinkommen *</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.monthlyIncomeCategory}
                onChange={e => setField('monthlyIncomeCategory', e.target.value as IncomeCategory)}
              >
                {INCOME_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900">
              🔒 Dein genaues Einkommen wird nie angezeigt — Vermieter sehen nur die Kategorie.
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Schritt 3 — Referenz &amp; Kontrolle</h2>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
                Referenz (optional)
                <span className="cursor-help text-slate-400" title="Eine frühere Vermieter-Referenz erhöht deine Chancen erheblich">
                  (?)
                </span>
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Name der Referenzperson"
                value={form.referenceName}
                onChange={e => setField('referenceName', e.target.value)}
              />
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Telefonnummer"
                value={form.referencePhone}
                onChange={e => setField('referencePhone', e.target.value)}
              />
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder='Beziehung (z.B. "Frühere Vermieterin")'
                value={form.referenceRelation}
                onChange={e => setField('referenceRelation', e.target.value)}
              />
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-bold text-slate-800">Zusammenfassung</h3>
              <dl className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between gap-4">
                  <dt>Persönlich</dt>
                  <dd className="text-right">
                    {form.firstName} {form.lastName}, {form.dateOfBirth},{' '}
                    {form.currentAddress}, {form.currentZip} {form.currentCity}
                    <button type="button" className="ml-2 text-teal-800 underline" onClick={() => setStep(1)}>
                      Bearbeiten
                    </button>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Beruf / Einkommen</dt>
                  <dd className="text-right">
                    {employmentLabelDe(form.employmentStatus)}
                    {needsEmployer && form.employer ? ` · ${form.employer}` : ''}
                    <br />
                    {summaryIncome}
                    <button type="button" className="ml-2 text-teal-800 underline" onClick={() => setStep(2)}>
                      Bearbeiten
                    </button>
                  </dd>
                </div>
              </dl>
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={confirmTruth}
                onChange={e => {
                  setConfirmTruth(e.target.checked)
                  setErrors(err => {
                    const n = { ...err }
                    delete n.confirmTruth
                    return n
                  })
                }}
                className="mt-1"
              />
              <span>Ich bestätige, dass alle Angaben wahrheitsgemäss sind. *</span>
            </label>
            {errors.confirmTruth ? <p className="text-xs text-red-600">{errors.confirmTruth}</p> : null}

            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? 'Speichern…' : 'Profil speichern'}
            </button>
          </div>
        ) : null}

        {step < 3 ? (
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              onClick={goBack}
              disabled={step === 1}
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-[#18a87c] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Weiter
            </button>
          </div>
        ) : (
          <div className="mt-8 flex justify-start">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={goBack}
            >
              Zurück
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
