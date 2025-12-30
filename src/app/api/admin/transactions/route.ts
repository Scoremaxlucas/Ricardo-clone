import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to check admin status
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id && !session?.user?.email) {
    return false
  }

  let user = null
  if (session.user.id) {
    user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })
  }

  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, email: true },
    })
  }

  const isAdminInDb = user?.isAdmin === true

  return isAdminInDb
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!(await checkAdmin(session))) {
      return NextResponse.json(
        { message: 'Zugriff verweigert. Admin-Rechte erforderlich.' },
        { status: 403 }
      )
    }

    // Lade alle Käufe
    // WICHTIG: Explizites select verwenden, um disputeInitiatedBy zu vermeiden
    const purchases = await prisma.purchase.findMany({
      select: {
        id: true,
        price: true,
        status: true,
        createdAt: true,
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
        watch: {
          select: {
            title: true,
            id: true,
            price: true,
            sellerId: true,
          },
        },
        // Nur benötigte Felder selektieren (disputeInitiatedBy wird NICHT selektiert)
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Hole Seller-Infos separat für alle Purchases
    const sellerIds = Array.from(new Set(purchases.map(p => p.watch.sellerId)))
    const sellers = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true },
    })
    const sellerMap = new Map(sellers.map(s => [s.id, s]))

    // Jetzt für Sales
    const sales = await prisma.sale.findMany({
      include: {
        seller: {
          select: {
            name: true,
            email: true,
          },
        },
        watch: {
          select: {
            title: true,
            id: true,
            price: true,
          },
        },
        buyer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Lade Pricing-Einstellungen (Standard: 10% Marge, max. CHF 220.-)
    const DEFAULT_PRICING = {
      platformMarginRate: 0.1,
      maximumCommission: 220,
    }
    // TODO: Später aus Pricing-API laden, aktuell Default-Werte
    const pricing = DEFAULT_PRICING

    // Kombiniere und formatiere Transaktionen
    const transactions = [
      ...purchases.map(p => {
        const price = p.price || p.watch.price || 0
        const seller = sellerMap.get(p.watch.sellerId)
        const calculatedMargin = price * pricing.platformMarginRate
        const margin = pricing.maximumCommission
          ? Math.min(calculatedMargin, pricing.maximumCommission)
          : calculatedMargin
        return {
          id: p.id,
          type: 'purchase' as const,
          price,
          margin,
          buyerName: p.buyer.name,
          buyerEmail: p.buyer.email,
          sellerName: seller?.name || null,
          sellerEmail: seller?.email || '',
          watchTitle: p.watch.title,
          watchId: p.watch.id,
          createdAt: p.createdAt.toISOString(),
        }
      }),
      ...sales.map(s => {
        const price = s.price || s.watch.price || 0
        const calculatedMargin = price * pricing.platformMarginRate
        const margin = pricing.maximumCommission
          ? Math.min(calculatedMargin, pricing.maximumCommission)
          : calculatedMargin
        return {
          id: s.id,
          type: 'sale' as const,
          price,
          margin,
          buyerName: s.buyer?.name || null,
          buyerEmail: s.buyer?.email || '',
          sellerName: s.seller.name,
          sellerEmail: s.seller.email,
          watchTitle: s.watch.title,
          watchId: s.watch.id,
          createdAt: s.createdAt.toISOString(),
        }
      }),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Berechne Statistiken
    const totalRevenue = transactions.reduce((sum, t) => sum + t.price, 0)
    const totalTransactions = transactions.length
    const platformMargin = transactions.reduce((sum, t) => sum + t.margin, 0)

    return NextResponse.json({
      transactions,
      stats: {
        totalRevenue,
        totalTransactions,
        platformMargin,
      },
    })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Transaktionen', error: error.message },
      { status: 500 }
    )
  }
}
