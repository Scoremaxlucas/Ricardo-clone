import { AnalyticsTracker } from '@/components/AnalyticsTracker'
import { CookieConsent } from '@/components/CookieConsent'
import { DeferredComponents } from '@/components/DeferredComponents'
import { SkipLinks } from '@/components/accessibility/SkipLinks'
import { Providers } from '@/components/providers'
import { isSicSiteHostFromHeaders } from '@/lib/tenant-host'
import { SIC_SITE_ORIGIN } from '@/lib/sic/config'
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

const helvendaIcons: Metadata['icons'] = {
  icon: [
    { url: '/icons/favicon.svg', type: 'image/svg+xml' },
    { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
  ],
  apple: [{ url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
}

const sicIcons: Metadata['icons'] = {
  icon: [
    { url: '/sic/icons/favicon.svg', type: 'image/svg+xml' },
    { url: '/sic/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
    { url: '/sic/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
  ],
  apple: [{ url: '/sic/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
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
  // SIC-Host (früher Helvenda Wohnen): nur noch Swiss Immo Cert
  if (isSicSiteHostFromHeaders(h) || h.get('x-sic-host') === '1' || h.get('x-sic-route') === '1') {
    return {
      metadataBase: new URL(SIC_SITE_ORIGIN),
      title: {
        default: 'Swiss Immo Cert — Das geprüfte Schweizer Mieter-Zertifikat',
        template: '%s | Swiss Immo Cert',
      },
      description:
        'Du bewirbst dich, und es reicht oft nicht. Geprüftes Mieter-Zertifikat: Betreibungen, Lohn und Arbeitsstelle, Referenz vom Vermieter, Ausweis — per QR-Code prüfbar. Keine Wohnungszusage.',
      keywords: [
        'Mieter-Zertifikat Schweiz',
        'Betreibungsauszug Mieter',
        'Wohnungsbewerbung',
        'Swiss Immo Cert',
      ],
      openGraph: {
        siteName: 'Swiss Immo Cert',
        locale: 'de_CH',
      },
      twitter: {
        card: 'summary_large_image',
      },
      manifest: '/manifest.json',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Swiss Immo Cert',
      },
      icons: sicIcons,
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
    icons: helvendaIcons,
  }
}

export async function generateViewport(): Promise<Viewport> {
  const h = await headers()
  const sicHost = isSicSiteHostFromHeaders(h) || h.get('x-sic-host') === '1'
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: sicHost ? '#0f2b5e' : '#0f766e',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  // Hard pivot: auf dem SIC-Host (swissimmocert.ch) nie die Marktplatz-/Wohnen-Shell.
  const isSic = h.get('x-sic-route') === '1' || h.get('x-sic-host') === '1' || isSicSiteHostFromHeaders(h)
  const htmlLang = isSic ? 'de-CH' : 'de'

  const toastPad = { padding: '12px 16px', fontSize: '14px' as const }
  const toastOptions = isSic ?
    {
      duration: 3500,
      success: {
        style: {
          ...toastPad,
          background: '#0f2b5e',
          color: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 28px rgba(15, 43, 94, 0.16)',
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
          background: '#1e293b',
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
        <link rel="apple-touch-icon" href={isSic ? '/sic/icons/apple-touch-icon.svg' : '/icons/apple-touch-icon.svg'} />
        <link rel="icon" type="image/svg+xml" href={isSic ? '/sic/icons/favicon.svg' : '/icons/favicon.svg'} />
        <link rel="dns-prefetch" href="https://vercel.live" />
        <link rel="preconnect" href="https://vercel.live" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <SkipLinks />
          <div className="flex flex-1 flex-col">{children}</div>

          <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} toastOptions={toastOptions} />

          {!isSic && <AnalyticsTracker />}

          <DeferredComponents suppressMarketplaceWidgets={isSic} />

          {!isSic && <CookieConsent />}
        </Providers>
      </body>
    </html>
  )
}
