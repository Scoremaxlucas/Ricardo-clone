import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImagesToBlob } from '@/lib/blob-storage'

// GET: Alle Entwürfe des Users abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const drafts = await prisma.draft.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('[Drafts API] Error fetching drafts:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Entwürfe' },
      { status: 500 }
    )
  }
}

// POST: Neuen Entwurf erstellen oder bestehenden aktualisieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

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
          (img: string) => !img.startsWith('blob:') && !img.includes('blob.vercel-storage.com') && !img.startsWith('http')
        )

        if (imagesToUpload.length > 0) {
          const basePath = `drafts/${session.user.id}/${Date.now()}`
          const uploadedUrls = await uploadImagesToBlob(imagesToUpload, basePath)
          imageUrls = [...uploadedUrls]
        }

        // Keep existing blob URLs and HTTP URLs
        const existingUrls = images.filter(
          (img: string) => img.startsWith('blob:') || img.includes('blob.vercel-storage.com') || img.startsWith('http')
        )
        imageUrls = [...existingUrls, ...imageUrls]
      } catch (error) {
        console.error('[Drafts API] Error uploading images:', error)
        // Continue without images if upload fails
      }
    }

    // Check if draft already exists for this user
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
      draft: {
        ...draft,
        formData: JSON.parse(draft.formData),
        images: draft.images ? JSON.parse(draft.images) : [],
      },
    })
  } catch (error) {
    console.error('[Drafts API] Error saving draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Speichern des Entwurfs' },
      { status: 500 }
    )
  }
}

// DELETE: Entwurf löschen
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('id')

    if (!draftId) {
      return NextResponse.json({ message: 'Entwurf-ID fehlt' }, { status: 400 })
    }

    // Verify ownership
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json({ message: 'Entwurf nicht gefunden' }, { status: 404 })
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Entwurf zu löschen' },
        { status: 403 }
      )
    }

    await prisma.draft.delete({
      where: { id: draftId },
    })

    return NextResponse.json({ message: 'Entwurf gelöscht' })
  } catch (error) {
    console.error('[Drafts API] Error deleting draft:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Entwurfs' },
      { status: 500 }
    )
  }
}

