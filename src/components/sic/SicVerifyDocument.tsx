import { DocumentRule, HouseMark, ModuleGlyph } from '@/lib/sic/cert/art-web'
import { SIC_CERT_TAGLINE, SIC_COLORS } from '@/lib/sic/brand'
import { SIC_BRAND_NAME, SIC_ISSUER_LINE } from '@/lib/sic/config'
import type { SicVerifiedModuleView } from '@/lib/sic/dossier'
import {
  isSicCertificateSealReady,
  SIC_CERT_DOCUMENT_TITLE,
  SIC_MODULE_BADGE,
  SIC_PLAUSIBILITY_FOOTER,
  SIC_SCOPE_NOTE,
  SIC_WORKING_DOC_TAGLINE,
  SIC_WORKING_DOC_TITLE,
  SIC_WORKING_NOTICE,
  SIC_WORKING_PLAUSIBILITY_FOOTER,
  SIC_WORKING_SCOPE_NOTE,
  type SicDocumentPresentation,
} from '@/lib/sic/modules'
import { sicReplacedCertificateCopy } from '@/lib/sic/codes'
import type { ReactNode } from 'react'

function fmt(d: Date): string {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
      Swiss <span style={{ color: SIC_COLORS.red }}>Immo</span> Cert
    </p>
  )
}

function NavyBand({
  code,
  quiet,
  presentation = 'certificate',
}: {
  code?: string
  quiet?: boolean
  presentation?: SicDocumentPresentation
}) {
  const isCertificate = presentation === 'certificate'
  return (
    <header
      className={`relative flex flex-col items-center bg-sic-navy px-5 pb-5 pt-6 sm:px-8 ${
        quiet ? 'opacity-90' : ''
      }`}
    >
      {code ?
        <p
          className={`mb-2 font-mono text-[9px] font-semibold tracking-[0.08em] sm:absolute sm:right-4 sm:top-3 sm:mb-0 sm:text-[10px] sm:tracking-[0.12em] ${
            isCertificate ? 'text-sic-gold-light/90' : 'text-white/55'
          }`}
        >
          {code}
        </p>
      : null}
      <HouseMark size={quiet ? 36 : 42} onDark />
      <span className="sr-only">{SIC_BRAND_NAME}</span>
      <Wordmark className="mt-2 text-base font-bold tracking-tight text-white sm:text-lg" />
      <div className="mt-2.5 flex items-center gap-2.5">
        <span className={`h-px w-7 ${isCertificate ? 'bg-sic-gold' : 'bg-white/35'}`} />
        <span
          className={`text-[10px] font-semibold tracking-[0.24em] ${
            isCertificate ? 'text-sic-gold-light' : 'text-white/80'
          }`}
        >
          {isCertificate ? SIC_CERT_DOCUMENT_TITLE : SIC_WORKING_DOC_TITLE}
        </span>
        <span className={`h-px w-7 ${isCertificate ? 'bg-sic-gold' : 'bg-white/35'}`} />
      </div>
      {!quiet ?
        <p
          className={`mt-2 text-[11px] tracking-wide ${
            isCertificate ? 'text-[#e8d5a3]' : 'text-white/70'
          }`}
        >
          {isCertificate ? SIC_CERT_TAGLINE : SIC_WORKING_DOC_TAGLINE}
        </p>
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
  const isCertificate = presentation === 'certificate'
  const scopeNote = isCertificate ? SIC_SCOPE_NOTE : SIC_WORKING_SCOPE_NOTE

  return (
    <>
      <NavyBand code={certificateCode} presentation={presentation} />

      <p className="sr-only">
        {isCertificate ? `Gültiges Zertifikat ${certificateCode}` : `Stand der Prüfung ${certificateCode}`}
      </p>

      <div className="px-4 pb-8 pt-5 sm:px-8">
        {isCertificate ? null : (
          <p className="mb-4 rounded-lg border border-sic-hairline bg-sic-paper-soft px-3 py-2.5 text-center text-[11px] leading-relaxed text-sic-navy">
            {SIC_WORKING_NOTICE}
          </p>
        )}
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
          {modules.map(m => (
            <li key={m.title} className="flex items-start gap-3 py-3.5">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-sic-navy bg-sic-paper-soft">
                <ModuleGlyph moduleId={m.id} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-sic-navy">{m.title}</p>
                <ul className="mt-1 space-y-0.5">
                  {m.lines.map(line => (
                    <li key={line} className="flex items-start gap-2 text-[13px] leading-snug text-slate-600">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-navy" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="mt-0.5 hidden flex-shrink-0 text-[9px] font-bold tracking-[0.12em] text-sic-navy min-[400px]:inline">
                {SIC_MODULE_BADGE}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap justify-between gap-4 border-t border-sic-hairline pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
              {isCertificate ? 'Zertifikatsdatum' : 'Prüfdatum'}
            </p>
            <p className="text-sm font-semibold text-sic-navy">{fmt(issuedAt)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Gültig bis</p>
            <p className="text-sm font-semibold text-sic-navy">{fmt(expiresAt)}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold text-sic-navy">{SIC_ISSUER_LINE}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{fmt(issuedAt)}</p>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
          {scopeNote} {isCertificate ? SIC_PLAUSIBILITY_FOOTER : SIC_WORKING_PLAUSIBILITY_FOOTER}
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
        <QuietBody title="Widerrufen">
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
        <QuietBody title="Abgelaufen">
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
