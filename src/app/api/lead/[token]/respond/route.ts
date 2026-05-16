import { applyLandlordApplicationDecision } from '@/lib/rental/apply-landlord-application-decision'
import { findApplicationByLandlordLeadToken } from '@/lib/rental/landlord-lead-token'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const found = await findApplicationByLandlordLeadToken(decodeURIComponent(token))
  if (!found) {
    return NextResponse.json({ message: 'Link ungültig' }, { status: 404 })
  }
  if (found.expired) {
    return NextResponse.json({ message: 'Link abgelaufen' }, { status: 410 })
  }

  const app = found.application
  if (app.landlordRespondedAt || app.rejectedAt || app.viewingRequestedAt) {
    return NextResponse.json({ message: 'Bereits beantwortet' }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const action = body?.action
  if (action !== 'reject' && action !== 'request_viewing' && action !== 'contact_directly') {
    return NextResponse.json({ message: 'Ungültige Aktion' }, { status: 400 })
  }

  const result = await applyLandlordApplicationDecision({
    applicationId: app.id,
    action,
    viewingDate: typeof body?.viewingDate === 'string' ? body.viewingDate : undefined,
    viewingNote: typeof body?.viewingNote === 'string' ? body.viewingNote : undefined,
    rejectionNote: typeof body?.rejectionNote === 'string' ? body.rejectionNote : undefined,
    directContactNote: typeof body?.directContactNote === 'string' ? body.directContactNote : undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  revalidatePath(`/matching/properties/${app.rentalListingId}/bewerbungen`)
  revalidatePath('/meine-bewerbungen')

  return NextResponse.json({ success: true, action })
}
