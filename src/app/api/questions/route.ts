import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fragen für ein Produkt abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')
    
    if (!watchId) {
      return NextResponse.json({ error: 'watchId erforderlich' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Hole alle Fragen für dieses Produkt
    const questions = await prisma.question.findMany({
      where: {
        watchId: watchId,
        OR: [
          { isPublic: true }, // Öffentliche Fragen
          { userId: userId || '' }, // Oder eigene Fragen (auch wenn privat beantwortet)
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Fehler beim Abrufen der Fragen:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Fragen' }, { status: 500 })
  }
}

// POST - Neue Frage erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const body = await request.json()
    const { watchId, question } = body

    if (!watchId || !question) {
      return NextResponse.json({ error: 'watchId und question erforderlich' }, { status: 400 })
    }

    // Prüfe ob Produkt existiert
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
    })

    if (!watch) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }

    // Erstelle Frage
    const newQuestion = await prisma.question.create({
      data: {
        watchId: watchId,
        userId: session.user.id,
        question: question,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    // Erstelle Benachrichtigung für Verkäufer
    try {
      const askerName = newQuestion.user.nickname || newQuestion.user.name || newQuestion.user.email
      await prisma.notification.create({
        data: {
          userId: watch.sellerId,
          type: 'QUESTION',
          title: 'Neue Frage zu Ihrem Artikel',
          message: `${askerName} hat eine Frage zu "${watch.title}" gestellt`,
          watchId: watchId,
          questionId: newQuestion.id
        }
      })
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
    }

    return NextResponse.json({ question: newQuestion }, { status: 201 })
  } catch (error) {
    console.error('Fehler beim Erstellen der Frage:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Frage' }, { status: 500 })
  }
}

