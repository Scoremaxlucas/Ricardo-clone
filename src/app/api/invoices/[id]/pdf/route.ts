import { authOptions } from '@/lib/auth'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { prisma } from '@/lib/prisma'
import { formatValidationResult, validateQRBill } from '@/lib/qr-bill-validator'
import { formatQRReference } from '@/lib/qr-reference'
import { jsPDF } from 'jspdf'
import { getServerSession } from 'next-auth'
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
    // HEADER - Professioneller Header
    // ============================================
    pdf.setFillColor(15, 118, 110) // Primary color (teal)
    pdf.rect(0, 0, pageWidth, 40, 'F')

    // Logo/Name Bereich
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Helvenda', margin, 25)

    // Untertitel
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Online-Marktplatz', margin, 32)

    // Rechnungstyp rechts oben
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(255, 255, 255)
    pdf.text(isCreditNote ? 'Korrektur-Rechnung' : 'Rechnung', pageWidth - margin, 25, {
      align: 'right',
    })

    // ============================================
    // FIRMENADRESSE (links oben unter Header)
    // ============================================
    let yPos = 50
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')

    pdf.text(PAYMENT_CONFIG.creditorName, margin, yPos)
    yPos += 5
    pdf.text(
      `${PAYMENT_CONFIG.address.street} ${PAYMENT_CONFIG.address.streetNumber}`,
      margin,
      yPos
    )
    yPos += 5
    pdf.text(`${PAYMENT_CONFIG.address.postalCode} ${PAYMENT_CONFIG.address.city}`, margin, yPos)
    yPos += 5
    pdf.text('Schweiz', margin, yPos)

    // ============================================
    // RECHNUNGSDATEN (rechts oben)
    // ============================================
    yPos = 50
    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Rechnungsnummer:', pageWidth - margin, yPos, { align: 'right' })
    yPos += 5
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(invoice.invoiceNumber, pageWidth - margin, yPos, { align: 'right' })
    yPos += 6
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(
      `Datum: ${new Date(invoice.createdAt).toLocaleDateString('de-CH')}`,
      pageWidth - margin,
      yPos,
      { align: 'right' }
    )
    yPos += 5
    if (!isCreditNote) {
      pdf.text(
        `Fälligkeitsdatum: ${new Date(invoice.dueDate).toLocaleDateString('de-CH')}`,
        pageWidth - margin,
        yPos,
        { align: 'right' }
      )
    } else if (invoice.originalInvoice) {
      // Zeige Verweis auf ursprüngliche Rechnung bei Korrektur-Rechnungen
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Storniert Rechnung: ${invoice.originalInvoice.invoiceNumber}`,
        pageWidth - margin,
        yPos,
        { align: 'right' }
      )
      yPos += 5
      pdf.text(
        `vom ${new Date(invoice.originalInvoice.createdAt).toLocaleDateString('de-CH')}`,
        pageWidth - margin,
        yPos,
        { align: 'right' }
      )
    }

    // ============================================
    // EMPFÄNGERADRESSE
    // ============================================
    yPos = 85
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Rechnungsempfänger:', margin, yPos)
    yPos += 7

    pdf.setFont('helvetica', 'normal')
    if (invoice.seller.firstName && invoice.seller.lastName) {
      pdf.text(`${invoice.seller.firstName} ${invoice.seller.lastName}`, margin, yPos)
      yPos += 6
    }
    if (invoice.seller.companyName) {
      pdf.text(invoice.seller.companyName, margin, yPos)
      yPos += 6
    }
    if (invoice.seller.street && invoice.seller.streetNumber) {
      pdf.text(`${invoice.seller.street} ${invoice.seller.streetNumber}`, margin, yPos)
      yPos += 6
    }
    if (invoice.seller.postalCode && invoice.seller.city) {
      pdf.text(`${invoice.seller.postalCode} ${invoice.seller.city}`, margin, yPos)
      yPos += 6
    }
    if (invoice.seller.country) {
      pdf.text(invoice.seller.country, margin, yPos)
      yPos += 6
    }

    // ============================================
    // RECHNUNGSPOSTEN TABELLE
    // ============================================
    yPos += 10

    // Tabellenkopf
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPos - 5, contentWidth, 8, 'F')

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Beschreibung', margin + 2, yPos)
    pdf.text('Betrag', pageWidth - margin - 2, yPos, { align: 'right' })

    yPos += 8
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // Rechnungsposten
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)

    for (const item of invoice.items) {
      const description = item.watch
        ? `${item.description}${item.watch.brand || item.watch.model ? ` (${[item.watch.brand, item.watch.model].filter(Boolean).join(' ')})` : ''}`
        : item.description

      // Zeilenumbruch für lange Beschreibungen
      const lines = pdf.splitTextToSize(description, contentWidth - 50)

      for (let i = 0; i < lines.length; i++) {
        pdf.text(lines[i], margin + 2, yPos)
        if (i === 0) {
          pdf.text(`CHF ${item.total.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' })
        }
        yPos += 5
      }
      yPos += 2
    }

    // ============================================
    // ZUSAMMENFASSUNG
    // ============================================
    yPos += 5
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text('Zwischensumme:', pageWidth - margin - 50, yPos, { align: 'right' })
    pdf.setTextColor(0, 0, 0)
    pdf.text(`CHF ${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 2, yPos, { align: 'right' })
    yPos += 6

    pdf.setTextColor(100, 100, 100)
    pdf.text(`MwSt (${(invoice.vatRate * 100).toFixed(1)}%):`, pageWidth - margin - 50, yPos, {
      align: 'right',
    })
    pdf.setTextColor(0, 0, 0)
    pdf.text(`CHF ${invoice.vatAmount.toFixed(2)}`, pageWidth - margin - 2, yPos, {
      align: 'right',
    })
    yPos += 8

    pdf.setDrawColor(0, 0, 0)
    pdf.setLineWidth(0.5)
    pdf.line(pageWidth - margin - 50, yPos, pageWidth - margin, yPos)
    yPos += 6

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Total:', pageWidth - margin - 50, yPos, { align: 'right' })
    pdf.text(`CHF ${Math.abs(invoice.total).toFixed(2)}`, pageWidth - margin - 2, yPos, {
      align: 'right',
    })

    if (isCreditNote) {
      yPos += 6
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(200, 0, 0)
      pdf.text('(Gutschrift - wird automatisch verrechnet)', pageWidth - margin - 2, yPos, {
        align: 'right',
      })
    }

    // ============================================
    // ZAHLUNGSINFORMATIONEN & QR-EINZAHLUNGSSCHEIN
    // ============================================
    if (!isCreditNote) {
      // Startposition für Zahlungsbereich
      const paymentStartY = yPos + 20

      // Höhe des Zahlungsbereichs (erhöht wegen zusätzlicher Referenznummer-Zeile)
      const paymentHeight = 86

      // Hintergrund für Zahlungsbereich
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, paymentStartY, contentWidth, paymentHeight, 'F')

      // Rahmen
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.3)
      pdf.rect(margin, paymentStartY, contentWidth, paymentHeight, 'S')

      // Überschrift
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Zahlungsinformationen', margin + 5, paymentStartY + 8)

      // Linke Spalte: Zahlungsdetails
      let paymentY = paymentStartY + 15
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      pdf.text(`Zugunsten von:`, margin + 5, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.text(PAYMENT_CONFIG.creditorName, margin + 45, paymentY)
      paymentY += 6

      pdf.setFont('helvetica', 'normal')
      pdf.text(`IBAN:`, margin + 5, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.text(PAYMENT_CONFIG.iban, margin + 45, paymentY)
      paymentY += 6

      pdf.setFont('helvetica', 'normal')
      pdf.text(`BIC/SWIFT:`, margin + 5, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.text(PAYMENT_CONFIG.bic, margin + 45, paymentY)
      paymentY += 6

      pdf.setFont('helvetica', 'normal')
      pdf.text(`Verwendungszweck:`, margin + 5, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.text(invoice.invoiceNumber, margin + 45, paymentY)
      paymentY += 6

      // Referenznummer für Überweisung (wichtig für automatische Zuordnung)
      // Berechne Referenznummer (wie im QR-Code verwendet)
      let cleanReference = invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '')
      if (cleanReference.length === 0) {
        cleanReference = invoice.invoiceNumber.replace(/[^0-9A-Za-z]/g, '')
      }
      // Für Anzeige: Referenznummer ohne Leerzeichen (Leerzeichen nur für QR-Code)
      const displayReference = cleanReference.substring(0, 25)

      pdf.setFont('helvetica', 'normal')
      pdf.text(`Referenznummer:`, margin + 5, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.text(displayReference || invoice.invoiceNumber, margin + 45, paymentY)
      paymentY += 6

      pdf.setFont('helvetica', 'normal')
      pdf.text(`Betrag:`, margin + 5, paymentY)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text(`CHF ${invoice.total.toFixed(2)}`, margin + 45, paymentY)

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
        if (process.env.NODE_ENV === 'development' || !validation.isValid) {
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

        // Füge QR-Code rechts oben im Zahlungsbereich hinzu
        const qrSize = 50 // Größe in mm
        const qrX = pageWidth - margin - qrSize - 5
        const qrY = paymentStartY + 10

        pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

        // Hinweis unter QR-Code
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 100, 100)
        pdf.text('Scannen Sie den QR-Code', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' })
        pdf.text('mit Ihrer Banking-App', qrX + qrSize / 2, qrY + qrSize + 7, { align: 'center' })
      } catch (error) {
        console.error('Error generating QR code:', error)
        // QR-Code Fehler wird geloggt, aber PDF wird trotzdem erstellt
      }

      // Hinweis am Ende
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        'Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum.',
        margin + 5,
        paymentStartY + 75
      )
      pdf.text(
        'Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung zugeordnet werden kann.',
        margin + 5,
        paymentStartY + 80
      )
    } else {
      // Bei Credit Notes: Einfacher Hinweis statt Zahlungsinformationen
      yPos += 20

      // Einfacher Rahmen mit grauem Akzent
      pdf.setDrawColor(200, 200, 200)
      pdf.setLineWidth(0.5)
      pdf.setFillColor(250, 250, 250)
      pdf.rect(margin, yPos, contentWidth, 40, 'FD')

      // Überschrift
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Korrektur-Rechnung / Gutschrift', margin + 5, yPos + 8)

      let creditNoteYPos = yPos + 12
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)

      // Verweis auf ursprüngliche Rechnung
      if (invoice.originalInvoice) {
        pdf.text(
          `Storniert Rechnung: ${invoice.originalInvoice.invoiceNumber} vom ${new Date(invoice.originalInvoice.createdAt).toLocaleDateString('de-CH')}`,
          margin + 5,
          creditNoteYPos
        )
        creditNoteYPos += 6
      }

      // Hinweis zur Gutschrift
      pdf.text('Diese Korrektur-Rechnung stellt eine Gutschrift dar.', margin + 5, creditNoteYPos)
      creditNoteYPos += 5
      pdf.text('Es ist keine Zahlung erforderlich. Der Betrag wird automatisch gutgeschrieben.', margin + 5, creditNoteYPos)
    }

    // ============================================
    // FUSSNOTE
    // ============================================
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text('Vielen Dank für Ihr Vertrauen in Helvenda.', margin, pageHeight - 15)
    pdf.text('Bei Fragen kontaktieren Sie uns unter support@helvenda.ch', margin, pageHeight - 10)

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
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
