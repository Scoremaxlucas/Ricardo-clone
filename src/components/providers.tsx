'use client'

import { SessionProvider } from 'next-auth/react'
import { type ReactNode } from 'react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { CookieConsentProvider } from '@/contexts/CookieConsentContext'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <CookieConsentProvider>{children}</CookieConsentProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
