import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding booster prices...')

  // Default Booster Preise
  const boosters = [
    {
      code: 'top',
      name: 'Top-Anzeige',
      description: 'Ihre Anzeige erscheint als erstes in den Suchergebnissen',
      price: 50.0,
      isActive: true,
    },
    {
      code: 'homepage',
      name: 'Homepage-Feature',
      description: 'Prominente Platzierung auf der Homepage',
      price: 100.0,
      isActive: true,
    },
    {
      code: 'highlighted',
      name: 'Hervorgehoben',
      description: 'Ihre Anzeige wird optisch hervorgehoben',
      price: 25.0,
      isActive: true,
    },
    {
      code: 'featured',
      name: 'Featured',
      description: 'Ihre Anzeige erscheint in der Featured-Sektion',
      price: 75.0,
      isActive: true,
    },
  ]

  for (const booster of boosters) {
    await prisma.boosterPrice.upsert({
      where: { code: booster.code },
      update: booster,
      create: booster,
    })
    console.log(`✓ Seeded: ${booster.name}`)
  }

  console.log('✓ Booster prices seeded successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
