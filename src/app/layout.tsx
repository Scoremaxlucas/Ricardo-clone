import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'
import { EmmaChat } from '@/components/emma/EmmaChat'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Helvenda.ch - Schweizer Online-Marktplatz',
  description:
    'Der Schweizer Online-Marktplatz für Private und Gewerbetreibende. Kaufen, verkaufen und handeln Sie einfach und sicher.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <Providers>
          <div className="flex flex-1 flex-col pb-16 sm:pb-0">{children}</div>
          <MobileBottomNav />
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
          {/* Emma AI Assistant - Verfügbar auf allen Seiten */}
          <EmmaChat />
        </Providers>
      </body>
    </html>
  )
}
