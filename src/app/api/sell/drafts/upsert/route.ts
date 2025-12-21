import { authOptions } from '@/lib/auth'
import { uploadImagesToBlob } from '@/lib/blob-storage'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/sell/drafts/upsert
 * Create or update draft for authenticated user
 * Returns draftId and updatedAt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is blocked
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isBlocked: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { message: 'Ihr Konto wurde gesperrt. Sie können keine Entwürfe speichern.' },
        { status: 403 }
      )
    }

    // Note: We allow draft saving even if not verified (for UX during verification process)
    // Publishing will be blocked by /api/watches/create which checks verificationStatus === 'approved'

    const body = await request.json()
    const {
      formData,
      images,
      selectedCategory,
      selectedSubcategory,
      selectedBooster,
      paymentProtectionEnabled,
      currentStep,
      titleImageIndex,
    } = body

    // Upload images to Blob Storage if provided
    let imageUrls: string[] = []
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        // Filter out already uploaded images (blob URLs)
        const imagesToUpload = images.filter(
          (img: string) =>
            !img.startsWith('blob:') &&
            !img.includes('blob.vercel-storage.com') &&
            !img.startsWith('http')
        )

        if (imagesToUpload.length > 0) {
          const basePath = `drafts/${session.user.id}/${Date.now()}`
          const uploadedUrls = await uploadImagesToBlob(imagesToUpload, basePath)
          imageUrls = [...uploadedUrls]
        }

        // Keep existing blob URLs and HTTP URLs
        const existingUrls = images.filter(
          (img: string) =>
            img.startsWith('blob:') ||
            img.includes('blob.vercel-storage.com') ||
            img.startsWith('http')
        )
        imageUrls = [...existingUrls, ...imageUrls]
      } catch (error) {
        console.error('[Drafts API] Error uploading images:', error)
        // Continue without images if upload fails
      }
    }

    // Upsert draft for this user (always update latest or create new)
    const existingDraft = await prisma.draft.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    let draft
    if (existingDraft) {
      // Update existing draft
      draft = await prisma.draft.update({
        where: { id: existingDraft.id },
        data: {
          formData: JSON.stringify(formData),
          images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
          selectedCategory: selectedCategory || null,
          selectedSubcategory: selectedSubcategory || null,
          selectedBooster: selectedBooster || null,
          paymentProtectionEnabled: paymentProtectionEnabled || false,
          currentStep: currentStep || 0,
          titleImageIndex: titleImageIndex || 0,
        },
      })
    } else {
      // Create new draft
      draft = await prisma.draft.create({
        data: {
          userId: session.user.id,
          formData: JSON.stringify(formData),
          images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
          selectedCategory: selectedCategory || null,
          selectedSubcategory: selectedSubcategory || null,
          selectedBooster: selectedBooster || null,
          paymentProtectionEnabled: paymentProtectionEnabled || false,
          currentStep: currentStep || 0,
          titleImageIndex: titleImageIndex || 0,
        },
      })
    }

    return NextResponse.json({
      draftId: draft.id,
      updatedAt: draft.updatedAt.toISOString(),
      draft: {
        ...draft,
        formData: JSON.parse(draft.formData),
        images: draft.images ? JSON.parse(draft.images) : [],
      },
    })
  } catch (error: any) {
    console.error('[Drafts API] Error upserting draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern des Entwurfs', error: error.message },
      { status: 500 }
    )
  }
}
