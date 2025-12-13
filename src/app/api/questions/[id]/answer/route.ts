import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// POST - Antwort auf eine Frage erstellen (verwendet Message Model)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const body = await request.json()
    const { answer, isPublic = true } = body

    if (!answer) {
      return NextResponse.json({ error: 'Antwort erforderlich' }, { status: 400 })
    }

    // Hole die ursprüngliche Frage (Message)
    const questionMessage = await prisma.message.findUnique({
      where: { id },
      include: {
        watch: true,
        sender: true,
      },
    })

    if (!questionMessage) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der Benutzer der Verkäufer ist
    if (questionMessage.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Nur der Verkäufer kann Fragen beantworten' },
        { status: 403 }
      )
    }

    // Erstelle Antwort als neue Message
    // Verkäufer antwortet an den Fragesteller
    const answerMessage = await prisma.message.create({
      data: {
        watchId: questionMessage.watchId,
        senderId: session.user.id, // Verkäufer sendet Antwort
        receiverId: questionMessage.senderId, // Antwort geht an Fragesteller
        content: answer,
        isPublic: isPublic, // Kann öffentlich oder privat sein
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

    // Erstelle Benachrichtigung für den Fragesteller
    try {
      // Hole Verkäufer-Daten für Benachrichtigung
      const seller = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          nickname: true,
          email: true,
        },
      })
      const sellerName = seller?.nickname || seller?.name || seller?.email || 'Verkäufer'

      await prisma.notification.create({
        data: {
          userId: questionMessage.senderId, // Fragesteller erhält Benachrichtigung
          type: 'QUESTION_ANSWERED',
          title: 'Ihre Frage wurde beantwortet',
          message: `${sellerName} hat Ihre Frage zu "${questionMessage.watch.title}" beantwortet`,
          watchId: questionMessage.watchId,
          questionId: questionMessage.id,
        },
      })
    } catch (notifError: any) {
      console.error('Error creating notification for question answer:', notifError)
      // Fehler bei Benachrichtigung sollte nicht die Antwort-Erstellung blockieren
    }

    // Transformiere Message zu Question-Format für Kompatibilität
    const updatedQuestion = {
      id: questionMessage.id,
      watchId: questionMessage.watchId,
      userId: questionMessage.senderId,
      question: questionMessage.content,
      answer: answerMessage.content,
      isPublic: answerMessage.isPublic,
      createdAt: questionMessage.createdAt.toISOString(),
      answeredAt: answerMessage.createdAt.toISOString(),
      user: questionMessage.sender,
    }

    return NextResponse.json({ question: updatedQuestion }, { status: 200 })
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Antwort:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Antwort: ' + error.message }, { status: 500 })
  }
}
