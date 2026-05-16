'use client'

import { CustomDropdown, type DropdownOption } from '@/components/profil/CustomDropdown'
import { OptionCard } from '@/components/profil/OptionCard'
import { StepperBar } from '@/components/profil/StepperBar'
import { StepperInput } from '@/components/profil/StepperInput'
import { Toggle } from '@/components/profil/Toggle'
import type { ProfilFormInitial } from '@/lib/tenant-profile/profil-form-initial'
import { employmentLabelDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import type { EmploymentStatus, HouseholdPets, IncomeCategory } from '@prisma/client'
import { dispatchWohnenNavRefresh } from '@/lib/wohnen-nav-refresh'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const INPUT_CLASS =
  'h-14 min-h-[56px] w-full rounded-[14px] border-[1.5px] border-[#e8e8e8] bg-white px-5 text-base font-medium text-[#0d2b1f] shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:font-normal placeholder:text-[#c0c0c0] focus:border-[#18a87c] focus:shadow-[0_0_0_4px_rgba(24,168,124,0.1)]'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPLOYMENT: { status: EmploymentStatus; label: string }[] = [
  { status: 'EMPLOYED', label: 'Angestellt' },
  { status: 'SELF_EMPLOYED', label: 'Selbständig' },
  { status: 'STUDENT', label: 'Student/in' },
  { status: 'RETIRED', label: 'Pensioniert' },
  { status: 'UNEMPLOYED', label: 'Stellensuchend' },
  { status: 'OTHER', label: 'Andere' },
]

const INCOME_CHOICES: { id: string; label: string; category: IncomeCategory }[] = [
  { id: 'i1', label: "Unter CHF 2'000 / Monat", category: 'UNDER_2000' },
  { id: 'i2', label: "CHF 2'000 – 3'000 / Monat", category: 'FROM_2000_TO_3000' },
  { id: 'i3', label: "CHF 3'000 – 4'000 / Monat", category: 'FROM_3000_TO_4000' },
  { id: 'i4', label: "CHF 4'000 – 5'000 / Monat", category: 'FROM_4000_TO_5000' },
  { id: 'i5', label: "CHF 5'000 – 7'000 / Monat", category: 'FROM_5000_TO_7000' },
  { id: 'i6', label: "CHF 7'000 – 9'000 / Monat", category: 'FROM_7000_TO_9000' },
  { id: 'i7', label: "CHF 9'000 – 12'000 / Monat", category: 'FROM_9000_TO_12000' },
  { id: 'i8', label: "CHF 12'000 – 15'000 / Monat", category: 'FROM_12000_TO_15000' },
  { id: 'i9', label: "CHF 15'000 – 20'000 / Monat", category: 'FROM_15000_TO_20000' },
  { id: 'i10', label: "CHF 20'000 – 30'000 / Monat", category: 'FROM_20000_TO_30000' },
  { id: 'i11', label: "CHF 30'000 – 50'000 / Monat", category: 'FROM_30000_TO_50000' },
  { id: 'i12', label: "Über CHF 50'000 / Monat", category: 'ABOVE_50000' },
]

const ONBOARDING_STEP_TITLES = [
  'Persönliches',
  'Geburtsdatum',
  'Adresse',
  'Kontakt',
  'Beruf',
  'Einkommen',
  'Haushalt',
  'Referenz',
  'Prüfen',
] as const

/** Legacy DB-Werte auf die neue Onboarding-Auswahl abbilden. */
function incomeChoiceIdFromStoredCategory(cat: IncomeCategory): string {
  const direct = INCOME_CHOICES.find(c => c.category === cat)?.id
  if (direct) return direct
  const legacy: Partial<Record<IncomeCategory, string>> = {
    UNDER_3000: 'i1',
    FROM_4000_TO_5500: 'i4',
    FROM_5500_TO_7000: 'i5',
    FROM_12000_TO_16000: 'i8',
    FROM_16000_TO_22000: 'i9',
    FROM_22000_TO_30000: 'i10',
    FROM_30000_TO_45000: 'i11',
    FROM_45000_TO_65000: 'i11',
    FROM_65000_TO_90000: 'i12',
    ABOVE_90000: 'i12',
  }
  return legacy[cat] ?? 'i4'
}

const MONTH_OPTS: DropdownOption<string>[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString('de-CH', { month: 'long' }),
}))

