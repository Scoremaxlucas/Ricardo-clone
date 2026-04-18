import { ProfilErstellenClient, buildInitialFromApi } from './ProfilErstellenClient'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Mieterprofil erstellen | Helvenda Wohnungen',
  description: 'Persönliche Angaben, Beschäftigung und Referenz — einmal ausfüllen für alle Bewerbungen.',
}

export default async function ProfilErstellenPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] }
}) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil/erstellen'))
  }

  const existing = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (existing) {
    redirect('/profil')
  }

  const nextRaw = searchParams.next
  const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw
  const redirectAfterSave = next && next.startsWith('/') ? next : '/profil'

  return <ProfilErstellenClient mode="create" initial={buildInitialFromApi(null)} redirectAfterSave={redirectAfterSave} />
}
