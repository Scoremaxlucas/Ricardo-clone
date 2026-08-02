import { abs } from '@/lib/seo'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

function isWohnenHost(host: string): boolean {
  return host.split(':')[0].toLowerCase() === 'wohnen.helvenda.ch'
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get('host') || ''
  const base = isWohnenHost(host) ? WOHNEN_SITE_ORIGIN : abs('').replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: isWohnenHost(host)
          ? ['/api/', '/sic/admin', '/sic/zertifikat', '/sic/dossier', '/login', '/admin/']
          : ['/api/', '/admin/', '/auth/', '/checkout/', '/orders/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
