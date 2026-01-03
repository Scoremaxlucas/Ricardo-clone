import { authOptions } from '@/lib/auth'
import { shouldShowDetailedErrors } from '@/lib/env'
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
        select: {
          id: true,
          invoiceNumber: true,
          sellerId: true,
          subtotal: true,
          vatRate: true,
          vatAmount: true,
          total: true,
          status: true,
          dueDate: true,
          createdAt: true,
          refundedAt: true,
          originalInvoiceId: true,
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              price: true,
              total: true,
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
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              companyName: true,
              street: true,
              streetNumber: true,
              postalCode: true,
              city: true,
              country: true,
            },
          },
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
        select: {
          id: true,
          invoiceNumber: true,
          sellerId: true,
          subtotal: true,
          vatRate: true,
          vatAmount: true,
          total: true,
          status: true,
          dueDate: true,
          createdAt: true,
          refundedAt: true,
          originalInvoiceId: true,
          items: {
            select: {
              id: true,
              description: true,
              quantity: true,
              price: true,
              total: true,
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
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              companyName: true,
              street: true,
              streetNumber: true,
              postalCode: true,
              city: true,
              country: true,
            },
          },
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
    // HEADER - Clean Minimalist Design
    // ============================================
    // Simple header line
    pdf.setDrawColor(15, 118, 110)
    pdf.setLineWidth(1)
    pdf.line(margin, 15, pageWidth - margin, 15)

    // Logo/Name - Clean typography
    pdf.setTextColor(15, 118, 110)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('HELVENDA', margin, 28)

    // Invoice type on the right
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'normal')
    if (isCreditNote) {
      pdf.setTextColor(220, 38, 38)
      pdf.text('Gutschrift', pageWidth - margin, 28, { align: 'right' })
    } else {
      pdf.setTextColor(60, 60, 60)
      pdf.text('Rechnung', pageWidth - margin, 28, { align: 'right' })
    }

    // Thin line under header
    pdf.setDrawColor(226, 232, 240)
    pdf.setLineWidth(0.3)
    pdf.line(margin, 35, pageWidth - margin, 35)

    // ============================================
    // SENDER INFO (left) & INVOICE DETAILS (right)
    // ============================================
    let yPos = 45

    // Sender info - left side, simple text
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(120, 120, 120)
    pdf.text(PAYMENT_CONFIG.creditorName, margin, yPos)
    pdf.text(
      `${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}, ${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`,
      margin,
      yPos + 4
    )

    // Invoice details - right side, clean layout
    const rightX = pageWidth - margin
    pdf.setFontSize(9)
    pdf.setTextColor(60, 60, 60)
    pdf.text(`Nr. ${invoice.invoiceNumber}`, rightX, yPos, { align: 'right' })
    pdf.text(
      `Datum: ${new Date(invoice.createdAt).toLocaleDateString('de-CH')}`,
      rightX,
      yPos + 5,
      {
        align: 'right',
      }
    )
    if (!isCreditNote) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(
        `Fällig: ${new Date(invoice.dueDate).toLocaleDateString('de-CH')}`,
        rightX,
        yPos + 10,
        {
          align: 'right',
        }
      )
    } else if (invoice.originalInvoiceId && (invoice as any).originalInvoice) {
      pdf.text(`Korrigiert: ${(invoice as any).originalInvoice.invoiceNumber}`, rightX, yPos + 10, {
        align: 'right',
      })
    }

    // ============================================
    // RECIPIENT ADDRESS - Clean layout
    // ============================================
    yPos = 70

    // Label
    pdf.setFontSize(8)
    pdf.setTextColor(120, 120, 120)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Rechnungsempfänger', margin, yPos)
    yPos += 8

    // Recipient details
    pdf.setFontSize(10)
    pdf.setTextColor(30, 30, 30)

    if (invoice.seller.firstName && invoice.seller.lastName) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${invoice.seller.firstName} ${invoice.seller.lastName}`, margin, yPos)
      yPos += 5
      pdf.setFont('helvetica', 'normal')
    }
    if (invoice.seller.companyName) {
      pdf.text(invoice.seller.companyName, margin, yPos)
      yPos += 5
    }
    if (invoice.seller.street) {
      const streetText = invoice.seller.streetNumber
        ? `${invoice.seller.street} ${invoice.seller.streetNumber}`
        : invoice.seller.street
      pdf.text(streetText, margin, yPos)
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
    // LINE ITEMS TABLE - Minimalist design
    // ============================================
    yPos += 20

    // Check if we have line items
    const hasLineItems = invoice.items && invoice.items.length > 0

    // Table header - simple underline
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text('Beschreibung', margin, yPos)
    pdf.text('CHF', pageWidth - margin, yPos, { align: 'right' })
    yPos += 4

    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    if (hasLineItems) {
      // Line items - clean simple rows
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(30, 30, 30)

      for (const item of invoice.items) {
        const description = item.watch
          ? `${item.description}${item.watch.brand || item.watch.model ? ` (${[item.watch.brand, item.watch.model].filter(Boolean).join(' ')})` : ''}`
          : item.description

        // Description with word wrap
        const lines = pdf.splitTextToSize(description, contentWidth - 30)

        for (let i = 0; i < lines.length; i++) {
          pdf.text(lines[i], margin, yPos)
          if (i === 0) {
            pdf.text(item.total.toFixed(2), pageWidth - margin, yPos, { align: 'right' })
          }
          yPos += 5
        }
        yPos += 3
      }
    } else {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(100, 100, 100)
      pdf.text('Siehe Plattformübersicht', margin, yPos)
      yPos += 8
    }

    // Line after items
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPos, pageWidth - margin, yPos)

    // ============================================
    // TOTALS SECTION - Clean right-aligned
    // ============================================
    yPos += 10

    const totalsX = pageWidth - margin - 60

    // Subtotal
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text('Zwischensumme', totalsX, yPos)
    pdf.setTextColor(30, 30, 30)
    pdf.text(`${invoice.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 6

    // VAT
    pdf.setTextColor(100, 100, 100)
    pdf.text(`MwSt (${(invoice.vatRate * 100).toFixed(1)}%)`, totalsX, yPos)
    pdf.setTextColor(30, 30, 30)
    pdf.text(`${invoice.vatAmount.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 8

    // Total line
    pdf.setDrawColor(30, 30, 30)
    pdf.setLineWidth(0.5)
    pdf.line(totalsX, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Total - prominent
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(30, 30, 30)
    pdf.text('Total CHF', totalsX, yPos)
    pdf.text(`${Math.abs(invoice.total).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' })

    if (isCreditNote) {
      yPos += 6
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(220, 38, 38)
      pdf.text('Gutschrift', pageWidth - margin, yPos, { align: 'right' })
    }

    yPos += 15

    // ============================================
    // SWISS QR-BILL PAYMENT SLIP (Zahlteil)
    // Official dimensions: 210mm x 105mm at bottom of A4
    // ============================================
    if (!isCreditNote) {
      // Swiss QR-Bill starts at 105mm from bottom of page
      const qrBillY = pageHeight - 105
      const receiptWidth = 62 // Empfangsschein width
      const paymentPartX = receiptWidth + 5 // Start of Zahlteil (with separator)

      // Perforation line (horizontal) - dashed line at top of payment slip
      pdf.setDrawColor(0, 0, 0)
      pdf.setLineWidth(0.3)
      pdf.setLineDashPattern([2, 2], 0)
      pdf.line(0, qrBillY, pageWidth, qrBillY)
      pdf.setLineDashPattern([], 0) // Reset to solid

      // Scissors symbol
      pdf.setFontSize(8)
      pdf.setTextColor(0, 0, 0)
      pdf.text('✂', 5, qrBillY - 1)

      // Vertical perforation line between receipt and payment part
      pdf.setLineDashPattern([2, 2], 0)
      pdf.line(receiptWidth, qrBillY, receiptWidth, pageHeight)
      pdf.setLineDashPattern([], 0)

      // ========== EMPFANGSSCHEIN (Receipt) - Left section ==========
      let receiptY = qrBillY + 8
      const receiptMargin = 5

      // Title
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Empfangsschein', receiptMargin, receiptY)
      receiptY += 8

      // Konto / Zahlbar an
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Konto / Zahlbar an', receiptMargin, receiptY)
      receiptY += 3
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(PAYMENT_CONFIG.iban, receiptMargin, receiptY)
      receiptY += 3
      pdf.text(PAYMENT_CONFIG.creditorName, receiptMargin, receiptY)
      receiptY += 3
      pdf.text(`${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}`, receiptMargin, receiptY)
      receiptY += 3
      pdf.text(`${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`, receiptMargin, receiptY)
      receiptY += 6

      // Referenz
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Referenz', receiptMargin, receiptY)
      receiptY += 3
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      const formattedRef = invoice.invoiceNumber.replace(/(.{5})/g, '$1 ').trim()
      pdf.text(formattedRef, receiptMargin, receiptY)
      receiptY += 6

      // Zahlbar durch
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Zahlbar durch', receiptMargin, receiptY)
      receiptY += 3
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      if (invoice.seller.firstName && invoice.seller.lastName) {
        pdf.text(`${invoice.seller.firstName} ${invoice.seller.lastName}`, receiptMargin, receiptY)
        receiptY += 3
      }
      if (invoice.seller.street) {
        pdf.text(`${invoice.seller.street} ${invoice.seller.streetNumber || ''}`.trim(), receiptMargin, receiptY)
        receiptY += 3
      }
      if (invoice.seller.postalCode && invoice.seller.city) {
        pdf.text(`${invoice.seller.postalCode} ${invoice.seller.city}`, receiptMargin, receiptY)
      }

      // Currency and Amount at bottom of receipt
      const receiptBottomY = pageHeight - 15
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Währung', receiptMargin, receiptBottomY - 8)
      pdf.text('Betrag', receiptMargin + 20, receiptBottomY - 8)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text('CHF', receiptMargin, receiptBottomY - 3)
      pdf.text(invoice.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), receiptMargin + 20, receiptBottomY - 3)

      // Annahmestelle
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Annahmestelle', receiptWidth - 25, receiptBottomY - 3)

      // ========== ZAHLTEIL (Payment Part) - Right section ==========
      let paymentY = qrBillY + 8
      const paymentMargin = paymentPartX + 5

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

        // ========== ZAHLTEIL - Title ==========
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor(0, 0, 0)
        pdf.text('Zahlteil', paymentMargin, paymentY)

        // QR Code - positioned in the payment part (46x46mm is official size)
        const qrSize = 46
        const qrX = paymentMargin
        const qrY = paymentY + 5

        // Add QR code image
        pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

        // Swiss cross in center of QR code (7x7mm)
        const crossSize = 7
        const crossX = qrX + (qrSize - crossSize) / 2
        const crossY = qrY + (qrSize - crossSize) / 2
        pdf.setFillColor(255, 255, 255)
        pdf.rect(crossX, crossY, crossSize, crossSize, 'F')
        pdf.setFillColor(0, 0, 0)
        pdf.rect(crossX + 0.5, crossY + 0.5, crossSize - 1, crossSize - 1, 'F')
        pdf.setFillColor(255, 255, 255)
        // Horizontal bar of cross
        pdf.rect(crossX + 1.5, crossY + 2.5, crossSize - 3, 2, 'F')
        // Vertical bar of cross
        pdf.rect(crossX + 2.5, crossY + 1.5, 2, crossSize - 3, 'F')

        // ========== ZAHLTEIL - Right side info ==========
        const infoX = paymentMargin + qrSize + 10
        let infoY = paymentY + 8

        // Währung / Betrag
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Währung', infoX, infoY)
        pdf.text('Betrag', infoX + 25, infoY)
        infoY += 4
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.text('CHF', infoX, infoY)
        pdf.text(invoice.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), infoX + 25, infoY)
        infoY += 10

        // Konto / Zahlbar an (right column of Zahlteil)
        const rightInfoX = pageWidth - 70
        let rightInfoY = paymentY + 8

        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Konto / Zahlbar an', rightInfoX, rightInfoY)
        rightInfoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text(PAYMENT_CONFIG.iban, rightInfoX, rightInfoY)
        rightInfoY += 3
        pdf.text(PAYMENT_CONFIG.creditorName, rightInfoX, rightInfoY)
        rightInfoY += 3
        pdf.text(`${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}`, rightInfoX, rightInfoY)
        rightInfoY += 3
        pdf.text(`${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`, rightInfoX, rightInfoY)
        rightInfoY += 6

        // Referenz
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Referenz', rightInfoX, rightInfoY)
        rightInfoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text(formattedRef, rightInfoX, rightInfoY)
        rightInfoY += 6

        // Zahlbar durch
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Zahlbar durch', rightInfoX, rightInfoY)
        rightInfoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        if (invoice.seller.firstName && invoice.seller.lastName) {
          pdf.text(`${invoice.seller.firstName} ${invoice.seller.lastName}`, rightInfoX, rightInfoY)
          rightInfoY += 3
        }
        if (invoice.seller.street) {
          pdf.text(`${invoice.seller.street} ${invoice.seller.streetNumber || ''}`.trim(), rightInfoX, rightInfoY)
          rightInfoY += 3
        }
        if (invoice.seller.postalCode && invoice.seller.city) {
          pdf.text(`${invoice.seller.postalCode} ${invoice.seller.city}`, rightInfoX, rightInfoY)
        }
      } catch (error) {
        console.error('Error generating QR code:', error)
        // QR-Code Fehler wird geloggt, aber PDF wird trotzdem erstellt
      }

      // No additional instructions needed - keep it minimal
    } else {
      // Credit Note: Simple info
      yPos += 5

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)

      if (invoice.originalInvoiceId && (invoice as any).originalInvoice) {
        pdf.text(
          `Korrigiert Rechnung ${(invoice as any).originalInvoice.invoiceNumber} vom ${new Date((invoice as any).originalInvoice.createdAt).toLocaleDateString('de-CH')}`,
          margin,
          yPos
        )
        yPos += 5
      }

      pdf.text('Es ist keine Zahlung erforderlich.', margin, yPos)
    }

    // ============================================
    // FOOTER - Only for credit notes (QR-Bill takes footer space for regular invoices)
    // ============================================
    if (isCreditNote) {
      const footerY = pageHeight - 20

      // Footer line
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.line(margin, footerY, pageWidth - margin, footerY)

      // Footer text - single line, centered
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120, 120, 120)
      pdf.text(
        `${PAYMENT_CONFIG.creditorName} | ${PAYMENT_CONFIG.email} | ${PAYMENT_CONFIG.website}`,
        pageWidth / 2,
        footerY + 6,
        { align: 'center' }
      )
      pdf.text(
        `UID: ${PAYMENT_CONFIG.uid} | ${PAYMENT_CONFIG.vatNumber}`,
        pageWidth / 2,
        footerY + 11,
        { align: 'center' }
      )
    }

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
