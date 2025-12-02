import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper: Admin-Check
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true || user?.isAdmin === true
}

// GET: Notizen abrufen
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params

    const notes = await prisma.adminNote.findMany({
      where: { watchId: id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error: any) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Notizen: ' + error.message },
      { status: 500 }
    )
  }
}

// POST: Notiz hinzufügen
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { note } = body

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ message: 'Notiz darf nicht leer sein' }, { status: 400 })
    }

    const adminNote = await prisma.adminNote.create({
      data: {
        watchId: id,
        adminId: session!.user!.id,
        note: note.trim(),
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
          },
        },
      },
    })

    // Historie-Eintrag
    await prisma.moderationHistory.create({
      data: {
        watchId: id,
        adminId: session!.user!.id,
        action: 'note_added',
        details: JSON.stringify({ note: note.trim() }),
      },
    })

    return NextResponse.json({ message: 'Notiz hinzugefügt', note: adminNote })
  } catch (error: any) {
    console.error('Error adding note:', error)
    return NextResponse.json(
      { message: 'Fehler beim Hinzufügen der Notiz: ' + error.message },
      { status: 500 }
    )
  }
}
