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

    // Entblockiere User
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedBy: null
      }
    })

    return NextResponse.json({ message: 'Benutzer wurde entblockiert' })
  } catch (error: any) {
    console.error('Error unblocking user:', error)
    return NextResponse.json(
      { message: 'Fehler beim Entblocken des Benutzers' },
      { status: 500 }
    )
  }
}




