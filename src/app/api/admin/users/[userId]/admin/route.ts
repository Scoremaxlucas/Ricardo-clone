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
    const body = await request.json()
    const { isAdmin } = body

    // Verhindere, dass sich ein Admin selbst entfernt
    if (userId === session.user.id && !isAdmin) {
      return NextResponse.json(
        { message: 'Sie können sich nicht selbst die Admin-Rechte entziehen' },
        { status: 400 }
      )
    }

    // Setze Admin-Status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAdmin: isAdmin || false
      }
    })

    return NextResponse.json({ 
      message: isAdmin ? 'Benutzer wurde als Admin gesetzt' : 'Admin-Rechte wurden entfernt' 
    })
  } catch (error: any) {
    console.error('Error toggling admin:', error)
    return NextResponse.json(
      { message: 'Fehler beim Ändern der Admin-Rechte' },
      { status: 500 }
    )
  }
}




