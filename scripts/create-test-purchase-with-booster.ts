import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Erstelle Test-Purchase mit Booster...\n')
  
  // Finde Uhr mit Booster
  const watch = await prisma.watch.findFirst({
    where: {
      boosters: { not: null }
    },
    include: {
      seller: true
    }
  })

  if (!watch) {
    console.log('❌ Keine Uhr mit Booster gefunden!')
    return
  }

  console.log(`📋 Gefundene Uhr: ${watch.title}`)
  console.log(`   Boosters: ${watch.boosters}`)
  console.log(`   Verkäufer: ${watch.seller.email}`)

  // Prüfe ob bereits ein Purchase existiert
  const existingPurchase = await prisma.purchase.findFirst({
    where: { watchId: watch.id }
  })

  if (existingPurchase) {
    console.log(`✅ Uhr wurde bereits verkauft (Purchase: ${existingPurchase.id})`)
    
    // Prüfe ob Rechnung existiert
    const existingInvoice = await prisma.invoice.findFirst({
      where: { saleId: existingPurchase.id }
    })

    if (existingInvoice) {
      console.log(`✅ Rechnung bereits vorhanden: ${existingInvoice.invoiceNumber}`)
    } else {
      console.log(`⚠️  Keine Rechnung vorhanden für diese Uhr. Erstelle jetzt...`)
      
      // Erstelle Rechnung
      const invoice = await createInvoiceForPurchase(existingPurchase.id, watch)
      console.log(`✅ Rechnung erstellt: ${invoice.invoiceNumber}`)
    }
    return
  }

  // Finde einen Test-Käufer
  const buyer = await prisma.user.findFirst({
    where: {
      email: { not: watch.seller.email }
    }
  })

  if (!buyer) {
    console.log('❌ Kein Käufer gefunden!')
    return
  }

  console.log(`👤 Käufer: ${buyer.email}`)

  // Erstelle Purchase
  const purchase = await prisma.purchase.create({
    data: {
      watchId: watch.id,
      buyerId: buyer.id,
      price: watch.price
    },
    include: {
      watch: true,
      buyer: true
    }
  })

  console.log(`✅ Purchase erstellt: ${purchase.id}`)

  // Erstelle Rechnung
  const invoice = await createInvoiceForPurchase(purchase.id, watch)
  console.log(`✅ Rechnung erstellt: ${invoice.invoiceNumber}`)
}

async function createInvoiceForPurchase(purchaseId: string, watch: any) {
  const DEFAULT_PRICING = {
    platformMarginRate: 0.1,
    vatRate: 0.081,
    minimumCommission: 0,
    listingFee: 0,
    transactionFee: 0
  }

  const salePrice = watch.price

  let selectedBoosters: string[] = []
  if (watch.boosters) {
    selectedBoosters = JSON.parse(watch.boosters)
  }

  const boosterPrices = await prisma.boosterPrice.findMany({
    where: { isActive: true }
  })

  const items: Array<{
    description: string
    quantity: number
    price: number
    total: number
  }> = []

  const platformFee = salePrice * DEFAULT_PRICING.platformMarginRate
  items.push({
    description: `Plattform-Gebühr (${(DEFAULT_PRICING.platformMarginRate * 100).toFixed(2)}%)`,
    quantity: 1,
    price: platformFee,
    total: platformFee
  })

  for (const boosterCode of selectedBoosters) {
    const booster = boosterPrices.find(b => b.code === boosterCode && b.isActive)
    if (booster) {
      items.push({
        description: `Booster: ${booster.name}`,
        quantity: 1,
        price: booster.price,
        total: booster.price
      })
      console.log(`   ➕ Booster: ${booster.name} (CHF ${booster.price})`)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const vatAmount = subtotal * DEFAULT_PRICING.vatRate
  // Schweizer Rappenrundung auf 0.05
  const totalBeforeRounding = subtotal + vatAmount
  const total = Math.ceil(totalBeforeRounding * 20) / 20

  const year = new Date().getFullYear()
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `REV-${year}-`
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let invoiceNumber = `REV-${year}-001`
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
    invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      sellerId: watch.sellerId,
      saleId: purchaseId,
      subtotal,
      vatRate: DEFAULT_PRICING.vatRate,
      vatAmount,
      total,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: items.map(item => ({
          watchId: watch.id,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      }
    },
    include: {
      items: true
    }
  })

  console.log(`   💰 Total: CHF ${total.toFixed(2)} (Subtotal: ${subtotal.toFixed(2)} + MwSt: ${vatAmount.toFixed(2)})`)
  
  return invoice
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

