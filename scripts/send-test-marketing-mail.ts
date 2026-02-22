/**
 * Send a single test marketing email to verify the template looks good.
 * Usage: npx tsx scripts/send-test-marketing-mail.ts
 */
import dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

async function main() {
  const { getHelvendaEmailTemplate } = await import('../src/lib/email/base-template')
  const { sendEmail } = await import('../src/lib/email/sender')

  const to = 'lucasrodrigues.gafner@outlook.com'
  const subject = 'Neu auf Helvenda.ch – Ihr Schweizer Online-Marktplatz'

  const content = `
Helvenda.ch ist der neue <strong>Schweizer Online-Marktplatz</strong> – sicher, einfach und fair.

<br><br>

Ob Uhren, Elektronik oder Mode – bei uns finden Sie geprüfte Angebote von verifizierten Verkäufern in der Schweiz.

<br><br>

<strong>Warum Helvenda?</strong><br>
• Sichere Zahlungsabwicklung via Stripe<br>
• Käuferschutz & verifizierte Verkäufer<br>
• Keine versteckten Gebühren<br>
• Gratis inserieren

<br><br>

Schauen Sie sich um und entdecken Sie aktuelle Angebote:
  `.trim()

  const html = getHelvendaEmailTemplate({
    title: subject,
    greeting: 'Guten Tag',
    content,
    buttonText: 'Jetzt entdecken',
    buttonUrl: 'https://helvenda.ch/search',
  })

  console.log(`Sending test marketing mail to ${to}...`)

  const result = await sendEmail({ to, subject, html })

  if (result.success) {
    console.log(`\nMail sent successfully via ${result.method}!`)
    console.log(`Message ID: ${result.messageId}`)
  } else {
    console.error(`\nFailed to send: ${result.error}`)
  }
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
