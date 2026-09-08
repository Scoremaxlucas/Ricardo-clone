import { HouseMark } from '@/lib/sic/cert/art-web'
import { SIC_BRAND_NAME, SIC_OPERATOR, SIC_REVIEW_SLA_SENTENCE, SIC_SUPPORT_EMAIL } from '@/lib/sic/config'
import { SIC_REVIEWER, SIC_TRUST_FACTS } from '@/lib/sic/landing-copy'

/**
 * Vertrauen ohne Fake-Reviews: Gesicht, was «prüfen» heisst, Kontakt.
 * Eigenes Portrait später: `public/sic/pruefung.jpg` und dieses Markup um ein img ergänzen.
 */
export function SicLandingTrust() {
  return (
    <section id="pruefung" className="scroll-mt-24 border-y border-sic-hairline/70 bg-sic-paper py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-sic-gold-text">
          Prüfung
        </p>
        <h2 className="mt-3 text-center font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">
          Wer prüft
        </h2>
        <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-sic-navy">
            <HouseMark size={44} onDark />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="font-sic-serif text-xl font-semibold text-sic-navy">{SIC_REVIEWER.name}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {SIC_REVIEWER.role} · {SIC_BRAND_NAME}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {SIC_REVIEWER.name} prüft die Unterlagen persönlich. {SIC_REVIEW_SLA_SENTENCE} Eine KI liest sie
              zur Vorbereitung aus; freigeben tut immer ein Mensch. Das ist keine behördliche Auskunft und
              keine Empfehlung an den Vermieter.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Fragen vor dem Anlegen:{' '}
              <a
                href={`mailto:${SIC_SUPPORT_EMAIL}`}
                className="font-semibold text-sic-action underline-offset-2 hover:underline"
              >
                {SIC_SUPPORT_EMAIL}
              </a>
              {' · '}
              <a
                href={SIC_OPERATOR.phoneHref}
                className="font-semibold text-sic-action underline-offset-2 hover:underline"
              >
                {SIC_OPERATOR.phoneDisplay}
              </a>
            </p>
          </div>
        </div>
        <ul className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-3">
          {SIC_TRUST_FACTS.map(item => (
            <li key={item.title}>
              <h3 className="font-sic-serif text-lg font-bold text-sic-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
