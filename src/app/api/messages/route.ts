import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getAnswerNotificationEmail } from '@/lib/email'

// Nachrichten für ein Angebot abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const watchId = searchParams.get('watchId')

    if (!watchId) {
      return NextResponse.json(
        { message: 'watchId fehlt' },
        { status: 400 }
      )
    }

    // Hole das Angebot, um sellerId zu bekommen
    const watch = await prisma.watch.findUnique({
      where: { id: watchId }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Logik für private Nachrichten:
    // - Verkäufer sieht alle privaten Nachrichten (immer)
    // - Anfragender (der User, der die private Frage gestellt hat) sieht:
    //   1. Seine eigenen privaten Fragen (die er an den Verkäufer geschickt hat)
    //   2. Alle privaten Antworten des Verkäufers (die der Verkäufer an ihn geschickt hat)
    // - Andere User sehen private Nachrichten NICHT
    // - Öffentliche Nachrichten sind für alle sichtbar
    
    let whereClause: any = {
      watchId
    }

    if (session?.user?.id) {
      const userId = session.user.id
      const isSeller = userId === watch.sellerId

      if (isSeller) {
        // Verkäufer sieht alle Nachrichten (öffentlich + privat)
        whereClause.OR = [
          { isPublic: true },
          { isPublic: false }
        ]
      } else {
        // Für Anfragende: Finde alle privaten Nachrichten in seiner Konversation mit dem Verkäufer
        whereClause.OR = [
          { isPublic: true }, // Öffentliche Nachrichten
          // Private Nachrichten: User hat an Verkäufer geschickt
          {
            AND: [
              { isPublic: false },
              { senderId: userId },
              { receiverId: watch.sellerId }
            ]
          },
          // Private Nachrichten: Verkäufer hat an User geschickt
          {
            AND: [
              { isPublic: false },
              { senderId: watch.sellerId },
              { receiverId: userId }
            ]
          }
        ]
      }
    } else {
      // Nicht eingeloggte User sehen nur öffentliche Nachrichten
      whereClause.isPublic = true
    }

    console.log('Messages GET - userId:', session?.user?.id, 'sellerId:', watch.sellerId, 'isSeller:', session?.user?.id === watch.sellerId)
    console.log('Where clause:', JSON.stringify(whereClause, null, 2))

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log('Messages found:', messages.length)
    messages.forEach((msg: any) => {
      console.log(`Message ${msg.id}: sender=${msg.senderId}, receiver=${msg.receiverId}, isPublic=${msg.isPublic}`)
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Nachrichten: ' + error.message },
      { status: 500 }
    )
  }
}

// Neue Nachricht erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { watchId, content, isPublic = false } = data

    if (!watchId || !content) {
      return NextResponse.json(
        { message: 'watchId und content sind erforderlich' },
        { status: 400 }
      )
    }

    // Hole das Angebot, um sellerId zu bekommen
    const watch = await prisma.watch.findUnique({
      where: { id: watchId }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Receiver-Logik:
    // - Wenn Käufer schreibt: Receiver ist der Verkäufer
    // - Wenn Verkäufer schreibt: Receiver ist der Käufer, der die ursprüngliche Frage gestellt hat
    let receiverId: string
    if (session.user.id === watch.sellerId) {
      // Verkäufer antwortet - finde den ursprünglichen Fragesteller
      // Suche nach der letzten privaten Nachricht, die an den Verkäufer gerichtet war
      const lastBuyerMessage = await prisma.message.findFirst({
        where: {
          watchId,
          senderId: { not: watch.sellerId }, // Nicht vom Verkäufer
          receiverId: watch.sellerId // An den Verkäufer gerichtet
        },
        orderBy: { createdAt: 'desc' }
      })
      
      // Falls keine direkte Nachricht an den Verkäufer gefunden wurde, suche nach der letzten Nachricht vom Käufer
      if (!lastBuyerMessage) {
        const anyBuyerMessage = await prisma.message.findFirst({
          where: {
            watchId,
            senderId: { not: watch.sellerId } // Nicht vom Verkäufer
          },
          orderBy: { createdAt: 'desc' }
        })
        receiverId = anyBuyerMessage?.senderId || watch.sellerId // Fallback
      } else {
        receiverId = lastBuyerMessage.senderId
      }
      
      console.log('Verkäufer antwortet - receiverId:', receiverId, 'letzte Käufer-Nachricht:', lastBuyerMessage?.id)
    } else {
      // Käufer stellt Frage - Receiver ist der Verkäufer
      receiverId = watch.sellerId
      console.log('Käufer stellt Frage - receiverId:', receiverId)
    }

    const message = await prisma.message.create({
      data: {
        content,
        isPublic,
        watchId,
        senderId: session.user.id,
        receiverId
      },
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

    // Wenn Verkäufer eine Antwort direkt als öffentlich erstellt, mache auch die Frage automatisch öffentlich
    if (isPublic === true && session.user.id === watch.sellerId) {
      // Finde die ursprüngliche Frage (die letzte private Nachricht vom Käufer an den Verkäufer)
      const originalQuestion = await prisma.message.findFirst({
        where: {
          watchId,
          senderId: receiverId, // Der Käufer, der die Frage gestellt hat
          receiverId: watch.sellerId, // An den Verkäufer gerichtet
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
        console.log(`Frage ${originalQuestion.id} wurde automatisch öffentlich gemacht, da Antwort ${message.id} direkt als öffentlich erstellt wurde`)
      }
    }

    // E-Mail-Benachrichtigung senden, wenn der Verkäufer auf eine Frage antwortet
    if (session.user.id === watch.sellerId && receiverId !== watch.sellerId) {
      try {
        // Hole Empfänger-Details
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: { name: true, email: true, firstName: true }
        })

        if (receiver && receiver.email) {
          const buyerName = receiver.firstName || receiver.name || 'Kunde'
          const sellerName = session.user.name || 'Verkäufer'
          
          const emailContent = getAnswerNotificationEmail(
            buyerName,
            sellerName,
            watch.title,
            content,
            watchId,
            isPublic
          )

          await sendEmail({
            to: receiver.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
          })

          console.log(`E-Mail-Benachrichtigung an ${receiver.email} gesendet`)
        }
      } catch (error) {
        // E-Mail-Fehler sollten nicht die Nachricht-Erstellung verhindern
        console.error('Fehler beim Versenden der E-Mail-Benachrichtigung:', error)
      }
    }

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen der Nachricht: ' + error.message },
      { status: 500 }
    )
  }
}

