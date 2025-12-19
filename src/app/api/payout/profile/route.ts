import { authOptions } from '@/lib/auth'
import { encrypt, maskIban } from '@/lib/crypto'
import { getIbanLast4, validateIban } from '@/lib/iban-validator'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/payout/profile
 * Get current user's payout profile (masked)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id

    // Get payout profile
    const profile = await prisma.payoutProfile.findUnique({
      where: { userId },
      include: {
        changeRequests: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!profile) {
      return NextResponse.json({
        status: 'UNSET',
        hasProfile: false,
        hasOpenChangeRequest: false,
      })
    }

    // Check for pending change request
    const hasOpenChangeRequest = profile.changeRequests.length > 0

    return NextResponse.json({
      status: profile.status,
      hasProfile: true,
      accountHolderName: profile.accountHolderName,
      ibanMasked: maskIban('', profile.ibanLast4),
      ibanLast4: profile.ibanLast4,
      country: profile.country,
      hasOpenChangeRequest,
      verifiedAt: profile.verifiedAt?.toISOString() || null,
      lockedReason: profile.lockedReason,
    })
  } catch (error: any) {
    console.error('Error fetching payout profile:', error)
    return NextResponse.json({ message: 'Fehler beim Laden der Bankverbindung' }, { status: 500 })
  }
}

/**
 * POST /api/payout/profile
 * Create initial payout profile (only allowed if status is UNSET or doesn't exist)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id
    const { accountHolderName, iban, confirmAccountOwner } = await request.json()

    // Validation
    if (!accountHolderName || !accountHolderName.trim()) {
      return NextResponse.json({ message: 'Kontoinhaber-Name ist erforderlich' }, { status: 400 })
    }

    if (accountHolderName.trim().length > 100) {
      return NextResponse.json(
        { message: 'Kontoinhaber-Name darf maximal 100 Zeichen haben' },
        { status: 400 }
      )
    }

    if (!iban || !iban.trim()) {
      return NextResponse.json({ message: 'IBAN ist erforderlich' }, { status: 400 })
    }

    if (!confirmAccountOwner) {
      return NextResponse.json(
        { message: 'Bitte bestätigen Sie, dass Sie Kontoinhaber sind' },
        { status: 400 }
      )
    }

    // Validate IBAN
    const ibanValidation = validateIban(iban.trim())
    if (!ibanValidation.valid) {
      return NextResponse.json(
        { message: ibanValidation.error || 'Ungültige IBAN' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const existingProfile = await prisma.payoutProfile.findUnique({
      where: { userId },
    })

    if (existingProfile && existingProfile.status !== 'UNSET') {
      return NextResponse.json(
        {
          message:
            'Bankverbindung bereits hinterlegt. Bitte verwenden Sie "Änderung beantragen" für Änderungen.',
        },
        { status: 400 }
      )
    }

    // Encrypt IBAN
    const cleanedIban = iban.replace(/\s/g, '').toUpperCase()
    const ibanEncrypted = encrypt(cleanedIban)
    const ibanLast4 = getIbanLast4(cleanedIban)

    // Create or update profile
    const profile = await prisma.payoutProfile.upsert({
      where: { userId },
      create: {
        userId,
        status: 'ACTIVE',
        accountHolderName: accountHolderName.trim(),
        ibanEncrypted,
        ibanLast4,
        country: 'CH',
      },
      update: {
        status: 'ACTIVE',
        accountHolderName: accountHolderName.trim(),
        ibanEncrypted,
        ibanLast4,
        country: 'CH',
        lockedReason: null,
      },
    })

    // Create audit log
    await prisma.payoutAuditLog.create({
      data: {
        userId,
        action: 'PROFILE_CREATED',
        metadata: JSON.stringify({
          accountHolderName: profile.accountHolderName,
          ibanLast4: profile.ibanLast4,
        }),
        actorUserId: userId,
      },
    })

    // Return complete profile data so UI can update immediately
    return NextResponse.json({
      message: 'Bankverbindung erfolgreich hinterlegt',
      status: profile.status,
      hasProfile: true,
      accountHolderName: profile.accountHolderName,
      ibanMasked: maskIban('', profile.ibanLast4),
      ibanLast4: profile.ibanLast4,
      country: profile.country,
      hasOpenChangeRequest: false,
      verifiedAt: profile.verifiedAt?.toISOString() || null,
      lockedReason: profile.lockedReason,
    })
  } catch (error: any) {
    console.error('Error creating payout profile:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern der Bankverbindung' },
      { status: 500 }
    )
  }
}
