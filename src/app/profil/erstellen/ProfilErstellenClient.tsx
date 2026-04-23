'use client'

import type { EmploymentStatus, HouseholdPets, IncomeCategory } from '@prisma/client'
import type { ProfilFormInitial } from '@/lib/tenant-profile/profil-form-initial'
import { SWISS_CANTONS } from '@/lib/swiss-cantons'
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
  { value: 'UNDER_3000', label: "Unter CHF 3'000" },
  { value: 'FROM_3000_TO_4000', label: "CHF 3'000 – 4'000" },
  { value: 'FROM_4000_TO_5500', label: "CHF 4'000 – 5'500" },
  { value: 'FROM_5500_TO_7000', label: "CHF 5'500 – 7'000" },
  { value: 'FROM_7000_TO_9000', label: "CHF 7'000 – 9'000" },
  { value: 'FROM_9000_TO_12000', label: "CHF 9'000 – 12'000" },
  { value: 'FROM_12000_TO_16000', label: "CHF 12'000 – 16'000" },
  { value: 'FROM_16000_TO_22000', label: "CHF 16'000 – 22'000" },
  { value: 'FROM_22000_TO_30000', label: "CHF 22'000 – 30'000" },
  { value: 'FROM_30000_TO_45000', label: "CHF 30'000 – 45'000" },
  { value: 'FROM_45000_TO_65000', label: "CHF 45'000 – 65'000" },
  { value: 'FROM_65000_TO_90000', label: "CHF 65'000 – 90'000" },
  { value: 'ABOVE_90000', label: "Über CHF 90'000" },
]

const PETS_OPTIONS: { value: HouseholdPets; label: string }[] = [
  { value: 'NONE', label: 'Keine Haustiere' },
  { value: 'HAS_PETS', label: 'Mit Haustieren' },
]

type Props = {
  mode: 'create' | 'edit'
  initial: ProfilFormInitial
  redirectAfterSave: string
  accountEmail: string
}

