import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Helper: Admin-Check
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true
}

// GET: CSV-Export
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'

    const where: any = {}
    // RICARDO-STYLE: pending und approved sind beide sichtbar (approved entfernt)
    if (filter === 'active') {
      where.OR = [
        { moderationStatus: null },
        { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
      ]
    } else if (filter === 'inactive') {
      where.moderationStatus = { in: ['rejected', 'blocked', 'removed', 'ended'] }
    }

    const watches = await prisma.watch.findMany({
      where,
      include: {
        seller: {
          select: {
            name: true,
            email: true,
            nickname: true,
            verified: true,
          },
        },
        purchases: {
          select: {
            status: true,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // CSV-Header
    const headers = [
      'Artikelnummer',
      'Titel',
      'Marke',
      'Modell',
      'Preis',
      'Status',
      'Verkäufer',
      'Verkäufer E-Mail',
      'Verkäufer Verifiziert',
      'Erstellt',
      'Aufrufe',
      'Favoriten',
      'Meldungen',
      'Verkauft',
    ]

    // CSV-Zeilen
    const rows = watches.map(watch => {
      const activePurchases = watch.purchases.filter(p => p.status !== 'cancelled')
      const isSold = activePurchases.length > 0
      const pendingReports = watch.reports.filter(r => r.status === 'pending').length

      return [
        watch.articleNumber || '',
        `"${watch.title.replace(/"/g, '""')}"`,
        watch.brand,
        watch.model,
        watch.price.toFixed(2),
        // RICARDO-STYLE: pending und approved sind beide aktiv
        watch.moderationStatus === 'approved' ||
        watch.moderationStatus === 'pending' ||
        !watch.moderationStatus
          ? 'Aktiv'
          : 'Inaktiv',
        watch.seller.nickname || watch.seller.name || '',
        watch.seller.email,
        watch.seller.verified ? 'Ja' : 'Nein',
        watch.createdAt.toISOString().split('T')[0],
        watch.views.length.toString(),
        watch.favorites.length.toString(),
        pendingReports.toString(),
        isSold ? 'Ja' : 'Nein',
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="helvenda-angebote-${filter}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting watches:', error)
    return NextResponse.json({ message: 'Fehler beim Export: ' + error.message }, { status: 500 })
  }
}
