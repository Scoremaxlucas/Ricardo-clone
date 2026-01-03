#!/usr/bin/env tsx

/**
 * Vollständiges Cloudflare Setup für helvenda.ch
 *
 * Dieses Script führt Sie durch:
 * 1. Nameserver-Änderung beim Domain-Registrar
 * 2. DNS-Records für Vercel in Cloudflare einrichten
 * 3. Cloudflare Email Routing einrichten
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
  console.log('   Vollständiges Cloudflare Setup für helvenda.ch')
  console.log('🚀'.repeat(35))
  console.log('\nDieses Script führt Sie durch:')
  console.log('  1. Nameserver-Änderung beim Domain-Registrar')
  console.log('  2. DNS-Records für Vercel in Cloudflare')
  console.log('  3. Cloudflare Email Routing einrichten')
  console.log('')

  const start = await question('Bereit zu starten? (j/n): ')
  if (start.toLowerCase() !== 'j') {
    console.log('\nSetup abgebrochen.')
    rl.close()
    return
  }

  // ==========================================
  // TEIL 1: Nameserver beim Domain-Registrar ändern
  // ==========================================
  printSection('TEIL 1: Nameserver beim Domain-Registrar ändern')

  console.log('Zuerst müssen wir die Nameserver von Vercel zu Cloudflare ändern.')
  console.log('')

  const registrar = await question(
    'Wo ist helvenda.ch registriert? (z.B. Hostpoint, Switch, Infomaniak, GoDaddy, etc.): '
  )

  console.log('\n✅ Perfekt! Jetzt ändern wir die Nameserver:')
  console.log('')
  console.log(`1. Loggen Sie sich bei ${registrar} ein`)
  console.log('2. Gehen Sie zu Domain-Verwaltung / DNS-Einstellungen')
  console.log('3. Suchen Sie nach "Nameserver" oder "Nameserver ändern"')
  console.log('')
  console.log('4. Ändern Sie die Nameserver zu:')
  console.log('')
  printBox([
    '   Nameserver 1: amos.ns.cloudflare.com',
    '   Nameserver 2: magnolia.ns.cloudflare.com',
  ])
  console.log('')
  console.log('5. ENTFERNEN Sie alle anderen Nameserver (z.B. ns1.vercel-dns.com)')
  console.log('6. Speichern Sie die Änderungen')
  console.log('')

  printBox([
    '⚠️  WICHTIG:',
    'Nach der Nameserver-Änderung kann es 1-48 Stunden dauern,',
    'bis die Änderung weltweit propagiert ist.',
    'Meistens funktioniert es aber schon nach 5-30 Minuten.',
  ])
  console.log('')

  const nameserversChanged = await question('Haben Sie die Nameserver geändert? (j/n): ')
  if (nameserversChanged.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte ändern Sie die Nameserver und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n⏳ Warten Sie 5-15 Minuten auf die Nameserver-Propagierung...')
  console.log('   Prüfen Sie den Status hier: https://www.whatsmydns.net/#NS/helvenda.ch')
  console.log(
    '   Die Nameserver sollten zeigen: amos.ns.cloudflare.com und magnolia.ns.cloudflare.com'
  )
  console.log('')

  const nameserversPropagated = await question('Sind die Nameserver propagiert? (j/n): ')
  if (nameserversPropagated.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte warten Sie auf die Propagation und starten Sie das Script erneut.')
    console.log('   Dies kann bis zu 48 Stunden dauern, meistens aber nur 5-30 Minuten.')
    rl.close()
    return
  }

  // ==========================================
  // TEIL 2: DNS-Records für Vercel in Cloudflare
  // ==========================================
  printSection('TEIL 2: DNS-Records für Vercel in Cloudflare einrichten')

  console.log('Jetzt müssen wir die DNS-Records für Vercel in Cloudflare hinzufügen,')
  console.log('damit helvenda.ch weiterhin auf Vercel funktioniert.')
  console.log('')

  console.log('1. Gehen Sie zu: Cloudflare Dashboard → helvenda.ch → DNS → Records')
  console.log('2. Klicken Sie auf "Add record"')
  console.log('')

  // Hole Vercel DNS-Informationen
  console.log('📋 Zuerst müssen wir die Vercel DNS-Records abrufen:')
  console.log('')
  console.log(
    '   1. Öffnen Sie: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains'
  )
  console.log('   2. Klicken Sie auf helvenda.ch → "Edit" oder "Learn more"')
  console.log('   3. Vercel zeigt Ihnen die benötigten DNS-Records an')
  console.log('')

  const vercelRecordType = await question(
    'Welchen Record-Typ zeigt Vercel für helvenda.ch? (A oder CNAME): '
  )

  let vercelRecordValue = ''
  if (vercelRecordType.toUpperCase() === 'A') {
    vercelRecordValue = await question('   IP-Adresse von Vercel (z.B. 76.76.21.21): ')
  } else {
    vercelRecordValue = await question('   CNAME-Wert von Vercel (z.B. cname.vercel-dns.com): ')
  }

  console.log('\n✅ Perfekt! Jetzt fügen wir die DNS-Records in Cloudflare hinzu:')
  console.log('')
  console.log('📌 Record 1: helvenda.ch (Root Domain)')
  console.log(`   Type: ${vercelRecordType.toUpperCase()}`)
  console.log('   Name: @')
  if (vercelRecordType.toUpperCase() === 'A') {
    console.log(`   IPv4 address: ${vercelRecordValue}`)
  } else {
    console.log(`   Target: ${vercelRecordValue}`)
  }
  console.log('   Proxy status: DNS only (graue Wolke)')
  console.log('   TTL: Auto')
  console.log('')

  console.log('📌 Record 2: www.helvenda.ch')
  console.log('   Type: CNAME')
  console.log('   Name: www')
  console.log('   Target: cname.vercel-dns.com')
  console.log('   Proxy status: DNS only (graue Wolke)')
  console.log('   TTL: Auto')
  console.log('')

  printBox([
    '⚠️  WICHTIG:',
    'Stellen Sie sicher, dass die Proxy-Wolke GRAU ist',
    '(DNS only), nicht orange (Proxied)!',
    'Vercel benötigt direkten DNS-Zugriff.',
  ])
  console.log('')

  const dnsRecordsAdded = await question(
    'Haben Sie beide DNS-Records in Cloudflare hinzugefügt? (j/n): '
  )
  if (dnsRecordsAdded.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte fügen Sie die DNS-Records hinzu und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n⏳ Warten Sie 5-10 Minuten auf die DNS-Propagierung...')
  console.log('')

  const dnsPropagated = await question('Sind die DNS-Records propagiert? (j/n): ')
  if (dnsPropagated.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte warten Sie auf die Propagation.')
    rl.close()
    return
  }

  // ==========================================
  // TEIL 3: Cloudflare Email Routing
  // ==========================================
  printSection('TEIL 3: Cloudflare Email Routing einrichten')

  console.log('Jetzt richten wir Cloudflare Email Routing für support@helvenda.ch ein.')
  console.log('')

  console.log('1. Gehen Sie zu: Cloudflare Dashboard → helvenda.ch → Email → Email Routing')
  console.log('2. Falls Sie "Get Started" sehen, klicken Sie darauf')
  console.log('3. Cloudflare zeigt Ihnen 2 MX Records')
  console.log('')

  const mx1Priority = await question('   MX Record 1 - Priority (Zahl): ')
  const mx1Value = await question('   MX Record 1 - Value (z.B. route1.mx.cloudflare.net): ')
  const mx2Priority = await question('   MX Record 2 - Priority (Zahl): ')
  const mx2Value = await question('   MX Record 2 - Value (z.B. route2.mx.cloudflare.net): ')

  console.log('\n✅ Jetzt fügen wir die MX Records in Cloudflare DNS hinzu:')
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

  const mxRecordsAdded = await question('Haben Sie beide MX Records hinzugefügt? (j/n): ')
  if (mxRecordsAdded.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte fügen Sie die MX Records hinzu und starten Sie das Script erneut.')
    rl.close()
    return
  }

  console.log('\n⏳ Warten Sie 5-15 Minuten auf die MX Record Propagation...')
  console.log('')

  // Destination Address
  console.log('📋 Jetzt erstellen wir die Destination Address:')
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
  console.log('   1. Gehen Sie zu: Email → Email Routing → Destination Addresses')
  console.log('   2. Klicken Sie auf "Create address"')
  console.log(`   3. Geben Sie ein: ${destinationEmail}`)
  console.log('   4. Klicken Sie auf "Create"')
  console.log('')
  console.log('   📧 Cloudflare sendet eine Bestätigungs-E-Mail')
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

  // Routing Rule
  console.log('\n📋 Jetzt erstellen wir die Routing Rule:')
  console.log('')
  console.log('   1. Gehen Sie zu: Email → Email Routing → Routing Rules')
  console.log('   2. Klicken Sie auf "Create address"')
  console.log('')
  console.log('   📌 Routing Rule Einstellungen:')
  console.log('      Custom Address: support@helvenda.ch')
  console.log(`      Destination: ${destinationEmail}`)
  console.log('')
  console.log('   3. Klicken Sie auf "Save"')
  console.log('')

  const routingRuleCreated = await question('Haben Sie die Routing Rule erstellt? (j/n): ')
  if (routingRuleCreated.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte erstellen Sie die Routing Rule und starten Sie das Script erneut.')
    rl.close()
    return
  }

  // ==========================================
  // TEIL 4: Testen
  // ==========================================
  printSection('TEIL 4: Alles testen')

  console.log('Jetzt testen wir, ob alles funktioniert:')
  console.log('')

  console.log('1. Testen Sie die Website:')
  console.log('   → Öffnen Sie https://helvenda.ch im Browser')
  console.log('   → Prüfen Sie, ob die Website lädt')
  console.log('')

  const websiteWorks = await question('Funktioniert die Website? (j/n): ')
  if (websiteWorks.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte prüfen Sie:')
    console.log('   - Sind die DNS-Records korrekt in Cloudflare?')
    console.log('   - Ist die Proxy-Wolke grau (DNS only)?')
    console.log('   - Warten Sie 10-15 Minuten auf Propagation')
    console.log('')
    rl.close()
    return
  }

  console.log('\n2. Testen Sie E-Mail-Empfang:')
  console.log('   → Senden Sie eine Test-E-Mail VON einer anderen Adresse')
  console.log(`   → AN: support@helvenda.ch`)
  console.log(`   → Prüfen Sie ${destinationEmail}`)
  console.log('   → Prüfen Sie auch den Spam-Ordner!')
  console.log('')

  const testEmailSent = await question('Haben Sie die Test-E-Mail gesendet? (j/n): ')
  if (testEmailSent.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte senden Sie die Test-E-Mail.')
    rl.close()
    return
  }

  console.log('\n⏳ Warten Sie 1-2 Minuten auf die E-Mail...')
  console.log('')

  const testEmailReceived = await question('Ist die Test-E-Mail angekommen? (j/n): ')
  if (testEmailReceived.toLowerCase() !== 'j') {
    console.log('\n⚠️  Bitte prüfen Sie:')
    console.log('   - Haben Sie auf die MX Record Propagation gewartet?')
    console.log('   - Ist die Destination Address bestätigt?')
    console.log('   - Ist die Routing Rule korrekt erstellt?')
    console.log('   - Haben Sie den Spam-Ordner geprüft?')
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
    '🎉 helvenda.ch ist jetzt vollständig bei Cloudflare eingerichtet!',
    '',
    '✅ Nameserver zu Cloudflare geändert',
    '✅ DNS-Records für Vercel konfiguriert',
    '✅ Website funktioniert',
    `✅ support@helvenda.ch funktioniert`,
    `   (E-Mails werden an ${destinationEmail} weitergeleitet)`,
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
  console.log('   - Cloudflare Dashboard:')
  console.log('     https://dash.cloudflare.com')
  console.log('   - Vercel Dashboard:')
  console.log('     https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda')
  console.log('')

  rl.close()
}

main().catch(error => {
  console.error('\n❌ Fehler:', error)
  rl.close()
  process.exit(1)
})