function yearOpts(): DropdownOption<string>[] {
  const y = new Date().getFullYear()
  return Array.from({ length: 46 }, (_, i) => {
    const yr = String(y - i)
    return { value: yr, label: yr }
  })
}

function isoYmdToDisplay(ymd: string): string {
  if (!ymd) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

function parseSwissDob(s: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim())
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2]) - 1
  const y = Number(m[3])
  const dt = new Date(y, mo, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

function dobIsoFromDisplay(s: string): string | null {
  const dt = parseSwissDob(s)
  if (!dt) return null
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

function minAge18(dt: Date): boolean {
  const now = new Date()
  let age = now.getFullYear() - dt.getFullYear()
  const m = now.getMonth() - dt.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dt.getDate())) age -= 1
  return age >= 18
}

function phoneOk(raw: string): boolean {
  const d = raw.replace(/\D/g, '')
  return d.length >= 10 && d.length <= 15
}

function incomeLabelByCategory(c: IncomeCategory): string {
  const hit = INCOME_CHOICES.find(x => x.category === c)
  if (hit) return hit.label
  return incomeCategoryLabelDe(c)
}

type Props = {
  mode: 'create' | 'edit'
  accountEmail: string
  redirectAfterSave: string
  initial: ProfilFormInitial
}

type FormState = {
  firstName: string
  lastName: string
  dateDisplay: string
  currentAddress: string
  currentZip: string
  currentCity: string
  applicationEmail: string
  contactPhone: string
  employmentStatus: EmploymentStatus | ''
  employer: string
  jobTitle: string
  employedSinceMonth: string
  employedSinceYear: string
  incomeChoiceId: string
  householdTotalPersons: number
  householdChildrenCount: number
  smokes: boolean
  hasPets: boolean
  referenceName: string
  referencePhone: string
  referenceRelation: string
  confirmTruth: boolean
}

function initialFromProfil(p: ProfilFormInitial, accountEmail: string): FormState {
  const dob =
    p.dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(p.dateOfBirth) ? isoYmdToDisplay(p.dateOfBirth) : ''
  const inc = incomeChoiceIdFromStoredCategory(p.monthlyIncomeCategory as IncomeCategory)
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dateDisplay: dob,
    currentAddress: p.currentAddress,
    currentZip: p.currentZip,
    currentCity: p.currentCity,
    applicationEmail: p.applicationEmail || accountEmail,
    contactPhone: p.contactPhone,
    employmentStatus: p.employmentStatus,
    employer: p.employer,
    jobTitle: p.jobTitle,
    employedSinceMonth: p.employedSinceMonth,
    employedSinceYear: p.employedSinceYear,
    incomeChoiceId: inc,
    householdTotalPersons: Math.min(20, Math.max(1, Number(p.householdTotalPersons) || 1)),
    householdChildrenCount: Math.min(20, Math.max(0, Number(p.householdChildrenCount) || 0)),
    smokes: p.declaresNonSmoker === false,
    hasPets: p.householdPets === 'HAS_PETS',
    referenceName: p.referenceName,
    referencePhone: p.referencePhone,
    referenceRelation: p.referenceRelation,
    confirmTruth: false,
  }
}

