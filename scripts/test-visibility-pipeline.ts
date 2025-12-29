/**
 * Integration Test: Listing Visibility Pipeline
 *
 * Tests that a newly created listing becomes visible in search
 * within 5 seconds of creation.
 *
 * This test:
 * 1. Creates a draft/test listing
 * 2. Immediately polls the search API
 * 3. Verifies the listing appears within 5 seconds
 * 4. Cleans up the test listing
 *
 * Usage:
 *   npx tsx scripts/test-visibility-pipeline.ts
 *
 * Requirements:
 *   - Database must be running
 *   - Server must be running at localhost:3002
 *   - A verified seller user must exist
 */

import { prisma } from '../src/lib/prisma'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002'
const MAX_WAIT_MS = 5000
const POLL_INTERVAL_MS = 200

interface TestResult {
  success: boolean
  watchId?: string
  visibilityTimeMs?: number
  error?: string
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkSearchVisibility(watchId: string, query: string): Promise<boolean> {
  try {
    const url = `${BASE_URL}/api/watches/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      console.error(`Search API returned ${response.status}`)
      return false
    }

    const data = await response.json()
    const watches = data.watches || []

    return watches.some((w: any) => w.id === watchId)
  } catch (error) {
    console.error('Error calling search API:', error)
    return false
  }
}

async function checkVisibilityEndpoint(watchId: string): Promise<any> {
  try {
    const url = `${BASE_URL}/api/watches/${watchId}/visibility-check`
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      return { error: `Visibility check returned ${response.status}` }
    }

    return await response.json()
  } catch (error: any) {
    return { error: error.message }
  }
}

async function createTestListing(): Promise<{ id: string; title: string } | null> {
  try {
    // Find a verified seller
    const seller = await prisma.user.findFirst({
      where: {
        verified: true,
        isBlocked: false,
      },
      select: { id: true, email: true },
    })

    if (!seller) {
      console.error('❌ No verified seller found. Please create a verified user first.')
      return null
    }

    console.log(`📝 Using seller: ${seller.email}`)

    // Create unique test title for search
    const uniqueId = `TEST_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const title = `Visibility Test ${uniqueId}`

    // Create test listing directly in database (bypasses auth)
    const watch = await prisma.watch.create({
      data: {
        title,
        description: 'This is an automated test listing for visibility pipeline testing.',
        brand: 'TestBrand',
        model: 'TestModel',
        condition: 'Neu',
        price: 100,
        images: '[]',
        sellerId: seller.id,
        moderationStatus: 'pending', // Same as normal listings
      },
      select: { id: true, title: true },
    })

    console.log(`✅ Created test listing: ${watch.id}`)
    return watch
  } catch (error: any) {
    console.error('❌ Error creating test listing:', error.message)
    return null
  }
}

async function deleteTestListing(watchId: string): Promise<void> {
  try {
    // Delete related records first
    await prisma.watchCategory.deleteMany({ where: { watchId } })
    await prisma.watchView.deleteMany({ where: { watchId } })
    await prisma.watch.delete({ where: { id: watchId } })
    console.log(`🧹 Cleaned up test listing: ${watchId}`)
  } catch (error: any) {
    console.error(`⚠️ Warning: Could not delete test listing ${watchId}:`, error.message)
  }
}

async function testVisibilityPipeline(): Promise<TestResult> {
  console.log('\n🚀 Starting Visibility Pipeline Test')
  console.log('='.repeat(50))
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Max wait: ${MAX_WAIT_MS}ms`)
  console.log(`Poll interval: ${POLL_INTERVAL_MS}ms`)
  console.log('='.repeat(50))

  // Step 1: Create test listing
  const listing = await createTestListing()

  if (!listing) {
    return { success: false, error: 'Failed to create test listing' }
  }

  const searchQuery = listing.title // Use the unique title as search query
  const startTime = Date.now()

  try {
    // Step 2: Poll search API until listing appears or timeout
    console.log(`\n🔍 Searching for: "${searchQuery}"`)

    let visible = false
    let attempts = 0

    while (!visible && Date.now() - startTime < MAX_WAIT_MS) {
      attempts++
      visible = await checkSearchVisibility(listing.id, searchQuery)

      if (visible) {
        break
      }

      await sleep(POLL_INTERVAL_MS)
    }

    const elapsedMs = Date.now() - startTime

    // Step 3: Check visibility endpoint for detailed diagnosis
    const visibilityCheck = await checkVisibilityEndpoint(listing.id)

    console.log('\n📊 Visibility Check Result:')
    console.log(JSON.stringify(visibilityCheck, null, 2))

    // Step 4: Report results
    console.log('\n' + '='.repeat(50))

    if (visible) {
      console.log(`✅ SUCCESS: Listing appeared in search after ${elapsedMs}ms`)
      console.log(`   Attempts: ${attempts}`)
      console.log(`   Watch ID: ${listing.id}`)

      return {
        success: true,
        watchId: listing.id,
        visibilityTimeMs: elapsedMs,
      }
    } else {
      console.log(`❌ FAILED: Listing did NOT appear in search within ${MAX_WAIT_MS}ms`)
      console.log(`   Attempts: ${attempts}`)
      console.log(`   Watch ID: ${listing.id}`)
      console.log('\n📋 Diagnosis:')

      if (!visibilityCheck.isVisible) {
        console.log(`   Reasons: ${visibilityCheck.reasons?.join(', ')}`)
        console.log(`   Recommendation: ${visibilityCheck.recommendation}`)
      } else {
        console.log('   Visibility check says visible, but search did not return it.')
        console.log('   This might be a search index issue or caching problem.')
      }

      return {
        success: false,
        watchId: listing.id,
        visibilityTimeMs: elapsedMs,
        error: `Listing not visible after ${MAX_WAIT_MS}ms`,
      }
    }
  } finally {
    // Step 5: Cleanup
    await deleteTestListing(listing.id)
  }
}

async function main() {
  console.log('\n' + '╔'.padEnd(52, '═') + '╗')
  console.log('║  LISTING VISIBILITY PIPELINE TEST'.padEnd(52) + '║')
  console.log('╚'.padEnd(52, '═') + '╝')

  try {
    const result = await testVisibilityPipeline()

    console.log('\n' + '─'.repeat(50))
    console.log('FINAL RESULT:')
    console.log(JSON.stringify(result, null, 2))

    if (result.success) {
      console.log('\n✅ Test PASSED - Visibility guarantee (<= 5 seconds) is working!')
      process.exit(0)
    } else {
      console.log('\n❌ Test FAILED - Visibility guarantee is NOT working!')
      console.log('\nTroubleshooting steps:')
      console.log('1. Check if server is running at', BASE_URL)
      console.log('2. Verify database connection')
      console.log('3. Check API route has dynamic="force-dynamic"')
      console.log('4. Check client fetch has cache="no-store"')
      console.log('5. Use /api/watches/{id}/visibility-check for diagnosis')
      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n💥 Test failed with error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
