import { MatchingPropertyWizard } from '@/components/matching/MatchingPropertyWizard'
import { authOptions } from '@/lib/auth'
import { loadMatchingPropertyWizardSnapshotForOwner } from '@/lib/matching/landlord-matching-properties'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Objekt bearbeiten',
    description: `Matching-Objekt ${id} bearbeiten.`,
  }
}

export default async function EditMatchingMatchObjektPage({ params }: PageProps) {
  const { id: propertyId } = await params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/matching/match-objekte/${propertyId}/edit`))
  }

  const initialSnapshot = await loadMatchingPropertyWizardSnapshotForOwner(userId, propertyId)
  if (!initialSnapshot) {
    notFound()
  }

  return <MatchingPropertyWizard mode="edit" propertyId={propertyId} initialSnapshot={initialSnapshot} />
}
