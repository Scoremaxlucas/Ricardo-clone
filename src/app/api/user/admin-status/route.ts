import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('Admin status API called, session user id:', session?.user?.id)
    console.log('Session user email:', session?.user?.email)

    if (!session?.user?.id && !session?.user?.email) {
      console.log('No session user id or email, returning 401')
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Versuche zuerst mit ID, dann mit E-Mail
    let user = null
    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, email: true, nickname: true },
      })
    }

    // Falls nicht gefunden, versuche mit E-Mail
    if (!user && session?.user?.email) {
      console.log('User not found by ID, trying email:', session.user.email)
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true, nickname: true },
      })
    }

    console.log('User found in DB:', {
      email: user?.email,
      nickname: user?.nickname,
      isAdmin: user?.isAdmin,
      isAdminType: typeof user?.isAdmin,
      isAdminValue: user?.isAdmin,
    })

    // Prüfe explizit auf true, 1, oder '1'
    const isAdminValue = user?.isAdmin === true

    console.log('Final isAdmin value:', isAdminValue)

    return NextResponse.json({
      isAdmin: isAdminValue,
      debug: {
        rawIsAdmin: user?.isAdmin,
        type: typeof user?.isAdmin,
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin status:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden des Admin-Status', error: error.message },
      { status: 500 }
    )
  }
}
