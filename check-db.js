const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db',
    },
  },
})

async function checkWatches() {
  try {
    const watches = await prisma.watch.findMany()
    console.log('Found watches:', watches.length)
    watches.forEach(watch => {
      console.log(`- ${watch.brand} ${watch.model} (${watch.price} CHF)`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWatches()
