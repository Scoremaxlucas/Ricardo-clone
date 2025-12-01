#!/usr/bin/env tsx

/**
 * Stripe Setup Script
 *
 * Dieses Script hilft beim Einrichten von Stripe für Kreditkartenzahlungen.
 * Es prüft ob Stripe-Keys vorhanden sind und gibt Anweisungen falls nicht.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const ENV_FILE = join(process.cwd(), '.env')
const ENV_EXAMPLE_FILE = join(process.cwd(), '.env.example')

interface StripeConfig {
  publishableKey?: string
  secretKey?: string
  webhookSecret?: string
}

function readEnvFile(): Map<string, string> {
  const env = new Map<string, string>()

  if (!existsSync(ENV_FILE)) {
    return env
  }

  const content = readFileSync(ENV_FILE, 'utf-8')
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        env.set(key.trim(), value.trim())
      }
    }
  }

  return env
}

function writeEnvFile(env: Map<string, string>) {
  const lines: string[] = []

  // Behalte bestehende Zeilen bei
  if (existsSync(ENV_FILE)) {
    const content = readFileSync(ENV_FILE, 'utf-8')
    const existingLines = content.split('\n')

    for (const line of existingLines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key] = trimmed.split('=')
        if (key && env.has(key.trim())) {
          // Überschreibe mit neuem Wert
          lines.push(`${key.trim()}=${env.get(key.trim())}`)
          env.delete(key.trim())
        } else {
          // Behalte bestehende Zeile
          lines.push(line)
        }
      } else {
        lines.push(line)
      }
    }
  }

  // Füge neue Keys hinzu
  for (const [key, value] of env.entries()) {
    if (!lines.some(line => line.startsWith(`${key}=`))) {
      lines.push(`${key}=${value}`)
    }
  }

  writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf-8')
}

function getStripeConfig(): StripeConfig {
  const env = readEnvFile()

  return {
    publishableKey: env.get('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    secretKey: env.get('STRIPE_SECRET_KEY'),
    webhookSecret: env.get('STRIPE_WEBHOOK_SECRET'),
  }
}

function checkStripeKeys(): { configured: boolean; missing: string[] } {
  const config = getStripeConfig()
  const missing: string[] = []

  if (
    !config.publishableKey ||
    config.publishableKey.trim() === '' ||
    config.publishableKey.includes('placeholder')
  ) {
    missing.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  }

  if (
    !config.secretKey ||
    config.secretKey.trim() === '' ||
    config.secretKey.includes('placeholder')
  ) {
    missing.push('STRIPE_SECRET_KEY')
  }

  return {
    configured: missing.length === 0,
    missing,
  }
}

async function main() {
  console.log('\n🔧 Stripe Setup für Helvenda\n')
  console.log('='.repeat(50))

  const { configured, missing } = checkStripeKeys()

  if (configured) {
    console.log('\n✅ Stripe ist bereits konfiguriert!')
    const config = getStripeConfig()
    console.log(`\n📋 Konfiguration:`)
    console.log(`   Publishable Key: ${config.publishableKey?.substring(0, 20)}...`)
    console.log(`   Secret Key: ${config.secretKey?.substring(0, 20)}...`)
    if (config.webhookSecret) {
      console.log(`   Webhook Secret: ${config.webhookSecret.substring(0, 20)}...`)
    }
    console.log('\n✅ Kreditkartenzahlung sollte funktionieren!')
    return
  }

  console.log('\n⚠️  Stripe ist noch nicht konfiguriert.')
  console.log(`\n📋 Fehlende Keys: ${missing.join(', ')}`)

  console.log('\n' + '='.repeat(50))
  console.log('\n📝 SCHNELLANLEITUNG:\n')
  console.log('1. Gehen Sie zu: https://dashboard.stripe.com/test/apikeys')
  console.log('2. Falls Sie noch kein Konto haben:')
  console.log('   → Gehen Sie zu https://stripe.com')
  console.log('   → Klicken Sie auf "Sign up"')
  console.log('   → Erstellen Sie ein kostenloses Konto')
  console.log('   → Bestätigen Sie Ihre E-Mail')
  console.log('3. Kopieren Sie die Test-Keys:')
  console.log('   → Publishable key (beginnt mit pk_test_)')
  console.log('   → Secret key (beginnt mit sk_test_)')
  console.log('4. Führen Sie dieses Script erneut aus mit:')
  console.log('   npm run setup:stripe -- --keys PK_TEST_KEY SK_TEST_KEY')
  console.log('\n' + '='.repeat(50))

  // Prüfe ob Keys als Argumente übergeben wurden
  const args = process.argv.slice(2)
  if (args.includes('--keys') || args.includes('-k')) {
    const keyIndex = args.indexOf('--keys') !== -1 ? args.indexOf('--keys') : args.indexOf('-k')
    const publishableKey = args[keyIndex + 1]
    const secretKey = args[keyIndex + 2]

    if (publishableKey && secretKey) {
      console.log('\n🔧 Konfiguriere Stripe-Keys...')

      const env = readEnvFile()
      env.set('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', publishableKey)
      env.set('STRIPE_SECRET_KEY', secretKey)

      writeEnvFile(env)

      console.log('✅ Stripe-Keys wurden gespeichert!')
      console.log('\n⚠️  WICHTIG:')
      console.log('   1. Starten Sie den Server neu: npm run dev')
      console.log('   2. Testen Sie die Kreditkartenzahlung')
      console.log('   3. Verwenden Sie Test-Karte: 4242 4242 4242 4242')
      console.log('\n✅ Kreditkartenzahlung sollte jetzt funktionieren!')
    } else {
      console.log('\n❌ Fehler: Bitte geben Sie beide Keys an:')
      console.log('   npm run setup:stripe -- --keys PK_TEST_KEY SK_TEST_KEY')
    }
  } else {
    console.log('\n💡 TIPP:')
    console.log('   Sie können die Keys auch direkt in die .env Datei eintragen:')
    console.log('   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...')
    console.log('   STRIPE_SECRET_KEY=sk_test_...')
    console.log('\n   Dann starten Sie den Server neu: npm run dev')
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n📚 Weitere Informationen:')
  console.log('   → Dokumentation: docs/stripe-konfiguration.md')
  console.log('   → Stripe Dashboard: https://dashboard.stripe.com')
  console.log('   → Test-Karten: https://stripe.com/docs/testing')
  console.log('\n')
}

main().catch(console.error)
