import { getMainAddress } from '@/lib/address'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const currentUserId = session?.user?.id || null

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
    }

    // Try to find the watch
    let watch = null

    // Use select to only get columns that exist in DB
    const selectFields = {
      id: true,
      articleNumber: true,
      title: true,
      description: true,
      brand: true,
      model: true,
      year: true,
      condition: true,
      material: true,
      movement: true,
      caseSize: true,
      caseDiameter: true,
      price: true,
      buyNowPrice: true,
      isAuction: true,
      auctionStart: true,
      auctionEnd: true,
      createdAt: true,
      images: true,
      accuracy: true,
      fullset: true,
      allLinks: true,
      box: true,
      papers: true,
      warranty: true,
      warrantyMonths: true,
      warrantyYears: true,
      warrantyNote: true,
      warrantyDescription: true,
      referenceNumber: true,
      shippingMethod: true,
      sellerId: true,
      moderationStatus: true,
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          verified: true,
        },
      },
    }

    // First try by CUID
    watch = await prisma.watch.findUnique({
      where: { id },
      select: selectFields,
    })

    // If not found and ID looks numeric, try articleNumber
    if (!watch && /^\d+$/.test(id)) {
      watch = await prisma.watch.findUnique({
        where: { articleNumber: parseInt(id) },
        select: selectFields,
      })
    }

    if (!watch) {
      return NextResponse.json({ error: 'Watch not found' }, { status: 404 })
    }

    // Parse images
    let images: string[] = []
    try {
      images = watch.images ? JSON.parse(watch.images) : []
    } catch {
      images = []
    }

    // Parse condition
    let conditionMap: Record<string, string> = {}
    try {
      if (watch.condition) {
        const parsed = JSON.parse(watch.condition)
        conditionMap = typeof parsed === 'object' ? parsed : { overall: watch.condition }
      }
    } catch {
      conditionMap = { overall: watch.condition || 'Nicht angegeben' }
    }

    // Fetch seller address from UserAddress table
    const sellerAddress = watch.seller?.id ? await getMainAddress(watch.seller.id) : null
    const sellerWithAddress = watch.seller
      ? {
          ...watch.seller,
          city: sellerAddress?.city || null,
          postalCode: sellerAddress?.postalCode || null,
        }
      : null

    // === RICARDO-STYLE: Prüfe ob Artikel verkauft wurde ===
    // Prüfe sowohl alte Purchases als auch neue Orders
    let isSold = false
    let saleInfo: {
      soldAt: string | null
      soldPrice: number | null
      isCurrentUserBuyer: boolean
      buyerName: string | null
    } | null = null

    // Prüfe Orders (neues System)
    const activeOrder = await prisma.order.findFirst({
      where: {
        watchId: watch.id,
        orderStatus: { notIn: ['canceled', 'refunded'] },
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
        buyerId: true,
        buyer: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (activeOrder) {
      isSold = true
      const buyerDisplayName = activeOrder.buyer?.firstName && activeOrder.buyer?.lastName
        ? `${activeOrder.buyer.firstName} ${activeOrder.buyer.lastName}`
        : activeOrder.buyer?.name || 'Käufer'
      
      saleInfo = {
        soldAt: activeOrder.createdAt.toISOString(),
        soldPrice: activeOrder.totalAmount,
        isCurrentUserBuyer: currentUserId === activeOrder.buyerId,
        buyerName: currentUserId === activeOrder.buyerId ? buyerDisplayName : null, // Nur für Käufer sichtbar
      }
    }

    // Fallback: Prüfe alte Purchases (falls kein Order gefunden)
    if (!isSold) {
      const activePurchase = await prisma.purchase.findFirst({
        where: {
          watchId: watch.id,
          status: { notIn: ['cancelled'] },
        },
        select: {
          id: true,
          createdAt: true,
          price: true,
          buyerId: true,
          buyer: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (activePurchase) {
        isSold = true
        const buyerDisplayName = activePurchase.buyer?.firstName && activePurchase.buyer?.lastName
          ? `${activePurchase.buyer.firstName} ${activePurchase.buyer.lastName}`
          : activePurchase.buyer?.name || 'Käufer'
        
        saleInfo = {
          soldAt: activePurchase.createdAt.toISOString(),
          soldPrice: activePurchase.price,
          isCurrentUserBuyer: currentUserId === activePurchase.buyerId,
          buyerName: currentUserId === activePurchase.buyerId ? buyerDisplayName : null,
        }
      }
    }

    return NextResponse.json({
      watch: {
        id: watch.id,
        articleNumber: watch.articleNumber,
        title: watch.title,
        description: watch.description,
        brand: watch.brand,
        model: watch.model,
        year: watch.year,
        condition: watch.condition,
        material: watch.material,
        movement: watch.movement,
        caseSize: watch.caseSize,
        caseDiameter: watch.caseDiameter,
        price: watch.price,
        buyNowPrice: watch.buyNowPrice,
        isAuction: watch.isAuction,
        auctionStart: watch.auctionStart ? new Date(watch.auctionStart).toISOString() : null,
        auctionEnd: watch.auctionEnd ? new Date(watch.auctionEnd).toISOString() : null,
        createdAt: watch.createdAt ? new Date(watch.createdAt).toISOString() : null,
        accuracy: watch.accuracy,
        fullset: watch.fullset,
        allLinks: watch.allLinks,
        box: watch.box,
        papers: watch.papers,
        warranty: watch.warranty,
        warrantyMonths: watch.warrantyMonths,
        warrantyYears: watch.warrantyYears,
        warrantyNote: watch.warrantyNote,
        warrantyDescription: watch.warrantyDescription,
        referenceNumber: watch.referenceNumber,
        shippingMethod: watch.shippingMethod,
        sellerId: watch.sellerId,
        moderationStatus: watch.moderationStatus,
        // Ricardo-Style: Verkaufsstatus
        isSold,
      },
      images,
      conditionMap,
      seller: sellerWithAddress,
      // Sale info (nur wenn verkauft)
      saleInfo: isSold ? saleInfo : null,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[products/[id]] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
