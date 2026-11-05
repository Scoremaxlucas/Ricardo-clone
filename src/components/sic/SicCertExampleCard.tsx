import { SIC_CERT_TAGLINE, SIC_COLORS } from '@/lib/sic/brand'
import { CertSeal, DocumentRule, HouseMark, ModuleGlyph } from '@/lib/sic/cert/art-web'
import { SIC_ISSUER_LINE } from '@/lib/sic/config'
import { sicCatalogPreviewRows } from '@/lib/sic/facts'
import {
  getSicModule,
  isSicCertificateSealReady,
  SIC_CERT_DOCUMENT_TITLE,
  SIC_MODULE_BADGE,
  SIC_UNCHECKED_LINE,
  sicCompletenessLabel,
  type SicModuleId,
} from '@/lib/sic/modules'

/** Beispiel wie auf dem PDF — Zeilen aus denselben Bändern und der 3×-Regel. */
const CERT_PREVIEW = sicCatalogPreviewRows()

/**
 * Beispiel-Zertifikat für Landing und Vermieter-Seite.
 * `uncheckedIds` zeigt Angaben neutral als «Nicht Teil dieses Zertifikats» —
 * so sieht ein Zertifikat aus, auf dem nicht alles geprüft ist.
 */
export function SicCertExampleCard({
  uncheckedIds = [],
  showAllLines = false,
}: {
  uncheckedIds?: readonly SicModuleId[]
  /** Alle Zeilen auch auf schmalen Bildschirmen (Standard: dort nur die erste). */
  showAllLines?: boolean
}) {
  const unchecked = new Set<SicModuleId>(uncheckedIds)
  const checkedRows = CERT_PREVIEW.filter(row => !unchecked.has(row.id))
  const uncheckedRows = CERT_PREVIEW.filter(row => unchecked.has(row.id))
  const sealed = isSicCertificateSealReady(checkedRows.map(row => row.id))

  return (
    <div className="relative min-w-0">
      <span className="absolute right-3 top-3 z-20 rounded-full bg-sic-navy-deep/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
        Beispiel
      </span>
      <article className="relative overflow-hidden border border-sic-navy bg-sic-paper shadow-xl shadow-black/25">
        <header className="relative flex flex-col items-center bg-sic-navy px-4 pb-3.5 pt-5">
          {/* Links: rechts oben sitzt die «Beispiel»-Marke, sonst überdeckt sie den Code. */}
          <p className="absolute left-3 top-2 hidden font-mono text-[9px] font-semibold tracking-[0.12em] text-sic-gold-light/90 sm:block">
            SIC-2026-BEISPIEL
          </p>
          <HouseMark size={36} onDark />
          <p className="mt-1.5 text-sm font-bold tracking-tight text-white">
            Swiss <span style={{ color: SIC_COLORS.red }}>Immo</span> Cert
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px w-6 bg-sic-gold" />
            <span className="text-[9px] font-semibold tracking-[0.24em] text-sic-gold-light">
              {SIC_CERT_DOCUMENT_TITLE}
            </span>
            <span className="h-px w-6 bg-sic-gold" />
          </div>
          <p className="mt-1.5 text-[10px] tracking-wide text-[#e8d5a3]">{SIC_CERT_TAGLINE}</p>
        </header>

        <div className="px-4 pb-4 pt-3 sm:px-5">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-sic-navy">
            {sicCompletenessLabel(checkedRows.length)}
          </p>

          <div className="mt-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Ausgestellt für</p>
            <p className="mt-0.5 text-base font-bold text-sic-navy">Beispiel · Inhaberin</p>
            <div className="mt-1.5 flex justify-center">
              <DocumentRule width={120} />
            </div>
          </div>

          <ul className="mt-3 divide-y divide-sic-hairline">
            {checkedRows.map(row => (
              <li key={row.id} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-sic-navy bg-sic-paper-soft">
                  <ModuleGlyph moduleId={row.id} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-sic-navy">{getSicModule(row.id).title}</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {row.lines.map((line, i) => (
                      <li
                        key={line}
                        className={`items-start gap-1.5 text-[11px] leading-snug text-slate-600 ${
                          i === 0 || showAllLines ? 'flex' : 'hidden sm:flex'
                        }`}
                      >
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-sic-navy" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="mt-0.5 hidden flex-shrink-0 rounded-sm border border-sic-navy px-1 py-px text-[8px] font-bold tracking-[0.1em] text-sic-navy min-[380px]:inline">
                  {SIC_MODULE_BADGE}
                </span>
              </li>
            ))}
            {uncheckedRows.map(row => (
              <li key={row.id} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 opacity-60">
                  <ModuleGlyph moduleId={row.id} size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-500">{getSicModule(row.id).title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{SIC_UNCHECKED_LINE}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t border-sic-hairline pt-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Zertifikatsdatum</p>
                <p className="text-[10px] font-semibold text-sic-navy">12.06.2026</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-[0.12em] text-slate-500">Gültig bis</p>
                <p className="text-[10px] font-semibold text-sic-navy">12.09.2026</p>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                {sealed ? <CertSeal size={56} year="2026" /> : null}
                <p className="text-[10px] font-semibold text-sic-navy">{SIC_ISSUER_LINE}</p>
              </div>
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sic/beispiel-qr.svg"
                  alt=""
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] bg-sic-paper"
                />
                <p className="mt-1 text-center text-[7px] leading-tight text-slate-500">QR-Code scannen</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
