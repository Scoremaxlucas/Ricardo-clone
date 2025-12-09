import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense, lazy } from 'react'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { ServiceWorker } from '@/components/ServiceWorker'

// Lazy load EmmaChat - not critical for initial render
const EmmaChat = lazy(() => import('@/components/emma/EmmaChat').then(m => ({ default: m.EmmaChat })))

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Better performance - show fallback font immediately
  preload: true,
})

export const metadata: Metadata = {
  title: 'Helvenda.ch - Schweizer Online-Marktplatz',
  description:
    'Der Schweizer Online-Marktplatz für Private und Gewerbetreibende. Kaufen, verkaufen und handeln Sie einfach und sicher.',
  manifest: '/manifest.json',
  themeColor: '#0f766e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Helvenda',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f766e" />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <ServiceWorker />
        <Providers>
          <div className="flex flex-1 flex-col">{children}</div>
          <Toaster
            position="top-right"
            toastOptions={{
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
            }}
          />
          {/* Emma AI Assistant - Lazy loaded for better performance */}
          <Suspense fallback={null}>
            <EmmaChat />
          </Suspense>
        </Providers>
      </body>
    </html>
  )
}
