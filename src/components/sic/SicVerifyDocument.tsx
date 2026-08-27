import {
  CalendarMark,
  CornerFlourish,
  CrestWithLaurel,
  GuillocheRule,
  ModuleGlyph,
  Seal,
} from '@/lib/sic/cert/art-web'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_BRAND_NAME } from '@/lib/sic/config'
import type { SicVerifiedModuleView } from '@/lib/sic/dossier'
import { SIC_SCOPE_NOTE } from '@/lib/sic/modules'
import type { ReactNode } from 'react'

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type QuietState = 'rate_limited' | 'unknown' | 'not_ready'

export type SicVerifyDocumentProps =
  | { state: QuietState; code?: string }
  | {
      state: 'valid'
      certificateCode: string
      holderName: string | null
      issuedAt: Date
      expiresAt: Date
      completenessLabel: string
      modules: SicVerifiedModuleView[]
    }

function Frame({ children }: { children: ReactNode }) {
  return (
    <article className="relative mx-auto max-w-[42rem] border-[2.4px] border-sic-navy bg-sic-paper p-1 shadow-[0_18px_50px_-24px_rgba(15,43,94,0.45)]">
      <div className="relative overflow-hidden border border-sic-gold px-5 pb-7 pt-0 sm:px-8 sm:pb-8">
        <span className="pointer-events-none absolute left-1.5 top-1.5">
          <CornerFlourish corner="tl" />
        </span>
        <span className="pointer-events-none absolute right-1.5 top-1.5">
          <CornerFlourish corner="tr" />
        </span>
        <span className="pointer-events-none absolute bottom-1.5 left-1.5">
          <CornerFlourish corner="bl" />
        </span>
        <span className="pointer-events-none absolute bottom-1.5 right-1.5">
          <CornerFlourish corner="br" />
        </span>
        {children}
      </div>
    </article>
  )
}

function NavyBand({
  code,
  quiet,
}: {
  code?: string
  quiet?: boolean
}) {
  return (
    <header
      className={`relative -mx-5 mt-2 flex flex-col items-center bg-sic-navy px-4 pb-4 pt-5 sm:-mx-8 sm:px-5 ${
        quiet ? 'opacity-90' : ''
      }`}
    >
      {code ?
        <p className="absolute right-3 top-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-sic-gold-light/90 sm:right-4">
          {code}
        </p>
      : null}
      <CrestWithLaurel size={quiet ? 56 : 72} />
      <p className="mt-1 font-sic-serif text-lg font-bold tracking-[0.28em] text-white sm:text-xl">
        SWISS IMMO CERT
      </p>
      <div className="mt-2 flex items-center gap-2.5">
        <span className="h-px w-8 bg-sic-gold sm:w-10" />
        <span className="text-[10px] font-semibold tracking-[0.28em] text-sic-gold-light">
          MIETER-ZERTIFIKAT
        </span>
        <span className="h-px w-8 bg-sic-gold sm:w-10" />
      </div>
      {!quiet ?
        <p className="mt-2 text-[11px] tracking-wide text-[#e8d5a3]">{SIC_CERT_TAGLINE}</p>
      : null}
    </header>
  )
}

