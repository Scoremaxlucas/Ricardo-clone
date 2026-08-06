import { prisma } from '@/lib/prisma'
import { abs } from '@/lib/seo'
import { isSicProductionHostname, SIC_SITE_ORIGIN } from '@/lib/sic/config'
import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'

// Force dynamic rendering - sitemap needs database access at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p === '/' ? '' : p}` || b
}

async function sicSitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SIC_SITE_ORIGIN.replace(/\/$/, '')

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: joinUrl(base, '/sic'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: joinUrl(base, '/sic/faq'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: joinUrl(base, '/sic/agb'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: joinUrl(base, '/sic/datenschutz'), lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
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
  const onSic = isSicProductionHostname(host) || h.get('x-sic-host') === '1'
  return onSic ? sicSitemap() : marketplaceSitemap()
}
