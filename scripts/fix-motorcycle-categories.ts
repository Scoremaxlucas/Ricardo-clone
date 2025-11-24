import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixe Motorrad-Kategorien...\n')
  
  // Finde die auto-motorrad Kategorie
  let autoMotorradCategory = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'auto-motorrad' },
        { name: { equals: 'Auto & Motorrad', mode: 'insensitive' } }
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
  
  // Suche alle Motorräder (nach Keywords)
  const motorcycles = await prisma.watch.findMany({
    where: {
      OR: [
        { title: { contains: 'motorrad', mode: 'insensitive' } },
        { title: { contains: 'motorcycle', mode: 'insensitive' } },
        { title: { contains: 'moped', mode: 'insensitive' } },
        { brand: { equals: 'Yamaha', mode: 'insensitive' } },
        { brand: { equals: 'Honda', mode: 'insensitive' } },
        { brand: { equals: 'Ducati', mode: 'insensitive' } },
        { brand: { equals: 'Kawasaki', mode: 'insensitive' } },
        { brand: { equals: 'Suzuki', mode: 'insensitive' } },
        { brand: { equals: 'KTM', mode: 'insensitive' } },
        { brand: { equals: 'BMW Motorrad', mode: 'insensitive' } },
        { model: { contains: 'motorrad', mode: 'insensitive' } },
        { model: { contains: 'motorcycle', mode: 'insensitive' } },
      ],
      purchases: {
        none: {} // Nur nicht verkaufte
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
  
  console.log(`\n📊 Gefundene Motorräder: ${motorcycles.length}\n`)
  
  let fixed = 0
  let alreadyLinked = 0
  let skipped = 0
  
  for (const motorcycle of motorcycles) {
    // Prüfe ob bereits mit auto-motorrad verknüpft
    const isLinked = motorcycle.categories.some(
      (wc: any) => wc.category.slug === 'auto-motorrad' || wc.categoryId === autoMotorradCategory.id
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
    } catch (error: any) {
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







