/**
 * Send a test marketing email WITH product cards.
 * Usage: npx tsx scripts/send-test-marketing-with-products.ts
 */
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

async function main() {
  const { buildMarketingEmailWithProducts } = await import('../src/lib/email/marketing-template')
  type ProductCard = import('../src/lib/email/marketing-template').ProductCard
  const { sendEmail } = await import('../src/lib/email/sender')

  const to = 'gregor.gafner@me.com'
  const subject = 'Entdecken Sie aktuelle Angebote auf Helvenda.ch'

  // Fetch real active listings
  const now = new Date()
  const watches = await prisma.watch.findMany({
    where: {
      AND: [
        {
          OR: [
            { moderationStatus: null },
            { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
          ],
        },
        {
          OR: [
            { purchases: { none: {} } },
            { purchases: { every: { status: 'cancelled' } } },
          ],
        },
        {
          OR: [
            { auctionEnd: null },
            { auctionEnd: { gt: now } },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      price: true,
      buyNowPrice: true,
      brand: true,
      images: true,
      articleNumber: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 4,
  })

  console.log(`Found ${watches.length} active listings`)

  const products: ProductCard[] = watches.map(w => {
    let imageUrl: string | null = null
    try {
      const imgs: string[] = JSON.parse(w.images)
      if (imgs.length > 0 && imgs[0].startsWith('http')) {
        imageUrl = imgs[0]
      }
    } catch {}

    return {
      id: w.id,
      title: w.title,
      price: w.buyNowPrice || w.price,
      imageUrl,
      brand: w.brand,
      articleNumber: w.articleNumber,
    }
  })

  for (const p of products) {
    console.log(`  - ${p.brand} ${p.title} (CHF ${p.price}) ${p.imageUrl ? '(has image)' : '(no image)'}`)
  }

  const introText = `Schauen Sie sich die neuesten Angebote auf **Helvenda.ch** an – Ihrem vertrauensvollen Schweizer Online-Marktplatz.

Ob Uhren, Elektronik oder Mode – entdecken Sie geprüfte Angebote von verifizierten Verkäufern.`

  const html = buildMarketingEmailWithProducts(subject, introText, products, to)

  console.log(`\nSending to ${to}...`)

  const result = await sendEmail({
    to,
    subject,
    html,
    from: 'Helvenda <noreply@helvenda.ch>',
  })

  if (result.success) {
    console.log(`\nSent successfully via ${result.method}!`)
    console.log(`Message ID: ${result.messageId}`)
  } else {
    console.error(`\nFailed: ${result.error}`)
  }

  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
