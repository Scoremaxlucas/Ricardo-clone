import type { ReactNode } from 'react'

/** Shell (Navbar/Footer) kommt von `WohnenLayoutShell` im Root-Layout — hier kein zweites Mal rendern. */
export default function AdminWohnenLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
