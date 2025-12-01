import { prisma } from './prisma'
import { PAYMENT_CONFIG } from './payment-config'
import QRCode from 'qrcode'
import { validateQRBill, formatValidationResult } from './qr-bill-validator'
import { formatQRReference } from './qr-reference'

/**
 * Generiert Zahlungsinformationen für eine Rechnung
 * Zahlungsmethoden: Banküberweisung, TWINT, Kreditkarte
 */
export interface InvoicePaymentInfo {
  invoiceNumber: string
  amount: number
  currency: string
  reference: string

  // Banküberweisung
  iban: string
  bic: string
  accountHolder: string
  qrCodeDataUrl?: string
  qrCodeString?: string

  // TWINT (optional)
  twintPhone?: string | null
  twintQRCodeDataUrl?: string | null // TWINT QR-Code für Zahlung
  twintDeepLink?: string | null // TWINT Deep Link für mobile Zahlung

  // Zahlungsanweisung
  paymentInstructions: string
}

/**
 * Generiert Zahlungsinformationen für eine Rechnung
 */
export async function generateInvoicePaymentInfo(invoiceId: string): Promise<InvoicePaymentInfo> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      seller: true,
      items: {
        include: {
          watch: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  })

  if (!invoice) {
    throw new Error('Rechnung nicht gefunden')
  }

  // Prüfe ob es eine Credit Note (Korrektur-Abrechnung) ist
  const isCreditNote =
    invoice.invoiceNumber.startsWith('KORR-') ||
    invoice.total < 0 ||
    (invoice.status === 'cancelled' && invoice.refundedAt)

  // Bei Credit Notes: Keine Zahlungsinformationen generieren
  if (isCreditNote) {
    return {
      invoiceNumber: invoice.invoiceNumber,
      amount: Math.abs(invoice.total), // Zeige Betrag als positiv
      currency: 'CHF',
      reference: invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '').substring(0, 25),
      iban: '',
      bic: '',
      accountHolder: '',
      qrCodeDataUrl: undefined,
      qrCodeString: undefined,
      twintPhone: null,
      twintQRCodeDataUrl: null,
      twintDeepLink: null,
      paymentInstructions: `Korrektur-Abrechnung ${invoice.invoiceNumber}\n\nDiese Korrektur-Abrechnung stellt eine Gutschrift dar.\nEs ist keine Zahlung erforderlich. Der Betrag wird automatisch gutgeschrieben oder mit einer offenen Rechnung verrechnet.`,
    }
  }

  // Verwende Plattform-IBAN für Rechnungszahlungen
  const iban = PAYMENT_CONFIG.getIbanWithoutSpaces()
  const bic = PAYMENT_CONFIG.bic
  const accountHolder = PAYMENT_CONFIG.creditorName

  // Generiere Referenz (Rechnungsnummer als Referenz)
  const reference = invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '').substring(0, 25)

  // Generiere QR-Code String (Swiss QR-Bill Format)
  // WICHTIG: Debtor-Felder nur ausfüllen wenn Name vorhanden ist
  const hasDebtorInfo = !!(
    invoice.seller.firstName ||
    invoice.seller.lastName ||
    invoice.seller.companyName ||
    invoice.seller.name
  )

  const debtorName = hasDebtorInfo
    ? invoice.seller.name ||
      `${invoice.seller.firstName || ''} ${invoice.seller.lastName || ''}`.trim() ||
      invoice.seller.companyName ||
      ''
    : ''

  // Debtor-Adresse nur ausfüllen wenn Name vorhanden ist
  // WICHTIG: Für Swiss QR-Bill sollte das Land immer "CH" sein (Schweiz)
  const debtorCountryRaw = invoice.seller.country || 'CH'
  const debtorCountry = debtorCountryRaw.trim().toUpperCase().substring(0, 2)
  // Stelle sicher, dass es ein gültiges 2-stelliges Länderkürzel ist, sonst verwende CH
  const finalDebtorCountry = /^[A-Z]{2}$/.test(debtorCountry) ? debtorCountry : 'CH'

  const finalDebtorAddress = hasDebtorInfo
    ? {
        street: (invoice.seller.street || '').trim(),
        streetNumber: (invoice.seller.streetNumber || '').trim(),
        postalCode: (invoice.seller.postalCode || '').trim(),
        city: (invoice.seller.city || '').trim(),
        country: finalDebtorCountry,
      }
    : {
        street: '',
        streetNumber: '',
        postalCode: '',
        city: '',
        country: '',
      }

  const qrCodeString = generateQRCodeString({
    iban: iban,
    amount: invoice.total,
    currency: 'CHF',
    reference: reference,
    creditorName: accountHolder,
    creditorAddress: PAYMENT_CONFIG.address,
    debtorName: debtorName,
    debtorAddress: finalDebtorAddress,
  })

  // Validiere QR-Code
  const validation = validateQRBill(qrCodeString)

  // Log Validierungsergebnis
  console.log('[invoice-payment-info] QR-Bill Validierung:')
  console.log(formatValidationResult(validation))

  if (!validation.isValid) {
    console.error('[invoice-payment-info] ❌ QR-Code ist ungültig!')
    console.error('[invoice-payment-info] Fehler:', validation.errors)
    if (validation.warnings.length > 0) {
      console.warn('[invoice-payment-info] Warnungen:', validation.warnings)
    }
  } else {
    console.log('[invoice-payment-info] ✅ QR-Code ist valide')
    if (validation.warnings.length > 0) {
      console.warn('[invoice-payment-info] Warnungen:', validation.warnings)
    }
  }

  // Generiere QR-Code als Data URL
  let qrCodeDataUrl: string | undefined
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'M', // Medium error correction (empfohlen für Swiss QR-Bill)
      type: 'image/png',
      width: 300, // Größere Größe für bessere Erkennbarkeit
      margin: 2, // Größerer Rand für bessere Erkennbarkeit
    })
  } catch (error) {
    console.error('[invoice-payment-info] Fehler beim Generieren des QR-Codes:', error)
  }

  // Prüfe ob Verkäufer TWINT hat
  let twintPhone: string | null = null
  let twintQRCodeDataUrl: string | null = null
  let twintDeepLink: string | null = null

  if (invoice.seller.paymentMethods) {
    try {
      const paymentMethods = JSON.parse(invoice.seller.paymentMethods)
      const twintMethod = paymentMethods.find((pm: any) => pm.type === 'twint')
      if (twintMethod?.phone) {
        twintPhone = twintMethod.phone

        // Generiere TWINT Deep Link (für mobile Nutzer)
        // Format: twint://pay?phone=...&amount=...&message=...
        const twintAmount = invoice.total.toFixed(2)
        const twintMessage = `Rechnung ${invoice.invoiceNumber}`
        twintDeepLink = `twint://pay?phone=${encodeURIComponent(twintPhone)}&amount=${twintAmount}&message=${encodeURIComponent(twintMessage)}`

        // Generiere TWINT QR-Code (für Desktop-Nutzer)
        // TWINT QR-Code Format: Enthält Telefonnummer, Betrag und Referenz
        const twintQRString = generateTWINTQRCodeString({
          phone: twintPhone,
          amount: invoice.total,
          message: twintMessage,
          reference: reference,
        })

        try {
          // TWINT QR-Codes benötigen höhere Fehlerkorrektur und größere Größe
          twintQRCodeDataUrl = await QRCode.toDataURL(twintQRString, {
            errorCorrectionLevel: 'H', // Höhere Fehlerkorrektur für TWINT
            type: 'image/png',
            width: 400, // Größere Größe für bessere Erkennbarkeit
            margin: 2, // Größerer Rand für bessere Erkennbarkeit
          })
        } catch (error) {
          console.error('[invoice-payment-info] Fehler beim Generieren des TWINT QR-Codes:', error)
        }
      }
    } catch (error) {
      console.error('[invoice-payment-info] Fehler beim Parsen der paymentMethods:', error)
    }
  }

  // Generiere Zahlungsanweisung
  const paymentInstructions = generatePaymentInstructions({
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total,
    currency: 'CHF',
    iban: iban,
    bic: bic,
    accountHolder: accountHolder,
    reference: reference,
    dueDate: invoice.dueDate,
  })

  return {
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.total,
    currency: 'CHF',
    reference: reference,
    iban: iban,
    bic: bic,
    accountHolder: accountHolder,
    qrCodeDataUrl,
    qrCodeString,
    twintPhone,
    twintQRCodeDataUrl,
    twintDeepLink,
    paymentInstructions,
  }
}