function QuietBody({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="relative z-10 px-1 pb-4 pt-10 text-center sm:pt-12">
      <h1 className="font-sic-serif text-xl font-semibold text-sic-navy sm:text-2xl">{title}</h1>
      <div className="mt-3 flex justify-center">
        <GuillocheRule width={120} />
      </div>
      <div className="mt-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

function ValidBody(props: Extract<SicVerifyDocumentProps, { state: 'valid' }>) {
  const { certificateCode, holderName, issuedAt, expiresAt, completenessLabel, modules } = props

  return (
    <>
      <NavyBand code={certificateCode} />

      <p className="sr-only">Gültiges Zertifikat {certificateCode}</p>

      <p className="mx-auto mt-4 w-fit border border-sic-gold-light bg-sic-paper-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sic-gold-text">
        {completenessLabel}
      </p>

      <div className="mt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Ausgestellt für</p>
        <h1 className="mt-1 font-sic-serif text-2xl font-bold text-sic-navy sm:text-[1.75rem]">
          {holderName || 'Inhaber gemäss Nachweisen'}
        </h1>
        <div className="mt-2 flex justify-center">
          <GuillocheRule width={160} />
        </div>
      </div>

      <ul className="relative z-10 mt-6 divide-y divide-sic-hairline">
        {modules.map(m => (
          <li key={m.title} className="flex items-start gap-3 py-3.5">
            <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-sic-gold bg-sic-paper-soft">
              <ModuleGlyph moduleId={m.id} size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sic-navy">{m.title}</p>
              <ul className="mt-1 space-y-0.5">
                {m.lines.map(line => (
                  <li key={line} className="flex items-start gap-2 text-[13px] leading-snug text-slate-600">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-gold" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <span className="mt-0.5 flex-shrink-0 border border-sic-gold bg-sic-paper-soft px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] text-sic-gold">
              VERIFIZIERT
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap justify-between gap-4 border-t border-sic-hairline pt-4">
        <div className="flex items-center gap-2.5">
          <CalendarMark size={18} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Zertifikatsdatum</p>
            <p className="text-sm font-semibold text-sic-navy">{fmt(issuedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <CalendarMark size={18} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Gültig bis</p>
            <p className="text-sm font-semibold text-sic-navy">{fmt(expiresAt)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <Seal size={58} />
        <div className="mb-1 hidden flex-1 flex-col items-center sm:flex">
          <span className="h-px w-36 bg-sic-navy" />
          <p className="mt-1.5 text-center text-[10px] text-slate-500">
            {SIC_BRAND_NAME} · {SIC_CERT_TAGLINE}
          </p>
        </div>
        <div className="mb-0.5 max-w-[5.5rem] text-center">
          <p className="border border-sic-gold bg-sic-paper-soft px-1.5 py-2 text-[9px] font-bold uppercase leading-tight tracking-[0.08em] text-sic-gold-text">
            Online bestätigt
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-[10px] leading-relaxed text-slate-400">
        {SIC_SCOPE_NOTE} {SIC_BRAND_NAME} bestätigt die Prüfung der eingereichten Nachweise zum
        Ausstellungszeitpunkt und ersetzt keine behördliche Auskunft.
      </p>
    </>
  )
}

export function SicVerifyDocument(props: SicVerifyDocumentProps) {
  if (props.state === 'valid') {
    return (
      <Frame>
        <div
          className="pointer-events-none absolute inset-x-6 top-[42%] h-44 bg-[url('/sic/cert/backdrop-alps.png')] bg-contain bg-center bg-no-repeat opacity-[0.14]"
          aria-hidden
        />
        <ValidBody {...props} />
      </Frame>
    )
  }

  if (props.state === 'rate_limited') {
    return (
      <Frame>
        <NavyBand quiet />
        <QuietBody title="Zu viele Abfragen">
          <p>Bitte versuchen Sie es später erneut.</p>
        </QuietBody>
      </Frame>
    )
  }

  if (props.state === 'unknown') {
    return (
      <Frame>
        <NavyBand quiet code={props.code || undefined} />
        <QuietBody title="Kein Zertifikat gefunden">
          <p>
            Der Code{' '}
            <span className="font-mono font-semibold text-sic-navy">{props.code || '—'}</span> ist
            unbekannt.
          </p>
        </QuietBody>
      </Frame>
    )
  }

  return (
    <Frame>
      <NavyBand quiet />
      <QuietBody title="Kein gültiges Zertifikat">
        <p>
          Zu diesem Code liegt derzeit kein gültiges Zertifikat vor. Es ist abgelaufen, widerrufen
          oder noch nicht ausgestellt.
        </p>
      </QuietBody>
    </Frame>
  )
}
