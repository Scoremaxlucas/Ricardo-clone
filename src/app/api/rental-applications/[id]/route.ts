import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Vermieter: Detail einer Anfrage für eigenes Inserat */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params
    const app = await prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, userId: true } },
        applicant: {
          select: {
            id: true,
            name: true,
            firstName: true,
            nickname: true,
            email: true,
            image: true,
            verified: true,
          },
        },
      },
    })

    if (!app || !app.listing) {
      return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
    }

    if (app.listing.userId !== session.user.id) {
      return NextResponse.json({ message: 'Kein Zugriff' }, { status: 403 })
    }

    return NextResponse.json({
      application: {
        id: app.id,
        createdAt: app.createdAt.toISOString(),
        status: app.status,
        message: app.message,
        creditCheckResult: app.creditCheckResult,
        listing: { id: app.listing.id, title: app.listing.title },
        applicant: app.applicant,
      },
    })
  } catch (e: unknown) {
    console.error('[rental-applications GET]', e)
    const msg = e instanceof Error ? e.message : 'Fehler'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