/**
 * Generiert TWINT QR-Code String
 * Format basierend auf TWINT-Spezifikation
 *
 * TWINT unterstützt zwei QR-Code-Formate:
 * 1. Deep Link Format (für App-zu-App Zahlungen)
 * 2. TWINT Payment Request Format (für QR-Code-Scannen)
 */
function generateTWINTQRCodeString(params: {
  phone: string
  amount: number
  message: string
  reference: string
}): string {
  const { phone, amount, message, reference } = params

  // Bereinige Telefonnummer (entferne Leerzeichen, Bindestriche, etc.)
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')

  // TWINT QR-Code Format
  // TWINT verwendet ein spezifisches Format für QR-Codes
  // Format: twint://pay?phone=...&amount=...&message=...&reference=...
  // WICHTIG: Alle Parameter müssen URL-encoded sein

  // Erstelle Deep Link für TWINT
  // Dieses Format wird von der TWINT-App erkannt, wenn der QR-Code gescannt wird
  const twintParams = new URLSearchParams({
    phone: cleanPhone,
    amount: amount.toFixed(2),
    message: message.substring(0, 140), // TWINT limitiert Nachrichten auf 140 Zeichen
    reference: reference.substring(0, 35), // TWINT limitiert Referenzen
  })

  const deepLink = `twint://pay?${twintParams.toString()}`

  return deepLink
}

