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
  return user?.isAdmin === true || user?.isAdmin === true
}

// GET: Historie abrufen
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const { id } = await params

    // Hole Moderation-Historie
    const moderationHistory = await prisma.moderationHistory.findMany({
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

    // Hole Watch-Daten für zusätzliche Informationen
    const watch = await prisma.watch.findUnique({
      where: { id },
      select: {
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    // Erstelle zusätzliche Historie-Einträge aus Watch-Daten
    const additionalHistory: any[] = []

    // Erstelle Eintrag für Erstellung
    if (watch) {
      additionalHistory.push({
        id: `created-${watch.createdAt.getTime()}`,
        action: 'created',
        details: JSON.stringify({
          createdBy: 'seller',
          sellerId: watch.seller.id,
          sellerName: watch.seller.nickname || watch.seller.name || watch.seller.email,
        }),
        createdAt: watch.createdAt,
        admin: {
          id: watch.seller.id,
          name: watch.seller.name,
          nickname: watch.seller.nickname,
          email: watch.seller.email,
        },
      })

      // Erstelle Eintrag für letzte Bearbeitung nur wenn kein "edited" Eintrag vorhanden ist
      // (edited Einträge haben bereits alle Details)
      if (watch.updatedAt && watch.updatedAt.getTime() !== watch.createdAt.getTime()) {
        // Prüfe ob es bereits einen Historie-Eintrag für diese Zeit gibt
        const hasRecentHistory = moderationHistory.some(
          h => Math.abs(new Date(h.createdAt).getTime() - watch.updatedAt!.getTime()) < 5000 // 5 Sekunden Toleranz
        )

        // Erstelle nur einen generischen "updated" Eintrag wenn kein "edited" Eintrag vorhanden ist
        if (!hasRecentHistory) {
          additionalHistory.push({
            id: `updated-${watch.updatedAt.getTime()}`,
            action: 'updated',
            details: JSON.stringify({
              updatedBy: 'seller',
              sellerId: watch.seller.id,
              sellerName: watch.seller.nickname || watch.seller.name || watch.seller.email,
              note: 'Automatische Aktualisierung (keine Details verfügbar)',
            }),
            createdAt: watch.updatedAt,
            admin: {
              id: watch.seller.id,
              name: watch.seller.name,
              nickname: watch.seller.nickname,
              email: watch.seller.email,
            },
          })
        }
      }
    }

    // Kombiniere und sortiere alle Historie-Einträge
    const allHistory = [...moderationHistory, ...additionalHistory].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ history: allHistory })
  } catch (error: any) {
    console.error('Error fetching history:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Historie: ' + error.message },
      { status: 500 }
    )
  }
}
