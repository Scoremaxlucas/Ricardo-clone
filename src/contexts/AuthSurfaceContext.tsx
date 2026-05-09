'use client'

import { createContext, useContext } from 'react'

/** True when auth is rendered on Helvenda Wohnungen (wohnen.helvenda.ch / preview cookie). */
const AuthSurfaceContext = createContext(false)

export function AuthSurfaceProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <AuthSurfaceContext.Provider value={value}>{children}</AuthSurfaceContext.Provider>
}

export function useAuthWohnenSurface(): boolean {
  return useContext(AuthSurfaceContext)
}
