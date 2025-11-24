'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

/**
 * Prüft ob der Benutzer eingeloggt ist und leitet zur Login-Seite weiter falls nicht
 * @param callbackUrl - URL zu der nach dem Login zurückgeleitet werden soll
 * @returns true wenn eingeloggt, false wenn nicht eingeloggt (und weitergeleitet wurde)
 */
export function requireAuth(callbackUrl?: string): boolean {
  if (typeof window === 'undefined') return false
  
  const currentUrl = window.location.pathname + window.location.search
  const redirectUrl = callbackUrl || currentUrl
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(redirectUrl)}`
  
  window.location.href = loginUrl
  return false
}

/**
 * Hook zum Prüfen ob der Benutzer eingeloggt ist
 * Leitet automatisch zur Login-Seite weiter falls nicht eingeloggt
 */
export function useRequireAuth(callbackUrl?: string) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const checkAuth = () => {
    if (status === 'loading') return false
    if (!session?.user) {
      const currentUrl = typeof window !== 'undefined' 
        ? window.location.pathname + window.location.search 
        : '/'
      const redirectUrl = callbackUrl || currentUrl
      router.push(`/login?callbackUrl=${encodeURIComponent(redirectUrl)}`)
      return false
    }
    return true
  }

  return {
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    checkAuth
  }
}







