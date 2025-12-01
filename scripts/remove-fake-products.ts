import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Suche nach Fake-Artikeln...')

  // Test-User E-Mails identifizieren
  const testUserEmails = ['test@watch-out.ch', 'seller@watch-out.ch', 'test@example.com']

  // Finde alle Test-User
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: testUserEmails } },
        { id: 'test-user-123' },
        { email: { contains: 'test' } },
        { name: { contains: 'Test' } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  console.log(`\n📋 Gefundene Test-User (${testUsers.length}):`)
  testUsers.forEach(user => {
    console.log(`   - ${user.email} (${user.name || 'Kein Name'})`)
  })

  if (testUsers.length === 0) {
    console.log('\n✅ Keine Test-User gefunden. Nichts zu löschen.')
    return
  }

  const testUserIds = testUsers.map(u => u.id)

  // Finde alle Artikel von Test-Usern
  const fakeWatches = await prisma.watch.findMany({
    where: {
      sellerId: { in: testUserIds },
    },
    include: {
      seller: {
        select: {
          email: true,
          name: true,
        },
      },
      bids: true,
      purchases: true,
      favorites: true,
    },
  })

  console.log(`\n📦 Gefundene Fake-Artikel (${fakeWatches.length}):`)
  fakeWatches.forEach(watch => {
    console.log(`   - ${watch.title} (von ${watch.seller.email})`)
    console.log(`     - Gebote: ${watch.bids.length}`)
    console.log(`     - Käufe: ${watch.purchases.length}`)
    console.log(`     - Favoriten: ${watch.favorites.length}`)
  })

  if (fakeWatches.length === 0) {
    console.log('\n✅ Keine Fake-Artikel gefunden. Nichts zu löschen.')
    return
  }

  // Bestätigung
  console.log(`\n⚠️  WARNUNG: Es werden ${fakeWatches.length} Artikel gelöscht!`)
  console.log('   Dies kann nicht rückgängig gemacht werden.')

  // Lösche zuerst abhängige Daten
  const watchIds = fakeWatches.map(w => w.id)

  // Lösche Gebote
  const deletedBids = await prisma.bid.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`\n🗑️  ${deletedBids.count} Gebote gelöscht`)

  // Lösche Favoriten
  const deletedFavorites = await prisma.favorite.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedFavorites.count} Favoriten gelöscht`)

  // Lösche Nachrichten
  const deletedMessages = await prisma.message.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedMessages.count} Nachrichten gelöscht`)

  // Lösche Preisvorschläge
  const deletedPriceOffers = await prisma.priceOffer.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedPriceOffers.count} Preisvorschläge gelöscht`)

  // Lösche Fragen
  const deletedQuestions = await prisma.question.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedQuestions.count} Fragen gelöscht`)

  // Lösche Watch-Kategorien-Verknüpfungen
  const deletedWatchCategories = await prisma.watchCategory.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedWatchCategories.count} Kategorie-Verknüpfungen gelöscht`)

  // Lösche Invoice Items (falls vorhanden)
  const deletedInvoiceItems = await prisma.invoiceItem.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedInvoiceItems.count} Rechnungsposten gelöscht`)

  // Lösche Purchases (Käufe)
  const deletedPurchases = await prisma.purchase.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedPurchases.count} Käufe gelöscht`)

  // Lösche Sales (Verkäufe)
  const deletedSales = await prisma.sale.deleteMany({
    where: { watchId: { in: watchIds } },
  })
  console.log(`🗑️  ${deletedSales.count} Verkäufe gelöscht`)

  // Lösche die Artikel selbst
  const deletedWatches = await prisma.watch.deleteMany({
    where: { sellerId: { in: testUserIds } },
  })

  console.log(`\n✅ ${deletedWatches.count} Fake-Artikel erfolgreich gelöscht!`)
  console.log('\n📊 Zusammenfassung:')
  console.log(`   - Gelöschte Artikel: ${deletedWatches.count}`)
  console.log(`   - Gelöschte Gebote: ${deletedBids.count}`)
  console.log(`   - Gelöschte Favoriten: ${deletedFavorites.count}`)
  console.log(`   - Gelöschte Nachrichten: ${deletedMessages.count}`)
  console.log(`   - Gelöschte Preisvorschläge: ${deletedPriceOffers.count}`)
  console.log(`   - Gelöschte Fragen: ${deletedQuestions.count}`)
  console.log(`   - Gelöschte Käufe: ${deletedPurchases.count}`)
  console.log(`   - Gelöschte Verkäufe: ${deletedSales.count}`)
}

main()
  .catch(e => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
