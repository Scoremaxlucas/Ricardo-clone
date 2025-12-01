import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating booster prices...')

  // Neue Booster mit korrekten Preisen
  const boosters = [
    {
      code: 'none',
      name: 'Kein Booster',
      description: 'Das Angebot wird nicht besonders hervorgehoben',
      price: 0.0,
      isActive: true,
    },
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

  // Lösche alte Booster
  await prisma.boosterPrice.deleteMany({})
  console.log('✓ Alte Booster gelöscht')

  // Erstelle neue Booster
  for (const booster of boosters) {
    await prisma.boosterPrice.create({
      data: booster,
    })
    console.log(`✓ Created: ${booster.name} (${booster.price} CHF)`)
  }

  console.log('✓ Booster aktualisiert!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
