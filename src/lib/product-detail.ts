/**
 * Server-only: Produktdaten für /products/[id] und GET /api/products/[id].
 * Mit React cache() pro Request dedupliziert (z. B. Layout + Page in derselben Pipeline).
 */

import { getMainAddress } from '@/lib/address'
import { prisma } from '@/lib/prisma'
import { cache } from 'react'

export type ProductSaleInfo = {
  soldAt: string | null
  soldPrice: number | null
  isCurrentUserBuyer: boolean
  buyerName: string | null
}

export type ProductDetailPayload = {
  watch: Record<string, unknown> & {
    id: string
    isSold: boolean
  }
  images: string[]
  conditionMap: Record<string, string>
  seller: {
    id: string
    name: string | null
    nickname: string | null
    email: string | null
    image: string | null
    verified: boolean
    createdAt: string
    city: string | null
    postalCode: string | null
  } | null
  saleInfo: ProductSaleInfo | null
}

async function loadProductDetailInternal(
  id: string,
  currentUserId: string | null
): Promise<ProductDetailPayload | null> {
  if (!id) return null

  const selectFields = {
    id: true,
    articleNumber: true,
    title: true,
    description: true,
    brand: true,
    model: true,
    year: true,
    condition: true,
    material: true,
    movement: true,
    caseSize: true,
    caseDiameter: true,
    price: true,
    buyNowPrice: true,
    isAuction: true,
    auctionStart: true,
    auctionEnd: true,
    createdAt: true,
    images: true,
    accuracy: true,
    fullset: true,
    allLinks: true,
    box: true,
    papers: true,
    warranty: true,
    warrantyMonths: true,
    warrantyYears: true,
    warrantyNote: true,
    warrantyDescription: true,
    referenceNumber: true,
    shippingMethod: true,
    sellerId: true,
    moderationStatus: true,
    seller: {
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        image: true,
        verified: true,
        createdAt: true,
      },
    },
  } as const

  let watch = await prisma.watch.findUnique({
    where: { id },
    select: selectFields,
  })

  if (!watch && /^\d+$/.test(id)) {
    watch = await prisma.watch.findUnique({
      where: { articleNumber: parseInt(id, 10) },
      select: selectFields,
    })
  }

  if (!watch) return null

  let images: string[] = []
  try {
    images = watch.images ? JSON.parse(watch.images as string) : []
  } catch {
    images = []
  }

  let conditionMap: Record<string, string> = {}
  try {
    if (watch.condition) {
      const parsed = JSON.parse(watch.condition as string)
      conditionMap = typeof parsed === 'object' ? parsed : { overall: String(watch.condition) }
    }
  } catch {
    conditionMap = { overall: (watch.condition as string) || 'Nicht angegeben' }
  }

  const sellerAddress = watch.seller?.id ? await getMainAddress(watch.seller.id) : null
  const sellerWithAddress = watch.seller
    ? {
        id: watch.seller.id,
        name: watch.seller.name,
        nickname: watch.seller.nickname,
        email: watch.seller.email,
        image: watch.seller.image,
        verified: watch.seller.verified,
        createdAt: watch.seller.createdAt.toISOString(),
        city: sellerAddress?.city || null,
        postalCode: sellerAddress?.postalCode || null,
      }
    : null

  let isSold = false
  let saleInfo: ProductSaleInfo | null = null

  const activeOrder = await prisma.order.findFirst({
    where: {
      watchId: watch.id,
      orderStatus: { notIn: ['canceled', 'refunded'] },
    },
    select: {
      id: true,
      createdAt: true,
      totalAmount: true,
      buyerId: true,
      buyer: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (activeOrder) {
    isSold = true
    const buyerDisplayName =
      activeOrder.buyer?.firstName && activeOrder.buyer?.lastName
        ? `${activeOrder.buyer.firstName} ${activeOrder.buyer.lastName}`
        : activeOrder.buyer?.name || 'Käufer'

    saleInfo = {
      soldAt: activeOrder.createdAt.toISOString(),
      soldPrice: activeOrder.totalAmount,
      isCurrentUserBuyer: currentUserId === activeOrder.buyerId,
      buyerName: currentUserId === activeOrder.buyerId ? buyerDisplayName : null,
    }
  }

  if (!isSold) {
    const activePurchase = await prisma.purchase.findFirst({
      where: {
        watchId: watch.id,
        status: { notIn: ['cancelled'] },
      },
      select: {
        id: true,
        createdAt: true,
        price: true,
        buyerId: true,
        buyer: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (activePurchase) {
      isSold = true
      const buyerDisplayName =
        activePurchase.buyer?.firstName && activePurchase.buyer?.lastName
          ? `${activePurchase.buyer.firstName} ${activePurchase.buyer.lastName}`
          : activePurchase.buyer?.name || 'Käufer'

      saleInfo = {
        soldAt: activePurchase.createdAt.toISOString(),
        soldPrice: activePurchase.price,
        isCurrentUserBuyer: currentUserId === activePurchase.buyerId,
        buyerName: currentUserId === activePurchase.buyerId ? buyerDisplayName : null,
      }
    }
  }

  const payload: ProductDetailPayload = {
    watch: {
      id: watch.id,
      articleNumber: watch.articleNumber,
      title: watch.title,
      description: watch.description,
      brand: watch.brand,
      model: watch.model,
      year: watch.year,
      condition: watch.condition,
      material: watch.material,
      movement: watch.movement,
      caseSize: watch.caseSize,
      caseDiameter: watch.caseDiameter,
      price: watch.price,
      buyNowPrice: watch.buyNowPrice,
      isAuction: watch.isAuction,
      auctionStart: watch.auctionStart ? new Date(watch.auctionStart).toISOString() : null,
      auctionEnd: watch.auctionEnd ? new Date(watch.auctionEnd).toISOString() : null,
      createdAt: watch.createdAt ? new Date(watch.createdAt).toISOString() : null,
      accuracy: watch.accuracy,
      fullset: watch.fullset,
      allLinks: watch.allLinks,
      box: watch.box,
      papers: watch.papers,
      warranty: watch.warranty,
      warrantyMonths: watch.warrantyMonths,
      warrantyYears: watch.warrantyYears,
      warrantyNote: watch.warrantyNote,
      warrantyDescription: watch.warrantyDescription,
      referenceNumber: watch.referenceNumber,
      shippingMethod: watch.shippingMethod,
      sellerId: watch.sellerId,
      moderationStatus: watch.moderationStatus,
      isSold,
    },
    images,
    conditionMap,
    seller: sellerWithAddress,
    saleInfo: isSold ? saleInfo : null,
  }

  return payload
}

export const getProductDetailForPage = cache(loadProductDetailInternal)