function contactPhoneDigitsOk(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

const OPTIONAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function minAge18(dobStr: string): boolean {
  const dob = new Date(dobStr)
  if (Number.isNaN(dob.getTime())) return false
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age >= 18
}

export function ProfilErstellenClient({ mode, initial, redirectAfterSave, accountEmail }: Props) {
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

  const setField = useCallback(<K extends keyof ProfilFormInitial>(key: K, value: ProfilFormInitial[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => {
      const n = { ...e }
      delete n[key as string]
      return n
    })
  }, [])

  const togglePreferredCanton = useCallback((code: string) => {
    setForm(f => {
      const has = f.preferredCantonCodes.includes(code)
      const preferredCantonCodes = has
        ? f.preferredCantonCodes.filter(c => c !== code)
        : [...f.preferredCantonCodes, code].sort()
      return { ...f, preferredCantonCodes }
    })
    setErrors(e => {
      const n = { ...e }
      delete n.preferredCanton
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
    if (!form.contactPhone.trim()) e.contactPhone = 'Telefonnummer ist erforderlich'
    else if (!contactPhoneDigitsOk(form.contactPhone)) {
      e.contactPhone = 'Bitte eine gültige Nummer (mind. 10 Ziffern, z. B. mit +41)'
    }
    const mail = form.applicationEmail.trim()
    if (!mail) e.applicationEmail = 'E-Mail ist erforderlich'
    else if (!OPTIONAL_EMAIL_RE.test(mail)) e.applicationEmail = 'Ungültige E-Mail-Adresse'
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
    const total = Number(form.householdTotalPersons.replace(/\D/g, '')) || 0
    const children = Number(String(form.householdChildrenCount).replace(/\D/g, '')) || 0
    if (!Number.isFinite(total) || total < 1 || total > 20) {
      e.householdTotalPersons = 'Bitte eine Zahl von 1 bis 20 (Personen inkl. dir)'
    }
    if (!Number.isFinite(children) || children < 0 || children > 20) {
      e.householdChildrenCount = 'Bitte eine Zahl von 0 bis 20'
    } else if (total >= 1 && children > total) {
      e.householdChildrenCount = 'Kinder können nicht mehr sein als Personen im Haushalt'
    } else if (total === 1 && children > 0) {
      e.householdChildrenCount = 'Bei einer Person sind 0 Kinder möglich'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = (): boolean => {
    const e: Record<string, string> = {}
    if (!confirmTruth) e.confirmTruth = 'Bitte bestätige die Richtigkeit deiner Angaben'
    if (form.preferredCantonCodes.length > 12) {
      e.preferredCanton = 'Maximal 12 Kantone auswählbar'
    }
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
        contactPhone: form.contactPhone.trim(),
        applicationEmail:
          form.applicationEmail.trim().toLowerCase() === accountEmail.trim().toLowerCase() ?
            null
          : form.applicationEmail.trim(),
        employmentStatus: form.employmentStatus,
        employer: needsEmployer ? form.employer.trim() : null,
        jobTitle: form.jobTitle.trim() || null,
        employedSinceYear: form.employedSinceYear ? Number(form.employedSinceYear) : null,
        employedSinceMonth: form.employedSinceMonth ? Number(form.employedSinceMonth) : null,
        monthlyIncomeCategory: form.monthlyIncomeCategory,
        householdTotalPersons: Number(form.householdTotalPersons.replace(/\D/g, '')) || 1,
        householdChildrenCount: Number(String(form.householdChildrenCount).replace(/\D/g, '')) || 0,
        declaresNonSmoker: form.declaresNonSmoker ? true : null,
        householdPets: form.householdPets,
        referenceName: form.referenceName.trim() || null,
        referencePhone: form.referencePhone.trim() || null,
        referenceRelation: form.referenceRelation.trim() || null,
        preferredCanton: form.preferredCantonCodes.length ? form.preferredCantonCodes.join(',') : null,
        preferredPostalCodes: form.preferredPostalCodes.trim() || null,
        preferredBudgetMin: form.preferredBudgetMin ? Number(form.preferredBudgetMin) : null,
        preferredBudgetMax: form.preferredBudgetMax ? Number(form.preferredBudgetMax) : null,
        preferredMinRooms: form.preferredMinRooms ? Number(form.preferredMinRooms) : null,
        preferredMaxRooms: form.preferredMaxRooms ? Number(form.preferredMaxRooms) : null,
        preferredMoveInEarliest: form.preferredMoveInEarliest || null,
        preferredMoveInLatest: form.preferredMoveInLatest || null,
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
  const summaryCantons = useMemo(() => {
    if (!form.preferredCantonCodes.length) return ''
    return form.preferredCantonCodes
      .map(code => {
        const n = SWISS_CANTONS.find(c => c.code === code)?.name
        return n ? `${code} (${n})` : code
      })
      .join(', ')
  }, [form.preferredCantonCodes])
  const summaryPetsLabel = PETS_OPTIONS.find(o => o.value === form.householdPets)?.label ?? 'Haustiere'
  const summaryTp = Number(form.householdTotalPersons)
  const summaryHouseholdPeople =
    Number.isFinite(summaryTp) && summaryTp >= 1 ?
      `${summaryTp} Person${summaryTp === 1 ? '' : 'en'}`
    : '—'
  const summaryTc = Number(String(form.householdChildrenCount).replace(/\D/g, ''))
  const summaryHouseholdChildren = `${Number.isFinite(summaryTc) ? summaryTc : 0} Kinder`

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        {mode === 'edit' ? 'Profil bearbeiten' : 'Mieterprofil erstellen'}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Mit einem vollständigen Profil kannst du dich auf Wohnungen bewerben — dein Einkommen erscheint nur als Kategorie.
      </p>

      <ol className="mt-8 flex max-w-md items-center justify-center gap-3 text-xs font-medium text-slate-500 sm:mx-auto sm:max-w-none sm:justify-between sm:gap-2 sm:text-sm">
        {[1, 2, 3].map(n => (
          <li key={n} className="flex flex-1 items-center gap-2 sm:min-w-0">
            <span
              className={
                step >= n
                  ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#18a87c] text-sm text-white sm:h-8 sm:w-8 sm:text-xs'
                  : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm sm:h-8 sm:w-8 sm:text-xs'
              }
            >
              {n}
            </span>
            <span className="hidden min-w-0 sm:inline">
              {n === 1 ? 'Persönlich' : n === 2 ? 'Beruf' : 'Referenz'}
            </span>
            {n < 3 ? <span className="hidden h-px min-w-[12px] flex-1 bg-slate-200 sm:block" aria-hidden /> : null}
          </li>
        ))}
      </ol>

      {errors._form ? <p className="mt-4 text-[13px] text-red-600">{errors._form}</p> : null}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Schritt 1 — Persönliche Angaben</h2>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Vorname *</label>
              <input
                className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                value={form.firstName}
                onChange={e => setField('firstName', e.target.value)}
              />
              {errors.firstName ? <p className="mt-1 text-[13px] text-red-600">{errors.firstName}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Nachname *</label>
              <input
                className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                value={form.lastName}
                onChange={e => setField('lastName', e.target.value)}
              />
              {errors.lastName ? <p className="mt-1 text-[13px] text-red-600">{errors.lastName}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Geburtsdatum *</label>
              <input
                type="date"
                className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                value={form.dateOfBirth}
                onChange={e => setField('dateOfBirth', e.target.value)}
              />
              {errors.dateOfBirth ? <p className="mt-1 text-[13px] text-red-600">{errors.dateOfBirth}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Aktuelle Strasse und Hausnummer *</label>
              <input
                className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                value={form.currentAddress}
                onChange={e => setField('currentAddress', e.target.value)}
              />
              {errors.currentAddress ? <p className="mt-1 text-[13px] text-red-600">{errors.currentAddress}</p> : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-slate-700">PLZ (Schweiz) *</label>
                <input
                  inputMode="numeric"
                  maxLength={4}
                  className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                  value={form.currentZip}
                  onChange={e => setField('currentZip', e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                {errors.currentZip ? <p className="mt-1 text-[13px] text-red-600">{errors.currentZip}</p> : null}
              </div>
              <div>
                <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Ort *</label>
                <input
                  className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                  value={form.currentCity}
                  onChange={e => setField('currentCity', e.target.value)}
                />
                {errors.currentCity ? <p className="mt-1 text-[13px] text-red-600">{errors.currentCity}</p> : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="text-sm font-bold text-slate-900">Erreichbarkeit für Vermieter</h3>
              <p className="mt-1 text-xs text-slate-600">
                Standardmässig deine Login-E-Mail — du kannst sie bei Bedarf für Bewerbungen anpassen.
              </p>
              <div className="mt-3">
                <label className="mb-1.5 block text-[14px] font-medium text-slate-700">E-Mail *</label>
                <input
                  type="email"
                  autoComplete="email"
                  className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                  value={form.applicationEmail}
                  onChange={e => setField('applicationEmail', e.target.value)}
                />
                {errors.applicationEmail ? (
                  <p className="mt-1 text-[13px] text-red-600">{errors.applicationEmail}</p>
                ) : null}
              </div>
              <div className="mt-3">
                <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Telefonnummer *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="z. B. +41 79 123 45 67"
                  className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                  value={form.contactPhone}
                  onChange={e => setField('contactPhone', e.target.value)}
                />
                {errors.contactPhone ? <p className="mt-1 text-[13px] text-red-600">{errors.contactPhone}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Schritt 2 — Beschäftigung &amp; Einkommen</h2>
            <fieldset>
              <legend className="text-[14px] font-medium text-slate-700">Beschäftigungsstatus *</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {EMPLOYMENT_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm md:min-h-0 ${
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
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Arbeitgeber / Firma *</label>
                  <input
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.employer}
                    onChange={e => setField('employer', e.target.value)}
                  />
                  {errors.employer ? <p className="mt-1 text-[13px] text-red-600">{errors.employer}</p> : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Berufsbezeichnung (optional)</label>
                  <input
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.jobTitle}
                    onChange={e => setField('jobTitle', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Angestellt seit — Monat (optional)</label>
                    <select
                      className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
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
                    <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Angestellt seit — Jahr (optional)</label>
                    <select
                      className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
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
                  <p className="text-[13px] text-red-600">{errors.employedSinceMonth}</p>
                ) : null}
              </>
            ) : null}

            <div>
              <label className="mb-1.5 block text-[14px] font-medium text-slate-700">
                Monatliches Nettoeinkommen des gesamten Haushalts *
              </label>
              <p className="mt-0 text-xs text-slate-500">
                Bitte die Summe aller regelmässigen Nettoeinkommen im Haushalt wählen (alle berufstätigen oder
                anderweitig einkommensbezogenen Personen zusammengezählt), realistisch inkl. Zulagen; 13.
                Monatslohn anteilig mitdenken.
              </p>
              <select
                className="mt-2 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
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

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="text-sm font-bold text-slate-900">Haushalt</h3>
              <p className="mt-1 text-xs text-slate-600">
                «1 Person» bedeutet: du lebst allein. Kinder zählen als eigene Personen im Haushalt.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">
                    Personen im Haushalt (inkl. dir) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.householdTotalPersons}
                    onChange={e => setField('householdTotalPersons', e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                  />
                  {errors.householdTotalPersons ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.householdTotalPersons}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Kinder im Haushalt *</label>
                  <p className="text-xs text-slate-500">Anzahl minderjähriger Kinder, die mit bei dir wohnen (0 wenn keine).</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={20}
                    className="mt-2 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.householdChildrenCount}
                    onChange={e => setField('householdChildrenCount', e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                  />
                  {errors.householdChildrenCount ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.householdChildrenCount}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900">
              🔒 Dein genaues Einkommen wird nie angezeigt — Vermieter sehen nur die Kategorie.
            </div>

            <fieldset className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-[14px] font-medium text-slate-700">Rauchen &amp; Haustiere (optional)</legend>
              <label className="mt-1 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={form.declaresNonSmoker}
                  onChange={e => setField('declaresNonSmoker', e.target.checked)}
                  className="mt-1"
                />
                <span>Ich rauche nicht</span>
              </label>
              <div className="mt-4">
                <span className="text-[14px] font-medium text-slate-700">Haustiere</span>
                <div className="mt-2 space-y-2">
                  {PETS_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        form.householdPets === opt.value ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="householdPets"
                        className="sr-only"
                        checked={form.householdPets === opt.value}
                        onChange={() => setField('householdPets', opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Schritt 3 — Referenz &amp; Kontrolle</h2>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-[14px] font-medium text-slate-700">
                Referenz (optional)
                <span className="cursor-help text-slate-400" title="Eine frühere Vermieter-Referenz erhöht deine Chancen erheblich">
                  (?)
                </span>
              </label>
              <input
                className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                placeholder="Name der Referenzperson"
                value={form.referenceName}
                onChange={e => setField('referenceName', e.target.value)}
              />
              <input
                className="mt-2 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                placeholder="Telefonnummer"
                value={form.referencePhone}
                onChange={e => setField('referencePhone', e.target.value)}
              />
              <input
                className="mt-2 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                placeholder='Beziehung (z.B. "Frühere Vermieterin")'
                value={form.referenceRelation}
                onChange={e => setField('referenceRelation', e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">Suchpräferenzen (optional)</h3>
              <p className="mt-1 text-xs text-slate-600">
                Diese Angaben verbessern deine Empfehlungen und Lead-Qualität, sind aber nicht verpflichtend.
              </p>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Bevorzugte Kantone (optional)</label>
                  <p className="text-xs text-slate-500">Mehrfachauswahl möglich — leer lassen, wenn egal.</p>
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:max-h-none sm:overflow-visible">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {SWISS_CANTONS.map(c => {
                        const checked = form.preferredCantonCodes.includes(c.code)
                        return (
                          <label
                            key={c.code}
                            className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs sm:text-[13px] ${
                              checked ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePreferredCanton(c.code)}
                              className="shrink-0"
                            />
                            <span className="min-w-0 truncate">
                              {c.code} — {c.name}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  {errors.preferredCanton ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredCanton}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">PLZ-Wünsche (kommagetrennt)</label>
                  <input
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    placeholder="z. B. 8001, 8004"
                    value={form.preferredPostalCodes}
                    onChange={e => setField('preferredPostalCodes', e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Budget min. (CHF)</label>
                  <input
                    inputMode="numeric"
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.preferredBudgetMin}
                    onChange={e => setField('preferredBudgetMin', e.target.value.replace(/[^\d]/g, ''))}
                  />
                  {errors.preferredBudgetMin ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredBudgetMin}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Budget max. (CHF)</label>
                  <input
                    inputMode="numeric"
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.preferredBudgetMax}
                    onChange={e => setField('preferredBudgetMax', e.target.value.replace(/[^\d]/g, ''))}
                  />
                  {errors.preferredBudgetMax ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredBudgetMax}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Zimmer min.</label>
                  <input
                    inputMode="decimal"
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.preferredMinRooms}
                    onChange={e => setField('preferredMinRooms', e.target.value.replace(',', '.'))}
                  />
                  {errors.preferredMinRooms ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredMinRooms}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Zimmer max.</label>
                  <input
                    inputMode="decimal"
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.preferredMaxRooms}
                    onChange={e => setField('preferredMaxRooms', e.target.value.replace(',', '.'))}
                  />
                  {errors.preferredMaxRooms ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredMaxRooms}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Einzug frühestens</label>
                  <input
                    type="date"
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.preferredMoveInEarliest}
                    onChange={e => setField('preferredMoveInEarliest', e.target.value)}
                  />
                  {errors.preferredMoveInEarliest ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredMoveInEarliest}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-[14px] font-medium text-slate-700">Einzug spätestens</label>
                  <input
                    type="date"
                    className="mt-0 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base md:min-h-0 md:text-sm"
                    value={form.preferredMoveInLatest}
                    onChange={e => setField('preferredMoveInLatest', e.target.value)}
                  />
                  {errors.preferredMoveInLatest ? (
                    <p className="mt-1 text-[13px] text-red-600">{errors.preferredMoveInLatest}</p>
                  ) : null}
                </div>
              </div>
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
                  <dt>Kontakt</dt>
                  <dd className="text-right">
                    <span className="text-slate-600">Tel.</span> {form.contactPhone}
                    <br />
                    <span className="text-slate-600">E-Mail</span> {form.applicationEmail.trim()}
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
                    <span className="text-slate-600">Haushalt (Kategorie):</span> {summaryIncome}
                    <button type="button" className="ml-2 text-teal-800 underline" onClick={() => setStep(2)}>
                      Bearbeiten
                    </button>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Haushalt</dt>
                  <dd className="text-right">
                    {summaryHouseholdPeople}, {summaryHouseholdChildren}
                    <br />
                    {form.declaresNonSmoker ? <span>Nichtraucher</span> : null}
                    {form.declaresNonSmoker ? <br /> : null}
                    <span>{summaryPetsLabel}</span>
                    <button type="button" className="ml-2 text-teal-800 underline" onClick={() => setStep(2)}>
                      Bearbeiten
                    </button>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Suchfokus</dt>
                  <dd className="text-right">
                    {summaryCantons ? <span>Kantone: {summaryCantons}</span> : <span className="text-slate-500">Keine Kantone</span>}
                    <button type="button" className="ml-2 text-teal-800 underline" onClick={() => setStep(3)}>
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
            {errors.confirmTruth ? <p className="text-[13px] text-red-600">{errors.confirmTruth}</p> : null}

            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="min-h-[52px] w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? 'Speichern…' : 'Profil speichern'}
            </button>
          </div>
        ) : null}

        {step < 3 ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goNext}
              className="order-1 min-h-[52px] w-full rounded-lg bg-[#18a87c] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 sm:order-2 sm:w-auto sm:px-6"
            >
              Weiter
            </button>
            <button
              type="button"
              className="order-2 min-h-[52px] w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:order-1 sm:w-auto sm:px-6"
              onClick={goBack}
              disabled={step === 1}
            >
              Zurück
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button
              type="button"
              className="min-h-[52px] w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
              onClick={goBack}
            >
              Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
