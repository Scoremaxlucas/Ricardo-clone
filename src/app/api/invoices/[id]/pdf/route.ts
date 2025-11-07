import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { PAYMENT_CONFIG } from '@/lib/payment-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Hole Rechnung
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            watch: {
              select: {
                id: true,
                title: true,
                brand: true,
                model: true
              }
            }
          }
        },
        seller: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { message: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob der User berechtigt ist (nur der Verkäufer darf seine Rechnung sehen)
    if (invoice.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Zugriff verweigert' },
        { status: 403 }
      )
    }

    // Erstelle PDF
    const pdf = new jsPDF()

    // Header
    pdf.setFontSize(20)
    pdf.setTextColor(0, 0, 0)
    pdf.text('Rechnung', 20, 20)

    // Rechnungsnummer und Datum
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Rechnungsnummer: ${invoice.invoiceNumber}`, 20, 35)
    pdf.text(`Datum: ${new Date(invoice.createdAt).toLocaleDateString('de-CH')}`, 20, 42)
    pdf.text(`Fälligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString('de-CH')}`, 20, 49)

    // Rechnungsadresse
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    let yPos = 65
    if (invoice.seller.firstName && invoice.seller.lastName) {
      pdf.text(`${invoice.seller.firstName} ${invoice.seller.lastName}`, 20, yPos)
      yPos += 8
    }
    if (invoice.seller.companyName) {
      pdf.text(invoice.seller.companyName, 20, yPos)
      yPos += 8
    }
    if (invoice.seller.street && invoice.seller.streetNumber) {
      pdf.text(`${invoice.seller.street} ${invoice.seller.streetNumber}`, 20, yPos)
      yPos += 8
    }
    if (invoice.seller.postalCode && invoice.seller.city) {
      pdf.text(`${invoice.seller.postalCode} ${invoice.seller.city}`, 20, yPos)
      yPos += 8
    }
    if (invoice.seller.country) {
      pdf.text(invoice.seller.country, 20, yPos)
    }

    // Tabelle
    yPos = 100
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Beschreibung', 20, yPos)
    pdf.text('Betrag', 170, yPos)
    yPos += 8

    // Linie über Tabelle
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPos, 190, yPos)
    yPos += 10

    // Items
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    for (const item of invoice.items) {
      const description = item.watch 
        ? `${item.description} (${item.watch.brand} ${item.watch.model})`
        : item.description
      
      // Zeilenumbruch für lange Beschreibungen
      const lines = pdf.splitTextToSize(description, 140)
      
      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], 20, yPos)
        if (i === 0) {
          pdf.text(`CHF ${item.total.toFixed(2)}`, 170, yPos)
        }
        yPos += 6
      }
      yPos += 2
    }

    // Summary
    yPos += 10
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPos, 190, yPos)
    yPos += 10

    pdf.text('Zwischensumme:', 20, yPos)
    pdf.text(`CHF ${invoice.subtotal.toFixed(2)}`, 170, yPos)
    yPos += 10

    pdf.text(`MwSt (${invoice.vatRate * 100}%):`, 20, yPos)
    pdf.text(`CHF ${invoice.vatAmount.toFixed(2)}`, 170, yPos)
    yPos += 10

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Total:', 20, yPos)
    pdf.text(`CHF ${invoice.total.toFixed(2)}`, 170, yPos)

    // Zahlungsinformationen
    yPos += 20
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Zahlungsinformationen:', 20, yPos)
    yPos += 10
    
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Zugunsten von: ${PAYMENT_CONFIG.creditorName}`, 20, yPos)
    yPos += 7
    pdf.text(`IBAN: ${PAYMENT_CONFIG.iban}`, 20, yPos)
    yPos += 7
    pdf.text(`BIC/SWIFT: ${PAYMENT_CONFIG.bic}`, 20, yPos)
    yPos += 7
    pdf.text(`Verwendungszweck: ${invoice.invoiceNumber}`, 20, yPos)
    yPos += 7
    pdf.text(`Betrag: CHF ${invoice.total.toFixed(2)}`, 20, yPos)

    // QR-Code (Swiss QR-Bill Format)
    try {
      const iban = PAYMENT_CONFIG.getIbanWithoutSpaces()
      const creditorName = PAYMENT_CONFIG.creditorName
      const creditorAddress = PAYMENT_CONFIG.address
      
      // Swiss QR-Bill Format (SPC - Swiss Payments Code)
      // Version 2.0 Format
      const debtorName = invoice.seller.firstName && invoice.seller.lastName 
        ? `${invoice.seller.firstName} ${invoice.seller.lastName}`
        : invoice.seller.companyName || invoice.seller.name || ''
      
      const debtorStreet = invoice.seller.street && invoice.seller.streetNumber
        ? `${invoice.seller.street} ${invoice.seller.streetNumber}`
        : ''
      
      const debtorCity = invoice.seller.postalCode && invoice.seller.city
        ? `${invoice.seller.postalCode} ${invoice.seller.city}`
        : ''
      
      const qrString = [
        'SPC',                    // QR-Type
        '0200',                   // Version
        '1',                      // Coding Type (UTF-8)
        iban,                     // IBAN
        'K',                      // Creditor Address Type (K = Structured address)
        creditorName,             // Creditor Name
        PAYMENT_CONFIG.getStreetLine(),  // Street + Street Number
        PAYMENT_CONFIG.getCityLine(),    // Postal code + City
        creditorAddress.country,  // Country
        '',                       // Ultimate creditor name (optional)
        '',                       // Ultimate creditor address (optional)
        '',                       // Ultimate creditor city (optional)
        '',                       // Ultimate creditor country (optional)
        invoice.total.toFixed(2), // Amount
        'CHF',                    // Currency
        debtorName ? 'K' : '',    // Ultimate debtor address type (K = Structured, leer wenn kein Name)
        debtorName,               // Ultimate debtor name
        debtorStreet,             // Ultimate debtor street
        debtorCity,               // Ultimate debtor city
        invoice.seller.country || 'CH',  // Ultimate debtor country
        'SCOR',                   // Reference type (SCOR = Creditor Reference)
        invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '').padEnd(25, ' ').substring(0, 25), // Reference (max 25 Zeichen, nur alphanumerisch)
        '',                       // Additional information (optional)
        'EPD'                     // Trailer (End of Payment Data)
      ].join('\n')
      
      // Generate QR-Code
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 150,
        margin: 1
      })
      
      // Füge QR-Code hinzu (rechts neben Zahlungsinformationen)
      pdf.addImage(qrCodeDataUrl, 'PNG', 140, yPos - 40, 50, 50)
    } catch (error) {
      console.error('Error generating QR code:', error)
      // QR-Code wird ignoriert, PDF ohne QR-Code weitergeben
    }

    // PDF als Buffer zurückgeben
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung_${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { message: 'Fehler beim Erstellen des PDFs: ' + error.message },
      { status: 500 }
    )
  }
}

