import type { EmploymentStatus, HouseholdPets, IncomeCategory } from '@prisma/client'

export type ProfilFormInitial = {
  firstName: string
  lastName: string
  dateOfBirth: string
  currentAddress: string
  currentZip: string
  currentCity: string
  contactPhone: string
  applicationEmail: string
  employmentStatus: EmploymentStatus
  employer: string
  jobTitle: string
  employedSinceYear: string
  employedSinceMonth: string
  monthlyIncomeCategory: IncomeCategory
  householdTotalPersons: string
  householdChildrenCount: string
  declaresNonSmoker: boolean
  householdPets: HouseholdPets
  referenceName: string
  referencePhone: string
  referenceRelation: string
  preferredCantonCodes: string[]
  preferredPostalCodes: string
  preferredBudgetMin: string
  preferredBudgetMax: string
  preferredMinRooms: string
  preferredMaxRooms: string
  preferredMoveInEarliest: string
  preferredMoveInLatest: string
}

function defaultForm(): ProfilFormInitial {
  return {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    currentAddress: '',
    currentZip: '',
    currentCity: '',
    contactPhone: '',
    applicationEmail: '',
    employmentStatus: 'EMPLOYED',
    employer: '',
    jobTitle: '',
    employedSinceYear: '',
    employedSinceMonth: '',
    monthlyIncomeCategory: 'FROM_4000_TO_5500',
    householdTotalPersons: '1',
    householdChildrenCount: '0',
    declaresNonSmoker: false,
    householdPets: 'NONE',
    referenceName: '',
    referencePhone: '',
    referenceRelation: '',
    preferredCantonCodes: [],
    preferredPostalCodes: '',
    preferredBudgetMin: '',
    preferredBudgetMax: '',
    preferredMinRooms: '',
    preferredMaxRooms: '',
    preferredMoveInEarliest: '',
    preferredMoveInLatest: '',
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
  const pc = String(p.preferredCanton ?? '').trim()
  const preferredCantonCodes = pc
    ? pc
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .sort()
    : []

  const hp = (p.householdPets as HouseholdPets | undefined) || 'NONE'
  const validPets: HouseholdPets[] = ['UNSPECIFIED', 'NONE', 'HAS_PETS']
  const householdPetsRaw = validPets.includes(hp) ? hp : 'NONE'
  const householdPets = householdPetsRaw === 'UNSPECIFIED' ? 'NONE' : householdPetsRaw

  const htp =
    p.householdTotalPersons != null && Number.isFinite(Number(p.householdTotalPersons)) ?
      Math.min(20, Math.max(1, Math.round(Number(p.householdTotalPersons))))
    : 1
  const hccRaw =
    p.householdChildrenCount != null && Number.isFinite(Number(p.householdChildrenCount)) ?
      Math.round(Number(p.householdChildrenCount))
    : 0
  const householdChildrenCount = Math.min(htp, Math.max(0, hccRaw))

  const validIncome: IncomeCategory[] = [
    'UNDER_3000',
    'FROM_3000_TO_4000',
    'FROM_4000_TO_5500',
    'FROM_5500_TO_7000',
    'FROM_7000_TO_9000',
    'FROM_9000_TO_12000',
    'FROM_12000_TO_16000',
    'FROM_16000_TO_22000',
    'FROM_22000_TO_30000',
    'FROM_30000_TO_45000',
    'FROM_45000_TO_65000',
    'FROM_65000_TO_90000',
    'ABOVE_90000',
  ]
  const mic = p.monthlyIncomeCategory as IncomeCategory | undefined
  const monthlyIncomeCategory = mic && validIncome.includes(mic) ? mic : 'FROM_4000_TO_5500'

  return {
    firstName: String(p.firstName ?? ''),
    lastName: String(p.lastName ?? ''),
    dateOfBirth: dobInputValue(String(p.dateOfBirth ?? '')),
    currentAddress: String(p.currentAddress ?? ''),
    currentZip: String(p.currentZip ?? ''),
    currentCity: String(p.currentCity ?? ''),
    contactPhone: String(p.contactPhone ?? '').trim(),
    applicationEmail: String(p.applicationEmail ?? '').trim(),
    employmentStatus: (p.employmentStatus as EmploymentStatus) || 'EMPLOYED',
    employer: String(p.employer ?? ''),
    jobTitle: String(p.jobTitle ?? ''),
    employedSinceYear,
    employedSinceMonth,
    monthlyIncomeCategory,
    householdTotalPersons: String(htp),
    householdChildrenCount: String(householdChildrenCount),
    declaresNonSmoker: p.declaresNonSmoker === true,
    householdPets,
    referenceName: String(p.referenceName ?? ''),
    referencePhone: String(p.referencePhone ?? ''),
    referenceRelation: String(p.referenceRelation ?? ''),
    preferredCantonCodes,
    preferredPostalCodes: String(p.preferredPostalCodes ?? ''),
    preferredBudgetMin: p.preferredBudgetMin != null ? String(p.preferredBudgetMin) : '',
    preferredBudgetMax: p.preferredBudgetMax != null ? String(p.preferredBudgetMax) : '',
    preferredMinRooms: p.preferredMinRooms != null ? String(p.preferredMinRooms) : '',
    preferredMaxRooms: p.preferredMaxRooms != null ? String(p.preferredMaxRooms) : '',
    preferredMoveInEarliest: dobInputValue(String(p.preferredMoveInEarliest ?? '')),
    preferredMoveInLatest: dobInputValue(String(p.preferredMoveInLatest ?? '')),
  }
}
