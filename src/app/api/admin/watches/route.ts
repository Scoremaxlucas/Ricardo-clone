import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Angebote für Admin-Moderation (inkl. inaktive)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit
    const filter = searchParams.get('filter') || 'all' // all, active, inactive

    const where: any = {}
    if (filter === 'active') {
      where.isActive = true
    } else if (filter === 'inactive') {
      where.isActive = false
    }

    const [watches, total] = await Promise.all([
      prisma.watch.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.watch.count({ where }),
    ])

    // Parse images für jedes Watch
    const watchesWithParsedImages = watches.map((watch) => ({
      ...watch,
      images: watch.images ? JSON.parse(watch.images) : [],
    }))

    return NextResponse.json({
      watches: watchesWithParsedImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Error fetching watches for moderation:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Angebote: ' + error.message },
      { status: 500 }
    )
  }
}

