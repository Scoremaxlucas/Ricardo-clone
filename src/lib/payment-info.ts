import QRCode from 'qrcode'
import { PAYMENT_CONFIG } from './payment-config'
import { prisma } from './prisma'
import { generateSCORReference, getReferenceType } from './qr-reference-scor'

/**
 * Generiert Zahlungsinformationen für einen Kauf
 * Automatische IBAN, QR-Rechnung, Zahlungsanweisung
 */
export interface PaymentInfo {
  iban: string
  bic: string
  accountHolder: string
  amount: number
  currency: string
  reference: string
  referenceType?: 'SCOR' | 'NON' // Reference type for Swiss QR-Bill
  qrCodeDataUrl?: string
  qrCodeString?: string
  paymentInstructions: string
  twintPhone?: string | null // TWINT Telefonnummer des Verkäufers
  twintQRCodeDataUrl?: string | null // TWINT QR-Code für Zahlung
  twintDeepLink?: string | null // TWINT Deep Link für mobile Zahlung
  hasSellerBankDetails: boolean // true wenn Verkäufer eigene IBAN hat, false wenn Plattform-IBAN verwendet wird
  hasStripePayment: boolean // true if paid via Stripe (protected), false if bank transfer (unprotected)
  paymentProtectionEnabled: boolean // true if watch has payment protection enabled
}

/**
 * Generiert Zahlungsinformationen für einen Purchase
 */
