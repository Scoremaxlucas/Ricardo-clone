import { authOptions } from '@/lib/auth'
import { uploadImageToBlob } from '@/lib/blob-storage'
import { checkRateLimit } from '@/lib/rate-limit'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate file content by checking magic bytes (file signatures).
 * Returns the detected MIME type or null if unrecognized.
 */
function detectFileType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer).slice(0, 12)

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  // GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return 'image/gif'
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }

  // PDF: 25 50 44 46 (%PDF)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf'
  }

  return null
}

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

    // SECURITY: Rate limiting - max 20 uploads per user per hour
    const rateLimitResult = await checkRateLimit({
      identifier: `upload:${session.user.id}`,
      limit: 20,
      window: 3600, // 1 hour
    })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          message: 'Zu viele Uploads. Bitte versuchen Sie es später erneut.',
          retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      )
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

    // Validiere MIME-Type (Browser-seitig)
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

    // Validiere Magic Bytes (server-seitig, nicht spoofbar)
    const fileBuffer = await file.arrayBuffer()
    const detectedType = detectFileType(fileBuffer)

    if (!detectedType || !allowedTypes.includes(detectedType)) {
      return NextResponse.json(
        { message: 'Dateiinhalt stimmt nicht mit dem Dateityp überein. Upload abgelehnt.' },
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
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

/**
 * Allowed CORS origins for upload endpoint
 */
function getAllowedOrigin(request?: NextRequest): string {
  const origin = request?.headers.get('origin') || ''
  const allowedOrigins = [
    'https://helvenda.ch',
    'https://www.helvenda.ch',
    'https://wohnen.helvenda.ch',
  ]

  // Allow Vercel preview deployments
  if (origin.endsWith('.vercel.app')) {
    return origin
  }

  // Allow localhost in development
  if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) {
    return origin
  }

  if (allowedOrigins.includes(origin)) {
    return origin
  }

  // Default: same-origin requests (no CORS header needed)
  return ''
}

/**
 * OPTIONS - CORS Preflight Handler
 */
export async function OPTIONS(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request)

  return new NextResponse(null, {
    status: 204,
    headers: {
      ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
