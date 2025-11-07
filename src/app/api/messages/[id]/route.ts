import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// isPublic Status einer Nachricht ändern (nur Verkäufer)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()
    const { isPublic } = data

    // Hole die Nachricht
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        watch: {
          select: {
            sellerId: true
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json(
        { message: 'Nachricht nicht gefunden' },
        { status: 404 }
      )
    }

    // Nur der Verkäufer kann isPublic ändern
    if (message.watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Nur der Verkäufer kann die Sichtbarkeit ändern' },
        { status: 403 }
      )
    }

    // Wenn eine Antwort öffentlich gemacht wird, muss auch die zugehörige Frage öffentlich sein
    if (isPublic === true && message.senderId === message.watch.sellerId) {
      // Dies ist eine Antwort vom Verkäufer - finde die ursprüngliche Frage
      // Die Frage ist die letzte private Nachricht vom Käufer (receiverId) an den Verkäufer (sellerId)
      const originalQuestion = await prisma.message.findFirst({
        where: {
          watchId: message.watchId,
          senderId: message.receiverId, // Der Käufer, der die Frage gestellt hat
          receiverId: message.watch.sellerId, // An den Verkäufer gerichtet
          isPublic: false, // Noch privat
          createdAt: {
            lt: message.createdAt // Vor dieser Antwort
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Wenn eine Frage gefunden wurde, mache sie auch öffentlich
      if (originalQuestion) {
        await prisma.message.update({
          where: { id: originalQuestion.id },
          data: { isPublic: true }
        })
        console.log(`Frage ${originalQuestion.id} wurde automatisch öffentlich gemacht, da Antwort ${message.id} öffentlich wurde`)
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: { isPublic },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (error: any) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { message: 'Fehler beim Aktualisieren: ' + error.message },
      { status: 500 }
    )
  }
}

