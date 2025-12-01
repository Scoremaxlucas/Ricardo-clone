import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Einzelne Kontaktanfrage abrufen
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params
    const contactRequest = await prisma.contactRequest.findUnique({
      where: { id },
    })

    if (!contactRequest) {
      return NextResponse.json({ message: 'Kontaktanfrage nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({ contactRequest })
  } catch (error: any) {
    console.error('Error fetching contact request:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Kontaktanfrage: ' + error.message },
      { status: 500 }
    )
  }
}

// PATCH: Kontaktanfrage aktualisieren (Status ändern, Notizen hinzufügen)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedAt = new Date()
        updateData.resolvedBy = session.user.id
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const contactRequest = await prisma.contactRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Kontaktanfrage erfolgreich aktualisiert',
      contactRequest,
    })
  } catch (error: any) {
    console.error('Error updating contact request:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren der Kontaktanfrage: ' + error.message },
      { status: 500 }
    )
  }
}
