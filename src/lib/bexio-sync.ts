/**
 * Bexio Synchronization Service
 * 
 * Handles synchronization between Helvenda and Bexio:
 * - User → Bexio Contact sync
 * - Invoice → Bexio Invoice sync
 * - Payment matching via QR references
 */

import { prisma } from '@/lib/prisma'
import { getBexioClient, BexioContact, BexioInvoice, BexioInvoicePosition } from './bexio-client'
import { generateUniqueQRReference, parseQRReference, formatQRReferenceForDisplay } from './unique-qr-reference'

/**
 * Konvertiert einen String (cuid) in eine numerische ID für QR-Referenz
 * Verwendet einen einfachen Hash-Algorithmus
 */
function hashStringToNumber(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Bexio Configuration (these should match your Bexio setup)
const BEXIO_CONFIG = {
  DEFAULT_USER_ID: 1, // Der Hauptbenutzer in Bexio
  BANK_ACCOUNT_ID: 1, // Das Standardbankkonto für QR-Rechnungen
  LANGUAGE_ID: 1, // 1 = Deutsch
  CURRENCY_ID: 1, // 1 = CHF
  PAYMENT_TYPE_ID: 4, // QR-Rechnung
  TAX_RATE_ID: 25, // 8.1% MWST (ID kann variieren, bitte in Bexio prüfen)
  PAYMENT_TERMS_DAYS: 30, // Zahlungsfrist
}

/**
 * Synchronisiert einen Helvenda-User als Kontakt zu Bexio
 */
export async function syncUserToBexio(userId: string): Promise<number> {
  const bexio = getBexioClient()
  
  // User mit Adresse laden
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        where: { type: 'MAIN' },
        take: 1
      }
    }
  })

  if (!user) {
    throw new Error(`User ${userId} not found`)
  }

  const mainAddress = user.addresses[0]

  // Prüfen ob bereits ein Bexio-Kontakt existiert
  if (user.bexioContactId) {
    // Update existing contact
    await bexio.updateContact(user.bexioContactId, {
      name_1: user.lastName || user.name || '',
      name_2: user.firstName || '',
      mail: user.email,
      address: mainAddress?.street || undefined,
      postcode: mainAddress?.postalCode || undefined,
      city: mainAddress?.city || undefined,
      country_id: 1, // Schweiz
    })
    return user.bexioContactId
  }

  // Erst prüfen ob E-Mail bereits existiert
  const existingContact = await bexio.findContactByEmail(user.email)
  if (existingContact && existingContact.id) {
    // Link to existing contact
    await prisma.user.update({
      where: { id: userId },
      data: { bexioContactId: existingContact.id }
    })
    return existingContact.id
  }

  // Neuen Kontakt erstellen
  const newContact = await bexio.createContact({
    contact_type_id: 2, // Person
    name_1: user.lastName || user.name || 'Unbekannt',
    name_2: user.firstName || '',
    mail: user.email,
    address: mainAddress?.street || undefined,
    postcode: mainAddress?.postalCode || undefined,
    city: mainAddress?.city || undefined,
    country_id: 1, // Schweiz
  })

  // Bexio ID speichern
  await prisma.user.update({
    where: { id: userId },
    data: { bexioContactId: newContact.id }
  })

  return newContact.id!
}

/**
 * Erstellt eine Rechnung in Bexio und generiert eine eindeutige QR-Referenz
 */
