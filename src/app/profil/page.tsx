import { ProfilDashboard } from '@/app/profil/ProfilDashboard'
import { authOptions } from '@/lib/auth'
import { parsePostalCodesList } from '@/lib/matching/evaluate-match'
import { SWISS_CANTONS } from '@/lib/swiss-cantons'
import { employmentSummaryDe, householdPetsLabelDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { prisma } from '@/lib/prisma'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Mein Profil | Helvenda Wohnungen',
  description: 'Mieterprofil und Betreibungsregisterauszug.',
}

function creditResult(row: unknown): CreditCheckResult | null {
  if (!row || typeof row !== 'object') return null
  return isCreditCheckResult(row) ? row : null
}

function preferenceRows(profile: {
  preferredCanton: string | null
  preferredPostalCodes: string | null
  preferredBudgetMin: number | null
  preferredBudgetMax: number | null
  preferredMinRooms: number | null
  preferredMaxRooms: number | null
  preferredMoveInEarliest: Date | null
  preferredMoveInLatest: Date | null
}): { key: string; label: string; value: string }[] {
  const rows: { key: string; label: string; value: string }[] = []
  if (profile.preferredCanton) {
    const codes = profile.preferredCanton.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const labels = codes.map(code => SWISS_CANTONS.find(c => c.code === code)?.name ?? code)
    rows.push({ key: 'cantons', label: 'Kantone', value: labels.join(', ') })
  }
  const zips = parsePostalCodesList(profile.preferredPostalCodes)
  if (zips.length > 0) rows.push({ key: 'plz', label: 'PLZ', value: zips.join(', ') })
  if (profile.preferredBudgetMin != null || profile.preferredBudgetMax != null) {
    const min = profile.preferredBudgetMin != null ? formatCHF(profile.preferredBudgetMin) : 'offen'
    const max = profile.preferredBudgetMax != null ? formatCHF(profile.preferredBudgetMax) : 'offen'
    rows.push({ key: 'budget', label: 'Budget', value: `${min} – ${max}` })
  }
  if (profile.preferredMinRooms != null || profile.preferredMaxRooms != null) {
    const min = profile.preferredMinRooms != null ? String(profile.preferredMinRooms).replace('.', ',') : 'offen'
    const max = profile.preferredMaxRooms != null ? String(profile.preferredMaxRooms).replace('.', ',') : 'offen'
    rows.push({ key: 'rooms', label: 'Zimmer', value: `${min} – ${max}` })
  }
  if (profile.preferredMoveInEarliest != null || profile.preferredMoveInLatest != null) {
    const from = profile.preferredMoveInEarliest ? formatDate(profile.preferredMoveInEarliest) : 'offen'
    const to = profile.preferredMoveInLatest ? formatDate(profile.preferredMoveInLatest) : 'offen'
    rows.push({ key: 'move', label: 'Einzug', value: `${from} – ${to}` })
  }
  return rows
}

export default async function ProfilPage({
  searchParams,
}: {
  searchParams?: Promise<{ onboarding?: string }> | { onboarding?: string }
}) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil'))
  }

  const profile = await prisma.tenantProfile.findUnique({
    where: { userId },
    include: { user: { select: { email: true } } },
  })
  if (!profile) {
    redirect('/profil/erstellen')
  }

  const sp = searchParams ? await Promise.resolve(searchParams) : {}
  const showOnboardingComplete = sp?.onboarding === 'complete'

  const accountEmail = profile.user.email?.trim() ?? ''
  const contactEmailEffective = profile.applicationEmail?.trim() || accountEmail
  const contactPhoneDisplay = profile.contactPhone?.trim() || ''

  const employmentLine = employmentSummaryDe(
    profile.employmentStatus,
    profile.employer,
    profile.jobTitle,
    profile.employedSince
  )

  const creditJson = creditResult(profile.creditCheckResult)
  const prefs = preferenceRows(profile)
  const cantonFirst =
    profile.preferredCanton?.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)[0] ?? null

  const personalRows = [
    { key: 'name', label: 'Name', value: `${profile.firstName} ${profile.lastName}` },
    { key: 'dob', label: 'Geburtsdatum', value: formatDate(profile.dateOfBirth) },
    {
      key: 'addr',
      label: 'Adresse',
      value: `${profile.currentAddress}, ${profile.currentZip} ${profile.currentCity}`,
    },
    {
      key: 'contact',
      label: 'Kontakt',
      value: `${contactEmailEffective}\n${contactPhoneDisplay}`.trim(),
    },
    { key: 'inc', label: 'Einkommen (Kategorie)', value: incomeCategoryLabelDe(profile.monthlyIncomeCategory) },
    {
      key: 'hh',
      label: 'Haushalt',
      value: `${profile.householdTotalPersons} Person(en), ${profile.householdChildrenCount} Kinder\n${profile.declaresNonSmoker === true ? 'Nichtraucher/in' : 'Rauchen nicht bestätigt'} · ${householdPetsLabelDe(profile.householdPets)}`,
    },
    {
      key: 'ref',
      label: 'Referenz',
      value:
        profile.referenceName?.trim() ?
          `${profile.referenceName}${profile.referenceRelation?.trim() ? ` · ${profile.referenceRelation.trim()}` : ''}`
        : '—',
    },
  ]

  return (
    <ProfilDashboard
      showOnboardingComplete={showOnboardingComplete}
      firstName={profile.firstName}
      lastName={profile.lastName}
      employmentLine={employmentLine}
      creditCheckStatus={profile.creditCheckStatus}
      creditCheckResult={creditJson}
      creditCheckExpiresAt={profile.creditCheckExpiresAt?.toISOString() ?? null}
      isComplete={profile.isComplete}
      preferredCantonShort={cantonFirst}
      personalRows={personalRows}
      preferenceRows={prefs}
    />
  )
}
