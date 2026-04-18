import { WohnenPublicNav } from '@/components/wohnen/WohnenPublicNav'
import type { ReactNode } from 'react'

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <WohnenPublicNav />
      {children}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Helvenda Wohnungen
      </footer>
    </div>
  )
}
