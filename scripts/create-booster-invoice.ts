import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Erstelle Booster-Rechnung für vorhandene Uhr...\n')

  // Finde Uhr mit Booster
  const watch = await prisma.watch.findFirst({
    where: {
      boosters: { not: null },
    },
    include: {
      seller: true,
    },
  })

  if (!watch) {
    console.log('❌ Keine Uhr mit Booster gefunden!')
    return
  }

  console.log(`📋 Gefundene Uhr: ${watch.title}`)
  console.log(`   Boosters: ${watch.boosters}`)
  console.log(`   Verkäufer: ${watch.seller.email}`)

  // Prüfe ob bereits Rechnung existiert
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      saleId: null, // Booster-Rechnungen haben kein saleId
      items: {
        some: {
          watchId: watch.id,
          description: { startsWith: 'Booster:' },
        },
      },
    },
  })

  if (existingInvoice) {
    console.log(`✅ Booster-Rechnung bereits vorhanden: ${existingInvoice.invoiceNumber}`)
    return
  }

  // Parse Boosters
  let selectedBoosters: string[] = []
  if (watch.boosters) {
    selectedBoosters = JSON.parse(watch.boosters)
  }

  if (selectedBoosters.length === 0 || selectedBoosters[0] === 'none') {
    console.log('❌ Keine Boosters oder "none" gefunden!')
    return
  }

  // Hole Booster-Preise
  const boosterPrices = await prisma.boosterPrice.findMany({
    where: { isActive: true },
  })

  for (const boosterCode of selectedBoosters) {
    const booster = boosterPrices.find(b => b.code === boosterCode && b.isActive)
    if (booster && booster.price > 0) {
      const vatRate = 0.081 // 8.1% MwSt
      const subtotal = booster.price
      const vatAmount = subtotal * vatRate
      const totalBeforeRounding = subtotal + vatAmount
      const total = Math.ceil(totalBeforeRounding * 20) / 20

      // Generiere Rechnungsnummer
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

      // Erstelle Rechnung für Booster
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          sellerId: watch.sellerId,
          saleId: null, // Kein Verkauf, nur Booster
          subtotal,
          vatRate,
          vatAmount,
          total,
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              {
                watchId: watch.id,
                description: `Booster: ${booster.name}`,
                quantity: 1,
                price: booster.price,
                total: booster.price,
              },
            ],
          },
        },
      })

      console.log(`✅ Booster-Rechnung erstellt: ${invoice.invoiceNumber}`)
      console.log(`   Booster: ${booster.name} (CHF ${booster.price})`)
      console.log(`   MwSt: CHF ${vatAmount.toFixed(4)}`)
      console.log(`   Total: CHF ${total.toFixed(2)}`)
    }
  }

  console.log('\n✅ Fertig!')
}

main()
  .catch(e => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
