/**
 * Backfill Script: Populate searchText field for all existing watches
 * 
 * Run with: npx tsx scripts/backfill-search-text.ts
 * 
 * This script:
 * 1. Fetches all watches from the database
 * 2. Builds searchText from title, description, category, brand, model, etc.
 * 3. Updates each watch with the generated searchText
 * 
 * Progress is logged to console and can be monitored.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Import search text builder (inline to avoid module resolution issues)
const categoryKeywordsForSearch: Record<string, string[]> = {
  'sport': ['sport', 'fitness', 'training', 'ball', 'baelle', 'fussball', 'basketball', 'volleyball', 'handball', 'tennis', 'golf', 'fahrrad', 'velo', 'bike', 'ski', 'snowboard'],
  'sport-fitness': ['fitness', 'gym', 'training', 'workout', 'hantel', 'laufband', 'yoga'],
  'sport-ballsport': ['ball', 'baelle', 'fussball', 'basketball', 'volleyball', 'handball', 'tennis', 'golf'],
  'sport-radsport': ['fahrrad', 'velo', 'bike', 'rennrad', 'mountainbike', 'ebike', 'e-bike'],
  'sport-wintersport': ['ski', 'snowboard', 'winter', 'schnee'],
  'elektronik': ['elektronik', 'electronic', 'computer', 'laptop', 'handy', 'smartphone', 'kamera', 'tv', 'audio'],
  'computer-netzwerk': ['computer', 'pc', 'laptop', 'notebook', 'tablet', 'monitor', 'tastatur', 'maus', 'drucker'],
  'handy-telefon': ['handy', 'smartphone', 'iphone', 'samsung', 'telefon', 'mobile'],
  'foto-optik': ['kamera', 'camera', 'objektiv', 'lens', 'drohne', 'drone', 'gopro'],
  'tv-video-audio': ['tv', 'fernseher', 'lautsprecher', 'kopfhoerer', 'soundbar', 'beamer'],
  'games-konsolen': ['playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'switch', 'konsole', 'gaming'],
  'kleidung-accessoires': ['kleidung', 'mode', 'jacke', 'hose', 'shirt', 'schuhe', 'sneaker', 'tasche'],
  'uhren-schmuck': ['uhr', 'watch', 'rolex', 'omega', 'schmuck', 'ring', 'kette', 'armband'],
  'auto-motorrad': ['auto', 'fahrzeug', 'car', 'motorrad', 'motorcycle', 'reifen', 'tuning'],
  'haushalt-wohnen': ['moebel', 'furniture', 'sofa', 'tisch', 'stuhl', 'lampe', 'kueche', 'staubsauger'],
  'handwerk-garten': ['werkzeug', 'tool', 'garten', 'garden', 'grill', 'rasenmaeher'],
  'musik-instrumente': ['gitarre', 'guitar', 'klavier', 'piano', 'schlagzeug', 'drums'],
  'baby-kind': ['baby', 'kind', 'kinderwagen', 'spielzeug', 'kindersitz'],
  'buecher-medien': ['buch', 'book', 'dvd', 'cd', 'vinyl', 'comic'],
  'sammeln-seltenes': ['sammlung', 'antik', 'vintage', 'muenze', 'briefmarke'],
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/\s+/g, ' ')
    .trim()
}

function getConditionLabel(condition: string): string {
  const conditionLabels: Record<string, string> = {
    'new': 'neu neuwertig unbenutzt originalverpackt ovp',
    'like-new': 'wie neu neuwertig kaum benutzt fast neu',
    'very-good': 'sehr gut gepflegt einwandfrei',
    'good': 'gut gebraucht funktioniert',
    'acceptable': 'akzeptabel gebraucht',
    'defective': 'defekt reparaturbedürftig',
  }
  return conditionLabels[condition] || condition
}

function getCategoryKeywords(categorySlug: string): string[] {
  return categoryKeywordsForSearch[categorySlug] || []
}

function buildSearchText(watch: any): string {
  const parts: string[] = []
  
  // Title (3x weight)
  if (watch.title) {
    const normalizedTitle = normalizeText(watch.title)
    parts.push(normalizedTitle, normalizedTitle, normalizedTitle)
  }
  
  // Brand + Model (2x weight)
  if (watch.brand) {
    const normalizedBrand = normalizeText(watch.brand)
    parts.push(normalizedBrand, normalizedBrand)
  }
  if (watch.model) {
    const normalizedModel = normalizeText(watch.model)
    parts.push(normalizedModel, normalizedModel)
  }
  
  // Categories
  if (watch.categories && watch.categories.length > 0) {
    for (const catRelation of watch.categories) {
      const category = catRelation.category
      if (category.name) {
        parts.push(normalizeText(category.name))
      }
      if (category.slug) {
        const keywords = getCategoryKeywords(category.slug)
        parts.push(...keywords.map(normalizeText))
      }
    }
  }
  
  // Description
  if (watch.description) {
    parts.push(normalizeText(watch.description))
  }
  
  // Reference Number
  if (watch.referenceNumber) {
    parts.push(normalizeText(watch.referenceNumber))
  }
  
  // Condition
  if (watch.condition) {
    parts.push(normalizeText(watch.condition))
    parts.push(getConditionLabel(watch.condition))
  }
  
  // Material
  if (watch.material) {
    parts.push(normalizeText(watch.material))
  }
  
  // Movement
  if (watch.movement) {
    parts.push(normalizeText(watch.movement))
  }
  
  // Year
  if (watch.year) {
    parts.push(String(watch.year))
  }
  
  // Location
  if (watch.seller?.city) {
    parts.push(normalizeText(watch.seller.city))
  }
  if (watch.seller?.postalCode) {
    parts.push(watch.seller.postalCode)
  }
  
  // Shipping keywords
  if (watch.shippingMethod) {
    try {
      const shipping = JSON.parse(watch.shippingMethod)
      if (shipping.delivery || shipping.shipping) {
        parts.push('versand lieferung shipping delivery')
      }
      if (shipping.pickup || shipping.abholung) {
        parts.push('abholung selbstabholung pickup abholen')
      }
    } catch {
      // Ignore JSON parse errors
    }
  }
  
  return normalizeText(parts.join(' ')).replace(/\s+/g, ' ').trim()
}

async function backfillSearchText() {
  console.log('🔍 Starting searchText backfill...\n')
  
  // Get total count
  const total = await prisma.watch.count()
  console.log(`📊 Total watches to process: ${total}\n`)
  
  const batchSize = 50
  let success = 0
  let failed = 0
  let offset = 0
  
  const startTime = Date.now()
  
  while (offset < total) {
    // Fetch batch of watches
    const watches = await prisma.watch.findMany({
      skip: offset,
      take: batchSize,
      include: {
        categories: {
          include: {
            category: {
              select: { name: true, slug: true },
            },
          },
        },
        seller: {
          select: { postalCode: true, city: true },
        },
      },
    })
    
    // Process batch
    for (const watch of watches) {
      try {
        const searchText = buildSearchText(watch)
        
        await prisma.watch.update({
          where: { id: watch.id },
          data: { searchText },
        })
        
        success++
      } catch (error) {
        console.error(`❌ Failed to update watch ${watch.id}:`, error)
        failed++
      }
    }
    
    offset += batchSize
    
    const progress = Math.min(offset, total)
    const percentage = ((progress / total) * 100).toFixed(1)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    
    // Clear line and print progress
    process.stdout.write(`\r⏳ Progress: ${progress}/${total} (${percentage}%) - ${elapsed}s elapsed`)
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  
  console.log('\n')
  console.log('✅ Backfill complete!')
  console.log(`   Success: ${success}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Total time: ${totalTime}s`)
  
  // Show sample searchText
  console.log('\n📝 Sample searchText entries:')
  
  const samples = await prisma.watch.findMany({
    take: 3,
    select: {
      id: true,
      title: true,
      searchText: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  
  for (const sample of samples) {
    console.log(`\n   ID: ${sample.id}`)
    console.log(`   Title: ${sample.title}`)
    console.log(`   SearchText (first 200 chars): ${sample.searchText.substring(0, 200)}...`)
  }
}

// Run the backfill
backfillSearchText()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
