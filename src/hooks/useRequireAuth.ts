'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Hook für Seiten, die Authentifizierung erfordern
 * Verhindert doppelte Redirects und Race Conditions
 */
export function useRequireAuth(redirectTo?: string) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      setIsLoading(true)
      setIsAuthorized(false)
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session?.user) {
      setIsLoading(false)
      setIsAuthorized(false)
      const callbackUrl = redirectTo || pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    // Authentifiziert
    setIsLoading(false)
    setIsAuthorized(true)
  }, [status, session, router, pathname, redirectTo])

  return {
    session,
    isAuthorized,
    isLoading: isLoading || status === 'loading',
    status
  }
}

