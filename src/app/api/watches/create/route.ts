import { generateArticleNumber } from '@/lib/article-number'
import { authOptions } from '@/lib/auth'
import { moderateWatch } from '@/lib/auto-moderation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { uploadImagesToBlob, isBlobUrl } from '@/lib/blob-storage'

// WICHTIG: Erhöhe Body-Size-Limit für große Bild-Uploads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 Sekunden für große Uploads

export async function POST(request: NextRequest) {
  try {
    console.log('Watch creation API called')

    const rawData = await request.json()

    // WICHTIG: Prüfe Request-Größe und logge sie für Debugging
    const requestSizeMB = JSON.stringify(rawData).length / (1024 * 1024)
    console.log(`[Watch Create] Request size: ${requestSizeMB.toFixed(2)}MB`)

    if (requestSizeMB > 10) {
      console.warn(`[Watch Create] WARNING: Request is very large (${requestSizeMB.toFixed(2)}MB)`)
    }

    // Prüfe ob description vielleicht ein JSON-String ist, der geparst werden muss
    if (typeof rawData.description === 'string' && rawData.description.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(rawData.description)
        if (Array.isArray(parsed)) {
          console.log('Description was a JSON string, parsed it to array')
          rawData.description = parsed
        }
      } catch (e) {
        // Nicht parsbar, bleibt wie es ist
      }
    }

    // DEBUG: Zeige was ankommt
    console.log('Raw data received:', {
      descriptionType: typeof rawData.description,
      descriptionIsArray: Array.isArray(rawData.description),
      descriptionLength:
        typeof rawData.description === 'string' ? rawData.description.length : 'N/A',
      descriptionPreview:
        typeof rawData.description === 'string'
          ? rawData.description.substring(0, 200)
          : Array.isArray(rawData.description)
            ? `Array[${rawData.description.length}]`
            : rawData.description,
      imagesType: Array.isArray(rawData.images),
      imagesCount: rawData.images?.length || 0,
      descriptionContainsImage:
        typeof rawData.description === 'string'
          ? rawData.description.includes('data:image/') ||
            rawData.description.includes('iVBORw0KGgo')
          : false,
    })

    // KRITISCH: Bereinige description SOFORT nach dem Parsen - KOMPLETT NEU AUFBAUEN
    let cleanDescription = ''

    // Hilfsfunktion: Prüft ob ein String ein Bild ist
    const isImageData = (str: string): boolean => {
      if (typeof str !== 'string') return false
      // Prüfe auf Base64-Bilder (mit oder ohne Prefix)
      if (
        str.startsWith('data:image/') ||
        str.startsWith('data:video/') ||
        str.startsWith('iVBORw0KGgo') ||
        str.startsWith('/9j/') || // JPEG Base64
        str.startsWith('R0lGODlh') || // GIF Base64
        str.startsWith('UklGR')
      ) {
        // WebP Base64
        return true
      }
      // Prüfe auf sehr lange Strings (wahrscheinlich Base64 ohne Prefix)
      if (str.length > 10000) {
        return true
      }
      // Prüfe ob es hauptsächlich Base64-Zeichen sind
      const base64Pattern = /^[A-Za-z0-9+/=]+$/
      if (str.length > 100 && base64Pattern.test(str)) {
        return true
      }
      return false
    }

    if (rawData.description) {
      if (Array.isArray(rawData.description)) {
        // Baue description komplett neu auf - NUR Text, KEINE Bilder
        const textParts: string[] = []
        for (const item of rawData.description) {
          if (typeof item === 'string') {
            // Prüfe ob es ein Bild ist
            if (!isImageData(item)) {
              // Prüfe ob der String selbst Bilder enthält (z.B. "text" + Base64)
              let cleanItem = item
              const imagePatterns = ['data:image/', 'iVBORw0KGgo', '/9j/', 'R0lGODlh', 'UklGR']
              let earliestIndex = -1
              for (const pattern of imagePatterns) {
                const idx = cleanItem.indexOf(pattern)
                if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
                  earliestIndex = idx
                }
              }
              if (earliestIndex !== -1) {
                cleanItem = cleanItem.substring(0, earliestIndex).trim()
              }
              if (cleanItem && cleanItem.length > 0 && cleanItem.length < 10000) {
                textParts.push(cleanItem)
              }
            }
          }
        }
        cleanDescription = textParts.join(' ').trim()
      } else if (typeof rawData.description === 'string') {
        // Prüfe ob der gesamte String ein Bild ist
        if (isImageData(rawData.description)) {
          console.log('Description is entirely image data, clearing it')
          cleanDescription = ''
        } else {
          // Prüfe ob der String Bilder enthält und entferne sie KOMPLETT
          let tempDesc = rawData.description

          // Entferne ALLE Base64-Bild-Strings - suche nach allen möglichen Positionen
          const imagePatterns = [
            'data:image/',
            'iVBORw0KGgo', // PNG Base64
            '/9j/', // JPEG Base64
            'R0lGODlh', // GIF Base64
            'UklGR', // WebP Base64
          ]

          let earliestImageIndex = -1
          for (const pattern of imagePatterns) {
            const index = tempDesc.indexOf(pattern)
            if (index !== -1 && (earliestImageIndex === -1 || index < earliestImageIndex)) {
              earliestImageIndex = index
            }
          }

          if (earliestImageIndex !== -1) {
            console.log(
              `Found image data at index ${earliestImageIndex}, removing everything from that point`
            )
            tempDesc = tempDesc.substring(0, earliestImageIndex).trim()
          }

          // Prüfe nochmal ob nach der Bereinigung noch Bilder drin sind
          if (
            tempDesc.includes('data:image/') ||
            tempDesc.includes('iVBORw0KGgo') ||
            tempDesc.includes('/9j/') ||
            tempDesc.includes('R0lGODlh') ||
            tempDesc.includes('UklGR')
          ) {
            console.error('CRITICAL: Images still found in cleanDescription, clearing it!')
            cleanDescription = ''
          } else {
            cleanDescription = tempDesc.trim()
          }
        }
      }
    }

    // Extrahiere Bilder aus description und füge sie zu images hinzu
    let extractedImages: string[] = []
    if (rawData.description) {
      if (Array.isArray(rawData.description)) {
        extractedImages = rawData.description.filter((item: any) => {
          return (
            typeof item === 'string' &&
            (item.startsWith('data:image/') ||
              item.startsWith('http://') ||
              item.startsWith('https://') ||
              item.startsWith('iVBORw0KGgo') ||
              item.length > 10000)
          )
        })
      } else if (typeof rawData.description === 'string') {
        if (
          rawData.description.startsWith('data:image/') ||
          rawData.description.startsWith('http://') ||
          rawData.description.startsWith('https://') ||
          rawData.description.startsWith('iVBORw0KGgo') ||
          rawData.description.length > 10000
        ) {
          extractedImages.push(rawData.description)
        }
      }
    }

    // Kombiniere images mit extrahierten Bildern
    let allImages: string[] = []
    if (rawData.images && Array.isArray(rawData.images)) {
      allImages = [...rawData.images, ...extractedImages]
    } else if (rawData.images && typeof rawData.images === 'string') {
      try {
        const parsed = JSON.parse(rawData.images)
        if (Array.isArray(parsed)) {
          allImages = [...parsed, ...extractedImages]
        } else {
          allImages = extractedImages
        }
      } catch {
        allImages = extractedImages
      }
    } else {
      allImages = extractedImages
    }

    // Entferne Duplikate
    allImages = Array.from(new Set(allImages))

    console.log('Data cleanup:', {
      originalDescriptionType: typeof rawData.description,
      originalDescriptionIsArray: Array.isArray(rawData.description),
      cleanedDescriptionLength: cleanDescription.length,
      extractedImagesCount: extractedImages.length,
      totalImagesCount: allImages.length,
    })

    const {
      brand,
      model,
      referenceNumber,
      year,
      condition,
      material,
      movement,
      caseDiameter,
      price,
      buyNowPrice,
      auctionEnd,
      auctionStart,
      auctionDuration,
      autoRenew,
      lastRevision,
      accuracy,
      fullset,
      onlyBox,
      onlyPapers,
      onlyAllLinks,
      hasWarranty,
      warrantyMonths,
      warrantyYears,
      hasSellerWarranty,
      sellerWarrantyMonths,
      sellerWarrantyYears,
      sellerWarrantyNote,
      title,
      video,
      shippingMethods,
      booster,
      category: rawCategory,
      subcategory,
      paymentProtectionEnabled,
    } = rawData

    // Normalisiere Kategorie
    const category = rawCategory && typeof rawCategory === 'string' ? rawCategory.trim() : ''

    // Verwende bereinigte Werte
    const description = cleanDescription
    const images = allImages // Wird später zu blobImageUrls konvertiert

    // Validierung der Pflichtfelder (description wird später final bereinigt)
    // Prüfe hier nur, ob überhaupt etwas vorhanden ist
    if (!title || !condition || !price) {
      console.log('Validation failed:', { title, condition, price })
      return NextResponse.json(
        {
          message: 'Bitte füllen Sie alle Pflichtfelder aus (Titel, Beschreibung, Zustand, Preis)',
        },
        { status: 400 }
      )
    }

    // Description-Validierung: Auch wenn leer, erlauben wir es (kann später bereinigt werden)
    // Die finale Bereinigung passiert vor dem Prisma-Call

    // Validierung der Lieferart
    if (!shippingMethods || !Array.isArray(shippingMethods) || shippingMethods.length === 0) {
      console.log('Validation failed: shippingMethods missing or empty', shippingMethods)
      return NextResponse.json(
        { message: 'Bitte wählen Sie mindestens eine Lieferart aus' },
        { status: 400 }
      )
    }

    // Konvertiere Jahr zu Integer falls vorhanden
    const yearInt = year ? parseInt(year) : null

    // Konvertiere Preise zu Float
    // WICHTIG: Artikelpreise werden NICHT gerundet - exakter Betrag wird gespeichert (z.B. CHF 1.80)
    // Nur Rechnungsbeträge (Kommission, MwSt) werden auf 5 Rappen gerundet
    const priceFloat = parseFloat(price)
    const buyNowPriceFloat = buyNowPrice ? parseFloat(buyNowPrice) : null

    // Konvertiere Durchmesser zu Float
    const caseDiameterFloat = caseDiameter ? parseFloat(caseDiameter) : null

    // Konvertiere Garantie-Zeiten zu Integer
    const warrantyMonthsInt = warrantyMonths ? parseInt(warrantyMonths) : null
    const warrantyYearsInt = warrantyYears ? parseInt(warrantyYears) : null
    const sellerWarrantyMonthsInt = sellerWarrantyMonths ? parseInt(sellerWarrantyMonths) : null
    const sellerWarrantyYearsInt = sellerWarrantyYears ? parseInt(sellerWarrantyYears) : null

    // Konvertiere letzte Revision zu Date falls vorhanden
    const lastRevisionDate = lastRevision ? new Date(lastRevision) : null

    // Konvertiere Startzeitpunkt, Auktionsdauer und berechne Auktionsende
    // Nur verarbeiten, wenn isAuction aktiviert ist
    let auctionStartDate: Date | null = null
    let auctionEndDate: Date | null = null
    let auctionDurationInt: number | null = null

    const isAuctionActive = rawData.isAuction === true || rawData.isAuction === 'true'

    if (isAuctionActive) {
      // Parse Startzeitpunkt, falls vorhanden (nicht leer und nicht null)
      if (auctionStart && typeof auctionStart === 'string' && auctionStart.trim() !== '') {
        try {
          auctionStartDate = new Date(auctionStart)
          // Prüfe ob Datum gültig ist
          if (isNaN(auctionStartDate.getTime())) {
            return NextResponse.json(
              {
                message:
                  'Der Starttermin ist ungültig. Bitte wählen Sie ein gültiges Datum und eine gültige Uhrzeit.',
              },
              { status: 400 }
            )
          }
          // Validierung: Startzeitpunkt muss in der Zukunft liegen
          const now = new Date()
          if (auctionStartDate <= now) {
            return NextResponse.json(
              { message: 'Der Starttermin muss in der Zukunft liegen.' },
              { status: 400 }
            )
          }
        } catch (error) {
          console.error('Error parsing auctionStart:', error)
          return NextResponse.json(
            { message: 'Fehler beim Verarbeiten des Starttermins.' },
            { status: 400 }
          )
        }
      }

      // Berechne Startzeitpunkt (jetzt oder gewählter Termin)
      const actualStartDate = auctionStartDate || new Date()

      // Prüfe auctionDuration - kann String, Number oder leer sein
      if (auctionDuration !== null && auctionDuration !== undefined && auctionDuration !== '') {
        let durationValue: number | null = null

        if (typeof auctionDuration === 'number') {
          durationValue = auctionDuration
        } else if (typeof auctionDuration === 'string' && auctionDuration.trim() !== '') {
          durationValue = parseInt(auctionDuration.trim())
        }

        if (durationValue !== null && !isNaN(durationValue)) {
          // Validierung: Max. 30 Tage
          if (durationValue < 1 || durationValue > 30) {
            return NextResponse.json(
              { message: 'Die Laufzeit muss zwischen 1 und 30 Tagen liegen.' },
              { status: 400 }
            )
          }
          auctionDurationInt = durationValue
          // Berechne Auktionsende basierend auf Startzeit + Dauer
          auctionEndDate = new Date(
            actualStartDate.getTime() + auctionDurationInt * 24 * 60 * 60 * 1000
          )
        }
      }

      // Fallback: Falls keine Dauer angegeben wurde, aber ein Enddatum
      if (
        !auctionEndDate &&
        auctionEnd &&
        typeof auctionEnd === 'string' &&
        auctionEnd.trim() !== ''
      ) {
        // Fallback: Falls noch das alte datetime-local Format verwendet wird
        try {
          auctionEndDate = new Date(auctionEnd)
          if (isNaN(auctionEndDate.getTime())) {
            return NextResponse.json(
              {
                message:
                  'Das Auktionsende ist ungültig. Bitte wählen Sie ein gültiges Datum und eine gültige Uhrzeit.',
              },
              { status: 400 }
            )
          }
        } catch (error) {
          console.error('Error parsing auctionEnd:', error)
          return NextResponse.json(
            { message: 'Fehler beim Verarbeiten des Auktionsendes.' },
            { status: 400 }
          )
        }
      }
    }

    // Debug: Log berechnete Daten
    console.log('Calculated auction dates:', {
      isAuctionActive,
      auctionStartDate: auctionStartDate?.toISOString() || null,
      auctionEndDate: auctionEndDate?.toISOString() || null,
      auctionDurationInt,
    })

    // Verkäufer aus der Session ermitteln
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // Prüfe ob der User in der Datenbank existiert und verifiziert ist
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        verified: true,
        verificationStatus: true,
        isBlocked: true,
      },
    })

    if (!seller) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden. Bitte melden Sie sich erneut an.' },
        { status: 404 }
      )
    }

    // Prüfe ob User gesperrt ist
    if (seller.isBlocked) {
      return NextResponse.json(
        { message: 'Ihr Konto wurde gesperrt. Sie können keine Artikel verkaufen.' },
        { status: 403 }
      )
    }

    // Prüfe Verifizierung: User muss verified=true UND verificationStatus='approved' haben
    if (!seller.verified || seller.verificationStatus !== 'approved') {
      console.log('Seller not verified:', {
        id: seller.id,
        email: seller.email,
        verified: seller.verified,
        verificationStatus: seller.verificationStatus,
      })
      return NextResponse.json(
        {
          message:
            'Sie müssen sich zuerst verifizieren, um Artikel verkaufen zu können. Bitte besuchen Sie die Verifizierungsseite.',
          requiresVerification: true,
        },
        { status: 403 }
      )
    }

    console.log('Seller verified:', { id: seller.id, email: seller.email })

    console.log('Creating watch with data:', {
      title: title || `${brand} ${model}`,
      brand,
      model,
      price: priceFloat,
    })

    // cleanDescription wurde bereits oben bereinigt

    // FINALE VALIDIERUNG: Stelle sicher, dass description wirklich ein String ist
    // cleanDescription wurde bereits oben komplett bereinigt
    let finalDescription = ''

    if (typeof cleanDescription === 'string') {
      // Prüfe nochmal, ob es Bilder enthält (sollte nicht passieren, aber Sicherheit)
      if (
        cleanDescription.includes('data:image/') ||
        cleanDescription.includes('data:video/') ||
        cleanDescription.includes('iVBORw0KGgo') ||
        cleanDescription.includes('/9j/') ||
        cleanDescription.includes('R0lGODlh') ||
        cleanDescription.includes('UklGR') ||
        cleanDescription.length > 100000
      ) {
        console.error('CRITICAL: cleanDescription still contains images after cleanup!')
        finalDescription = ''
      } else {
        finalDescription = cleanDescription.trim()
      }
    } else {
      // Falls es kein String ist, mache es zu einem leeren String
      finalDescription = ''
    }
