/**
 * Löscht SIC-Zertifikat, Zahlungen und Magic-Links für eine E-Mail,
 * damit dieselbe Adresse neu starten kann.
 *
 *   npx tsx scripts/reset-sic-certificate-email.ts lucasrodrigues@gafner.com
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })
if (process.env.SIC_RESET_USE_PRODUCTION === '1') {
  config({ path: resolve(process.cwd(), '.env.production.local'), override: true })
  config({ path: resolve(process.cwd(), '.env.production'), override: true })
}

async function main() {
  const { prisma } = await import('../src/lib/prisma')
  const { normalizeEmail } = await import('../src/lib/sic/session')

  const raw = process.argv[2]
  if (!raw) {
    console.error('Usage: npx tsx scripts/reset-sic-certificate-email.ts <email>')
    process.exit(1)
  }
  const email = normalizeEmail(raw)

  const cert = await prisma.sicCertificate.findUnique({
    where: { email },
    include: { documents: { select: { id: true, blobUrl: true } } },
  })

  const payments = await prisma.sicPayment.deleteMany({ where: { email } })
  const links = await prisma.sicMagicLink.deleteMany({ where: { email } })

  let certificateDeleted = false
  if (cert) {
    await prisma.sicCertificate.delete({ where: { id: cert.id } })
    certificateDeleted = true
  }

  console.log(
    JSON.stringify(
      {
        email,
        certificateDeleted,
        documentsWere: cert?.documents.length ?? 0,
        paymentsDeleted: payments.count,
        magicLinksDeleted: links.count,
      },
      null,
      2
    )
  )

  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
