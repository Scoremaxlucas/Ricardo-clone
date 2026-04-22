import type { EmploymentStatus, IncomeCategory } from '@prisma/client'

const EMPLOYMENT: EmploymentStatus[] = [
  'EMPLOYED',
  'SELF_EMPLOYED',
  'STUDENT',
  'RETIRED',
  'UNEMPLOYED',
  'OTHER',
]

const INCOME: IncomeCategory[] = [
  'UNDER_3000',
  'FROM_3000_TO_4000',
  'FROM_4000_TO_5500',
  'FROM_5500_TO_7000',
  'FROM_7000_TO_9000',
  'ABOVE_9000',
]

export type TenantProfilePayload = {
  firstName: string
  lastName: string
  dateOfBirth: string
  currentAddress: string
  currentZip: string
  currentCity: string
  employmentStatus: EmploymentStatus
  employer?: string | null
  jobTitle?: string | null
  employedSinceYear?: number | null
  employedSinceMonth?: number | null
  monthlyIncomeCategory: IncomeCategory
  referenceName?: string | null
  referencePhone?: string | null
  referenceRelation?: string | null
  preferredCanton?: string | null
  preferredPostalCodes?: string | null
  preferredBudgetMin?: number | null
  preferredBudgetMax?: number | null
  preferredMinRooms?: number | null
  preferredMaxRooms?: number | null
  preferredMoveInEarliest?: string | null
  preferredMoveInLatest?: string | null
}

function minAge18(dob: Date): boolean {
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age -= 1
  }
  return age >= 18
}

