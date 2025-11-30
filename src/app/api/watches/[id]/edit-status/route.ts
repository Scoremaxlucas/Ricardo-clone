import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Prüft ob ein Artikel bearbeitet werden kann
 * RICARDO-STYLE: Artikel kann nicht bearbeitet werden wenn bereits ein aktiver Kauf stattgefunden hat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        purchases: {
          where: {
            status: { not: 'cancelled' }
          }
        },
        sales: true
      }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Artikel nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt' },
        { status: 403 }
      )
    }

    const hasActivePurchase = watch.purchases.length > 0 || watch.sales.length > 0

    return NextResponse.json({
      hasActivePurchase,
      canEdit: !hasActivePurchase
    })
  } catch (error: any) {
    console.error('[watches/edit-status] Error:', error)
    return NextResponse.json(
      { message: 'Fehler beim Prüfen des Status', error: error.message },
      { status: 500 }
    )
  }
}

// PATCH: Status eines Angebots aktualisieren (für Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Nur Administratoren können den Status ändern' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { message: 'isActive muss ein Boolean sein' },
        { status: 400 }
      )
    }

    const watch = await prisma.watch.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({
      message: `Angebot erfolgreich ${isActive ? 'aktiviert' : 'deaktiviert'}`,
      watch: {
        id: watch.id,
        isActive: watch.isActive,
      },
    })
  } catch (error: any) {
    console.error('[watches/edit-status] Error updating status:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren des Status', error: error.message },
      { status: 500 }
    )
  }
}

