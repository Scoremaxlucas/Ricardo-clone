import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true }
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true }
    })
  }

  const userEmail = session.user.email?.toLowerCase()
  const isAdminEmail = userEmail === 'admin@admin.ch'
  const isAdminInDb = user?.isAdmin === true || user?.isAdmin === 1

  return isAdminInDb || isAdminEmail
}

export async function GET(request: NextRequest) {
  try {
    // Hole aktive Booster (für alle einsehbar, da Preise öffentlich sein sollen)
    const boosters = await prisma.boosterPrice.findMany({
      where: {
        isActive: true
      },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json(boosters)
  } catch (error: any) {
    console.error('Error fetching booster prices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Booster-Preise', error: error.message },
      { status: 500 }
    )
  }
}

