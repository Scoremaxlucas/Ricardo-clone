import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        brand: true,
        model: true,
        referenceNumber: true,
        year: true,
        condition: true,
        material: true,
        movement: true,
        caseDiameter: true,
        price: true,
        buyNowPrice: true,
        isAuction: true,
        auctionStart: true,
        auctionEnd: true,
        auctionDuration: true,
        autoRenew: true,
        lastRevision: true,
        accuracy: true,
        fullset: true,
        box: true,
        papers: true,
        allLinks: true,
        warranty: true,
        warrantyMonths: true,
        warrantyYears: true,
        warrantyNote: true,
        warrantyDescription: true,
        images: true,
        video: true,
        shippingMethod: true,
        boosters: true,
        paymentProtectionEnabled: true,
        sellerId: true,
        createdAt: true,
        updatedAt: true,
        bids: {
          select: {
            id: true,
            amount: true,
            userId: true,
            createdAt: true,
          },
          orderBy: { amount: 'desc' },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Uhr nicht gefunden' }, { status: 404 })
    }

    const images = watch.images ? JSON.parse(watch.images) : []

    // Berechne aktuellen Preis basierend auf Geboten
    const highestBid =
      watch.bids && watch.bids.length > 0 ? Math.max(...watch.bids.map((b: any) => b.amount)) : null
    const currentPrice = highestBid || watch.price || 0

    return NextResponse.json({
      watch: {
        id: watch.id,
        title: watch.title,
        description: watch.description,
        brand: watch.brand,
        model: watch.model,
        referenceNumber: (watch as any).referenceNumber,
        year: watch.year,
        condition: watch.condition,
        material: watch.material,
        movement: watch.movement,
        caseDiameter: (watch as any).caseDiameter,
        price: currentPrice,
        buyNowPrice: watch.buyNowPrice,
        isAuction: watch.isAuction,
        auctionStart: watch.auctionStart,
        auctionEnd: watch.auctionEnd,
        auctionDuration: (watch as any).auctionDuration,
        autoRenew: (watch as any).autoRenew || false,
        lastRevision: watch.lastRevision,
        accuracy: watch.accuracy,
        fullset: watch.fullset,
        box: (watch as any).box,
        papers: (watch as any).papers,
        allLinks: (watch as any).allLinks,
        warranty: (watch as any).warranty,
        warrantyMonths: (watch as any).warrantyMonths,
        warrantyYears: (watch as any).warrantyYears,
        warrantyNote: (watch as any).warrantyNote,
        warrantyDescription: (watch as any).warrantyDescription,
        sellerId: watch.sellerId,
        seller: watch.seller,
        images: images,
        video: watch.video,
        bids: watch.bids || [],
        shippingMethod: (watch as any).shippingMethod,
        boosters: (watch as any).boosters,
        paymentProtectionEnabled: watch.paymentProtectionEnabled ?? false,
        categories:
          watch.categories?.map((wc: any) => ({
            id: wc.category.id,
            name: wc.category.name,
            slug: wc.category.slug,
          })) || [],
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: 'Fehler beim Laden: ' + error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const watch = await prisma.watch.findUnique({
      where: { id },
      include: { bids: true },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Uhr nicht gefunden' }, { status: 404 })
    }

    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann das Angebot bearbeiten' },
        { status: 403 }
      )
    }

    const hasBids = watch.bids.length > 0
    const data = await request.json()

    // Wenn es Gebote gibt: Preis-Felder blockieren
    if (hasBids && (data.price !== undefined || data.buyNowPrice !== undefined)) {
      return NextResponse.json(
        { message: 'Preise können nicht mehr geändert werden, da bereits Gebote vorhanden sind' },
        { status: 400 }
      )
    }

    // Update-Objekt zusammenstellen
    const updateData: any = {}

    // Wenn keine Gebote: alles editierbar
    if (!hasBids) {
      if (data.brand !== undefined) updateData.brand = data.brand
      if (data.model !== undefined) updateData.model = data.model
      if (data.referenceNumber !== undefined) updateData.referenceNumber = data.referenceNumber
      if (data.year !== undefined) updateData.year = data.year ? parseInt(data.year) : null
      if (data.condition !== undefined) updateData.condition = data.condition
      if (data.material !== undefined) updateData.material = data.material
      if (data.movement !== undefined) updateData.movement = data.movement
      if (data.caseDiameter !== undefined)
        updateData.caseDiameter = data.caseDiameter ? parseFloat(data.caseDiameter) : null
      if (data.lastRevision !== undefined)
        updateData.lastRevision = data.lastRevision ? new Date(data.lastRevision) : null
      if (data.accuracy !== undefined) updateData.accuracy = data.accuracy
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.fullset !== undefined) updateData.fullset = data.fullset
      if (data.onlyBox !== undefined) updateData.box = data.onlyBox
      if (data.onlyPapers !== undefined) updateData.papers = data.onlyPapers
      if (data.onlyAllLinks !== undefined) {
        updateData.box = data.onlyAllLinks
        updateData.papers = data.onlyAllLinks
        updateData.allLinks = data.onlyAllLinks
      }
      if (data.hasWarranty !== undefined)
        updateData.warranty = data.hasWarranty ? 'Herstellergarantie' : null
      if (data.warrantyMonths !== undefined)
        updateData.warrantyMonths = data.warrantyMonths ? parseInt(data.warrantyMonths) : null
      if (data.warrantyYears !== undefined)
        updateData.warrantyYears = data.warrantyYears ? parseInt(data.warrantyYears) : null
      if (data.hasSellerWarranty !== undefined && data.sellerWarrantyNote !== undefined) {
        updateData.warrantyNote = data.sellerWarrantyNote
        updateData.warrantyDescription = `Verkäufer-Garantie: ${data.sellerWarrantyMonths || 0} Monate, ${data.sellerWarrantyYears || 0} Jahre`
      }
      if (data.price !== undefined) updateData.price = parseFloat(data.price)
      if (data.buyNowPrice !== undefined)
        updateData.buyNowPrice = data.buyNowPrice ? parseFloat(data.buyNowPrice) : null
      if (data.auctionEnd !== undefined)
        updateData.auctionEnd = data.auctionEnd ? new Date(data.auctionEnd) : null
      if (data.images !== undefined) {
        const currentImages = watch.images ? JSON.parse(watch.images) : []
        const newImages = Array.isArray(data.images) ? data.images : []
        // Zusätzliche Bilder hinzufügen (nicht ersetzen)
        updateData.images = JSON.stringify([
          ...currentImages,
          ...newImages.filter((img: string) => !currentImages.includes(img)),
        ])
      }
      if (data.video !== undefined) updateData.video = data.video
    } else {
      // Mit Geboten: nur zusätzliche Bilder und "Nachträgliche Information"
      if (data.images !== undefined) {
        const currentImages = watch.images ? JSON.parse(watch.images) : []
        const newImages = Array.isArray(data.images) ? data.images : []
        // Nur zusätzliche Bilder hinzufügen
        updateData.images = JSON.stringify([
          ...currentImages,
          ...newImages.filter((img: string) => !currentImages.includes(img)),
        ])
      }
      if (data.additionalInfo !== undefined) {
        // Nachträgliche Information speichern
        const currentDesc = watch.description || ''
        const additionalInfo = `\n\n--- Nachträgliche Information ---\n${data.additionalInfo}`
        updateData.description = currentDesc + additionalInfo
      }
    }

    const updatedWatch = await prisma.watch.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Angebot erfolgreich aktualisiert',
      watch: updatedWatch,
    })
  } catch (error: any) {
    console.error('Error updating watch:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren: ' + error.message },
      { status: 500 }
    )
  }
}

