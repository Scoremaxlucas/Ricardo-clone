'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import type { ReactNode } from 'react'

/**
 * Marktplatz: klassisches Header/Footer-Chrome.
 * Wohnen-Subdomain: kein doppeltes Chrome — nur Inhalt (Navbar/Footer liefert WohnenLayoutShell).
 */
export function DualHostDocumentShell({
  wohnen,
  children,
}: {
  wohnen: boolean
  children: ReactNode
}) {
  if (wohnen) {
    return <div className="min-h-0 flex-1 bg-gray-50">{children}</div>
  }
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  )
}
