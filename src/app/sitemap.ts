import { prisma } from '@/lib/prisma'
import { abs } from '@/lib/seo'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { RentalListingStatus } from '@prisma/client'
import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'

// Force dynamic rendering - sitemap needs database access at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

function isWohnenHost(host: string): boolean {
  return host.split(':')[0].toLowerCase() === 'wohnen.helvenda.ch'
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p === '/' ? '' : p}` || b
}

async function wohnenSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = WOHNEN_SITE_ORIGIN.replace(/\/$/, '')

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: joinUrl(base, '/wohnungen'), lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: joinUrl(base, '/zertifikat'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: joinUrl(base, '/faq'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: joinUrl(base, '/contact'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: joinUrl(base, '/terms'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: joinUrl(base, '/privacy'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: joinUrl(base, '/imprint'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const listings = await prisma.rentalListing.findMany({
    where: { status: RentalListingStatus.active },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 5000,
  })

  const listingPages: MetadataRoute.Sitemap = listings.map(l => ({
    url: joinUrl(base, `/wohnungen/${l.id}`),
    lastModified: l.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...listingPages]
}

async function marketplaceSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = abs('')

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: abs('/watches'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: abs('/search'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: abs('/sell'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: abs('/auctions'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: abs('/fees'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: abs('/faq'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: abs('/help'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: abs('/imprint'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/privacy'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/terms'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: abs('/contact'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const watches = await prisma.watch.findMany({
    where: {
      OR: [
        { moderationStatus: null },
        { moderationStatus: { notIn: ['rejected', 'blocked', 'removed', 'ended'] } },
      ],
    },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const productPages: MetadataRoute.Sitemap = watches.map(w => ({
    url: abs(`/products/${w.id}`),
    lastModified: w.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...productPages]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers()
  const host = h.get('host') || ''
  return isWohnenHost(host) ? wohnenSitemap() : marketplaceSitemap()
}
