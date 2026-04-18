import { authOptions } from '@/lib/auth'
import { ensureLandlordAccountForUser } from '@/lib/matching/landlord-account'
import { checkMatchingPropertiesGetRateLimit } from '@/lib/matching/matching-rate-limit'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

/**
 * GET /api/matching/properties
 * Listet Objekte des eingeloggten Vermieters (Landlord-Konto).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const rl = await checkMatchingPropertiesGetRateLimit(userId)
    if (!rl.allowed) {
      const retry = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        { message: 'Zu viele Anfragen. Bitte später erneut versuchen.', retryAfter: retry },
        { status: 429, headers: { 'Retry-After': String(retry) } }
      )
    }

    const landlordAccountId = await ensureLandlordAccountForUser(userId)

    const rows = await prisma.matchingProperty.findMany({
      where: { landlordAccountId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        source: true,
        title: true,
        zip: true,
        city: true,
        canton: true,
        rooms: true,
        rentPerMonth: true,
        status: true,
        availableFrom: true,
        availableTo: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const data = rows.map(r => ({
      ...r,
      rooms: Number(r.rooms),
    }))

    return NextResponse.json({ properties: data })
  } catch (e) {
    console.error('[GET /api/matching/properties]', e)
    return NextResponse.json({ message: 'Serverfehler' }, { status: 500 })
  }
}
