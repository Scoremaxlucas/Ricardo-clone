import { ProfilErstellenClient, buildInitialFromApi } from '../erstellen/ProfilErstellenClient'
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

  const row = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!row) {
    redirect('/profil/erstellen')
  }

  const safeIso = (d: Date) => (Number.isNaN(d.getTime()) ? '' : d.toISOString())

  const initial = buildInitialFromApi({
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: safeIso(row.dateOfBirth),
    currentAddress: row.currentAddress,
    currentZip: row.currentZip,
    currentCity: row.currentCity,
    employmentStatus: row.employmentStatus,
    employer: row.employer,
    jobTitle: row.jobTitle,
    employedSince: row.employedSince && !Number.isNaN(row.employedSince.getTime()) ? row.employedSince.toISOString() : null,
    monthlyIncomeCategory: row.monthlyIncomeCategory,
    referenceName: row.referenceName,
    referencePhone: row.referencePhone,
    referenceRelation: row.referenceRelation,
  })

  return <ProfilErstellenClient mode="edit" initial={initial} redirectAfterSave="/profil" />
}
