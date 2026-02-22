import { verifyMarketingUnsubscribeToken } from '@/lib/email/marketing-unsubscribe'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/marketing/unsubscribe?token=...
 * Verify token and return masked email
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ message: 'Token erforderlich' }, { status: 400 })
    }

    const email = verifyMarketingUnsubscribeToken(token)
    if (!email) {
      return NextResponse.json({ message: 'Ungültiger oder abgelaufener Link' }, { status: 400 })
    }

    const contact = await prisma.marketingContact.findUnique({ where: { email } })
    if (!contact) {
      return NextResponse.json({ message: 'Kontakt nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      status: contact.status,
    })
  } catch (error: any) {
    console.error('[marketing/unsubscribe] GET Error:', error)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}

/**
 * POST /api/marketing/unsubscribe
 * Body: { token: string }
 * Marks the contact as unsubscribed
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ message: 'Token erforderlich' }, { status: 400 })
    }

    const email = verifyMarketingUnsubscribeToken(token)
    if (!email) {
      return NextResponse.json({ message: 'Ungültiger oder abgelaufener Link' }, { status: 400 })
    }

    await prisma.marketingContact.updateMany({
      where: { email },
      data: { status: 'unsubscribed' },
    })

    // Also update UserPreferences if this email belongs to a registered user
    const user = await prisma.user.findFirst({ where: { email } })
    if (user) {
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: { emailMarketing: false },
        create: { userId: user.id, emailMarketing: false },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[marketing/unsubscribe] POST Error:', error)
    return NextResponse.json({ message: 'Interner Fehler' }, { status: 500 })
  }
}
