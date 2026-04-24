import { OnboardingFlow } from '@/app/profil/erstellen/OnboardingFlow'
import { buildInitialFromApi } from '@/lib/tenant-profile/profil-form-initial'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: 'Mieterprofil erstellen — Helvenda Wohnungen' },
    description: 'Persönliche Angaben — einmal ausfüllen für alle Bewerbungen.',
    robots: { index: false, follow: false },
  }
}

type SearchParams = { next?: string | string[] }

export default async function ProfilErstellenPage({ searchParams }: { searchParams: SearchParams | Promise<SearchParams> }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil/erstellen'))
  }

  const existing = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (existing) {
    redirect('/profil')
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } })
  const sp = await Promise.resolve(searchParams)
  const nextRaw = sp.next
  const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw
  const redirectAfterSave = next && next.startsWith('/') ? next : '/profil'

  const accountEmail = user?.email?.trim() ?? ''
  const initial = {
    ...buildInitialFromApi(null),
    contactPhone: user?.phone?.trim() ?? '',
    applicationEmail: accountEmail,
  }

  return (
    <OnboardingFlow mode="create" accountEmail={accountEmail} redirectAfterSave={redirectAfterSave} initial={initial} />
  )
}
