/**
 * Swiss QR-Invoice PDF Generation v2
 *
 * Verwendet die professionelle swissqrbill Bibliothek für 100% korrekte
 * Swiss QR-Bill Generierung, die von allen Schweizer Banking-Apps akzeptiert wird.
 */

import { getMainAddress } from '@/lib/address'
import { authOptions } from '@/lib/auth'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { SwissQRBill } from 'swissqrbill/pdf'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Hole Rechnung aus DB
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            watch: {
              select: {
                title: true,
                brand: true,
                model: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    // Berechtigungsprüfung
    const isOwner = invoice.sellerId === session.user.id
    const isAdmin = (session.user as any).isAdmin === true

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'Keine Berechtigung' }, { status: 403 })
    }

    // Hole Verkäufer-Adresse
    const sellerAddress = await getMainAddress(invoice.sellerId)

    // Erstelle Verkäufer-Name
    const sellerName = invoice.seller?.companyName
      || (invoice.seller?.firstName && invoice.seller?.lastName
        ? `${invoice.seller.firstName} ${invoice.seller.lastName}`
        : invoice.seller?.name || 'Unbekannt')

    // === PDF GENERIERUNG ===
    const pdfBuffer = await generateInvoicePDF({
      invoice,
      sellerName,
      sellerAddress,
    })

    // Response als PDF (Buffer zu Uint8Array konvertieren für NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Rechnung-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error: any) {
    console.error('[pdf-v2] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler beim Generieren der Rechnung', error: error.message },
      { status: 500 }
    )
  }
}

interface GenerateInvoicePDFParams {
  invoice: any
  sellerName: string
  sellerAddress: any
}

async function generateInvoicePDF({ invoice, sellerName, sellerAddress }: GenerateInvoicePDFParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // A4 PDF erstellen
      const pdf = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Rechnung ${invoice.invoiceNumber}`,
          Author: 'Helvenda',
          Subject: `Helvenda Rechnung ${invoice.invoiceNumber}`,
          Creator: 'Helvenda Invoice System',
        },
      })

      // Buffer sammeln
      const chunks: Buffer[] = []
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdf.on('end', () => resolve(Buffer.concat(chunks)))
      pdf.on('error', reject)

      // === HEADER ===
      // Helvenda Logo/Name
      pdf
        .fontSize(24)
        .fillColor('#0d9488')
        .font('Helvetica-Bold')
        .text('HELVENDA', 50, 50)

      // "Rechnung" Titel
      pdf
        .fontSize(18)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Rechnung', 450, 50, { align: 'right' })

      // Firmenadresse (Score-Max GmbH)
      pdf
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text(PAYMENT_CONFIG.creditorName, 50, 85)
        .text(PAYMENT_CONFIG.getStreetLine(), 50, 97)
        .text(PAYMENT_CONFIG.getCityLine(), 50, 109)

      // Rechnungsdetails (rechts)
      pdf
        .fontSize(10)
        .fillColor('#000000')
        .font('Helvetica')
        .text(`Nr. ${invoice.invoiceNumber}`, 450, 85, { align: 'right' })
        .text(`Datum: ${formatDate(invoice.createdAt)}`, 450, 100, { align: 'right' })
        .text(`Fällig: ${formatDate(invoice.dueDate)}`, 450, 115, { align: 'right' })

      // Trennlinie
      pdf
        .moveTo(50, 135)
        .lineTo(545, 135)
        .strokeColor('#e5e7eb')
        .stroke()

      // === RECHNUNGSEMPFÄNGER ===
      pdf
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text('Rechnungsempfänger', 50, 155)

      pdf
        .fontSize(11)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(sellerName, 50, 172)

      if (sellerAddress) {
        pdf
          .fontSize(10)
          .font('Helvetica')
          .text(`${sellerAddress.street || ''} ${sellerAddress.streetNumber || ''}`.trim(), 50, 190)
          .text(`${sellerAddress.postalCode || ''} ${sellerAddress.city || ''}`.trim(), 50, 205)
          .text('Schweiz', 50, 220)
      }

      // === POSITIONEN ===
      let y = 260

      // Tabellenkopf
      pdf
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica-Bold')
        .text('Beschreibung', 50, y)
        .text('CHF', 500, y, { align: 'right' })

      y += 15

      // Linie unter Kopf
      pdf.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke()
      y += 15

      // Items
      pdf.font('Helvetica').fillColor('#000000').fontSize(10)

      for (const item of invoice.items) {
        const description = item.description ||
          (item.watch ? `Kommission: ${item.watch.title}` : 'Position')

        pdf.text(description, 50, y, { width: 420 })
        pdf.text(formatCurrency(item.total), 500, y, { align: 'right' })
        y += 20
      }

      // Trennlinie vor Summen
      y += 10
      pdf.moveTo(350, y).lineTo(545, y).strokeColor('#e5e7eb').stroke()
      y += 15

      // Zwischensumme
      pdf
        .fontSize(10)
        .font('Helvetica')
        .text('Zwischensumme', 350, y)
        .text(formatCurrency(invoice.subtotal), 500, y, { align: 'right' })
      y += 18

      // MwSt
      const vatRate = invoice.vatRate || 8.1
      pdf
        .text(`MwSt. (${vatRate}%)`, 350, y)
        .text(formatCurrency(invoice.vatAmount), 500, y, { align: 'right' })
      y += 18

      // Total Linie
      pdf.moveTo(350, y).lineTo(545, y).strokeColor('#000000').lineWidth(1).stroke()
      y += 10

      // Total
      pdf
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total CHF', 350, y)
        .text(formatCurrency(invoice.total), 500, y, { align: 'right' })

      // === SWISS QR-BILL ===
      // Daten für QR-Bill vorbereiten
      const qrBillData: any = {
        currency: 'CHF',
        amount: Number(invoice.total),
        creditor: {
          name: PAYMENT_CONFIG.creditorName,
          address: PAYMENT_CONFIG.address.street,
          buildingNumber: PAYMENT_CONFIG.address.streetNumber,
          zip: PAYMENT_CONFIG.address.postalCode,
          city: PAYMENT_CONFIG.address.city,
          country: 'CH',
          account: PAYMENT_CONFIG.getIbanWithoutSpaces(),
        },
        debtor: {
          name: sellerName,
          address: sellerAddress?.street || '',
          buildingNumber: sellerAddress?.streetNumber || '',
          zip: sellerAddress?.postalCode || '',
          city: sellerAddress?.city || '',
          country: 'CH',
        },
        message: `Rechnung ${invoice.invoiceNumber}`,
      }

      // Bexio QR-Referenz verwenden wenn vorhanden (für automatisches Payment Matching)
      if (invoice.qrReference && invoice.qrReference.startsWith('RF')) {
        qrBillData.reference = invoice.qrReference.replace(/\s/g, '')
        console.log(`[pdf-v2] ✅ Verwende Bexio SCOR-Referenz: ${qrBillData.reference}`)
      }

      // Swiss QR-Bill erstellen
      const qrBill = new SwissQRBill(qrBillData, {
        language: 'DE',
        outlines: true,
        scissors: true,
      })

      // QR-Bill zum PDF hinzufügen
      qrBill.attachTo(pdf)

      // PDF abschließen
      pdf.end()
    } catch (error) {
      reject(error)
    }
  })
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(amount: number | any): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0
  return num.toFixed(2)
}
