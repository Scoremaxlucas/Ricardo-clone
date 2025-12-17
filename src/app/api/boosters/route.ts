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
          code: 'boost',
          name: 'Boost',
          description: 'Das Angebot wird in einer Liste von ähnlichen Modellen fett hervorgehoben',
          price: 10.0,
          isActive: true,
        },
        {
          code: 'turbo-boost',
          name: 'Turbo-Boost',
          description:
            'Das Angebot wird nicht nur hervorgehoben sondern erscheint teilweise auf der Hauptseite als "Turbo-Boost-Angebot"',
          price: 25.0,
          isActive: true,
        },
        {
          code: 'super-boost',
          name: 'Super-Boost',
          description:
            'Das Angebot wird hervorgehoben, erscheint teilweise auf der Hauptseite und wird immer zuoberst in der Liste angezeigt',
          price: 45.0,
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
        badge: booster.code === 'super-boost' ? 'SUPER' : booster.code === 'turbo-boost' ? 'TURBO' : 'BOOST',
        badgeColor: booster.code === 'super-boost' ? '#dc2626' : booster.code === 'turbo-boost' ? '#ea580c' : '#059669',
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

