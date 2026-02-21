import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/email/unsubscribe — Unsubscribe from email notifications
 * Body: { token: string, type: 'all' | 'marketing' | 'transactional' }
 */
export async function POST(request: NextRequest) {
  try {
    const { token, type } = await request.json()

    if (!token) {
      return NextResponse.json({ message: 'Token erforderlich' }, { status: 400 })
    }

    const userId = verifyUnsubscribeToken(token)
    if (!userId) {
      return NextResponse.json({ message: 'Ungültiger oder abgelaufener Link' }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Update preferences based on type
    const updateData: Record<string, boolean | string> = {}

    switch (type) {
      case 'all':
        // Disable all email notifications
        updateData.emailOnNewMessage = false
        updateData.emailOnNewBid = false
        updateData.emailOnNewOffer = false
        updateData.emailOnSaleCompleted = false
        updateData.emailOnOutbid = false
        updateData.emailOnAuctionEnding = false
        updateData.emailOnPurchase = false
        updateData.emailOnShipping = false
        updateData.emailOnSearchMatch = false
        updateData.emailOnFavoritePriceChange = false
        updateData.emailMarketing = false
        updateData.emailDigestFrequency = 'none'
        break
      case 'marketing':
        updateData.emailMarketing = false
        break
      case 'transactional':
        // Only disable optional transactional emails (keep critical ones like purchase confirmations)
        updateData.emailOnNewMessage = false
        updateData.emailOnNewBid = false
        updateData.emailOnNewOffer = false
        updateData.emailOnOutbid = false
        updateData.emailOnAuctionEnding = false
        updateData.emailOnSearchMatch = false
        updateData.emailOnFavoritePriceChange = false
        break
      default:
        return NextResponse.json({ message: 'Ungültiger Typ' }, { status: 400 })
    }

    await prisma.userPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    })

    // Also update MarketingContact status when unsubscribing from marketing or all
    if (type === 'marketing' || type === 'all') {
      try {
        if (user.email) {
          await prisma.marketingContact.updateMany({
            where: { email: user.email },
            data: { status: 'unsubscribed' },
          })
        }
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json({ success: true, type })
  } catch (error: any) {
    console.error('[email/unsubscribe] Error:', error)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

/**
 * GET /api/email/unsubscribe — Get current email preferences for a token
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Token erforderlich' }, { status: 400 })
    }

    const userId = verifyUnsubscribeToken(token)
    if (!userId) {
      return NextResponse.json({ message: 'Ungültiger oder abgelaufener Link' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      name: user.name,
      email: user.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Partially mask email
      preferences: prefs
        ? {
            emailOnNewMessage: prefs.emailOnNewMessage,
            emailOnNewBid: prefs.emailOnNewBid,
            emailOnNewOffer: prefs.emailOnNewOffer,
            emailOnSaleCompleted: prefs.emailOnSaleCompleted,
            emailOnOutbid: prefs.emailOnOutbid,
            emailOnAuctionEnding: prefs.emailOnAuctionEnding,
            emailOnPurchase: prefs.emailOnPurchase,
            emailOnShipping: prefs.emailOnShipping,
            emailOnSearchMatch: prefs.emailOnSearchMatch,
            emailOnFavoritePriceChange: prefs.emailOnFavoritePriceChange,
            emailMarketing: prefs.emailMarketing,
          }
        : null,
    })
  } catch (error: any) {
    console.error('[email/unsubscribe] GET Error:', error)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}
