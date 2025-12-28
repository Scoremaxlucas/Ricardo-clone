import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/watches/[id]/duplicate
 * Creates a draft copy of an existing listing for "Erneut anbieten"
 * Returns the new draft ID to redirect to the sell wizard
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the original listing
    const originalListing = await prisma.watch.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    if (!originalListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Verify ownership
    if (originalListing.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to duplicate this listing' }, { status: 403 })
    }

    // Parse images
    let images: string[] = []
    if (originalListing.images) {
      try {
        images = JSON.parse(originalListing.images)
      } catch {
        images = []
      }
    }

    // Get category info
    const categoryInfo = originalListing.categories[0]?.category
    const selectedCategory = categoryInfo?.slug || null

    // Create form data for draft
    const formData = {
      brand: originalListing.brand,
      model: originalListing.model,
      title: originalListing.title,
      description: originalListing.description || '',
      condition: originalListing.condition,
      year: originalListing.year?.toString() || '',
      referenceNumber: originalListing.referenceNumber || '',
      material: originalListing.material || '',
      movement: originalListing.movement || '',
      caseDiameter: originalListing.caseDiameter?.toString() || '',
      price: originalListing.price.toString(),
      buyNowPrice: originalListing.buyNowPrice?.toString() || '',
      isAuction: originalListing.isAuction,
      auctionDuration: originalListing.auctionDuration?.toString() || '',
      fullset: originalListing.fullset,
      box: originalListing.box,
      papers: originalListing.papers,
      allLinks: originalListing.allLinks,
      warranty: originalListing.warranty || '',
      warrantyMonths: originalListing.warrantyMonths?.toString() || '',
      warrantyYears: originalListing.warrantyYears?.toString() || '',
      warrantyNote: originalListing.warrantyNote || '',
      deliveryMode: originalListing.deliveryMode || 'shipping_and_pickup',
      shippingProfile: originalListing.shippingProfile || '',
      pickupLocationZip: originalListing.pickupLocationZip || '',
      pickupLocationCity: originalListing.pickupLocationCity || '',
    }

    // Create the draft
    const draft = await prisma.draft.create({
      data: {
        userId: session.user.id,
        formData: JSON.stringify(formData),
        images: JSON.stringify(images),
        selectedCategory,
        selectedSubcategory: null,
        selectedBooster: null,
        paymentProtectionEnabled: originalListing.paymentProtectionEnabled,
        currentStep: 1, // Start at step 1 so user can review
        titleImageIndex: 0,
      },
    })

    return NextResponse.json({
      success: true,
      draftId: draft.id,
      message: 'Draft created successfully',
    })
  } catch (error: any) {
    console.error('[watches/duplicate] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
