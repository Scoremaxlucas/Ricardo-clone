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
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">Häufige Fragen</h1>
      <p className="mt-2 text-sm text-slate-500">Kurzantworten zu Swiss Immo Cert.</p>

      <div className="mt-8 divide-y divide-sic-hairline rounded-2xl border border-sic-hairline bg-sic-paper-soft">
        {SIC_FAQ.map(item => (
          <div key={item.q} className="px-5 py-4">
            <h2 className="text-sm font-semibold text-sic-navy">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
