import type { ReactNode } from 'react'

export default function MeineBewerbungenLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f8fdfb] text-slate-900">{children}</div>
}
