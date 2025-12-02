import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET: Alle Notizen für einen User abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params

    // Prüfe ob userAdminNote verfügbar ist
    if (!prisma.userAdminNote) {
      console.error(
        'prisma.userAdminNote is not available. Prisma Client may need to be regenerated.'
      )
      return NextResponse.json([]) // Leere Liste zurückgeben statt Fehler
    }

    let notes = []
    try {
      notes = await prisma.userAdminNote.findMany({
        where: {
          userId,
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
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (dbError: any) {
      // Falls Tabelle noch nicht existiert oder Prisma Client nicht aktualisiert, gebe leere Liste zurück
      console.warn('Could not load user admin notes:', dbError.message)
      if (dbError.message?.includes('undefined') || dbError.message?.includes('findMany')) {
        console.warn('Prisma Client may need to be regenerated. Please restart the server.')
      }
      return NextResponse.json([])
    }

    return NextResponse.json(notes)
  } catch (error: any) {
    console.error('Error fetching user notes:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Notizen',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// POST: Neue Notiz erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { userId } = await params
    const { note } = await request.json()

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ message: 'Notiz darf nicht leer sein' }, { status: 400 })
    }

    // Prüfe ob userAdminNote verfügbar ist
    if (!prisma.userAdminNote) {
      console.error(
        'prisma.userAdminNote is not available. Prisma Client may need to be regenerated.'
      )
      return NextResponse.json(
        {
          message:
            'Die Notizen-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
        },
        { status: 503 }
      )
    }

    let newNote
    try {
      newNote = await prisma.userAdminNote.create({
        data: {
          userId,
          adminId: session.user.id,
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
    } catch (createError: any) {
      console.error('Error creating user admin note:', createError)
      // Prüfe ob es ein Prisma-Fehler ist (z.B. Tabelle existiert nicht)
      if (createError.code === 'P2001' || createError.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            message:
              'Die Notizen-Funktion ist noch nicht verfügbar. Bitte kontaktieren Sie den Support.',
          },
          { status: 503 }
        )
      }
      throw createError
    }

    // Erstelle Activity-Eintrag
    try {
      if (prisma.userActivity) {
        const adminName =
          newNote.admin.name ||
          `${newNote.admin.firstName || ''} ${newNote.admin.lastName || ''}`.trim() ||
          newNote.admin.nickname ||
          newNote.admin.email

        await prisma.userActivity.create({
          data: {
            userId,
            action: 'admin_note_added',
            details: JSON.stringify({
              noteId: newNote.id,
              adminId: session.user.id,
              adminEmail: newNote.admin.email,
              adminName: adminName,
            }),
          },
        })
      }
    } catch (activityError) {
      console.warn('Could not create activity entry:', activityError)
    }

    return NextResponse.json(newNote)
  } catch (error: any) {
    console.error('Error creating user note:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen der Notiz',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
