import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    })

    return NextResponse.json({ nickname: user?.nickname || null })
  } catch (error: any) {
    console.error('Error fetching nickname:', error)
    return NextResponse.json({ message: 'Fehler beim Laden des Nicknames' }, { status: 500 })
  }
}
