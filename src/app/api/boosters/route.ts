import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/boosters
 * Returns all active boosters for public use (prices are public)
 * Used by the selling wizard to display booster options
 */
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
      console.log('[boosters] Keine Booster gefunden, erstelle Standard-Booster...')

      const defaultBoosters = [
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

      console.log('[boosters] Standard-Booster erstellt')

      // Lade die erstellten Booster
      boosters = await prisma.boosterPrice.findMany({
        where: {
          isActive: true,
        },
        orderBy: { price: 'asc' },
      })
    }

    // Transformiere für die Komponente: Filtere "none" raus und formatiere
    const boosterOptions = boosters
      .filter(b => b.code !== 'none') // "none" wird nicht als Option angezeigt
      .map(booster => ({
        id: booster.code,
        name: booster.name,
        description: booster.description || '',
        price: booster.price,
        badge: booster.code === 'gold' ? 'GOLD' : booster.code === 'silber' ? 'SILBER' : 'BRONZE',
        badgeColor: booster.code === 'gold' ? '#d97706' : booster.code === 'silber' ? '#64748b' : '#b45309',
      }))

    return NextResponse.json({ boosters: boosterOptions })
  } catch (error: any) {
    console.error('[boosters] Error fetching booster prices:', error)
    return NextResponse.json(
      { message: 'Fehler beim Laden der Booster-Preise', error: error.message, boosters: [] },
      { status: 500 }
    )
  }
}

