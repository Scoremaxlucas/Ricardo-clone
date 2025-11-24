import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE: Suchabo löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const subscription = await prisma.searchSubscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suchabo nicht gefunden' },
        { status: 404 }
      )
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nicht berechtigt' },
        { status: 403 }
      )
    }

    await prisma.searchSubscription.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting search subscription:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Suchabos' },
      { status: 500 }
    )
  }
}

// PATCH: Suchabo aktualisieren (z.B. aktivieren/deaktivieren)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const subscription = await prisma.searchSubscription.findUnique({
      where: { id: params.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Suchabo nicht gefunden' },
        { status: 404 }
      )
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nicht berechtigt' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updated = await prisma.searchSubscription.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ subscription: updated })
  } catch (error: any) {
    console.error('Error updating search subscription:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Suchabos' },
      { status: 500 }
    )
  }
}





