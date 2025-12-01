import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper: Admin-Check
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true || user?.isAdmin === 1
}

// GET: Historie abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params

    const history = await prisma.moderationHistory.findMany({
      where: { watchId: id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ history })
  } catch (error: any) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Historie: ' + error.message },
      { status: 500 }
    )
  }
}

