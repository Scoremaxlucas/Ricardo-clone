import { processInvoiceReminders } from '../src/lib/invoice-reminders'

/**
 * Script zum manuellen Ausführen des Mahnprozess-Cron-Jobs
 *
 * Verwendung:
 *   npm run cron:reminders
 *   oder
 *   tsx scripts/run-cron.ts
 */
async function main() {
  console.log('🚀 Starte Mahnprozess-Verarbeitung...')
  console.log(`⏰ Zeitpunkt: ${new Date().toISOString()}`)
  console.log('')

  try {
    const result = await processInvoiceReminders()

    console.log('')
    console.log('✅ Mahnprozess erfolgreich abgeschlossen!')
    console.log(`   Verarbeitet: ${result.processed} von ${result.total} Rechnungen`)
    console.log('')

    process.exit(0)
  } catch (error: any) {
    console.error('')
    console.error('❌ Fehler bei Mahnprozess-Verarbeitung:')
    console.error(`   ${error.message}`)
    if (error.stack) {
      console.error('')
      console.error('Stack Trace:')
      console.error(error.stack)
    }
    console.error('')

    process.exit(1)
  }
}

main()
