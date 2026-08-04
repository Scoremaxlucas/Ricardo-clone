import { prisma } from '@/lib/prisma'
import { certificateVerifyQrDataUrl } from '@/lib/certificate/qrDataUrl'
import { SicCertificatePdfDocument } from '@/lib/sic/CertificatePdf'
import { sicVerifyUrl } from '@/lib/sic/config'
import { joinHolderName, verifiedModuleLineItems } from '@/lib/sic/dossier'
import { normalizeSicCertificateCode } from '@/lib/sic/certificate-code'
import { getSicSession } from '@/lib/sic/session-cookie'
import { renderToBuffer } from '@react-pdf/renderer'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const session = getSicSession()
  if (!session) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })

  const { code: raw } = await ctx.params
  const certificateCode = normalizeSicCertificateCode(raw)

  const cert = await prisma.sicCertificate.findUnique({
    where: { certificateCode },
    include: { modules: { select: { moduleKind: true, status: true } } },
  })
  if (!cert || cert.email !== session.email) {
    return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  }

  const hasVerified = cert.modules.some(m => m.status === 'VERIFIED')
  if (!hasVerified) {
    return NextResponse.json(
      {
        message:
          'Das Zertifikat ist erst abrufbar, sobald mindestens ein Modul verifiziert ist.',
      },
      { status: 403 }
    )
  }

  const verifyUrl = sicVerifyUrl(cert.certificateCode)
  let qrDataUrl = ''
  try {
    qrDataUrl = await certificateVerifyQrDataUrl(verifyUrl)
  } catch (e) {
    console.error('[sic/pdf] QR', e)
  }

  const doc = (
    <SicCertificatePdfDocument
      certificateCode={cert.certificateCode}
      holderName={joinHolderName(cert.holderFirstName, cert.holderLastName)}
      email={cert.email}
      issuedAt={cert.issuedAt}
      expiresAt={cert.expiresAt}
      verifiedModules={verifiedModuleLineItems(cert.modules)}
      verifyUrl={verifyUrl}
      qrDataUrl={qrDataUrl}
    />
  )

  try {
    const buffer = await renderToBuffer(doc)
    const filename = `SwissImmoCert-${cert.certificateCode}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    })
  } catch (e) {
    console.error('[sic/pdf]', e)
    return NextResponse.json({ message: 'PDF-Erstellung fehlgeschlagen' }, { status: 500 })
  }
}
