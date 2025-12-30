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

    // WICHTIG: Verwende select statt include, um nur existierende Felder zu laden
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        images: true,
        description: true,
        bids: {
          select: { id: true },
        },
      },
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

// DELETE: Angebot entfernen (RICARDO-STYLE: Soft Delete für Artikel mit Transaktionen)
// 
// RICARDO-PHILOSOPHIE:
// - Artikel mit Geboten/Käufen werden NIE wirklich gelöscht
// - Stattdessen: moderationStatus = 'removed' (Soft Delete)
// - Daten bleiben für rechtliche/steuerliche Zwecke erhalten
// - Nur Test-Artikel ohne jegliche Aktivität können hart gelöscht werden
//
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Vom Administrator entfernt'
    const action = searchParams.get('action') || 'remove' // 'remove' oder 'block'

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, name: true, email: true, nickname: true },
    })

    // Hole Watch mit allen relevanten Daten
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        sellerId: true,
        price: true,
        moderationStatus: true,
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
        bids: {
          select: { id: true },
        },
        purchases: {
          select: { id: true, status: true, buyerId: true },
        },
        _count: {
          select: {
            bids: true,
            purchases: true,
            favorites: true,
            priceOffers: true,
          },
        },
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    const isAdmin = user?.isAdmin === true
    const isOwner = watch.sellerId === session.user.id

    // Prüfe Berechtigung: Admin oder Eigentümer
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      )
    }

    // ============================================
    // RICARDO-REGELN FÜR VERKÄUFER
    // ============================================
    if (!isAdmin) {
      // Verkäufer können NUR Artikel ohne Aktivität beenden/entfernen
      if (watch.bids.length > 0) {
        return NextResponse.json(
          {
            message: 'Artikel mit Geboten können nicht entfernt werden. Warten Sie bis die Auktion endet.',
            code: 'HAS_BIDS',
            bidCount: watch.bids.length,
          },
          { status: 400 }
        )
      }

      const activePurchases = watch.purchases.filter(p => p.status !== 'cancelled')
      if (activePurchases.length > 0) {
        return NextResponse.json(
          {
            message: 'Verkaufte Artikel können nicht entfernt werden.',
            code: 'ALREADY_SOLD',
          },
          { status: 400 }
        )
      }

      // Verkäufer ohne Admin: Kann nur eigene leere Artikel "beenden" (nicht löschen)
      await prisma.watch.update({
        where: { id },
        data: {
          moderationStatus: 'ended',
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Angebot beendet',
        action: 'ended',
      })
    }

    // ============================================
    // ADMIN-AKTIONEN (RICARDO-STYLE)
    // ============================================
    
    // Prüfe ob Artikel Transaktionen hat
    const hasTransactions = 
      watch._count.bids > 0 || 
      watch._count.purchases > 0 || 
      watch._count.priceOffers > 0

    // Prüfe auf aktive Zahlungen
    const activeOrders = await prisma.order.findMany({
      where: {
        watchId: id,
        paymentStatus: { in: ['paid', 'held', 'pending'] },
      },
      include: {
        buyer: {
          select: { id: true, email: true, name: true, firstName: true },
        },
      },
    })

    // ============================================
    // SOFT DELETE: Artikel mit Transaktionen
    // ============================================
    if (hasTransactions || activeOrders.length > 0) {
      // Setze moderationStatus auf 'removed' oder 'blocked'
      const newStatus = action === 'block' ? 'blocked' : 'removed'
      
      await prisma.watch.update({
        where: { id },
        data: {
          moderationStatus: newStatus,
          updatedAt: new Date(),
        },
      })

      // Erstelle Moderation History Eintrag
      await prisma.moderationHistory.create({
        data: {
          watchId: id,
          adminId: session.user.id,
          action: newStatus,
          details: JSON.stringify({
            reason,
            previousStatus: watch.moderationStatus,
            hadBids: watch._count.bids,
            hadPurchases: watch._count.purchases,
            hadActiveOrders: activeOrders.length,
          }),
        },
      })

      // Benachrichtige Verkäufer
      try {
        const { sendEmail } = await import('@/lib/email')
        const sellerName = watch.seller.nickname || watch.seller.firstName || watch.seller.name || 'Verkäufer'
        const adminName = user?.nickname || user?.name || user?.email || 'Administrator'

        await sendEmail({
          to: watch.seller.email,
          subject: `Ihr Angebot "${watch.title}" wurde ${newStatus === 'blocked' ? 'gesperrt' : 'entfernt'}`,
          html: `
            <h2>Angebot ${newStatus === 'blocked' ? 'gesperrt' : 'entfernt'}</h2>
            <p>Hallo ${sellerName},</p>
            <p>Ihr Angebot <strong>"${watch.title}"</strong> wurde von einem Administrator ${newStatus === 'blocked' ? 'gesperrt' : 'entfernt'}.</p>
            <p><strong>Grund:</strong> ${reason}</p>
            <p>Bei Fragen kontaktieren Sie uns unter support@helvenda.ch</p>
            <p>Mit freundlichen Grüssen,<br>Ihr Helvenda Team</p>
          `,
          text: `Ihr Angebot "${watch.title}" wurde ${newStatus === 'blocked' ? 'gesperrt' : 'entfernt'}. Grund: ${reason}`,
        })
      } catch (emailError) {
        console.error('[REMOVE] Error sending notification email:', emailError)
      }

      // Cache invalidieren
      try {
        revalidatePath('/', 'page')
        revalidatePath('/search', 'page')
      } catch (e) {
        console.error('[REMOVE] Cache revalidation error:', e)
      }

      return NextResponse.json({
        message: `Angebot ${newStatus === 'blocked' ? 'gesperrt' : 'entfernt'} (Daten bleiben für rechtliche Zwecke erhalten)`,
        action: newStatus,
        preserved: true,
        stats: {
          bids: watch._count.bids,
          purchases: watch._count.purchases,
          activeOrders: activeOrders.length,
        },
      })
    }

    // ============================================
    // HARD DELETE: Nur für Test-Artikel OHNE jegliche Aktivität
    // ============================================
    console.log(`[DELETE] Hard delete for empty test article: ${watch.title}`)

    // Lösche nur Basis-Daten (keine Transaktionen vorhanden)
    await prisma.favorite.deleteMany({ where: { watchId: id } })
    await prisma.watchCategory.deleteMany({ where: { watchId: id } })
    await prisma.watchView.deleteMany({ where: { watchId: id } })
    await prisma.notification.deleteMany({ where: { watchId: id } })
    await prisma.adminNote.deleteMany({ where: { watchId: id } })
    await prisma.moderationHistory.deleteMany({ where: { watchId: id } })

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

    // Sende Benachrichtigung nur wenn Admin gelöscht hat (nicht Verkäufer selbst)
    if (isAdmin && watch.sellerId !== session.user.id) {
      try {
        const { sendEmail } = await import('@/lib/email')
        const sellerName =
          watch.seller.nickname ||
          watch.seller.firstName ||
          watch.seller.name ||
          'Verkäufer'
        const adminName = user?.nickname || user?.name || user?.email || 'Administrator'

        await sendEmail({
          to: watch.seller.email,
          subject: `Ihr Test-Angebot "${watch.title}" wurde entfernt`,
          html: `
            <h2>Test-Angebot entfernt</h2>
            <p>Hallo ${sellerName},</p>
            <p>Ihr Test-Angebot <strong>"${watch.title}"</strong> wurde von ${adminName} entfernt.</p>
            <p>Da der Artikel keine Gebote oder Käufe hatte, wurde er vollständig gelöscht.</p>
            <p>Bei Fragen kontaktieren Sie uns unter support@helvenda.ch</p>
          `,
          text: `Ihr Test-Angebot "${watch.title}" wurde entfernt.`,
        })
      } catch (emailError: any) {
        console.error('[DELETE] Error sending deletion notification:', emailError)
      }
    }

    // Keine in-app Notification für gelöschte Artikel (Artikel existiert nicht mehr)
    console.log(`[DELETE] Test article permanently deleted: ${watch.title}`)

    return NextResponse.json({
      message: 'Test-Angebot erfolgreich gelöscht',
      action: 'deleted',
      preserved: false,
    })
  } catch (error: any) {
    console.error('Error deleting watch:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Angebots: ' + error.message },
      { status: 500 }
    )
  }
}
