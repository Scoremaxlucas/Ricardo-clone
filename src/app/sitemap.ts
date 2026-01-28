import { prisma } from '@/lib/prisma'
import { abs } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const productPages: MetadataRoute.Sitemap = watches.map((w) => ({
    url: abs(`/products/${w.id}`),
    lastModified: w.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...productPages]
}
