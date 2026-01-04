import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMainAddress } from '@/lib/address'
import {
  getMissingProfileFields,
  type PolicyContext,
  type PolicyOptions,
} from '@/lib/profilePolicy'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

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
      return NextResponse.json({ message: 'Ungültiger Kontext' }, { status: 400 })
    }

    // Load user profile (address from UserAddress table)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        nickname: true,
        email: true,
        phone: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Fetch address from UserAddress table (primary source)
    const mainAddress = await getMainAddress(session.user.id)

    // Build profile for completeness check with UserAddress data
    const profileForCheck = {
      ...user,
      street: mainAddress?.street || null,
      streetNumber: mainAddress?.streetNumber || null,
      postalCode: mainAddress?.postalCode || null,
      city: mainAddress?.city || null,
      country: mainAddress?.country || null,
    }

    // Check missing fields
    const missingFields = getMissingProfileFields(
      profileForCheck,
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
        // Address from UserAddress table
        street: mainAddress?.street || null,
        streetNumber: mainAddress?.streetNumber || null,
        postalCode: mainAddress?.postalCode || null,
        city: mainAddress?.city || null,
        country: mainAddress?.country || 'Schweiz',
        addresszusatz: mainAddress?.addresszusatz || null,
        kanton: mainAddress?.kanton || null,
      },
      // Include address structure
      mainAddress: mainAddress ? {
        street: mainAddress.street,
        streetNumber: mainAddress.streetNumber,
        postalCode: mainAddress.postalCode,
        city: mainAddress.city,
        country: mainAddress.country,
        addresszusatz: mainAddress.addresszusatz,
        kanton: mainAddress.kanton,
      } : null,
    })
  } catch (error: any) {
    console.error('Error checking profile completeness:', error)
    return NextResponse.json(
      { message: 'Fehler beim Prüfen des Profils: ' + error.message },
      { status: 500 }
    )
  }
}
