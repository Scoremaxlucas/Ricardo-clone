/**
 * Alle Vermieter-Lead-Mails erneut senden (inkl. WOHNEN_LEAD_EMAIL_OVERRIDE).
 *
 *   npx tsx scripts/resend-wohnen-lead-emails.ts
 *   npx tsx scripts/resend-wohnen-lead-emails.ts <applicationId> ...
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

import { prisma } from '../src/lib/prisma'
import { sendLandlordLeadNotificationForApplication } from '../src/lib/rental/sendLandlordLeadNotification'
import { getWohnenLeadEmailOverride } from '../src/lib/rental/wohnen-lead-email-override'

async function main() {
  const idsFromCli = process.argv.slice(2).filter(Boolean)
  const apps =
    idsFromCli.length > 0 ?
      await prisma.rentalApplication.findMany({
        where: { id: { in: idsFromCli } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, status: true, landlordLeadEmail: true, createdAt: true },
      })
    : await prisma.rentalApplication.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, status: true, landlordLeadEmail: true, createdAt: true },
      })

  if (apps.length === 0) {
    console.log('Keine Bewerbungen gefunden.')
    return
  }

  const override = getWohnenLeadEmailOverride()
  console.log(`\n${apps.length} Bewerbung(en). Override: ${override ?? '(keiner — echte Vermieter-Adressen)'}\n`)

  let ok = 0
  let fail = 0
  for (const app of apps) {
    const result = await sendLandlordLeadNotificationForApplication(app.id)
    if (result.ok) {
      ok++
      console.log(
        `OK  ${app.id}  status=${app.status}  → ${result.deliveredTo}${result.isOverride ? ` (Ziel Inserat: ${result.intendedTo})` : ''}`,
      )
    } else {
      fail++
      console.error(`FAIL ${app.id}  status=${app.status}  ${result.message}`)
    }
  }

  console.log(`\nFertig: ${ok} gesendet, ${fail} fehlgeschlagen.\n`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
