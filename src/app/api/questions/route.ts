import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fragen für ein Produkt abrufen (verwendet Message Model)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')

    if (!watchId) {
      return NextResponse.json({ error: 'watchId erforderlich' }, { status: 400 })
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    // Hole das Angebot, um sellerId zu bekommen
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
    })

    if (!watch) {
      return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
    }

    // Hole alle öffentlichen Nachrichten (Fragen) für dieses Produkt
    // Verwende das Message Model statt Question Model
    const questionMessages = await prisma.message.findMany({
      where: {
        watchId: watchId,
        receiverId: watch.sellerId, // Fragen gehen an den Verkäufer
        isPublic: true, // Nur öffentliche Fragen
      },
      include: {
        sender: {
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

    // Transformiere Messages zu Questions-Format für Kompatibilität
    // Suche für jede Frage nach einer Antwort (Message vom Verkäufer zurück an den Fragesteller)
    const questions = await Promise.all(
      questionMessages.map(async msg => {
        // Suche nach Antwort (Message vom Verkäufer an den Fragesteller)
        const answerMessage = await prisma.message.findFirst({
          where: {
            watchId: watchId,
            senderId: watch.sellerId, // Verkäufer sendet Antwort
            receiverId: msg.senderId, // Antwort geht an Fragesteller
            createdAt: {
              gt: msg.createdAt, // Antwort muss nach der Frage kommen
            },
          },
          orderBy: {
            createdAt: 'asc', // Erste Antwort
          },
        })

        return {
          id: msg.id,
          watchId: msg.watchId,
          userId: msg.senderId,
          question: msg.content,
          answer: answerMessage?.content || null,
          isPublic: answerMessage?.isPublic ?? msg.isPublic,
          createdAt: msg.createdAt.toISOString(),
          answeredAt: answerMessage?.createdAt.toISOString() || null,
          user: msg.sender,
        }
      })
    )

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Fehler beim Abrufen der Fragen:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Fragen: ' + error.message }, { status: 500 })
  }
}

// POST - Neue Frage erstellen (verwendet Message Model)
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

    // Erstelle Frage als öffentliche Nachricht
    // Käufer stellt Frage an Verkäufer (immer öffentlich für Fragen)
    const newMessage = await prisma.message.create({
      data: {
        watchId: watchId,
        senderId: session.user.id,
        receiverId: watch.sellerId, // Frage geht an Verkäufer
        content: question,
        isPublic: true, // Fragen sind immer öffentlich
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    // Transformiere Message zu Question-Format für Kompatibilität
    const newQuestion = {
      id: newMessage.id,
      watchId: newMessage.watchId,
      userId: newMessage.senderId,
      question: newMessage.content,
      isPublic: newMessage.isPublic,
      createdAt: newMessage.createdAt,
      user: newMessage.sender,
    }

    // Erstelle Benachrichtigung für Verkäufer
    try {
      const askerName = newMessage.sender.nickname || newMessage.sender.name || newMessage.sender.email
      await prisma.notification.create({
        data: {
          userId: watch.sellerId,
          type: 'QUESTION',
          title: 'Neue Frage zu Ihrem Artikel',
          message: `${askerName} hat eine Frage zu "${watch.title}" gestellt`,
          watchId: watchId,
          questionId: newMessage.id, // Verwende messageId statt questionId
        },
      })
    } catch (notifError: any) {
      console.error('Error creating notification:', notifError)
      // Fehler bei Benachrichtigung sollte nicht die Frage-Erstellung blockieren
    }

    return NextResponse.json({ question: newQuestion }, { status: 201 })
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Frage:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Frage: ' + error.message }, { status: 500 })
  }
}
