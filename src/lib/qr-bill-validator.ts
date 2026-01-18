/**
 * Swiss QR-Bill Validator
 * Validiert QR-Code-Strings gemäß Swiss QR-Bill Spezifikation v2.2
 * Quelle: SIX Swiss Implementation Guidelines for the QR-bill
 */

export interface QRBillValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  qrString: string
  fields: {
    [key: string]: string
  }
}

/**
 * Validiert einen Swiss QR-Bill QR-String
 * Der QR-String muss EXAKT 31 Zeilen haben (oder 32 mit optionaler Billing Info)
 */
export function validateQRBill(qrString: string): QRBillValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const fields: { [key: string]: string } = {}

  const lines = qrString.split('\n')

  // Swiss QR-Bill v2.2 erfordert EXAKT 31 Zeilen (oder 32 mit optionaler Billing Info)
  if (lines.length < 31) {
    errors.push(`Ungültige Anzahl Zeilen: ${lines.length} (erwartet: mindestens 31)`)
    return { isValid: false, errors, warnings, qrString, fields }
  }

  if (lines.length > 32) {
    warnings.push(`Mehr Zeilen als erwartet: ${lines.length} (erwartet: 31 oder 32)`)
  }

  // === HEADER (Zeilen 1-3) ===
  
  // Zeile 1: QR-Type
  fields.qrType = lines[0]
  if (fields.qrType !== 'SPC') {
    errors.push(`Ungültiger QR-Type: "${fields.qrType}" (erwartet: "SPC")`)
  }

  // Zeile 2: Version
  fields.version = lines[1]
  if (fields.version !== '0200') {
    errors.push(`Ungültige Version: "${fields.version}" (erwartet: "0200")`)
  }

  // Zeile 3: Coding Type
  fields.codingType = lines[2]
  if (fields.codingType !== '1') {
    errors.push(`Ungültiger Coding Type: "${fields.codingType}" (erwartet: "1" für UTF-8)`)
  }

  // === CREDITOR INFORMATION (Zeilen 4-11) ===

  // Zeile 4: IBAN
  fields.iban = lines[3]
  if (!fields.iban || fields.iban.length === 0) {
    errors.push('IBAN fehlt')
  } else if (fields.iban.length !== 21) {
    errors.push(`IBAN hat ungültige Länge: ${fields.iban.length} Zeichen (erwartet: genau 21)`)
  } else if (/\s/.test(fields.iban)) {
    errors.push('IBAN enthält Leerzeichen (MUSS ohne Leerzeichen sein)')
  } else if (!fields.iban.startsWith('CH') && !fields.iban.startsWith('LI')) {
    errors.push(`IBAN beginnt nicht mit CH oder LI: ${fields.iban}`)
  }

  // Zeile 5: Creditor Address Type
  fields.creditorAddressType = lines[4]
  if (fields.creditorAddressType !== 'K' && fields.creditorAddressType !== 'S') {
    errors.push(`Ungültiger Creditor Address Type: "${fields.creditorAddressType}" (erwartet: "K" oder "S")`)
  }

  // Zeile 6: Creditor Name
  fields.creditorName = lines[5]
  if (!fields.creditorName || fields.creditorName.length === 0) {
    errors.push('Creditor Name fehlt')
  } else if (fields.creditorName.length > 70) {
    errors.push(`Creditor Name zu lang: ${fields.creditorName.length} Zeichen (max: 70)`)
  }

  // Zeile 7: Creditor Strasse+Nr (Adresszeile 1)
  fields.creditorStreet = lines[6]
  if (fields.creditorStreet && fields.creditorStreet.length > 70) {
    errors.push(`Creditor Street zu lang: ${fields.creditorStreet.length} Zeichen (max: 70)`)
  }

  // Zeile 8: Creditor PLZ+Ort (Adresszeile 2)
  fields.creditorAddressLine2 = lines[7]
  if (fields.creditorAddressLine2 && fields.creditorAddressLine2.length > 70) {
    errors.push(`Creditor Address Line 2 zu lang: ${fields.creditorAddressLine2.length} Zeichen (max: 70)`)
  }

  // Zeile 9: Creditor PLZ (MUSS leer sein bei Typ K!)
  fields.creditorPostalCode = lines[8]
  if (fields.creditorAddressType === 'K' && fields.creditorPostalCode && fields.creditorPostalCode.length > 0) {
    warnings.push(`Creditor PLZ sollte bei Typ K leer sein: "${fields.creditorPostalCode}"`)
  }

  // Zeile 10: Creditor Ort (MUSS leer sein bei Typ K!)
  fields.creditorCity = lines[9]
  if (fields.creditorAddressType === 'K' && fields.creditorCity && fields.creditorCity.length > 0) {
    warnings.push(`Creditor Ort sollte bei Typ K leer sein: "${fields.creditorCity}"`)
  }

  // Zeile 11: Creditor Country
  fields.creditorCountry = lines[10]
  if (!fields.creditorCountry || fields.creditorCountry.length !== 2) {
    errors.push(`Creditor Country ungültig: "${fields.creditorCountry}" (erwartet: 2 Zeichen)`)
  }

  // === ULTIMATE CREDITOR (Zeilen 12-18, alle optional/leer) ===
  fields.ultimateCreditorType = lines[11]
  fields.ultimateCreditorName = lines[12]
  fields.ultimateCreditorStreet = lines[13]
  fields.ultimateCreditorAddressLine2 = lines[14]
  fields.ultimateCreditorPostalCode = lines[15]
  fields.ultimateCreditorCity = lines[16]
  fields.ultimateCreditorCountry = lines[17]

  // === PAYMENT AMOUNT INFORMATION (Zeilen 19-20) ===

  // Zeile 19: Amount
  fields.amount = lines[18]
  if (!fields.amount || fields.amount.length === 0) {
    errors.push('Amount fehlt')
  } else {
    const amountMatch = fields.amount.match(/^(\d+)\.(\d{2})$/)
    if (!amountMatch) {
      errors.push(`Amount Format ungültig: "${fields.amount}" (erwartet: z.B. "123.45")`)
    } else {
      const amount = parseFloat(fields.amount)
      if (amount <= 0) {
        errors.push(`Amount muss größer als 0 sein: ${fields.amount}`)
      }
    }
  }

  // Zeile 20: Currency
  fields.currency = lines[19]
  if (fields.currency !== 'CHF' && fields.currency !== 'EUR') {
    errors.push(`Ungültige Currency: "${fields.currency}" (erwartet: "CHF" oder "EUR")`)
  }

  // === ULTIMATE DEBTOR (Zeilen 21-27) ===

  // Zeile 21: Debtor Address Type
  fields.debtorAddressType = lines[20]
  if (fields.debtorAddressType && fields.debtorAddressType !== 'K' && fields.debtorAddressType !== 'S' && fields.debtorAddressType !== '') {
    errors.push(`Ungültiger Debtor Address Type: "${fields.debtorAddressType}" (erwartet: "K", "S" oder leer)`)
  }

  // Zeile 22: Debtor Name
  fields.debtorName = lines[21]
  if (fields.debtorAddressType && fields.debtorAddressType !== '' && (!fields.debtorName || fields.debtorName.length === 0)) {
    warnings.push('Debtor Name fehlt obwohl Address Type gesetzt ist')
  }

  // Zeile 23: Debtor Strasse (Adresszeile 1)
  fields.debtorStreet = lines[22]

  // Zeile 24: Debtor PLZ+Ort (Adresszeile 2)
  fields.debtorAddressLine2 = lines[23]

  // Zeile 25: Debtor PLZ (MUSS leer sein bei Typ K!)
  fields.debtorPostalCode = lines[24]
  if (fields.debtorAddressType === 'K' && fields.debtorPostalCode && fields.debtorPostalCode.length > 0) {
    warnings.push(`Debtor PLZ sollte bei Typ K leer sein: "${fields.debtorPostalCode}"`)
  }

  // Zeile 26: Debtor Ort (MUSS leer sein bei Typ K!)
  fields.debtorCity = lines[25]
  if (fields.debtorAddressType === 'K' && fields.debtorCity && fields.debtorCity.length > 0) {
    warnings.push(`Debtor Ort sollte bei Typ K leer sein: "${fields.debtorCity}"`)
  }

  // Zeile 27: Debtor Country
  fields.debtorCountry = lines[26]
  if (fields.debtorAddressType && fields.debtorAddressType !== '' && (!fields.debtorCountry || fields.debtorCountry.length !== 2)) {
    warnings.push(`Debtor Country ungültig: "${fields.debtorCountry}" (erwartet: 2 Zeichen)`)
  }

  // === PAYMENT REFERENCE (Zeilen 28-29) ===

  // Zeile 28: Reference Type
  fields.referenceType = lines[27]
  if (fields.referenceType !== 'QRR' && fields.referenceType !== 'SCOR' && fields.referenceType !== 'NON') {
    errors.push(`Ungültiger Reference Type: "${fields.referenceType}" (erwartet: "QRR", "SCOR" oder "NON")`)
  }

  // Zeile 29: Reference
  fields.reference = lines[28]
  if (fields.referenceType === 'SCOR') {
    // SCOR Reference: RF + 2 Prüfziffern + max 21 alphanumerische Zeichen = max 25 Zeichen
    if (!fields.reference || fields.reference.length === 0) {
      errors.push('SCOR Reference fehlt')
    } else if (fields.reference.length > 25) {
      errors.push(`SCOR Reference zu lang: ${fields.reference.length} Zeichen (max: 25)`)
    } else if (!/^[0-9A-Za-z]+$/.test(fields.reference)) {
      errors.push(`SCOR Reference enthält ungültige Zeichen: "${fields.reference}" (nur alphanumerisch erlaubt, KEINE Leerzeichen!)`)
    } else if (!fields.reference.startsWith('RF')) {
      warnings.push(`SCOR Reference sollte mit "RF" beginnen: "${fields.reference}"`)
    }
  } else if (fields.referenceType === 'QRR') {
    // QRR Reference: 27 Ziffern
    if (!fields.reference || fields.reference.length !== 27) {
      errors.push(`QRR Reference muss 27 Ziffern haben: ${fields.reference?.length || 0} Zeichen`)
    } else if (!/^\d{27}$/.test(fields.reference)) {
      errors.push(`QRR Reference darf nur Ziffern enthalten: "${fields.reference}"`)
    }
  } else if (fields.referenceType === 'NON') {
    // NON: Reference muss leer sein
    if (fields.reference && fields.reference.length > 0) {
      errors.push(`Bei Reference Type "NON" muss Reference leer sein: "${fields.reference}"`)
    }
  }

  // === ADDITIONAL INFORMATION (Zeile 30) ===
  fields.additionalInfo = lines[29]
  if (fields.additionalInfo && fields.additionalInfo.length > 140) {
    errors.push(`Additional Info zu lang: ${fields.additionalInfo.length} Zeichen (max: 140)`)
  }

  // === TRAILER (Zeile 31) ===
  fields.trailer = lines[30]
  if (fields.trailer !== 'EPD') {
    errors.push(`Ungültiger Trailer: "${fields.trailer}" (erwartet: "EPD")`)
  }

  // === OPTIONAL BILLING INFORMATION (Zeile 32, falls vorhanden) ===
  if (lines.length >= 32) {
    fields.billingInfo = lines[31]
    // Billing Info ist optional und kann beliebigen Inhalt haben
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    qrString,
    fields,
  }
}

