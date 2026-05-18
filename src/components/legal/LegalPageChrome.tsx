import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import type { LegalPageSurface } from '@/lib/legal-page-surface'
import { legalMainBgClass } from '@/lib/legal-page-surface'
import type { ReactNode } from 'react'

/**
 * Marktplatz: klassisches Header/Footer-Chrome.
 * Wohnen-Subdomain: nur Inhalt — Navbar/Footer liefert WohnenLayoutShell.
 */
export function LegalPageChrome({
  surface,
  children,
}: {
  surface: LegalPageSurface
  children: ReactNode
}) {
  const main = <main className={legalMainBgClass(surface)}>{children}</main>

  if (surface === 'wohnen') {
    return main
  }

  return (
    <>
      <Header />
      {main}
      <Footer />
    </>
  )
}
