import { AnalyticsTracker } from '@/components/AnalyticsTracker'
import { CookieConsent } from '@/components/CookieConsent'
import { DeferredComponents } from '@/components/DeferredComponents'
import { SkipLinks } from '@/components/accessibility/SkipLinks'
import { Providers } from '@/components/providers'
import { WohnenLayoutShell } from '@/components/wohnen/WohnenLayoutShell'
import { isWohnenMatchingHostFromHeaders } from '@/lib/tenant-host'
import { BASE_URL } from '@/lib/seo'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { headers } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
})

const sharedIcons: Metadata['icons'] = {
  icon: [
    { url: '/icons/favicon.svg', type: 'image/svg+xml' },
    { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
  ],
  apple: [{ url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
}

/** Canonical origin for the current request (avoids wrong metadataBase from env on wohnen.helvenda.ch). */
function requestOriginUrl(h: { get(name: string): string | null }): URL {
  try {
    const host = (h.get('host') || '').trim()
    if (!host) return new URL(WOHNEN_SITE_ORIGIN)
    const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim()
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    const proto = forwardedProto || (isLocal ? 'http' : 'https')
    return new URL(`${proto}://${host}`)
  } catch {
    return new URL(WOHNEN_SITE_ORIGIN)
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  if (isWohnenMatchingHostFromHeaders(h)) {
    return {
      metadataBase: requestOriginUrl(h),
      title: {
        default: 'Helvenda Wohnungen — Fair mieten und vermieten in der Schweiz',
        template: '%s | Helvenda Wohnungen',
      },
      description:
        'Kostenlos Wohnungen inserieren. Keine Abo-Pflicht für Mieter. Nur verifizierte Anfragen mit integriertem Betreibungsregisterauszug.',
      keywords: ['Wohnung mieten Schweiz', 'Wohnung inserieren kostenlos', 'Mietwohnung Zürich', 'Betreibungsregisterauszug Mieter'],
      openGraph: {
        siteName: 'Helvenda Wohnungen',
        locale: 'de_CH',
      },
      manifest: '/manifest.json',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Helvenda Wohnungen',
      },
      icons: sharedIcons,
    }
  }

  return {
    metadataBase: new URL(BASE_URL),
    title: 'Helvenda.ch - Schweizer Online-Marktplatz',
    description:
      'Der Schweizer Online-Marktplatz für Private und Gewerbetreibende. Kaufen, verkaufen und handeln Sie einfach und sicher.',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Helvenda',
    },
    icons: sharedIcons,
  }
}

export async function generateViewport(): Promise<Viewport> {
  const h = await headers()
  const wohnen = isWohnenMatchingHostFromHeaders(h)
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: wohnen ? '#107a5a' : '#0f766e',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const isSic = h.get('x-sic-route') === '1'
  const isWohnenMatching = !isSic && isWohnenMatchingHostFromHeaders(h)
  const htmlLang = isSic || isWohnenMatching ? 'de-CH' : 'de'

  const toastPad = { padding: '12px 16px', fontSize: '14px' as const }
  const toastOptions = isWohnenMatching ?
    {
      duration: 3500,
      success: {
        style: {
          ...toastPad,
          background: '#18a87c',
          color: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 28px rgba(13, 43, 31, 0.14)',
          fontWeight: 500,
        },
      },
      error: {
        style: {
          ...toastPad,
          background: '#dc2626',
          color: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.12)',
          fontWeight: 500,
        },
      },
      loading: {
        style: {
          ...toastPad,
          background: '#1e3d2f',
          color: '#fff',
          borderRadius: '12px',
          fontWeight: 500,
        },
      },
    }
  : {
      duration: 3500,
      success: {
        style: {
          background: '#10b981',
          color: '#fff',
          borderRadius: '8px',
          ...toastPad,
        },
      },
      error: {
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
          ...toastPad,
        },
      },
      loading: {
        style: {
          background: '#334155',
          color: '#fff',
          borderRadius: '8px',
          ...toastPad,
        },
      },
    }

  return (
    <html lang={htmlLang} className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link rel="dns-prefetch" href="https://vercel.live" />
        <link rel="preconnect" href="https://vercel.live" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.className} flex min-h-screen flex-col${isWohnenMatching ? ' helvenda-wohnen' : ''}`}
      >
        <Providers>
          <SkipLinks />
          {isWohnenMatching ?
            <WohnenLayoutShell>{children}</WohnenLayoutShell>
          : <div className="flex flex-1 flex-col">{children}</div>}

          <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={toastOptions} />

          {!isWohnenMatching && !isSic && <AnalyticsTracker />}

          <DeferredComponents suppressMarketplaceWidgets={isWohnenMatching || isSic} />

          {!isSic && <CookieConsent />}
        </Providers>
      </body>
    </html>
  )
}
