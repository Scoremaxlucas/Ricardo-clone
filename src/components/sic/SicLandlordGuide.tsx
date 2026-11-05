import { SicCertExampleCard } from '@/components/sic/SicCertExampleCard'
import { SIC_SUPPORT_EMAIL } from '@/lib/sic/config'
import { SIC_LANDLORD_GUIDE_EXAMPLE_UNCHECKED, sicLandlordGuideCopy } from '@/lib/sic/landlord-explainer'
import Link from 'next/link'

/**
 * Vermieter-Seite: erklärt, wie ein Mieter-Zertifikat zu lesen ist.
 * Texte kommen aus `landlord-explainer.ts` — dieselbe Quelle wie die Prüfseite.
 * Bewusst ohne Kaufaufforderung.
 */
export function SicLandlordGuide() {
  const copy = sicLandlordGuideCopy()

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sic-navy/50">{copy.kicker}</p>
      <h1 className="mt-2 font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
        {copy.title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{copy.lead}</p>

      <figure className="mt-8 rounded-2xl border border-sic-hairline bg-sic-paper-soft px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-[23rem]">
          <SicCertExampleCard uncheckedIds={SIC_LANDLORD_GUIDE_EXAMPLE_UNCHECKED} showAllLines />
        </div>
        <figcaption className="mx-auto mt-5 max-w-[26rem] text-center text-[12px] leading-relaxed text-slate-500">
          {copy.exampleCaption}
        </figcaption>
      </figure>

      <nav aria-label="Inhalt" className="mt-8 border-y border-sic-hairline py-4">
        <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {copy.sections.map(section => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="touch-target-exempt text-sic-navy underline-offset-2 hover:text-sic-action hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {copy.sections.map(section => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="font-sic-serif text-lg font-semibold tracking-tight text-sic-navy sm:text-xl">
              {section.title}
            </h2>
            {section.paragraphs.map(paragraph => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
            {section.bullets ?
              <ul className="mt-3 space-y-2">
                {section.bullets.map(bullet => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span aria-hidden className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-sic-navy" />
                    {bullet}
                  </li>
                ))}
              </ul>
            : null}
            {section.points ?
              <dl className="mt-4 divide-y divide-sic-hairline border-y border-sic-hairline">
                {section.points.map(point => (
                  <div key={point.title} className="py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
                    <dt className="text-sm font-semibold text-sic-navy">{point.title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-600 sm:mt-0">{point.body}</dd>
                  </div>
                ))}
              </dl>
            : null}
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-sic-hairline pt-6">
        <p className="text-[12px] leading-relaxed text-slate-500">{copy.kiNote}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Fragen zu einem Zertifikat:{' '}
          <a href={`mailto:${SIC_SUPPORT_EMAIL}`} className="text-sic-action underline-offset-2 hover:underline">
            {SIC_SUPPORT_EMAIL}
          </a>
        </p>
        <p className="mt-3 text-[12px] text-slate-500">
          <Link href={copy.faqHref} className="text-sic-action underline-offset-2 hover:underline">
            Häufige Fragen
          </Link>
          <span aria-hidden className="px-2 text-slate-300">
            ·
          </span>
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
      </div>
    </div>
  )
}
