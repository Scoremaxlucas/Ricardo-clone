import { ProfilErstellenClient } from '../erstellen/ProfilErstellenClient'
import { buildInitialFromApi } from '@/lib/tenant-profile/profil-form-initial'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Profil bearbeiten | Helvenda Wohnungen',
    description: 'Mieterprofil anpassen.',
    robots: { index: false, follow: false },
  }
}

export default async function ProfilBearbeitenPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil/bearbeiten'))
  }

  const [row, user] = await Promise.all([
    prisma.tenantProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } }),
  ])
  if (!row) {
    redirect('/profil/erstellen')
  }

  const safeIso = (d: Date) => (Number.isNaN(d.getTime()) ? '' : d.toISOString())
  const phoneFromProfile = row.contactPhone?.trim() ?? ''
  const phoneFromUser = user?.phone?.trim() ?? ''
  const accountEmail = user?.email?.trim() ?? ''

  const initial = buildInitialFromApi({
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: safeIso(row.dateOfBirth),
    currentAddress: row.currentAddress,
    currentZip: row.currentZip,
    currentCity: row.currentCity,
    contactPhone: phoneFromProfile || phoneFromUser,
    applicationEmail: row.applicationEmail?.trim() || accountEmail,
    employmentStatus: row.employmentStatus,
    employer: row.employer,
    jobTitle: row.jobTitle,
    employedSince: row.employedSince && !Number.isNaN(row.employedSince.getTime()) ? row.employedSince.toISOString() : null,
    monthlyIncomeCategory: row.monthlyIncomeCategory,
    householdTotalPersons: row.householdTotalPersons,
    householdChildrenCount: row.householdChildrenCount,
    declaresNonSmoker: row.declaresNonSmoker,
    householdPets: row.householdPets,
    referenceName: row.referenceName,
    referencePhone: row.referencePhone,
    referenceRelation: row.referenceRelation,
    preferredCanton: row.preferredCanton,
    preferredPostalCodes: row.preferredPostalCodes,
    preferredBudgetMin: row.preferredBudgetMin,
    preferredBudgetMax: row.preferredBudgetMax,
    preferredMinRooms: row.preferredMinRooms,
    preferredMaxRooms: row.preferredMaxRooms,
    preferredMoveInEarliest: row.preferredMoveInEarliest ? row.preferredMoveInEarliest.toISOString() : null,
    preferredMoveInLatest: row.preferredMoveInLatest ? row.preferredMoveInLatest.toISOString() : null,
  })

  return (
    <ProfilErstellenClient mode="edit" initial={initial} redirectAfterSave="/profil" accountEmail={accountEmail} />
  )
}
