import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
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
    // Hole aktive Booster (für alle einsehbar, da Preise öffentlich sein sollen)
    let boosters = await prisma.boosterPrice.findMany({
      where: {
        isActive: true,
      },
      orderBy: { price: 'asc' },
    })

    // Wenn keine Booster vorhanden sind, erstelle sie automatisch
    if (boosters.length === 0) {
      console.log('[admin/boosters] Keine Booster gefunden, erstelle Standard-Booster...')

      const defaultBoosters = [
        {
          code: 'none',
          name: 'Kein Booster',
          description: 'Das Angebot wird nicht besonders hervorgehoben',
          price: 0.0,
          isActive: true,
        },
        {
          code: 'bronze',
          name: 'Bronze',
          description: 'Grundlegende Hervorhebung: Ihr Angebot wird in Suchergebnissen fett hervorgehoben',
          price: 5.0,
          isActive: true,
        },
        {
          code: 'silber',
          name: 'Silber',
          description:
            'Erhöhte Sichtbarkeit: Hervorhebung + Platzierung in der "Empfohlen"-Sektion auf der Startseite',
          price: 15.0,
          isActive: true,
        },
        {
          code: 'gold',
          name: 'Gold',
          description:
            'Maximale Sichtbarkeit: Premium-Platzierung ganz oben in allen Suchergebnissen + Startseite',
          price: 30.0,
          isActive: true,
        },
      ]

      // Erstelle Booster mit upsert (erstellt wenn nicht vorhanden, aktualisiert wenn vorhanden)
      for (const booster of defaultBoosters) {
        await prisma.boosterPrice.upsert({
          where: { code: booster.code },
          update: booster,
          create: booster,
        })
      }

      console.log('[admin/boosters] Standard-Booster erstellt')

      // Lade die erstellten Booster
      boosters = await prisma.boosterPrice.findMany({
        where: {
          isActive: true,
        },
        orderBy: { price: 'asc' },
      })
    }

    return NextResponse.json(boosters)
  } catch (error: any) {
    console.error('Error fetching booster prices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Booster-Preise', error: error.message },
      { status: 500 }
    )
  }
}
