import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// POST: Upload image for a draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: draftId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Verify draft exists and belongs to user
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json({ message: 'Entwurf nicht gefunden' }, { status: 404 })
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Entwurf zu bearbeiten' },
        { status: 403 }
      )
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validiere Dateigrösse (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'Datei ist zu gross. Maximal 5MB erlaubt.' },
        { status: 400 }
      )
    }

    // Validiere Dateityp (MIME + Magic Bytes)
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Nur Bilder erlaubt (JPEG, PNG, GIF, WebP).' },
        { status: 400 }
      )
    }

    const fileBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(fileBuffer).slice(0, 12)
    const isValidImage =
      // JPEG
      (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
      // PNG
      (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
      // GIF
      (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) ||
      // WebP
      (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
       bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)

    if (!isValidImage) {
      return NextResponse.json(
        { message: 'Dateiinhalt ist kein gültiges Bild. Upload abgelehnt.' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob Storage (file is already compressed on client)
    const blob = await put(`drafts/${draftId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type || 'image/jpeg',
    })

    // Get current max sortOrder for this draft
    const maxSortOrder = await prisma.draftImage.findFirst({
      where: { draftId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const nextSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1

    // Create DraftImage record
    const draftImage = await prisma.draftImage.create({
      data: {
        draftId,
        storageKey: blob.pathname,
        url: blob.url,
        sortOrder: nextSortOrder,
      },
    })

    return NextResponse.json({
      image: {
        id: draftImage.id,
        storageKey: draftImage.storageKey,
        url: draftImage.url,
        sortOrder: draftImage.sortOrder,
      },
    })
  } catch (error: any) {
    console.error('[Drafts API] Error uploading image:', error)
    return NextResponse.json(
      { message: 'Fehler beim Hochladen des Bildes', error: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove image from draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: draftId, imageId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Verify draft exists and belongs to user
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    })

    if (!draft) {
      return NextResponse.json({ message: 'Entwurf nicht gefunden' }, { status: 404 })
    }

    if (draft.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, diesen Entwurf zu bearbeiten' },
        { status: 403 }
      )
    }

    // Get image record
    const image = await prisma.draftImage.findUnique({
      where: { id: imageId },
    })

    if (!image || image.draftId !== draftId) {
      return NextResponse.json({ message: 'Bild nicht gefunden' }, { status: 404 })
    }

    // Delete from storage (if using Vercel Blob, we'd need to import del from @vercel/blob)
    // For now, just delete the DB record
    // TODO: Implement blob deletion if needed

    // Delete from database (CASCADE will handle coverImageId reference)
    await prisma.draftImage.delete({
      where: { id: imageId },
    })

    return NextResponse.json({ message: 'Bild gelöscht' })
  } catch (error: any) {
    console.error('[Drafts API] Error deleting image:', error)
    return NextResponse.json(
      { message: 'Fehler beim Löschen des Bildes', error: error.message },
      { status: 500 }
    )
  }
}

