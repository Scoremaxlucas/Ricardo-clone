import { shouldShowDetailedErrors } from "@/lib/env"
import { authOptions } from '@/lib/auth'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { prisma } from '@/lib/prisma'
import { formatValidationResult, validateQRBill } from '@/lib/qr-bill-validator'
import { formatQRReference } from '@/lib/qr-reference'
import { jsPDF } from 'jspdf'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const { id } = await params

    // Hole Rechnung mit ursprünglicher Rechnung (falls Korrektur-Rechnung)
    // Verwende try-catch für die Query, um Fehler bei fehlender Relation abzufangen
    let invoice
    try {
      invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              watch: {
                select: {
                  id: true,
                  title: true,
                  brand: true,
                  model: true,
                },
              },
            },
          },
          seller: true,
          originalInvoice: {
            select: {
              id: true,
              invoiceNumber: true,
              createdAt: true,
            },
          },
        },
      })
    } catch (queryError: any) {
      console.error('Error fetching invoice:', queryError)
      // Falls originalInvoice Relation fehlschlägt, versuche ohne originalInvoice
      invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              watch: {
                select: {
                  id: true,
                  title: true,
                  brand: true,
                  model: true,
                },
              },
            },
          },
          seller: true,
        },
      })
      // Setze originalInvoice auf null falls nicht geladen werden konnte
      if (invoice) {
        ;(invoice as any).originalInvoice = null
      }
    }

    if (!invoice) {
      return NextResponse.json({ message: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der User berechtigt ist (nur der Verkäufer darf seine Rechnung sehen)
    if (invoice.sellerId !== session.user.id) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    // Prüfe ob es eine Credit Note (Korrektur-Rechnung) ist
    const isCreditNote =
      invoice.invoiceNumber.startsWith('KORR-') ||
      invoice.total < 0 ||
      (invoice.status === 'cancelled' && invoice.refundedAt) ||
      invoice.originalInvoiceId !== null

    // Erstelle PDF im A4 Format
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin

    // ============================================
    // HEADER - Professional Header with Gradient Effect
    // ============================================
    // Main header background
    pdf.setFillColor(15, 118, 110) // Primary color (teal)
    pdf.rect(0, 0, pageWidth, 45, 'F')
    
    // Subtle accent line at bottom of header
    pdf.setFillColor(13, 100, 94) // Slightly darker teal
    pdf.rect(0, 42, pageWidth, 3, 'F')

    // Logo/Name Section - Left aligned
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(28)
    pdf.setFont('helvetica', 'bold')
    pdf.text('HELVENDA', margin, 22)

    // Tagline
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(200, 230, 227) // Light teal for subtitle
    pdf.text('Schweizer Online-Marktplatz für Uhren', margin, 30)
    
    // Website in header
    pdf.setFontSize(8)
    pdf.text(PAYMENT_CONFIG.website, margin, 37)

    // Invoice Type Badge - Right aligned
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    
    // Invoice type with badge background
    const invoiceTypeText = isCreditNote ? 'GUTSCHRIFT' : 'RECHNUNG'
    const badgeWidth = pdf.getTextWidth(invoiceTypeText) + 10
    const badgeX = pageWidth - margin - badgeWidth
    
    // Badge background
    if (isCreditNote) {
      pdf.setFillColor(220, 38, 38) // Red for credit note
    } else {
      pdf.setFillColor(255, 255, 255) // White for regular invoice
    }
    pdf.roundedRect(badgeX, 14, badgeWidth, 10, 2, 2, 'F')
    
    // Badge text
    if (isCreditNote) {
      pdf.setTextColor(255, 255, 255)
    } else {
      pdf.setTextColor(15, 118, 110)
    }
    pdf.text(invoiceTypeText, badgeX + 5, 21)

    // ============================================
    // COMPANY INFO (left side under header)
    // ============================================
    let yPos = 55
    
    // Company details in a subtle box
    pdf.setFillColor(248, 250, 252) // Very light gray
    pdf.setDrawColor(226, 232, 240) // Light border
    pdf.setLineWidth(0.3)
    pdf.roundedRect(margin, yPos - 5, 80, 32, 2, 2, 'FD')
    
    pdf.setTextColor(100, 100, 100)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Absender', margin + 3, yPos)
    yPos += 5
    
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(PAYMENT_CONFIG.creditorName, margin + 3, yPos)
    yPos += 5
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(
      `${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}`,
      margin + 3,
      yPos
    )
    yPos += 4
    pdf.text(`${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`, margin + 3, yPos)
    yPos += 4
    pdf.text('Schweiz', margin + 3, yPos)
    yPos += 5
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`UID: ${PAYMENT_CONFIG.uid}`, margin + 3, yPos)

    // ============================================
    // INVOICE DETAILS (right side) - More prominent
    // ============================================
    const detailsBoxX = pageWidth - margin - 65
    const detailsBoxY = 50
    
    // Invoice details box
    pdf.setFillColor(248, 250, 252)
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(detailsBoxX, detailsBoxY, 65, 37, 2, 2, 'FD')
    
    let detailY = detailsBoxY + 6
    
    // Invoice number - prominent
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Rechnungsnummer', detailsBoxX + 3, detailY)
    detailY += 4
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 118, 110)
    pdf.text(invoice.invoiceNumber, detailsBoxX + 3, detailY)
    detailY += 7
    
    // Invoice date
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text('Rechnungsdatum', detailsBoxX + 3, detailY)
    detailY += 4
    pdf.setFontSize(9)
    pdf.setTextColor(0, 0, 0)
    pdf.text(new Date(invoice.createdAt).toLocaleDateString('de-CH'), detailsBoxX + 3, detailY)
    detailY += 7
    
    if (!isCreditNote) {
      // Due date - highlighted for visibility
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Zahlbar bis', detailsBoxX + 3, detailY)
      detailY += 4
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(220, 38, 38) // Red for urgency
      pdf.text(new Date(invoice.dueDate).toLocaleDateString('de-CH'), detailsBoxX + 3, detailY)
    } else if (invoice.originalInvoiceId && (invoice as any).originalInvoice) {
      // Reference to original invoice for credit notes
      pdf.setFontSize(7)
      pdf.setTextColor(100, 100, 100)
      pdf.text('Korrigiert Rechnung', detailsBoxX + 3, detailY)
      detailY += 4
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text((invoice as any).originalInvoice.invoiceNumber, detailsBoxX + 3, detailY)
    }

    // ============================================
    // RECIPIENT ADDRESS - Clear and prominent
    // ============================================
    yPos = 95
    
    // Label
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Rechnungsempfänger', margin, yPos)
    yPos += 6

    // Recipient details
    pdf.setFontSize(10)
    pdf.setTextColor(0, 0, 0)
    
    if (invoice.seller.firstName && invoice.seller.lastName) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${invoice.seller.firstName} ${invoice.seller.lastName}`, margin, yPos)
      yPos += 5
    }
    pdf.setFont('helvetica', 'normal')
    if (invoice.seller.companyName) {
      pdf.text(invoice.seller.companyName, margin, yPos)
      yPos += 5
    }
    if (invoice.seller.street && invoice.seller.streetNumber) {
      pdf.text(`${invoice.seller.street} ${invoice.seller.streetNumber}`, margin, yPos)
      yPos += 5
    }
    if (invoice.seller.postalCode && invoice.seller.city) {
      pdf.text(`${invoice.seller.postalCode} ${invoice.seller.city}`, margin, yPos)
      yPos += 5
    }
    if (invoice.seller.country) {
      pdf.text(invoice.seller.country, margin, yPos)
      yPos += 5
    }

    // ============================================
    // LINE ITEMS TABLE - Professional styling
    // ============================================
    yPos += 15

    // Section title
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 118, 110)
    pdf.text('Rechnungspositionen', margin, yPos)
    yPos += 8

    // Check if we have line items
    const hasLineItems = invoice.items && invoice.items.length > 0

    if (hasLineItems) {
      // Table header with teal background
      pdf.setFillColor(15, 118, 110)
      pdf.roundedRect(margin, yPos - 5, contentWidth, 10, 1, 1, 'F')

      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(255, 255, 255)
      pdf.text('Pos.', margin + 3, yPos + 1)
      pdf.text('Beschreibung', margin + 15, yPos + 1)
      pdf.text('Betrag (CHF)', pageWidth - margin - 3, yPos + 1, { align: 'right' })

      yPos += 10

      // Line items with alternating row colors
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      let itemIndex = 1
      for (const item of invoice.items) {
        // Alternating row background
        if (itemIndex % 2 === 0) {
          pdf.setFillColor(248, 250, 252)
          pdf.rect(margin, yPos - 4, contentWidth, 8, 'F')
        }
        
        const description = item.watch
          ? `${item.description}${item.watch.brand || item.watch.model ? ` (${[item.watch.brand, item.watch.model].filter(Boolean).join(' ')})` : ''}`
          : item.description

        // Position number
        pdf.setTextColor(100, 100, 100)
        pdf.text(String(itemIndex).padStart(2, '0'), margin + 3, yPos)
        
        // Description with word wrap
        pdf.setTextColor(0, 0, 0)
        const lines = pdf.splitTextToSize(description, contentWidth - 55)

        for (let i = 0; i < lines.length; i++) {
          pdf.text(lines[i], margin + 15, yPos)
          if (i === 0) {
            pdf.setFont('helvetica', 'bold')
            pdf.text(item.total.toFixed(2), pageWidth - margin - 3, yPos, { align: 'right' })
            pdf.setFont('helvetica', 'normal')
          }
          yPos += 5
        }
        yPos += 3
        itemIndex++
      }
      
      // Bottom border of table
      pdf.setDrawColor(15, 118, 110)
      pdf.setLineWidth(0.5)
      pdf.line(margin, yPos, pageWidth - margin, yPos)
    } else {
      // Fallback: Show message if no line items
      pdf.setFillColor(248, 250, 252)
      pdf.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, 'F')
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Rechnungsdetails: Siehe Plattformübersicht', margin + 5, yPos + 5)
      yPos += 15
    }

    // ============================================
    // TOTALS SECTION - Professional summary box
    // ============================================
    yPos += 10
    
    // Summary box on the right side
    const summaryBoxWidth = 75
    const summaryBoxX = pageWidth - margin - summaryBoxWidth
    const summaryBoxY = yPos
    
    // Background for summary
    pdf.setFillColor(248, 250, 252)
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(summaryBoxX, summaryBoxY, summaryBoxWidth, isCreditNote ? 48 : 40, 2, 2, 'FD')
    
    let sumY = summaryBoxY + 8
    
    // Subtotal
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text('Zwischensumme', summaryBoxX + 5, sumY)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`CHF ${invoice.subtotal.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 5, sumY, { align: 'right' })
    sumY += 7

    // VAT
    pdf.setTextColor(100, 100, 100)
    pdf.text(`MwSt (${(invoice.vatRate * 100).toFixed(1)}%)`, summaryBoxX + 5, sumY)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`CHF ${invoice.vatAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 5, sumY, { align: 'right' })
    sumY += 8

    // Divider line
    pdf.setDrawColor(15, 118, 110)
    pdf.setLineWidth(0.8)
    pdf.line(summaryBoxX + 5, sumY, summaryBoxX + summaryBoxWidth - 5, sumY)
    sumY += 8

    // Total - prominent
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 118, 110)
    pdf.text('TOTAL', summaryBoxX + 5, sumY)
    pdf.setFontSize(12)
    pdf.text(`CHF ${Math.abs(invoice.total).toFixed(2)}`, summaryBoxX + summaryBoxWidth - 5, sumY, { align: 'right' })

    if (isCreditNote) {
      sumY += 8
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(220, 38, 38)
      pdf.text('Gutschrift - wird verrechnet', summaryBoxX + 5, sumY)
    }
    
    // Update yPos for next section
    yPos = summaryBoxY + (isCreditNote ? 55 : 48)

    // ============================================
    // PAYMENT INFORMATION & QR-BILL
    // ============================================
    if (!isCreditNote) {
      // Position for payment section
      const paymentStartY = yPos + 10

      // Height of payment section
      const paymentHeight = 95

      // Payment section with teal accent
      pdf.setFillColor(240, 253, 250) // Very light teal background
      pdf.setDrawColor(15, 118, 110)
      pdf.setLineWidth(0.5)
      pdf.roundedRect(margin, paymentStartY, contentWidth, paymentHeight, 3, 3, 'FD')
      
      // Left accent bar
      pdf.setFillColor(15, 118, 110)
      pdf.rect(margin, paymentStartY, 4, paymentHeight, 'F')

      // Section title with icon-like element
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 118, 110)
      pdf.text('Zahlungsinformationen', margin + 12, paymentStartY + 10)

      // Left column: Payment details
      let paymentY = paymentStartY + 18
      const labelX = margin + 12
      const valueX = margin + 55
      
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Empfänger', labelX, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(PAYMENT_CONFIG.creditorName, valueX, paymentY)
      paymentY += 6

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Bank', labelX, paymentY)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text(PAYMENT_CONFIG.bankName, valueX, paymentY)
      paymentY += 6

      pdf.setTextColor(100, 100, 100)
      pdf.text('IBAN', labelX, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 118, 110)
      pdf.text(PAYMENT_CONFIG.iban, valueX, paymentY)
      paymentY += 6

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text('BIC/SWIFT', labelX, paymentY)
      pdf.setTextColor(0, 0, 0)
      pdf.text(PAYMENT_CONFIG.bic, valueX, paymentY)
      paymentY += 6

      pdf.setTextColor(100, 100, 100)
      pdf.text('Verwendungszweck', labelX, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(invoice.invoiceNumber, valueX, paymentY)
      paymentY += 6

      // Reference number for bank transfer
      let cleanReference = invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '')
      if (cleanReference.length === 0) {
        cleanReference = invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '')
      }
      const displayReference = cleanReference.substring(0, 25)

      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Referenz', labelX, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(displayReference || invoice.invoiceNumber, valueX, paymentY)
      paymentY += 8

      // Amount - prominent
      pdf.setFillColor(15, 118, 110)
      pdf.roundedRect(labelX - 2, paymentY - 4, 90, 12, 2, 2, 'F')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(255, 255, 255)
      pdf.text('Zahlbetrag:', labelX + 2, paymentY + 3)
      pdf.text(`CHF ${invoice.total.toFixed(2)}`, labelX + 85, paymentY + 3, { align: 'right' })

      // Rechte Spalte: QR-Code (Swiss QR-Bill Format)
      try {
        // IBAN ohne Leerzeichen für QR-Code
        const ibanRaw = PAYMENT_CONFIG.getIbanWithoutSpaces()
        const creditorName = PAYMENT_CONFIG.creditorName
        const creditorAddress = PAYMENT_CONFIG.address

        // Debtor Information - WICHTIG: Adressen müssen strukturiert sein
        // Wenn kein Name vorhanden, müssen alle Debtor-Felder leer sein
        const hasDebtorInfo = !!(
          invoice.seller.firstName ||
          invoice.seller.lastName ||
          invoice.seller.companyName ||
          invoice.seller.name
        )

        const debtorName =
          invoice.seller.firstName && invoice.seller.lastName
            ? `${invoice.seller.firstName} ${invoice.seller.lastName}`.trim()
            : invoice.seller.companyName?.trim() || invoice.seller.name?.trim() || ''

        // Strukturierte Adresse für Debtor (PLZ und Ort kombiniert!)
        const debtorStreet =
          hasDebtorInfo && invoice.seller.street?.trim()
            ? `${invoice.seller.street.trim()} ${invoice.seller.streetNumber?.trim() || ''}`.trim()
            : ''
        const debtorPostalCode =
          hasDebtorInfo && invoice.seller.postalCode?.trim() ? invoice.seller.postalCode.trim() : ''
        const debtorCity =
          hasDebtorInfo && invoice.seller.city?.trim() ? invoice.seller.city.trim() : ''
        const debtorCityLine =
          debtorPostalCode && debtorCity ? `${debtorPostalCode} ${debtorCity}`.trim() : ''
        // WICHTIG: Für Swiss QR-Bill sollte das Land immer "CH" sein (Schweiz)
        // Validiere und korrigiere Länderkürzel automatisch
        let debtorCountry = ''
        if (hasDebtorInfo) {
          const debtorCountryRaw = invoice.seller.country?.trim() || 'CH'
          const debtorCountryClean = debtorCountryRaw.toUpperCase().substring(0, 2)
          // Stelle sicher, dass es ein gültiges 2-stelliges Länderkürzel ist, sonst verwende CH
          if (/^[A-Z]{2}$/.test(debtorCountryClean)) {
            // Für Swiss QR-Bill sollte es immer CH sein - korrigiere automatisch
            debtorCountry = 'CH'
            if (debtorCountryClean !== 'CH') {
              console.warn(
                '[QR-Bill] ⚠️  Debtor Country korrigiert von',
                debtorCountryClean,
                'zu CH (für Swiss QR-Bill)'
              )
            }
          } else {
            debtorCountry = 'CH'
          }
        }

        // Strukturierte Adresse für Creditor
        const creditorStreet = creditorAddress.street?.trim() || ''
        const creditorStreetNumber = creditorAddress.streetNumber?.trim() || ''
        const creditorPostalCode = creditorAddress.postalCode?.trim() || ''
        const creditorCity = creditorAddress.city?.trim() || ''

        // Referenz bereinigen und formatieren (nur alphanumerisch, genau 25 Zeichen)
        // WICHTIG: Referenz muss genau 25 Zeichen lang sein für Swiss QR-Bill
        const formattedReference = formatQRReference(invoice.invoiceNumber)

        // Validiere Referenz
        if (formattedReference.length !== 25) {
          console.error(
            '[QR-Bill] ⚠️  Referenz hat ungültige Länge:',
            formattedReference.length,
            'erwartet: 25'
          )
        }
        if (!/^[0-9A-Za-z ]{25}$/.test(formattedReference)) {
          console.error('[QR-Bill] ⚠️  Referenz enthält ungültige Zeichen:', formattedReference)
        }

        // Betrag formatieren (immer mit 2 Dezimalstellen, keine Tausender-Trennzeichen)
        const formattedAmount = Math.abs(invoice.total).toFixed(2)

        // IBAN bereinigen (ohne Leerzeichen, genau 21 Zeichen)
        // ibanRaw sollte bereits ohne Leerzeichen sein, aber sicherheitshalber nochmal bereinigen
        let cleanIban = ibanRaw.replace(/\s/g, '').toUpperCase()

        // Prüfe ob QR-IBAN verwendet wird
        const qrIbanValidation = PAYMENT_CONFIG.validateQRIban()
        if (!qrIbanValidation.isValid) {
          console.warn('[QR-Bill]', qrIbanValidation.message)
          console.warn('[QR-Bill] ⚠️  QR-Code könnte von Banking-Apps als ungültig erkannt werden!')
        }

        // Stelle sicher, dass IBAN genau 21 Zeichen lang ist
        if (cleanIban.length > 21) {
          cleanIban = cleanIban.substring(0, 21)
        } else if (cleanIban.length < 21) {
          console.error(
            '[QR-Bill] ⚠️  IBAN ist zu kurz:',
            cleanIban.length,
            'Zeichen, erwartet: 21'
          )
          console.error('[QR-Bill] Original IBAN:', ibanRaw)
        }

        // Validiere IBAN-Format (Schweizer IBAN: CH + 2 Ziffern + 17 alphanumerische Zeichen = 21 Zeichen)
        if (!cleanIban.startsWith('CH')) {
          console.error('[QR-Bill] ❌ IBAN beginnt nicht mit CH:', cleanIban)
        }
        if (cleanIban.length !== 21) {
          console.error(
            '[QR-Bill] ❌ IBAN hat ungültige Länge:',
            cleanIban.length,
            'erwartet: genau 21'
          )
        }
        // Prüfe Format: CH + 2 Ziffern + 17 alphanumerische Zeichen
        if (!/^CH\d{2}[A-Z0-9]{17}$/.test(cleanIban)) {
          console.error('[QR-Bill] ❌ IBAN hat ungültiges Format:', cleanIban)
          console.error('[QR-Bill] Erwartet: CH + 2 Ziffern + 17 alphanumerische Zeichen')
        }

        // Creditor Adresse korrekt strukturieren
        // WICHTIG: Für Swiss QR-Bill müssen Strasse+Hausnummer kombiniert sein, PLZ+Ort kombiniert sein
        const creditorStreetLine = `${creditorStreet} ${creditorStreetNumber}`.trim()
        const creditorCityLine = `${creditorPostalCode} ${creditorCity}`.trim()
        const creditorCountryCode = (creditorAddress.country || 'CH').substring(0, 2).toUpperCase()

        // Stelle sicher, dass Creditor-Adresse nicht leer ist
        if (!creditorStreetLine || creditorStreetLine.length === 0) {
          console.error('[QR-Bill] ⚠️  Creditor Street ist leer, verwende Fallback')
        }
        if (!creditorCityLine || creditorCityLine.length === 0) {
          console.error('[QR-Bill] ⚠️  Creditor City ist leer, verwende Fallback')
        }

        // Swiss QR-Bill Format (SPC - Swiss Payments Code) Version 2.0
        // WICHTIG: Alle Felder müssen korrekt formatiert sein für funktionsfähigen QR-Code
        // Strukturierte Adressen (Typ K) mit kombinierten Feldern für Strasse+Hausnummer und PLZ+Ort
        const qrString = [
          'SPC', // QR-Type (Swiss Payments Code)
          '0200', // Version 2.0
          '1', // Coding Type (1 = UTF-8)
          cleanIban, // Creditor IBAN (ohne Leerzeichen, max 21 Zeichen)
          'K', // Creditor Address Type (K = Structured address)
          (creditorName || 'Score-Max GmbH').substring(0, 70), // Creditor Name (max 70 Zeichen)
          creditorStreetLine.substring(0, 70) || PAYMENT_CONFIG.getStreetLine().substring(0, 70), // Creditor Street + Number (max 70 Zeichen)
          creditorCityLine.substring(0, 70) || PAYMENT_CONFIG.getCityLine().substring(0, 70), // Creditor Postal Code + City (max 70 Zeichen)
          creditorCountryCode, // Creditor Country (genau 2 Zeichen)
          '', // Ultimate creditor name (optional, leer lassen wenn nicht benötigt)
          '', // Ultimate creditor street (optional)
          '', // Ultimate creditor postal code + city (optional)
          '', // Ultimate creditor country (optional)
          formattedAmount, // Amount (immer mit 2 Dezimalstellen, z.B. "123.45")
          'CHF', // Currency (3 Zeichen)
          hasDebtorInfo ? 'K' : '', // Ultimate debtor address type (K = Structured, leer wenn kein Name)
          (hasDebtorInfo ? debtorName : '').substring(0, 70), // Ultimate debtor name (max 70 Zeichen, leer wenn kein Name)
          (hasDebtorInfo ? debtorStreet : '').substring(0, 70), // Ultimate debtor street + number (max 70 Zeichen, leer wenn kein Name)
          (hasDebtorInfo ? debtorCityLine : '').substring(0, 70), // Ultimate debtor postal code + city (max 70 Zeichen, leer wenn kein Name)
          hasDebtorInfo ? debtorCountry : '', // Ultimate debtor country (2 Zeichen, leer wenn kein Name)
          'SCOR', // Reference type (SCOR = Creditor Reference)
          formattedReference, // Reference (genau 25 Zeichen, alphanumerisch, mit Leerzeichen aufgefüllt)
          '', // Additional information (optional, leer lassen)
          'EPD', // Trailer (End of Payment Data)
        ].join('\n')

        // Stelle sicher, dass QR-String genau 24 Zeilen hat
        const qrLines = qrString.split('\n')
        if (qrLines.length !== 24) {
          console.error(
            '[QR-Bill] ⚠️  QR-String hat falsche Anzahl Zeilen:',
            qrLines.length,
            'erwartet: 24'
          )
          console.error(
            '[QR-Bill] Zeilen:',
            qrLines.map((line, i) => `${i + 1}: ${line}`).join('\n')
          )
        }

        // Validiere QR-Code
        const validation = validateQRBill(qrString)

        // Debug: Log Validierungsergebnis
        console.log('[QR-Bill] Validierung:')
        console.log(formatValidationResult(validation))

        if (!validation.isValid) {
          console.error('[QR-Bill] ❌ QR-Code ist ungültig!')
          console.error('[QR-Bill] Fehler:', validation.errors)
          if (validation.warnings.length > 0) {
            console.warn('[QR-Bill] Warnungen:', validation.warnings)
          }
        } else {
          console.log('[QR-Bill] ✅ QR-Code ist valide')
          if (validation.warnings.length > 0) {
            console.warn('[QR-Bill] Warnungen:', validation.warnings)
          }
        }

        // Debug: Log QR-String für Fehleranalyse
        if (shouldShowDetailedErrors() || !validation.isValid) {
          console.log('[QR-Bill] Vollständiger QR-String:')
          qrString.split('\n').forEach((line, i) => {
            console.log(`  ${String(i + 1).padStart(2, '0')}: ${line}`)
          })
        }

        // Wenn QR-Code ungültig ist, werfe Fehler (aber generiere trotzdem PDF)
        if (!validation.isValid) {
          console.error('[QR-Bill] ⚠️  QR-Code wird trotz Fehlern generiert. Bitte korrigieren!')
        }

        // Generate QR-Code mit höherer Qualität für bessere Erkennbarkeit
        // WICHTIG: Error Correction Level M (15% Redundanz) ist für Swiss QR-Bill empfohlen
        // Größerer Margin (4) für bessere Erkennbarkeit durch Banking-Apps
        const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
          errorCorrectionLevel: 'M', // Medium error correction (15% Redundanz - empfohlen für Swiss QR-Bill)
          type: 'image/png',
          width: 300, // Größere Größe für bessere Erkennbarkeit (mindestens 300px empfohlen)
          margin: 4, // Größerer Margin für bessere Erkennbarkeit (mindestens 4 Module empfohlen)
          color: {
            dark: '#000000', // Schwarze QR-Code-Module
            light: '#FFFFFF', // Weißer Hintergrund
          },
        })

        // QR Code section - positioned on the right side
        const qrSize = 48
        const qrX = pageWidth - margin - qrSize - 10
        const qrY = paymentStartY + 15
        
        // QR Code container with white background
        pdf.setFillColor(255, 255, 255)
        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.3)
        pdf.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 20, 2, 2, 'FD')

        // Add QR code image
        pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

        // QR code label and instructions
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(15, 118, 110)
        pdf.text('Swiss QR-Code', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' })
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(6)
        pdf.setTextColor(100, 100, 100)
        pdf.text('Mit Banking-App scannen', qrX + qrSize / 2, qrY + qrSize + 10, { align: 'center' })
        pdf.text('oder manuell überweisen', qrX + qrSize / 2, qrY + qrSize + 14, { align: 'center' })
      } catch (error) {
        console.error('Error generating QR code:', error)
        // QR-Code Fehler wird geloggt, aber PDF wird trotzdem erstellt
      }

      // Payment instructions at bottom of payment box
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Zahlungsfrist: ${PAYMENT_CONFIG.paymentTermsDays} Tage. Bitte verwenden Sie die Referenznummer bei der Überweisung.`,
        margin + 12,
        paymentStartY + 88
      )
    } else {
      // Credit Note: Info section instead of payment
      yPos += 10

      // Credit note info box with red accent
      pdf.setFillColor(254, 242, 242) // Light red background
      pdf.setDrawColor(220, 38, 38)
      pdf.setLineWidth(0.5)
      pdf.roundedRect(margin, yPos, contentWidth, 45, 3, 3, 'FD')
      
      // Left accent bar
      pdf.setFillColor(220, 38, 38)
      pdf.rect(margin, yPos, 4, 45, 'F')

      // Title
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(220, 38, 38)
      pdf.text('Gutschrift / Korrektur-Rechnung', margin + 12, yPos + 10)

      let creditNoteYPos = yPos + 18
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      // Reference to original invoice
      if (invoice.originalInvoiceId && (invoice as any).originalInvoice) {
        pdf.text(
          `Bezug auf: Rechnung ${(invoice as any).originalInvoice.invoiceNumber} vom ${new Date((invoice as any).originalInvoice.createdAt).toLocaleDateString('de-CH')}`,
          margin + 12,
          creditNoteYPos
        )
        creditNoteYPos += 7
      }

      // Credit note explanation
      pdf.setTextColor(100, 100, 100)
      pdf.text('Diese Gutschrift storniert die ursprüngliche Rechnung.', margin + 12, creditNoteYPos)
      creditNoteYPos += 5
      pdf.text('Es ist keine Zahlung erforderlich. Der Betrag wird Ihrem Konto gutgeschrieben.', margin + 12, creditNoteYPos)
    }

    // ============================================
    // FOOTER - Professional footer with legal info
    // ============================================
    const footerY = pageHeight - 30
    
    // Footer separator line
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.5)
    pdf.line(margin, footerY, pageWidth - margin, footerY)
    
    // Thank you message
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(15, 118, 110)
    pdf.text('Vielen Dank für Ihr Vertrauen in Helvenda.', margin, footerY + 7)
    
    // Contact information
    pdf.setFontSize(7)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Bei Fragen: ${PAYMENT_CONFIG.email} | ${PAYMENT_CONFIG.phone} | ${PAYMENT_CONFIG.website}`, margin, footerY + 13)
    
    // Legal notice
    pdf.setFontSize(6)
    pdf.setTextColor(150, 150, 150)
    pdf.text(PAYMENT_CONFIG.legalNotice, margin, footerY + 18)
    
    // VAT/UID info and page number
    pdf.text(`${PAYMENT_CONFIG.creditorName} | ${PAYMENT_CONFIG.vatNumber}`, margin, footerY + 23)
    
    // Page number on the right
    pdf.setTextColor(100, 100, 100)
    pdf.text('Seite 1 von 1', pageWidth - margin, footerY + 23, { align: 'right' })

    // PDF als Buffer zurückgeben
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung_${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating PDF:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    return NextResponse.json(
      {
        message: 'Fehler beim Erstellen des PDFs: ' + (error.message || 'Unbekannter Fehler'),
        error: shouldShowDetailedErrors() ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
