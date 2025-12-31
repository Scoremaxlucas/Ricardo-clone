import { authOptions } from '@/lib/auth'
import { uploadImageToBlob } from '@/lib/blob-storage'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/upload
 * Generischer Datei-Upload-Endpunkt für Bilder und PDFs
 * Verwendet Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    // Prüfe Authentifizierung
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ message: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validiere Dateigrösse (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'Datei ist zu gross. Maximal 5MB erlaubt.' },
        { status: 400 }
      )
    }

    // Validiere Dateityp
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Dateityp nicht erlaubt. Nur Bilder (JPEG, PNG, GIF, WebP) und PDFs.' },
        { status: 400 }
      )
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '')

    // Generiere eindeutigen Dateinamen
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(extension)
      ? extension
      : 'jpg'

    const path = `${safeFolder}/${session.user.id}/${timestamp}-${randomSuffix}.${safeExtension}`

    console.log(`[upload] Uploading file for user ${session.user.id}: ${file.name} (${file.size} bytes) to ${path}`)

    // Upload zu Vercel Blob Storage
    const url = await uploadImageToBlob(file, path)

    console.log(`[upload] Successfully uploaded to: ${url}`)

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('[upload] Error uploading file:', error)
    return NextResponse.json(
      { message: 'Fehler beim Hochladen: ' + (error.message || 'Unbekannter Fehler') },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS - CORS Preflight Handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
