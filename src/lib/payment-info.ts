import { prisma } from './prisma'
import { PAYMENT_CONFIG } from './payment-config'
import QRCode from 'qrcode'

/**
 * Generiert Zahlungsinformationen für einen Kauf
 * Ricardo-Style: Automatische IBAN, QR-Rechnung, Zahlungsanweisung
 */
export interface PaymentInfo {
  iban: string
  bic: string
  accountHolder: string
  amount: number
  currency: string
  reference: string
  qrCodeDataUrl?: string
  qrCodeString?: string
  paymentInstructions: string
  twintPhone?: string | null // TWINT Telefonnummer des Verkäufers
  twintQRCodeDataUrl?: string | null // TWINT QR-Code für Zahlung
  twintDeepLink?: string | null // TWINT Deep Link für mobile Zahlung
  hasSellerBankDetails: boolean // true wenn Verkäufer eigene IBAN hat, false wenn Plattform-IBAN verwendet wird
}

/**
 * Generiert Zahlungsinformationen für einen Purchase
 */
export async function generatePaymentInfo(purchaseId: string): Promise<PaymentInfo> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      watch: {
        include: {
          seller: true
        }
      },
      buyer: true
    }
  })

  if (!purchase) {
    throw new Error('Purchase nicht gefunden')
  }

  // Hole Verkäufer-Zahlungsinformationen
  const seller = purchase.watch.seller
  let sellerIban: string | null = null
  let sellerBic: string | null = null
  let accountHolder: string | null = null
  let twintPhone: string | null = null

  // Extrahiere Zahlungsmethoden aus paymentMethods
  if (seller.paymentMethods) {
    try {
      const paymentMethods = JSON.parse(seller.paymentMethods)
      
      // Suche nach Bank-Überweisung
      const bankMethod = paymentMethods.find((pm: any) => pm.type === 'bank')
      if (bankMethod?.iban) {
        sellerIban = bankMethod.iban.replace(/\s/g, '')
        accountHolder = `${bankMethod.accountHolderFirstName || ''} ${bankMethod.accountHolderLastName || ''}`.trim() || seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || seller.email
        sellerBic = bankMethod.bic || PAYMENT_CONFIG.bic // BIC ist optional, Fallback
      }
      
      // Suche nach TWINT
      const twintMethod = paymentMethods.find((pm: any) => pm.type === 'twint')
      if (twintMethod?.phone) {
        twintPhone = twintMethod.phone
      }
    } catch (error) {
      console.error('[payment-info] Fehler beim Parsen der paymentMethods:', error)
    }
  }

  // Wenn keine IBAN gefunden wurde, werfe einen Fehler
  // Der Verkäufer muss eigene Bankdaten hinterlegen
  if (!sellerIban) {
    throw new Error('Der Verkäufer hat keine Bankdaten hinterlegt. Bitte kontaktieren Sie den Verkäufer direkt, um die Zahlungsmodalitäten zu klären.')
  }

  // Berechne Gesamtbetrag (Kaufpreis + Versand)
  const { getShippingCost } = await import('./shipping')
  let shippingCost = 0
  if (purchase.shippingMethod) {
    try {
      const shippingMethods = typeof purchase.shippingMethod === 'string' 
        ? JSON.parse(purchase.shippingMethod) 
        : purchase.shippingMethod
      shippingCost = getShippingCost(shippingMethods)
    } catch (error) {
      console.error('[payment-info] Fehler beim Berechnen der Versandkosten:', error)
    }
  }

  const totalAmount = (purchase.price || purchase.watch.price || 0) + shippingCost

  // Generiere Referenz (Purchase-ID als Referenz)
  const reference = `PUR-${purchaseId.substring(0, 8).toUpperCase()}`

  // Generiere QR-Code String (Swiss QR-Bill Format)
  const qrCodeString = generateQRCodeString({
    iban: sellerIban,
    amount: totalAmount,
    currency: 'CHF',
    reference: reference,
    creditorName: accountHolder,
    creditorAddress: {
      street: seller.street || PAYMENT_CONFIG.address.street,
      streetNumber: seller.streetNumber || PAYMENT_CONFIG.address.streetNumber,
      postalCode: seller.postalCode || PAYMENT_CONFIG.address.postalCode,
      city: seller.city || PAYMENT_CONFIG.address.city,
      country: seller.country || PAYMENT_CONFIG.address.country
    },
    debtorName: `${purchase.buyer.firstName || ''} ${purchase.buyer.lastName || ''}`.trim() || purchase.buyer.name || 'Käufer',
    debtorAddress: {
      street: purchase.buyer.street || '',
      streetNumber: purchase.buyer.streetNumber || '',
      postalCode: purchase.buyer.postalCode || '',
      city: purchase.buyer.city || '',
      country: purchase.buyer.country || 'CH'
    }
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
    console.error('[payment-info] Fehler beim Generieren des QR-Codes:', error)
  }

  // Generiere Zahlungsanweisung
  const paymentInstructions = generatePaymentInstructions({
    amount: totalAmount,
    currency: 'CHF',
    iban: sellerIban,
    bic: sellerBic,
    accountHolder: accountHolder,
    reference: reference,
    productTitle: purchase.watch.title
  })

  // Generiere TWINT QR-Code und Deep Link (falls TWINT vorhanden)
  let twintQRCodeDataUrl: string | null = null
  let twintDeepLink: string | null = null
  
  if (twintPhone) {
    // Generiere TWINT Deep Link
    const twintAmount = totalAmount.toFixed(2)
    const twintMessage = `Kauf: ${purchase.watch.title}`
    twintDeepLink = `twint://pay?phone=${encodeURIComponent(twintPhone)}&amount=${twintAmount}&message=${encodeURIComponent(twintMessage)}&reference=${encodeURIComponent(reference)}`
    
    // Generiere TWINT QR-Code
    try {
      twintQRCodeDataUrl = await QRCode.toDataURL(twintDeepLink, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1
      })
    } catch (error) {
      console.error('[payment-info] Fehler beim Generieren des TWINT QR-Codes:', error)
    }
  }

  return {
    iban: sellerIban,
    bic: sellerBic || PAYMENT_CONFIG.bic,
    accountHolder: accountHolder || PAYMENT_CONFIG.creditorName,
    amount: totalAmount,
    currency: 'CHF',
    reference: reference,
    qrCodeDataUrl,
    qrCodeString,
    paymentInstructions,
    twintPhone: twintPhone || null,
    twintQRCodeDataUrl,
    twintDeepLink,
    hasSellerBankDetails: true // Immer true, da wir einen Fehler werfen, wenn keine IBAN vorhanden ist
  }
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
  return [
    'SPC',                    // QR-Type
    '0200',                   // Version
    '1',                      // Coding Type (UTF-8)
    iban.replace(/\s/g, ''),  // Creditor IBAN (ohne Leerzeichen)
    'K',                      // Creditor Address Type (K = structured)
    creditorName.substring(0, 70), // Creditor Name (max 70 Zeichen)
    `${creditorAddress.street} ${creditorAddress.streetNumber}`.substring(0, 70), // Creditor Street
    `${creditorAddress.postalCode} ${creditorAddress.city}`.substring(0, 70), // Creditor City
    creditorAddress.country,   // Creditor Country
    '',                        // Ultimate creditor (optional)
    '',                        // Ultimate creditor street (optional)
    '',                        // Ultimate creditor city (optional)
    '',                        // Ultimate creditor country (optional)
    `${amount.toFixed(2)}`,    // Amount
    currency,                  // Currency
    'K',                      // Ultimate debtor Address Type
    debtorName.substring(0, 70), // Debtor Name
    `${debtorAddress.street} ${debtorAddress.streetNumber}`.substring(0, 70), // Debtor Street
    `${debtorAddress.postalCode} ${debtorAddress.city}`.substring(0, 70), // Debtor City
    debtorAddress.country,     // Debtor Country
    'SCOR',                   // Reference Type (SCOR = Creditor Reference)
    reference.padEnd(25, ' ').substring(0, 25), // Reference (max 25 Zeichen)
    '',                        // Additional information (optional)
    'EPD'                      // Trailer (End of Payment Data)
  ].join('\n')
}

