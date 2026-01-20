import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
        // Nur nicht-archivierte zählen (handle null for backward compatibility)
        archived: { not: true },
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error counting notifications:', error)
    return NextResponse.json({ count: 0 })
  }
}
