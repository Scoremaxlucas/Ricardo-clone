import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Aufruf tracken
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    // Prüfe ob Angebot existiert
    const watch = await prisma.watch.findUnique({
      where: { id },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Angebot nicht gefunden' }, { status: 404 })
    }

    // Hole IP und User-Agent
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Tracke Aufruf (nur wenn nicht in den letzten 5 Minuten vom gleichen User/IP)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const recentView = await prisma.watchView.findFirst({
      where: {
        watchId: id,
        OR: [session?.user?.id ? { userId: session.user.id } : {}, { ipAddress }],
        viewedAt: {
          gte: fiveMinutesAgo,
        },
      },
    })

    if (!recentView) {
      await prisma.watchView.create({
        data: {
          watchId: id,
          userId: session?.user?.id || null,
          ipAddress,
          userAgent,
        },
      })
    }

    return NextResponse.json({ message: 'Aufruf getrackt' })
  } catch (error: any) {
    // Fehler beim Tracking sollten nicht kritisch sein
    console.error('Error tracking view:', error)
    return NextResponse.json({ message: 'OK' })
  }
}
