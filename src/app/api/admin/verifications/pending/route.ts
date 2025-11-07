import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe ob User Admin ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    // Lade alle Benutzer mit ausstehender Verifizierung
    const users = await prisma.user.findMany({
      where: {
        verificationStatus: 'pending',
        verified: true, // Nur die, die bereits verifiziert wurden, aber noch geprüft werden müssen
        OR: [
          { idDocument: { not: null } },
          { idDocumentPage1: { not: null } },
          { idDocumentPage2: { not: null } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
        title: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        country: true,
        dateOfBirth: true,
        phone: true,
        verified: true,
        verificationStatus: true,
        verifiedAt: true,
        verificationReviewedAt: true,
        idDocument: true,
        idDocumentPage1: true,
        idDocumentPage2: true,
        idDocumentType: true,
        createdAt: true
      },
      orderBy: {
        verifiedAt: 'desc' // Neueste zuerst
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Verifizierungen' },
      { status: 500 }
    )
  }
}




