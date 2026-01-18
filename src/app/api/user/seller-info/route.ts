import { getMainAddress } from '@/lib/address'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

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

    // Prüfe, ob der aktuelle User eine Purchase ODER Order mit diesem Verkäufer hat
    const hasPurchase = await prisma.purchase.findFirst({
      where: {
        buyerId: session.user.id,
        watch: {
          sellerId: userId,
        },
      },
    })

    // NEU: Prüfe auch Orders (neues System)
    const hasOrder = await prisma.order.findFirst({
      where: {
        buyerId: session.user.id,
        sellerId: userId,
        orderStatus: { notIn: ['canceled', 'refunded'] },
      },
    })

    if (!hasPurchase && !hasOrder) {
      return NextResponse.json(
        { success: false, message: 'Sie haben keine gekaufte Uhr von diesem Verkäufer' },
        { status: 403 }
      )
    }

    // Hole Verkäuferinformationen (address from UserAddress)
    const seller = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        paymentMethods: true,
        // Stripe Connect Status für Zahlungsschutz
        stripeConnectedAccountId: true,
        stripeOnboardingComplete: true,
      },
    })

    if (!seller) {
      return NextResponse.json(
        { success: false, message: 'Verkäufer nicht gefunden' },
        { status: 404 }
      )
    }

    // Fetch seller address from UserAddress table
    const address = await getMainAddress(userId)

    return NextResponse.json({
      success: true,
      seller: {
        ...seller,
        street: address?.street || null,
        streetNumber: address?.streetNumber || null,
        postalCode: address?.postalCode || null,
        city: address?.city || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching seller info:', error)
    return NextResponse.json(
      { success: false, message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}
