'use client'

import {
  isCompactProfilShellPath,
  isPublicCertificateVerifyPath,
  isTenantProfilWizardPath,
} from '@/lib/wohnen-profil-flow-paths'
import { WohnenUiBrandProvider } from '@/contexts/WohnenUiBrandContext'
import { WohnenFooter } from '@/components/wohnen/WohnenFooter'
import { WohnenNavbar } from '@/components/wohnen/WohnenNavbar'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Einheitliches Wohnen-Layout: Navbar, Main, Footer.
 * Profil-Wizard und Betreibungs-Upload: neutrale Fläche, Main ohne Doppel-Scroll.
 */
export function WohnenLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || ''
  const publicVerify = isPublicCertificateVerifyPath(pathname)
  const compact = isCompactProfilShellPath(pathname)
  const wizardOnly = isTenantProfilWizardPath(pathname)

  if (publicVerify) {
    return (
      <WohnenUiBrandProvider>
        <div data-wohnen-shell="verify-public" className="min-h-screen">
          {children}
        </div>
      </WohnenUiBrandProvider>
    )
  }

  return (
    <WohnenUiBrandProvider>
      <div
        data-wohnen-shell
        className={
          compact ?
            'flex min-h-screen flex-col bg-white text-slate-900'
          : 'flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white text-slate-900'
        }
      >
        <WohnenNavbar />
        <main
          id="main-content"
          className={
            wizardOnly ?
              'flex min-h-0 w-full flex-1 flex-col overflow-hidden'
            : 'flex min-h-0 w-full flex-1 flex-col'
          }
          tabIndex={-1}
        >
          {children}
        </main>
        <WohnenFooter />
      </div>
    </WohnenUiBrandProvider>
  )
}
