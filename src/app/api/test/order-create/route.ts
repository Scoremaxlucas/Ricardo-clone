import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Test endpoint for debugging order creation
 * GET /api/test/order-create?watchId=xxx&buyerId=xxx
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const watchId = url.searchParams.get('watchId')
  const buyerId = url.searchParams.get('buyerId')
  
  const results: any = {
    steps: [],
    errors: [],
  }
  
  try {
    // Step 1: Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      results.steps.push('1. Database connection: OK')
    } catch (e: any) {
      results.errors.push(`1. Database connection failed: ${e.message}`)
      return NextResponse.json(results, { status: 500 })
    }
    
    // Step 2: Try to query a watch
    if (watchId) {
      try {
        const watch = await prisma.watch.findUnique({
          where: { id: watchId },
          select: {
            id: true,
            price: true,
            buyNowPrice: true,
            sellerId: true,
            paymentProtectionEnabled: true,
          },
        })
        results.steps.push(`2. Watch query: ${watch ? 'Found' : 'Not found'}`)
        results.watch = watch
      } catch (e: any) {
        results.errors.push(`2. Watch query failed: ${e.message}`)
      }
    } else {
      results.steps.push('2. Watch query: Skipped (no watchId)')
    }
    
    // Step 3: Try to count orders
    try {
      const orderCount = await prisma.order.count()
      results.steps.push(`3. Order count: ${orderCount}`)
    } catch (e: any) {
      results.errors.push(`3. Order count failed: ${e.message}`)
    }
    
    // Step 4: Try to query last order number
    try {
      const year = new Date().getFullYear()
      const lastOrder = await prisma.order.findFirst({
        where: {
          orderNumber: {
            startsWith: `ORD-${year}-`,
          },
        },
        orderBy: {
          orderNumber: 'desc',
        },
        select: {
          orderNumber: true,
        },
      })
      results.steps.push(`4. Last order number: ${lastOrder?.orderNumber || 'None'}`)
    } catch (e: any) {
      results.errors.push(`4. Last order query failed: ${e.message}`)
    }
    
    // Step 5: Check PricingHistory table
    try {
      const pricingCount = await prisma.pricingHistory.count()
      results.steps.push(`5. PricingHistory count: ${pricingCount}`)
    } catch (e: any) {
      results.errors.push(`5. PricingHistory query failed: ${e.message}`)
    }
    
    // Step 6: Test fee calculation
    try {
      const { calculateOrderFees } = await import('@/lib/order-fees')
      const fees = await calculateOrderFees(100, 10, true)
      results.steps.push(`6. Fee calculation: OK`)
      results.fees = fees
    } catch (e: any) {
      results.errors.push(`6. Fee calculation failed: ${e.message}`)
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    results.errors.push(`Unexpected error: ${error.message}`)
    return NextResponse.json(results, { status: 500 })
  }
}