// DELETE: Angebot löschen (nur für Admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Nur Administratoren können Angebote löschen' },
        { status: 403 }
      )
    }

    // Hole Watch mit Seller-Informationen für Benachrichtigung
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Hole Admin-Informationen für Moderation History
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
      },
    })

    // Lösche zuerst alle abhängigen Daten
    await prisma.bid.deleteMany({ where: { watchId: id } })
    await prisma.favorite.deleteMany({ where: { watchId: id } })
    await prisma.priceOffer.deleteMany({ where: { watchId: id } })
    await prisma.purchase.deleteMany({ where: { watchId: id } })
    await prisma.sale.deleteMany({ where: { watchId: id } })
    await prisma.message.deleteMany({ where: { watchId: id } })
    await prisma.watchCategory.deleteMany({ where: { watchId: id } })
    await prisma.watchView.deleteMany({ where: { watchId: id } })
    await prisma.report.deleteMany({ where: { watchId: id } })
    await prisma.adminNote.deleteMany({ where: { watchId: id } })
    await prisma.moderationHistory.deleteMany({ where: { watchId: id } })
    await prisma.invoiceItem.deleteMany({ where: { watchId: id } })
    await prisma.notification.deleteMany({ where: { watchId: id } })
    await prisma.conversation.deleteMany({ where: { context: { contains: id } } })

    // Lösche dann das Angebot (WICHTIG: Komplett löschen, nicht nur als rejected markieren)
    await prisma.watch.delete({
      where: { id },
    })

    // WICHTIG: Cache invalidierten, damit gelöschte Produkte sofort verschwinden
    try {
      revalidatePath('/', 'page') // Homepage
      revalidatePath('/search', 'page') // Suchseite
      revalidatePath('/watches', 'page') // Alle Artikel
      revalidatePath('/auctions', 'page') // Auktionen
      // API-Routen haben bereits Cache-Control: no-store, müssen nicht invalidiert werden
      console.log('[DELETE] Cache invalidated for homepage and related pages')
    } catch (revalidateError: any) {
      // Revalidate-Fehler soll nicht die Löschung verhindern
      console.error('[DELETE] Error revalidating cache:', revalidateError)
    }

    // Sende Benachrichtigung an den Verkäufer
    try {
      const { sendEmail, getProductDeletedEmail } = await import('@/lib/email')
      const sellerName =
        watch.seller.nickname ||
        watch.seller.firstName ||
        watch.seller.name ||
        watch.seller.email ||
        'Verkäufer'

      const emailContent = getProductDeletedEmail(
        sellerName,
        watch.title,
        watch.id,
        admin?.name || admin?.email || 'Ein Administrator'
      )

      await sendEmail({
        to: watch.seller.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })

      console.log(`[DELETE] Product deletion notification sent to ${watch.seller.email}`)
    } catch (emailError: any) {
      // E-Mail-Fehler soll nicht die Löschung verhindern
      console.error('[DELETE] Error sending deletion notification:', emailError)
    }

    // Erstelle in-app Benachrichtigung für den Verkäufer
    try {
      await prisma.notification.create({
        data: {
          userId: watch.sellerId,
          type: 'product_deleted',
          title: 'Ihr Artikel wurde gelöscht',
          message: `Ihr Artikel "${watch.title}" wurde von einem Administrator gelöscht.`,
          link: `/my-watches/selling`,
        },
      })
      console.log(`[DELETE] In-app notification created for seller ${watch.sellerId}`)
    } catch (notificationError: any) {
      // Benachrichtigungs-Fehler soll nicht die Löschung verhindern
      console.error('[DELETE] Error creating in-app notification:', notificationError)
    }

    return NextResponse.json({
      message: 'Angebot erfolgreich gelöscht',
    })
  } catch (error: any) {
    console.error('Error deleting watch:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Angebots: ' + error.message },
      { status: 500 }
    )
  }
}
