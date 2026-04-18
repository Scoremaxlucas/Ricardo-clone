import { WohnenFooter } from '@/components/wohnen/WohnenFooter'
import { WohnenNavbar } from '@/components/wohnen/WohnenNavbar'
import type { ReactNode } from 'react'

/**
 * Einheitliches Wohnen-Layout: Navbar (Client), flexibles Main, Footer (Server).
 */
export function WohnenLayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <WohnenNavbar />
      <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col" tabIndex={-1}>
        {children}
      </main>
      <WohnenFooter />
    </div>
  )
}
