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
    
    // Step 7: Try to create an order (DRY RUN - no actual creation unless testCreate=true)
    const testCreate = url.searchParams.get('testCreate') === 'true'
    if (watchId && buyerId && testCreate) {
      try {
        const watch = await prisma.watch.findUnique({
          where: { id: watchId },
          select: { id: true, price: true, buyNowPrice: true, sellerId: true },
        })
        
        if (!watch) {
          results.errors.push('7. Order creation skipped: Watch not found')
        } else {
          const { calculateOrderFees } = await import('@/lib/order-fees')
          const itemPrice = watch.buyNowPrice || watch.price
          const fees = await calculateOrderFees(itemPrice, 0, true)
          
          const year = new Date().getFullYear()
          const lastOrder = await prisma.order.findFirst({
            where: { orderNumber: { startsWith: `ORD-${year}-` } },
            orderBy: { orderNumber: 'desc' },
          })
          let orderNumber = `ORD-${year}-001`
          if (lastOrder) {
            const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2])
            if (!isNaN(lastNumber)) {
              orderNumber = `ORD-${year}-${String(lastNumber + 1).padStart(3, '0')}`
            }
          }
          
          const orderData = {
            orderNumber,
            watchId: watch.id,
            buyerId,
            sellerId: watch.sellerId,
            itemPrice: fees.itemPrice,
            shippingCost: 0,
            shippingCostChfFinal: 0,
            shippingCostBreakdown: JSON.stringify({ base: 0, sperrgut: 0, pickhome: 0, freeShippingApplied: false }),
            selectedDeliveryMode: 'pickup',
            selectedShippingCode: null,
            selectedAddons: null,
            shippingRateSetId: 'default_ch_post',
            platformFee: fees.platformFee,
            protectionFee: fees._processingFeeOnly,
            totalAmount: fees.totalAmount,
            paymentMethod: 'cash_on_pickup',
            orderStatus: 'confirmed',
            paymentStatus: 'pending_cash',
            paymentDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            contactDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }
          
          results.orderData = orderData
          
          const order = await prisma.order.create({
            data: orderData,
          })
          
          results.steps.push(`7. Order created: ${order.orderNumber}`)
          results.createdOrder = order
        }
      } catch (e: any) {
        results.errors.push(`7. Order creation failed: ${e.message}`)
        results.orderCreationError = {
          message: e.message,
          code: e.code,
          meta: e.meta,
        }
      }
    } else {
      results.steps.push('7. Order creation: Skipped (need watchId, buyerId, and testCreate=true)')
    }
    
    return NextResponse.json(results)
  } catch (error: any) {
    results.errors.push(`Unexpected error: ${error.message}`)
    return NextResponse.json(results, { status: 500 })
  }
}
