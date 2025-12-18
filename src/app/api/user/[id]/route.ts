import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Benutzer kann nur seine eigenen Daten abrufen
    if (session.user.id !== id) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        street: true,
        streetNumber: true,
        postalCode: true,
        city: true,
        country: true,
        addresszusatz: true,
        kanton: true,
        nickname: true,
        firstName: true,
        lastName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Benutzerdaten: ' + error.message },
      { status: 500 }
    )
  }
}
