import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: 'Fehlt' }, { status: 400 })
    }

    const listing = await prisma.rentalListing.findFirst({
      where: { id, moderationStatus: { not: 'rejected' } },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            nickname: true,
            image: true,
            verified: true,
            createdAt: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    let imageUrls: string[] = []
    try {
      imageUrls = JSON.parse(listing.images)
      if (!Array.isArray(imageUrls)) imageUrls = []
    } catch {
      imageUrls = []
    }

    return NextResponse.json({
      listing: {
        ...listing,
        availableFrom: listing.availableFrom.toISOString(),
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        seller: listing.seller
          ? {
              ...listing.seller,
              createdAt: listing.seller.createdAt.toISOString(),
            }
          : null,
        images: imageUrls,
      },
    })
  } catch (e: any) {
    console.error('[rental-listings/[id] GET]', e)
    return NextResponse.json({ message: e?.message || 'Fehler' }, { status: 500 })
  }
}
