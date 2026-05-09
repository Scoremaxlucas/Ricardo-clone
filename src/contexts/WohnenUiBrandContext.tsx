'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * True inside {@link WohnenLayoutShell}: primary actions and chrome should use
 * Helvenda Wohnungen brand green (#18a87c), not marketplace teal gradient.
 */
const WohnenUiBrandContext = createContext(false)

export function WohnenUiBrandProvider({ children }: { children: ReactNode }) {
  return <WohnenUiBrandContext.Provider value={true}>{children}</WohnenUiBrandContext.Provider>
}

export function useWohnenUiBrand(): boolean {
  return useContext(WohnenUiBrandContext)
}
