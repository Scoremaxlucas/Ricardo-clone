import { authOptions } from '@/lib/auth'
import { checkAndSendAlerts } from '@/lib/stripe-alerts'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Check if user is admin
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  return user?.isAdmin === true
}

// POST: Manually trigger alert check
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const thresholds = body.thresholds || {}

    const result = await checkAndSendAlerts(thresholds)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Error checking alerts:', error)
    return NextResponse.json(
      { message: 'Fehler beim Prüfen der Alerts', error: error.message },
      { status: 500 }
    )
  }
}
