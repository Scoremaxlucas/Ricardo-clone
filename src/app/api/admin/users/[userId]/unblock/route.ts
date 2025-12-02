import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe ob User Admin ist
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const userId = params.userId

    // Hole Admin-Informationen
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
      },
    })

    // Entblockiere User
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedBy: null,
      },
    })

    // Erstelle Activity-Eintrag
    try {
      if (prisma.userActivity && adminUser) {
        const adminName =
          adminUser.name ||
          `${adminUser.firstName} ${adminUser.lastName}` ||
          adminUser.nickname ||
          adminUser.email

        await prisma.userActivity.create({
          data: {
            userId: userId,
            action: 'user_unblocked',
            details: JSON.stringify({
              unblockedBy: session.user.id,
              unblockedByEmail: adminUser.email,
              unblockedByName: adminName,
              unblockedAt: new Date().toISOString(),
            }),
          },
        })
      }
    } catch (activityError) {
      console.warn('Could not create activity entry:', activityError)
    }

    return NextResponse.json({ message: 'Benutzer wurde entblockiert' })
  } catch (error: any) {
    console.error('Error unblocking user:', error)
    return NextResponse.json({ message: 'Fehler beim Entblocken des Benutzers' }, { status: 500 })
  }
}