/**
 * Formatiert Validierungsergebnis für Logging
 */
export function formatValidationResult(result: QRBillValidationResult): string {
  const lines: string[] = []

  lines.push('='.repeat(60))
  lines.push('Swiss QR-Bill Validierung (v2.2 - 31 Zeilen)')
  lines.push('='.repeat(60))
  lines.push('')

  if (result.isValid) {
    lines.push('✅ QR-Code ist VALIDE')
  } else {
    lines.push('❌ QR-Code ist UNGÜLTIG')
  }

  lines.push('')

  if (result.errors.length > 0) {
    lines.push('FEHLER:')
    result.errors.forEach((error, i) => {
      lines.push(`  ${i + 1}. ${error}`)
    })
    lines.push('')
  }

  if (result.warnings.length > 0) {
    lines.push('WARNUNGEN:')
    result.warnings.forEach((warning, i) => {
      lines.push(`  ${i + 1}. ${warning}`)
    })
    lines.push('')
  }

  lines.push('Wichtige Felder:')
  const importantFields = ['iban', 'creditorName', 'amount', 'currency', 'referenceType', 'reference']
  importantFields.forEach(key => {
    const value = result.fields[key] || '(leer)'
    lines.push(`  ${key}: ${value}`)
  })

  lines.push('')
  lines.push(`Zeilenanzahl: ${result.qrString.split('\n').length}`)
  lines.push('='.repeat(60))

  return lines.join('\n')
}
