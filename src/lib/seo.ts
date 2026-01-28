/**
 * SEO helpers: base URL, sitemap product filter, product meta for generateMetadata
 */

import { prisma } from '@/lib/prisma'

export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://helvenda.ch'

/** Normalize to absolute URL (no trailing slash) */
export function abs(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL.replace(/\/$/, '')}${p}`
}

export interface ProductMeta {
  title: string
  description: string
  image: string | null
  price: number
  isAuction: boolean
  condition: string
}

/** Fetch minimal product data for SEO metadata (server-only). */
export async function getProductMeta(id: string): Promise<ProductMeta | null> {
  const select = {
    title: true,
    description: true,
    images: true,
    price: true,
    buyNowPrice: true,
    isAuction: true,
    condition: true,
  }
  let w = await prisma.watch.findUnique({ where: { id }, select })
  if (!w && /^\d+$/.test(id)) {
    w = await prisma.watch.findUnique({ where: { articleNumber: parseInt(id) }, select })
  }
  if (!w) return null

  let images: string[] = []
  try {
    images = w.images ? JSON.parse(w.images as string) : []
  } catch {
    images = []
  }
  const firstImage = images[0] && typeof images[0] === 'string' ? images[0] : null
  const imageAbs =
    !firstImage || firstImage.startsWith('data:')
      ? null
      : firstImage.startsWith('http')
        ? firstImage
        : abs(firstImage.startsWith('/') ? firstImage : `/${firstImage}`)

  let conditionLabel = 'Nicht angegeben'
  try {
    if (w.condition) {
      const p = JSON.parse(w.condition as string)
      conditionLabel = typeof p === 'object' && p?.overall ? String(p.overall) : String(w.condition)
    }
  } catch {
    conditionLabel = String(w.condition || '')
  }

  const price = Number(w.price)
  const buyNow = w.buyNowPrice != null ? Number(w.buyNowPrice) : null
  const priceStr =
    buyNow != null && buyNow > 0
      ? `CHF ${price.toLocaleString('de-CH')} (Sofortkauf CHF ${buyNow.toLocaleString('de-CH')})`
      : `CHF ${price.toLocaleString('de-CH')}`

  const title = (w.title || 'Artikel').replace(/^["']|["']$/g, '').trim()
  const desc =
    title +
    ' – ' +
    priceStr +
    (w.isAuction ? ', Auktion' : ', Sofortkauf') +
    ' · ' +
    conditionLabel +
    ' · Helvenda'

  return {
    title,
    description: desc.slice(0, 160),
    image: imageAbs,
    price,
    isAuction: Boolean(w.isAuction),
    condition: conditionLabel,
  }
}
