import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID erforderlich' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true }
    })

    return NextResponse.json({
      image: user?.image || null
    })
  } catch (error) {
    console.error('Error getting profile image:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
