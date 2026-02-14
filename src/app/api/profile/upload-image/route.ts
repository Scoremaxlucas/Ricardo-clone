import { authOptions } from '@/lib/auth'
import { deleteImageFromBlob, uploadImageToBlob } from '@/lib/blob-storage'
import { checkRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

/** Validate actual file content via magic bytes */
function detectFileType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer).slice(0, 12)
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png'
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp'
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // SECURITY: Rate limiting - max 10 profile image uploads per user per hour
    const rateLimitResult = await checkRateLimit({
      identifier: `profile-upload:${session.user.id}`,
      limit: 10,
      window: 3600, // 1 hour
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          message: 'Zu viele Profilbild-Uploads. Bitte versuchen Sie es später erneut.',
          retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ message: 'Datei und User ID erforderlich' }, { status: 400 })
    }

    // Authorization: users can only upload their own profile image
    if (userId !== session.user.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 403 })
    }

    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: `Datei zu gross. Maximal ${MAX_FILE_SIZE / 1024 / 1024} MB erlaubt.` },
        { status: 400 }
      )
    }

    // MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'Ungültiges Dateiformat. Erlaubt: JPG, PNG, WebP.' },
        { status: 400 }
      )
    }

    // Magic byte validation
    const buffer = await file.arrayBuffer()
    const detectedType = detectFileType(buffer)
    if (!detectedType) {
      return NextResponse.json(
        { message: 'Datei konnte nicht als gültiges Bild erkannt werden.' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob Storage
    const ext = detectedType === 'image/png' ? 'png' : detectedType === 'image/webp' ? 'webp' : 'jpg'
    const blobPath = `profiles/${userId}/${Date.now()}.${ext}`
    const blobUrl = await uploadImageToBlob(new File([buffer], `profile.${ext}`, { type: detectedType }), blobPath)

    console.log('Uploaded to Blob Storage:', blobUrl)

    // Lösche altes Profilbild aus Blob Storage falls vorhanden
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })

    if (existingUser?.image && existingUser.image.startsWith('https://')) {
      try {
        await deleteImageFromBlob(existingUser.image)
        console.log('Deleted old profile image from Blob Storage')
      } catch (error) {
        // Nicht kritisch wenn Löschen fehlschlägt
        console.warn('Could not delete old profile image:', error)
      }
    }

    // Speichere Blob URL in der Datenbank
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: blobUrl },
      select: { id: true, image: true },
    })

    console.log('Updated user:', updatedUser)

    return NextResponse.json({
      message: 'Profilbild erfolgreich hochgeladen',
      imageUrl: blobUrl,
    })
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId } = await request.json()
    const effectiveUserId = userId || session.user.id

    // Users can only delete their own profile image (admins could be exempted if needed)
    if (effectiveUserId !== session.user.id) {
      return NextResponse.json({ message: 'Keine Berechtigung' }, { status: 403 })
    }

    // Hole aktuelles Profilbild
    const user = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { image: true },
    })

    // Lösche Profilbild aus Blob Storage falls vorhanden
    if (user?.image && user.image.startsWith('https://')) {
      try {
        await deleteImageFromBlob(user.image)
        console.log('Deleted profile image from Blob Storage')
      } catch (error) {
        // Nicht kritisch wenn Löschen fehlschlägt
        console.warn('Could not delete profile image from Blob Storage:', error)
      }
    }

    // Entferne Profilbild aus Datenbank
    await prisma.user.update({
      where: { id: effectiveUserId },
      data: { image: null },
    })

    return NextResponse.json({
      message: 'Profilbild erfolgreich entfernt',
    })
  } catch (error) {
    console.error('Error removing profile image:', error)
    return NextResponse.json({ message: 'Ein Fehler ist aufgetreten' }, { status: 500 })
  }
}
