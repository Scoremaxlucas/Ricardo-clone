import { authOptions } from '@/lib/auth'
import { CertificatePdfDocument } from '@/lib/certificate/CertificatePDF'
import { certificateVerifyQrDataUrl } from '@/lib/certificate/qrDataUrl'
import { employmentSummaryDe, incomeCategoryMonthlyLabelDe } from '@/lib/tenant-profile/labels'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { prisma } from '@/lib/prisma'
import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'

export const dynamic = 'force-dynamic'

function normalizeCode(raw: string): string {
  return decodeURIComponent(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })
  }

  const { code: raw } = await ctx.params
  const certificateCode = normalizeCode(raw)

  const certificate = await prisma.helvendaCertificate.findUnique({
    where: { certificateCode },
    include: {
      tenantProfile: {
        select: { creditCheckResult: true },
      },
    },
  })

  if (!certificate || certificate.userId !== userId) {
    return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  }

  if (certificate.status !== 'ACTIVE') {
    return NextResponse.json({ message: 'Zertifikat nicht aktiv' }, { status: 403 })
  }

  const verifyUrl = `${WOHNEN_SITE_ORIGIN}/verify/${certificate.certificateCode}`
  let qrDataUrl = ''
  try {
    qrDataUrl = await certificateVerifyQrDataUrl(verifyUrl)
  } catch (e) {
    console.error('[certificate/pdf] QR', e)
  }

  const employmentLine = employmentSummaryDe(
    certificate.verifiedEmploymentStatus as EmploymentStatus,
    certificate.verifiedEmployer,
    null,
    null
  )
  const incomeLabel = incomeCategoryMonthlyLabelDe(certificate.verifiedIncomeCategory as IncomeCategory)

  const resolvedCanton = (() => {
    const stored = certificate.verifiedCreditCheckCanton
    const storedTrim = (stored || '').trim()
    if (storedTrim && storedTrim !== 'CH' && storedTrim !== '' && storedTrim.length === 2) {
      return storedTrim
    }
    const result = certificate.tenantProfile?.creditCheckResult as Record<string, string> | null
    const fromProfile = result?.canton?.trim()
    if (fromProfile && fromProfile !== 'CH' && fromProfile.length === 2) {
      return fromProfile
    }
    return null
  })()

  const doc = (
    <CertificatePdfDocument
      certificateCode={certificate.certificateCode}
      issuedAt={certificate.issuedAt}
      expiresAt={certificate.expiresAt}
      firstName={certificate.verifiedFirstName}
      lastName={certificate.verifiedLastName}
      address={certificate.verifiedAddress}
      zip={certificate.verifiedZip}
      city={certificate.verifiedCity}
      employmentLine={employmentLine}
      incomeLabel={incomeLabel}
      incomeQualifiesUpTo={certificate.incomeQualifiesUpTo}
      creditStatus={certificate.verifiedCreditCheckStatus as 'CLEAR' | 'ENTRIES_PRESENT'}
      creditCheckDate={certificate.verifiedCreditCheckDate}
      verifiedCreditCheckCanton={certificate.verifiedCreditCheckCanton}
      creditCheckResultJson={certificate.tenantProfile?.creditCheckResult ?? null}
      canton={resolvedCanton}
      verifyUrl={verifyUrl}
      qrDataUrl={qrDataUrl}
      year={new Date().getFullYear()}
    />
  )

  try {
    const buffer = await renderToBuffer(doc)
    const safeLast = certificate.verifiedLastName.replace(/[^\w\-äöüÄÖÜß]/gi, '_').slice(0, 40)
    const filename = `Helvenda-Zertifikat-${safeLast}-${certificate.certificateCode}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (e) {
    console.error('[certificate/pdf]', e)
    return NextResponse.json({ message: 'PDF-Erstellung fehlgeschlagen' }, { status: 500 })
  }
}
