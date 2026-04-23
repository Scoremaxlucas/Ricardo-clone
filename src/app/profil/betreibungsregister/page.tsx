import { BetreibungsregisterClient } from './BetreibungsregisterClient'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Betreibungsregisterauszug | Helvenda Wohnungen',
  description: 'Betreibungsregisterauszug als PDF hochladen und prüfen lassen.',
}

export default async function BetreibungsregisterPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil/betreibungsregister'))
  }

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!profile?.isComplete) {
    redirect('/profil/erstellen')
  }

  return <BetreibungsregisterClient />
}
