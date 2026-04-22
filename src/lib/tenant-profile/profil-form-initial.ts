import type { EmploymentStatus, IncomeCategory } from '@prisma/client'

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
    monthlyIncomeCategory: 'FROM_4000_TO_5500',
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

/** Pure mapping for server + client — do not import from a `'use client'` file in RSC. */
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
    monthlyIncomeCategory: (p.monthlyIncomeCategory as IncomeCategory) || 'FROM_4000_TO_5500',
    referenceName: String(p.referenceName ?? ''),
    referencePhone: String(p.referencePhone ?? ''),
    referenceRelation: String(p.referenceRelation ?? ''),
  }
}
