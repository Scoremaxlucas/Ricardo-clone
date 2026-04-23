import { WohnenFooter } from '@/components/wohnen/WohnenFooter'
import { WohnenNavbar } from '@/components/wohnen/WohnenNavbar'
import type { ReactNode } from 'react'

export default function AdminWohnenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8fdfb]">
      <WohnenNavbar />
      <div className="flex-1">{children}</div>
      <WohnenFooter />
    </div>
  )
}
