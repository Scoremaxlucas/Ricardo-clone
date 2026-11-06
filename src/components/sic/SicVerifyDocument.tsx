import { CertSeal, DocumentRule, HouseMark, ModuleGlyph } from '@/lib/sic/cert/art-web'
import { SIC_CERT_TAGLINE, SIC_COLORS } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_ISSUER_LINE } from '@/lib/sic/config'
import type { SicVerifiedModuleView } from '@/lib/sic/dossier'
import {
  isSicCertificateSealReady,
  SIC_CERT_DOCUMENT_TITLE,
  SIC_DECLARED_BADGE,
  SIC_MODULE_BADGE,
  SIC_PLAUSIBILITY_FOOTER,
  SIC_MODULES,
  SIC_SCOPE_NOTE,
  SIC_UNCHECKED_LINE,
  type SicDocumentPresentation,
} from '@/lib/sic/modules'
import { sicReplacedCertificateCopy } from '@/lib/sic/codes'
import { SIC_VERIFY_STATE_TITLES } from '@/lib/sic/landlord-explainer'
import type { ReactNode } from 'react'
import { sicSwissDate } from '@/lib/sic/validity'

function fmt(d: Date): string {
  return sicSwissDate(d)
}

type QuietState = 'rate_limited' | 'unknown' | 'not_ready' | 'revoked' | 'expired' | 'replaced'

export type SicVerifyDocumentProps =
  | { state: Exclude<QuietState, 'replaced'>; code?: string }
  | { state: 'replaced'; code?: string; replacedAt: Date }
  | {
      state: 'valid'
      certificateCode: string
      holderName: string | null
      issuedAt: Date
      expiresAt: Date
      completenessLabel: string
      modules: SicVerifiedModuleView[]
      presentation?: SicDocumentPresentation
    }

function Frame({ children }: { children: ReactNode }) {
  return (
    <article className="relative mx-auto w-full min-w-0 max-w-[42rem] overflow-x-clip border border-sic-navy bg-sic-paper shadow-[0_18px_50px_-24px_rgba(15,43,94,0.35)]">
      <div className="overflow-hidden">{children}</div>
    </article>
  )
}

function Wordmark({ className }: { className?: string }) {
  return (
    <p className={className}>
      Swiss <span style={{ color: SIC_COLORS.redOnDark }}>Immo</span> Cert
    </p>
  )
}

function NavyBand({ code, quiet }: { code?: string; quiet?: boolean }) {
  return (
    <header
      className={`relative flex flex-col items-center bg-sic-navy px-5 pb-5 pt-6 sm:px-8 ${
        quiet ? 'opacity-90' : ''
      }`}
    >
      {code ?
        <p
          className="mb-2 font-mono text-[9px] font-semibold tracking-[0.08em] text-sic-gold-light/90 sm:absolute sm:right-4 sm:top-3 sm:mb-0 sm:text-[10px] sm:tracking-[0.12em]"
        >
          {code}
        </p>
      : null}
      <HouseMark size={quiet ? 36 : 42} onDark />
      <span className="sr-only">{SIC_BRAND_NAME}</span>
      <Wordmark className="mt-2 text-base font-bold tracking-tight text-white sm:text-lg" />
      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="h-px w-7 bg-sic-gold" />
        <span className="text-[10px] font-semibold tracking-[0.24em] text-sic-gold-light">
          {SIC_CERT_DOCUMENT_TITLE}
        </span>
        <span className="h-px w-7 bg-sic-gold" />
      </div>
      {!quiet ?
        <p className="mt-2 text-[11px] tracking-wide text-[#e8d5a3]">{SIC_CERT_TAGLINE}</p>
      : null}
    </header>
  )
}

