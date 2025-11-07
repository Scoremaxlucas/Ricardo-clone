import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe ob User Admin ist
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const userId = params.userId
    const body = await request.json()
    const { reason } = body

    // Lehne Verifizierung ab
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: 'rejected',
        verificationReviewedAt: new Date(),
        verificationReviewedBy: session.user.id,
        verified: false // Setze verified zurück
      }
    })

    // TODO: E-Mail an Benutzer senden mit Ablehnungsgrund

    return NextResponse.json({ message: 'Verifizierung wurde abgelehnt' })
  } catch (error: any) {
    console.error('Error rejecting verification:', error)
    return NextResponse.json(
      { message: 'Fehler beim Ablehnen der Verifizierung' },
      { status: 500 }
    )
  }
}




