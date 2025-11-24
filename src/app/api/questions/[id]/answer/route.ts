import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Frage beantworten (nur Verkäufer)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const questionId = params.id
    const body = await request.json()
    const { answer, isPublic } = body

    if (!answer) {
      return NextResponse.json({ error: 'Antwort erforderlich' }, { status: 400 })
    }

    // Hole die Frage mit Produktinformationen
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        watch: {
          select: {
            sellerId: true,
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der User der Verkäufer ist
    if (question.watch.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Nur der Verkäufer kann Fragen beantworten' }, { status: 403 })
    }

    // Aktualisiere die Frage mit der Antwort
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        answer: answer,
        answeredAt: new Date(),
        isPublic: isPublic !== undefined ? isPublic : true, // Default: öffentlich
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
        watch: {
          select: {
            title: true,
            sellerId: true
          }
        }
      },
    })

    // Erstelle Benachrichtigung für Fragesteller
    try {
      await prisma.notification.create({
        data: {
          userId: updatedQuestion.userId,
          type: 'ANSWER',
          title: 'Ihre Frage wurde beantwortet',
          message: `Der Verkäufer hat Ihre Frage zu "${updatedQuestion.watch.title}" beantwortet`,
          watchId: updatedQuestion.watchId,
          questionId: questionId
        }
      })
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
    }

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    console.error('Fehler beim Beantworten der Frage:', error)
    return NextResponse.json({ error: 'Fehler beim Beantworten der Frage' }, { status: 500 })
  }
}

// DELETE - Antwort löschen (nur Verkäufer)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const questionId = params.id

    // Hole die Frage mit Produktinformationen
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        watch: {
          select: {
            sellerId: true,
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Frage nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der User der Verkäufer ist
    if (question.watch.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Nur der Verkäufer kann Antworten löschen' }, { status: 403 })
    }

    // Entferne die Antwort (nicht die Frage selbst)
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        answer: null,
        answeredAt: null,
        isPublic: true,
      },
    })

    return NextResponse.json({ question: updatedQuestion })
  } catch (error) {
    console.error('Fehler beim Löschen der Antwort:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Antwort' }, { status: 500 })
  }
}

