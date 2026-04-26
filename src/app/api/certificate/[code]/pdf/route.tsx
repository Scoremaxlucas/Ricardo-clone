import { authOptions } from '@/lib/auth'
import { CertificatePdfDocument } from '@/lib/certificate/CertificatePDF'
import { certificateVerifyQrDataUrl } from '@/lib/certificate/qrDataUrl'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
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

  const row = await prisma.helvendaCertificate.findUnique({
    where: { certificateCode },
  })

  if (!row || row.userId !== userId) {
    return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  }

  if (row.status !== 'ACTIVE') {
    return NextResponse.json({ message: 'Zertifikat nicht aktiv' }, { status: 403 })
  }

  const verifyUrl = `${WOHNEN_SITE_ORIGIN}/verify/${row.certificateCode}`
  let qrDataUrl = ''
  try {
    qrDataUrl = await certificateVerifyQrDataUrl(verifyUrl)
  } catch (e) {
    console.error('[certificate/pdf] QR', e)
  }

  const employmentLine = employmentSummaryDe(
    row.verifiedEmploymentStatus as EmploymentStatus,
    row.verifiedEmployer,
    null,
    null
  )
  const incomeLabel = incomeCategoryLabelDe(row.verifiedIncomeCategory as IncomeCategory)

  const doc = (
    <CertificatePdfDocument
      certificateCode={row.certificateCode}
      issuedAt={row.issuedAt}
      expiresAt={row.expiresAt}
      firstName={row.verifiedFirstName}
      lastName={row.verifiedLastName}
      address={row.verifiedAddress}
      zip={row.verifiedZip}
      city={row.verifiedCity}
      employmentLine={employmentLine}
      incomeLabel={incomeLabel}
      incomeQualifiesUpTo={row.incomeQualifiesUpTo}
      creditStatus={row.verifiedCreditCheckStatus as 'CLEAR' | 'ENTRIES_PRESENT'}
      creditCheckDate={row.verifiedCreditCheckDate}
      creditCanton={row.verifiedCreditCheckCanton}
      verifyUrl={verifyUrl}
      qrDataUrl={qrDataUrl}
      year={new Date().getFullYear()}
    />
  )

  try {
    const buffer = await renderToBuffer(doc)
    const safeLast = row.verifiedLastName.replace(/[^\w\-äöüÄÖÜß]/gi, '_').slice(0, 40)
    const filename = `Helvenda-Zertifikat-${safeLast}-${row.certificateCode}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('[certificate/pdf]', e)
    return NextResponse.json({ message: 'PDF-Erstellung fehlgeschlagen' }, { status: 500 })
  }
}
