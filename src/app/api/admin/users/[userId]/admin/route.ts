import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
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
    const body = await request.json()
    const { isAdmin } = body

    // Verhindere, dass sich ein Admin selbst entfernt
    if (userId === session.user.id && !isAdmin) {
      return NextResponse.json(
        { message: 'Sie können sich nicht selbst die Admin-Rechte entziehen' },
        { status: 400 }
      )
    }

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

    // Setze Admin-Status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: isAdmin || false,
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
            action: isAdmin ? 'admin_rights_granted' : 'admin_rights_removed',
            details: JSON.stringify({
              changedBy: session.user.id,
              changedByEmail: adminUser.email,
              changedByName: adminName,
              changedAt: new Date().toISOString(),
            }),
          },
        })
      }
    } catch (activityError) {
      console.warn('Could not create activity entry:', activityError)
    }

    return NextResponse.json({
      message: isAdmin ? 'Benutzer wurde als Admin gesetzt' : 'Admin-Rechte wurden entfernt',
    })
  } catch (error: any) {
    console.error('Error toggling admin:', error)
    return NextResponse.json({ message: 'Fehler beim Ändern der Admin-Rechte' }, { status: 500 })
  }
}
