const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixe Motorrad-Kategorien...\n')
  
  // Finde die auto-motorrad Kategorie (SQLite ist case-insensitive)
  let autoMotorradCategory = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'auto-motorrad' },
        { slug: 'Auto-Motorrad' },
        { slug: 'AUTO-MOTORRAD' },
        { name: 'Auto & Motorrad' },
        { name: 'auto & motorrad' },
        { name: 'AUTO & MOTORRAD' }
      ]
    }
  })
  
  // Erstelle die Kategorie falls sie nicht existiert
  if (!autoMotorradCategory) {
    autoMotorradCategory = await prisma.category.create({
      data: {
        name: 'Auto & Motorrad',
        slug: 'auto-motorrad'
      }
    })
    console.log('✅ Kategorie "auto-motorrad" erstellt')
  } else {
    console.log(`✅ Kategorie "auto-motorrad" gefunden (ID: ${autoMotorradCategory.id})`)
  }
  
  // Suche alle Motorräder (nach Keywords im Titel)
  const allWatches = await prisma.watch.findMany({
    where: {
      purchases: {
        none: {}
      }
    },
    include: {
      categories: {
        include: {
          category: true
        }
      }
    }
  })
  
  // Filtere Motorräder nach Keywords
  const motorcycles = allWatches.filter(watch => {
    const title = (watch.title || '').toLowerCase()
    const brand = (watch.brand || '').toLowerCase()
    const model = (watch.model || '').toLowerCase()
    
    return title.includes('motorrad') || 
           title.includes('motorcycle') ||
           title.includes('moped') ||
           brand === 'yamaha' ||
           brand === 'honda' ||
           brand === 'ducati' ||
           brand === 'kawasaki' ||
           brand === 'suzuki' ||
           brand === 'ktm' ||
           brand.includes('bmw motorrad') ||
           model.includes('motorrad') ||
           model.includes('motorcycle')
  })
  
  console.log(`\n📊 Gefundene Motorräder: ${motorcycles.length}\n`)
  
  let fixed = 0
  let alreadyLinked = 0
  let skipped = 0
  
  for (const motorcycle of motorcycles) {
    // Prüfe ob bereits mit auto-motorrad verknüpft
    const isLinked = motorcycle.categories.some(
      (wc) => wc.category.slug === 'auto-motorrad' || wc.categoryId === autoMotorradCategory.id
    )
    
    if (isLinked) {
      alreadyLinked++
      console.log(`✓ ${motorcycle.title} - bereits verknüpft`)
      continue
    }
    
    // Verknüpfe mit auto-motorrad
    try {
      await prisma.watchCategory.create({
        data: {
          watchId: motorcycle.id,
          categoryId: autoMotorradCategory.id
        }
      })
      fixed++
      console.log(`✅ ${motorcycle.title} - verknüpft mit auto-motorrad`)
    } catch (error) {
      if (error.code === 'P2002') {
        // Duplicate entry - bereits verknüpft
        alreadyLinked++
        console.log(`✓ ${motorcycle.title} - bereits verknüpft (duplicate)`)
      } else {
        skipped++
        console.log(`❌ ${motorcycle.title} - Fehler: ${error.message}`)
      }
    }
  }
  
  console.log(`\n\n📊 Zusammenfassung:`)
  console.log(`   ✅ Verknüpft: ${fixed}`)
  console.log(`   ✓ Bereits verknüpft: ${alreadyLinked}`)
  console.log(`   ❌ Fehler: ${skipped}`)
  console.log(`   📊 Total: ${motorcycles.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
