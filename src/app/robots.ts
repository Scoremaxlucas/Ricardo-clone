import { abs } from '@/lib/seo'
import { isSicProductionHostname, SIC_SITE_ORIGIN } from '@/lib/sic/config'
import { headers } from 'next/headers'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get('host') || ''
  const onSic = isSicProductionHostname(host) || h.get('x-sic-host') === '1'
  const base = onSic ? SIC_SITE_ORIGIN : abs('').replace(/\/$/, '')

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: onSic
          ? ['/api/', '/sic/admin', '/sic/zertifikat', '/sic/dossier', '/sic/anmelden', '/login', '/admin/']
          : ['/api/', '/admin/', '/auth/', '/checkout/', '/orders/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
