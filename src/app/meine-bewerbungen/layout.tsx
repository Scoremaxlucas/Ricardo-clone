import type { ReactNode } from 'react'

export default function MeineBewerbungenLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-slate-50 text-slate-900">{children}</div>
}
