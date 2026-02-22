/**
 * One-time import of watch-out.ch marketing contacts into Helvenda
 */
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
  console.error('DATABASE_URL must be a PostgreSQL connection string.')
  console.error('Make sure .env.local has the production DATABASE_URL.')
  process.exit(1)
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

const emails = [
  'jaggi-willi@ewsmail.ch',
  'ricardo@panameros.com',
  'martin.frischknecht388@gmail.com',
  'barcrest@gmx.ch',
  'rul@eurolinux.net',
  'yves.schuppisser@hotmail.com',
  'feublidavid1@gmail.com',
  'lalilistory@yahoo.fr',
  'm@koetter.ch',
  'thomas.stadler0@icloud.com',
  'david.serratore@outlook.com',
  'didi.schoeni@bluewin.ch',
  'adifeteemini5@gmail.com',
  'anna.sidorova1@gmail.com',
  'info@orbis.swiss',
  'boris.lisser@gmail.com',
  'lars_reinwardt@hotmail.com',
  'comtesce@gmail.com',
  'broccoli.modus@gmail.com',
  'yucca.asano@gmail.com',
  'p.ferrucci@bluewin.ch',
  'contact@watchaser.com',
  'allhandelklg@gmail.com',
  'stephen_eggenschwiler@sunrise.ch',
  'ale.erb8702@gmail.com',
  'kartheisermargarita@gmail.com',
  'morea1966@hotmail.com',
  'b.motika@bluewin.ch',
  'robypc2@hotmail.com',
  'ac.cascione@gmail.com',
  'krist.watch@gmail.com',
  'ctzioupis@gmail.com',
  'giuseppe.lofaro@bluewin.ch',
  'tony.watches@hotmail.com',
  'fischer.tom@bluewin.ch',
  'calv@gmx.ch',
  'office@mariushutmacher.com',
  'fugitif@bluewin.ch',
  'cornelia.i.kiser@gmail.com',
  'dinopetretta@bluewin.ch',
  'sebastien.picca54@gmail.com',
  'miguel-alvarez@hotmail.fr',
  'armaniswiss@yahoo.com',
  'mina@letzihof.ch',
  'freeskidave@gmail.com',
  'sylr.personal@gmail.com',
  'ismael.zemp@gmail.com',
  'andreas.stampfli@gmail.com',
  'dalianas@hotmail.com',
]

async function main() {
  console.log(`Importing ${emails.length} contacts from watch-out.ch...\n`)

  let created = 0
  let updated = 0
  let errors = 0

  for (const email of emails) {
    try {
      const existing = await prisma.marketingContact.findUnique({ where: { email: email.toLowerCase() } })
      if (existing) {
        const existingTags: string[] = (() => {
          try { return JSON.parse(existing.tags) } catch { return [] }
        })()
        if (!existingTags.includes('marketing')) {
          existingTags.push('marketing')
          await prisma.marketingContact.update({
            where: { email: email.toLowerCase() },
            data: { tags: JSON.stringify(existingTags) },
          })
        }
        updated++
        console.log(`  ~ ${email} (already existed, tags updated)`)
      } else {
        // Try to link to existing user
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true },
        })

        await prisma.marketingContact.create({
          data: {
            email: email.toLowerCase(),
            tags: JSON.stringify(['marketing']),
            source: 'manual',
            userId: user?.id || null,
          },
        })
        created++
        console.log(`  + ${email}`)
      }
    } catch (err: any) {
      errors++
      console.error(`  ! ${email}: ${err.message}`)
    }
  }

  const total = await prisma.marketingContact.count()

  console.log(`\n--- Done ---`)
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Errors: ${errors}`)
  console.log(`Total contacts in DB: ${total}`)

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
