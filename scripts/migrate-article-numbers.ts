#!/usr/bin/env tsx

/**
 * Migration Script: Weist allen bestehenden Artikeln ohne Artikelnummer eine zu
 * 
 * Verwendung:
 *   npx tsx scripts/migrate-article-numbers.ts
 * 
 * Oder mit npm:
 *   npm run migrate:article-numbers
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateArticleNumbers() {
  console.log('🚀 Starte Artikelnummer-Migration...')
  console.log('')

  try {
    // Teste Datenbankverbindung zuerst
    await prisma.$connect()
    console.log('✅ Datenbankverbindung erfolgreich')
    console.log('')
    // Finde alle Artikel ohne Artikelnummer, sortiert nach Erstellungsdatum
    const watchesWithoutNumber = await prisma.watch.findMany({
      where: {
        articleNumber: null
      },
      orderBy: {
        createdAt: 'asc' // Älteste zuerst
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    })

    console.log(`📊 Gefunden: ${watchesWithoutNumber.length} Artikel ohne Artikelnummer`)
    console.log('')

    if (watchesWithoutNumber.length === 0) {
      console.log('✅ Alle Artikel haben bereits eine Artikelnummer!')
      await prisma.$disconnect()
      process.exit(0)
      return
    }

    // Finde die höchste vorhandene Artikelnummer
    const watchWithHighestNumber = await prisma.watch.findFirst({
      where: {
        articleNumber: {
          not: null
        }
      },
      orderBy: {
        articleNumber: 'desc'
      },
      select: {
        articleNumber: true
      }
    })

    // Starte bei 10000000 wenn keine existiert, sonst bei der höchsten + 1
    let currentNumber = watchWithHighestNumber?.articleNumber 
      ? watchWithHighestNumber.articleNumber + 1
      : 10000000

    console.log(`🔢 Starte bei Artikelnummer: ${currentNumber}`)
    console.log('')

    // Weise jedem Artikel eine Nummer zu
    let successCount = 0
    let errorCount = 0

    for (const watch of watchesWithoutNumber) {
      try {
        await prisma.watch.update({
          where: { id: watch.id },
          data: { articleNumber: currentNumber }
        })

        console.log(`✅ ${currentNumber}: ${watch.title.substring(0, 50)}...`)
        successCount++
        currentNumber++

        // Prüfe ob Maximum erreicht
        if (currentNumber > 99999999) {
          console.error('❌ Maximale Artikelnummer erreicht (99999999)')
          break
        }
      } catch (error: any) {
        console.error(`❌ Fehler bei Artikel ${watch.id}: ${error.message}`)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 Zusammenfassung:')
    console.log(`   ✅ Erfolgreich: ${successCount}`)
    console.log(`   ❌ Fehler: ${errorCount}`)
    console.log(`   📈 Nächste verfügbare Nummer: ${currentNumber}`)
    console.log('')
    console.log('✅ Migration abgeschlossen!')
    
    // Explizit beenden
    await prisma.$disconnect()
    process.exit(0)

  } catch (error: any) {
    console.error('')
    console.error('❌ Fehler bei Migration:')
    console.error(`   ${error.message}`)
    if (error.stack) {
      console.error('')
      console.error('Stack Trace:')
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateArticleNumbers()