/**
 * Generiert QR-Code String im Swiss QR-Bill Format
 */
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

  // Swiss QR-Bill Format (SPC = Swiss Payment Code)
  // WICHTIG: Alle Felder müssen gefüllt sein, auch wenn sie leer sind (leere Strings sind erlaubt)

  // WICHTIG: Strukturierte Adressen für Swiss QR-Bill
  // Adressfelder müssen korrekt strukturiert sein (Strasse + Hausnummer kombiniert, PLZ + Ort kombiniert)

  // Creditor Adresse strukturiert
  const creditorStreet =
    `${creditorAddress.street || ''} ${creditorAddress.streetNumber || ''}`.trim()
  const creditorCityLine =
    `${creditorAddress.postalCode || ''} ${creditorAddress.city || ''}`.trim()

  // Debtor Adresse strukturiert
  const debtorStreet = `${debtorAddress.street || ''} ${debtorAddress.streetNumber || ''}`.trim()
  const debtorCityLine = `${debtorAddress.postalCode || ''} ${debtorAddress.city || ''}`.trim()

  // Stelle sicher, dass alle Pflichtfelder gefüllt sind
  const finalCreditorName = (creditorName || 'Score-Max GmbH').trim().substring(0, 70)
  const finalCreditorStreet = creditorStreet || PAYMENT_CONFIG.getStreetLine()
  const finalCreditorCity = creditorCityLine || PAYMENT_CONFIG.getCityLine()
  const finalCreditorCountry = (creditorAddress.country || 'CH').substring(0, 2).toUpperCase()

  // WICHTIG: Debtor-Felder nur ausfüllen wenn Name vorhanden ist
  const hasDebtorInfo = !!(debtorName && debtorName.trim().length > 0)
  const finalDebtorName = hasDebtorInfo ? debtorName.trim().substring(0, 70) : ''
  const finalDebtorStreet = hasDebtorInfo ? debtorStreet.substring(0, 70) : ''
  const finalDebtorCity = hasDebtorInfo ? debtorCityLine.substring(0, 70) : ''

  // WICHTIG: Für Swiss QR-Bill sollte das Debtor-Land immer "CH" sein
  // Validiere und korrigiere Länderkürzel
  let finalDebtorCountry = ''
  if (hasDebtorInfo) {
    const debtorCountryRaw = (debtorAddress.country || 'CH').trim().toUpperCase().substring(0, 2)
    // Stelle sicher, dass es ein gültiges 2-stelliges Länderkürzel ist, sonst verwende CH
    if (/^[A-Z]{2}$/.test(debtorCountryRaw)) {
      // Für Swiss QR-Bill sollte es CH sein - korrigiere automatisch
      finalDebtorCountry = 'CH'
      if (debtorCountryRaw !== 'CH') {
        console.warn(
          '[invoice-payment-info] ⚠️  Debtor Country korrigiert von',
          debtorCountryRaw,
          'zu CH (für Swiss QR-Bill)'
        )
      }
    } else {
      finalDebtorCountry = 'CH'
    }
  }

  // Referenz bereinigen und formatieren (nur alphanumerisch, genau 25 Zeichen)
  // WICHTIG: Referenz muss genau 25 Zeichen lang sein für Swiss QR-Bill
  const formattedReference = formatQRReference(reference)

  // Betrag formatieren (immer mit 2 Dezimalstellen)
  const formattedAmount = Math.abs(amount).toFixed(2)

  // IBAN bereinigen (ohne Leerzeichen, genau 21 Zeichen)
  // Stelle sicher, dass IBAN korrekt formatiert ist
  let cleanIban = iban.replace(/\s/g, '').toUpperCase()

  // Stelle sicher, dass IBAN genau 21 Zeichen lang ist
  if (cleanIban.length > 21) {
    cleanIban = cleanIban.substring(0, 21)
  } else if (cleanIban.length < 21) {
    console.error(
      '[invoice-payment-info] ⚠️  IBAN ist zu kurz:',
      cleanIban.length,
      'Zeichen, erwartet: 21'
    )
    console.error('[invoice-payment-info] Original IBAN:', iban)
  }

  // Validiere IBAN-Format (Schweizer IBAN: CH + 2 Ziffern + 17 alphanumerische Zeichen = 21 Zeichen)
  if (!cleanIban.startsWith('CH')) {
    console.error('[invoice-payment-info] ❌ IBAN beginnt nicht mit CH:', cleanIban)
  }
  if (cleanIban.length !== 21) {
    console.error(
      '[invoice-payment-info] ❌ IBAN hat ungültige Länge:',
      cleanIban.length,
      'erwartet: genau 21'
    )
  }
  // Prüfe Format: CH + 2 Ziffern + 17 alphanumerische Zeichen
  if (!/^CH\d{2}[A-Z0-9]{17}$/.test(cleanIban)) {
    console.error('[invoice-payment-info] ❌ IBAN hat ungültiges Format:', cleanIban)
    console.error('[invoice-payment-info] Erwartet: CH + 2 Ziffern + 17 alphanumerische Zeichen')
  }

  const qrString = [
    'SPC', // QR-Type (Swiss Payments Code)
    '0200', // Version 2.0
    '1', // Coding Type (1 = UTF-8)
    cleanIban, // Creditor IBAN (ohne Leerzeichen, genau 21 Zeichen)
    'K', // Creditor Address Type (K = Structured address)
    finalCreditorName, // Creditor Name (max 70 Zeichen)
    finalCreditorStreet.substring(0, 70), // Creditor Street + Number (max 70 Zeichen)
    finalCreditorCity.substring(0, 70), // Creditor Postal Code + City (max 70 Zeichen)
    finalCreditorCountry, // Creditor Country (genau 2 Zeichen)
    '', // Ultimate creditor name (optional)
    '', // Ultimate creditor street (optional)
    '', // Ultimate creditor postal code + city (optional)
    '', // Ultimate creditor country (optional)
    formattedAmount, // Amount (immer mit 2 Dezimalstellen)
    currency.substring(0, 3), // Currency (genau 3 Zeichen)
    hasDebtorInfo ? 'K' : '', // Ultimate debtor Address Type (K = Structured, leer wenn kein Name)
    finalDebtorName, // Debtor Name (max 70 Zeichen, leer wenn kein Name)
    finalDebtorStreet, // Debtor Street + Number (max 70 Zeichen, leer wenn kein Name)
    finalDebtorCity, // Debtor Postal Code + City (max 70 Zeichen, leer wenn kein Name)
    finalDebtorCountry, // Debtor Country (2 Zeichen, leer wenn kein Name)
    'SCOR', // Reference type (SCOR = Creditor Reference)
    formattedReference, // Reference (genau 25 Zeichen, mit Leerzeichen aufgefüllt)
    '', // Additional information (optional)
    'EPD', // Trailer (End of Payment Data)
  ].join('\n')

  // Stelle sicher, dass QR-String genau 24 Zeilen hat
  const qrLines = qrString.split('\n')
  if (qrLines.length !== 24) {
    console.error(
      '[invoice-payment-info] ⚠️  QR-String hat falsche Anzahl Zeilen:',
      qrLines.length,
      'erwartet: 24'
    )
    console.error(
      '[invoice-payment-info] Zeilen:',
      qrLines.map((line, i) => `${i + 1}: ${line}`).join('\n')
    )
  }

  return qrString
}

/**
 * Generiert Zahlungsanweisung als Text
 */
function generatePaymentInstructions(params: {
  invoiceNumber: string
  amount: number
  currency: string
  iban: string
  bic: string
  accountHolder: string
  reference: string
  dueDate: Date
}): string {
  const { invoiceNumber, amount, currency, iban, bic, accountHolder, reference, dueDate } = params

  // Formatiere IBAN mit Leerzeichen (CH12 3456 7890 1234 5678 9)
  const formattedIban = iban.replace(/(.{4})/g, '$1 ').trim()
  const formattedDate = new Date(dueDate).toLocaleDateString('de-CH')

  return `
Zahlungsinformationen für Rechnung: ${invoiceNumber}

Empfänger: ${accountHolder}
IBAN: ${formattedIban}
BIC: ${bic}

Betrag: ${currency} ${amount.toFixed(2)}
Referenz: ${reference}
Fälligkeitsdatum: ${formattedDate}

Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum auf das oben angegebene Konto.
Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung zugeordnet werden kann.

Alternativ können Sie den QR-Code mit Ihrer Banking-App scannen.
  `.trim()
}
