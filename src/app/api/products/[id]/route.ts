import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
    }

    // Try to find the watch
    let watch = null

    // First try by CUID
    watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            postalCode: true,
            verified: true,
          },
        },
      },
    })

    // If not found and ID looks numeric, try articleNumber
    if (!watch && /^\d+$/.test(id)) {
      watch = await prisma.watch.findUnique({
        where: { articleNumber: parseInt(id) },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              city: true,
              postalCode: true,
              verified: true,
            },
          },
        },
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
        auctionStart: watch.auctionStart?.toISOString() || null,
        auctionEnd: watch.auctionEnd?.toISOString() || null,
        createdAt: watch.createdAt.toISOString(),
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
        deliveryMode: watch.deliveryMode,
        pickupLocationCity: watch.pickupLocationCity,
        pickupLocationZip: watch.pickupLocationZip,
        sellerId: watch.sellerId,
        moderationStatus: watch.moderationStatus,
      },
      images,
      conditionMap,
      seller: watch.seller,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('[products/[id]] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
