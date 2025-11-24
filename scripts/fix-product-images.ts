import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Echte Unsplash Photo IDs
const unsplashPhotos = [
  '1523275335684-37898b6baf30', // Watch
  '1517336714731-489689fd1ca8', // Watch
  '1578662996442-48f60103fc96', // Watch
  '1498049794561-7780e7231661', // Laptop
  '1512499617640-74b136d3e1ff', // Phone
  '1502920917128-1aaed76472fd', // Camera
  '1558618047-3c8c76ca7d13', // Bike
  '1549317661-bd32c8ce0db2', // Car
  '1586023492125-27b2c045efd7', // Furniture
  '1441986300917-64674bd600d8', // Clothing
  '1571019613454-1cb2f99b2d8b', // Sports
  '1556912172-45b7abe8b7e6', // Product
  '1505740420928-5e560c06d30e', // Headphones
  '1526170375885-4d8ecf77b99a', // Camera
  '1553062407-45890bcff9dd', // Watch
  '1511707171634-5f897ff02aa9', // Phone
  '1505744386684-5b3831f6c723', // Laptop
  '1558618666-fcd25c85cd64', // Bike
  '1549317661-bd32c8ce0db2', // Car
  '1555041469-a586c61ea9bc', // Furniture
]

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomImage(): string {
  const numImages = randomInt(1, 3)
  const images: string[] = []
  for (let i = 0; i < numImages; i++) {
    const photoId = randomItem(unsplashPhotos)
    images.push(`https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format`)
  }
  return JSON.stringify(images)
}

async function main() {
  console.log('🔧 Aktualisiere Produktbilder...\n')

  // Hole alle Produkte
  const watches = await prisma.watch.findMany({
    select: {
      id: true,
      images: true,
    }
  })

  console.log(`📊 Gefunden: ${watches.length} Produkte\n`)

  let updated = 0
  let skipped = 0

  for (const watch of watches) {
    try {
      // Prüfe ob Bilder bereits korrekt sind
      let needsUpdate = false
      
      if (!watch.images || watch.images.trim() === '') {
        needsUpdate = true
      } else {
        // Prüfe ob es ein gültiger JSON-String ist
        try {
          const parsed = JSON.parse(watch.images)
          if (!Array.isArray(parsed) || parsed.length === 0) {
            needsUpdate = true
          } else {
            // Prüfe ob die URLs gültig sind
            const firstUrl = parsed[0]
            if (!firstUrl || !firstUrl.startsWith('http')) {
              needsUpdate = true
            }
          }
        } catch {
          // Nicht JSON, muss aktualisiert werden
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        await prisma.watch.update({
          where: { id: watch.id },
          data: {
            images: getRandomImage()
          }
        })
        updated++
        if (updated % 50 === 0) {
          console.log(`   ✅ ${updated} Produkte aktualisiert...`)
        }
      } else {
        skipped++
      }
    } catch (error: any) {
      console.error(`   ❌ Fehler bei Produkt ${watch.id}:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ ERFOLGREICH ABGESCHLOSSEN!`)
  console.log(`📊 Statistiken:`)
  console.log(`   - Aktualisiert: ${updated} Produkte`)
  console.log(`   - Übersprungen: ${skipped} Produkte`)
  console.log(`   - Gesamt: ${watches.length} Produkte`)
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })














