import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET: Alle Angebote für Admin-Moderation (inkl. inaktive)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Prüfe Admin-Status: Zuerst aus Session, dann aus Datenbank
    const isAdminInSession = session?.user?.isAdmin === true

    // Prüfe ob User Admin ist (per ID oder E-Mail)
    let user = null
    if (session.user.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, email: true },
      })
    }

    // Falls nicht gefunden per ID, versuche per E-Mail
    if (!user && session.user.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true, email: true },
      })
    }

    // Prüfe Admin-Status: Session ODER Datenbank
    const isAdminInDb = user?.isAdmin === true
    const isAdmin = isAdminInSession || isAdminInDb

    if (!isAdmin) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit
    const filter = searchParams.get('filter') || 'all'
    const category = searchParams.get('category')
    const sellerVerified = searchParams.get('sellerVerified')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category) {
      where.categories = {
        some: {
          category: {
            OR: [{ slug: category }, { name: category }],
          },
        },
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        ;(where.createdAt as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        ;(where.createdAt as Record<string, Date>).lte = new Date(dateTo)
      }
    }

    if (sellerVerified === 'true' || sellerVerified === 'false') {
      where.seller = {
        verified: sellerVerified === 'true',
      }
    }

    // SIMPLIFIED QUERY - Only load essential relations
    const [allWatches, totalCount] = await Promise.all([
      prisma.watch.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              nickname: true,
              verified: true,
            },
          },
          purchases: {
            select: {
              id: true,
              status: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          favorites: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              views: true,
              reports: true,
              adminNotes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.watch.count({ where }),
    ])

    // Parse images und berechne isActive für jedes Watch
    const now = new Date()
    const watchesWithCalculatedStatus = allWatches.map((watch: any) => {
      const images = watch.images ? JSON.parse(watch.images) : []

      // Berechne isActive basierend auf Purchase-Status und Auktion-Status
      // Nur nicht-stornierte Purchases zählen als "verkauft"
      const activePurchases = (watch.purchases || []).filter((p: any) => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0

      const auctionEndDate = watch.auctionEnd ? new Date(watch.auctionEnd) : null
      const isExpired = auctionEndDate ? auctionEndDate <= now : false
      const hasAnyPurchases = (watch.purchases || []).length > 0

      // WICHTIG: moderationStatus 'rejected' bedeutet deaktiviert (Admin hat es manuell deaktiviert)
      const isRejected = watch.moderationStatus === 'rejected'
      const isApproved = watch.moderationStatus === 'approved'

      // KRITISCH: Wenn moderationStatus = 'approved', ist das Produkt IMMER aktiv (außer verkauft)
      // Dies überschreibt alle anderen Berechnungen
      let calculatedIsActive: boolean
      if (isRejected) {
        calculatedIsActive = false // Rejected = immer inaktiv
      } else if (isApproved) {
        // KRITISCH: Approved = IMMER aktiv, außer es wurde verkauft
        // Ignoriere alle anderen Bedingungen (Auktion-Status, etc.)
        calculatedIsActive = !isSold
        // Double-check: Wenn approved aber trotzdem false, log error
        if (!calculatedIsActive && !isSold) {
          console.error(
            '[admin/watches] CRITICAL: Approved watch calculated as inactive but not sold!',
            {
              watchId: watch.id,
              moderationStatus: watch.moderationStatus,
              isSold,
              activePurchases: activePurchases.length,
            }
          )
          // Force to true as fallback
          calculatedIsActive = true
        }
      } else {
        // Für andere Status (pending, null): Berechne basierend auf Auktion
        calculatedIsActive = !isSold && (!auctionEndDate || !isExpired || hasAnyPurchases)
      }

      // Debug logging für approved watches die trotzdem inaktiv sind
      if (isApproved && !calculatedIsActive) {
        console.error('[admin/watches] Approved watch is inactive!', {
          watchId: watch.id,
          moderationStatus: watch.moderationStatus,
          isSold,
          activePurchasesCount: activePurchases.length,
          allPurchasesCount: (watch.purchases || []).length,
        })
      }

      // Use _count for efficient counting
      const viewCount = watch._count?.views || 0
      const favoriteCount = (watch.favorites || []).length
      const pendingReports = watch._count?.reports || 0
      const noteCount = watch._count?.adminNotes || 0

      return {
        ...watch,
        images,
        isActive: calculatedIsActive,
        viewCount,
        favoriteCount,
        pendingReports,
        noteCount,
        categories: (watch.categories || []).map((wc: any) => wc.category),
        // Remove _count from output
        _count: undefined,
      }
    })

    // Filtere basierend auf berechneter Aktivität, Reports und Moderation-Status
    let filteredWatches = watchesWithCalculatedStatus
    if (filter === 'active') {
      filteredWatches = watchesWithCalculatedStatus.filter(w => w.isActive)
    } else if (filter === 'inactive') {
      filteredWatches = watchesWithCalculatedStatus.filter(w => !w.isActive)
    } else if (filter === 'reported') {
      filteredWatches = watchesWithCalculatedStatus.filter((w: any) => w.pendingReports > 0)
    } else if (filter === 'pending') {
      filteredWatches = watchesWithCalculatedStatus.filter(
        (w: any) => !w.isActive && (w.moderationStatus === 'pending' || !w.moderationStatus)
      )
    }

    // Pagination auf gefilterte Ergebnisse anwenden
    const total = filteredWatches.length
    const watches = filteredWatches.slice(skip, skip + limit)

    return NextResponse.json({
      watches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('[admin/watches] CRITICAL ERROR:', error.message)
    console.error('[admin/watches] Error stack:', error.stack)
    console.error('[admin/watches] Error name:', error.name)
    console.error('[admin/watches] Error code:', error.code)

    // Check for common database errors
    const errorMessage = error.message || 'Unbekannter Fehler'
    const isDbError =
      errorMessage.includes('prisma') ||
      errorMessage.includes('database') ||
      errorMessage.includes('connect') ||
      errorMessage.includes('P1') ||
      errorMessage.includes('P2')

    return NextResponse.json(
      {
        message: 'Fehler beim Laden der Angebote: ' + errorMessage,
        isDbError,
        errorCode: error.code,
      },
      { status: 500 }
    )
  }
}
