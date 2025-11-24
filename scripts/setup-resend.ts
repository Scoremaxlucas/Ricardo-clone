#!/usr/bin/env tsx

/**
 * Setup-Script für Resend E-Mail-Konfiguration
 * 
 * Dieses Script hilft Ihnen beim Setup von Resend für Helvenda.
 * 
 * Verwendung:
 *   npm run setup:resend
 */

import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('\n📧 RESEND E-MAIL-SETUP FÜR HELVENDA\n')
  console.log('=' .repeat(50))
  console.log('Dieses Script hilft Ihnen beim Setup von Resend.')
  console.log('Resend ist ein professioneller E-Mail-Service wie Ricardo verwendet.\n')
  console.log('✅ Vorteile:')
  console.log('   → Skalierbar auf Millionen E-Mails/Tag')
  console.log('   → Kostenlos bis 3.000 E-Mails/Monat')
  console.log('   → Einfach zu konfigurieren')
  console.log('   → Professionelle Zustellung\n')
  console.log('=' .repeat(50))
  console.log('')

  // Schritt 1: Account erstellen
  console.log('📝 SCHRITT 1: Resend Account erstellen\n')
  console.log('1. Gehen Sie zu: https://resend.com')
  console.log('2. Klicken Sie auf "Sign Up"')
  console.log('3. Erstellen Sie ein kostenloses Konto')
  console.log('4. Bestätigen Sie Ihre E-Mail-Adresse\n')
  
  const step1Done = await question('Haben Sie bereits ein Resend-Konto? (j/n): ')
  if (step1Done.toLowerCase() !== 'j' && step1Done.toLowerCase() !== 'ja' && step1Done.toLowerCase() !== 'y' && step1Done.toLowerCase() !== 'yes') {
    console.log('\n⚠️  Bitte erstellen Sie zuerst ein Resend-Konto.')
    console.log('   Gehen Sie zu: https://resend.com\n')
    rl.close()
    return
  }

  // Schritt 2: API Key erstellen
  console.log('\n📝 SCHRITT 2: API Key erstellen\n')
  console.log('1. Loggen Sie sich bei Resend ein: https://resend.com/login')
  console.log('2. Gehen Sie zu "API Keys" (im Menü links)')
  console.log('3. Klicken Sie auf "Create API Key"')
  console.log('4. Geben Sie einen Namen ein (z.B. "Helvenda Production")')
  console.log('5. Wählen Sie "Full Access" oder "Sending Access"')
  console.log('6. Klicken Sie auf "Add"')
  console.log('7. Kopieren Sie den API Key (beginnt mit "re_")\n')
  console.log('⚠️  WICHTIG: Kopieren Sie den Key sofort - er wird nur einmal angezeigt!\n')
  
  const apiKey = await question('Fügen Sie hier Ihren Resend API Key ein: ')
  
  if (!apiKey || !apiKey.startsWith('re_')) {
    console.log('\n❌ Ungültiger API Key. Der Key muss mit "re_" beginnen.')
    rl.close()
    return
  }

  // Schritt 3: From Email
  console.log('\n📝 SCHRITT 3: Absender-E-Mail-Adresse\n')
  console.log('Für Tests können Sie verwenden: onboarding@resend.dev')
  console.log('Für Produktion müssen Sie eine Domain verifizieren.\n')
  
  const fromEmail = await question('Absender-E-Mail-Adresse (z.B. onboarding@resend.dev oder noreply@ihre-domain.ch): ')
  
  if (!fromEmail || !fromEmail.includes('@')) {
    console.log('\n❌ Ungültige E-Mail-Adresse.')
    rl.close()
    return
  }

  // Schritt 4: .env Datei aktualisieren
  console.log('\n📝 SCHRITT 4: .env Datei aktualisieren\n')
  
  const envPath = path.join(process.cwd(), '.env')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }

  // Entferne alte Resend-Einträge
  envContent = envContent.replace(/RESEND_API_KEY=.*/g, '')
  envContent = envContent.replace(/RESEND_FROM_EMAIL=.*/g, '')
  
  // Füge neue Einträge hinzu
  if (!envContent.endsWith('\n') && envContent.length > 0) {
    envContent += '\n'
  }
  
  envContent += `# Resend E-Mail-Konfiguration\n`
  envContent += `RESEND_API_KEY=${apiKey}\n`
  envContent += `RESEND_FROM_EMAIL=${fromEmail}\n`

  // Schreibe .env Datei
  fs.writeFileSync(envPath, envContent, 'utf-8')
  
  console.log('✅ .env Datei wurde aktualisiert!\n')

  // Schritt 5: Test
  console.log('📝 SCHRITT 5: Test\n')
  console.log('Möchten Sie jetzt einen Test-E-Mail-Versand durchführen?')
  const runTest = await question('Test-E-Mail senden? (j/n): ')
  
  if (runTest.toLowerCase() === 'j' || runTest.toLowerCase() === 'ja' || runTest.toLowerCase() === 'y' || runTest.toLowerCase() === 'yes') {
    const testEmail = await question('Test-E-Mail-Adresse: ')
    
    if (testEmail && testEmail.includes('@')) {
      console.log('\n📧 Sende Test-E-Mail...')
      
      try {
        // Dynamisch Resend importieren
        const { Resend } = await import('resend')
        const resend = new Resend(apiKey)
        
        const result = await resend.emails.send({
          from: fromEmail,
          to: [testEmail],
          subject: 'Test-E-Mail von Helvenda',
          html: `
            <h1>Test-E-Mail erfolgreich!</h1>
            <p>Wenn Sie diese E-Mail erhalten haben, ist Resend korrekt konfiguriert.</p>
            <p>Helvenda kann jetzt E-Mails versenden wie Ricardo! 🎉</p>
          `,
        })

        if (result.error) {
          console.log('❌ Fehler beim Versenden:', result.error.message)
        } else {
          console.log('✅ Test-E-Mail erfolgreich gesendet!')
          console.log(`   E-Mail-ID: ${result.data?.id}`)
          console.log(`   Überprüfen Sie Ihr Postfach: ${testEmail}`)
        }
      } catch (error: any) {
        console.log('❌ Fehler:', error.message)
        console.log('\n💡 Tipp: Stellen Sie sicher, dass:')
        console.log('   1. Der API Key korrekt ist')
        console.log('   2. Die From-E-Mail-Adresse korrekt ist')
        console.log('   3. Für Produktion: Domain ist verifiziert')
      }
    }
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(50))
  console.log('✅ SETUP ABGESCHLOSSEN!\n')
  console.log('📋 Zusammenfassung:')
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`)
  console.log(`   From Email: ${fromEmail}`)
  console.log(`   .env Datei: Aktualisiert\n`)
  console.log('📝 Nächste Schritte:')
  console.log('   1. Server neu starten: npm run dev')
  console.log('   2. Registrieren Sie einen Test-User')
  console.log('   3. Überprüfen Sie, ob die Verifizierungs-E-Mail ankommt\n')
  console.log('💡 Für Produktion:')
  console.log('   → Verifizieren Sie Ihre Domain bei Resend')
  console.log('   → Verwenden Sie noreply@ihre-domain.ch als From Email\n')
  console.log('📚 Dokumentation:')
  console.log('   → docs/email-konfiguration.md')
  console.log('   → docs/email-skalierbarkeit.md\n')
  console.log('='.repeat(50))
  console.log('')

  rl.close()
}

main()
  .catch((error) => {
    console.error('\n❌ Fehler:', error)
    rl.close()
    process.exit(1)
  })





