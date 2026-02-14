import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, isPublic } = body

    if (!content) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Hole das Angebot, um sellerId zu bestimmen
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: { sellerId: true },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Watch not found' }, { status: 404 })
    }

    // Receiver-Logik (server-seitig bestimmt):
    // - Käufer schreibt → Receiver ist der Verkäufer
    // - Verkäufer antwortet → Receiver ist der letzte Fragesteller
    let receiverId: string
    if (session.user.id === watch.sellerId) {
      // Verkäufer antwortet - finde den ursprünglichen Fragesteller
      const lastBuyerMessage = await prisma.message.findFirst({
        where: {
          watchId: id,
          senderId: { not: watch.sellerId },
          receiverId: watch.sellerId,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!lastBuyerMessage) {
        const anyBuyerMessage = await prisma.message.findFirst({
          where: {
            watchId: id,
            senderId: { not: watch.sellerId },
          },
          orderBy: { createdAt: 'desc' },
        })
        receiverId = anyBuyerMessage?.senderId || watch.sellerId
      } else {
        receiverId = lastBuyerMessage.senderId
      }
    } else {
      // Käufer stellt Frage → Receiver ist der Verkäufer
      receiverId = watch.sellerId
    }

    const message = await prisma.message.create({
      data: {
        content,
        watchId: id,
        senderId: session.user.id,
        receiverId,
        isPublic: isPublic || false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ message: 'Failed to create message' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    const where: any = {
      watchId: id,
    }

    if (!session || !session.user?.id) {
      where.isPublic = true
    } else {
      where.OR = [
        { isPublic: true },
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ]
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 })
  }
}
