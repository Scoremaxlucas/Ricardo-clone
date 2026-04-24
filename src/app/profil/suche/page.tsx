import { SucheForm } from '@/app/profil/suche/SucheForm'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Suchpräferenzen | Helvenda Wohnungen',
  description: 'Kantone, Budget und Zimmer für deine Wohnungssuche.',
  robots: { index: false, follow: false },
}

export default async function ProfilSuchePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil/suche'))
  }

  return <SucheForm />
}
