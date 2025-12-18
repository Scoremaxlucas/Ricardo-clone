import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getMissingProfileFields,
  type PolicyContext,
  type PolicyOptions,
} from '@/lib/profilePolicy'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { context, options } = await request.json()

    // Validate context
    const validContexts: PolicyContext[] = [
      'SELL_PUBLISH',
      'SELL_ENABLE_SHIPPING',
      'PAYMENT_PROTECTION',
      'INVOICE_ACTION',
      'CHAT_ONLY',
    ]
    if (!validContexts.includes(context)) {
      return NextResponse.json(
        { message: 'Ungültiger Kontext' },
        { status: 400 }
      )
    }

    // Load user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        nickname: true,
        email: true,
        phone: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        country: true,
        addresszusatz: true,
        kanton: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check missing fields
    const missingFields = getMissingProfileFields(
      user,
      context as PolicyContext,
      (options || {}) as PolicyOptions
    )

    return NextResponse.json({
      isComplete: missingFields.length === 0,
      missingFields,
      user: {
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        street: user.street,
        streetNumber: user.streetNumber,
        postalCode: user.postalCode,
        city: user.city,
        country: user.country,
        addresszusatz: user.addresszusatz,
        kanton: user.kanton,
      },
    })
  } catch (error: any) {
    console.error('Error checking profile completeness:', error)
    return NextResponse.json(
      { message: 'Fehler beim Prüfen des Profils: ' + error.message },
      { status: 500 }
    )
  }
}
