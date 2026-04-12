'use client'

import { useEffect, useState } from 'react'

/**
 * wohnen.helvenda.ch oder lokaler Test mit Cookie (nach ?subdomain=wohnen).
 */
export function useIsWohnenTenant(): boolean {
  const [isWohnen, setIsWohnen] = useState(false)
  useEffect(() => {
    const h = window.location.hostname.toLowerCase()
    const cookie =
      typeof document !== 'undefined' &&
      document.cookie.split(';').some(c => c.trim().startsWith('helvenda-wohnen-preview=1'))
    setIsWohnen(h === 'wohnen.helvenda.ch' || ((h === 'localhost' || h === '127.0.0.1') && cookie))
  }, [])
  return isWohnen
}
