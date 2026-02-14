import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/create-notification'
import { prisma } from '@/lib/prisma'
import { broadcastBidEvent, broadcastAuctionUpdate } from '@/lib/realtime-broadcast'
import { shouldSendNotification } from '@/lib/notification-preferences'
import { checkRateLimit } from '@/lib/rate-limit'

// Neues Gebot erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // SECURITY: Rate limiting - max 30 bids per user per minute (prevents bid spam)
    const rateLimitResult = await checkRateLimit({
      identifier: `bid:${session.user.id}`,
      limit: 30,
      window: 60, // 1 minute
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          message: 'Zu viele Gebote. Bitte warten Sie einen Moment.',
          retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    // Keine Käufer-Verifizierung nötig (wie Ricardo)
    // Verifizierung nur für Verkäufer beim Erstellen von Angeboten

    const data = await request.json()
    const { watchId, amount, isBuyNow = false, isMaxBid = false, maxAmount } = data

    if (!watchId || (!amount && !isMaxBid)) {
      return NextResponse.json({ message: 'watchId und Betrag sind erforderlich' }, { status: 400 })
    }

    // Automatisches Gebot (Maximalgebot)
    if (isMaxBid && maxAmount) {
      if (maxAmount <= 0) {
        return NextResponse.json(
          { message: 'Maximalgebot muss größer als 0 sein' },
          { status: 400 }
        )
      }

      // Hole das Angebot
      const watch = await prisma.watch.findUnique({
        where: { id: watchId },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
          },
        },
      })

      if (!watch) {
        return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
      }

      // Prüfe ob Auktion noch läuft
      const now = new Date()
      const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null

      if (auctionEndDate && auctionEndDate < now) {
        return NextResponse.json({ message: 'Die Auktion ist bereits beendet' }, { status: 400 })
      }

      const highestBid = watch.bids[0]
      const minBid = highestBid ? highestBid.amount + 1.0 : watch.price

      // Prüfe ob Maximalgebot hoch genug ist
      if (maxAmount < minBid) {
        return NextResponse.json(
          { message: `Das Maximalgebot muss mindestens CHF ${minBid.toFixed(2)} betragen` },
          { status: 400 }
        )
      }

      // Erstelle oder aktualisiere MaxBid
      const maxBid = await prisma.maxBid.upsert({
        where: {
          watchId_userId: {
            watchId,
            userId: session.user.id,
          },
        },
        create: {
          watchId,
          userId: session.user.id,
          maxAmount,
          currentBid: minBid, // Starte mit Mindestgebot
        },
        update: {
          maxAmount,
          currentBid: minBid, // Aktualisiere aktuelles Gebot
        },
      })

      // Erstelle Gebot wenn MaxBid höher als aktuelles Höchstgebot
      if (maxBid.currentBid && maxBid.currentBid >= minBid) {
        const bid = await prisma.bid.create({
          data: {
            watchId,
            userId: session.user.id,
            amount: maxBid.currentBid,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
              },
            },
          },
        })

        // Aktualisiere lastBidAt
        await prisma.watch.update({
          where: { id: watchId },
          data: {
            lastBidAt: now,
          },
        })

        return NextResponse.json({
          message: `Maximalgebot von CHF ${maxAmount.toFixed(2)} gesetzt. Aktuelles Gebot: CHF ${maxBid.currentBid.toFixed(2)}`,
          maxBid,
          bid,
        })
      }

      return NextResponse.json({
        message: `Maximalgebot von CHF ${maxAmount.toFixed(2)} gesetzt. Es wird automatisch geboten, wenn Sie überboten werden.`,
        maxBid,
      })
    }

    // Hole das Angebot
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
            firstName: true,
          },
        },
        bids: {
          orderBy: { amount: 'desc' }, // Sortiere nach Betrag, nicht nach Datum
          take: 1, // Nur das höchste Gebot
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
                firstName: true,
              },
            },
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der User der Verkäufer ist - Verkäufer können nicht bei eigenen Angeboten mitbieten
    if (watch.sellerId === session.user.id) {
      return NextResponse.json(
        { message: 'Als Verkäufer können Sie nicht bei Ihrem eigenen Angebot mitbieten.' },
        { status: 403 }
      )
    }

    // Sofortkauf
    if (isBuyNow) {
      // Prüfe ob bereits ein Purchase existiert (Angebot bereits verkauft)
      const existingPurchase = await prisma.purchase.findFirst({
        where: { watchId },
      })

      if (existingPurchase) {
        return NextResponse.json(
          { message: 'Dieses Angebot wurde bereits verkauft' },
          { status: 400 }
        )
      }

      if (!watch.buyNowPrice) {
        return NextResponse.json({ message: 'Sofortpreis nicht verfügbar' }, { status: 400 })
      }

      if (amount !== watch.buyNowPrice) {
        return NextResponse.json(
          { message: 'Der Sofortpreis beträgt CHF ' + watch.buyNowPrice.toFixed(2) },
          { status: 400 }
        )
      }

      // Erstelle Gebot für Sofortkauf
      const bid = await prisma.bid.create({
        data: {
          watchId,
          userId: session.user.id,
          amount: watch.buyNowPrice,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true,
              image: true,
            },
          },
        },
      })

      // Beende das Angebot sofort (setze auctionEnd auf jetzt)
      await prisma.watch.update({
        where: { id: watchId },
        data: {
          auctionEnd: new Date(), // Beendet die Auktion sofort
        },
      })

      // Berechne Kontaktfrist (7 Tage nach Purchase)
      const contactDeadline = new Date()
      contactDeadline.setDate(contactDeadline.getDate() + 7)

      // Erstelle Purchase-Eintrag
      const purchase = await prisma.purchase.create({
        data: {
          watchId,
          buyerId: session.user.id,
          price: watch.buyNowPrice || watch.price, // Speichere den tatsächlichen Kaufpreis
          contactDeadline: contactDeadline, // 7-Tage-Kontaktfrist
        },
        include: {
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
          watch: {
            select: {
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
        },
      })

      console.log(
        `[bids] Purchase erstellt: ID=${purchase.id}, buyerId=${session.user.id}, watchId=${watchId}, price=${watch.buyNowPrice || watch.price}`
      )

      // Erstelle Rechnung SOFORT nach erfolgreichem Verkauf
      let invoice = null
      try {
        const { calculateInvoiceForSale } = await import('@/lib/invoice')
        invoice = await calculateInvoiceForSale(purchase.id)
        console.log(
          `[bids] ✅ Rechnung erstellt: ${invoice.invoiceNumber} für Seller ${purchase.watch.sellerId} (sofort nach Verkauf)`
        )
      } catch (invoiceError: unknown) {
        console.error('[bids] ❌ Fehler bei Rechnungserstellung:', invoiceError)
        // Fehler wird geloggt, aber Purchase bleibt bestehen
      }

      // Sende E-Mail-Benachrichtigung an Verkäufer (wenn aktiviert)
      try {
        const shouldSendSale = await shouldSendNotification(purchase.watch.sellerId, 'emailOnSaleCompleted')
        if (shouldSendSale) {
          const { sendEmail, getSaleNotificationEmail } = await import('@/lib/email')
          const seller = purchase.watch.seller
          const buyer = purchase.buyer
          const sellerName = seller.nickname || seller.firstName || seller.name || 'Verkäufer'
          const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'

          const { subject, html, text } = getSaleNotificationEmail(
            sellerName,
            buyerName,
            purchase.watch.title,
            watch.buyNowPrice || watch.price,
            'buy-now',
            watchId
          )

          await sendEmail({
            to: seller.email,
            subject,
            html,
            text,
            userId: purchase.watch.sellerId,
          })

          console.log(`[bids] ✅ Verkaufs-E-Mail gesendet an ${seller.email}`)
        } else {
          console.log(`[bids] ⏭️ Verkaufs-E-Mail übersprungen (Präferenz deaktiviert)`)
        }
      } catch (emailError: unknown) {
        console.error('Fehler beim Senden der Verkaufs-E-Mail:', emailError)
        // E-Mail-Fehler sollte den Kauf nicht verhindern
      }

      // Erstelle Benachrichtigung für Verkäufer
      try {
        const buyer = purchase.buyer
        const buyerName =
          buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Ein Käufer'
        await createNotification({
          userId: watch.sellerId,
          type: 'PURCHASE',
          title: 'Ihr Artikel wurde verkauft',
          message: `${buyerName} hat "${watch.title}" für CHF ${(watch.buyNowPrice || watch.price).toFixed(2)} gekauft`,
          watchId: watchId,
          link: `/my-watches/selling/sold`,
        })
        console.log(`[bids] ✅ Verkaufs-Benachrichtigung für Seller ${watch.sellerId} erstellt`)
      } catch (notificationError: unknown) {
        console.error(
          '[bids] ❌ Fehler beim Erstellen der Verkaufs-Benachrichtigung:',
          notificationError
        )
        // Fehler sollte den Kauf nicht verhindern
      }

      // Sende Bestätigungs-E-Mail an Käufer (wenn aktiviert)
      try {
        const shouldSendPurchase = await shouldSendNotification(session.user.id, 'emailOnPurchase')
        if (shouldSendPurchase) {
          const { sendEmail, getPurchaseConfirmationEmail } = await import('@/lib/email')
          const { getShippingCost } = await import('@/lib/shipping')
          const seller = purchase.watch.seller
          const buyer = purchase.buyer
          const buyerName = buyer.nickname || buyer.firstName || buyer.name || buyer.email || 'Käufer'
          const sellerName =
            seller.nickname || seller.firstName || seller.name || seller.email || 'Verkäufer'

          // Berechne Versandkosten
          const shippingMethod = watch.shippingMethod
          let shippingMethods: any = null
          try {
            if (shippingMethod) {
              shippingMethods =
                typeof shippingMethod === 'string' ? JSON.parse(shippingMethod) : shippingMethod
            }
          } catch {
            shippingMethods = null
          }
          const shippingCost = getShippingCost(shippingMethods)

          // Generiere automatische Zahlungsinformationen SOFORT nach Kauf
          let paymentInfo = null
          try {
            const { generatePaymentInfo } = await import('@/lib/payment-info')
            paymentInfo = await generatePaymentInfo(purchase.id)
            console.log(`[bids] ✅ Zahlungsinformationen generiert für Purchase ${purchase.id}`)
          } catch (paymentInfoError: unknown) {
            const paymentInfoMsg =
              paymentInfoError instanceof Error ? paymentInfoError.message : 'Ein Fehler ist aufgetreten'
            console.warn(
              '[bids] ⚠️  Konnte Zahlungsinformationen nicht generieren:',
              paymentInfoMsg
            )
          }

          const { subject, html, text } = getPurchaseConfirmationEmail(
            buyerName,
            sellerName,
            watch.title,
            watch.buyNowPrice || watch.price,
            shippingCost,
            'buy-now',
            purchase.id,
            watchId,
            paymentInfo // Zahlungsinformationen übergeben
          )

          await sendEmail({
            to: buyer.email,
            subject,
            html,
            text,
            userId: session.user.id,
          })

          console.log(
            `[bids] ✅ Kaufbestätigungs-E-Mail mit Zahlungsinformationen gesendet an Käufer ${buyer.email}`
          )
        } else {
          console.log(`[bids] ⏭️ Kaufbestätigungs-E-Mail übersprungen (Präferenz deaktiviert)`)
        }
      } catch (emailError: unknown) {
        console.error('[bids] ❌ Fehler beim Senden der Kaufbestätigungs-E-Mail:', emailError)
        // E-Mail-Fehler sollte den Kauf nicht verhindern
      }

      return NextResponse.json({
        message: 'Sofortkauf erfolgreich! Das Angebot wurde beendet.',
        bid,
        purchase,
      })
    }

    // Normales Gebot (Auktion)
    // Prüfe ob bereits ein Purchase existiert (Angebot bereits verkauft)
    const existingPurchase = await prisma.purchase.findFirst({
      where: { watchId },
    })

    if (existingPurchase) {
      return NextResponse.json(
        { message: 'Dieses Angebot wurde bereits verkauft' },
        { status: 400 }
      )
    }

    // Prüfe ob Auktion noch läuft
    const now = new Date()
    const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null

    if (auctionEndDate && auctionEndDate < now) {
      return NextResponse.json({ message: 'Die Auktion ist bereits beendet' }, { status: 400 })
    }

    // Prüfe Mindestgebot
    const highestBid = watch.bids[0]
    const minBid = highestBid ? highestBid.amount + 1.0 : watch.price

    if (amount < minBid) {
      return NextResponse.json(
        { message: `Das Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen` },
        { status: 400 }
      )
    }

    // Prüfe, dass das Gebot nicht gleich dem aktuellen Höchstgebot ist
    if (highestBid && amount === highestBid.amount) {
      return NextResponse.json(
        {
          message: `Das Gebot muss höher sein als CHF ${highestBid.amount.toFixed(2)}. Das nächste Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen.`,
        },
        { status: 400 }
      )
    }

    // Prüfe automatische Gebote (MaxBids) und erhöhe sie wenn nötig
    const maxBids = await prisma.maxBid.findMany({
      where: {
        watchId,
        userId: { not: session.user.id }, // Nicht der aktuelle Bieter
        maxAmount: { gte: minBid }, // MaxBid ist hoch genug
      },
      orderBy: { maxAmount: 'desc' },
    })

    // Alle kritischen DB-Schreiboperationen in einer Transaktion ausführen
    const { bid, finalAmount, automaticBidsCreated, newAuctionEnd } = await prisma.$transaction(
      async (tx) => {
        // 1. Erhöhe automatische Gebote wenn nötig (batch statt N+1)
        const toCreate: { watchId: string; userId: string; amount: number }[] = []
        const toUpdateMaxBid: { id: string; currentBid: number }[] = []

        for (const maxBid of maxBids) {
          if (maxBid.maxAmount >= minBid) {
            const newBidAmount = Math.min(maxBid.maxAmount, amount + 1.0) // Biete CHF 1 mehr als das neue Gebot, aber nicht mehr als MaxBid

            if (newBidAmount > (maxBid.currentBid || 0)) {
              toCreate.push({
                watchId,
                userId: maxBid.userId,
                amount: newBidAmount,
              })
              toUpdateMaxBid.push({ id: maxBid.id, currentBid: newBidAmount })
            }
          }
        }

        if (toCreate.length > 0) {
          await tx.bid.createMany({ data: toCreate })
          await Promise.all(
            toUpdateMaxBid.map(({ id, currentBid }) =>
              tx.maxBid.update({ where: { id }, data: { currentBid } })
            )
          )
        }

        // 2. Hole aktuelles Höchstgebot nach automatischen Geboten
        const currentHighestBid = await tx.bid.findFirst({
          where: { watchId },
          orderBy: { amount: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
              },
            },
          },
        })

        // 3. Prüfe ob automatische Gebote das aktuelle Gebot überboten haben
        const computedFinalAmount =
          currentHighestBid &&
          currentHighestBid.userId !== session.user.id &&
          currentHighestBid.amount >= amount
            ? currentHighestBid.amount + 1.0 // Erhöhe um CHF 1 wenn automatisches Gebot vorhanden
            : amount

        // 4. Automatische Verlängerung: Wenn Gebot in den letzten 3 Minuten vor Ablauf
        let newAuctionEnd = auctionEndDate
        if (auctionEndDate) {
          const timeUntilEnd = auctionEndDate.getTime() - now.getTime()
          const threeMinutes = 3 * 60 * 1000 // 3 Minuten in Millisekunden

          if (timeUntilEnd <= threeMinutes && timeUntilEnd > 0) {
            newAuctionEnd = new Date(now.getTime() + threeMinutes)
          }
        }

        // 5. Erstelle Hauptgebot
        const createdBid = await tx.bid.create({
          data: {
            watchId,
            userId: session.user.id,
            amount: computedFinalAmount,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
              },
            },
          },
        })

        // 6. Aktualisiere auctionEnd falls verlängert und setze lastBidAt
        if (newAuctionEnd && newAuctionEnd !== auctionEndDate) {
          await tx.watch.update({
            where: { id: watchId },
            data: {
              auctionEnd: newAuctionEnd,
              lastBidAt: now, // Track Last-Minute-Gebot für Auto-Verlängerung
            },
          })
        } else {
          await tx.watch.update({
            where: { id: watchId },
            data: {
              lastBidAt: now,
            },
          })
        }

        return {
          bid: createdBid,
          finalAmount: computedFinalAmount,
          automaticBidsCreated: toCreate.length,
          newAuctionEnd,
        }
      }
    )

    // Logs für automatische Gebote und Auktion-Verlängerung (außerhalb Transaktion)
    if (automaticBidsCreated > 0) {
      console.log(
        `[bids] ✅ ${automaticBidsCreated} automatische(s) Gebot/Gebote erstellt`
      )
    }
    if (newAuctionEnd && newAuctionEnd !== auctionEndDate) {
      console.log(
        `[bids] ✅ Auktion verlängert um 3 Minuten. Neues Ende: ${newAuctionEnd.toISOString()}`
      )
    }

    // Erstelle Benachrichtigung für Verkäufer
    try {
      const bidderName = bid.user.nickname || bid.user.name || bid.user.email
      await createNotification({
        userId: watch.sellerId,
        type: 'BID',
        title: 'Neues Gebot auf Ihren Artikel',
        message: `${bidderName} hat CHF ${finalAmount.toFixed(2)} auf "${watch.title}" geboten`,
        watchId: watchId,
        bidId: bid.id,
      })
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
      // Don't fail the bid if notification fails
    }

    // E-Mail: Gebotsbestätigung an Käufer (wenn aktiviert)
    try {
      const shouldSendBidConfirmation = await shouldSendNotification(session.user.id, 'emailOnNewBid')
      if (shouldSendBidConfirmation) {
        const { sendEmail, getBidConfirmationEmail } = await import('@/lib/email')
        const buyerName = bid.user.nickname || bid.user.name || 'Käufer'
        const { subject, html, text } = getBidConfirmationEmail(
          buyerName,
          watch.title,
          finalAmount,
          watchId
        )
        await sendEmail({
          to: bid.user.email,
          subject,
          html,
          text,
          userId: session.user.id,
        })
        console.log(`[bids] ✅ Gebotsbestätigungs-E-Mail gesendet an Käufer ${bid.user.email}`)
      } else {
        console.log(`[bids] ⏭️ Gebotsbestätigungs-E-Mail übersprungen (Präferenz deaktiviert)`)
      }
    } catch (emailError: unknown) {
      console.error('[bids] ❌ Fehler beim Senden der Gebotsbestätigungs-E-Mail:', emailError)
    }

    // E-Mail: Gebotsbenachrichtigung an Verkäufer (wenn aktiviert)
    try {
      const shouldSendBid = await shouldSendNotification(watch.sellerId, 'emailOnNewBid')
      if (shouldSendBid) {
        const { sendEmail, getBidNotificationEmail } = await import('@/lib/email')
        const sellerName =
          watch.seller.nickname || watch.seller.name || 'Verkäufer'
        const bidderName =
          bid.user.nickname || bid.user.name || bid.user.email || 'Ein Bieter'
        const { subject, html, text } = getBidNotificationEmail(
          sellerName,
          watch.title,
          finalAmount,
          bidderName,
          watchId
        )
        await sendEmail({
          to: watch.seller.email,
          subject,
          html,
          text,
          userId: watch.sellerId,
        })
        console.log(
          `[bids] ✅ Gebotsbenachrichtigungs-E-Mail gesendet an Verkäufer ${watch.seller.email}`
        )
      } else {
        console.log(`[bids] ⏭️ Gebotsbenachrichtigung übersprungen (Präferenz deaktiviert)`)
      }
    } catch (emailError: unknown) {
      console.error('[bids] ❌ Fehler beim Senden der Gebotsbenachrichtigungs-E-Mail:', emailError)
    }

    // E-Mail: Überboten-Benachrichtigung an vorherigen Höchstbietenden (wenn vorhanden und aktiviert)
    if (highestBid && highestBid.userId !== session.user.id) {
      try {
        const shouldSendOutbid = await shouldSendNotification(highestBid.userId, 'emailOnOutbid')
        if (shouldSendOutbid) {
          const { sendEmail, getOutbidNotificationEmail } = await import('@/lib/email')
          const previousBidder = await prisma.user.findUnique({
            where: { id: highestBid.userId },
            select: {
              email: true,
              name: true,
              nickname: true,
              firstName: true,
            },
          })
          if (previousBidder && previousBidder.email) {
            const previousBidderName =
              previousBidder.nickname || previousBidder.firstName || previousBidder.name || 'Käufer'
            const { subject, html, text } = getOutbidNotificationEmail(
              previousBidderName,
              watch.title,
              finalAmount, // Neues Höchstgebot
              watchId
            )
            await sendEmail({
              to: previousBidder.email,
              subject,
              html,
              text,
              userId: highestBid.userId,
            })
            console.log(
              `[bids] ✅ Überboten-Benachrichtigungs-E-Mail gesendet an ${previousBidder.email}`
            )
          }
        } else {
          console.log(`[bids] ⏭️ Überboten-Benachrichtigung übersprungen (Präferenz deaktiviert)`)
        }
      } catch (emailError: unknown) {
        console.error(
          '[bids] ❌ Fehler beim Senden der Überboten-Benachrichtigungs-E-Mail:',
          emailError
        )
      }
    }

    // === REALTIME: Broadcast bid event to connected clients ===
    try {
      const bidderName = bid.user.nickname || bid.user.name || 'Bieter'
      await broadcastBidEvent(watchId, {
        id: bid.id,
        amount: finalAmount,
        userId: session.user.id,
        userName: bidderName,
        createdAt: bid.createdAt,
      })

      // If auction was extended, broadcast that too
      if (newAuctionEnd && newAuctionEnd !== auctionEndDate) {
        await broadcastAuctionUpdate(watchId, {
          newEndTime: newAuctionEnd.toISOString(),
          highestBid: finalAmount,
        })
      }
      console.log(`[bids] ✅ Realtime broadcast sent for bid ${bid.id}`)
    } catch (realtimeError) {
      // Don't fail the bid if realtime broadcast fails
      console.error('[bids] Realtime broadcast failed:', realtimeError)
    }

    return NextResponse.json({
      message:
        newAuctionEnd && newAuctionEnd !== auctionEndDate
          ? 'Gebot erfolgreich abgegeben! Die Auktion wurde um 3 Minuten verlängert.'
          : automaticBidsCreated > 0
            ? `Gebot erfolgreich abgegeben! ${automaticBidsCreated} automatische Gebot${automaticBidsCreated > 1 ? 'e' : ''} wurden ausgelöst.`
            : 'Gebot erfolgreich abgegeben!',
      bid,
      auctionExtended: newAuctionEnd && newAuctionEnd !== auctionEndDate,
      automaticBidsCreated,
    })
  } catch (error: unknown) {
    console.error('Error creating bid:', error)
    const message = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Abgeben des Gebots: ' + message },
      { status: 500 }
    )
  }
}

// Alle Gebote für ein Angebot abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')

    if (!watchId) {
      return NextResponse.json({ message: 'watchId fehlt' }, { status: 400 })
    }

    const bids = await prisma.bid.findMany({
      where: { watchId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
            image: true,
          },
        },
      },
      orderBy: { amount: 'desc' }, // Sortiere nach Betrag (höchstes zuerst)
    })

    return NextResponse.json({ bids })
  } catch (error: unknown) {
    console.error('Error fetching bids:', error)
    const message = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten beim Laden der Gebote: ' + message },
      { status: 500 }
    )
  }
}
