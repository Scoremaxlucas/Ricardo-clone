import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/payout/change-requests/[requestId]/approve
 * Approve a payout change request (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ message: 'Nur für Administratoren' }, { status: 403 })
    }

    const { requestId } = await params

    // Get change request
    const changeRequest = await prisma.payoutChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        profile: true,
      },
    })

    if (!changeRequest) {
      return NextResponse.json({ message: 'Änderungsanfrage nicht gefunden' }, { status: 404 })
    }

    if (changeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Änderungsanfrage wurde bereits bearbeitet' },
        { status: 400 }
      )
    }

    // Get old values for audit log
    const oldAccountHolderName = changeRequest.profile.accountHolderName
    const oldIbanLast4 = changeRequest.profile.ibanLast4

    // Update profile with requested values
    await prisma.payoutProfile.update({
      where: { userId: changeRequest.userId },
      data: {
        accountHolderName: changeRequest.requestedAccountHolderName,
        ibanEncrypted: changeRequest.requestedIbanEncrypted,
        ibanLast4: changeRequest.requestedIbanLast4,
        status: 'ACTIVE',
        lockedReason: null,
      },
    })

    // Update change request
    await prisma.payoutChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        decidedAt: new Date(),
        decidedBy: session.user.id,
      },
    })

    // Create audit log
    await prisma.payoutAuditLog.create({
      data: {
        userId: changeRequest.userId,
        action: 'CHANGE_APPROVED',
        metadata: JSON.stringify({
          requestId: changeRequest.id,
          oldAccountHolderName,
          oldIbanLast4,
          newAccountHolderName: changeRequest.requestedAccountHolderName,
          newIbanLast4: changeRequest.requestedIbanLast4,
          approvedBy: session.user.id,
        }),
        actorUserId: session.user.id,
      },
    })

    return NextResponse.json({
      message: 'Änderungsanfrage erfolgreich genehmigt',
    })
  } catch (error: any) {
    console.error('Error approving change request:', error)
    return NextResponse.json(
      { message: 'Fehler beim Genehmigen der Änderungsanfrage' },
      { status: 500 }
    )
  }
}
