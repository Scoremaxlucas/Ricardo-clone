import { abs } from '@/lib/seo'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/auth/', '/checkout/', '/orders/'] },
    ],
    sitemap: `${abs('')}/sitemap.xml`,
    host: abs('').replace(/\/$/, ''),
  }
}
