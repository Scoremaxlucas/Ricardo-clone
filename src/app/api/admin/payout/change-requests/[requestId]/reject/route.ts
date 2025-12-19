import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/payout/change-requests/[requestId]/reject
 * Reject a payout change request (admin only)
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
    const { rejectionReason } = await request.json()

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

    // Update change request
    await prisma.payoutChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        decidedAt: new Date(),
        decidedBy: session.user.id,
        reason: rejectionReason
          ? `${changeRequest.reason || ''}\n\nAblehnungsgrund: ${rejectionReason}`.trim()
          : changeRequest.reason,
      },
    })

    // Set profile status back to ACTIVE (or SUSPENDED if desired)
    await prisma.payoutProfile.update({
      where: { userId: changeRequest.userId },
      data: {
        status: 'ACTIVE',
        lockedReason: rejectionReason || null,
      },
    })

    // Create audit log
    await prisma.payoutAuditLog.create({
      data: {
        userId: changeRequest.userId,
        action: 'CHANGE_REJECTED',
        metadata: JSON.stringify({
          requestId: changeRequest.id,
          rejectionReason,
          rejectedBy: session.user.id,
        }),
        actorUserId: session.user.id,
      },
    })

    return NextResponse.json({
      message: 'Änderungsanfrage erfolgreich abgelehnt',
    })
  } catch (error: any) {
    console.error('Error rejecting change request:', error)
    return NextResponse.json(
      { message: 'Fehler beim Ablehnen der Änderungsanfrage' },
      { status: 500 }
    )
  }
}
