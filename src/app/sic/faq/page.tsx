import { SIC_FAQ } from '@/lib/sic/faq'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Häufige Fragen',
  robots: { index: true, follow: true },
}

export default function SicFaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-2xl font-bold text-[#0f2b5e]">Häufige Fragen</h1>
      <p className="mt-2 text-sm text-slate-500">Kurzantworten zu Swiss Immo Cert.</p>

      <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {SIC_FAQ.map(item => (
          <div key={item.q} className="px-5 py-4">
            <h2 className="text-sm font-semibold text-[#0f2b5e]">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
