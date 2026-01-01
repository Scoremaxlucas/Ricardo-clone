import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { addStatusHistory } from '@/lib/status-history'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// === DISPUTE CONFIGURATION (Ricardo-Style) ===
const DISPUTE_CONFIG = {
  // Fristen
  OPEN_DEADLINE_DAYS: 30, // Dispute kann bis 30 Tage nach Kaufabschluss eröffnet werden
  RESOLUTION_DEADLINE_DAYS: 14, // Admin hat 14 Tage zur Lösung
  SELLER_RESPONSE_DEADLINE_DAYS: 7, // Verkäufer hat 7 Tage zur Stellungnahme
  REFUND_DEADLINE_DAYS: 14, // Verkäufer hat 14 Tage für Rückerstattung

  // Eskalations-Stufen
  ESCALATION_LEVELS: {
    NONE: 0,
    FIRST_WARNING: 1, // Nach Ablauf der Verkäufer-Antwortfrist
    URGENT: 2, // Kritischer Fall oder wiederholtes Versäumnis
    CRITICAL: 3, // Betrugsverdacht oder systematisches Fehlverhalten
  },

  // Reminder
  REMINDER_AFTER_DAYS: [3, 7, 10], // Erinnerungen nach X Tagen

  // Erlaubte Gründe
  BUYER_REASONS: [
    'item_not_received',
    'item_damaged',
    'item_wrong',
    'item_not_as_described',
    'seller_not_responding',
    'other',
  ],
  SELLER_REASONS: [
    'payment_not_confirmed',
    'payment_not_received',
    'buyer_not_responding',
    'buyer_not_paying',
    'other',
  ],

  // Warnungen & Konsequenzen
  MAX_WARNINGS_BEFORE_RESTRICTION: 3,
  MAX_DISPUTES_LOST_BEFORE_REVIEW: 5,
}

