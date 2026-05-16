import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { sendLandlordLeadNotificationForApplication } from '@/lib/rental/sendLandlordLeadNotification'
import { getWohnenLeadEmailOverride } from '@/lib/rental/wohnen-lead-email-override'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id } = await params
  const result = await sendLandlordLeadNotificationForApplication(id)

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 502 })
  }

  return NextResponse.json({
    success: true,
    deliveredTo: result.deliveredTo,
    intendedTo: result.intendedTo,
    isOverride: result.isOverride,
    overrideEnv: getWohnenLeadEmailOverride(),
  })
}
