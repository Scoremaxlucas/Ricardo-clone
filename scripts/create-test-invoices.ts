import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Kopie der Rechnungslogik
const DEFAULT_PRICING = {
  platformMarginRate: 0.1, // 10%
  vatRate: 0.081, // 8.1% MwSt
  minimumCommission: 0,
  listingFee: 0,
  transactionFee: 0,
}

async function calculateInvoiceForPurchase(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      watch: {
        include: {
          seller: true,
        },
      },
      buyer: true,
    },
  })

  if (!purchase || !purchase.watch) {
    throw new Error('Purchase oder Watch nicht gefunden')
  }

  const salePrice = purchase.price || purchase.watch.price

  let selectedBoosters: string[] = []
  try {
    if (purchase.watch.boosters) {
      selectedBoosters = JSON.parse(purchase.watch.boosters)
      console.log(`   Parsed boosters:`, selectedBoosters)
    }
  } catch (e) {
    console.error('   Error parsing boosters:', e)
  }

  const boosterPrices = await prisma.boosterPrice.findMany({
    where: { isActive: true },
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
    total: platformFee,
  })

  for (const boosterCode of selectedBoosters) {
    const booster = boosterPrices.find(b => b.code === boosterCode && b.isActive)
    if (booster) {
      items.push({
        description: `Booster: ${booster.name}`,
        quantity: 1,
        price: booster.price,
        total: booster.price,
      })
      console.log(`   Added booster: ${booster.name} (CHF ${booster.price})`)
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
        startsWith: `REV-${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  })

  let invoiceNumber = `REV-${year}-001`
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
    invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
  }

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      sellerId: purchase.watch.sellerId,
      saleId: purchaseId,
      subtotal,
      vatRate: DEFAULT_PRICING.vatRate,
      vatAmount,
      total,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: items.map(item => ({
          watchId: purchase.watchId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      },
    },
    include: {
      items: true,
    },
  })

  return invoice
}

async function main() {
  console.log('🔄 Erstelle Rechnungen für bestehende Purchases...\n')

  const purchases = await prisma.purchase.findMany({
    include: {
      watch: {
        include: {
          seller: true,
        },
      },
      buyer: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log(`📋 Gefundene Purchases: ${purchases.length}\n`)

  for (const purchase of purchases) {
    try {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { saleId: purchase.id },
      })

      if (existingInvoice) {
        console.log(`✅ Rechnung bereits vorhanden für Purchase ${purchase.id}`)
        continue
      }

      console.log(`📝 Erstelle Rechnung für Purchase ${purchase.id}`)
      console.log(`   Watch: ${purchase.watch.title}`)
      console.log(`   Seller: ${purchase.watch.seller.email}`)
      console.log(`   Price: CHF ${purchase.price || purchase.watch.price}`)

      const invoice = await calculateInvoiceForPurchase(purchase.id)

      console.log(`✅ Rechnung erstellt: ${invoice.invoiceNumber}`)
      console.log(`   Total: CHF ${invoice.total.toFixed(2)}\n`)
    } catch (error: any) {
      console.error(`❌ Fehler bei Purchase ${purchase.id}:`, error.message, '\n')
    }
  }

  console.log('✅ Fertig!')
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
