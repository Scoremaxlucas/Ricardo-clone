import { DeferredComponents } from '@/components/DeferredComponents'
import { SkipLinks } from '@/components/accessibility/SkipLinks'
import { Providers } from '@/components/providers'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

/**
 * Root Layout - TTI Optimiert
 *
 * JavaScript Loading Strategie:
 * 1. Kritisch (0ms): Layout, Providers, Children
 * 2. Nach Paint (16ms): PrefetchOnHover
 * 3. Nach TTI (150ms): ServiceWorker
 * 4. Idle (500-3000ms): EmmaChat
 *
 * Nicht-kritisches JS wurde in DeferredComponents verschoben
 * um TTI zu verbessern.
 */

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  // OPTIMIERT: Nur die wichtigsten Gewichte laden
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Helvenda.ch - Schweizer Online-Marktplatz',
  description:
    'Der Schweizer Online-Marktplatz für Private und Gewerbetreibende. Kaufen, verkaufen und handeln Sie einfach und sicher.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Helvenda',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f766e',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f766e" />
        {/* DNS Prefetch für kritische Domains */}
        <link rel="dns-prefetch" href="https://vercel.live" />
        <link rel="preconnect" href="https://vercel.live" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <SkipLinks />
          {/* Kritischer Content - sofort gerendert */}
          <div className="flex flex-1 flex-col">{children}</div>

          {/* Toaster - minimal, sofort verfügbar */}
          <Toaster
            position="top-right"
            containerStyle={{ zIndex: 99999 }}
            toastOptions={{
              duration: 3000,
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
            }}
          />

          {/* Nicht-kritische Komponenten - verzögert geladen */}
          <DeferredComponents />
        </Providers>
      </body>
    </html>
  )
}
