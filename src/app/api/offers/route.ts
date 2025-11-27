import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Neuen Preisvorschlag erstellen
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json(
        { message: 'Datenbankfehler. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob User verifiziert ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verified: true },
    })

    if (!user?.verified) {
      return NextResponse.json(
        { message: 'Sie müssen sich zuerst verifizieren, um Preisvorschläge zu machen.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { watchId, amount, message } = body

    if (!watchId || amount === undefined) {
      return NextResponse.json(
        { message: 'watchId und Betrag sind erforderlich' },
        { status: 400 }
      )
    }

    const amountFloat = parseFloat(String(amount))
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return NextResponse.json(
        { message: 'Ungültiger Betrag' },
        { status: 400 }
      )
    }

    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      include: {
        seller: true,
        purchases: true,
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob bereits verkauft (nur aktive Purchases zählen)
    // RICARDO-STYLE: Stornierte Purchases zählen nicht - Artikel kann wieder Preisangebote erhalten
    const activePurchases = watch.purchases.filter(p => p.status !== 'cancelled')
    if (activePurchases.length > 0) {
      return NextResponse.json(
        { message: 'Dieses Angebot wurde bereits verkauft' },
        { status: 400 }
      )
    }

    // Prüfe ob der Käufer nicht der Verkäufer ist
    if (watch.sellerId === session.user.id) {
      return NextResponse.json(
        { message: 'Sie können keinen Preisvorschlag für Ihr eigenes Angebot machen' },
        { status: 400 }
      )
    }

    // Prüfe ob es eine Auktion ist
    if (watch.isAuction) {
      return NextResponse.json(
        { message: 'Preisvorschläge sind nur für Sofortkauf-Angebote möglich' },
        { status: 400 }
      )
    }

    // Regel: Mindestens 60% des Verkaufspreises
    const minimumPrice = watch.price * 0.6
    if (amountFloat < minimumPrice) {
      return NextResponse.json(
        { message: `Ihr Preisvorschlag muss mindestens 60% des Verkaufspreises betragen (mindestens CHF ${minimumPrice.toFixed(2)}).` },
        { status: 400 }
      )
    }

    // Ricardo-Regel: Preisvorschlag muss niedriger als Verkaufspreis sein
    if (amountFloat >= watch.price) {
      return NextResponse.json(
        { message: `Ihr Preisvorschlag muss niedriger als der Verkaufspreis (CHF ${watch.price.toFixed(2)}) sein.` },
        { status: 400 }
      )
    }

    // Hole alle Preisvorschläge dieses Käufers für dieses Angebot
    const allOffersByBuyer = await prisma.priceOffer.findMany({
      where: {
        watchId,
        buyerId: session.user.id,
      },
    })

    // Zähle aktive Preisvorschläge (pending oder accepted)
    const activeOffersCount = allOffersByBuyer.filter(
      (offer) => offer.status === 'pending' || offer.status === 'accepted'
    ).length

    // Prüfe ob bereits ein pending Preisvorschlag existiert
    const existingPendingOffer = allOffersByBuyer.find((offer) => offer.status === 'pending')

    if (existingPendingOffer) {
      // Update des bestehenden pending Preisvorschlags
      const updatedOffer = await prisma.priceOffer.update({
        where: { id: existingPendingOffer.id },
        data: {
          amount: amountFloat,
          message: message || null,
          status: 'pending',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 Stunden (Ricardo-Regel)
        },
        include: {
          watch: {
            include: {
              seller: true,
            },
          },
          buyer: true,
        },
      })

      // Benachrichtigung nur wenn sich der Betrag geändert hat
      if (existingPendingOffer.amount !== amountFloat) {
        try {
          const buyerName = session.user.name || session.user.nickname || session.user.email || 'Ein Käufer'
          await prisma.notification.create({
            data: {
              userId: watch.sellerId,
              type: 'PRICE_OFFER_UPDATED',
              title: 'Preisvorschlag aktualisiert',
              message: `${buyerName} hat seinen Preisvorschlag für "${watch.title}" auf CHF ${new Intl.NumberFormat('de-CH').format(amountFloat)} aktualisiert.`,
              link: `/my-watches/selling/offers?offer=${updatedOffer.id}`,
              watchId: watch.id,
              priceOfferId: updatedOffer.id,
            },
          })
          console.log(`[notifications] Preisvorschlag-Update-Benachrichtigung erstellt für Verkäufer ${watch.sellerId}`)
        } catch (notifError) {
          console.error('[notifications] Fehler beim Erstellen der Update-Benachrichtigung:', notifError)
        }
      }

      return NextResponse.json(
        { message: 'Preisvorschlag erfolgreich aktualisiert', offer: updatedOffer },
        { status: 200 }
      )
    }

    // Ricardo-Regel: Maximal 3 aktive Preisvorschläge pro Käufer pro Artikel
    if (activeOffersCount >= 3) {
      return NextResponse.json(
        { message: 'Sie haben bereits 3 Preisvorschläge für dieses Angebot gemacht. Bitte warten Sie auf eine Antwort des Verkäufers.' },
        { status: 400 }
      )
    }

    // Erstelle neuen Preisvorschlag
    const priceOffer = await prisma.priceOffer.create({
      data: {
        watchId,
        buyerId: session.user.id,
        amount: amountFloat,
        message: message || null,
        status: 'pending',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 Stunden (Ricardo-Regel)
      },
      include: {
        watch: {
          include: {
            seller: true,
          },
        },
        buyer: true,
      },
    })

    // E-Mail: Preisvorschlag erhalten an Verkäufer
    try {
      const { sendEmail, getPriceOfferReceivedEmail } = await import('@/lib/email')
      const sellerName = priceOffer.watch.seller.nickname || priceOffer.watch.seller.firstName || priceOffer.watch.seller.name || 'Verkäufer'
      const buyerName = priceOffer.buyer.nickname || priceOffer.buyer.firstName || priceOffer.buyer.name || priceOffer.buyer.email || 'Ein Käufer'
      const { subject, html, text } = getPriceOfferReceivedEmail(
        sellerName,
        priceOffer.watch.title,
        amountFloat,
        buyerName,
        watchId
      )
      await sendEmail({
        to: priceOffer.watch.seller.email,
        subject,
        html,
        text
      })
      console.log(`[offers] ✅ Preisvorschlag-Erhalten-E-Mail gesendet an Verkäufer ${priceOffer.watch.seller.email}`)
    } catch (emailError: any) {
      console.error('[offers] ❌ Fehler beim Senden der Preisvorschlag-Erhalten-E-Mail:', emailError)
    }

    // Benachrichtigung für den Verkäufer
    try {
      const buyerName = session.user.name || session.user.nickname || session.user.email || 'Ein Käufer'
      await prisma.notification.create({
        data: {
          userId: watch.sellerId,
          type: 'PRICE_OFFER_RECEIVED',
          title: 'Neuer Preisvorschlag',
          message: `${buyerName} hat einen Preisvorschlag von CHF ${new Intl.NumberFormat('de-CH').format(amountFloat)} für "${watch.title}" gemacht.`,
          link: `/my-watches/selling/offers?offer=${priceOffer.id}`,
          watchId: watch.id,
          priceOfferId: priceOffer.id,
        },
      })
      console.log(`[notifications] Preisvorschlag-Benachrichtigung erstellt für Verkäufer ${watch.sellerId}`)
    } catch (notifError) {
      console.error('[notifications] Fehler beim Erstellen der Preisvorschlag-Benachrichtigung:', notifError)
      // Fehler wird geloggt, aber Preisvorschlag wird trotzdem erstellt
    }

    return NextResponse.json(
      { message: 'Preisvorschlag erfolgreich erstellt', offer: priceOffer },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating price offer:', error)
    console.error('Error stack:', error.stack)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Sie haben bereits einen Preisvorschlag für dieses Angebot gemacht.' },
        { status: 400 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { message: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Fehler beim Erstellen des Preisvorschlags: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}

// GET - Preisvorschläge abrufen
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      console.error('Prisma client is not initialized')
      return NextResponse.json(
        { message: 'Datenbankfehler. Bitte versuchen Sie es später erneut.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sent', 'received', oder 'watchId'
    const watchId = searchParams.get('watchId')

    if (type === 'sent') {
      // Preisvorschläge, die der User gemacht hat
      const offers = await prisma.priceOffer.findMany({
        where: {
          buyerId: session.user.id,
        },
        include: {
          watch: {
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nickname: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ offers })
    } else if (type === 'received') {
      // Preisvorschläge, die der User erhalten hat (als Verkäufer)
      // Nur pending Preisvorschläge anzeigen (accepted und rejected werden ausgeblendet)
      const offers = await prisma.priceOffer.findMany({
        where: {
          watch: {
            sellerId: session.user.id,
          },
          status: 'pending', // Nur pending anzeigen - akzeptierte verschwinden
        },
        include: {
          watch: true,
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({ offers })
    } else if (watchId) {
      // Preisvorschläge für ein spezifisches Angebot
      const watch = await prisma.watch.findUnique({
        where: { id: watchId },
        select: { sellerId: true },
      })

      if (!watch) {
        return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
      }

      // Nur Verkäufer oder Käufer können die Preisvorschläge sehen
      if (watch.sellerId !== session.user.id) {
        // Käufer sieht nur seine eigenen Preisvorschläge
        const offers = await prisma.priceOffer.findMany({
          where: {
            watchId,
            buyerId: session.user.id,
          },
          include: {
            watch: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return NextResponse.json({ offers })
      } else {
        // Verkäufer sieht alle Preisvorschläge für sein Angebot
        const offers = await prisma.priceOffer.findMany({
          where: {
            watchId,
          },
          include: {
            watch: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return NextResponse.json({ offers })
      }
    } else {
      return NextResponse.json(
        { message: 'type oder watchId Parameter erforderlich' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching price offers:', error)
    return NextResponse.json(
      { message: 'Fehler beim Abrufen der Preisvorschläge' },
      { status: 500 }
    )
  }
}