function ModuleLines({ lines, className = '' }: { lines: string[]; className?: string }) {
  return (
    <ul className={`space-y-0.5 ${className}`}>
      {lines.map(line => (
        <li key={line} className="flex items-start gap-2 text-[13px] leading-snug text-slate-600">
          <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-navy" />
          {line}
        </li>
      ))}
    </ul>
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
    <div className="px-4 pb-8 pt-10 text-center sm:px-8 sm:pt-12">
      <h1 className="text-xl font-semibold text-sic-navy sm:text-2xl">{title}</h1>
      <div className="mt-3 flex justify-center">
        <DocumentRule width={120} />
      </div>
      <div className="mt-4 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

function ValidBody(props: Extract<SicVerifyDocumentProps, { state: 'valid' }>) {
  const { certificateCode, holderName, issuedAt, expiresAt, completenessLabel, modules } = props
  const presentation =
    props.presentation ??
    (isSicCertificateSealReady(modules.map(m => m.id)) ? 'certificate' : 'working')
  // Mit oder ohne Siegel: ein gültiges Mieter-Zertifikat. Das Siegel zeichnet Betreibung + Ausweis aus.
  const sealed = presentation === 'certificate'
  const shownIds = new Set(modules.map(m => m.id))
  const unchecked = SIC_MODULES.filter(def => !shownIds.has(def.id))

  return (
    <>
      <NavyBand code={certificateCode} />

      <p className="sr-only">{`Gültiges Zertifikat ${certificateCode}`}</p>

      <div className="px-4 pb-8 pt-5 sm:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-sic-navy">
          {completenessLabel}
        </p>

        <div className="mt-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Ausgestellt für</p>
          <h1 className="mt-1 break-words px-1 text-xl font-bold text-sic-navy sm:text-2xl">
            {holderName || 'Inhaber gemäss Nachweisen'}
          </h1>
          <div className="mt-2 flex justify-center">
            <DocumentRule width={140} />
          </div>
        </div>

        <ul className="mt-5 divide-y divide-sic-hairline">
          {modules.map(m => {
            const badge = m.badge ?? SIC_MODULE_BADGE
            const people = (m.groups ?? []).filter(g => g.label)
            const shared = (m.groups ?? []).filter(g => !g.label).flatMap(g => g.lines)
            return (
              <li key={m.title} className="flex items-start gap-3 py-3.5">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-sic-navy bg-sic-paper-soft">
                  <ModuleGlyph moduleId={m.id} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-sic-navy">{m.title}</p>
                  {people.length > 0 ?
                    <>
                      <div className="mt-1 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                        {people.map(g => (
                          <div key={g.label} className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-500">{g.label}</p>
                            <ModuleLines lines={g.lines} />
                          </div>
                        ))}
                      </div>
                      {shared.length > 0 ? <ModuleLines lines={shared} className="mt-2" /> : null}
                    </>
                  : <ModuleLines lines={m.lines} className="mt-1" />}
                </div>
                <span
                  className={`mt-0.5 hidden flex-shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] min-[400px]:inline ${
                    badge === SIC_DECLARED_BADGE ? 'border-dashed border-slate-400 text-slate-500' : 'border-sic-navy text-sic-navy'
                  }`}
                >
                  {badge}
                </span>
              </li>
            )
          })}
          {unchecked.map(def => (
            <li key={def.id} className="flex items-start gap-3 py-3.5">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 opacity-60">
                <ModuleGlyph moduleId={def.id} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-500">{def.title}</p>
                <p className="mt-1 text-[13px] leading-snug text-slate-500">{SIC_UNCHECKED_LINE}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap justify-between gap-4 border-t border-sic-hairline pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Zertifikatsdatum</p>
            <p className="text-sm font-semibold text-sic-navy">{fmt(issuedAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Gültig bis</p>
            <p className="text-sm font-semibold text-sic-navy">{fmt(expiresAt)}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          {sealed ? <CertSeal size={108} year={String(issuedAt.getFullYear())} /> : null}
          <div>
            <p className="text-[11px] font-semibold text-sic-navy">{SIC_ISSUER_LINE}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
              Gültig, solange diese Seite das Zertifikat als gültig ausweist.
            </p>
          </div>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
          {SIC_SCOPE_NOTE} {SIC_PLAUSIBILITY_FOOTER}
        </p>
      </div>
    </>
  )
}

export function SicVerifyDocument(props: SicVerifyDocumentProps) {
  if (props.state === 'valid') {
    return (
      <Frame>
        <ValidBody {...props} />
      </Frame>
    )
  }

  if (props.state === 'rate_limited') {
    return (
      <Frame>
        <NavyBand quiet />
        <QuietBody title="Zu viele Abfragen">
          <p>Bitte versuche es später erneut.</p>
        </QuietBody>
      </Frame>
    )
  }

  if (props.state === 'unknown') {
    return (
      <Frame>
        <NavyBand quiet code={props.code || undefined} />
        <QuietBody title={SIC_VERIFY_STATE_TITLES.unknown}>
          <p>
            Der Code{' '}
            <span className="font-mono font-semibold text-sic-navy">{props.code || '—'}</span> ist
            unbekannt.
          </p>
        </QuietBody>
      </Frame>
    )
  }

  if (props.state === 'replaced') {
    const copy = sicReplacedCertificateCopy(props.replacedAt)
    return (
      <Frame>
        <NavyBand quiet code={props.code || undefined} />
        <QuietBody title={copy.title}>
          <p>{copy.lead}</p>
          <p className="mt-3">{copy.follow}</p>
        </QuietBody>
      </Frame>
    )
  }

  if (props.state === 'revoked') {
    return (
      <Frame>
        <NavyBand quiet code={props.code || undefined} />
        <QuietBody title={SIC_VERIFY_STATE_TITLES.revoked}>
          <p>
            Dieses Zertifikat wurde widerrufen. Der Code{' '}
            <span className="font-mono font-semibold text-sic-navy">{props.code || '—'}</span> ist
            nicht mehr gültig.
          </p>
        </QuietBody>
      </Frame>
    )
  }

  if (props.state === 'expired') {
    return (
      <Frame>
        <NavyBand quiet code={props.code || undefined} />
        <QuietBody title={SIC_VERIFY_STATE_TITLES.expired}>
          <p>
            Die Gültigkeit dieses Zertifikats ist abgelaufen. Der Code{' '}
            <span className="font-mono font-semibold text-sic-navy">{props.code || '—'}</span> weist
            keine Angaben mehr aus.
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
          Zu diesem Code liegt derzeit kein gültiges Zertifikat vor. Es ist noch nicht ausgestellt
          oder der Name fehlt.
        </p>
      </QuietBody>
    </Frame>
  )
}
