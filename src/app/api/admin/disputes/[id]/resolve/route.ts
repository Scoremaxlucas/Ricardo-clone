import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { addStatusHistory } from '@/lib/status-history'
import { isStripeConfigured, processDisputeRefund } from '@/lib/stripe-disputes'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST: Dispute durch Admin lösen
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const isAdminInSession = session?.user?.isAdmin === true

    // Prüfe ob User Admin ist (per ID oder E-Mail)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, email: true },
      })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true },
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Nur Admins können Disputes lösen.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const {
      resolution,
      refundBuyer,
      refundSeller,
      cancelPurchase,
      rejected,
      rejectionReason,
      // === RICARDO-STYLE: Manual Refund Management ===
      requireManualRefund, // Boolean: Seller must manually refund
      refundAmount, // Float: Amount to refund (can be partial)
      refundNote, // String: Admin note about refund
      issueWarning, // Boolean: Issue warning to seller
      warningReason, // String: Reason for warning
    } = await request.json()

    // Prüfe ob Dispute abgelehnt wird
    if (rejected === true) {
      if (!rejectionReason) {
        return NextResponse.json({ message: 'Ablehnungsgrund ist erforderlich' }, { status: 400 })
      }
    } else {
      if (!resolution) {
        return NextResponse.json({ message: 'Lösung ist erforderlich' }, { status: 400 })
      }
    }

    // Lade Purchase mit allen relevanten Daten für Stornierung
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
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

    // Prüfe ob es ein Dispute oder Stornierungsantrag ist
    const isDispute = purchase.disputeOpenedAt !== null
    const isCancellation = purchase.cancellationRequestedAt !== null

    if (!isDispute && !isCancellation) {
      return NextResponse.json(
        { message: 'Für diesen Kauf wurde weder ein Dispute noch ein Stornierungsantrag eröffnet' },
        { status: 400 }
      )
    }

    // Verwende die entsprechenden Status-Felder je nach Typ
    const currentStatus = isCancellation
      ? purchase.cancellationRequestStatus || 'pending'
      : purchase.disputeStatus || 'pending'

    if (currentStatus === 'resolved') {
      return NextResponse.json({ message: 'Dieser Antrag wurde bereits gelöst' }, { status: 400 })
    }

    // Bestimme wer den Antrag initiiert hat
    // Stornierungsanträge kommen immer vom Verkäufer
    // Disputes können von Käufer oder Verkäufer kommen
    let isInitiatedByBuyer: boolean
    let isInitiatedBySeller: boolean
    let disputeReason: string
    let existingDescription: string

    if (isCancellation) {
      // Stornierungsanträge kommen immer vom Verkäufer
      isInitiatedByBuyer = false
      isInitiatedBySeller = true
      disputeReason = purchase.cancellationRequestReason || ''
      existingDescription = purchase.cancellationRequestDescription || ''
    } else {
      // Disputes können von beiden kommen
      const buyerReasons = [
        'item_not_received',
        'item_damaged',
        'item_wrong',
        'payment_not_confirmed',
        'seller_not_responding',
        'other',
      ]
      const sellerReasons = ['payment_not_confirmed', 'buyer_not_responding', 'other']
      disputeReason = purchase.disputeReason || ''
      isInitiatedByBuyer = buyerReasons.includes(disputeReason)
      isInitiatedBySeller = sellerReasons.includes(disputeReason)
      existingDescription = purchase.disputeDescription || ''
    }

    // Prüfe ob Antrag abgelehnt wird
    if (rejected === true) {
      const adminRejection = `\n\n--- ADMIN-ABLEHNUNG ---\n${rejectionReason}`
      const newDescription = existingDescription + adminRejection

      const updateData: any = {}

      if (isCancellation) {
        updateData.cancellationRequestStatus = 'rejected'
        updateData.cancellationRequestResolvedAt = new Date()
        updateData.cancellationRequestResolvedBy = session.user.id
        updateData.cancellationRequestDescription = newDescription
      } else {
        updateData.disputeStatus = 'rejected'
        updateData.disputeResolvedAt = new Date()
        updateData.disputeResolvedBy = session.user.id
        updateData.disputeDescription = newDescription
      }

      const updatedPurchase = await prisma.purchase.update({
        where: { id },
        data: updateData,
      })

      // Benachrichtigungen für Ablehnung
      const sellerName =
        purchase.watch.seller.nickname ||
        purchase.watch.seller.firstName ||
        purchase.watch.seller.name ||
        'Verkäufer'
      const buyerName =
        purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'

      // Benachrichtigung an Initiator (Antrag wurde abgelehnt)
      const initiatorId = isInitiatedByBuyer ? purchase.buyerId : purchase.watch.sellerId
      const initiatorName = isInitiatedByBuyer ? buyerName : sellerName

      try {
        await prisma.notification.create({
          data: {
            userId: initiatorId,
            type: 'PURCHASE',
            title: '❌ Antrag abgelehnt',
            message: `Ihr ${isCancellation ? 'Stornierungsantrag' : 'Dispute'} für "${purchase.watch.title}" wurde abgelehnt. Grund: ${rejectionReason}`,
            link: isInitiatedByBuyer ? `/my-watches/buying/purchased` : `/my-watches/selling/sold`,
            watchId: purchase.watchId,
          },
        })
      } catch (error) {
        console.error('[dispute/resolve] Fehler bei Initiator-Benachrichtigung (Ablehnung):', error)
      }

      // E-Mail an Initiator
      try {
        const { getDisputeRejectedEmail } = await import('@/lib/email')
        const initiatorEmail = isInitiatedByBuyer
          ? purchase.buyer.email
          : purchase.watch.seller.email

        const { subject, html, text } = getDisputeRejectedEmail(
          initiatorName,
          purchase.watch.title,
          rejectionReason
        )

        await sendEmail({
          to: initiatorEmail,
          subject,
          html,
          text,
        })
      } catch (emailError) {
        console.error('[dispute/resolve] Fehler beim Senden der Ablehnungs-E-Mail:', emailError)
      }

      return NextResponse.json({
        message: `${isCancellation ? 'Stornierungsantrag' : 'Dispute'} erfolgreich abgelehnt`,
        purchase: updatedPurchase,
      })
    }

    // Verwende die entsprechenden Felder je nach Typ (existingDescription und disputeReason wurden bereits oben gesetzt)
    const adminResolution = `\n\n--- ADMIN-LÖSUNG ---\n${resolution}`
    const newDescription = existingDescription + adminResolution

    const updateData: any = {
      status: purchase.status,
    }

    // Setze die entsprechenden Felder je nach Typ
    if (isCancellation) {
      updateData.cancellationRequestStatus = 'resolved'
      updateData.cancellationRequestResolvedAt = new Date()
      updateData.cancellationRequestResolvedBy = session.user.id
      updateData.cancellationRequestDescription = newDescription
    } else {
      updateData.disputeStatus = 'resolved'
      updateData.disputeResolvedAt = new Date()
      updateData.disputeResolvedBy = session.user.id
      updateData.disputeDescription = newDescription
    }

    // Zusätzliche Felder für Stornierung
    if (cancelPurchase) {
      updateData.status = 'cancelled'
      updateData.paid = false
      updateData.paidAt = null
      updateData.paymentConfirmed = false
      updateData.paymentConfirmedAt = null
      updateData.itemReceived = false
      updateData.itemReceivedAt = null
    }

    // Storniere Purchase falls gewünscht
    if (cancelPurchase) {
      updateData.status = 'cancelled'

      // 1. Storniere zugehörige Rechnung (falls vorhanden)
      // Prüfe sowohl nach saleId als auch nach watchId in InvoiceItems
      try {
        // Suche Invoice über saleId (Purchase-ID)
        let invoice = await prisma.invoice.findFirst({
          where: {
            saleId: id,
            sellerId: purchase.watch.sellerId,
          },
        })

        // Falls nicht gefunden, suche über InvoiceItems mit watchId
        if (!invoice) {
          const invoiceItem = await prisma.invoiceItem.findFirst({
            where: {
              watchId: purchase.watchId,
            },
            include: {
              invoice: true,
            },
          })
          if (invoiceItem && invoiceItem.invoice.sellerId === purchase.watch.sellerId) {
            invoice = invoiceItem.invoice
          }
        }

        if (invoice) {
          // Storniere ursprüngliche Rechnung
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'cancelled',
              refundedAt: new Date(),
            },
          })
          console.log(`[dispute/resolve] ✅ Invoice ${invoice.invoiceNumber} wurde storniert`)

          // Erstelle Korrektur-Abrechnung (Storno-Rechnung)
          try {
            const { createCreditNoteForInvoice } = await import('@/lib/invoice')
            const creditNote = await createCreditNoteForInvoice(
              invoice.id,
              `Dispute-Storno: ${purchase.disputeReason || 'Unbekannt'}`
            )
            console.log(
              `[dispute/resolve] ✅ Korrektur-Abrechnung erstellt: ${creditNote.invoiceNumber}`
            )
          } catch (creditNoteError: any) {
            console.error(
              '[dispute/resolve] ❌ Fehler beim Erstellen der Korrektur-Abrechnung:',
              creditNoteError
            )
            // Fehler sollte nicht die Dispute-Lösung verhindern
          }
        }
      } catch (invoiceError: any) {
        console.error('[dispute/resolve] ❌ Fehler beim Stornieren der Invoice:', invoiceError)
        // Invoice-Fehler sollte nicht die Dispute-Lösung verhindern
      }

      // 2. Lösche zugehörigen Sale (falls vorhanden)
      try {
        const sale = await prisma.sale.findFirst({
          where: {
            watchId: purchase.watchId,
            sellerId: purchase.watch.sellerId,
            buyerId: purchase.buyerId,
          },
        })

        if (sale) {
          await prisma.sale.delete({
            where: { id: sale.id },
          })
          console.log(`[dispute/resolve] ✅ Sale ${sale.id} wurde gelöscht`)
        }
      } catch (saleError: any) {
        console.error('[dispute/resolve] ❌ Fehler beim Löschen des Sale:', saleError)
        // Sale-Fehler sollte nicht die Dispute-Lösung verhindern
      }

      // 3. RICARDO-STYLE: Artikel wird NICHT automatisch reaktiviert
      // Der Verkäufer muss den Artikel manuell neu einstellen, falls gewünscht
      // Dies gibt dem Verkäufer Kontrolle (Artikel könnte beschädigt sein, etc.)
      try {
        const watch = await prisma.watch.findUnique({
          where: { id: purchase.watchId },
          select: {
            id: true,
            title: true,
            auctionEnd: true,
            isAuction: true,
          },
        })

        if (watch) {
          // Setze auctionEnd auf Vergangenheit, damit der Artikel als "beendet" gilt
          // Der Verkäufer kann ihn dann über "Mein Verkaufen" manuell reaktivieren
          const pastDate = new Date()
          pastDate.setDate(pastDate.getDate() - 1) // Gestern

          await prisma.watch.update({
            where: { id: purchase.watchId },
            data: {
              auctionEnd: pastDate,
              // Optional: Markiere als storniert für bessere Übersicht
            },
          })

          console.log(
            `[dispute/resolve] ℹ️  RICARDO-STYLE: Watch ${purchase.watchId} bleibt INAKTIV. ` +
            `Verkäufer muss manuell reaktivieren falls gewünscht.`
          )

          // Sende Info-E-Mail an Verkäufer
          try {
            const sellerEmail = purchase.watch.seller?.email
            const sellerName = purchase.watch.seller?.firstName ||
                              purchase.watch.seller?.name ||
                              'Verkäufer'

            if (sellerEmail) {
              await sendEmail({
                to: sellerEmail,
                subject: `Dispute gelöst - Artikel "${watch.title}" kann neu eingestellt werden`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0d9488;">Dispute wurde gelöst</h2>
                    <p>Hallo ${sellerName},</p>
                    <p>Der Dispute für Ihren Artikel <strong>"${watch.title}"</strong> wurde gelöst und der Kauf wurde storniert.</p>
                    <p><strong>Der Artikel ist jetzt inaktiv.</strong></p>
                    <p>Falls Sie den Artikel erneut verkaufen möchten, können Sie ihn in Ihrem Dashboard unter "Mein Verkaufen" → "Beendete Artikel" wieder aktivieren oder als neues Angebot einstellen.</p>
                    <p style="margin-top: 20px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://helvenda.ch'}/my-watches/selling"
                         style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Zu meinen Verkäufen
                      </a>
                    </p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                      Bei Fragen kontaktieren Sie uns unter support@helvenda.ch
                    </p>
                  </div>
                `,
              })
              console.log(`[dispute/resolve] ✅ Info-E-Mail an Verkäufer ${sellerEmail} gesendet`)
            }
          } catch (emailError: any) {
            console.error('[dispute/resolve] ⚠️ Fehler beim Senden der Verkäufer-Info-E-Mail:', emailError)
            // E-Mail-Fehler sollte nicht die Dispute-Lösung verhindern
          }
        }
      } catch (watchError: any) {
        console.error('[dispute/resolve] ❌ Fehler beim Deaktivieren des Watch:', watchError)
      }

      // 4. Setze Purchase-Felder zurück
      updateData.paid = false
      updateData.paidAt = null
      updateData.paymentConfirmed = false
      updateData.paymentConfirmedAt = null
      updateData.itemReceived = false
      updateData.itemReceivedAt = null

      console.log(`[dispute/resolve] ✅ Purchase ${id} wurde vollständig storniert`)
    } else {
      // Wenn nicht storniert, aber refundBuyer oder refundSeller, setze entsprechende Felder zurück
      if (refundBuyer) {
        updateData.paid = false
        updateData.paidAt = null
        updateData.paymentConfirmed = false
        updateData.paymentConfirmedAt = null

        // === STRIPE REFUND ===
        // If we have a Stripe PaymentIntent, process the refund
        if (purchase.stripePaymentIntentId) {
          try {
            const refundResult = await processDisputeRefund(
              purchase.stripePaymentIntentId,
              purchase.price || undefined,
              disputeReason
            )

            if (refundResult.success) {
              updateData.stripeRefundId = refundResult.refundId
              updateData.stripeRefundStatus = refundResult.status
              updateData.stripeRefundedAt = new Date()
              console.log(`[dispute/resolve] ✅ Stripe refund processed: ${refundResult.refundId}`)
            } else {
              console.error(`[dispute/resolve] ❌ Stripe refund failed: ${refundResult.error}`)
              // Mark that the refund needs manual attention
              updateData.stripeRefundStatus = 'failed'
              updateData.disputeRefundRequired = true
              updateData.disputeRefundNote = `Stripe Rückerstattung fehlgeschlagen: ${refundResult.error || 'Unbekannter Fehler'}. Manuelle Prüfung erforderlich.`
            }
          } catch (stripeError: any) {
            console.error('[dispute/resolve] ❌ Stripe refund error:', stripeError)
            // Mark that the refund needs manual attention
            updateData.stripeRefundStatus = 'failed'
            updateData.disputeRefundRequired = true
            updateData.disputeRefundNote = `Stripe Rückerstattung fehlgeschlagen: ${stripeError.message}. Manuelle Prüfung erforderlich.`
          }
        } else if (isStripeConfigured()) {
          console.log('[dispute/resolve] ℹ️  No Stripe PaymentIntent found, manual refund required')
        }
      }
      if (refundSeller) {
        updateData.itemReceived = false
        updateData.itemReceivedAt = null
      }
    }

    // === RICARDO-STYLE: Manual Refund Management ===
    if (requireManualRefund && !purchase.stripePaymentIntentId) {
      // Set refund deadline (14 days from now)
      const refundDeadline = new Date()
      refundDeadline.setDate(refundDeadline.getDate() + 14)

      updateData.disputeRefundRequired = true
      updateData.disputeRefundAmount = refundAmount || purchase.price || 0
      updateData.disputeRefundDeadline = refundDeadline
      updateData.disputeRefundMethod = 'seller_manual'
      updateData.disputeRefundNote = refundNote || null

      console.log(
        `[dispute/resolve] Manual refund required: CHF ${refundAmount || purchase.price} by ${refundDeadline.toISOString()}`
      )
    }

    // Führe Update durch
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: updateData,
    })

    // Füge Status-Historie hinzu
    try {
      await addStatusHistory(
        id,
        updateData.status || purchase.status || 'pending',
        session.user.id,
        `${isCancellation ? 'Stornierungsantrag' : 'Dispute'} gelöst: ${resolution}`
      )
    } catch (error) {
      console.error('[dispute/resolve] Fehler beim Hinzufügen der Status-Historie:', error)
    }

    // Bestimme wer den Dispute initiiert hat und wer "verliert"
    const sellerName =
      purchase.watch.seller.nickname ||
      purchase.watch.seller.firstName ||
      purchase.watch.seller.name ||
      'Verkäufer'
    const buyerName =
      purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || 'Käufer'

    // Bestimme Verlierer basierend auf Lösung und Dispute-Grund
    // Wenn cancelPurchase = true, verliert der Verkäufer (Kauf wird storniert, keine Kommission)
    // Wenn refundBuyer = true, verliert der Verkäufer (Rückerstattung an Käufer)
    // Wenn refundSeller = true, verliert der Käufer (Rückerstattung an Verkäufer)
    // Wenn cancelPurchase = true UND Antrag wurde vom Käufer initiiert, verliert der Käufer nicht (er bekommt sein Geld zurück)
    // Wenn cancelPurchase = true UND Antrag wurde vom Verkäufer initiiert, verliert der Verkäufer (er verliert den Verkauf)
    const isLoserBuyer = refundSeller === true || (cancelPurchase && isInitiatedBySeller)
    const isLoserSeller =
      refundBuyer === true ||
      (cancelPurchase && isInitiatedByBuyer) ||
      (cancelPurchase && !isInitiatedByBuyer && !isInitiatedBySeller)

    // === RICARDO-STYLE: Issue Warning to Seller ===
    if (issueWarning === true && isLoserSeller) {
      try {
        const seller = await prisma.user.findUnique({
          where: { id: purchase.watch.sellerId },
          select: { disputeWarningCount: true, disputesLostCount: true },
        })

        const newWarningCount = (seller?.disputeWarningCount || 0) + 1
        const newDisputesLostCount = (seller?.disputesLostCount || 0) + 1
        const maxWarnings = 3

        await prisma.user.update({
          where: { id: purchase.watch.sellerId },
          data: {
            disputeWarningCount: newWarningCount,
            disputesLostCount: newDisputesLostCount,
            lastDisputeWarningAt: new Date(),
            // Restrict seller if they have too many warnings
            ...(newWarningCount >= maxWarnings && {
              disputeRestrictionLevel: 'limited',
            }),
          },
        })

        // Update purchase with warning info
        await prisma.purchase.update({
          where: { id },
          data: {
            sellerWarningIssued: true,
            sellerWarningIssuedAt: new Date(),
            sellerWarningReason: warningReason || 'Dispute zugunsten des Käufers entschieden',
          },
        })

        // Send warning email to seller
        try {
          const { getSellerWarningEmail } = await import('@/lib/email')
          const { subject, html, text } = getSellerWarningEmail(
            sellerName,
            newWarningCount,
            warningReason || 'Dispute zugunsten des Käufers entschieden',
            purchase.watch.title,
            purchase.id
          )
          await sendEmail({
            to: purchase.watch.seller.email,
            subject,
            html,
            text,
          })
        } catch (e) {
          console.error('[dispute/resolve] Error sending warning email:', e)
        }

        console.log(
          `[dispute/resolve] Warning #${newWarningCount} issued to seller ${purchase.watch.sellerId}`
        )

        // Create audit trail
        await prisma.disputeComment.create({
          data: {
            purchaseId: id,
            userId: session.user.id,
            userRole: 'admin',
            type: 'status_change',
            content: `Verwarnung #${newWarningCount} ausgestellt: ${warningReason || 'Dispute zugunsten des Käufers'}`,
            isInternal: true,
          },
        })
      } catch (warningError: any) {
        console.error('[dispute/resolve] Error issuing warning:', warningError)
      }
    } else if (isLoserSeller) {
      // Still increment disputes lost count even without warning
      try {
        await prisma.user.update({
          where: { id: purchase.watch.sellerId },
          data: {
            disputesLostCount: { increment: 1 },
          },
        })
      } catch (e) {
        console.error('[dispute/resolve] Error incrementing disputes lost count:', e)
      }
    }

    // === RICARDO-STYLE: Send Manual Refund Email to Seller ===
    if (requireManualRefund && !purchase.stripePaymentIntentId) {
      try {
        const { getRefundRequiredEmail } = await import('@/lib/email')
        const refundDeadline = new Date()
        refundDeadline.setDate(refundDeadline.getDate() + 14)

        const { subject, html, text } = getRefundRequiredEmail(
          sellerName,
          buyerName,
          purchase.watch.title,
          refundAmount || purchase.price || 0,
          refundDeadline,
          purchase.id,
          refundNote
        )

        await sendEmail({
          to: purchase.watch.seller.email,
          subject,
          html,
          text,
        })

        // Notify seller via notification
        await prisma.notification.create({
          data: {
            userId: purchase.watch.sellerId,
            type: 'DISPUTE_REFUND_REQUIRED',
            title: '💰 Rückerstattung erforderlich',
            message: `Sie müssen CHF ${(refundAmount || purchase.price || 0).toFixed(2)} an ${buyerName} zurückerstatten. Frist: ${refundDeadline.toLocaleDateString('de-CH')}`,
            link: `/disputes/${id}`,
            watchId: purchase.watchId,
            purchaseId: purchase.id,
          },
        })
      } catch (emailError: any) {
        console.error('[dispute/resolve] Error sending refund required email:', emailError)
      }
    }

    // Generiere generische Nachricht für Verlierer
    const generateLoserMessage = (
      disputeReason: string,
      resolution: string,
      cancelPurchase: boolean,
      refundBuyer: boolean,
      refundSeller: boolean
    ) => {
      let reasonText = ''
      switch (disputeReason) {
        case 'item_not_received':
          reasonText = 'Sie haben das Artikel nicht erhalten'
          break
        case 'item_damaged':
          reasonText = 'Sie haben einen beschädigten Artikel erhalten'
          break
        case 'item_wrong':
          reasonText = 'Sie haben einen falschen Artikel erhalten'
          break
        case 'payment_not_confirmed':
          reasonText = 'Sie haben die Zahlung nicht bestätigt'
          break
        case 'seller_not_responding':
          reasonText = 'Sie haben nicht auf Nachrichten geantwortet'
          break
        case 'buyer_not_responding':
          reasonText = 'Sie haben nicht auf Nachrichten geantwortet'
          break
        default:
          reasonText = 'Ihr Dispute-Grund'
      }

      if (cancelPurchase) {
        return `Weil ${reasonText}, wurde der Kauf storniert. ${resolution}`
      } else if (refundBuyer) {
        return `Weil ${reasonText}, wurde dem Käufer eine Rückerstattung gewährt. ${resolution}`
      } else if (refundSeller) {
        return `Weil ${reasonText}, wurde dem Verkäufer eine Rückerstattung gewährt. ${resolution}`
      }
      return `Weil ${reasonText}, wurde folgende Lösung beschlossen: ${resolution}`
    }

    // Generiere Nachricht für Initiator (Erfolg)
    const generateInitiatorMessage = (
      resolution: string,
      cancelPurchase: boolean,
      refundBuyer: boolean,
      refundSeller: boolean
    ) => {
      const typeLabel = isCancellation ? 'Stornierungsantrag' : 'Dispute'
      if (cancelPurchase) {
        const relistMessage = isCancellation
          ? ' Der Artikel steht automatisch wieder als aktiver Artikel zum Verkauf.'
          : ''
        return `Ihr ${typeLabel} war erfolgreich. Der Kauf wurde storniert.${relistMessage} ${resolution}`
      } else if (refundBuyer && isInitiatedByBuyer) {
        return `Ihr ${typeLabel} war erfolgreich. Ihnen wurde eine Rückerstattung gewährt. ${resolution}`
      } else if (refundSeller && isInitiatedBySeller) {
        return `Ihr ${typeLabel} war erfolgreich. Ihnen wurde eine Rückerstattung gewährt. ${resolution}`
      }
      return `Ihr ${typeLabel} wurde gelöst. ${resolution}`
    }

    // Benachrichtigung an Initiator (Erfolg)
    const initiatorId = isInitiatedByBuyer ? purchase.buyerId : purchase.watch.sellerId
    const initiatorName = isInitiatedByBuyer ? buyerName : sellerName
    const initiatorMessage = generateInitiatorMessage(
      resolution,
      cancelPurchase || false,
      refundBuyer || false,
      refundSeller || false
    )

    try {
        await prisma.notification.create({
          data: {
            userId: initiatorId,
            type: 'DISPUTE_RESOLVED',
            title: `✅ ${isCancellation ? 'Stornierungsantrag' : 'Dispute'} erfolgreich gelöst`,
            message: initiatorMessage,
            link: isInitiatedByBuyer ? `/my-watches/buying/purchased` : `/my-watches/selling/sold`,
            watchId: purchase.watchId,
            purchaseId: purchase.id,
          },
        })
    } catch (error) {
      console.error('[dispute/resolve] Fehler bei Initiator-Benachrichtigung:', error)
    }

    // Benachrichtigung an Verlierer (falls vorhanden)
    if (isLoserBuyer || isLoserSeller) {
      const loserId = isLoserBuyer ? purchase.buyerId : purchase.watch.sellerId
      const loserName = isLoserBuyer ? buyerName : sellerName
      const loserMessage = generateLoserMessage(
        disputeReason,
        resolution,
        cancelPurchase || false,
        refundBuyer || false,
        refundSeller || false
      )

      try {
        await prisma.notification.create({
          data: {
            userId: loserId,
            type: 'DISPUTE_RESOLVED',
            title: `⚠️ ${isCancellation ? 'Stornierungsantrag' : 'Dispute'} gelöst`,
            message: loserMessage,
            link: isLoserBuyer ? `/my-watches/buying/purchased` : `/my-watches/selling/sold`,
            watchId: purchase.watchId,
            purchaseId: purchase.id,
          },
        })
      } catch (error) {
        console.error('[dispute/resolve] Fehler bei Verlierer-Benachrichtigung:', error)
      }
    }

    // E-Mail-Benachrichtigungen
    try {
      const { getDisputeResolvedEmail } = await import('@/lib/email')

      // E-Mail an Initiator (Erfolg)
      const initiatorEmailData = getDisputeResolvedEmail(
        initiatorName,
        isInitiatedByBuyer ? sellerName : buyerName,
        purchase.watch.title,
        initiatorMessage,
        isInitiatedByBuyer ? 'buyer' : 'seller',
        'initiator',
        isCancellation && cancelPurchase // Artikel steht wieder zum Verkauf
      )
      const initiatorEmail = isInitiatedByBuyer ? purchase.buyer.email : purchase.watch.seller.email
      await sendEmail({
        to: initiatorEmail,
        subject: initiatorEmailData.subject,
        html: initiatorEmailData.html,
        text: initiatorEmailData.text,
      })

      // E-Mail an Verlierer (falls vorhanden)
      if (isLoserBuyer || isLoserSeller) {
        const loserId = isLoserBuyer ? purchase.buyerId : purchase.watch.sellerId
        const loserName = isLoserBuyer ? buyerName : sellerName
        const loserEmail = isLoserBuyer ? purchase.buyer.email : purchase.watch.seller.email
        const loserMessage = generateLoserMessage(
          disputeReason,
          resolution,
          cancelPurchase || false,
          refundBuyer || false,
          refundSeller || false
        )

        const loserEmailData = getDisputeResolvedEmail(
          loserName,
          isLoserBuyer ? sellerName : buyerName,
          purchase.watch.title,
          loserMessage,
          isLoserBuyer ? 'buyer' : 'seller',
          'loser',
          false // Verlierer bekommt keine Info über Wiederaktivierung
        )

        await sendEmail({
          to: loserEmail,
          subject: loserEmailData.subject,
          html: loserEmailData.html,
          text: loserEmailData.text,
        })
      }
    } catch (emailError) {
      console.error('[dispute/resolve] Fehler beim Senden der E-Mails:', emailError)
    }

    console.log(
      `[dispute/resolve] Admin ${session.user.id} hat ${isCancellation ? 'Stornierungsantrag' : 'Dispute'} für Purchase ${id} gelöst`
    )

    return NextResponse.json({
      message: `${isCancellation ? 'Stornierungsantrag' : 'Dispute'} erfolgreich gelöst`,
      purchase: updatedPurchase,
    })
  } catch (error: any) {
    console.error('Error resolving dispute:', error)
    return NextResponse.json(
      { message: 'Fehler beim Lösen des Disputes: ' + error.message },
      { status: 500 }
    )
  }
}
