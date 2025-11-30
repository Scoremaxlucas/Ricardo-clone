/**
 * Test-Skript für Swiss QR-Bill Validierung
 * Testet die QR-Code-Generierung mit verschiedenen Szenarien
 */

import { PAYMENT_CONFIG } from '../src/lib/payment-config'
import { validateQRBill, formatValidationResult } from '../src/lib/qr-bill-validator'
import QRCode from 'qrcode'

function generateQRCodeString(params: {
  iban: string
  amount: number
  currency: string
  reference: string
  creditorName: string
  creditorAddress: {
    street: string
    streetNumber: string
    postalCode: string
    city: string
    country: string
  }
  debtorName: string
  debtorAddress: {
    street: string
    streetNumber: string
    postalCode: string
    city: string
    country: string
  }
}): string {
  const {
    iban,
    amount,
    currency,
    reference,
    creditorName,
    creditorAddress,
    debtorName,
    debtorAddress
  } = params

  // Strukturierte Adressen
  const creditorStreet = `${creditorAddress.street || ''} ${creditorAddress.streetNumber || ''}`.trim()
  const creditorCityLine = `${creditorAddress.postalCode || ''} ${creditorAddress.city || ''}`.trim()
  const debtorStreet = `${debtorAddress.street || ''} ${debtorAddress.streetNumber || ''}`.trim()
  const debtorCityLine = `${debtorAddress.postalCode || ''} ${debtorAddress.city || ''}`.trim()

  const finalCreditorName = (creditorName || 'Score-Max GmbH').trim().substring(0, 70)
  const finalCreditorStreet = creditorStreet || PAYMENT_CONFIG.getStreetLine()
  const finalCreditorCity = creditorCityLine || PAYMENT_CONFIG.getCityLine()
  const finalCreditorCountry = (creditorAddress.country || 'CH').substring(0, 2)

  const finalDebtorName = (debtorName || 'Zahler').trim().substring(0, 70)
  const finalDebtorStreet = debtorStreet || 'Nicht angegeben'
  const finalDebtorCity = debtorCityLine || 'Schweiz'
  const finalDebtorCountry = (debtorAddress.country || 'CH').substring(0, 2)

  const cleanReference = reference.replace(/[^0-9A-Za-z]/g, '').substring(0, 25)
  const formattedReference = cleanReference.padEnd(25, ' ')
  const formattedAmount = Math.abs(amount).toFixed(2)
  const cleanIban = iban.replace(/\s/g, '').substring(0, 21)

  const hasDebtorInfo = !!debtorName

  return [
    'SPC',
    '0200',
    '1',
    cleanIban,
    'K',
    finalCreditorName,
    finalCreditorStreet.substring(0, 70),
    finalCreditorCity.substring(0, 70),
    finalCreditorCountry,
    '',
    '',
    '',
    '',
    formattedAmount,
    currency.substring(0, 3),
    hasDebtorInfo ? 'K' : '',
    (hasDebtorInfo ? finalDebtorName : '').substring(0, 70),
    (hasDebtorInfo ? finalDebtorStreet : '').substring(0, 70),
    (hasDebtorInfo ? finalDebtorCity : '').substring(0, 70),
    hasDebtorInfo ? finalDebtorCountry : '',
    'SCOR',
    formattedReference,
    '',
    'EPD'
  ].join('\n')
}

async function main() {
  console.log('🧪 Teste Swiss QR-Bill Generierung...\n')

  // Test 1: Standard-Rechnung
  console.log('='.repeat(60))
  console.log('TEST 1: Standard-Rechnung')
  console.log('='.repeat(60))
  
  const testQRString1 = generateQRCodeString({
    iban: PAYMENT_CONFIG.getIbanWithoutSpaces(),
    amount: 123.45,
    currency: 'CHF',
    reference: 'REV-2024-001',
    creditorName: PAYMENT_CONFIG.creditorName,
    creditorAddress: PAYMENT_CONFIG.address,
    debtorName: 'Max Mustermann',
    debtorAddress: {
      street: 'Musterstrasse',
      streetNumber: '123',
      postalCode: '8000',
      city: 'Zürich',
      country: 'CH'
    }
  })

  const validation1 = validateQRBill(testQRString1)
  console.log(formatValidationResult(validation1))

  // Generiere QR-Code als Bild
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(testQRString1, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    })
    console.log('✅ QR-Code erfolgreich generiert')
    console.log(`📏 QR-Code Größe: ${qrCodeDataUrl.length} bytes`)
  } catch (error) {
    console.error('❌ Fehler beim Generieren des QR-Codes:', error)
  }

  console.log('\n')

  // Test 2: Rechnung ohne Debtor-Info
  console.log('='.repeat(60))
  console.log('TEST 2: Rechnung ohne Debtor-Info')
  console.log('='.repeat(60))
  
  const testQRString2 = generateQRCodeString({
    iban: PAYMENT_CONFIG.getIbanWithoutSpaces(),
    amount: 50.00,
    currency: 'CHF',
    reference: 'REV-2024-002',
    creditorName: PAYMENT_CONFIG.creditorName,
    creditorAddress: PAYMENT_CONFIG.address,
    debtorName: '',
    debtorAddress: {
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      country: ''
    }
  })

  const validation2 = validateQRBill(testQRString2)
  console.log(formatValidationResult(validation2))

  console.log('\n')

  // Test 3: Rechnung mit langer Referenz
  console.log('='.repeat(60))
  console.log('TEST 3: Rechnung mit langer Referenz')
  console.log('='.repeat(60))
  
  const testQRString3 = generateQRCodeString({
    iban: PAYMENT_CONFIG.getIbanWithoutSpaces(),
    amount: 999.99,
    currency: 'CHF',
    reference: 'REV-2024-12345678901234567890', // Sehr lange Referenz
    creditorName: PAYMENT_CONFIG.creditorName,
    creditorAddress: PAYMENT_CONFIG.address,
    debtorName: 'Test User',
    debtorAddress: {
      street: 'Teststrasse',
      streetNumber: '1',
      postalCode: '1000',
      city: 'Lausanne',
      country: 'CH'
    }
  })

  const validation3 = validateQRBill(testQRString3)
  console.log(formatValidationResult(validation3))

  console.log('\n')
  console.log('✅ Alle Tests abgeschlossen!')
}

main().catch(console.error)

