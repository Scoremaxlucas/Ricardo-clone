import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Verkäuferinformationen für einen Purchase abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID fehlt' }, { status: 400 })
    }

    // Prüfe, ob der aktuelle User eine Purchase mit diesem Verkäufer hat
    const hasPurchase = await prisma.purchase.findFirst({
      where: {
        buyerId: session.user.id,
        watch: {
          sellerId: userId,
        },
      },
    })

    if (!hasPurchase) {
      return NextResponse.json(
        { success: false, message: 'Sie haben keine gekaufte Uhr von diesem Verkäufer' },
        { status: 403 }
      )
    }

    // Hole Verkäuferinformationen
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        phone: true,
        paymentMethods: true,
      },
    })

    if (!seller) {
      return NextResponse.json(
        { success: false, message: 'Verkäufer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      seller,
    })
  } catch (error: any) {
    console.error('Error fetching seller info:', error)
    return NextResponse.json(
      { success: false, message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}
