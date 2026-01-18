import { getMainAddress } from '@/lib/address'
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
          // Bexio-Sync Felder - WICHTIG für korrektes Payment Matching
          qrReference: true,
          bexioInvoiceId: true,
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
          // Bexio-Sync Felder - WICHTIG für korrektes Payment Matching
          qrReference: true,
          bexioInvoiceId: true,
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

    // Fetch seller's address from UserAddress table
    const sellerAddress = await getMainAddress(invoice.sellerId)

    // Extend invoice.seller with address data
    const sellerWithAddress = {
      ...invoice.seller,
      street: sellerAddress?.street || null,
      streetNumber: sellerAddress?.streetNumber || null,
      postalCode: sellerAddress?.postalCode || null,
      city: sellerAddress?.city || null,
      country: sellerAddress?.country || 'Schweiz',
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

    if (sellerWithAddress.firstName && sellerWithAddress.lastName) {
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${sellerWithAddress.firstName} ${sellerWithAddress.lastName}`, margin, yPos)
      yPos += 5
      pdf.setFont('helvetica', 'normal')
    }
    if (sellerWithAddress.companyName) {
      pdf.text(sellerWithAddress.companyName, margin, yPos)
      yPos += 5
    }
    if (sellerWithAddress.street) {
      const streetText = sellerWithAddress.streetNumber
        ? `${sellerWithAddress.street} ${sellerWithAddress.streetNumber}`
        : sellerWithAddress.street
      pdf.text(streetText, margin, yPos)
      yPos += 5
    }
    if (sellerWithAddress.postalCode && sellerWithAddress.city) {
      pdf.text(`${sellerWithAddress.postalCode} ${sellerWithAddress.city}`, margin, yPos)
      yPos += 5
    }
    if (sellerWithAddress.country) {
      pdf.text(sellerWithAddress.country, margin, yPos)
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
      pdf.text(
        `${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}`,
        receiptMargin,
        receiptY
      )
      receiptY += 3
      pdf.text(
        `${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`,
        receiptMargin,
        receiptY
      )
      receiptY += 6

      // Referenz - WICHTIG: Bexio QR-Referenz verwenden wenn verfügbar
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Referenz', receiptMargin, receiptY)
      receiptY += 3
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      // Bexio-Referenz hat Priorität (z.B. RF18XXXXX), sonst interne Nummer formatieren
      const referenceToUse = (invoice as any).qrReference || invoice.invoiceNumber
      const formattedRef = referenceToUse.replace(/(.{5})/g, '$1 ').trim()
      pdf.text(formattedRef, receiptMargin, receiptY)
      receiptY += 6

      // Zahlbar durch
      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Zahlbar durch', receiptMargin, receiptY)
      receiptY += 3
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      if (sellerWithAddress.firstName && sellerWithAddress.lastName) {
        pdf.text(
          `${sellerWithAddress.firstName} ${sellerWithAddress.lastName}`,
          receiptMargin,
          receiptY
        )
        receiptY += 3
      }
      if (sellerWithAddress.street) {
        pdf.text(
          `${sellerWithAddress.street} ${sellerWithAddress.streetNumber || ''}`.trim(),
          receiptMargin,
          receiptY
        )
        receiptY += 3
      }
      if (sellerWithAddress.postalCode && sellerWithAddress.city) {
        pdf.text(
          `${sellerWithAddress.postalCode} ${sellerWithAddress.city}`,
          receiptMargin,
          receiptY
        )
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
      pdf.text(
        invoice.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
        receiptMargin + 20,
        receiptBottomY - 3
      )

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
          sellerWithAddress.firstName ||
          sellerWithAddress.lastName ||
          sellerWithAddress.companyName ||
          sellerWithAddress.name
        )

        const debtorName =
          sellerWithAddress.firstName && sellerWithAddress.lastName
            ? `${sellerWithAddress.firstName} ${sellerWithAddress.lastName}`.trim()
            : sellerWithAddress.companyName?.trim() || sellerWithAddress.name?.trim() || ''

        // Strukturierte Adresse für Debtor (PLZ und Ort kombiniert!)
        const debtorStreet =
          hasDebtorInfo && sellerWithAddress.street?.trim()
            ? `${sellerWithAddress.street.trim()} ${sellerWithAddress.streetNumber?.trim() || ''}`.trim()
            : ''
        const debtorPostalCode =
          hasDebtorInfo && sellerWithAddress.postalCode?.trim()
            ? sellerWithAddress.postalCode.trim()
            : ''
        const debtorCity =
          hasDebtorInfo && sellerWithAddress.city?.trim() ? sellerWithAddress.city.trim() : ''
        const debtorCityLine =
          debtorPostalCode && debtorCity ? `${debtorPostalCode} ${debtorCity}`.trim() : ''
        // WICHTIG: Für Swiss QR-Bill sollte das Land immer "CH" sein (Schweiz)
        // Validiere und korrigiere Länderkürzel automatisch
        let debtorCountry = ''
        if (hasDebtorInfo) {
          const debtorCountryRaw = sellerWithAddress.country?.trim() || 'CH'
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
        // WICHTIG: Bexio QR-Referenz verwenden wenn verfügbar (für korrektes Payment Matching)
        let formattedReference: string
        if ((invoice as any).qrReference && (invoice as any).qrReference.startsWith('RF')) {
          // Bexio-Referenz ist bereits im korrekten SCOR-Format (RF + 23 Zeichen = 25 Zeichen)
          formattedReference = (invoice as any).qrReference
          console.log('[QR-Bill] ✅ Verwende Bexio QR-Referenz:', formattedReference)
        } else {
          // Fallback: Interne Rechnungsnummer formatieren
          formattedReference = formatQRReference(invoice.invoiceNumber)
          console.log('[QR-Bill] ⚠️ Keine Bexio-Referenz, verwende Fallback:', formattedReference)
        }

        // WICHTIG: Für den QR-Code müssen alle Leerzeichen entfernt werden!
        // Die Anzeige-Referenz kann Leerzeichen haben, aber der QR-Code nicht.
        const qrCodeReference = formattedReference.replace(/\s/g, '').trim()

        // Validiere Referenz (ohne Leerzeichen)
        if (qrCodeReference.length === 0) {
          console.error('[QR-Bill] ❌ Referenz ist leer nach Bereinigung!')
        }
        if (qrCodeReference.length > 25) {
          console.error(
            '[QR-Bill] ⚠️  Referenz ist zu lang:',
            qrCodeReference.length,
            'max: 25'
          )
        }
        if (!/^[0-9A-Za-z]+$/.test(qrCodeReference)) {
          console.error('[QR-Bill] ⚠️  Referenz enthält ungültige Zeichen:', qrCodeReference)
        }

        console.log('[QR-Bill] Referenz für Anzeige:', formattedReference)
        console.log('[QR-Bill] Referenz für QR-Code:', qrCodeReference)

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

        // Swiss QR-Bill Format (SPC - Swiss Payments Code) Version 2.2
        // KRITISCH: Der QR-String muss EXAKT 31 Zeilen haben (oder 32 mit Billing Info)
        // Quelle: SIX Swiss Implementation Guidelines for the QR-bill v2.2
        //
        // Für Adresstyp "K" (kombiniert):
        // - Zeile 7: Strasse + Hausnummer ODER Adresszeile 1
        // - Zeile 8: PLZ + Ort ODER Adresszeile 2
        // - Zeile 9: LEER (PLZ nicht verwendet bei Typ K, aber Zeile muss existieren!)
        // - Zeile 10: LEER (Ort nicht verwendet bei Typ K, aber Zeile muss existieren!)

        const qrString = [
          'SPC',                                                                    // 01: QR-Type
          '0200',                                                                   // 02: Version
          '1',                                                                      // 03: Coding (UTF-8)
          cleanIban,                                                                // 04: IBAN (21 Zeichen)
          'K',                                                                      // 05: Creditor Adresstyp (K=kombiniert)
          (creditorName || 'Score-Max GmbH').substring(0, 70),                      // 06: Creditor Name
          (creditorStreetLine || PAYMENT_CONFIG.getStreetLine()).substring(0, 70), // 07: Creditor Strasse+Nr (Adresszeile 1)
          (creditorCityLine || PAYMENT_CONFIG.getCityLine()).substring(0, 70),     // 08: Creditor PLZ+Ort (Adresszeile 2)
          '',                                                                       // 09: Creditor PLZ (LEER bei Typ K!)
          '',                                                                       // 10: Creditor Ort (LEER bei Typ K!)
          creditorCountryCode,                                                      // 11: Creditor Land (2 Zeichen)
          '',                                                                       // 12: Ultimate Creditor Adresstyp
          '',                                                                       // 13: Ultimate Creditor Name
          '',                                                                       // 14: Ultimate Creditor Strasse
          '',                                                                       // 15: Ultimate Creditor PLZ+Ort/Adresszeile2
          '',                                                                       // 16: Ultimate Creditor PLZ
          '',                                                                       // 17: Ultimate Creditor Ort
          '',                                                                       // 18: Ultimate Creditor Land
          formattedAmount,                                                          // 19: Betrag
          'CHF',                                                                    // 20: Währung
          hasDebtorInfo ? 'K' : '',                                                 // 21: Debtor Adresstyp
          (hasDebtorInfo ? debtorName : '').substring(0, 70),                       // 22: Debtor Name
          (hasDebtorInfo ? debtorStreet : '').substring(0, 70),                     // 23: Debtor Strasse (Adresszeile 1)
          (hasDebtorInfo ? debtorCityLine : '').substring(0, 70),                   // 24: Debtor PLZ+Ort (Adresszeile 2)
          '',                                                                       // 25: Debtor PLZ (LEER bei Typ K!)
          '',                                                                       // 26: Debtor Ort (LEER bei Typ K!)
          hasDebtorInfo ? debtorCountry : '',                                       // 27: Debtor Land
          'SCOR',                                                                   // 28: Referenztyp (SCOR = Creditor Reference)
          qrCodeReference,                                                          // 29: Referenz (ohne Leerzeichen!)
          '',                                                                       // 30: Unstrukturierte Mitteilung
          'EPD',                                                                    // 31: Trailer
        ].join('\n')

        // Validiere Zeilenanzahl - MUSS 31 sein!
        const qrLines = qrString.split('\n')
        if (qrLines.length !== 31) {
          console.error(
            '[QR-Bill] ❌ KRITISCH: QR-String hat falsche Anzahl Zeilen:',
            qrLines.length,
            'erwartet: 31'
          )
          console.error('[QR-Bill] Zeilen:')
          qrLines.forEach((line, i) => {
            console.error(`  ${String(i + 1).padStart(2, '0')}: "${line}"`)
          })
        } else {
          console.log('[QR-Bill] ✅ QR-String hat korrekte 31 Zeilen')
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

        // Swiss cross in center of QR code - Offizielle Swiss QR-Bill Spezifikation
        // Quelle: SIX Swiss Payment Standards - Swiss QR-Bill Implementation Guidelines
        // Das Swiss Cross ist genau 7x7mm mit definierten Proportionen

        const crossSize = 7 // Gesamtgrösse 7x7mm
        const crossX = qrX + (qrSize - crossSize) / 2
        const crossY = qrY + (qrSize - crossSize) / 2

        // Offizielle Proportionen des Schweizer Kreuzes:
        // - Weisser Rahmen: 1/7 der Gesamtgrösse = 1mm
        // - Schwarzes Quadrat: 5/7 der Gesamtgrösse = 5mm
        // - Kreuzarm-Breite: 1/5 des schwarzen Quadrats = 1mm
        // - Kreuzarm-Länge: 3/5 des schwarzen Quadrats = 3mm (von Mitte aus)

        const whiteBorder = 1.0 // 1mm weisser Rahmen
        const blackSize = 5.0   // 5mm schwarzes Quadrat
        const armWidth = 1.0    // 1mm Kreuzarm-Breite
        const armLength = 3.0   // 3mm Kreuzarm-Länge (Gesamtlänge = 2 * 1.5mm von Mitte)

        // 1. Weisser Hintergrund (komplettes 7x7mm Quadrat)
        pdf.setFillColor(255, 255, 255)
        pdf.rect(crossX, crossY, crossSize, crossSize, 'F')

        // 2. Schwarzes inneres Quadrat (5x5mm, zentriert)
        const blackX = crossX + whiteBorder
        const blackY = crossY + whiteBorder
        pdf.setFillColor(0, 0, 0)
        pdf.rect(blackX, blackY, blackSize, blackSize, 'F')

        // 3. Weisses Schweizer Kreuz (zentriert im schwarzen Quadrat)
        const centerX = blackX + blackSize / 2
        const centerY = blackY + blackSize / 2

        pdf.setFillColor(255, 255, 255)

        // Horizontaler Balken des Kreuzes
        pdf.rect(
          centerX - armLength / 2,  // X: Mitte - halbe Länge
          centerY - armWidth / 2,   // Y: Mitte - halbe Breite
          armLength,                // Breite: 3mm
          armWidth,                 // Höhe: 1mm
          'F'
        )

        // Vertikaler Balken des Kreuzes
        pdf.rect(
          centerX - armWidth / 2,   // X: Mitte - halbe Breite
          centerY - armLength / 2,  // Y: Mitte - halbe Länge
          armWidth,                 // Breite: 1mm
          armLength,                // Höhe: 3mm
          'F'
        )

        // ========== ZAHLTEIL - Right side info ==========
        // Swiss QR-Bill: Info rechts neben dem QR-Code
        const infoX = paymentMargin + qrSize + 8  // Direkt nach dem QR-Code
        let infoY = paymentY + 8

        // Währung / Betrag (oben links nach QR-Code)
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Währung', infoX, infoY)
        pdf.text('Betrag', infoX + 20, infoY)
        infoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text('CHF', infoX, infoY)
        pdf.text(invoice.total.toFixed(2), infoX + 20, infoY)
        infoY += 8

        // Konto / Zahlbar an
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Konto / Zahlbar an', infoX, infoY)
        infoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text(PAYMENT_CONFIG.iban, infoX, infoY)
        infoY += 3
        pdf.text(PAYMENT_CONFIG.creditorName, infoX, infoY)
        infoY += 3
        pdf.text(
          `${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}`,
          infoX,
          infoY
        )
        infoY += 3
        pdf.text(
          `${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`,
          infoX,
          infoY
        )
        infoY += 6

        // Referenz
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Referenz', infoX, infoY)
        infoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        // Referenz in Gruppen formatieren für bessere Lesbarkeit
        pdf.text(formattedRef, infoX, infoY)
        infoY += 6

        // Zahlbar durch
        pdf.setFontSize(6)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Zahlbar durch', infoX, infoY)
        infoY += 3
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        if (sellerWithAddress.firstName && sellerWithAddress.lastName) {
          pdf.text(
            `${sellerWithAddress.firstName} ${sellerWithAddress.lastName}`,
            infoX,
            infoY
          )
          infoY += 3
        } else if (sellerWithAddress.name) {
          pdf.text(sellerWithAddress.name, infoX, infoY)
          infoY += 3
        }
        if (sellerWithAddress.street) {
          pdf.text(
            `${sellerWithAddress.street} ${sellerWithAddress.streetNumber || ''}`.trim(),
            infoX,
            infoY
          )
          infoY += 3
        }
        if (sellerWithAddress.postalCode && sellerWithAddress.city) {
          pdf.text(
            `${sellerWithAddress.postalCode} ${sellerWithAddress.city}`,
            infoX,
            infoY
          )
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
