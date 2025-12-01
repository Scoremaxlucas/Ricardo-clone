import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Suche nach Motorrädern...\n')

  // Suche alle Produkte die "motorrad" oder "motorcycle" im Titel/Brand/Model enthalten
  const motorcycles = await prisma.watch.findMany({
    where: {
      OR: [
        { title: { contains: 'motorrad', mode: 'insensitive' } },
        { title: { contains: 'motorcycle', mode: 'insensitive' } },
        { brand: { contains: 'yamaha', mode: 'insensitive' } },
        { brand: { contains: 'honda', mode: 'insensitive' } },
        { brand: { contains: 'ducati', mode: 'insensitive' } },
        { brand: { contains: 'kawasaki', mode: 'insensitive' } },
        { brand: { contains: 'suzuki', mode: 'insensitive' } },
        { model: { contains: 'motorrad', mode: 'insensitive' } },
        { model: { contains: 'motorcycle', mode: 'insensitive' } },
      ],
      purchases: {
        none: {}, // Nur nicht verkaufte
      },
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  })

  console.log(`📊 Gefundene Motorräder: ${motorcycles.length}\n`)

  if (motorcycles.length === 0) {
    console.log('❌ Keine Motorräder gefunden!')
    return
  }

  // Prüfe Kategorien
  const autoMotorradCategory = await prisma.category.findFirst({
    where: {
      OR: [{ slug: 'auto-motorrad' }, { name: { equals: 'Auto & Motorrad', mode: 'insensitive' } }],
    },
  })

  console.log(
    `📁 Kategorie "auto-motorrad": ${autoMotorradCategory ? `✅ Gefunden (ID: ${autoMotorradCategory.id}, slug: ${autoMotorradCategory.slug})` : '❌ NICHT GEFUNDEN'}\n`
  )

  motorcycles.forEach((motorcycle, index) => {
    console.log(`\n🏍️  Motorrad ${index + 1}:`)
    console.log(`   ID: ${motorcycle.id}`)
    console.log(`   Titel: ${motorcycle.title}`)
    console.log(`   Marke: ${motorcycle.brand}`)
    console.log(`   Modell: ${motorcycle.model}`)
    console.log(`   Kategorien (${motorcycle.categories.length}):`)

    if (motorcycle.categories.length === 0) {
      console.log('   ⚠️  KEINE KATEGORIE VERKNÜPFT!')
    } else {
      motorcycle.categories.forEach((wc: any) => {
        const cat = wc.category
        const isAutoMotorrad =
          cat.slug === 'auto-motorrad' || cat.name.toLowerCase().includes('motorrad')
        console.log(`   ${isAutoMotorrad ? '✅' : '❌'} ${cat.name} (slug: ${cat.slug})`)
      })
    }
  })

  // Prüfe ob Motorräder mit auto-motorrad verknüpft sind
  if (autoMotorradCategory) {
    const motorcyclesWithCategory = await prisma.watch.findMany({
      where: {
        categories: {
          some: {
            categoryId: autoMotorradCategory.id,
          },
        },
        purchases: {
          none: {},
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    })

    console.log(
      `\n\n📊 Motorräder mit Kategorie "auto-motorrad": ${motorcyclesWithCategory.length}`
    )

    // Prüfe ob es Motorräder gibt die NICHT mit auto-motorrad verknüpft sind
    const motorcyclesWithoutCategory = motorcycles.filter(
      m => !m.categories.some((wc: any) => wc.category.slug === 'auto-motorrad')
    )

    if (motorcyclesWithoutCategory.length > 0) {
      console.log(
        `\n⚠️  ${motorcyclesWithoutCategory.length} Motorräder sind NICHT mit "auto-motorrad" verknüpft:`
      )
      motorcyclesWithoutCategory.forEach(m => {
        console.log(`   - ${m.title} (ID: ${m.id})`)
      })
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