export function OnboardingFlow({ mode, accountEmail, redirectAfterSave, initial }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [form, setForm] = useState<FormState>(() => initialFromProfil(initial, accountEmail))
  const [dobError, setDobError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const firstFieldRef = useRef<HTMLElement | null>(null)
  const employerFieldRef = useRef<HTMLInputElement | null>(null)

  const prefs = useMemo(
    () => ({
      preferredCanton: initial.preferredCantonCodes.length ? initial.preferredCantonCodes.join(',') : null,
      preferredPostalCodes: initial.preferredPostalCodes.trim() || null,
      preferredBudgetMin: initial.preferredBudgetMin ? Number(initial.preferredBudgetMin) : null,
      preferredBudgetMax: initial.preferredBudgetMax ? Number(initial.preferredBudgetMax) : null,
      preferredMinRooms: initial.preferredMinRooms ? Number(initial.preferredMinRooms) : null,
      preferredMaxRooms: initial.preferredMaxRooms ? Number(initial.preferredMaxRooms) : null,
      preferredMoveInEarliest: initial.preferredMoveInEarliest || null,
      preferredMoveInLatest: initial.preferredMoveInLatest || null,
    }),
    [initial]
  )

  const totalSteps = 9

  const incomeCategory = useMemo(() => {
    const hit = INCOME_CHOICES.find(i => i.id === form.incomeChoiceId)
    return hit?.category ?? ('FROM_4000_TO_5000' as IncomeCategory)
  }, [form.incomeChoiceId])

  const needsEmployer = form.employmentStatus === 'EMPLOYED' || form.employmentStatus === 'SELF_EMPLOYED'

  const goStep = useCallback((target: number, direction: 'fwd' | 'back') => {
    setDir(direction)
    setStep(target)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (step === 5 && needsEmployer) employerFieldRef.current?.focus()
      else firstFieldRef.current?.focus()
    }, 180)
    return () => window.clearTimeout(t)
  }, [step, needsEmployer])

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(form.firstName.trim() && form.lastName.trim())
      case 2: {
        const dt = parseSwissDob(form.dateDisplay)
        return Boolean(dt && minAge18(dt))
      }
      case 3:
        return Boolean(form.currentAddress.trim() && /^\d{4}$/.test(form.currentZip.trim()) && form.currentCity.trim())
      case 4: {
        const mail = form.applicationEmail.trim()
        return Boolean(EMAIL_RE.test(mail) && phoneOk(form.contactPhone))
      }
      case 5:
        if (!form.employmentStatus) return false
        if (needsEmployer && !form.employer.trim()) return false
        return true
      case 6:
        return Boolean(form.incomeChoiceId)
      case 7:
        return form.householdTotalPersons >= 1 && form.householdTotalPersons <= 20 && form.householdChildrenCount >= 0 && form.householdChildrenCount <= 20
      case 8:
        return true
      case 9:
        return form.confirmTruth
      default:
        return false
    }
  }, [step, form, needsEmployer])

  const optionalStep = step === 8

  const onBack = () => {
    if (step <= 1) {
      router.push('/profil')
      return
    }
    goStep(step - 1, 'back')
  }

  const onSkip = () => {
    if (step === 8) goStep(9, 'fwd')
  }

  const onNext = () => {
    if (step === 2) {
      const dt = parseSwissDob(form.dateDisplay)
      if (!dt) {
        setDobError('Bitte Datum im Format TT.MM.JJJJ eingeben.')
        return
      }
      if (!minAge18(dt)) {
        setDobError('Du musst mindestens 18 Jahre alt sein.')
        return
      }
      setDobError('')
    }
    if (!stepValid) return
    if (step < totalSteps) goStep(step + 1, 'fwd')
  }

  const buildApiBody = () => {
    const dobIso = dobIsoFromDisplay(form.dateDisplay)
    if (!dobIso) throw new Error('dob')
    const appMail = form.applicationEmail.trim()
    const applicationEmail =
      appMail.toLowerCase() === accountEmail.trim().toLowerCase() ? null : appMail
    const declaresNonSmoker = form.smokes ? null : true
    const householdPets: HouseholdPets = form.hasPets ? 'HAS_PETS' : 'NONE'
    let ey = form.employedSinceYear ? Number(form.employedSinceYear) : null
    let em = form.employedSinceMonth ? Number(form.employedSinceMonth) : null
    if ((ey != null) !== (em != null)) {
      ey = null
      em = null
    }
    return {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dateOfBirth: dobIso,
      currentAddress: form.currentAddress.trim(),
      currentZip: form.currentZip.trim(),
      currentCity: form.currentCity.trim(),
      contactPhone: form.contactPhone.trim(),
      applicationEmail,
      employmentStatus: form.employmentStatus as EmploymentStatus,
      employer: needsEmployer ? form.employer.trim() : null,
      jobTitle: form.jobTitle.trim() || null,
      employedSinceYear: ey,
      employedSinceMonth: em,
      monthlyIncomeCategory: incomeCategory,
      householdTotalPersons: form.householdTotalPersons,
      householdChildrenCount: form.householdChildrenCount,
      declaresNonSmoker,
      householdPets,
      referenceName: form.referenceName.trim() || null,
      referencePhone: form.referencePhone.trim() || null,
      referenceRelation: form.referenceRelation.trim() || null,
      preferredCanton: prefs.preferredCanton,
      preferredPostalCodes: prefs.preferredPostalCodes,
      preferredBudgetMin: prefs.preferredBudgetMin,
      preferredBudgetMax: prefs.preferredBudgetMax,
      preferredMinRooms: prefs.preferredMinRooms,
      preferredMaxRooms: prefs.preferredMaxRooms,
      preferredMoveInEarliest: prefs.preferredMoveInEarliest,
      preferredMoveInLatest: prefs.preferredMoveInLatest,
    }
  }

  const onSubmit = async () => {
    if (!form.confirmTruth) return
    setSubmitting(true)
    try {
      const body = buildApiBody()
      const url = mode === 'create' ? '/api/tenant-profile' : '/api/tenant-profile'
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert((data as { message?: string }).message || 'Speichern fehlgeschlagen')
        return
      }
      const base = mode === 'create' ? redirectAfterSave : '/profil'
      const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'https://wohnen.helvenda.ch')
      u.searchParams.set('onboarding', 'complete')
      dispatchWohnenNavRefresh()
      router.push(u.pathname + u.search)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const summaryRows = useMemo(() => {
    const dt = parseSwissDob(form.dateDisplay)
    const dobStr = dt ? dt.toLocaleDateString('de-CH') : '—'
    const addr = `${form.currentAddress.trim()}, ${form.currentZip.trim()} ${form.currentCity.trim()}`
    const mail = form.applicationEmail.trim()
    const tel = form.contactPhone.trim()
    const emp = form.employmentStatus ?
      `${employmentLabelDe(form.employmentStatus)}${needsEmployer && form.employer.trim() ? ` · ${form.employer.trim()}` : ''}`
    : '—'
    const inc = incomeLabelByCategory(incomeCategory)
    const pc = form.householdTotalPersons
    const kc = form.householdChildrenCount
    const personText = pc === 1 ? '1 Person' : `${pc} Personen`
    const kinderText = kc === 0 ? 'keine Kinder' : kc === 1 ? '1 Kind' : `${kc} Kinder`
    const rauchText = form.smokes ? 'Raucher/in' : 'Nichtraucher/in'
    const tierText = form.hasPets ? 'mit Haustieren' : 'keine Haustiere'
    const hh = `${personText} · ${kinderText} · ${rauchText} · ${tierText}`
    const ref =
      form.referenceName.trim() || form.referencePhone.trim() || form.referenceRelation.trim() ?
        [
          form.referenceName.trim() || null,
          form.referenceRelation.trim() || null,
          form.referencePhone.trim() || null,
        ]
          .filter(Boolean)
          .join(' · ')
      : '—'
    return [
      { key: 1, label: 'Name', value: `${form.firstName.trim()} ${form.lastName.trim()}`.trim() },
      { key: 2, label: 'Geburtsdatum', value: dobStr },
      { key: 3, label: 'Adresse', value: addr },
      { key: 4, label: 'Kontakt', value: `${mail}\n${tel}`.trim() },
      { key: 5, label: 'Beschäftigung', value: emp },
      { key: 6, label: 'Einkommen', value: inc },
      { key: 7, label: 'Haushalt', value: hh },
      { key: 8, label: 'Referenz', value: ref },
    ]
  }, [form, incomeCategory, needsEmployer])

  const slideClass =
    dir === 'fwd' ? 'animate-[onbInFwd_0.25s_ease_0.1s_both]' : 'animate-[onbInBack_0.25s_ease_0.1s_both]'

  const stepTitle = ONBOARDING_STEP_TITLES[step - 1] ?? ''

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white text-[#0d2b1f]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes onbInFwd {
            from { opacity: 0; transform: translateX(40px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes onbInBack {
            from { opacity: 0; transform: translateX(-40px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `,
        }}
      />
      <StepperBar current={step} total={totalSteps} stepTitle={stepTitle} onBack={onBack} disableBack={false} />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[calc(6.25rem+env(safe-area-inset-top,0px))] sm:px-6">
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center py-6 sm:py-10">
          <div key={step} className={`w-full ${slideClass}`}>
            {step === 1 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">
                  Persönliche Angaben
                </p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Wie heisst du?
                </h1>
                <div className="mt-10 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-3">
                  <input
                    ref={el => {
                      firstFieldRef.current = el
                    }}
                    className={INPUT_CLASS}
                    placeholder="Vorname"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    autoComplete="given-name"
                  />
                  <input
                    className={INPUT_CLASS}
                    placeholder="Nachname"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    autoComplete="family-name"
                  />
                </div>
              </>
            : null}

            {step === 2 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Geburtsdatum</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Wann wurdest du geboren?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[#8aa89e]">Du musst mindestens 18 Jahre alt sein.</p>
                <div className="mt-10">
                  <input
                    ref={el => {
                      firstFieldRef.current = el
                    }}
                    className={INPUT_CLASS}
                    placeholder="TT.MM.JJJJ"
                    inputMode="numeric"
                    value={form.dateDisplay}
                    onChange={e => {
                      setDobError('')
                      setForm(f => ({ ...f, dateDisplay: e.target.value }))
                    }}
                    autoComplete="bday"
                  />
                  {dobError ?
                    <p className="mt-2 text-[13px] text-[#e84040]">{dobError}</p>
                  : null}
                </div>
              </>
            : null}

            {step === 3 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Dein Wohnort</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Wo wohnst du aktuell?
                </h1>
                <div className="mt-10 flex flex-col gap-4">
                  <input
                    ref={el => {
                      firstFieldRef.current = el
                    }}
                    className={INPUT_CLASS}
                    placeholder="Strasse und Hausnummer"
                    value={form.currentAddress}
                    onChange={e => setForm(f => ({ ...f, currentAddress: e.target.value }))}
                    autoComplete="street-address"
                  />
                  <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:items-start">
                    <input
                      className={INPUT_CLASS}
                      placeholder="PLZ"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.currentZip}
                      onChange={e => setForm(f => ({ ...f, currentZip: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    />
                    <input
                      className={INPUT_CLASS}
                      placeholder="Ort"
                      value={form.currentCity}
                      onChange={e => setForm(f => ({ ...f, currentCity: e.target.value }))}
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
              </>
            : null}

            {step === 4 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Erreichbarkeit</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Wie können Vermieter dich kontaktieren?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[#8aa89e]">
                  So meldet sich der Vermieter nach deiner Bewerbung bei dir.
                </p>
                <div className="mt-10 flex flex-col gap-5">
                  <input
                    ref={el => {
                      firstFieldRef.current = el
                    }}
                    type="email"
                    className={INPUT_CLASS}
                    placeholder="E-Mail"
                    value={form.applicationEmail}
                    onChange={e => setForm(f => ({ ...f, applicationEmail: e.target.value }))}
                    autoComplete="email"
                  />
                  <input
                    className={INPUT_CLASS}
                    placeholder="Telefonnummer"
                    inputMode="tel"
                    value={form.contactPhone}
                    onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                    autoComplete="tel"
                  />
                </div>
              </>
            : null}

            {step === 5 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Deine Situation</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Was beschreibt dich am besten?
                </h1>
                <div className="mt-10 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                  {EMPLOYMENT.map((row, idx) => (
                    <OptionCard
                      key={row.status}
                      ref={
                        idx === 0 ?
                          el => {
                            firstFieldRef.current = el
                          }
                        : undefined
                      }
                      label={row.label}
                      selected={form.employmentStatus === row.status}
                      onClick={() => setForm(f => ({ ...f, employmentStatus: row.status }))}
                    />
                  ))}
                </div>
                {needsEmployer ?
                  <div className="mt-10 flex max-h-[600px] flex-col gap-5 overflow-visible border-0 opacity-100 transition-all duration-300">
                    <input
                      ref={employerFieldRef}
                      className={INPUT_CLASS}
                      placeholder="Arbeitgeber / Firma"
                      value={form.employer}
                      onChange={e => setForm(f => ({ ...f, employer: e.target.value }))}
                    />
                    <input
                      className={INPUT_CLASS}
                      placeholder="Berufsbezeichnung (optional)"
                      value={form.jobTitle}
                      onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                    />
                    <div>
                      <p className="mb-3 text-[13px] font-medium text-[#8aa89e]">Angestellt seit (optional)</p>
                      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                        <CustomDropdown
                          value={form.employedSinceMonth}
                          options={MONTH_OPTS}
                          onChange={v => setForm(f => ({ ...f, employedSinceMonth: v }))}
                          placeholder="Monat"
                        />
                        <CustomDropdown
                          value={form.employedSinceYear}
                          options={yearOpts()}
                          onChange={v => setForm(f => ({ ...f, employedSinceYear: v }))}
                          placeholder="Jahr"
                        />
                      </div>
                    </div>
                  </div>
                : null}
              </>
            : null}

            {step === 6 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Einkommen</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Wie hoch ist das monatliche Nettoeinkommen deines Haushalts?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[#8aa89e]">
                  Summe aus Löhnen, Renten und weiteren regelmässigen Nettoeinkünften aller Personen im Haushalt — in
                  Schweizer Franken <strong>pro Monat</strong>. Auch sehr hohe Haushaltseinkommen sind in der letzten
                  Kategorie erfasst. Vermieter sehen nur die <strong>Kategorie</strong>, nie den genauen Betrag.
                </p>
                <div className="mt-10">
                  <CustomDropdown
                    id="income-dd"
                    buttonRef={el => {
                      firstFieldRef.current = el
                    }}
                    value={form.incomeChoiceId}
                    options={INCOME_CHOICES.map(c => ({ value: c.id, label: c.label }))}
                    onChange={v => setForm(f => ({ ...f, incomeChoiceId: v }))}
                    placeholder="Kategorie wählen"
                  />
                  <p className="mt-4 flex items-center gap-2 text-[12px] text-[#8aa89e]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 2L4 7v5c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V7l-8-5z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    Nur die Kategorie wird angezeigt.
                  </p>
                </div>
              </>
            : null}

            {step === 7 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Dein Haushalt</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Wer wohnt mit dir?
                </h1>
                <div className="mt-10 flex flex-col gap-8 min-[480px]:flex-row min-[480px]:gap-12">
                  <StepperInput
                    ref={el => {
                      firstFieldRef.current = el
                    }}
                    label="Personen (inkl. dir)"
                    value={form.householdTotalPersons}
                    min={1}
                    max={20}
                    onChange={n => setForm(f => ({ ...f, householdTotalPersons: n }))}
                  />
                  <StepperInput
                    label="Kinder"
                    value={form.householdChildrenCount}
                    min={0}
                    max={20}
                    onChange={n => setForm(f => ({ ...f, householdChildrenCount: n }))}
                  />
                </div>
                <div className="mt-12 w-full">
                  <Toggle id="smoke" label="Ich rauche" checked={form.smokes} onChange={v => setForm(f => ({ ...f, smokes: v }))} />
                  <Toggle
                    id="pets"
                    label="Ich habe Haustiere"
                    checked={form.hasPets}
                    onChange={v => setForm(f => ({ ...f, hasPets: v }))}
                  />
                </div>
              </>
            : null}

            {step === 8 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Referenz</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">
                  Hast du eine frühere Vermieter-Referenz?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[#8aa89e]">Optional — erhöht deine Chancen erheblich.</p>
                <div className="mt-10 flex flex-col gap-6">
                  <input
                    ref={el => {
                      firstFieldRef.current = el
                    }}
                    className={INPUT_CLASS}
                    placeholder="Name der Referenzperson"
                    value={form.referenceName}
                    onChange={e => setForm(f => ({ ...f, referenceName: e.target.value }))}
                  />
                  <input
                    className={INPUT_CLASS}
                    placeholder="Telefon oder E-Mail der Person"
                    value={form.referencePhone}
                    onChange={e => setForm(f => ({ ...f, referencePhone: e.target.value }))}
                  />
                  <div>
                    <label htmlFor="ref-relation" className="mb-2 block text-[13px] font-medium text-[#5a7a6e]">
                      Bezug zur Person
                    </label>
                    <input
                      id="ref-relation"
                      className={INPUT_CLASS}
                      placeholder="z. B. frühere Vermieterin, Arbeitgeberin, WG-Mitbewohner"
                      value={form.referenceRelation}
                      onChange={e => setForm(f => ({ ...f, referenceRelation: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            : null}

            {step === 9 ?
              <>
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#18a87c]">Fast fertig</p>
                <h1 className="mt-4 text-[26px] font-extrabold leading-[1.2] text-[#0d2b1f] sm:text-[32px]">Stimmt alles?</h1>
                <p className="mt-3 text-[15px] leading-relaxed text-[#8aa89e]">
                  Überprüfe deine Angaben bevor du speicherst.
                </p>
                <div className="mt-10 w-full">
                  {summaryRows.map(row => (
                    <div
                      key={row.key}
                      className="flex flex-col gap-2 border-b border-[#f0f0f0] py-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:gap-4"
                    >
                      <span className="min-w-[7.5rem] shrink-0 text-[13px] font-semibold text-[#5a7a6e]">{row.label}</span>
                      <div className="flex min-w-0 flex-1 flex-col gap-2 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between min-[520px]:gap-3">
                        <span className="min-w-0 flex-1 whitespace-pre-line text-[14px] font-medium leading-snug text-[#0d2b1f]">
                          {row.value}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 self-start rounded-lg px-0 py-1 text-left text-[13px] font-semibold text-[#18a87c] underline decoration-[#18a87c]/40 underline-offset-2 hover:decoration-[#18a87c] min-[520px]:self-center min-[520px]:px-2 min-[520px]:py-1.5 min-[520px]:no-underline min-[520px]:hover:bg-[#f0faf7]"
                          onClick={() => goStep(row.key, 'back')}
                        >
                          Ändern
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-10 rounded-2xl border border-[#e4eeea] bg-[#f9fcfa] p-4 sm:p-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={form.confirmTruth}
                      onChange={e => setForm(f => ({ ...f, confirmTruth: e.target.checked }))}
                    />
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-[#e0e0e0] bg-white peer-checked:border-0 peer-checked:bg-[#18a87c]`}
                    >
                      {form.confirmTruth ?
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                          <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                      : null}
                    </span>
                    <span className="text-[15px] font-medium leading-snug text-[#0d2b1f]">
                      Ich bestätige, dass alle Angaben korrekt und wahrheitsgemäss sind.
                    </span>
                  </label>
                </div>
              </>
            : null}
          </div>
        </div>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-50 flex min-h-[72px] items-center justify-between gap-3 border-t border-[#e8ece9] bg-white/98 px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-4px_12px_rgba(13,43,31,0.06)] backdrop-blur-sm sm:px-6"
      >
        {optionalStep ?
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] text-[14px] font-medium text-[#8aa89e]"
          >
            Überspringen
          </button>
        : (
          <span />
        )}
        <button
          type="button"
          disabled={
            submitting ||
            ((step !== 8 && step !== 9) && !stepValid) ||
            (step === 9 && !form.confirmTruth)
          }
          onClick={() => {
            if (step === 9) void onSubmit()
            else onNext()
          }}
          className="flex h-12 min-h-[48px] min-w-[140px] items-center justify-center rounded-xl bg-[#18a87c] px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#159673] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
        >
          {submitting ?
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : step === 9 ?
            'Profil speichern →'
          : 'Weiter →'}
        </button>
      </footer>
    </div>
  )
}
