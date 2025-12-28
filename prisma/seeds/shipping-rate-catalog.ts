import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed Shipping Rate Catalog mit fixen CH-Preisen (Ricardo-Style)
 * Rate-Set: default_ch_post
 */
export async function seedShippingRateCatalog() {
  console.log('🌱 Seeding Shipping Rate Catalog...')

  const rates = [
    // Base Rates - Economy
    {
      code: 'post_economy_2kg',
      labelDe: 'Versand als Paket Economy (B-Post) bis 2 kg',
      basePriceChf: 9.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'economy',
      weightTier: 2,
      isActive: true,
    },
    {
      code: 'post_economy_10kg',
      labelDe: 'Versand als Paket Economy (B-Post) bis 10 kg',
      basePriceChf: 12.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'economy',
      weightTier: 10,
      isActive: true,
    },
    {
      code: 'post_economy_30kg',
      labelDe: 'Versand als Paket Economy (B-Post) bis 30 kg',
      basePriceChf: 21.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'economy',
      weightTier: 30,
      isActive: true,
    },
    // Base Rates - Priority
    {
      code: 'post_priority_2kg',
      labelDe: 'Versand als Paket Priority (A-Post) bis 2 kg',
      basePriceChf: 13.5,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'priority',
      weightTier: 2,
      isActive: true,
    },
    {
      code: 'post_priority_10kg',
      labelDe: 'Versand als Paket Priority (A-Post) bis 10 kg',
      basePriceChf: 15.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'priority',
      weightTier: 10,
      isActive: true,
    },
    {
      code: 'post_priority_30kg',
      labelDe: 'Versand als Paket Priority (A-Post) bis 30 kg',
      basePriceChf: 24.0,
      rateSetId: 'default_ch_post',
      isAddon: false,
      addonType: null,
      service: 'priority',
      weightTier: 30,
      isActive: true,
    },
    // Add-ons
    {
      code: 'addon_sperrgut',
      labelDe: 'Sperrgut-Zuschlag',
      basePriceChf: 13.0,
      rateSetId: 'default_ch_post',
      isAddon: true,
      addonType: 'sperrgut',
      service: null,
      weightTier: null,
      isActive: true,
    },
    {
      code: 'addon_pickhome',
      labelDe: 'Pick@home-Zuschlag',
      basePriceChf: 3.4,
      rateSetId: 'default_ch_post',
      isAddon: true,
      addonType: 'pickhome',
      service: null,
      weightTier: null,
      isActive: true,
    },
  ]

  for (const rate of rates) {
    await prisma.shippingRateCatalog.upsert({
      where: { code: rate.code },
      update: rate,
      create: rate,
    })
  }

  console.log(`✅ Seeded ${rates.length} shipping rates`)
}

if (require.main === module) {
  seedShippingRateCatalog()
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
