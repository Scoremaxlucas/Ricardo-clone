#!/usr/bin/env tsx

/**
 * Automatisiertes Setup für support@helvenda.ch
 *
 * Dieses Script versucht, so viel wie möglich automatisch zu konfigurieren.
 */

import * as readline from 'readline'
import { Resend } from 'resend'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('\n🚀 Automatisiertes Setup für support@helvenda.ch')
  console.log('='.repeat(60))
  console.log('')

  // Schritt 1: Prüfe Resend API Key
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log('❌ RESEND_API_KEY nicht gefunden!')
    console.log('')
    console.log('Bitte setzen Sie RESEND_API_KEY in Vercel:')
    console.log('1. Vercel Dashboard → Project → Settings → Environment Variables')
    console.log('2. Name: RESEND_API_KEY')
    console.log('3. Value: [Ihr Resend API Key von https://resend.com/api-keys]')
    console.log('')
    rl.close()
    return
  }

  console.log('✅ RESEND_API_KEY gefunden')
  const resend = new Resend(resendApiKey)

  // Schritt 2: Versuche Domain hinzuzufügen
  console.log('\n📋 Schritt 1: Domain zu Resend hinzufügen...')
  console.log('')

  try {
    // Prüfe ob Domain bereits existiert
    const domains = await resend.domains.list()
    const helvendaDomain = domains.data?.data?.find(d => d.name === 'helvenda.ch')

    if (helvendaDomain) {
      console.log('✅ Domain helvenda.ch bereits in Resend vorhanden')
      console.log(`   Status: ${helvendaDomain.status}`)

      if (helvendaDomain.status === 'verified') {
        console.log('✅ Domain ist bereits verifiziert!')
      } else {
        console.log('⚠️  Domain ist noch nicht verifiziert')
        console.log('')
        console.log('Bitte fügen Sie folgende DNS-Records hinzu:')
        console.log('')

        // Versuche DNS-Records zu holen
        try {
          const domainDetails = await resend.domains.get('helvenda.ch')
          if (domainDetails.data) {
            console.log('DNS-Records von Resend:')
            console.log(JSON.stringify(domainDetails.data, null, 2))
          }
        } catch (e) {
          console.log('⚠️  Konnte DNS-Records nicht automatisch abrufen')
          console.log('   Bitte gehen Sie zu: https://resend.com/domains/helvenda.ch')
          console.log('   Dort sehen Sie die benötigten DNS-Records')
        }
      }
    } else {
      console.log('📝 Domain helvenda.ch noch nicht in Resend')
      console.log('')
      console.log('Bitte fügen Sie die Domain manuell hinzu:')
      console.log('1. Gehen Sie zu: https://resend.com/domains')
      console.log('2. Klicken Sie auf "Add Domain"')
      console.log('3. Geben Sie ein: helvenda.ch')
      console.log('4. Klicken Sie auf "Add"')
      console.log('')

      const addManually = await question('Haben Sie die Domain hinzugefügt? (j/n): ')
      if (addManually.toLowerCase() !== 'j') {
        console.log('\n⚠️  Bitte fügen Sie die Domain hinzu und starten Sie das Script erneut.')
        rl.close()
        return
      }
    }
  } catch (error: any) {
    console.log('⚠️  Fehler beim Prüfen der Domain:', error.message)
    console.log('')
    console.log('Bitte fügen Sie die Domain manuell hinzu:')
    console.log('1. Gehen Sie zu: https://resend.com/domains')
    console.log('2. Klicken Sie auf "Add Domain"')
    console.log('3. Geben Sie ein: helvenda.ch')
    console.log('')
  }

  // Schritt 3: Vercel Environment Variable
  console.log('\n📋 Schritt 2: Vercel Environment Variable')
  console.log('')
  console.log('Bitte setzen Sie in Vercel:')
  console.log('1. Vercel Dashboard → Project → Settings → Environment Variables')
  console.log('2. Name: RESEND_FROM_EMAIL')
  console.log('3. Value: support@helvenda.ch')
  console.log('4. Wählen Sie alle Environments')
  console.log('5. Save')
  console.log('')

  const vercelSet = await question('Haben Sie RESEND_FROM_EMAIL in Vercel gesetzt? (j/n): ')
  if (vercelSet.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte setzen Sie die Environment Variable.')
    rl.close()
    return
  }

  // Schritt 4: Cloudflare Email Routing
  console.log('\n📋 Schritt 3: E-Mail-Empfang (Cloudflare Email Routing)')
  console.log('')
  console.log('Für das EMPFANGEN von E-Mails benötigen wir Cloudflare Email Routing:')
  console.log('')
  console.log('1. Gehen Sie zu: https://dash.cloudflare.com')
  console.log('2. Wählen Sie Domain: helvenda.ch')
  console.log('3. Email → Email Routing → Get Started')
  console.log('4. Fügen Sie die 2 MX Records hinzu, die Cloudflare zeigt')
  console.log('5. Erstellen Sie Destination Address (Ihre persönliche E-Mail)')
  console.log('6. Erstellen Sie Routing Rule: support@helvenda.ch → Ihre E-Mail')
  console.log('')

  const emailRouting = await question('Haben Sie Cloudflare Email Routing eingerichtet? (j/n): ')
  if (emailRouting.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte richten Sie Cloudflare Email Routing ein.')
    console.log('   Detaillierte Anleitung: docs/RESEND_SUPPORT_EMAIL_SETUP.md')
    rl.close()
    return
  }

  // Schritt 5: Test
  console.log('\n📋 Schritt 4: Test')
  console.log('')
  console.log('Bitte testen Sie jetzt:')
  console.log('1. Senden Sie eine E-Mail an support@helvenda.ch')
  console.log('2. Prüfen Sie, ob sie ankommt')
  console.log('')

  const testDone = await question('Funktioniert alles? (j/n): ')
  if (testDone.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte prüfen Sie die Konfiguration.')
    console.log('   Detaillierte Anleitung: docs/RESEND_SUPPORT_EMAIL_SETUP.md')
    rl.close()
    return
  }

  // Erfolg!
  console.log('\n' + '='.repeat(60))
  console.log('✅ Setup erfolgreich abgeschlossen!')
  console.log('='.repeat(60))
  console.log('')
  console.log('📧 support@helvenda.ch ist jetzt funktionsfähig!')
  console.log('')
  console.log('📝 Antwort-Vorlage für Stripe:')
  console.log('')
  console.log('─'.repeat(60))
  console.log('Hallo Lawrence,')
  console.log('')
  console.log('vielen Dank für Ihre Nachricht. Ich habe alle Anforderungen erfüllt:')
  console.log('')
  console.log('✅ Website: https://helvenda.ch (erreichbar, nicht passwortgeschützt)')
  console.log('✅ Impressum: https://helvenda.ch/imprint')
  console.log('   - Firmenname: Score-Max-GmbH')
  console.log('   - Adresse: in der Hauswiese 2, 8125 Zollikerberg, Schweiz')
  console.log('   - E-Mail: support@helvenda.ch')
  console.log('✅ Allgemeine Geschäftsbedingungen: https://helvenda.ch/terms')
  console.log('✅ Preise werden in CHF angezeigt')
  console.log('✅ Schweiz ist als Versandziel verfügbar')
  console.log('✅ support@helvenda.ch ist funktionsfähig und erreichbar')
  console.log('')
  console.log('Bitte prüfen Sie meine Website erneut und aktivieren Sie TWINT für mein Konto.')
  console.log('')
  console.log('Vielen Dank!')
  console.log('─'.repeat(60))
  console.log('')

  rl.close()
}

main().catch(error => {
  console.error('\n❌ Fehler:', error)
  rl.close()
  process.exit(1)
})
