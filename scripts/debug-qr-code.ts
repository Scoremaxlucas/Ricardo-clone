/**
 * Debug-Skript zum Testen des QR-Codes
 * Generiert einen QR-Code und zeigt den vollständigen String
 */

import { PAYMENT_CONFIG } from '../src/lib/payment-config'
import { validateQRBill, formatValidationResult } from '../src/lib/qr-bill-validator'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

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
    debtorAddress,
  } = params

  // Strukturierte Adressen
  const creditorStreet =
    `${creditorAddress.street || ''} ${creditorAddress.streetNumber || ''}`.trim()
  const creditorCityLine =
    `${creditorAddress.postalCode || ''} ${creditorAddress.city || ''}`.trim()
  const debtorStreet = `${debtorAddress.street || ''} ${debtorAddress.streetNumber || ''}`.trim()
  const debtorCityLine = `${debtorAddress.postalCode || ''} ${debtorAddress.city || ''}`.trim()

  const finalCreditorName = (creditorName || 'Score-Max GmbH').trim().substring(0, 70)
  const finalCreditorStreet = creditorStreet || PAYMENT_CONFIG.getStreetLine()
  const finalCreditorCity = creditorCityLine || PAYMENT_CONFIG.getCityLine()
  const finalCreditorCountry = (creditorAddress.country || 'CH').substring(0, 2).toUpperCase()

  const hasDebtorInfo = !!(debtorName && debtorName.trim().length > 0)
  const finalDebtorName = hasDebtorInfo ? debtorName.trim().substring(0, 70) : ''
  const finalDebtorStreet = hasDebtorInfo ? debtorStreet.substring(0, 70) : ''
  const finalDebtorCity = hasDebtorInfo ? debtorCityLine.substring(0, 70) : ''
  const finalDebtorCountry = hasDebtorInfo ? 'CH' : ''

  const cleanReference = reference.replace(/[^0-9A-Za-z]/g, '').substring(0, 25)
  const formattedReference = cleanReference.padEnd(25, ' ')
  const formattedAmount = Math.abs(amount).toFixed(2)
  const cleanIban = iban.replace(/\s/g, '').toUpperCase().substring(0, 21)

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
    finalDebtorName,
    finalDebtorStreet,
    finalDebtorCity,
    finalDebtorCountry,
    'SCOR',
    formattedReference,
    '',
    'EPD',
  ].join('\n')
}

async function main() {
  console.log('🔍 Debug QR-Code Generierung\n')

  const qrString = generateQRCodeString({
    iban: PAYMENT_CONFIG.getIbanWithoutSpaces(),
    amount: 20.0,
    currency: 'CHF',
    reference: 'REV2025008',
    creditorName: PAYMENT_CONFIG.creditorName,
    creditorAddress: PAYMENT_CONFIG.address,
    debtorName: 'Noah Gafner',
    debtorAddress: {
      street: 'Skibidi avenudi',
      streetNumber: '69',
      postalCode: '8009',
      city: 'Schliere',
      country: 'CH',
    },
  })

  console.log('QR-String (alle 24 Zeilen):')
  console.log('='.repeat(60))
  qrString.split('\n').forEach((line, i) => {
    const lineNum = String(i + 1).padStart(2, '0')
    const lineLength = line.length
    const preview = line.length > 50 ? line.substring(0, 50) + '...' : line
    console.log(`${lineNum}: [${lineLength} chars] ${preview}`)
  })
  console.log('='.repeat(60))
  console.log('')

  // Validiere
  const validation = validateQRBill(qrString)
  console.log(formatValidationResult(validation))
  console.log('')

  // Generiere QR-Code als Bild
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 500, // Größere Größe für bessere Qualität
      margin: 4, // Größerer Margin für bessere Erkennbarkeit
    })

    // Speichere QR-Code als Datei
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const outputPath = path.join(process.cwd(), 'qr-code-debug.png')
    fs.writeFileSync(outputPath, buffer)

    console.log('✅ QR-Code generiert und gespeichert:', outputPath)
    console.log('   Größe:', buffer.length, 'bytes')
    console.log('   Error Correction Level: M')
    console.log('   Margin: 4')
    console.log('   Width: 500px')
    console.log('')
    console.log('📱 Bitte scannen Sie diesen QR-Code mit Ihrer Banking-App')
  } catch (error) {
    console.error('❌ Fehler beim Generieren des QR-Codes:', error)
  }
}

main().catch(console.error)
