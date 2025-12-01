/**
 * Test-Skript zum Generieren eines QR-Codes und Anzeigen der Logs
 */

import { PrismaClient } from '@prisma/client'
import { generateInvoicePaymentInfo } from '../src/lib/invoice-payment-info'

const prisma = new PrismaClient()

async function main() {
  try {
    // Finde eine Rechnung
    const invoice = await prisma.invoice.findFirst({
      where: {
        status: { in: ['pending', 'overdue'] },
      },
      include: {
        seller: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!invoice) {
      console.log('❌ Keine Rechnung gefunden')
      return
    }

    console.log('📋 Gefundene Rechnung:')
    console.log(`   ID: ${invoice.id}`)
    console.log(`   Rechnungsnummer: ${invoice.invoiceNumber}`)
    console.log(`   Betrag: CHF ${invoice.total.toFixed(2)}`)
    console.log(`   Verkäufer: ${invoice.seller.email}`)
    console.log('')

    console.log('🔍 Generiere QR-Code und prüfe Validierung...\n')
    console.log('='.repeat(60))

    // Generiere Payment Info (dies wird die Validierung ausführen)
    const paymentInfo = await generateInvoicePaymentInfo(invoice.id)

    console.log('='.repeat(60))
    console.log('')
    console.log('✅ QR-Code generiert')
    console.log(`   Referenz: ${paymentInfo.reference}`)
    console.log(`   IBAN: ${paymentInfo.iban}`)
    console.log(`   QR-Code vorhanden: ${!!paymentInfo.qrCodeDataUrl}`)
    console.log('')
  } catch (error: any) {
    console.error('❌ Fehler:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
