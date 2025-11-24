#!/usr/bin/env tsx
import { prisma } from '../src/lib/prisma'

async function main() {
  const email = 'lucas.helvenda@outlook.com'
  const normalizedEmail = email.toLowerCase().trim()
  
  console.log('\n🔍 Suche nach User...')
  console.log(`   Email: ${normalizedEmail}`)
  
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  })
  
  if (!user) {
    console.log('❌ User nicht gefunden!')
    process.exit(1)
  }
  
  console.log('✅ User gefunden:', user.email)
  console.log('🗑️  Lösche User und abhängige Daten...')
  
  try {
    // Lösche abhängige Daten
    // Purchases (als Käufer)
    await prisma.purchase.deleteMany({ where: { buyerId: user.id } })
    
    // Watches (die der User verkauft hat)
    const watches = await prisma.watch.findMany({ where: { sellerId: user.id }, select: { id: true } })
    const watchIds = watches.map(w => w.id)
    
    // Lösche Purchases die mit diesen Watches verbunden sind
    if (watchIds.length > 0) {
      await prisma.purchase.deleteMany({ where: { watchId: { in: watchIds } } })
    }
    
    await prisma.watch.deleteMany({ where: { sellerId: user.id } })
    await prisma.bid.deleteMany({ where: { userId: user.id } })
    
    // PriceOffers (nur buyerId existiert)
    await prisma.priceOffer.deleteMany({ where: { buyerId: user.id } })
    
    // PriceOffers über Watches (die der User verkauft hat)
    if (watchIds.length > 0) {
      await prisma.priceOffer.deleteMany({ where: { watchId: { in: watchIds } } })
    }
    
    // Messages
    await prisma.message.deleteMany({ where: { senderId: user.id } })
    await prisma.message.deleteMany({ where: { receiverId: user.id } })
    
    // Notifications
    await prisma.notification.deleteMany({ where: { userId: user.id } })
    
    // Invoices
    await prisma.invoice.deleteMany({ where: { sellerId: user.id } })
    
    // Sales
    await prisma.sale.deleteMany({ where: { sellerId: user.id } })
    await prisma.sale.deleteMany({ where: { buyerId: user.id } })
    
    // Reviews
    await prisma.review.deleteMany({ where: { reviewerId: user.id } })
    await prisma.review.deleteMany({ where: { reviewedUserId: user.id } })
    
    // Favorites
    await prisma.favorite.deleteMany({ where: { userId: user.id } })
    
    // Lösche User
    await prisma.user.delete({ where: { id: user.id } })
    
    console.log('✅ User erfolgreich gelöscht!')
    console.log('💡 Sie können sich jetzt erneut mit dieser E-Mail registrieren.')
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    process.exit(1)
  }
}

main().finally(() => prisma.$disconnect())
