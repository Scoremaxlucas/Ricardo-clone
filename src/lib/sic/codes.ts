import { prisma } from '@/lib/prisma'
import { generateSicCertificateCode } from '@/lib/sic/certificate-code'

const ALLOCATE_ATTEMPTS = 8

function formatReplacedAt(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

/** Copy on the verify page for a retired QR — no name, no new code. */
export function sicReplacedCertificateCopy(replacedAt: Date): { title: string; lead: string; follow: string } {
  return {
    title: 'Ersetzt',
    lead: `Dieses Zertifikat wurde am ${formatReplacedAt(replacedAt)} durch einen neuen Code ersetzt.`,
    follow:
      'Angaben und der neue Code stehen hier nicht. Bitte den aktuellen Stand beim Bewerber anfordern.',
  }
}

export async function sicCertificateCodeIsAssigned(code: string): Promise<boolean> {
  const [live, retired] = await Promise.all([
    prisma.sicCertificate.findUnique({ where: { certificateCode: code }, select: { id: true } }),
    prisma.sicRetiredCertificateCode.findUnique({ where: { certificateCode: code }, select: { id: true } }),
  ])
  return Boolean(live || retired)
}

export async function allocateUniqueSicCertificateCode(): Promise<string> {
  for (let i = 0; i < ALLOCATE_ATTEMPTS; i++) {
    const code = generateSicCertificateCode()
    if (!(await sicCertificateCodeIsAssigned(code))) return code
  }
  throw new Error('Konnte keinen eindeutigen Zertifikatscode erzeugen')
}

export async function findSicRetiredCertificateCode(
  code: string
): Promise<{ certificateCode: string; replacedAt: Date } | null> {
  const row = await prisma.sicRetiredCertificateCode.findUnique({
    where: { certificateCode: code },
    select: { certificateCode: true, replacedAt: true },
  })
  return row
}

/**
 * Entwertet den aktuellen Code und setzt einen neuen. In einer Transaktion,
 * damit der alte Code nicht stumm verschwindet.
 */
export async function retireAndReplaceSicCertificateCode(certificateId: string): Promise<string> {
  for (let attempt = 0; attempt < ALLOCATE_ATTEMPTS; attempt++) {
    const cert = await prisma.sicCertificate.findUnique({
      where: { id: certificateId },
      select: { certificateCode: true },
    })
    if (!cert) {
      throw new Error('Kein Zertifikat gefunden')
    }
    const next = await allocateUniqueSicCertificateCode()
    try {
      await prisma.$transaction([
        prisma.sicRetiredCertificateCode.create({
          data: {
            certificateId,
            certificateCode: cert.certificateCode,
          },
        }),
        prisma.sicCertificate.update({
          where: { id: certificateId },
          data: { certificateCode: next },
        }),
      ])
      return next
    } catch {
      // Kollision — nächster Versuch.
    }
  }
  throw new Error('Neuer Code konnte nicht erzeugt werden')
}
