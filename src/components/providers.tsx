'use client'

import { SessionProvider } from 'next-auth/react'
import { type ReactNode } from 'react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { CookieConsentProvider } from '@/contexts/CookieConsentContext'
import { AuthGateProvider } from '@/contexts/AuthGateContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <CookieConsentProvider>
          <AuthGateProvider>{children}</AuthGateProvider>
        </CookieConsentProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
