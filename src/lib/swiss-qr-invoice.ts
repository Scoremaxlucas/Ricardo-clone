/**
 * Swiss QR-Invoice Generator
 * 
 * Verwendet die professionelle swissqrbill Bibliothek für korrekte
 * Swiss QR-Bill Generierung, die von allen Schweizer Banking-Apps akzeptiert wird.
 */

import PDFDocument from 'pdfkit'
import { SwissQRBill } from 'swissqrbill/pdf'
import { PAYMENT_CONFIG } from './payment-config'

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  // Creditor (Helvenda/Score-Max GmbH)
  creditorName: string
  creditorStreet: string
  creditorBuildingNumber: string
  creditorZip: string
  creditorCity: string
  creditorCountry: string
  creditorIBAN: string
  // Debtor (Verkäufer/Rechnungsempfänger)
  debtorName: string
  debtorStreet: string
  debtorBuildingNumber?: string
  debtorZip: string
  debtorCity: string
  debtorCountry: string
  // Invoice details
  items: Array<{
    description: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  // QR Reference (from Bexio or internal)
  qrReference?: string
  // Optional: Additional message
  message?: string
}

/**
 * Generiert eine professionelle Swiss QR-Rechnung als PDF Buffer
 */
export async function generateSwissQRInvoice(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Erstelle PDF mit A4 Format
      const pdf = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Rechnung ${data.invoiceNumber}`,
          Author: 'Helvenda',
          Subject: `Rechnung ${data.invoiceNumber}`,
          Creator: 'Helvenda Invoice System',
        },
      })

      // Sammle PDF Chunks
      const chunks: Buffer[] = []
      pdf.on('data', (chunk) => chunks.push(chunk))
      pdf.on('end', () => resolve(Buffer.concat(chunks)))
      pdf.on('error', reject)

      // === KOPFBEREICH ===
      // Logo/Firmenname
      pdf
        .fontSize(24)
        .fillColor('#0d9488') // Helvenda Teal
        .font('Helvetica-Bold')
        .text('HELVENDA', 50, 50)

      // Rechnung Titel
      pdf
        .fontSize(20)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Rechnung', 400, 50, { align: 'right' })

      // Firmenadresse (Creditor)
      pdf
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text(data.creditorName, 50, 85)
        .text(`${data.creditorStreet} ${data.creditorBuildingNumber}`, 50, 97)
        .text(`${data.creditorZip} ${data.creditorCity}`, 50, 109)

      // Rechnungsdetails (rechts)
      pdf
        .fontSize(10)
        .fillColor('#000000')
        .font('Helvetica')
        .text(`Nr. ${data.invoiceNumber}`, 400, 85, { align: 'right' })
        .text(`Datum: ${formatDate(data.invoiceDate)}`, 400, 100, { align: 'right' })
        .text(`Fällig: ${formatDate(data.dueDate)}`, 400, 115, { align: 'right' })

      // Trennlinie
      pdf
        .moveTo(50, 140)
        .lineTo(545, 140)
        .strokeColor('#e5e7eb')
        .stroke()

      // === RECHNUNGSEMPFÄNGER ===
      pdf
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Rechnungsempfänger', 50, 160)

      pdf
        .fontSize(11)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(data.debtorName, 50, 175)

      pdf
        .fontSize(10)
        .font('Helvetica')
        .text(`${data.debtorStreet}${data.debtorBuildingNumber ? ' ' + data.debtorBuildingNumber : ''}`, 50, 192)
        .text(`${data.debtorZip} ${data.debtorCity}`, 50, 207)
        .text(data.debtorCountry === 'CH' ? 'Schweiz' : data.debtorCountry, 50, 222)

      // === POSITIONEN ===
      let y = 280

      // Tabellenkopf
      pdf
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica-Bold')
        .text('Beschreibung', 50, y)
        .text('CHF', 480, y, { align: 'right' })

      y += 15

      // Trennlinie unter Kopf
      pdf
        .moveTo(50, y)
        .lineTo(545, y)
        .strokeColor('#e5e7eb')
        .stroke()

      y += 15

      // Positionen
      pdf.font('Helvetica').fillColor('#000000').fontSize(10)

      for (const item of data.items) {
        pdf.text(item.description, 50, y, { width: 400 })
        pdf.text(formatCurrency(item.total), 480, y, { align: 'right' })
        y += 20
      }

      // Trennlinie vor Summen
      y += 10
      pdf
        .moveTo(350, y)
        .lineTo(545, y)
        .strokeColor('#e5e7eb')
        .stroke()
      y += 15

      // Zwischensumme
      pdf
        .fontSize(10)
        .font('Helvetica')
        .text('Zwischensumme', 350, y)
        .text(formatCurrency(data.subtotal), 480, y, { align: 'right' })
      y += 18

      // MwSt.
      pdf
        .text(`MwSt. (${data.vatRate}%)`, 350, y)
        .text(formatCurrency(data.vatAmount), 480, y, { align: 'right' })
      y += 18

      // Trennlinie
      pdf
        .moveTo(350, y)
        .lineTo(545, y)
        .strokeColor('#000000')
        .lineWidth(1)
        .stroke()
      y += 10

      // Total
      pdf
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total CHF', 350, y)
        .text(formatCurrency(data.total), 480, y, { align: 'right' })

      // === SWISS QR-BILL ===
      // Erstelle QR-Bill Daten gemäß Swiss Payment Standards
      const qrBillData = {
        currency: 'CHF' as const,
        amount: data.total,
        creditor: {
          name: data.creditorName,
          address: data.creditorStreet,
          buildingNumber: data.creditorBuildingNumber,
          zip: data.creditorZip,
          city: data.creditorCity,
          country: data.creditorCountry,
          account: data.creditorIBAN.replace(/\s/g, ''), // IBAN ohne Leerzeichen
        },
        debtor: {
          name: data.debtorName,
          address: data.debtorStreet,
          buildingNumber: data.debtorBuildingNumber || undefined,
          zip: data.debtorZip,
          city: data.debtorCity,
          country: data.debtorCountry,
        },
        // SCOR Reference (wenn von Bexio vorhanden) oder keine Referenz
        reference: data.qrReference || undefined,
        message: data.message || `Rechnung ${data.invoiceNumber}`,
      }

      // Erstelle Swiss QR-Bill mit der professionellen Bibliothek
      const qrBill = new SwissQRBill(qrBillData, {
        language: 'DE',
        outlines: true,
        scissors: true,
      })

      // Füge QR-Bill zum PDF hinzu (wird automatisch am unteren Rand platziert)
      qrBill.attachTo(pdf)

      // Schließe PDF
      pdf.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Formatiert Datum für Schweiz (DD.MM.YYYY)
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatiert Währungsbetrag
 */
function formatCurrency(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Holt die Standard-Creditor-Daten (Helvenda/Score-Max)
 */
export function getCreditorData() {
  return {
    creditorName: PAYMENT_CONFIG.getCreditorName(),
    creditorStreet: PAYMENT_CONFIG.getStreet(),
    creditorBuildingNumber: PAYMENT_CONFIG.getBuildingNumber(),
    creditorZip: PAYMENT_CONFIG.getPostalCode(),
    creditorCity: PAYMENT_CONFIG.getCity(),
    creditorCountry: 'CH',
    creditorIBAN: PAYMENT_CONFIG.getIBAN(),
  }
}
