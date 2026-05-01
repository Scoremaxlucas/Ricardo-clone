import { authOptions } from '@/lib/auth'
import { createQualifiedRentalApplication } from '@/lib/rental/createQualifiedRentalApplication'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Legacy-Endpunkt: gleiche Qualifikationslogik wie POST /api/rental-applications.
 * Akzeptiert JSON { message? } oder multipart mit Feld "message" (PDF-Upload wird nicht mehr unterstützt — Register gehört ins Profil).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id: listingId } = await params

    let message: string | null = null
    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await request.json().catch(() => null)
      const raw = typeof body?.message === 'string' ? body.message.trim() : ''
      message = raw.length > 0 ? raw.slice(0, 500) : null
    } else {
      const formData = await request.formData()
      const raw = (formData.get('message') as string)?.trim() || ''
      message = raw.length > 0 ? raw.slice(0, 500) : null
    }

    const result = await createQualifiedRentalApplication({
      userId: session.user.id,
      rentalListingId: listingId,
      message,
    })

    if (!result.ok) {
      if (result.code === 'ALREADY_APPLIED') {
        return NextResponse.json({ message: result.message }, { status: 409 })
      }
      if (result.code === 'NOT_QUALIFIED') {
        return NextResponse.json(
          { message: result.message, issues: result.issues, error: 'NOT_QUALIFIED' },
          { status: 403 }
        )
      }
      if (result.code === 'NO_PROFILE') {
        return NextResponse.json({ message: result.message }, { status: 403 })
      }
      if (result.code === 'FORBIDDEN') {
        return NextResponse.json({ message: result.message }, { status: 403 })
      }
      if (result.code === 'NO_EMAIL') {
        return NextResponse.json({ message: result.message }, { status: 400 })
      }
      return NextResponse.json({ message: result.message }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      redirectUrl: `/wohnungen/${listingId}`,
      message: 'Anfrage gesendet.',
    })
  } catch (e: unknown) {
    console.error('[rental contact POST]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
