import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMainAddress, type Address } from '@/lib/address'
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

    // Load user profile with legacy address fields
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        nickname: true,
        email: true,
        phone: true,
        // Legacy address fields (used by profilePolicy)
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

    // Also fetch from new UserAddress table
    const mainAddress = await getMainAddress(session.user.id)

    // For profile completeness check, use legacy fields (or fallback to new address)
    // This ensures backward compatibility during migration
    const profileForCheck = {
      ...user,
      // Use new address if legacy fields are empty
      street: user.street || mainAddress?.street,
      streetNumber: user.streetNumber || mainAddress?.streetNumber,
      postalCode: user.postalCode || mainAddress?.postalCode,
      city: user.city || mainAddress?.city,
      country: user.country || mainAddress?.country,
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
        // Return legacy fields for backward compatibility
        street: user.street,
        streetNumber: user.streetNumber,
        postalCode: user.postalCode,
        city: user.city,
        country: user.country,
        addresszusatz: user.addresszusatz,
        kanton: user.kanton,
      },
      // Include new address structure for future use
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
