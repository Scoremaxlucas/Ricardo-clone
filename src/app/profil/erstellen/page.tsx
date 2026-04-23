import { ProfilErstellenClient } from './ProfilErstellenClient'
import { buildInitialFromApi } from '@/lib/tenant-profile/profil-form-initial'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: 'Mieterprofil erstellen — Helvenda Wohnungen' },
    description: 'Persönliche Angaben, Beschäftigung und Referenz — einmal ausfüllen für alle Bewerbungen.',
    robots: { index: false, follow: false },
  }
}

type ProfilErstellenSearchParams = { next?: string | string[] }

export default async function ProfilErstellenPage({
  searchParams,
}: {
  searchParams: ProfilErstellenSearchParams | Promise<ProfilErstellenSearchParams>
}) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil/erstellen'))
  }

  const [existing, user] = await Promise.all([
    prisma.tenantProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } }),
  ])
  if (existing) {
    redirect('/profil')
  }

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
    <ProfilErstellenClient
      mode="create"
      initial={initial}
      redirectAfterSave={redirectAfterSave}
      accountEmail={accountEmail}
    />
  )
}
