/**
 * Swiss QR-Bill Validator
 * Validiert QR-Code-Strings gemäß Swiss QR-Bill Spezifikation
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
 */
export function validateQRBill(qrString: string): QRBillValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const fields: { [key: string]: string } = {}

  const lines = qrString.split('\n')

  // Prüfe Anzahl Zeilen (Swiss QR-Bill hat genau 24 Zeilen)
  if (lines.length < 24) {
    errors.push(`Ungültige Anzahl Zeilen: ${lines.length} (erwartet: mindestens 24)`)
    return { isValid: false, errors, warnings, qrString, fields }
  }

  if (lines.length > 24) {
    warnings.push(`Mehr Zeilen als erwartet: ${lines.length} (erwartet: 24)`)
  }

  // Feld 1: QR-Type
  fields.qrType = lines[0]
  if (fields.qrType !== 'SPC') {
    errors.push(`Ungültiger QR-Type: ${fields.qrType} (erwartet: SPC)`)
  }

  // Feld 2: Version
  fields.version = lines[1]
  if (fields.version !== '0200') {
    errors.push(`Ungültige Version: ${fields.version} (erwartet: 0200)`)
  }

  // Feld 3: Coding Type
  fields.codingType = lines[2]
  if (fields.codingType !== '1') {
    errors.push(`Ungültiger Coding Type: ${fields.codingType} (erwartet: 1 für UTF-8)`)
  }

  // Feld 4: IBAN
  fields.iban = lines[3]
  if (!fields.iban || fields.iban.length === 0) {
    errors.push('IBAN fehlt')
  } else if (fields.iban.length !== 21) {
    errors.push(`IBAN hat ungültige Länge: ${fields.iban.length} Zeichen (erwartet: genau 21)`)
  } else if (/\s/.test(fields.iban)) {
    errors.push('IBAN enthält Leerzeichen (sollte ohne Leerzeichen sein)')
  } else if (!fields.iban.startsWith('CH')) {
    errors.push(`IBAN beginnt nicht mit CH: ${fields.iban}`)
  } else {
    // Schweizer IBAN Format: CH + 2 Ziffern + 17 alphanumerische Zeichen = 21 Zeichen total
    const ibanRegex = /^CH\d{2}[A-Z0-9]{17}$/
    if (!ibanRegex.test(fields.iban)) {
      warnings.push(
        `IBAN-Format könnte ungültig sein: ${fields.iban} (erwartet: CH + 2 Ziffern + 17 alphanumerische Zeichen)`
      )
    }
  }

  // Feld 5: Creditor Address Type
  fields.creditorAddressType = lines[4]
  if (fields.creditorAddressType !== 'K') {
    errors.push(
      `Ungültiger Creditor Address Type: ${fields.creditorAddressType} (erwartet: K für strukturiert)`
    )
  }

  // Feld 6: Creditor Name
  fields.creditorName = lines[5]
  if (!fields.creditorName || fields.creditorName.length === 0) {
    errors.push('Creditor Name fehlt')
  } else if (fields.creditorName.length > 70) {
    errors.push(`Creditor Name zu lang: ${fields.creditorName.length} Zeichen (max: 70)`)
  }

  // Feld 7: Creditor Street
  fields.creditorStreet = lines[6]
  if (!fields.creditorStreet || fields.creditorStreet.length === 0) {
    errors.push('Creditor Street fehlt')
  } else if (fields.creditorStreet.length > 70) {
    errors.push(`Creditor Street zu lang: ${fields.creditorStreet.length} Zeichen (max: 70)`)
  }

  // Feld 8: Creditor City
  fields.creditorCity = lines[7]
  if (!fields.creditorCity || fields.creditorCity.length === 0) {
    errors.push('Creditor City fehlt')
  } else if (fields.creditorCity.length > 70) {
    errors.push(`Creditor City zu lang: ${fields.creditorCity.length} Zeichen (max: 70)`)
  }

  // Feld 9: Creditor Country
  fields.creditorCountry = lines[8]
  if (!fields.creditorCountry || fields.creditorCountry.length !== 2) {
    errors.push(`Creditor Country ungültig: ${fields.creditorCountry} (erwartet: 2 Zeichen)`)
  }

  // Felder 10-13: Ultimate Creditor (optional, können leer sein)
  fields.ultimateCreditorName = lines[9]
  fields.ultimateCreditorStreet = lines[10]
  fields.ultimateCreditorCity = lines[11]
  fields.ultimateCreditorCountry = lines[12]

  // Feld 14: Amount
  fields.amount = lines[13]
  if (!fields.amount || fields.amount.length === 0) {
    errors.push('Amount fehlt')
  } else {
    const amountMatch = fields.amount.match(/^(\d+)\.(\d{2})$/)
    if (!amountMatch) {
      errors.push(`Amount Format ungültig: ${fields.amount} (erwartet: z.B. "123.45")`)
    } else {
      const amount = parseFloat(fields.amount)
      if (amount <= 0) {
        errors.push(`Amount muss größer als 0 sein: ${fields.amount}`)
      }
    }
  }

  // Feld 15: Currency
  fields.currency = lines[14]
  if (fields.currency !== 'CHF') {
    warnings.push(`Currency ist nicht CHF: ${fields.currency}`)
  }

  // Feld 16: Ultimate Debtor Address Type
  fields.debtorAddressType = lines[15]
  if (
    fields.debtorAddressType &&
    fields.debtorAddressType !== 'K' &&
    fields.debtorAddressType !== ''
  ) {
    errors.push(
      `Ungültiger Debtor Address Type: ${fields.debtorAddressType} (erwartet: K oder leer)`
    )
  }

  // Felder 17-20: Ultimate Debtor (können leer sein wenn kein Name)
  fields.debtorName = lines[16]
  fields.debtorStreet = lines[17]
  fields.debtorCity = lines[18]
  fields.debtorCountry = lines[19]

  // Wenn Debtor Address Type gesetzt ist, müssen Name und Adresse auch gesetzt sein
  if (fields.debtorAddressType === 'K') {
    if (!fields.debtorName || fields.debtorName.length === 0) {
      errors.push('Debtor Name fehlt (obwohl Address Type K gesetzt ist)')
    }
    if (fields.debtorName && fields.debtorName.length > 70) {
      errors.push(`Debtor Name zu lang: ${fields.debtorName.length} Zeichen (max: 70)`)
    }
    if (fields.debtorStreet && fields.debtorStreet.length > 70) {
      errors.push(`Debtor Street zu lang: ${fields.debtorStreet.length} Zeichen (max: 70)`)
    }
    if (fields.debtorCity && fields.debtorCity.length > 70) {
      errors.push(`Debtor City zu lang: ${fields.debtorCity.length} Zeichen (max: 70)`)
    }
    if (fields.debtorCountry && fields.debtorCountry.length !== 2) {
      errors.push(`Debtor Country ungültig: ${fields.debtorCountry} (erwartet: 2 Zeichen)`)
    }
    // Warnung wenn Country nicht CH ist (für Swiss QR-Bill sollte es CH sein)
    if (
      fields.debtorCountry &&
      fields.debtorCountry !== 'CH' &&
      fields.debtorCountry.length === 2
    ) {
      warnings.push(
        `Debtor Country ist nicht CH: ${fields.debtorCountry} (für Swiss QR-Bill sollte es CH sein)`
      )
    }
  } else if (fields.debtorAddressType === '') {
    // Wenn kein Address Type, sollten alle Debtor-Felder leer sein
    if (fields.debtorName && fields.debtorName.length > 0) {
      warnings.push('Debtor Name vorhanden, obwohl Address Type leer ist')
    }
  }

  // Feld 21: Reference Type
  fields.referenceType = lines[20]
  if (fields.referenceType !== 'SCOR') {
    errors.push(`Ungültiger Reference Type: ${fields.referenceType} (erwartet: SCOR)`)
  }

  // Feld 22: Reference
  fields.reference = lines[21]
  if (!fields.reference || fields.reference.length === 0) {
    errors.push('Reference fehlt')
  } else if (fields.reference.length !== 25) {
    errors.push(`Reference Länge ungültig: ${fields.reference.length} Zeichen (erwartet: genau 25)`)
  } else {
    // Prüfe ob Reference nur alphanumerisch ist (Leerzeichen am Ende sind erlaubt)
    const referenceWithoutSpaces = fields.reference.trim()
    if (!/^[0-9A-Za-z]+$/.test(referenceWithoutSpaces)) {
      errors.push(
        `Reference enthält ungültige Zeichen: ${fields.reference} (nur alphanumerisch erlaubt)`
      )
    }
  }

  // Feld 23: Additional Information (optional)
  fields.additionalInfo = lines[22]

  // Feld 24: Trailer
  fields.trailer = lines[23]
  if (fields.trailer !== 'EPD') {
    errors.push(`Ungültiger Trailer: ${fields.trailer} (erwartet: EPD)`)
  }

  // Prüfe ob es mehr Zeilen gibt (sollten nicht sein)
  if (lines.length > 24) {
    warnings.push(`Zusätzliche Zeilen nach Trailer: ${lines.length - 24}`)
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
  lines.push('Swiss QR-Bill Validierung')
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

  lines.push('Felder:')
  Object.entries(result.fields).forEach(([key, value]) => {
    const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value
    lines.push(`  ${key}: ${displayValue}`)
  })

  lines.push('')
  lines.push('QR-String (erste 5 Zeilen):')
  result.qrString
    .split('\n')
    .slice(0, 5)
    .forEach((line, i) => {
      lines.push(`  ${i + 1}: ${line}`)
    })

  lines.push('='.repeat(60))

  return lines.join('\n')
}
