import { authOptions } from '@/lib/auth'
import { sendEmail, getEmailBaseUrl } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST: Verkäufer-Stellungnahme zu einem Dispute (Ricardo-Style)
 *
 * Nur der Verkäufer kann auf einen Dispute antworten.
 * Die Antwort wird protokolliert und alle Parteien werden benachrichtigt.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const { response, attachments } = await request.json()

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { message: 'Bitte geben Sie eine Stellungnahme ab' },
        { status: 400 }
      )
    }

    // Lade Purchase mit Dispute-Daten
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        watchId: true,
        buyerId: true,
        disputeOpenedAt: true,
        disputeStatus: true,
        disputeReason: true,
        sellerRespondedAt: true,
        sellerResponseDeadline: true,
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

    // Prüfe ob es einen offenen Dispute gibt
    if (!purchase.disputeOpenedAt) {
      return NextResponse.json(
        { message: 'Es existiert kein offener Dispute für diesen Kauf' },
        { status: 400 }
      )
    }

    // Prüfe ob der Dispute noch offen ist
    if (
      purchase.disputeStatus &&
      !['pending', 'under_review', 'escalated'].includes(purchase.disputeStatus)
    ) {
      return NextResponse.json({ message: 'Der Dispute ist bereits geschlossen' }, { status: 400 })
    }

    // Nur der Verkäufer kann antworten
    if (purchase.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann auf diesen Dispute antworten' },
        { status: 403 }
      )
    }

    const now = new Date()
    const isLateResponse = purchase.sellerResponseDeadline && now > purchase.sellerResponseDeadline
    const isFirstResponse = !purchase.sellerRespondedAt

    // Update Purchase mit Verkäufer-Antwort
    await prisma.purchase.update({
      where: { id },
      data: {
        sellerRespondedAt: now,
        sellerResponseText: response,
        // Wenn es die erste Antwort ist und vorher eskaliert war, setze auf under_review
        ...(isFirstResponse &&
          purchase.disputeStatus === 'escalated' && {
            disputeStatus: 'under_review',
          }),
        // Wenn es die erste Antwort ist und pending war, setze auf under_review
        ...(isFirstResponse &&
          purchase.disputeStatus === 'pending' && {
            disputeStatus: 'under_review',
          }),
      },
    })

    // Erstelle DisputeComment für die Historie
    await prisma.disputeComment.create({
      data: {
        purchaseId: id,
        userId: session.user.id,
        userRole: 'seller',
        type: 'comment',
        content: response,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    })

    // Notiz wenn die Antwort verspätet war
    if (isLateResponse && isFirstResponse) {
      await prisma.disputeComment.create({
        data: {
          purchaseId: id,
          userId: 'system',
          userRole: 'admin',
          type: 'status_change',
          content: `Verkäufer-Stellungnahme eingegangen (verspätet - Frist war ${purchase.sellerResponseDeadline?.toLocaleDateString('de-CH')})`,
          isInternal: true,
        },
      })
    }

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
        title: '💬 Verkäufer hat geantwortet',
        message: `${sellerName} hat auf Ihren Dispute für "${purchase.watch.title}" geantwortet.`,
        link: `/disputes/${id}`,
        watchId: purchase.watchId,
      },
    })

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
          title: isLateResponse
            ? '⚠️ Verspätete Verkäufer-Antwort'
            : '💬 Verkäufer-Stellungnahme eingegangen',
          message: `Verkäufer hat auf Dispute für "${purchase.watch.title}" geantwortet.${isLateResponse ? ' (Nach Fristablauf)' : ''}`,
          link: `/admin/disputes/${id}`,
          watchId: purchase.watchId,
        },
      })
    }

    // E-Mail an Käufer
    try {
      await sendEmail({
        to: purchase.buyer.email,
        subject: `💬 Verkäufer-Antwort zu Ihrem Dispute - ${purchase.watch.title}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0f766e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .response-box { background: white; border-left: 4px solid #0f766e; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 Verkäufer-Stellungnahme</h1>
    </div>
    <div class="content">
      <p>Hallo ${buyerName},</p>

      <p><strong>${sellerName}</strong> hat auf Ihren Dispute für "<strong>${purchase.watch.title}</strong>" geantwortet:</p>

      <div class="response-box">
        ${response.replace(/\n/g, '<br>')}
      </div>

      <p>Ein Helvenda-Mitarbeiter wird beide Stellungnahmen prüfen und eine Entscheidung treffen.</p>

      <p style="text-align: center;">
        <a href="${getEmailBaseUrl()}/disputes/${id}" class="button">
          Dispute ansehen →
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
Verkäufer-Stellungnahme zu Ihrem Dispute

Hallo ${buyerName},

${sellerName} hat auf Ihren Dispute für "${purchase.watch.title}" geantwortet:

"${response}"

Ein Helvenda-Mitarbeiter wird beide Stellungnahmen prüfen und eine Entscheidung treffen.

Dispute ansehen: ${getEmailBaseUrl()}/disputes/${id}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
        `.trim(),
      })
    } catch (emailError) {
      console.error('[dispute-respond] Fehler beim Senden der E-Mail:', emailError)
    }

    console.log(
      `[dispute-respond] Seller responded to dispute ${id}${isLateResponse ? ' (late)' : ''}`
    )

    return NextResponse.json({
      message: 'Ihre Stellungnahme wurde erfolgreich übermittelt',
      isLateResponse,
      disputeStatus:
        purchase.disputeStatus === 'escalated' ? 'under_review' : purchase.disputeStatus,
    })
  } catch (error: any) {
    console.error('Error responding to dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Senden der Stellungnahme: ' + error.message },
      { status: 500 }
    )
  }
}

