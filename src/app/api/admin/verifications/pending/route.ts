import { getMainAddress } from '@/lib/address'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
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
          { idDocumentPage2: { not: null } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
        title: true,
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
        createdAt: true,
      },
      orderBy: {
        verifiedAt: 'desc', // Neueste zuerst
      },
    })

    // Fetch addresses from UserAddress table
    const userAddresses = await Promise.all(
      users.map(async u => ({
        userId: u.id,
        address: await getMainAddress(u.id),
      }))
    )
    const addressMap = new Map(userAddresses.map(ua => [ua.userId, ua.address]))

    // Extend users with addresses
    const usersWithAddresses = users.map(u => ({
      ...u,
      street: addressMap.get(u.id)?.street || null,
      streetNumber: addressMap.get(u.id)?.streetNumber || null,
      postalCode: addressMap.get(u.id)?.postalCode || null,
      city: addressMap.get(u.id)?.city || null,
      country: addressMap.get(u.id)?.country || 'Schweiz',
    }))

    return NextResponse.json(usersWithAddresses)
  } catch (error: any) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json({ message: 'Fehler beim Laden der Verifizierungen' }, { status: 500 })
  }
}
