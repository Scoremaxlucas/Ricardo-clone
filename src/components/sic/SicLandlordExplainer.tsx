import { sicLandlordExplainerCopy } from '@/lib/sic/landlord-explainer'
import Link from 'next/link'

export function SicLandlordExplainer({
  completenessLabel,
  sealed,
}: {
  completenessLabel: string
  sealed: boolean
}) {
  const copy = sicLandlordExplainerCopy({ completenessLabel, sealed })

  return (
    <aside className="mx-auto mt-10 w-full max-w-[42rem] border border-sic-hairline bg-sic-paper-soft px-5 py-6 sm:px-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sic-navy/50">{copy.kicker}</p>
      <p className="mt-2 font-sic-serif text-[1.05rem] font-semibold leading-snug text-sic-navy sm:text-lg">
        {copy.lead}
      </p>
      {copy.workingNote ?
        <p className="mt-3 rounded-lg border border-sic-hairline bg-sic-paper px-3 py-2.5 text-[12px] leading-relaxed text-sic-navy">
          {copy.workingNote}
        </p>
      : null}
      <dl className="mt-5 space-y-4">
        {copy.items.map(item => (
          <div key={item.title}>
            <dt className="text-sm font-semibold text-sic-navy">{item.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-[12px] leading-relaxed text-slate-500">{copy.kiNote}</p>
      <p className="mt-3 text-[12px] text-slate-500">
        <Link href={copy.agbHref} className="text-sic-action underline-offset-2 hover:underline">
          AGB
        </Link>
        <span aria-hidden className="px-2 text-slate-300">
          ·
        </span>
        <Link href={copy.datenschutzHref} className="text-sic-action underline-offset-2 hover:underline">
          Datenschutz
        </Link>
      </p>
    </aside>
  )
}
