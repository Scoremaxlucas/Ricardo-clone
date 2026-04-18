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

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  if (isWohnenMatchingHostFromHeaders(h)) {
    return {
      metadataBase: new URL(WOHNEN_SITE_ORIGIN),
      title: {
        default: 'Helvenda Wohnungen — Fair mieten und vermieten in der Schweiz',
        template: '%s | Helvenda Wohnungen',
      },
      description:
        'Kostenlos Wohnungen inserieren. Keine Abo-Pflicht für Mieter. Nur verifizierte Anfragen mit integriertem Betreibungsregister.',
      keywords: ['Wohnung mieten Schweiz', 'Wohnung inserieren kostenlos', 'Mietwohnung Zürich', 'Betreibungsregister Mieter'],
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f766e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isWohnenMatching = isWohnenMatchingHostFromHeaders(headers())

  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="dns-prefetch" href="https://vercel.live" />
        <link rel="preconnect" href="https://vercel.live" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <SkipLinks />
          {isWohnenMatching ?
            <WohnenLayoutShell>{children}</WohnenLayoutShell>
          : <div className="flex flex-1 flex-col">{children}</div>}

          <Toaster
            position="top-right"
            containerStyle={{ zIndex: 99999 }}
            toastOptions={{
              duration: 3500,
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
              },
              loading: {
                style: {
                  background: '#334155',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                },
              },
            }}
          />

          {!isWohnenMatching && <AnalyticsTracker />}

          <DeferredComponents suppressMarketplaceWidgets={isWohnenMatching} />

          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}
