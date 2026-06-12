import { applyLandlordApplicationDecision } from '@/lib/rental/apply-landlord-application-decision'
import { findApplicationByLandlordLeadToken } from '@/lib/rental/landlord-lead-token'
import { loadLandlordLeadApplicationView } from '@/lib/rental/landlord-lead-application-view'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const view = await loadLandlordLeadApplicationView(token)
  if (!view) {
    return NextResponse.json({ message: 'Link ungültig oder abgelaufen' }, { status: 404 })
  }
  return NextResponse.json({ application: view })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const app = await findApplicationByLandlordLeadToken(token)
  if (!app) {
    return NextResponse.json({ message: 'Link ungültig oder abgelaufen' }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Ungültiger Body' }, { status: 400 })
  }

  const action = body.action
  if (
    action !== 'reject' &&
    action !== 'request_viewing' &&
    action !== 'contact_directly'
  ) {
    return NextResponse.json({ message: 'Unbekannte Aktion' }, { status: 400 })
  }

  const result = await applyLandlordApplicationDecision({
    applicationId: app.id,
    action,
    viewingDate: body.viewingDate != null ? String(body.viewingDate) : undefined,
    viewingNote: typeof body.viewingNote === 'string' ? body.viewingNote : undefined,
    rejectionNote: typeof body.rejectionNote === 'string' ? body.rejectionNote : undefined,
    directContactNote: typeof body.directContactNote === 'string' ? body.directContactNote : undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status })
  }

  const view = await loadLandlordLeadApplicationView(token)
  return NextResponse.json({ ok: true, application: view })
}
