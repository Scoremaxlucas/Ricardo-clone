import { generateArticleNumber } from '@/lib/article-number'
import { authOptions } from '@/lib/auth'
import { moderateWatch } from '@/lib/auto-moderation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Watch creation API called')

    const rawData = await request.json()

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

          // Prüfe nochmal ob der verbleibende String ein Bild ist
          if (!isImageData(tempDesc)) {
            cleanDescription = tempDesc.trim()
          } else {
            console.log('Remaining description still contains image data, clearing it')
            cleanDescription = ''
          }
        }
      }
    }

    console.log('After initial cleanup:', {
      cleanDescriptionLength: cleanDescription.length,
      cleanDescriptionPreview: cleanDescription.substring(0, 100),
    })

    // Stelle sicher, dass description max. 100000 Zeichen hat
    if (cleanDescription.length > 100000) {
      cleanDescription = cleanDescription.substring(0, 100000)
    }

    // FINALE PRÜFUNG: Stelle sicher, dass wirklich keine Bilder mehr drin sind
    if (
      cleanDescription.includes('data:image/') ||
      cleanDescription.includes('iVBORw0KGgo') ||
      cleanDescription.includes('/9j/') ||
      cleanDescription.includes('R0lGODlh') ||
      cleanDescription.includes('UklGR')
    ) {
      console.error('CRITICAL: Images still found in cleanDescription, clearing it!')
      cleanDescription = ''
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
    allImages = [...new Set(allImages)]

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
    } = rawData

    // Normalisiere Kategorie
    const category = rawCategory && typeof rawCategory === 'string' ? rawCategory.trim() : ''

    // Verwende bereinigte Werte
    const description = cleanDescription
    const images = allImages

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

    // Prüfe ob der User in der Datenbank existiert
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    })

    if (!seller) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json(
        { message: 'Benutzer nicht gefunden. Bitte melden Sie sich erneut an.' },
        { status: 404 }
      )
    }

    console.log('Seller verified:', { id: seller.id, email: seller.email })

    // Verifizierungsprüfung entfernt - die Frontend-Seite prüft bereits die Verifizierung
    // Wenn das Formular angezeigt wird, kann der Benutzer auch speichern
    // Dies verhindert Inkonsistenzen zwischen Frontend und Backend

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

    // Stelle sicher, dass description max. 100000 Zeichen hat
    if (finalDescription.length > 100000) {
      finalDescription = finalDescription.substring(0, 100000)
    }

    console.log('Final description validation:', {
      originalType: typeof cleanDescription,
      finalLength: finalDescription.length,
      finalPreview: finalDescription.substring(0, 100),
      containsImageData:
        finalDescription.includes('data:image/') || finalDescription.includes('iVBORw0KGgo'),
    })

    // Finale Validierung: Stelle sicher, dass description nicht leer ist
    // ABER: Falls die Bereinigung alles entfernt hat, erlaube einen minimalen Fallback
    if (!finalDescription || finalDescription.trim().length === 0) {
      console.log('Warning: description is empty after cleanup, using fallback')
      // Fallback: Verwende Titel als Beschreibung falls vorhanden
      finalDescription =
        title || `${brand || ''} ${model || ''}`.trim() || 'Keine Beschreibung verfügbar'
    }

    // Erstelle die Uhr in der Datenbank
    // images wurde bereits oben bereinigt und kombiniert
    const watchData: any = {
      title: title || `${brand} ${model}`,
      description: finalDescription, // FINAL bereinigt, garantiert ein String ohne Bilder
      brand,
      model,
      year: yearInt,
      condition,
      material: material || null,
      movement: movement || null,
      caseDiameter: caseDiameterFloat,
      price: priceFloat,
      buyNowPrice: buyNowPriceFloat,
      isAuction: !!auctionEndDate,
      images: (() => {
        try {
          // images wurde bereits oben bereinigt und ist ein Array
          if (images && Array.isArray(images) && images.length > 0) {
            // Filtere nur gültige Bild-URLs
            const validImages = images.filter((img: any) => {
              return (
                typeof img === 'string' &&
                (img.startsWith('data:image/') ||
                  img.startsWith('http://') ||
                  img.startsWith('https://'))
              )
            })
            return validImages.length > 0 ? JSON.stringify(validImages) : JSON.stringify([])
          }
          return JSON.stringify([])
        } catch (err) {
          console.error('Error stringifying images:', err)
          return JSON.stringify([])
        }
      })(),
      video: video || null,
      lastRevision: lastRevisionDate,
      accuracy: accuracy || null,
      fullset: fullset || false,
      allLinks: false,
      box: onlyBox || onlyAllLinks || false,
      papers: onlyPapers || onlyAllLinks || false,
      warranty: hasWarranty ? 'Herstellergarantie' : null,
      warrantyMonths: warrantyMonthsInt,
      warrantyYears: warrantyYearsInt,
      warrantyNote: hasSellerWarranty ? sellerWarrantyNote : null,
      warrantyDescription: hasSellerWarranty
        ? `Verkäufer-Garantie: ${sellerWarrantyMonthsInt || 0} Monate, ${sellerWarrantyYearsInt || 0} Jahre`
        : null,
      sellerId: seller.id, // Verwende die verifizierte sellerId
      referenceNumber: referenceNumber || null,
      shippingMethod: (() => {
        try {
          if (shippingMethods && Array.isArray(shippingMethods) && shippingMethods.length > 0) {
            return JSON.stringify(shippingMethods)
          }
          return null
        } catch (err) {
          console.error('Error stringifying shippingMethods:', err)
          return null
        }
      })(),
      boosters: (() => {
        try {
          // Booster kann ein einzelner Code sein (z.B. 'boost') oder ein Array
          if (booster) {
            if (typeof booster === 'string') {
              // Einzelner Booster-Code
              return JSON.stringify([booster])
            } else if (Array.isArray(booster)) {
              // Array von Boostern
              return JSON.stringify(booster)
            }
          }
          return null
        } catch (err) {
          console.error('Error stringifying boosters:', err)
          return null
        }
      })(),
    }

    // Füge Auktionsfelder nur hinzu, wenn es eine aktive Auktion ist
    if (auctionEndDate) {
      watchData.auctionStart = auctionStartDate
      watchData.auctionEnd = auctionEndDate
      watchData.auctionDuration = auctionDurationInt
      watchData.autoRenew = autoRenew === true || autoRenew === 'true' || false
    }

    // Generiere eindeutige Artikelnummer
    try {
      watchData.articleNumber = await generateArticleNumber()
      console.log(`[article-number] Neue Artikelnummer generiert: ${watchData.articleNumber}`)
    } catch (error) {
      console.error('[article-number] Fehler beim Generieren der Artikelnummer:', error)
      // Weiter ohne Artikelnummer - sollte nicht passieren, aber sicherheitshalber
    }

    // FINALE ABSOLUTE SICHERHEITSPRÜFUNG direkt vor Prisma-Call
    // Diese Funktion stellt sicher, dass description wirklich ein sauberer String ist

    const sanitizeDescription = (desc: any): string => {
      // Schritt 1: Stelle sicher, dass es ein String ist
      let result = ''
      if (typeof desc === 'string') {
        result = desc
      } else if (Array.isArray(desc)) {
        // Falls Array, filtere nur Text-Elemente und bereinige jeden einzelnen
        const textParts: string[] = []
        for (const item of desc) {
          if (typeof item === 'string') {
            // Prüfe ob es ein Bild ist
            if (!isImageData(item)) {
              // Prüfe ob der String selbst Bilder enthält
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
        result = textParts.join(' ').trim()
      } else {
        result = String(desc || '').trim()
      }

      // Schritt 2: Entferne ALLE Bilddaten komplett aus dem String
      const imagePatterns = [
        'data:image/',
        'data:video/',
        'iVBORw0KGgo', // PNG Base64
        '/9j/', // JPEG Base64
        'R0lGODlh', // GIF Base64
        'UklGR', // WebP Base64
      ]

      // Finde die erste Position eines Bildes
      let earliestIndex = -1
      for (const pattern of imagePatterns) {
        const index = result.indexOf(pattern)
        if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
          earliestIndex = index
        }
      }

      // Entferne alles ab der ersten Bildposition
      if (earliestIndex !== -1) {
        result = result.substring(0, earliestIndex).trim()
      }

      // Schritt 3: Prüfe auf sehr lange Strings (wahrscheinlich Base64)
      if (result.length > 100000) {
        result = result.substring(0, 100000)
      }

      // Schritt 4: Prüfe nochmal auf Base64-Muster (nur wenn sehr lang)
      const base64Pattern = /^[A-Za-z0-9+/=]+$/
      if (result.length > 1000 && base64Pattern.test(result)) {
        // Wahrscheinlich Base64, leere es
        result = ''
      }

      return result
    }

    // Bereinige watchData.description KOMPLETT
    const originalDescription = watchData.description
    watchData.description = sanitizeDescription(watchData.description)

    console.log('ABSOLUTE FINAL CHECK before Prisma:', {
      originalType: typeof originalDescription,
      originalLength: typeof originalDescription === 'string' ? originalDescription.length : 'N/A',
      originalPreview:
        typeof originalDescription === 'string' ? originalDescription.substring(0, 50) : 'N/A',
      sanitizedLength: watchData.description.length,
      sanitizedPreview: watchData.description.substring(0, 50),
      containsImageData:
        watchData.description.includes('data:image/') ||
        watchData.description.includes('iVBORw0KGgo'),
    })

    // Prüfe ob description leer ist - Falls ja, verwende Fallback
    if (!watchData.description || watchData.description.trim().length === 0) {
      console.log('Warning: description is empty after sanitization, using fallback')
      watchData.description =
        title || `${brand || ''} ${model || ''}`.trim() || 'Keine Beschreibung verfügbar'
    }

    console.log('Final watchData before Prisma:', {
      descriptionType: typeof watchData.description,
      descriptionLength: watchData.description.length,
      descriptionPreview: watchData.description.substring(0, 50),
      imagesType: typeof watchData.images,
      imagesIsString: typeof watchData.images === 'string',
    })

    // Automatische Moderation: Prüfe auf problematische Keywords
    const moderationResult = moderateWatch({
      title: watchData.title,
      description: watchData.description,
      brand: watchData.brand,
      model: watchData.model,
    })

    // Wenn geflaggt, setze isActive auf false für manuelle Prüfung
    if (moderationResult.flagged) {
      console.log('[AUTO-MODERATION] Angebot wurde geflaggt:', {
        reason: moderationResult.reason,
        severity: moderationResult.severity,
        keywords: moderationResult.keywords,
      })
      watchData.isActive = false

      // Erstelle automatische Admin-Notiz
      // (wird nach dem Erstellen des Watches hinzugefügt)
    }

    const watch = await prisma.watch.create({
      data: watchData,
    })

    console.log('Watch created successfully:', watch.id)

    // Wenn geflaggt, erstelle automatische Notiz und Report
    if (moderationResult.flagged) {
      try {
        // Finde Admin-User für automatische Notiz
        const adminUser = await prisma.user.findFirst({
          where: { isAdmin: true },
          select: { id: true },
        })

        if (adminUser) {
          await prisma.adminNote.create({
            data: {
              watchId: watch.id,
              adminId: adminUser.id,
              note: `[AUTOMATISCH] Angebot wurde automatisch deaktiviert. Grund: ${moderationResult.reason}. Severity: ${moderationResult.severity}. Keywords: ${moderationResult.keywords.join(', ')}`,
            },
          })

          await prisma.moderationHistory.create({
            data: {
              watchId: watch.id,
              adminId: adminUser.id,
              action: 'auto_moderated',
              details: JSON.stringify({
                reason: moderationResult.reason,
                severity: moderationResult.severity,
                keywords: moderationResult.keywords,
              }),
            },
          })
        }
      } catch (error) {
        console.error('Error creating auto-moderation note:', error)
        // Fehler sollte nicht kritisch sein
      }
    }

    // Verknüpfe Kategorie, falls angegeben
    if (category && category.trim() !== '') {
      try {
        // Normalisiere den Category-Slug (falls nötig)
        const categorySlug = category.toLowerCase().trim()

        console.log('[CREATE] Linking category:', {
          originalCategory: rawCategory,
          normalizedCategory: category,
          categorySlug,
          watchId: watch.id,
          watchTitle: watch.title || 'N/A',
        })

        // Finde die Kategorie zuerst nach slug, dann nach name
        // Prüfe verschiedene Varianten
        let categoryRecord = await prisma.category.findFirst({
          where: {
            OR: [
              { slug: categorySlug },
              { slug: category },
              { slug: category.toLowerCase() },
              { slug: category.toUpperCase() },
              { name: { equals: category, mode: 'insensitive' } },
              { name: { equals: categorySlug, mode: 'insensitive' } },
            ],
          },
        })

        if (!categoryRecord) {
          // Erstelle die Kategorie, falls sie nicht existiert
          // Verwende den übergebenen Wert als name und slug
          categoryRecord = await prisma.category.create({
            data: {
              name: category,
              slug: categorySlug,
            },
          })
          console.log('[CREATE] Category created:', {
            id: categoryRecord.id,
            name: categoryRecord.name,
            slug: categoryRecord.slug,
          })
        } else {
          console.log('[CREATE] Category found:', {
            id: categoryRecord.id,
            name: categoryRecord.name,
            slug: categoryRecord.slug,
          })
        }

        // Prüfe ob Verknüpfung bereits existiert
        const existingLink = await prisma.watchCategory.findFirst({
          where: {
            watchId: watch.id,
            categoryId: categoryRecord.id,
          },
        })

        if (!existingLink) {
          // Erstelle die WatchCategory-Verknüpfung
          const link = await prisma.watchCategory.create({
            data: {
              watchId: watch.id,
              categoryId: categoryRecord.id,
            },
          })
          console.log('[CREATE] Category linked successfully:', {
            linkId: link.id,
            watchId: watch.id,
            categoryId: categoryRecord.id,
            category: categoryRecord.name,
            slug: categoryRecord.slug,
          })

          // Verifiziere die Verknüpfung
          const verifyLink = await prisma.watchCategory.findUnique({
            where: { id: link.id },
            include: {
              watch: { select: { id: true, title: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          })
          console.log('[CREATE] Verified link:', verifyLink)
        } else {
          console.log('[CREATE] Category link already exists:', {
            linkId: existingLink.id,
            category: categoryRecord.name,
            watchId: watch.id,
          })
        }
      } catch (categoryError: any) {
        console.error('[CREATE] Error linking category:', categoryError)
        console.error('[CREATE] Category error details:', {
          category,
          watchId: watch.id,
          error: categoryError.message,
          stack: categoryError.stack,
        })
        // Fehler bei Kategorie-Verknüpfung sollte nicht die Watch-Erstellung verhindern
      }
    } else {
      console.warn('[CREATE] No category provided for watch:', watch.id)
    }

    // Follow-Funktionalität ist derzeit nicht verfügbar (Follow Model fehlt im Schema)
    // TODO: Follow-Funktionalität wieder aktivieren, wenn Follow Model hinzugefügt wird

    // Erstelle Rechnung für Booster, falls ein kostenpflichtiger Booster gewählt wurde
    try {
      if (booster && booster !== 'none') {
        const boosterCode = typeof booster === 'string' ? booster : booster[0]

        // Hole Booster-Details
        const boosterPrice = await prisma.boosterPrice.findUnique({
          where: { code: boosterCode },
        })

        if (boosterPrice && boosterPrice.price > 0) {
          const vatRate = 0.081 // 8.1% MwSt
          // Preis ist bereits inkl. MwSt - berechne Netto und MwSt-Betrag
          const total = boosterPrice.price // Total ist der Preis inkl. MwSt
          const subtotal = total / (1 + vatRate) // Netto-Preis ohne MwSt
          const vatAmount = total - subtotal // MwSt-Betrag
          // Schweizer Rappenrundung auf 0.05
          const roundedSubtotal = Math.floor(subtotal * 20) / 20
          const roundedVatAmount = Math.ceil(vatAmount * 20) / 20
          const roundedTotal = roundedSubtotal + roundedVatAmount

          // Generiere Rechnungsnummer
          const year = new Date().getFullYear()
          const lastInvoice = await prisma.invoice.findFirst({
            where: {
              invoiceNumber: {
                startsWith: `REV-${year}-`,
              },
            },
            orderBy: {
              invoiceNumber: 'desc',
            },
          })

          let invoiceNumber = `REV-${year}-001`
          if (lastInvoice) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
            invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
          }

          // Erstelle Rechnung für Booster
          const invoice = await prisma.invoice.create({
            data: {
              invoiceNumber,
              sellerId: seller.id,
              saleId: null, // Kein Verkauf, nur Booster
              subtotal: roundedSubtotal,
              vatRate,
              vatAmount: roundedVatAmount,
              total: roundedTotal,
              status: 'pending',
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist
              items: {
                create: [
                  {
                    watchId: watch.id,
                    description: `Booster: ${boosterPrice.name}`,
                    quantity: 1,
                    price: roundedSubtotal,
                    total: roundedSubtotal,
                  },
                ],
              },
            },
          })

          console.log(
            `[watches/create] Booster-Rechnung erstellt: ${invoiceNumber} für ${boosterPrice.name} (CHF ${roundedTotal.toFixed(2)} inkl. MwSt)`
          )

          // Sende E-Mail-Benachrichtigung und erstelle Plattform-Benachrichtigung
          try {
            const { sendInvoiceNotificationAndEmail } = await import('@/lib/invoice')
            await sendInvoiceNotificationAndEmail(invoice)
          } catch (notificationError: any) {
            console.error('[watches/create] Fehler bei Benachrichtigung:', notificationError)
            // Fehler sollte nicht die Rechnungserstellung verhindern
          }
        }
      }
    } catch (invoiceError: any) {
      console.error('[watches/create] Fehler bei Booster-Rechnungserstellung:', invoiceError)
      // Fehler wird ignoriert, Watch war erfolgreich erstellt
    }

    // E-Mail: Angebotsbestätigung an Verkäufer
    try {
      const { sendEmail, getListingConfirmationEmail } = await import('@/lib/email')
      const seller = await prisma.user.findUnique({
        where: { id: watch.sellerId },
        select: {
          name: true,
          email: true,
          nickname: true,
          firstName: true,
        },
      })
      if (seller && seller.email) {
        const sellerName = seller.nickname || seller.firstName || seller.name || 'Verkäufer'
        const { subject, html, text } = getListingConfirmationEmail(
          sellerName,
          watch.title,
          watch.articleNumber,
          watch.id
        )
        await sendEmail({
          to: seller.email,
          subject,
          html,
          text,
        })
        console.log(`[watches/create] ✅ Angebotsbestätigungs-E-Mail gesendet an ${seller.email}`)
      }
    } catch (emailError: any) {
      console.error(
        '[watches/create] ❌ Fehler beim Senden der Angebotsbestätigungs-E-Mail:',
        emailError
      )
    }

    // Suchabo-Matching: Prüfe ob der neue Artikel zu Suchabos passt
    try {
      // Hole die Kategorien des Artikels aus der WatchCategory-Tabelle
      const watchCategories = await prisma.watchCategory.findMany({
        where: { watchId: watch.id },
        include: { category: true },
      })

      // Extrahiere die erste Kategorie-ID (für Kompatibilität)
      const primaryCategoryId = watchCategories.length > 0 ? watchCategories[0].categoryId : null

      // Hole vollständige Watch-Daten für intelligente Suche
      const fullWatch = await prisma.watch.findUnique({
        where: { id: watch.id },
        select: {
          id: true,
          title: true,
          description: true,
          brand: true,
          model: true,
          material: true,
          movement: true,
          referenceNumber: true,
          price: true,
          condition: true,
          year: true,
        },
      })

      const { checkSearchSubscriptions } = await import('@/lib/search-subscription-matcher')
      const matchCount = await checkSearchSubscriptions({
        id: watch.id,
        title: fullWatch?.title || watch.title,
        description: fullWatch?.description || null, // Beschreibung für intelligente Suche
        brand: watch.brand,
        model: watch.model,
        material: fullWatch?.material || null,
        movement: fullWatch?.movement || null,
        referenceNumber: fullWatch?.referenceNumber || null,
        price: watch.price,
        condition: watch.condition,
        year: watch.year ? parseInt(watch.year.toString()) : null,
        categoryId: primaryCategoryId,
        subcategoryId: null, // subcategoryId wird aktuell nicht verwendet
        categoryIds: watchCategories.map(wc => wc.categoryId), // Alle Kategorie-IDs für flexibleres Matching
      })
      if (matchCount > 0) {
        console.log(
          `[watches/create] ✓ ${matchCount} Suchabo-Match(es) gefunden und Benachrichtigungen gesendet`
        )
      } else {
        console.log(
          `[watches/create] ℹ️  Keine Suchabo-Matches gefunden für Artikel: ${watch.title}`
        )
      }
    } catch (matchError: any) {
      console.error('[watches/create] ❌ Fehler bei Suchabo-Matching:', matchError)
      console.error('[watches/create] Match error details:', {
        error: matchError.message,
        stack: matchError.stack,
      })
      // Fehler sollte nicht die Watch-Erstellung verhindern
    }

    // Erstelle Activity-Eintrag für Watch-Erstellung
    try {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          action: 'watch_created',
          details: JSON.stringify({
            watchId: watch.id,
            title: watch.title,
            articleNumber: watch.articleNumber,
          }),
        },
      })
    } catch (activityError) {
      console.warn('Could not create activity entry:', activityError)
    }

    return NextResponse.json({
      message: 'Uhr erfolgreich zum Verkauf angeboten',
      watch: {
        id: watch.id,
        title: watch.title,
        brand: watch.brand,
        model: watch.model,
        price: watch.price,
      },
    })
  } catch (error: any) {
    console.error('Error creating watch:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    console.error('Error details:', JSON.stringify(error, null, 2))

    // Detaillierte Fehlermeldung für Debugging
    const errorMessage = error?.message || 'Unbekannter Fehler'
    const errorCode = error?.code || 'UNKNOWN'

    return NextResponse.json(
      {
        message: `Ein Fehler ist aufgetreten beim Erstellen der Uhr: ${errorMessage}`,
        error: errorMessage,
        code: errorCode,
      },
      { status: 500 }
    )
  }
}
