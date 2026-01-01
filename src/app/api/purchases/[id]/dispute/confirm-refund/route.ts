import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST: Verkäufer bestätigt Rückerstattung (Ricardo-Style)
 *
 * Nach einer Dispute-Entscheidung zugunsten des Käufers muss der Verkäufer
 * die Rückerstattung manuell vornehmen und bestätigen.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const { confirmationNote, attachments } = await request.json()

    // Lade Purchase mit Dispute-Daten
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        watchId: true,
        buyerId: true,
        disputeRefundRequired: true,
        disputeRefundAmount: true,
        disputeRefundDeadline: true,
        disputeRefundCompletedAt: true,
        watch: {
          select: {
            id: true,
            title: true,
            sellerId: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                nickname: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            nickname: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Nur der Verkäufer kann bestätigen
    if (purchase.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann die Rückerstattung bestätigen' },
        { status: 403 }
      )
    }

    // Prüfe ob Rückerstattung erforderlich ist
    if (!purchase.disputeRefundRequired) {
      return NextResponse.json(
        { message: 'Für diesen Kauf ist keine Rückerstattung erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits bestätigt
    if (purchase.disputeRefundCompletedAt) {
      return NextResponse.json(
        { message: 'Die Rückerstattung wurde bereits bestätigt' },
        { status: 400 }
      )
    }

    const now = new Date()
    const wasLate = purchase.disputeRefundDeadline && now > purchase.disputeRefundDeadline

    // Update Purchase
    await prisma.purchase.update({
      where: { id },
      data: {
        disputeRefundCompletedAt: now,
      },
    })

    // Create audit trail
    await prisma.disputeComment.create({
      data: {
        purchaseId: id,
        userId: session.user.id,
        userRole: 'seller',
        type: 'status_change',
        content: `Verkäufer hat Rückerstattung bestätigt${wasLate ? ' (verspätet)' : ''}${confirmationNote ? `: ${confirmationNote}` : ''}`,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    })

    const sellerName =
      purchase.watch.seller.nickname ||
      purchase.watch.seller.firstName ||
      purchase.watch.seller.name ||
      'Verkäufer'
    const buyerName =
      purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'

    // Benachrichtigung an Käufer
    await prisma.notification.create({
      data: {
        userId: purchase.buyerId,
        type: 'PURCHASE',
        title: '✅ Rückerstattung bestätigt',
        message: `${sellerName} hat die Rückerstattung für "${purchase.watch.title}" bestätigt.${wasLate ? ' (Verspätet)' : ''}`,
        link: `/disputes/${id}`,
        watchId: purchase.watchId,
      },
    })

    // E-Mail an Käufer
    try {
      await sendEmail({
        to: purchase.buyer.email,
        subject: `✅ Rückerstattung bestätigt - ${purchase.watch.title}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .amount-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .amount { font-size: 28px; font-weight: bold; color: #059669; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Rückerstattung bestätigt</h1>
    </div>
    <div class="content">
      <p>Hallo ${buyerName},</p>

      <p><strong>${sellerName}</strong> hat bestätigt, dass die Rückerstattung für "<strong>${purchase.watch.title}</strong>" durchgeführt wurde.</p>

      <div class="amount-box">
        <p style="margin: 0; color: #059669;">Rückerstattungsbetrag:</p>
        <p class="amount">CHF ${(purchase.disputeRefundAmount || 0).toFixed(2)}</p>
      </div>

      ${
        confirmationNote
          ? `
      <div style="background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 8px;">
        <strong>Notiz vom Verkäufer:</strong>
        <p style="margin: 5px 0 0 0;">${confirmationNote}</p>
      </div>
      `
          : ''
      }

      <p>Bitte überprüfen Sie Ihr Konto/Zahlungsmittel, ob die Rückerstattung eingegangen ist.</p>

      <p>Falls Sie die Rückerstattung nicht erhalten haben, kontaktieren Sie uns bitte.</p>

      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/disputes/${id}" class="button">
          Details ansehen →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
        `.trim(),
        text: `
Rückerstattung bestätigt - ${purchase.watch.title}

Hallo ${buyerName},

${sellerName} hat bestätigt, dass die Rückerstattung für "${purchase.watch.title}" durchgeführt wurde.

Rückerstattungsbetrag: CHF ${(purchase.disputeRefundAmount || 0).toFixed(2)}

${confirmationNote ? `Notiz vom Verkäufer: ${confirmationNote}\n` : ''}

Bitte überprüfen Sie Ihr Konto/Zahlungsmittel, ob die Rückerstattung eingegangen ist.

Falls Sie die Rückerstattung nicht erhalten haben, kontaktieren Sie uns bitte.

Details ansehen: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/disputes/${id}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
        `.trim(),
      })
    } catch (emailError) {
      console.error('[confirm-refund] Fehler beim Senden der E-Mail:', emailError)
    }

    // Benachrichtigung an Admins
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    })

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'PURCHASE',
          title: wasLate ? '⚠️ Verspätete Rückerstattung bestätigt' : '✅ Rückerstattung bestätigt',
          message: `Verkäufer hat Rückerstattung für "${purchase.watch.title}" bestätigt.${wasLate ? ' (Nach Fristablauf)' : ''}`,
          link: `/admin/disputes/${id}`,
          watchId: purchase.watchId,
        },
      })
    }

    console.log(
      `[confirm-refund] Seller confirmed refund for purchase ${id}${wasLate ? ' (late)' : ''}`
    )

    return NextResponse.json({
      message: 'Rückerstattung erfolgreich bestätigt',
      wasLate,
    })
  } catch (error: any) {
    console.error('Error confirming refund:', error)
    return NextResponse.json(
      { message: 'Fehler beim Bestätigen der Rückerstattung: ' + error.message },
      { status: 500 }
    )
  }
}

