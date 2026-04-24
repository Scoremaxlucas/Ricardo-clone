import type { ReactNode } from 'react'

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-white text-slate-900">{children}</div>
}