/**
 * Generiert Zahlungsanweisung als Text
 */
function generatePaymentInstructions(params: {
  amount: number
  currency: string
  iban: string
  bic: string
  accountHolder: string
  reference: string
  productTitle: string
}): string {
  const { amount, currency, iban, bic, accountHolder, reference, productTitle } = params

  // Formatiere IBAN mit Leerzeichen (CH12 3456 7890 1234 5678 9)
  const formattedIban = iban.replace(/(.{4})/g, '$1 ').trim()

  return `
Zahlungsinformationen für: ${productTitle}

Empfänger: ${accountHolder}
IBAN: ${formattedIban}
BIC: ${bic}

Betrag: CHF ${amount.toFixed(2)}
Referenz: ${reference}

Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf das oben angegebene Konto.
Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung zugeordnet werden kann.

Alternativ können Sie den QR-Code mit Ihrer Banking-App scannen.
  `.trim()
}

/**
 * Setzt Zahlungsfrist (14 Tage nach Kontaktaufnahme)
 */
export async function setPaymentDeadline(purchaseId: string, contactedAt: Date): Promise<void> {
  const paymentDeadline = new Date(contactedAt)
  paymentDeadline.setDate(paymentDeadline.getDate() + 14) // 14 Tage nach Kontaktaufnahme

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      paymentDeadline: paymentDeadline
    }
  })
}

