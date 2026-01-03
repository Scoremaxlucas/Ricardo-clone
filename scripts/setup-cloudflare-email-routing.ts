#!/usr/bin/env tsx

/**
 * Interaktives Setup-Script für Cloudflare Email Routing
 *
 * Dieses Script führt Sie Schritt für Schritt durch die Einrichtung
 * von Cloudflare Email Routing für support@helvenda.ch
 */

import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

function printSection(title: string) {
  console.log('\n' + '='.repeat(70))
  console.log(`📋 ${title}`)
  console.log('='.repeat(70) + '\n')
}

function printStep(step: number, description: string) {
  console.log(`\n${step}. ${description}`)
}

function printBox(content: string[]) {
  const maxWidth = Math.max(...content.map(line => line.length))
  console.log('┌' + '─'.repeat(maxWidth + 2) + '┐')
  content.forEach(line => {
    console.log('│ ' + line.padEnd(maxWidth) + ' │')
  })
  console.log('└' + '─'.repeat(maxWidth + 2) + '┘')
}

async function main() {
  console.clear()
  console.log('\n' + '🚀'.repeat(35))
  console.log('   Cloudflare Email Routing Setup für support@helvenda.ch')
  console.log('🚀'.repeat(35))
  console.log('\nDieses Script führt Sie Schritt für Schritt durch die Einrichtung.')
  console.log('Sie benötigen Zugriff auf Ihr Cloudflare Dashboard.\n')

  const start = await question('Bereit zu starten? (j/n): ')
  if (start.toLowerCase() !== 'j') {
    console.log('\nSetup abgebrochen. Sie können jederzeit wieder starten.')
    rl.close()
    return
  }

  // ==========================================
  // SCHRITT 1: Cloudflare Dashboard öffnen
  // ==========================================
  printSection('Schritt 1: Cloudflare Dashboard öffnen')

  console.log('Bitte öffnen Sie jetzt Ihr Cloudflare Dashboard:')
  console.log('')
  console.log('   🔗 https://dash.cloudflare.com')
  console.log('')
  console.log('   → Melden Sie sich mit Ihrem Cloudflare-Account an')
  console.log('   → Wählen Sie die Domain: helvenda.ch')
  console.log('')

  const dashboardOpen = await question('Haben Sie das Cloudflare Dashboard geöffnet? (j/n): ')
  if (dashboardOpen.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte öffnen Sie das Dashboard und starten Sie das Script erneut.')
    rl.close()
    return
  }

  // ==========================================
  // SCHRITT 2: Email Routing aktivieren
  // ==========================================
  printSection('Schritt 2: Email Routing aktivieren')

  console.log('Navigieren Sie jetzt zu Email Routing:')
  console.log('')
  console.log('   1. Im linken Menü: Klicken Sie auf "Email"')
  console.log('   2. Klicken Sie auf "Email Routing"')
  console.log('   3. Falls Sie "Get Started" sehen, klicken Sie darauf')
  console.log('')

  printBox([
    'WICHTIG:',
    'Falls Email Routing bereits aktiviert ist,',
    'sehen Sie direkt die Übersicht.',
    'In diesem Fall können Sie zu Schritt 3 springen.',
  ])
  console.log('')

  const emailRoutingOpen = await question('Sind Sie auf der Email Routing Seite? (j/n): ')
  if (emailRoutingOpen.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte navigieren Sie zu Email → Email Routing')
    rl.close()
    return
  }

  // ==========================================
  // SCHRITT 3: MX Records hinzufügen
  // ==========================================
  printSection('Schritt 3: MX Records hinzufügen')

  console.log('Cloudflare zeigt Ihnen jetzt 2 MX Records, die Sie hinzufügen müssen.')
  console.log('')
  console.log('📝 Notieren Sie sich die Werte, die Cloudflare anzeigt:')
  console.log('')

  const mx1Priority = await question('   MX Record 1 - Priority (Zahl): ')
  const mx1Value = await question('   MX Record 1 - Value (z.B. route1.mx.cloudflare.net): ')
  const mx2Priority = await question('   MX Record 2 - Priority (Zahl): ')
  const mx2Value = await question('   MX Record 2 - Value (z.B. route2.mx.cloudflare.net): ')

  console.log('\n✅ Notiert! Jetzt fügen wir die MX Records hinzu:')
  console.log('')
  console.log('   1. Gehen Sie zu: DNS → Records')
  console.log('   2. Klicken Sie auf "Add record"')
  console.log('')
  console.log('   📌 Erster MX Record:')
  console.log(`      Type: MX`)
  console.log(`      Name: @`)
  console.log(`      Priority: ${mx1Priority}`)
  console.log(`      Target: ${mx1Value}`)
  console.log(`      TTL: Auto`)
  console.log('')
  console.log('   3. Klicken Sie auf "Save"')
  console.log('')
  console.log('   4. Klicken Sie erneut auf "Add record"')
  console.log('')
  console.log('   📌 Zweiter MX Record:')
  console.log(`      Type: MX`)
  console.log(`      Name: @`)
  console.log(`      Priority: ${mx2Priority}`)
  console.log(`      Target: ${mx2Value}`)
  console.log(`      TTL: Auto`)
  console.log('')
  console.log('   5. Klicken Sie auf "Save"')
  console.log('')

  printBox([
    '⚠️  WICHTIG:',
    'Falls bereits andere MX Records existieren,',
    'müssen diese GELÖSCHT werden!',
    'Nur die 2 Cloudflare MX Records sollten vorhanden sein.',
  ])
  console.log('')

  const mxRecordsAdded = await question('Haben Sie beide MX Records hinzugefügt? (j/n): ')
  if (mxRecordsAdded.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte fügen Sie die MX Records hinzu und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n⏳ Die MX Records werden jetzt propagiert.')
  console.log('   Dies kann 5-15 Minuten dauern.')
  console.log('   Cloudflare prüft automatisch, ob die Records korrekt sind.')
  console.log('')

  // ==========================================
  // SCHRITT 4: Destination Address erstellen
  // ==========================================
  printSection('Schritt 4: Destination Address erstellen')

  console.log('Jetzt erstellen wir eine Destination Address.')
  console.log('Das ist die E-Mail-Adresse, an die alle E-Mails weitergeleitet werden.')
  console.log('')

  const destinationEmail = await question(
    '   Ihre persönliche E-Mail-Adresse (z.B. lucas@outlook.com): '
  )

  if (!destinationEmail.includes('@')) {
    console.log('\n⚠️  Bitte geben Sie eine gültige E-Mail-Adresse ein.')
    rl.close()
    return
  }

  console.log('\n✅ Perfekt! Jetzt erstellen wir die Destination Address:')
  console.log('')
  console.log('   1. Gehen Sie zurück zu: Email → Email Routing')
  console.log('   2. Klicken Sie auf den Tab "Destination Addresses"')
  console.log('   3. Klicken Sie auf "Create address"')
  console.log(`   4. Geben Sie ein: ${destinationEmail}`)
  console.log('   5. Klicken Sie auf "Create"')
  console.log('')
  console.log('   📧 Cloudflare sendet jetzt eine Bestätigungs-E-Mail an diese Adresse.')
  console.log('   Bitte öffnen Sie Ihre E-Mails und klicken Sie auf den Bestätigungslink.')
  console.log('')

  const destinationCreated = await question('Haben Sie die Destination Address erstellt? (j/n): ')
  if (destinationCreated.toLowerCase() !== 'j') {
    console.log(
      '\n⚠️  Bitte erstellen Sie die Destination Address und starten Sie das Script erneut.'
    )
    rl.close()
    return
  }

  const destinationConfirmed = await question(
    'Haben Sie die Bestätigungs-E-Mail bestätigt? (j/n): '
  )
  if (destinationConfirmed.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte bestätigen Sie die E-Mail und starten Sie das Script erneut.')
    console.log('   Prüfen Sie auch Ihren Spam-Ordner!')
    rl.close()
    return
  }

  // ==========================================
  // SCHRITT 5: Routing Rule erstellen
  // ==========================================
  printSection('Schritt 5: Routing Rule erstellen')

  console.log('Jetzt erstellen wir die Routing Rule für support@helvenda.ch:')
  console.log('')
  console.log('   1. Gehen Sie zu: Email → Email Routing')
  console.log('   2. Klicken Sie auf den Tab "Routing Rules"')
  console.log('   3. Klicken Sie auf "Create address"')
  console.log('')
  console.log('   📌 Routing Rule Einstellungen:')
  console.log('      Custom Address: support@helvenda.ch')
  console.log(`      Destination: ${destinationEmail}`)
  console.log('')
  console.log('   4. Klicken Sie auf "Save"')
  console.log('')

  const routingRuleCreated = await question('Haben Sie die Routing Rule erstellt? (j/n): ')
  if (routingRuleCreated.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte erstellen Sie die Routing Rule und starten Sie das Script erneut.')
    rl.close()
    return
  }

  // ==========================================
  // SCHRITT 6: Testen
  // ==========================================
  printSection('Schritt 6: E-Mail-Empfang testen')

  console.log('Jetzt testen wir, ob alles funktioniert:')
  console.log('')
  console.log('   1. Öffnen Sie eine andere E-Mail-Adresse (nicht ' + destinationEmail + ')')
  console.log('   2. Senden Sie eine Test-E-Mail AN: support@helvenda.ch')
  console.log('   3. Betreff: Test E-Mail')
  console.log('   4. Nachricht: "Dies ist eine Test-E-Mail"')
  console.log('   5. Senden Sie die E-Mail')
  console.log('')
  console.log(`   6. Prüfen Sie jetzt ${destinationEmail}`)
  console.log('   7. Prüfen Sie auch den Spam-Ordner!')
  console.log('')

  const testEmailSent = await question('Haben Sie die Test-E-Mail gesendet? (j/n): ')
  if (testEmailSent.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte senden Sie die Test-E-Mail und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n⏳ Warten Sie 1-2 Minuten auf die E-Mail...')
  console.log('')

  const testEmailReceived = await question('Ist die Test-E-Mail angekommen? (j/n): ')
  if (testEmailReceived.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte prüfen Sie:')
    console.log('   - Haben Sie 5-15 Minuten auf die MX Record Propagation gewartet?')
    console.log('   - Ist die Destination Address bestätigt?')
    console.log('   - Ist die Routing Rule korrekt erstellt?')
    console.log('   - Haben Sie den Spam-Ordner geprüft?')
    console.log('')
    console.log('   Falls es nach 15 Minuten immer noch nicht funktioniert:')
    console.log('   - Prüfen Sie die MX Records in Cloudflare DNS')
    console.log('   - Stellen Sie sicher, dass nur die 2 Cloudflare MX Records vorhanden sind')
    console.log('')
    rl.close()
    return
  }

  // ==========================================
  // ERFOLG!
  // ==========================================
  console.clear()
  console.log('\n' + '✅'.repeat(35))
  console.log('   Setup erfolgreich abgeschlossen!')
  console.log('✅'.repeat(35))
  console.log('')

  printBox([
    '🎉 support@helvenda.ch ist jetzt funktionsfähig!',
    '',
    `📧 E-Mails an support@helvenda.ch werden jetzt`,
    `   automatisch an ${destinationEmail} weitergeleitet.`,
  ])
  console.log('')

  console.log('📝 Nächste Schritte:')
  console.log('')
  console.log('   1. ✅ Antworten Sie auf die Stripe/TWINT E-Mail')
  console.log('   2. ✅ Verwenden Sie diese Vorlage:')
  console.log('')
  console.log('   ────────────────────────────────────────────────────────')
  console.log('   Hallo Lawrence,')
  console.log('')
  console.log('   vielen Dank für Ihre Nachricht. Ich habe alle')
  console.log('   Anforderungen erfüllt:')
  console.log('')
  console.log('   ✅ Website ist erreichbar: https://helvenda.ch')
  console.log('   ✅ Impressum mit allen erforderlichen Informationen:')
  console.log('      https://helvenda.ch/imprint')
  console.log('   ✅ Allgemeine Geschäftsbedingungen:')
  console.log('      https://helvenda.ch/terms')
  console.log('   ✅ Kontakt-E-Mail-Adresse: support@helvenda.ch')
  console.log('      (funktioniert und ist erreichbar)')
  console.log('   ✅ Preise werden in CHF angezeigt')
  console.log('   ✅ Schweiz ist als Versandziel verfügbar')
  console.log('')
  console.log('   Bitte prüfen Sie meine Website erneut und aktivieren')
  console.log('   Sie TWINT für mein Konto.')
  console.log('')
  console.log('   Vielen Dank!')
  console.log('   [Ihr Name]')
  console.log('   ────────────────────────────────────────────────────────')
  console.log('')
  console.log('   3. ✅ Warten Sie auf Bestätigung von Stripe')
  console.log('')

  console.log('📚 Weitere Informationen:')
  console.log('   - Admin-Panel für Contact Requests:')
  console.log('     https://helvenda.ch/admin/contact-requests')
  console.log('   - Detaillierte Dokumentation:')
  console.log('     docs/RESEND_SUPPORT_EMAIL_SETUP.md')
  console.log('')

  rl.close()
}

main().catch(error => {
  console.error('\n❌ Fehler:', error)
  rl.close()
  process.exit(1)
})

