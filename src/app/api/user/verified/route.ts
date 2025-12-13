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

    const userId = request.nextUrl.searchParams.get('userId') || session.user.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verified: true,
        verificationStatus: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      verified: user.verified === true && user.verificationStatus === 'approved',
    })
  } catch (error: any) {
    console.error('Error fetching verification status:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Verifizierungsstatus' },
      { status: 500 }
    )
  }
}
