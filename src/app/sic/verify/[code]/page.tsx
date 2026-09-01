import { SicVerifyDocument } from '@/components/sic/SicVerifyDocument'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { isValidSicCertificateCode, normalizeSicCertificateCode } from '@/lib/sic/certificate-code'
import { SIC_BRAND_NAME } from '@/lib/sic/config'
import { isSicLandlordPdfReady, joinHolderName, verifiedModuleLineItems } from '@/lib/sic/dossier'
import { recordSicVerifyScan } from '@/lib/sic/events'
import { sicCompletenessLabel } from '@/lib/sic/modules'
import { getSicSession } from '@/lib/sic/session-cookie'
import { isSicExpired } from '@/lib/sic/validity'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Zertifikat prüfen',
  robots: { index: false, follow: false },
}

function clientIp(): string {
  const h = headers()
  return (h.get('x-forwarded-for')?.split(',')[0] || '').trim() || 'unknown'
}

function VerifyShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <p className="mb-6 text-center text-[11px] uppercase tracking-[0.22em] text-sic-navy/45">
        {SIC_BRAND_NAME} · Online-Verifikation
      </p>
      {children}
    </div>
  )
}

export default async function SicVerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = normalizeSicCertificateCode(raw)
  const ip = clientIp()

  const rl = await checkRateLimit({ identifier: `sic-verify:${ip}`, limit: 60, window: 3600 })
  if (!rl.allowed) {
    return (
      <VerifyShell>
        <SicVerifyDocument state="rate_limited" />
      </VerifyShell>
    )
  }

  const cert =
    isValidSicCertificateCode(code) ?
      await prisma.sicCertificate.findUnique({
        where: { certificateCode: code },
        include: { modules: { select: { moduleKind: true, status: true, verifiedFacts: true } } },
      })
    : null

  const holderName = cert ? joinHolderName(cert.holderFirstName, cert.holderLastName) : null
  const landlordReady =
    !!cert &&
    isSicLandlordPdfReady({
      holderName,
      status: cert.status,
      expiresAt: cert.expiresAt,
      modules: cert.modules,
    })
  const verifiedModules = cert && landlordReady ? verifiedModuleLineItems(cert.modules) : []

  if (cert && landlordReady) {
    const session = getSicSession()
    await recordSicVerifyScan({
      certificateId: cert.id,
      ip,
      byHolder: session?.email === cert.email,
    })
  }

  return (
    <VerifyShell>
      {!cert ?
        <SicVerifyDocument state="unknown" code={code} />
      : cert.status === 'REVOKED' ?
        <SicVerifyDocument state="revoked" code={cert.certificateCode} />
      : cert.status === 'EXPIRED' || isSicExpired(cert.expiresAt) ?
        <SicVerifyDocument state="expired" code={cert.certificateCode} />
      : !landlordReady ?
        <SicVerifyDocument state="not_ready" />
      : <SicVerifyDocument
          state="valid"
          certificateCode={cert.certificateCode}
          holderName={holderName}
          issuedAt={cert.certifiedAt ?? cert.issuedAt}
          expiresAt={cert.expiresAt ?? cert.issuedAt}
          completenessLabel={sicCompletenessLabel(verifiedModules.length)}
          modules={verifiedModules}
        />
      }
    </VerifyShell>
  )
}
