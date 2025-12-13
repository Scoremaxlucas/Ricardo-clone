import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// PUT: Notiz aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const isAdminInSession = session?.user?.isAdmin === true
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
    const isAdmin = isAdminInSession || adminUser?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { noteId } = await params
    const { note } = await request.json()

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ message: 'Notiz darf nicht leer sein' }, { status: 400 })
    }

    // Prüfe ob userAdminNote verfügbar ist
    if (!prisma.userAdminNote) {
      return NextResponse.json(
        {
          message:
            'Die Notizen-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
        },
        { status: 503 }
      )
    }

    // Prüfe ob Notiz existiert und Admin-Berechtigung
    const existingNote = await prisma.userAdminNote.findUnique({
      where: { id: noteId },
    })

    if (!existingNote) {
      return NextResponse.json({ message: 'Notiz nicht gefunden' }, { status: 404 })
    }

    const updatedNote = await prisma.userAdminNote.update({
      where: { id: noteId },
      data: {
        note: note.trim(),
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            nickname: true,
          },
        },
      },
    })

    return NextResponse.json(updatedNote)
  } catch (error: any) {
    console.error('Error updating user note:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Aktualisieren der Notiz',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE: Notiz löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const isAdminInSession = session?.user?.isAdmin === true
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })
    const isAdmin = isAdminInSession || adminUser?.isAdmin === true

    if (!isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const { noteId } = await params

    // Prüfe ob userAdminNote verfügbar ist
    if (!prisma.userAdminNote) {
      return NextResponse.json(
        {
          message:
            'Die Notizen-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
        },
        { status: 503 }
      )
    }

    // Prüfe ob Notiz existiert
    const existingNote = await prisma.userAdminNote.findUnique({
      where: { id: noteId },
    })

    if (!existingNote) {
      return NextResponse.json({ message: 'Notiz nicht gefunden' }, { status: 404 })
    }

    await prisma.userAdminNote.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ message: 'Notiz gelöscht' })
  } catch (error: any) {
    console.error('Error deleting user note:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Löschen der Notiz',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