export async function generatePaymentInfo(purchaseId: string): Promise<PaymentInfo> {
  // WICHTIG: Explizites select um disputeInitiatedBy zu vermeiden (P2022)
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: {
      id: true,
      price: true,
      watchId: true,
      buyerId: true,
      shippingMethod: true,
      // disputeInitiatedBy wird NICHT selektiert
      watch: {
        select: {
          id: true,
          title: true,
          price: true,
          sellerId: true,
          shippingMethod: true,
          paymentProtectionEnabled: true,
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              paymentMethods: true,
              stripeConnectedAccountId: true,
              street: true,
              streetNumber: true,
              postalCode: true,
              city: true,
              country: true,
            },
          },
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          street: true,
          streetNumber: true,
          postalCode: true,
          city: true,
          country: true,
        },
      },
    },
  })

  if (!purchase) {
    throw new Error('Purchase nicht gefunden')
  }

  // Check if there's a Stripe payment (protected) or bank transfer (unprotected)
  // Query Order separately to check for Stripe payment
  const order = await prisma.order.findFirst({
    where: {
      watchId: purchase.watchId,
      buyerId: purchase.buyerId,
    },
    select: {
      id: true,
      stripePaymentIntentId: true,
      stripeChargeId: true,
      paymentStatus: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const hasStripePayment = !!(order?.stripePaymentIntentId || order?.stripeChargeId)
  const paymentProtectionEnabled = purchase.watch.paymentProtectionEnabled || false

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
        accountHolder =
          `${bankMethod.accountHolderFirstName || ''} ${bankMethod.accountHolderLastName || ''}`.trim() ||
          seller.name ||
          `${seller.firstName || ''} ${seller.lastName || ''}`.trim() ||
          seller.email
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
    throw new Error(
      'Der Verkäufer hat keine Bankdaten hinterlegt. Bitte kontaktieren Sie den Verkäufer direkt, um die Zahlungsmodalitäten zu klären.'
    )
  }

  // Berechne Gesamtbetrag (Kaufpreis + Versand)
  const { getShippingCostForMethod } = await import('./shipping')
  let shippingCost = 0
  if (purchase.shippingMethod) {
    try {
      // shippingMethod kann jetzt ein einzelner String sein (gewählte Methode) oder ein Array (Legacy)
      let method: string | null = null
      if (typeof purchase.shippingMethod === 'string') {
        // Prüfe ob es ein JSON-Array ist oder ein einzelner String
        try {
          const parsed = JSON.parse(purchase.shippingMethod)
          if (Array.isArray(parsed) && parsed.length > 0) {
            method = parsed[0] // Nimm erste Methode für Legacy-Kompatibilität
          } else {
            method = purchase.shippingMethod // Einzelner String
          }
        } catch {
          // Kein JSON, also einzelner String
          method = purchase.shippingMethod
        }
      } else if (
        Array.isArray(purchase.shippingMethod) &&
        (purchase.shippingMethod as any[]).length > 0
      ) {
        method = (purchase.shippingMethod as any[])[0] // Legacy: Nimm erste Methode
      }

      if (method) {
        shippingCost = getShippingCostForMethod(method as any)
      }
    } catch (error) {
      console.error('[payment-info] Fehler beim Berechnen der Versandkosten:', error)
    }
  }

  const totalAmount = (purchase.price || purchase.watch.price || 0) + shippingCost

  // Generiere Referenz: SCOR (RF...) für bessere Kompatibilität
  const referenceType = getReferenceType(sellerIban)
  const reference =
    referenceType === 'SCOR' ? generateSCORReference(purchaseId) : ''.padEnd(25, ' ')

  // Generiere QR-Code String (Swiss QR-Bill Format)
  const qrCodeString = generateQRCodeString({
    iban: sellerIban,
    amount: totalAmount,
    currency: 'CHF',
    reference: reference,
    referenceType: referenceType,
    creditorName: accountHolder || PAYMENT_CONFIG.creditorName,
    creditorAddress: {
      street: seller.street || PAYMENT_CONFIG.address.street,
      streetNumber: seller.streetNumber || PAYMENT_CONFIG.address.streetNumber,
      postalCode: seller.postalCode || PAYMENT_CONFIG.address.postalCode,
      city: seller.city || PAYMENT_CONFIG.address.city,
      country: seller.country || PAYMENT_CONFIG.address.country,
    },
    debtorName:
      `${purchase.buyer.firstName || ''} ${purchase.buyer.lastName || ''}`.trim() ||
      purchase.buyer.name ||
      'Käufer',
    debtorAddress: {
      street: purchase.buyer.street || '',
      streetNumber: purchase.buyer.streetNumber || '',
      postalCode: purchase.buyer.postalCode || '',
      city: purchase.buyer.city || '',
      country: purchase.buyer.country || 'CH',
    },
  })

  // Generiere QR-Code als Data URL
  let qrCodeDataUrl: string | undefined
  try {
    qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
    })
  } catch (error) {
    console.error('[payment-info] Fehler beim Generieren des QR-Codes:', error)
  }

  // Generiere Zahlungsanweisung
  const paymentInstructions = generatePaymentInstructions({
    amount: totalAmount,
    currency: 'CHF',
    iban: sellerIban,
    bic: sellerBic || PAYMENT_CONFIG.bic,
    accountHolder: accountHolder || PAYMENT_CONFIG.creditorName,
    reference: reference,
    productTitle: purchase.watch.title,
  })

  // Generiere TWINT QR-Code und Deep Link (falls TWINT vorhanden)
  let twintQRCodeDataUrl: string | null = null
  let twintDeepLink: string | null = null

  if (twintPhone) {
    // Generiere TWINT Deep Link
    const twintAmount = totalAmount.toFixed(2)
    const twintMessage = `Kauf: ${purchase.watch.title}`
    twintDeepLink = `twint://pay?phone=${encodeURIComponent(twintPhone || '')}&amount=${twintAmount}&message=${encodeURIComponent(twintMessage)}&reference=${encodeURIComponent(reference)}`

    // Generiere TWINT QR-Code
    try {
      twintQRCodeDataUrl = await QRCode.toDataURL(twintDeepLink, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
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
    reference: reference.trim(), // Return trimmed reference for display
    referenceType: referenceType, // Include reference type
    qrCodeDataUrl,
    qrCodeString,
    paymentInstructions,
    twintPhone: twintPhone || null,
    twintQRCodeDataUrl,
    twintDeepLink,
    hasSellerBankDetails: true, // Immer true, da wir einen Fehler werfen, wenn keine IBAN vorhanden ist
    hasStripePayment, // true if paid via Stripe (protected), false if bank transfer (unprotected)
    paymentProtectionEnabled, // from watch
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
  referenceType: 'SCOR' | 'NON'
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
  return [
    'SPC', // QR-Type
    '0200', // Version
    '1', // Coding Type (UTF-8)
    iban.replace(/\s/g, ''), // Creditor IBAN (ohne Leerzeichen)
    'K', // Creditor Address Type (K = structured)
    creditorName.substring(0, 70), // Creditor Name (max 70 Zeichen)
    `${creditorAddress.street} ${creditorAddress.streetNumber}`.substring(0, 70), // Creditor Street
    `${creditorAddress.postalCode} ${creditorAddress.city}`.substring(0, 70), // Creditor City
    creditorAddress.country, // Creditor Country
    '', // Ultimate creditor (optional)
    '', // Ultimate creditor street (optional)
    '', // Ultimate creditor city (optional)
    '', // Ultimate creditor country (optional)
    `${amount.toFixed(2)}`, // Amount
    currency, // Currency
    'K', // Ultimate debtor Address Type
    debtorName.substring(0, 70), // Debtor Name
    `${debtorAddress.street} ${debtorAddress.streetNumber}`.substring(0, 70), // Debtor Street
    `${debtorAddress.postalCode} ${debtorAddress.city}`.substring(0, 70), // Debtor City
    debtorAddress.country, // Debtor Country
    params.referenceType, // Reference Type (SCOR or NON)
    params.reference.substring(0, 25).padEnd(25, ' '), // Reference (exactly 25 characters)
    '', // Additional information (optional)
    'EPD', // Trailer (End of Payment Data)
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
  const { amount, iban, bic, accountHolder, reference, productTitle } = params

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
      paymentDeadline: paymentDeadline,
    },
  })
}