/**
 * POST: Dispute eröffnen
 * Sowohl Käufer als auch Verkäufer können Disputes eröffnen
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const { reason, description, attachments } = await request.json()

    if (!reason || !description) {
      return NextResponse.json(
        { message: 'Grund und Beschreibung sind erforderlich' },
        { status: 400 }
      )
    }

    // Lade Purchase mit allen relevanten Daten
    // WICHTIG: Explizites select um disputeInitiatedBy zu vermeiden (P2022)
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        watchId: true,
        buyerId: true,
        status: true,
        createdAt: true,
        disputeOpenedAt: true,
        disputeStatus: true,
        // disputeInitiatedBy wird NICHT selektiert (existiert möglicherweise noch nicht in DB)
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
                lastName: true,
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
            lastName: true,
            nickname: true,
          },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung (Käufer ODER Verkäufer kann Dispute eröffnen)
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, für diesen Kauf einen Dispute zu eröffnen' },
        { status: 403 }
      )
    }

    // Bestimme die Rolle und erlaubte Gründe
    const initiatorRole = isBuyer ? 'buyer' : 'seller'
    const allowedReasons = isBuyer ? DISPUTE_CONFIG.BUYER_REASONS : DISPUTE_CONFIG.SELLER_REASONS

    // Validiere den Dispute-Grund
    if (!allowedReasons.includes(reason)) {
      return NextResponse.json(
        {
          message: `Dieser Dispute-Grund ist für ${isBuyer ? 'Käufer' : 'Verkäufer'} nicht gültig`,
        },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein Dispute existiert
    if (purchase.disputeOpenedAt) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde bereits ein Dispute eröffnet' },
        { status: 400 }
      )
    }

    // Prüfe ob Kauf bereits storniert ist
    if (purchase.status === 'cancelled') {
      return NextResponse.json(
        { message: 'Für stornierte Käufe kann kein Dispute eröffnet werden' },
        { status: 400 }
      )
    }

    // Prüfe Frist: Dispute kann nur innerhalb von X Tagen eröffnet werden
    const purchaseDate = purchase.createdAt
    const deadlineDate = new Date(purchaseDate)
    deadlineDate.setDate(deadlineDate.getDate() + DISPUTE_CONFIG.OPEN_DEADLINE_DAYS)

    if (new Date() > deadlineDate) {
      return NextResponse.json(
        {
          message: `Die Frist für die Eröffnung eines Disputes ist abgelaufen. Disputes können nur innerhalb von ${DISPUTE_CONFIG.OPEN_DEADLINE_DAYS} Tagen nach dem Kauf eröffnet werden.`,
          deadlineExpired: true,
        },
        { status: 400 }
      )
    }

    // Berechne Deadlines (Ricardo-Style)
    const now = new Date()

    // Admin-Deadline: 14 Tage zur Lösung
    const disputeDeadline = new Date(now)
    disputeDeadline.setDate(disputeDeadline.getDate() + DISPUTE_CONFIG.RESOLUTION_DEADLINE_DAYS)

    // Verkäufer-Antwortfrist: 7 Tage zur Stellungnahme (nur für Käufer-initiierte Disputes)
    const sellerResponseDeadline = isBuyer ? new Date(now) : null
    if (sellerResponseDeadline) {
      sellerResponseDeadline.setDate(
        sellerResponseDeadline.getDate() + DISPUTE_CONFIG.SELLER_RESPONSE_DEADLINE_DAYS
      )
    }

    // Erstelle Dispute mit allen Ricardo-Style Feldern
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        disputeOpenedAt: now,
        disputeStatus: 'pending',
        disputeReason: reason,
        disputeDescription: description,
        disputeInitiatedBy: initiatorRole,
        disputeDeadline: disputeDeadline,
        disputeFrozenAt: now, // Kaufprozess einfrieren
        disputeAttachments: attachments ? JSON.stringify(attachments) : null,
        disputeReminderCount: 0,
        // Ricardo-Style: Verkäufer-Antwortfrist
        ...(sellerResponseDeadline && { sellerResponseDeadline }),
        // Eskalation auf 0 setzen
        disputeEscalationLevel: 0,
      },
    })

    // Erstelle ersten DisputeComment für die Historie
    try {
      await prisma.disputeComment.create({
        data: {
          purchaseId: id,
          userId: session.user.id,
          userRole: initiatorRole,
          type: 'comment',
          content: description,
          attachments: attachments ? JSON.stringify(attachments) : null,
        },
      })
    } catch (commentError) {
      console.error('[dispute] Fehler beim Erstellen des DisputeComment:', commentError)
    }

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(
        id,
        purchase.status || 'pending',
        session.user.id,
        `Dispute eröffnet von ${initiatorRole === 'buyer' ? 'Käufer' : 'Verkäufer'}: ${reason}`
      )
    } catch (error) {
      console.error('[dispute] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    // Bestimme die andere Partei
    const otherParty = isBuyer ? purchase.watch.seller : purchase.buyer
    const opener = isBuyer ? purchase.buyer : purchase.watch.seller
    const openerName =
      opener.nickname || opener.firstName || opener.name || (isBuyer ? 'Käufer' : 'Verkäufer')
    const otherPartyLink = isBuyer ? `/my-watches/selling/sold` : `/my-watches/buying/purchased`

    // === RICARDO-STYLE: Verbesserte Benachrichtigung mit Antwortfrist ===
    const responseDeadlineText = sellerResponseDeadline
      ? `\n\n⏰ WICHTIG: Sie haben bis zum ${sellerResponseDeadline.toLocaleDateString('de-CH')} Zeit, Stellung zu nehmen. Ohne Ihre Stellungnahme wird der Fall automatisch eskaliert.`
      : ''

    // Benachrichtigung an die andere Partei (mit Antwortfrist)
    try {
      await prisma.notification.create({
        data: {
          userId: otherParty.id,
          type: 'PURCHASE',
          title: isBuyer
            ? '🚨 Dispute eröffnet - Stellungnahme erforderlich'
            : '⚠️ Dispute eröffnet',
          message: `${openerName} hat einen Dispute für "${purchase.watch.title}" eröffnet. Grund: ${getReasonLabel(reason)}.${isBuyer ? ` Antwortfrist: ${sellerResponseDeadline?.toLocaleDateString('de-CH') || 'Keine'}` : ' Bitte warten Sie auf die Bearbeitung.'}`,
          link: otherPartyLink,
          watchId: purchase.watchId,
        },
      })
    } catch (error) {
      console.error('[dispute] Fehler beim Erstellen der Benachrichtigung:', error)
    }

    // E-Mail-Benachrichtigung an andere Partei (Ricardo-Style mit Deadline)
    try {
      const { getDisputeOpenedEmailRicardoStyle } = await import('@/lib/email')
      const { subject, html, text } = getDisputeOpenedEmailRicardoStyle(
        otherParty.nickname || otherParty.firstName || otherParty.name || 'Nutzer',
        openerName,
        purchase.watch.title,
        reason,
        description,
        isBuyer ? 'seller' : 'buyer',
        sellerResponseDeadline,
        purchase.id
      )

      await sendEmail({
        to: otherParty.email,
        subject,
        html,
        text,
      })
    } catch (emailError) {
      // Fallback auf alte Email-Funktion wenn neue nicht existiert
      console.error(
        '[dispute] Fehler beim Senden der Dispute-E-Mail (Ricardo-Style), versuche Fallback:',
        emailError
      )
      try {
        const { getDisputeOpenedEmail } = await import('@/lib/email')
        const { subject, html, text } = getDisputeOpenedEmail(
          otherParty.nickname || otherParty.firstName || otherParty.name || 'Nutzer',
          openerName,
          purchase.watch.title,
          reason,
          description,
          isBuyer ? 'seller' : 'buyer'
        )
        await sendEmail({
          to: otherParty.email,
          subject,
          html,
          text,
        })
      } catch (fallbackError) {
        console.error('[dispute] Auch Fallback-Email fehlgeschlagen:', fallbackError)
      }
    }

    // Benachrichtigung an Admins mit höherer Priorität
    try {
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true, email: true },
      })

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'PURCHASE',
            title: '🔔 Neuer Dispute - Aktion erforderlich',
            message: `Ein Dispute wurde für "${purchase.watch.title}" eröffnet. Grund: ${getReasonLabel(reason)}. Frist: ${disputeDeadline.toLocaleDateString('de-CH')}`,
            link: `/admin/disputes/${id}`,
            watchId: purchase.watchId,
          },
        })
      }

      // Optional: E-Mail an Admins für dringende Fälle
      if (reason === 'item_not_received' || reason === 'item_damaged') {
        for (const admin of admins) {
          if (admin.email) {
            try {
              await sendEmail({
                to: admin.email,
                subject: `🚨 Dringender Dispute: ${purchase.watch.title}`,
                html: `<p>Ein dringender Dispute wurde eröffnet.</p>
                       <p><strong>Grund:</strong> ${getReasonLabel(reason)}</p>
                       <p><strong>Artikel:</strong> ${purchase.watch.title}</p>
                       <p><strong>Frist:</strong> ${disputeDeadline.toLocaleDateString('de-CH')}</p>
                       <p><a href="${process.env.NEXTAUTH_URL}/admin/disputes/${id}">Zum Dispute</a></p>`,
                text: `Dringender Dispute für ${purchase.watch.title}. Grund: ${getReasonLabel(reason)}`,
              })
            } catch (e) {
              // Silent fail for admin emails
            }
          }
        }
      }
    } catch (error) {
      console.error('[dispute] Fehler beim Erstellen der Admin-Benachrichtigungen:', error)
    }

    console.log(`[dispute] Dispute eröffnet für Purchase ${id} von ${initiatorRole}`)

    return NextResponse.json({
      message:
        'Dispute erfolgreich eröffnet. Ein Admin wird sich innerhalb von 14 Tagen darum kümmern.',
      purchase: updatedPurchase,
      disputeDeadline: disputeDeadline.toISOString(),
    })
  } catch (error: any) {
    console.error('Error opening dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Eröffnen des Disputes: ' + error.message },
      { status: 500 }
    )
  }
}

// Helper: Dispute-Grund in lesbaren Text umwandeln
function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    item_not_received: 'Artikel nicht erhalten',
    item_damaged: 'Artikel beschädigt',
    item_wrong: 'Falscher Artikel geliefert',
    item_not_as_described: 'Artikel entspricht nicht der Beschreibung',
    payment_not_confirmed: 'Zahlung nicht bestätigt',
    payment_not_received: 'Zahlung nicht erhalten',
    seller_not_responding: 'Verkäufer antwortet nicht',
    buyer_not_responding: 'Käufer antwortet nicht',
    buyer_not_paying: 'Käufer zahlt nicht',
    other: 'Sonstiges',
  }
  return labels[reason] || reason
}

/**
 * GET: Dispute-Informationen abrufen
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true,
        disputeOpenedAt: true,
        disputeReason: true,
        disputeStatus: true,
        disputeResolvedAt: true,
        disputeResolvedBy: true,
        watch: {
          select: {
            sellerId: true,
          },
        },
        buyerId: true,
      },
    })

    if (!purchase) {
      return NextResponse.json({ message: 'Kauf nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung (Käufer, Verkäufer oder Admin)
    const isSeller = purchase.watch.sellerId === session.user.id
    const isBuyer = purchase.buyerId === session.user.id
    const isAdmin = session.user.isAdmin === true

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diese Dispute-Informationen abzurufen' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      dispute: {
        openedAt: purchase.disputeOpenedAt?.toISOString() || null,
        reason: purchase.disputeReason || null,
        status: purchase.disputeStatus || null,
        resolvedAt: purchase.disputeResolvedAt?.toISOString() || null,
        resolvedBy: purchase.disputeResolvedBy || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Dispute-Informationen: ' + error.message },
      { status: 500 }
    )
  }
}
