import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/push/subscribe — Save a push subscription for the current user
 * DELETE /api/push/subscribe — Remove a push subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { subscription } = await request.json()

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ message: 'Ungültige Subscription-Daten' }, { status: 400 })
    }

    // Upsert: create or update subscription
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    return NextResponse.json({ success: true, message: 'Push-Benachrichtigungen aktiviert' })
  } catch (error: any) {
    console.error('[push/subscribe] Error:', error)
    return NextResponse.json({ message: 'Fehler beim Speichern der Subscription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { endpoint } = await request.json()

    if (!endpoint) {
      return NextResponse.json({ message: 'Endpoint fehlt' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    })

    return NextResponse.json({ success: true, message: 'Push-Benachrichtigungen deaktiviert' })
  } catch (error: any) {
    console.error('[push/unsubscribe] Error:', error)
    return NextResponse.json({ message: 'Fehler beim Entfernen der Subscription' }, { status: 500 })
  }
}
