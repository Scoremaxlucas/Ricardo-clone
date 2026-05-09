import { authOptions } from '@/lib/auth'
import { createQualifiedRentalApplication } from '@/lib/rental/createQualifiedRentalApplication'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const rentalListingId = typeof body?.rentalListingId === 'string' ? body.rentalListingId.trim() : ''
    const rawMessage = typeof body?.message === 'string' ? body.message.trim() : ''
    const message = rawMessage.length > 0 ? rawMessage.slice(0, 500) : null

    if (!rentalListingId) {
      return NextResponse.json({ code: 'BAD_REQUEST', message: 'rentalListingId fehlt' }, { status: 400 })
    }

    const result = await createQualifiedRentalApplication({
      userId,
      rentalListingId,
      message,
    })

    if (!result.ok) {
      if (result.code === 'ALREADY_APPLIED') {
        return NextResponse.json({ code: 'ALREADY_APPLIED', message: result.message }, { status: 409 })
      }
      if (result.code === 'NO_PROFILE') {
        return NextResponse.json({ code: 'NO_PROFILE', message: result.message }, { status: 403 })
      }
      if (result.code === 'NOT_QUALIFIED') {
        return NextResponse.json(
          {
            success: false,
            error: 'NOT_QUALIFIED',
            message: result.message,
            issues: result.issues,
          },
          { status: 403 }
        )
      }
      if (result.code === 'FORBIDDEN') {
        return NextResponse.json({ code: 'FORBIDDEN', message: result.message }, { status: 403 })
      }
      if (result.code === 'NO_EMAIL') {
        return NextResponse.json({ code: 'BAD_REQUEST', message: result.message }, { status: 400 })
      }
      if (result.code === 'NO_LANDLORD_NOTIFY_EMAIL') {
        return NextResponse.json({ code: 'NO_LANDLORD_NOTIFY_EMAIL', message: result.message }, { status: 422 })
      }
      return NextResponse.json({ code: 'LISTING_NOT_ACTIVE', message: result.message }, { status: 404 })
    }

    return NextResponse.json({ success: true, applicationId: result.applicationId })
  } catch (e: unknown) {
    console.error('[rental-applications POST]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
