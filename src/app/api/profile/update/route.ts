import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { name, nickname } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Name ist erforderlich' },
        { status: 400 }
      )
    }

    // Aktualisiere den Benutzer in der Datenbank
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        nickname: nickname?.trim() || null,
        // Aktualisiere auch firstName und lastName falls möglich
        firstName: name.trim().split(' ')[0] || null,
        lastName: name.trim().split(' ').slice(1).join(' ') || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        nickname: true,
        firstName: true,
        lastName: true,
      }
    })

    return NextResponse.json({
      message: 'Profil erfolgreich aktualisiert',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