export function validateTenantProfilePayload(
  raw: unknown
): { ok: true; data: TenantProfilePayload } | { ok: false; message: string; field?: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, message: 'Ungültiger Request-Body' }
  }
  const b = raw as Record<string, unknown>

  const firstName = String(b.firstName ?? '').trim()
  const lastName = String(b.lastName ?? '').trim()
  const dateOfBirth = String(b.dateOfBirth ?? '').trim()
  const currentAddress = String(b.currentAddress ?? '').trim()
  const currentZip = String(b.currentZip ?? '').trim()
  const currentCity = String(b.currentCity ?? '').trim()
  const employmentStatus = b.employmentStatus as EmploymentStatus
  const employer = b.employer != null ? String(b.employer).trim() : ''
  const jobTitle = b.jobTitle != null ? String(b.jobTitle).trim() : ''
  const monthlyIncomeCategory = b.monthlyIncomeCategory as IncomeCategory
  const preferredCanton = b.preferredCanton != null ? String(b.preferredCanton).trim().toUpperCase() : ''
  const preferredPostalCodes =
    b.preferredPostalCodes != null ? String(b.preferredPostalCodes).trim() : ''

  if (!firstName) return { ok: false, message: 'Vorname fehlt', field: 'firstName' }
  if (!lastName) return { ok: false, message: 'Nachname fehlt', field: 'lastName' }
  if (!dateOfBirth) return { ok: false, message: 'Geburtsdatum fehlt', field: 'dateOfBirth' }
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) {
    return { ok: false, message: 'Geburtsdatum ungültig', field: 'dateOfBirth' }
  }
  if (!minAge18(dob)) {
    return { ok: false, message: 'Du musst mindestens 18 Jahre alt sein', field: 'dateOfBirth' }
  }
  if (!currentAddress) return { ok: false, message: 'Adresse fehlt', field: 'currentAddress' }
  if (!/^\d{4}$/.test(currentZip)) {
    return { ok: false, message: 'PLZ muss 4 Ziffern haben (Schweiz)', field: 'currentZip' }
  }
  if (!currentCity) return { ok: false, message: 'Ort fehlt', field: 'currentCity' }
  if (!EMPLOYMENT.includes(employmentStatus)) {
    return { ok: false, message: 'Beschäftigungsstatus ungültig', field: 'employmentStatus' }
  }
  if (employmentStatus === 'EMPLOYED' || employmentStatus === 'SELF_EMPLOYED') {
    if (!employer) {
      return { ok: false, message: 'Arbeitgeber / Firma ist erforderlich', field: 'employer' }
    }
  }
  if (!INCOME.includes(monthlyIncomeCategory)) {
    return { ok: false, message: 'Einkommenskategorie ungültig', field: 'monthlyIncomeCategory' }
  }

  const preferredBudgetMin =
    b.preferredBudgetMin == null || b.preferredBudgetMin === '' ? null : Number(b.preferredBudgetMin)
  const preferredBudgetMax =
    b.preferredBudgetMax == null || b.preferredBudgetMax === '' ? null : Number(b.preferredBudgetMax)
  if (
    preferredBudgetMin != null &&
    (!Number.isFinite(preferredBudgetMin) || preferredBudgetMin < 0 || preferredBudgetMin > 50000)
  ) {
    return { ok: false, message: 'Mindestbudget ungültig', field: 'preferredBudgetMin' }
  }
  if (
    preferredBudgetMax != null &&
    (!Number.isFinite(preferredBudgetMax) || preferredBudgetMax < 0 || preferredBudgetMax > 50000)
  ) {
    return { ok: false, message: 'Maximalbudget ungültig', field: 'preferredBudgetMax' }
  }
  if (preferredBudgetMin != null && preferredBudgetMax != null && preferredBudgetMin > preferredBudgetMax) {
    return { ok: false, message: 'Mindestbudget darf nicht über Maximalbudget liegen', field: 'preferredBudgetMin' }
  }

  const preferredMinRooms =
    b.preferredMinRooms == null || b.preferredMinRooms === '' ? null : Number(b.preferredMinRooms)
  const preferredMaxRooms =
    b.preferredMaxRooms == null || b.preferredMaxRooms === '' ? null : Number(b.preferredMaxRooms)
  if (preferredMinRooms != null && (!Number.isFinite(preferredMinRooms) || preferredMinRooms < 0.5 || preferredMinRooms > 12)) {
    return { ok: false, message: 'Min. Zimmer ungültig', field: 'preferredMinRooms' }
  }
  if (preferredMaxRooms != null && (!Number.isFinite(preferredMaxRooms) || preferredMaxRooms < 0.5 || preferredMaxRooms > 12)) {
    return { ok: false, message: 'Max. Zimmer ungültig', field: 'preferredMaxRooms' }
  }
  if (preferredMinRooms != null && preferredMaxRooms != null && preferredMinRooms > preferredMaxRooms) {
    return { ok: false, message: 'Min. Zimmer darf nicht über Max. Zimmer liegen', field: 'preferredMinRooms' }
  }

  const preferredMoveInEarliest =
    b.preferredMoveInEarliest == null || b.preferredMoveInEarliest === ''
      ? null
      : String(b.preferredMoveInEarliest).trim()
  const preferredMoveInLatest =
    b.preferredMoveInLatest == null || b.preferredMoveInLatest === ''
      ? null
      : String(b.preferredMoveInLatest).trim()
  if (preferredMoveInEarliest && Number.isNaN(new Date(preferredMoveInEarliest).getTime())) {
    return { ok: false, message: 'Frühester Einzugstermin ungültig', field: 'preferredMoveInEarliest' }
  }
  if (preferredMoveInLatest && Number.isNaN(new Date(preferredMoveInLatest).getTime())) {
    return { ok: false, message: 'Spätester Einzugstermin ungültig', field: 'preferredMoveInLatest' }
  }
  if (
    preferredMoveInEarliest &&
    preferredMoveInLatest &&
    new Date(preferredMoveInEarliest).getTime() > new Date(preferredMoveInLatest).getTime()
  ) {
    return {
      ok: false,
      message: 'Frühester Einzugstermin darf nicht nach dem spätesten liegen',
      field: 'preferredMoveInEarliest',
    }
  }

  let employedSinceYear: number | null = null
  let employedSinceMonth: number | null = null
  if (b.employedSinceYear != null && b.employedSinceYear !== '') {
    const y = Number(b.employedSinceYear)
    if (!Number.isFinite(y) || y < 1970 || y > new Date().getFullYear() + 1) {
      return { ok: false, message: 'Jahr «Angestellt seit» ungültig', field: 'employedSinceYear' }
    }
    employedSinceYear = y
  }
  if (b.employedSinceMonth != null && b.employedSinceMonth !== '') {
    const m = Number(b.employedSinceMonth)
    if (!Number.isFinite(m) || m < 1 || m > 12) {
      return { ok: false, message: 'Monat «Angestellt seit» ungültig', field: 'employedSinceMonth' }
    }
    employedSinceMonth = m
  }
  if ((employedSinceYear != null) !== (employedSinceMonth != null)) {
    return { ok: false, message: 'Bitte Monat und Jahr zusammen angeben', field: 'employedSinceMonth' }
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      dateOfBirth,
      currentAddress,
      currentZip,
      currentCity,
      employmentStatus,
      employer: employer || null,
      jobTitle: jobTitle || null,
      employedSinceYear,
      employedSinceMonth,
      monthlyIncomeCategory,
      referenceName: b.referenceName != null ? String(b.referenceName).trim() || null : null,
      referencePhone: b.referencePhone != null ? String(b.referencePhone).trim() || null : null,
      referenceRelation: b.referenceRelation != null ? String(b.referenceRelation).trim() || null : null,
      preferredCanton: preferredCanton || null,
      preferredPostalCodes: preferredPostalCodes || null,
      preferredBudgetMin: preferredBudgetMin == null ? null : Math.round(preferredBudgetMin),
      preferredBudgetMax: preferredBudgetMax == null ? null : Math.round(preferredBudgetMax),
      preferredMinRooms,
      preferredMaxRooms,
      preferredMoveInEarliest,
      preferredMoveInLatest,
    },
  }
}

export function employedSinceDateFromParts(
  year: number | null,
  month: number | null
): Date | null {
  if (year == null || month == null) return null
  return new Date(Date.UTC(year, month - 1, 1))
}
