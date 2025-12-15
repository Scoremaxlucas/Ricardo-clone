import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const filter = searchParams.get('filter') || 'all' // all, active, inactive, reported
    const category = searchParams.get('category')
    const sellerVerified = searchParams.get('sellerVerified')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // WICHTIG: Lade ALLE Watches (kein Filter auf DB-Ebene), da wir isActive berechnen müssen
    const where: any = {}

    // Erweiterte Filter
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
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    if (sellerVerified === 'true' || sellerVerified === 'false') {
      where.seller = {
        verified: sellerVerified === 'true',
      }
    }

    // Versuche alle Watches mit allen Relationen zu laden
    // Falls neue Relationen noch nicht existieren, verwende Fallback
    let allWatches: any[]
    let totalCount: number

    try {
      const result = await Promise.all([
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
            views: {
              select: {
                id: true,
              },
            },
            favorites: {
              select: {
                id: true,
              },
            },
            reports: {
              select: {
                id: true,
                status: true,
                reason: true,
              },
            },
            adminNotes: {
              select: {
                id: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.watch.count({ where }),
      ])
      allWatches = result[0]
      totalCount = result[1]
    } catch (relationError: any) {
      // Fallback: Lade ohne neue Relationen falls sie noch nicht existieren
      console.warn('Error loading with new relations, using fallback:', relationError.message)
      const result = await Promise.all([
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
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.watch.count({ where }),
      ])
      allWatches = result[0].map((w: any) => ({
        ...w,
        views: [],
        reports: [],
        adminNotes: [],
      }))
      totalCount = result[1]
    }

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
          console.error('[admin/watches] CRITICAL: Approved watch calculated as inactive but not sold!', {
            watchId: watch.id,
            moderationStatus: watch.moderationStatus,
            isSold,
            activePurchases: activePurchases.length,
          })
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

      const pendingReports = (watch.reports || []).filter((r: any) => r.status === 'pending').length
      const viewCount = (watch.views || []).length
      const favoriteCount = (watch.favorites || []).length
      const noteCount = (watch.adminNotes || []).length

      // Debug logging for first watch to understand calculation
      if (watchesWithCalculatedStatus.length === 0 || watch.id === watchesWithCalculatedStatus[0]?.id) {
        console.log('[admin/watches] Watch calculation:', {
          watchId: watch.id,
          moderationStatus: watch.moderationStatus,
          isApproved: watch.moderationStatus === 'approved',
          isRejected: watch.moderationStatus === 'rejected',
          isSold,
          isExpired,
          hasAnyPurchases,
          calculatedIsActive,
        })
      }

      return {
        ...watch,
        images,
        isActive: calculatedIsActive, // Verwende berechnete Aktivität statt DB-Feld
        viewCount,
        favoriteCount,
        pendingReports,
        noteCount,
        categories: (watch.categories || []).map((wc: any) => wc.category),
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
    console.error('Error fetching watches for moderation:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Angebote: ' + (error.message || 'Unbekannter Fehler') },
      { status: 500 }
    )
  }
}
