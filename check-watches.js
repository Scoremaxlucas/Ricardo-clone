const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const watches = await prisma.watch.findMany({
      take: 5,
      include: {
        seller: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`\n📊 Gefundene Artikel: ${watches.length}\n`)

    if (watches.length === 0) {
      console.log('⚠️  Keine Artikel gefunden. Bitte erstellen Sie zuerst einen Artikel über /sell')
    } else {
      watches.forEach((watch, index) => {
        console.log(`${index + 1}. ${watch.title}`)
        console.log(`   ID: ${watch.id}`)
        console.log(`   Marke: ${watch.brand} | Modell: ${watch.model}`)
        console.log(`   Preis: CHF ${watch.price}`)
        console.log(`   Link: http://localhost:3002/products/${watch.id}`)
        console.log('')
      })
    }
  } catch (error) {
    if (error.message.includes('nickname')) {
      console.log('⚠️  Datenbank-Schema nicht aktuell. Führe Schema-Update aus...')
    } else {
      console.error('Fehler:', error.message)
    }
  }
}

main().finally(() => prisma.$disconnect())
