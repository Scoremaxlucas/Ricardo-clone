'use client'

import { createContext, useContext } from 'react'

/** True when auth is rendered on the Swiss Immo Cert host. */
const AuthSurfaceContext = createContext(false)

export function AuthSurfaceProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <AuthSurfaceContext.Provider value={value}>{children}</AuthSurfaceContext.Provider>
}

export function useAuthSicSurface(): boolean {
  return useContext(AuthSurfaceContext)
}

/** @deprecated Use {@link useAuthSicSurface}. */
export const useAuthWohnenSurface = useAuthSicSurface
