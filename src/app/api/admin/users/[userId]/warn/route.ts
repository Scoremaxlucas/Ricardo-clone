import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Prüfe ob User Admin ist
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!admin?.isAdmin) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    const userId = params.userId

    // Erhöhe Warnungsanzahl
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { warningCount: true }
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        warningCount: (user?.warningCount || 0) + 1,
        lastWarnedAt: new Date()
      }
    })

    // TODO: Hier könnte eine E-Mail-Benachrichtigung gesendet werden

    return NextResponse.json({ message: 'Warnung wurde gesendet' })
  } catch (error: any) {
    console.error('Error warning user:', error)
    return NextResponse.json(
      { message: 'Fehler beim Senden der Warnung' },
      { status: 500 }
    )
  }
}