export async function createBexioInvoice(invoiceId: string): Promise<{
  bexioInvoiceId: number
  qrReference: string
}> {
  const bexio = getBexioClient()

  // Invoice mit Items und User laden
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      user: true
    }
  })

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`)
  }

  // Sicherstellen dass User in Bexio existiert
  let bexioContactId = invoice.user.bexioContactId
  if (!bexioContactId) {
    bexioContactId = await syncUserToBexio(invoice.userId)
  }

  // Eindeutige QR-Referenz generieren (verwende numerischen Hash für base36 Encoding)
  const userIdHash = hashStringToNumber(invoice.userId)
  const invoiceIdHash = hashStringToNumber(invoice.id)
  const qrReference = generateUniqueQRReference(userIdHash, invoiceIdHash)

  // Datum formatieren
  const issuedDate = new Date(invoice.issuedAt)
  const dueDate = new Date(issuedDate)
  dueDate.setDate(dueDate.getDate() + BEXIO_CONFIG.PAYMENT_TERMS_DAYS)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  // Positionen erstellen
  const positions: BexioInvoicePosition[] = invoice.items.map(item => ({
    type: 'KbPositionCustom',
    amount: '1',
    text: item.description,
    unit_price: item.amount.toString(),
    tax_id: BEXIO_CONFIG.TAX_RATE_ID,
  }))

  // Bexio Rechnung erstellen
  const bexioInvoice = await bexio.createInvoice({
    title: `Helvenda Rechnung ${invoice.invoiceNumber} - Ref: ${qrReference}`,
    contact_id: bexioContactId,
    user_id: BEXIO_CONFIG.DEFAULT_USER_ID,
    is_valid_from: formatDate(issuedDate),
    is_valid_to: formatDate(dueDate),
    mwst_type: 0, // inkl. MWST
    mwst_is_net: false,
    show_position_taxes: true,
    language_id: BEXIO_CONFIG.LANGUAGE_ID,
    bank_account_id: BEXIO_CONFIG.BANK_ACCOUNT_ID,
    currency_id: BEXIO_CONFIG.CURRENCY_ID,
    payment_type_id: BEXIO_CONFIG.PAYMENT_TYPE_ID,
    header: `Vielen Dank für Ihren Verkauf auf Helvenda.\n\nBitte verwenden Sie bei der Zahlung die folgende Referenznummer:\n${formatQRReferenceForDisplay(qrReference)}`,
    footer: 'Bei Fragen kontaktieren Sie uns unter support@helvenda.ch',
    positions,
    qr_reference: qrReference,
  })

  // Rechnung als versendet markieren
  if (bexioInvoice.id) {
    await bexio.issueInvoice(bexioInvoice.id)
  }

  // QR-Referenz und Bexio ID in unserer DB speichern
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      qrReference,
      bexioInvoiceId: bexioInvoice.id,
    }
  })

  return {
    bexioInvoiceId: bexioInvoice.id!,
    qrReference
  }
}

/**
 * Verarbeitet eingehende Zahlungen und matched sie zu Rechnungen
 * Wird regelmässig via Cron-Job aufgerufen
 */
export async function processIncomingPayments(): Promise<{
  matched: number
  unmatched: number
  errors: string[]
}> {
  const bexio = getBexioClient()
  const errors: string[] = []
  let matched = 0
  let unmatched = 0

  try {
    // Letzte 7 Tage an Zahlungen holen
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const payments = await bexio.getPayments(formatDate(weekAgo), formatDate(today))

    for (const payment of payments) {
      // Überspringen wenn bereits zugeordnet
      if (payment.kb_invoice_id) {
        continue
      }

      // QR-Referenz aus Zahlungsreferenz extrahieren
      const reference = payment.reference
      if (!reference) {
        unmatched++
        continue
      }

      // Versuchen die Referenz zu parsen
      const parsed = parseQRReference(reference.replace(/\s/g, '').toUpperCase())
      
      if (!parsed.isValid || !parsed.invoiceId) {
        unmatched++
        continue
      }

      // Rechnung in unserer DB suchen
      const invoice = await prisma.invoice.findFirst({
        where: {
          qrReference: reference.replace(/\s/g, '').toUpperCase()
        }
      })

      if (!invoice) {
        // Keine Rechnung mit dieser QR-Referenz gefunden
        unmatched++
        errors.push(`No invoice found for reference: ${reference}`)
        continue
      }

      const targetInvoice = invoice

      if (!targetInvoice || !targetInvoice.bexioInvoiceId) {
        unmatched++
        continue
      }

      try {
        // Zahlung in Bexio zuordnen
        await bexio.matchPaymentToInvoice(payment.id, targetInvoice.bexioInvoiceId)

        // In unserer DB als bezahlt markieren
        await prisma.invoice.update({
          where: { id: targetInvoice.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
            paymentMatchedAt: new Date(),
            paymentMatchedAmount: parseFloat(payment.amount)
          }
        })

        matched++
      } catch (matchError: any) {
        errors.push(`Error matching payment ${payment.id}: ${matchError.message}`)
      }
    }
  } catch (error: any) {
    errors.push(`Error processing payments: ${error.message}`)
  }

  return { matched, unmatched, errors }
}

/**
 * Holt den Zahlungsstatus einer Rechnung aus Bexio
 */
export async function getInvoicePaymentStatus(invoiceId: string): Promise<{
  isPaid: boolean
  paidAmount: number | null
  paidAt: Date | null
}> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  })

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`)
  }

  // Falls bereits als bezahlt markiert
  if (invoice.status === 'paid' && invoice.paidAt) {
    return {
      isPaid: true,
      paidAmount: invoice.paymentMatchedAmount ? Number(invoice.paymentMatchedAmount) : null,
      paidAt: invoice.paidAt
    }
  }

  // Falls Bexio-Rechnung existiert, Status dort prüfen
  if (invoice.bexioInvoiceId) {
    const bexio = getBexioClient()
    const bexioInvoice = await bexio.getInvoice(invoice.bexioInvoiceId)
    
    // Status 9 = Bezahlt in Bexio
    // @ts-ignore - Bexio API gibt kb_item_status_id zurück
    if ((bexioInvoice as any).kb_item_status_id === 9) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'paid',
          paidAt: new Date()
        }
      })
      
      return {
        isPaid: true,
        paidAmount: parseFloat(bexioInvoice.total || '0'),
        paidAt: new Date()
      }
    }
  }

  return {
    isPaid: false,
    paidAmount: null,
    paidAt: null
  }
}
