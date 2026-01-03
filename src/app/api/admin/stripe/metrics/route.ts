import { authOptions } from '@/lib/auth'
import { getWebhookMetrics } from '@/lib/stripe-monitoring'
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

// GET: Get Stripe webhook metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '24')

    const metrics = await getWebhookMetrics(hours)

    return NextResponse.json({ metrics, hours })
  } catch (error: any) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Metriken', error: error.message },
      { status: 500 }
    )
  }
}
