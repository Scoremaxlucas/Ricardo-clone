'use client'

import { SicVerifyDocument } from '@/components/sic/SicVerifyDocument'
import { previewSicVerifiedModules } from '@/lib/sic/dossier'
import { normalizeSicFacts, type SicFacts } from '@/lib/sic/facts'
import { sicCompletenessLabel, type SicModuleId } from '@/lib/sic/modules'
import { sicValidityExpiresAt } from '@/lib/sic/validity'

export function SicAdminReviewPreview({
  certificateCode,
  holderName,
  certifiedAt,
  expiresAt,
  modules,
  draftModuleId,
  draftFacts,
}: {
  certificateCode: string
  holderName: string | null
  certifiedAt: string | null
  expiresAt: string | null
  modules: { moduleKind: string; status: string; verifiedFacts: SicFacts | null }[]
  draftModuleId: SicModuleId
  draftFacts: SicFacts
}) {
  const previewModules = previewSicVerifiedModules(modules, {
    moduleKind: draftModuleId,
    facts: draftFacts,
  })
  const issuedAt = certifiedAt ? new Date(certifiedAt) : new Date()
  const validUntil = expiresAt ? new Date(expiresAt) : sicValidityExpiresAt(issuedAt)
  const parsed = normalizeSicFacts(draftModuleId, draftFacts)
  const gaps =
    parsed.ok ? [] : [...parsed.missing.map(l => `${l} fehlt`), ...parsed.invalid.map(l => `${l} ist ungültig`)]

  return (
    <div className="mt-4 rounded-xl border border-dashed border-sic-navy/25 bg-sic-paper px-3 pb-4 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sic-navy">
        Vorschau für den Vermieter — nach Freigabe dieser Angabe
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Dieselbe Urkunde wie auf der QR-Seite und im PDF. Andere noch offene Angaben stehen nicht
        drauf.
      </p>
      {!holderName ?
        <p className="mt-2 text-[11px] font-medium text-sic-pending-text">
          Ohne Namen gibt es kein PDF und keine öffentliche Prüfseite. Die Zeilen unten gelten trotzdem.
        </p>
      : null}
      {gaps.length > 0 ?
        <p className="mt-2 text-[11px] font-medium text-sic-pending-text">
          Noch unvollständig: {gaps.join(', ')}.
        </p>
      : null}
      <div className="mt-3">
        <SicVerifyDocument
          state="valid"
          certificateCode={certificateCode}
          holderName={holderName}
          issuedAt={issuedAt}
          expiresAt={validUntil}
          completenessLabel={sicCompletenessLabel(previewModules.length)}
          modules={previewModules}
        />
      </div>
    </div>
  )
}
