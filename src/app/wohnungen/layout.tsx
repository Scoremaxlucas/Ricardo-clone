import type { ReactNode } from 'react'

export default function WohnungenLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-[#f8fdfb] text-slate-900">{children}</div>
}
