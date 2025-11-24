import { prisma } from './prisma'
import { PAYMENT_CONFIG } from './payment-config'
import QRCode from 'qrcode'

/**
 * Generiert Zahlungsinformationen für eine Rechnung
 * Ricardo-Style: Banküberweisung, TWINT, Kreditkarte
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
              title: true
            }
          }
        }
      }
    }
  })

  if (!invoice) {
    throw new Error('Rechnung nicht gefunden')
  }

  // Verwende Plattform-IBAN für Rechnungszahlungen
  const iban = PAYMENT_CONFIG.getIbanWithoutSpaces()
  const bic = PAYMENT_CONFIG.bic
  const accountHolder = PAYMENT_CONFIG.creditorName

  // Generiere Referenz (Rechnungsnummer als Referenz)
  const reference = invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '').substring(0, 25)

  // Generiere QR-Code String (Swiss QR-Bill Format)
  // Stelle sicher, dass alle Adressfelder gefüllt sind (Swiss QR-Bill erfordert alle Felder)
  const debtorName = invoice.seller.name || `${invoice.seller.firstName || ''} ${invoice.seller.lastName || ''}`.trim() || invoice.seller.email || 'Zahler'
  const debtorStreet = (invoice.seller.street || '').trim()
  const debtorStreetNumber = (invoice.seller.streetNumber || '').trim()
  const debtorPostalCode = (invoice.seller.postalCode || '').trim()
  const debtorCity = (invoice.seller.city || '').trim()
  const debtorCountry = invoice.seller.country || 'CH'
  
  // Wenn Adresse unvollständig ist, verwende Standardwerte (Swiss QR-Bill erfordert alle Felder)
  const finalDebtorAddress = {
    street: debtorStreet || 'Nicht angegeben',
    streetNumber: debtorStreetNumber || '',
    postalCode: debtorPostalCode || '0000',
    city: debtorCity || 'Schweiz',
    country: debtorCountry
  }
  
  const qrCodeString = generateQRCodeString({
    iban: iban,
    amount: invoice.total,
    currency: 'CHF',
    reference: reference,
    creditorName: accountHolder,
    creditorAddress: PAYMENT_CONFIG.address,
    debtorName: debtorName,
    debtorAddress: finalDebtorAddress
  })

  // Generiere QR-Code als Data URL
  let qrCodeDataUrl: string | undefined
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1
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
          reference: reference
        })
        
        try {
          // TWINT QR-Codes benötigen höhere Fehlerkorrektur und größere Größe
          twintQRCodeDataUrl = await QRCode.toDataURL(twintQRString, {
            errorCorrectionLevel: 'H', // Höhere Fehlerkorrektur für TWINT
            type: 'image/png',
            width: 400, // Größere Größe für bessere Erkennbarkeit
            margin: 2 // Größerer Rand für bessere Erkennbarkeit
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
    dueDate: invoice.dueDate
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
    paymentInstructions
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
    reference: reference.substring(0, 35) // TWINT limitiert Referenzen
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
    debtorAddress
  } = params

  // Swiss QR-Bill Format (SPC = Swiss Payment Code)
  // WICHTIG: Alle Felder müssen gefüllt sein, auch wenn sie leer sind (leere Strings sind erlaubt)
  
  // Bereinige und formatiere Adressfelder
  const creditorStreet = `${creditorAddress.street || ''} ${creditorAddress.streetNumber || ''}`.trim()
  const creditorCityLine = `${creditorAddress.postalCode || ''} ${creditorAddress.city || ''}`.trim()
  const debtorStreet = `${debtorAddress.street || ''} ${debtorAddress.streetNumber || ''}`.trim()
  const debtorCityLine = `${debtorAddress.postalCode || ''} ${debtorAddress.city || ''}`.trim()
  
  // Stelle sicher, dass alle Pflichtfelder gefüllt sind
  const finalCreditorName = creditorName.trim() || 'Score-Max GmbH'
  const finalCreditorStreet = creditorStreet || PAYMENT_CONFIG.getStreetLine()
  const finalCreditorCity = creditorCityLine || PAYMENT_CONFIG.getCityLine()
  const finalCreditorCountry = creditorAddress.country || 'CH'
  
  const finalDebtorName = debtorName.trim() || 'Zahler'
  const finalDebtorStreet = debtorStreet || 'Nicht angegeben'
  const finalDebtorCity = debtorCityLine || 'Schweiz'
  const finalDebtorCountry = debtorAddress.country || 'CH'
  
  return [
    'SPC',                    // QR-Type
    '0200',                   // Version
    '1',                      // Coding Type (UTF-8)
    iban.replace(/\s/g, ''),  // Creditor IBAN (ohne Leerzeichen)
    'K',                      // Creditor Address Type (K = structured)
    finalCreditorName.substring(0, 70), // Creditor Name (max 70 Zeichen)
    finalCreditorStreet.substring(0, 70), // Creditor Street (max 70 Zeichen)
    finalCreditorCity.substring(0, 70), // Creditor City (max 70 Zeichen)
    finalCreditorCountry,     // Creditor Country
    '',                        // Ultimate creditor (optional)
    '',                        // Ultimate creditor street (optional)
    '',                        // Ultimate creditor city (optional)
    '',                        // Ultimate creditor country (optional)
    `${amount.toFixed(2)}`,    // Amount
    currency,                  // Currency
    'K',                      // Ultimate debtor Address Type
    finalDebtorName.substring(0, 70), // Debtor Name (max 70 Zeichen)
    finalDebtorStreet.substring(0, 70), // Debtor Street (max 70 Zeichen)
    finalDebtorCity.substring(0, 70), // Debtor City (max 70 Zeichen)
    finalDebtorCountry,       // Debtor Country
    'SCOR',                   // Reference Type (SCOR = Creditor Reference)
    reference.padEnd(25, ' ').substring(0, 25), // Reference (max 25 Zeichen, mit Leerzeichen aufgefüllt)
    '',                        // Additional information (optional)
    'EPD'                      // Trailer (End of Payment Data)
  ].join('\n')
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

