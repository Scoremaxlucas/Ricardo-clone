import { authOptions } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'
import { getIbanLast4, validateIban } from '@/lib/iban-validator'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/payout/change-request
 * Create a change request for payout profile (does NOT update the profile)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = session.user.id
    const { accountHolderName, iban, reason } = await request.json()

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

    // Validate IBAN
    const ibanValidation = validateIban(iban.trim())
    if (!ibanValidation.valid) {
      return NextResponse.json(
        { message: ibanValidation.error || 'Ungültige IBAN' },
        { status: 400 }
      )
    }

    // Check if profile exists and is not UNSET
    const existingProfile = await prisma.payoutProfile.findUnique({
      where: { userId },
    })

    if (!existingProfile) {
      return NextResponse.json(
        {
          message:
            'Keine Bankverbindung hinterlegt. Bitte verwenden Sie "Bankverbindung hinterlegen" für die erste Eingabe.',
        },
        { status: 400 }
      )
    }

    if (existingProfile.status === 'UNSET') {
      return NextResponse.json(
        {
          message: 'Bitte verwenden Sie "Bankverbindung hinterlegen" für die erste Eingabe.',
        },
        { status: 400 }
      )
    }

    // Check if there's already a pending request
    const pendingRequest = await prisma.payoutChangeRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    })

    if (pendingRequest) {
      return NextResponse.json(
        {
          message:
            'Sie haben bereits eine offene Änderungsanfrage. Bitte warten Sie auf die Bearbeitung.',
        },
        { status: 400 }
      )
    }

    // Encrypt requested IBAN
    const cleanedIban = iban.replace(/\s/g, '').toUpperCase()
    const requestedIbanEncrypted = encrypt(cleanedIban)
    const requestedIbanLast4 = getIbanLast4(cleanedIban)

    // Create change request
    const changeRequest = await prisma.payoutChangeRequest.create({
      data: {
        userId,
        requestedAccountHolderName: accountHolderName.trim(),
        requestedIbanEncrypted,
        requestedIbanLast4,
        reason: reason?.trim() || null,
        status: 'PENDING',
      },
    })

    // Update profile status to CHANGE_REQUESTED
    await prisma.payoutProfile.update({
      where: { userId },
      data: {
        status: 'CHANGE_REQUESTED',
        lockedReason: 'Änderungsanfrage wird geprüft',
      },
    })

    // Create audit log
    await prisma.payoutAuditLog.create({
      data: {
        userId,
        action: 'CHANGE_REQUESTED',
        metadata: JSON.stringify({
          requestId: changeRequest.id,
          requestedAccountHolderName: changeRequest.requestedAccountHolderName,
          requestedIbanLast4: changeRequest.requestedIbanLast4,
          reason: changeRequest.reason,
        }),
        actorUserId: userId,
      },
    })

    return NextResponse.json({
      message: 'Änderungsanfrage erfolgreich eingereicht. Wir werden diese prüfen.',
      requestId: changeRequest.id,
    })
  } catch (error: any) {
    console.error('Error creating change request:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Änderungsanfrage' },
      { status: 500 }
    )
  }
}
