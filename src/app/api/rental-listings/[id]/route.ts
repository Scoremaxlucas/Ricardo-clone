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
      where: { id, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
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
      imageUrls = JSON.parse(listing.photos)
      if (!Array.isArray(imageUrls)) imageUrls = []
    } catch {
      imageUrls = []
    }

    return NextResponse.json({
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        address: listing.address,
        zip: listing.zip,
        city: listing.city,
        canton: listing.canton,
        rooms: listing.rooms,
        areaSqm: listing.areaSqm,
        floor: listing.floor,
        rentPerMonth: listing.rentPerMonth,
        utilitiesPerMonth: listing.utilitiesPerMonth,
        depositAmount: listing.depositAmount,
        availableFrom: listing.availableFrom.toISOString(),
        requiresCreditCheck: listing.requiresCreditCheck,
        status: listing.status,
        userId: listing.userId,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        landlord: listing.user
          ? {
              id: listing.user.id,
              name: listing.user.name,
              firstName: listing.user.firstName,
              nickname: listing.user.nickname,
              image: listing.user.image,
              verified: listing.user.verified,
              createdAt: listing.user.createdAt.toISOString(),
            }
          : null,
        images: imageUrls,
      },
    })
  } catch (e: unknown) {
    console.error('[rental-listings/[id] GET]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
