/**
 * Tests for product-utils.ts
 *
 * Run with: npx tsx scripts/test-product-utils.ts
 */

import {
  formatCHF,
  formatCHFCompact,
  formatTimeLeft,
  getListingBadges,
  getDeliveryInfo,
  getBoostType,
  hasVisibilityBoost,
  checkIsNewListing,
  getTimeSinceCreated,
  CARD_FEATURE_FLAGS,
  type ListingData,
} from '../src/lib/product-utils'

// Test helpers
let passed = 0
let failed = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`)
    passed++
  } else {
    console.log(`  ❌ ${message}`)
    failed++
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual === expected) {
    console.log(`  ✅ ${message}`)
    passed++
  } else {
    console.log(`  ❌ ${message}`)
    console.log(`     Expected: ${JSON.stringify(expected)}`)
    console.log(`     Actual:   ${JSON.stringify(actual)}`)
    failed++
  }
}

// =============================================================================
// formatCHF Tests
// =============================================================================
console.log('\n📝 formatCHF Tests')
console.log('─'.repeat(50))

// Helper to normalize apostrophe characters (Swiss locale uses U+2019 RIGHT SINGLE QUOTATION MARK)
const normalizeApostrophe = (s: string) => s.replace(/[\u2019'ʼ']/g, "'")

// Whole numbers
assertEqual(formatCHF(1), 'CHF 1.–', 'formatCHF(1) should be "CHF 1.–"')
assertEqual(formatCHF(100), 'CHF 100.–', 'formatCHF(100) should be "CHF 100.–"')
assert(normalizeApostrophe(formatCHF(1000)).includes("1'000"), 'formatCHF(1000) should have thousand separator')
assert(normalizeApostrophe(formatCHF(1850)).includes("1'850"), 'formatCHF(1850) should be "CHF 1\'850.–"')
assert(normalizeApostrophe(formatCHF(1000000)).includes("1'000'000"), 'formatCHF(1000000) should have multiple separators')

// Decimals
assertEqual(formatCHF(1.5), 'CHF 1.50', 'formatCHF(1.5) should be "CHF 1.50" (2 decimals)')
assertEqual(formatCHF(1.80), 'CHF 1.80', 'formatCHF(1.80) should be "CHF 1.80" (not CHF 1.8)')
assert(normalizeApostrophe(formatCHF(1850.50)).includes("1'850.50"), 'formatCHF(1850.50) should have separator')
assertEqual(formatCHF(0.05), 'CHF 0.05', 'formatCHF(0.05) should be "CHF 0.05"')

// Edge cases
assertEqual(formatCHF(0), 'CHF 0.–', 'formatCHF(0) should be "CHF 0.–"')
assertEqual(formatCHF(-1), 'CHF 0.–', 'formatCHF(-1) should be "CHF 0.–" (negative protection)')
assertEqual(formatCHF(NaN), 'CHF 0.–', 'formatCHF(NaN) should be "CHF 0.–"')

// =============================================================================
// formatCHFCompact Tests
// =============================================================================
console.log('\n📝 formatCHFCompact Tests')
console.log('─'.repeat(50))

assert(normalizeApostrophe(formatCHFCompact(1850)).includes("1'850"), 'formatCHFCompact(1850) should have separator')
assertEqual(formatCHFCompact(1.80), '1.80', 'formatCHFCompact(1.80) should be "1.80"')

// =============================================================================
// formatTimeLeft Tests
// =============================================================================
console.log('\n📝 formatTimeLeft Tests')
console.log('─'.repeat(50))

const now = new Date()

// Past dates
assertEqual(formatTimeLeft(new Date(now.getTime() - 1000)), 'Beendet', 'Past date should be "Beendet"')

// Future dates
const in5Hours = new Date(now.getTime() + 5 * 60 * 60 * 1000)
const timeLeft5h = formatTimeLeft(in5Hours)
assert(timeLeft5h.includes('h') && timeLeft5h.includes('m'), `5 hours from now should show "Xh Ym" format, got: ${timeLeft5h}`)

const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
const timeLeft3d = formatTimeLeft(in3Days)
assert(timeLeft3d.includes('d'), `3 days from now should show "Xd Yh" format, got: ${timeLeft3d}`)

// Null/undefined
assertEqual(formatTimeLeft(null), '', 'formatTimeLeft(null) should be empty string')
assertEqual(formatTimeLeft(undefined), '', 'formatTimeLeft(undefined) should be empty string')

// =============================================================================
// getListingBadges Tests (Ricardo-Level Rules)
// =============================================================================
console.log('\n📝 getListingBadges Tests')
console.log('─'.repeat(50))

const baseListing: ListingData = {
  id: 'test-1',
  title: 'Test Product',
  price: 100,
}

// No badges for minimal listing
const noBadges = getListingBadges(baseListing)
assert(noBadges.length === 0, 'Minimal listing should have 0 badges')

// CRITICAL: Boosted items should NOT show "Gesponsert"
const boosted: ListingData = { ...baseListing, boosters: ['boost'] }
const boostedBadges = getListingBadges(boosted)
assert(
  !boostedBadges.includes('Gesponsert'),
  'Boosted items should NOT show "Gesponsert" - boosters are visibility, not sponsorship!'
)

// Sponsored badge ONLY if isSponsored === true
const sponsored: ListingData = { ...baseListing, isSponsored: true }
const sponsoredBadges = getListingBadges(sponsored)
assert(
  sponsoredBadges.includes('Gesponsert'),
  'Should include "Gesponsert" badge ONLY when isSponsored === true'
)

// Condition badge
const withCondition: ListingData = { ...baseListing, condition: 'like-new' }
const conditionBadges = getListingBadges(withCondition)
assert(conditionBadges.includes('Wie neu'), 'Should include condition badge')

// New listing should NOT show "Neu" condition
const newWithNeuCondition: ListingData = {
  ...baseListing,
  createdAt: new Date(),
  condition: 'new',
}
const newConditionBadges = getListingBadges(newWithNeuCondition)
assert(
  !newConditionBadges.includes('Neu'),
  'New listing should NOT show "Neu" condition badge (would be confusing)'
)

// Max 2 badges
const allFeatures: ListingData = {
  ...baseListing,
  isSponsored: true,
  condition: 'like-new',
}
const maxBadges = getListingBadges(allFeatures)
assert(maxBadges.length <= 2, `Should have max 2 badges, got ${maxBadges.length}: ${maxBadges.join(', ')}`)

// =============================================================================
// getDeliveryInfo Tests
// =============================================================================
console.log('\n📝 getDeliveryInfo Tests')
console.log('─'.repeat(50))

// Pickup only
const pickupOnly = getDeliveryInfo({ ...baseListing, shippingMethods: ['pickup'] })
assert(pickupOnly.pickupOnly === true, 'Pickup-only listing should have pickupOnly=true')
assert(pickupOnly.label === 'Nur Abholung', 'Pickup-only label should be "Nur Abholung"')

// Shipping available
const withShipping = getDeliveryInfo({ ...baseListing, shippingMethods: ['post_economy_2kg'] })
assert(withShipping.shippingAvailable === true, 'Should have shippingAvailable=true')
assert(withShipping.pickupOnly === false, 'Should not be pickup only')

// With shipping cost
const withCost = getDeliveryInfo({ ...baseListing, shippingMethods: ['post_economy_2kg'], shippingMinCost: 7.0 })
assert(withCost.costLabel !== null, 'Should have cost label when shippingMinCost provided')
assert(withCost.costLabel?.includes('7'), 'Cost label should include price')

// Free shipping
const freeShipping = getDeliveryInfo({ ...baseListing, shippingMethods: ['versand'], shippingMinCost: 0 })
assert(freeShipping.costLabel === 'Gratis', 'Free shipping should have costLabel="Gratis"')

// =============================================================================
// getBoostType Tests
// =============================================================================
console.log('\n📝 getBoostType Tests')
console.log('─'.repeat(50))

assertEqual(getBoostType({ ...baseListing, boosters: ['super-boost'] }), 'super-boost', 'Should detect super-boost')
assertEqual(getBoostType({ ...baseListing, boosters: ['turbo-boost'] }), 'turbo-boost', 'Should detect turbo-boost')
assertEqual(getBoostType({ ...baseListing, boosters: ['boost'] }), 'boost', 'Should detect boost')
assertEqual(getBoostType({ ...baseListing, boosters: [] }), null, 'Should return null for no boosters')
assertEqual(getBoostType(baseListing), null, 'Should return null for undefined boosters')

// Priority: super > turbo > standard
assertEqual(
  getBoostType({ ...baseListing, boosters: ['boost', 'super-boost', 'turbo-boost'] }),
  'super-boost',
  'Super-boost should take priority'
)

// =============================================================================
// hasVisibilityBoost Tests (NOT sponsorship)
// =============================================================================
console.log('\n📝 hasVisibilityBoost Tests')
console.log('─'.repeat(50))

assert(hasVisibilityBoost({ ...baseListing, boosters: ['boost'] }) === true, 'Should have boost with boost')
assert(hasVisibilityBoost({ ...baseListing, boosters: [] }) === false, 'Should not have boost without boosters')
assert(hasVisibilityBoost(baseListing) === false, 'Should not have boost with undefined boosters')

// =============================================================================
// checkIsNewListing Tests
// =============================================================================
console.log('\n📝 checkIsNewListing Tests')
console.log('─'.repeat(50))

assert(checkIsNewListing({ ...baseListing, createdAt: new Date() }) === true, 'Just created should be new')
const oldDate = new Date()
oldDate.setDate(oldDate.getDate() - 10) // 10 days ago
assert(checkIsNewListing({ ...baseListing, createdAt: oldDate }) === false, '10 days old should not be new')
assert(checkIsNewListing(baseListing) === false, 'No createdAt should not be new')

// =============================================================================
// getTimeSinceCreated Tests
// =============================================================================
console.log('\n📝 getTimeSinceCreated Tests')
console.log('─'.repeat(50))

const justNow = new Date()
const timeJustNow = getTimeSinceCreated({ ...baseListing, createdAt: justNow })
assert(timeJustNow.includes('gerade') || timeJustNow.includes('Min'), 'Just created should say "gerade eben" or "X Min"')

const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
const timeOneHour = getTimeSinceCreated({ ...baseListing, createdAt: oneHourAgo })
assert(timeOneHour.includes('Std'), 'One hour ago should include "Std"')

assertEqual(getTimeSinceCreated(baseListing), '', 'No createdAt should return empty string')

// =============================================================================
// Summary
// =============================================================================
console.log('\n' + '═'.repeat(50))
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`)
console.log('═'.repeat(50))

if (failed > 0) {
  console.log('\n❌ Some tests failed!')
  process.exit(1)
} else {
  console.log('\n✅ All tests passed!')
  process.exit(0)
}
