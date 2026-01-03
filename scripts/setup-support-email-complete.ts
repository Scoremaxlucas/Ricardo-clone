#!/usr/bin/env tsx

/**
 * Komplettes Setup-Script für support@helvenda.ch
 * 
 * Dieses Script führt Sie durch den gesamten Setup-Prozess
 * und prüft jeden Schritt automatisch.
 */

import { Resend } from 'resend'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🚀 Setup für support@helvenda.ch')
  console.log('================================\n')

  // Schritt 1: Prüfe RESEND_API_KEY
  console.log('📋 Schritt 1: Prüfe Resend API Key...')
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.log('❌ RESEND_API_KEY nicht gefunden in Environment Variables')
    console.log('   Bitte setzen Sie RESEND_API_KEY in Vercel:')
    console.log('   Vercel Dashboard → Project → Settings → Environment Variables')
    console.log('   Name: RESEND_API_KEY')
    console.log('   Value: [Ihr Resend API Key]\n')
    
    const continueAnyway = await question('Möchten Sie trotzdem fortfahren? (j/n): ')
    if (continueAnyway.toLowerCase() !== 'j') {
      console.log('Setup abgebrochen.')
      rl.close()
      return
    }
  } else {
    console.log('✅ RESEND_API_KEY gefunden\n')
  }

  // Schritt 2: Prüfe Domain in Resend
  console.log('📋 Schritt 2: Domain-Verifizierung in Resend\n')
  console.log('Bitte führen Sie folgende Schritte aus:\n')
  console.log('1. Öffnen Sie: https://resend.com/domains')
  console.log('2. Klicken Sie auf "Add Domain"')
  console.log('3. Geben Sie ein: helvenda.ch')
  console.log('4. Klicken Sie auf "Add"\n')
  
  console.log('Resend zeigt Ihnen jetzt 3 DNS-Records, die Sie hinzufügen müssen:\n')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ DNS-Record 1: SPF (TXT)                                │')
  console.log('│ Type: TXT                                               │')
  console.log('│ Name: @                                                 │')
  console.log('│ Value: v=spf1 include:resend.com ~all                   │')
  console.log('└─────────────────────────────────────────────────────────┘\n')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ DNS-Record 2: DKIM (TXT)                                │')
  console.log('│ Type: TXT                                               │')
  console.log('│ Name: resend._domainkey                                  │')
  console.log('│ Value: [Kopieren Sie den exakten Wert von Resend]       │')
  console.log('└─────────────────────────────────────────────────────────┘\n')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ DNS-Record 3: CNAME                                     │')
  console.log('│ Type: CNAME                                              │')
  console.log('│ Name: resend                                             │')
  console.log('│ Value: [Kopieren Sie den exakten Wert von Resend]       │')
  console.log('└─────────────────────────────────────────────────────────┘\n')

  const dnsAdded = await question('Haben Sie die DNS-Records hinzugefügt? (j/n): ')
  if (dnsAdded.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte fügen Sie die DNS-Records hinzu und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n⏳ Warten auf Domain-Verifizierung...')
  console.log('   Resend prüft automatisch alle 5-10 Minuten.')
  console.log('   Dies kann 5-15 Minuten dauern.\n')

  const verified = await question('Ist die Domain in Resend verifiziert? (j/n): ')
  if (verified.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte warten Sie auf die Verifizierung und starten Sie das Script erneut.')
    console.log('   Sie erhalten eine E-Mail von Resend bei erfolgreicher Verifizierung.')
    rl.close()
    return
  }

  // Schritt 3: Vercel Environment Variable
  console.log('\n📋 Schritt 3: Vercel Environment Variable setzen\n')
  console.log('Bitte führen Sie folgende Schritte aus:\n')
  console.log('1. Öffnen Sie: https://vercel.com/dashboard')
  console.log('2. Wählen Sie Ihr Project aus')
  console.log('3. Gehen Sie zu: Settings → Environment Variables')
  console.log('4. Klicken Sie auf "Add New"')
  console.log('5. Geben Sie ein:')
  console.log('   Name: RESEND_FROM_EMAIL')
  console.log('   Value: support@helvenda.ch')
  console.log('6. Wählen Sie alle Environments (Production, Preview, Development)')
  console.log('7. Klicken Sie auf "Save"\n')

  const vercelSet = await question('Haben Sie die Environment Variable in Vercel gesetzt? (j/n): ')
  if (vercelSet.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte setzen Sie die Environment Variable und starten Sie das Script erneut.')
    rl.close()
    return
  }

  // Schritt 4: Cloudflare Email Routing
  console.log('\n📋 Schritt 4: E-Mail-Empfang einrichten (Cloudflare Email Routing)\n')
  console.log('Bitte führen Sie folgende Schritte aus:\n')
  console.log('1. Öffnen Sie: https://dash.cloudflare.com')
  console.log('2. Wählen Sie Ihre Domain: helvenda.ch')
  console.log('3. Gehen Sie zu: Email → Email Routing')
  console.log('4. Klicken Sie auf "Get Started"')
  console.log('5. Cloudflare zeigt Ihnen 2 MX Records\n')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ MX Record 1                                             │')
  console.log('│ Type: MX                                                 │')
  console.log('│ Name: @                                                  │')
  console.log('│ Priority: [Zahl von Cloudflare]                         │')
  console.log('│ Value: [route1.mx.cloudflare.net oder ähnlich]         │')
  console.log('└─────────────────────────────────────────────────────────┘\n')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ MX Record 2                                             │')
  console.log('│ Type: MX                                                 │')
  console.log('│ Name: @                                                  │')
  console.log('│ Priority: [Zahl von Cloudflare]                         │')
  console.log('│ Value: [route2.mx.cloudflare.net oder ähnlich]         │')
  console.log('└─────────────────────────────────────────────────────────┘\n')
  console.log('6. Fügen Sie beide MX Records in Cloudflare DNS hinzu')
  console.log('   Cloudflare Dashboard → DNS → Add Record')
  console.log('   WICHTIG: Entfernen Sie alle anderen MX Records!\n')

  const mxAdded = await question('Haben Sie die MX Records hinzugefügt? (j/n): ')
  if (mxAdded.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte fügen Sie die MX Records hinzu und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n7. Erstellen Sie eine Destination Address:')
  const destinationEmail = await question('   Ihre persönliche E-Mail-Adresse: ')
  
  console.log('\n8. Erstellen Sie eine Routing Rule:')
  console.log('   Custom Address: support@helvenda.ch')
  console.log(`   Destination: ${destinationEmail}\n`)

  const routingSet = await question('Haben Sie die Routing Rule erstellt? (j/n): ')
  if (routingSet.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte erstellen Sie die Routing Rule und starten Sie das Script erneut.')
    rl.close()
    return
  }

  // Schritt 5: Test
  console.log('\n📋 Schritt 5: Testen\n')
  console.log('Bitte testen Sie jetzt:\n')
  console.log('1. Senden Sie eine E-Mail VON einer anderen Adresse AN support@helvenda.ch')
  console.log(`2. Prüfen Sie, ob die E-Mail in ${destinationEmail} ankommt\n`)

  const testDone = await question('Funktioniert der E-Mail-Empfang? (j/n): ')
  if (testDone.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte prüfen Sie:')
    console.log('   - MX Records sind korrekt gesetzt')
    console.log('   - Cloudflare Email Routing ist aktiviert')
    console.log('   - Routing Rule ist erstellt')
    console.log('   - Spam-Ordner prüfen')
    rl.close()
    return
  }

  // Erfolg!
  console.log('\n✅ Setup erfolgreich abgeschlossen!\n')
  console.log('📧 support@helvenda.ch ist jetzt funktionsfähig!\n')
  console.log('📝 Nächste Schritte:')
  console.log('   1. Antworten Sie auf die Stripe-E-Mail')
  console.log('   2. Verwenden Sie die Vorlage aus docs/RESEND_SUPPORT_EMAIL_SETUP.md')
  console.log('   3. Warten Sie auf Bestätigung von Stripe\n')

  rl.close()
}

main().catch(console.error)
