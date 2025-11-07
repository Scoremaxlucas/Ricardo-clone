import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Watch creation API called')
    
    const data = await request.json()
    console.log('Received data keys:', Object.keys(data))
    console.log('Auction-related data:', {
      auctionStart: data.auctionStart,
      auctionDuration: data.auctionDuration,
      auctionEnd: data.auctionEnd,
      isAuction: data.isAuction
    })
    console.log('shippingMethods received:', data.shippingMethods)
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
      description,
      images,
      video,
      shippingMethods,
      booster
    } = data

    // Validierung der Pflichtfelder
    if (!brand || !model || !condition || !price) {
      console.log('Validation failed:', { brand, model, condition, price })
      return NextResponse.json(
        { message: 'Bitte füllen Sie alle Pflichtfelder aus' },
        { status: 400 }
      )
    }

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
    
    const isAuctionActive = data.isAuction === true || data.isAuction === 'true'
    
    if (isAuctionActive) {
      // Parse Startzeitpunkt, falls vorhanden (nicht leer und nicht null)
      if (auctionStart && typeof auctionStart === 'string' && auctionStart.trim() !== '') {
        try {
          auctionStartDate = new Date(auctionStart)
          // Prüfe ob Datum gültig ist
          if (isNaN(auctionStartDate.getTime())) {
            return NextResponse.json(
              { message: 'Der Starttermin ist ungültig. Bitte wählen Sie ein gültiges Datum und eine gültige Uhrzeit.' },
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
          auctionEndDate = new Date(actualStartDate.getTime() + auctionDurationInt * 24 * 60 * 60 * 1000)
        }
      }
      
      // Fallback: Falls keine Dauer angegeben wurde, aber ein Enddatum
      if (!auctionEndDate && auctionEnd && typeof auctionEnd === 'string' && auctionEnd.trim() !== '') {
        // Fallback: Falls noch das alte datetime-local Format verwendet wird
        try {
          auctionEndDate = new Date(auctionEnd)
          if (isNaN(auctionEndDate.getTime())) {
            return NextResponse.json(
              { message: 'Das Auktionsende ist ungültig. Bitte wählen Sie ein gültiges Datum und eine gültige Uhrzeit.' },
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
      auctionDurationInt
    })

    // Verkäufer aus der Session ermitteln
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // Prüfe ob User verifiziert ist
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verified: true }
    })

    if (!user?.verified) {
      return NextResponse.json(
        { message: 'Sie müssen sich zuerst verifizieren, um Uhren zum Verkauf anzubieten. Bitte besuchen Sie die Verifizierungsseite.' },
        { status: 403 }
      )
    }
    
    console.log('Creating watch with data:', {
      title: title || `${brand} ${model}`,
      brand,
      model,
      price: priceFloat
    })

    // Erstelle die Uhr in der Datenbank
    // Bauen Sie das Datenobjekt dynamisch auf, damit Auktionsfelder nur bei aktiven Auktionen enthalten sind
    const watchData: any = {
      title: title || `${brand} ${model}`,
      description: description || '',
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
          if (images && Array.isArray(images) && images.length > 0) {
            return JSON.stringify(images)
          }
          // Fallback: Leeres Array als JSON-String
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
      box: (onlyBox || onlyAllLinks) || false,
      papers: (onlyPapers || onlyAllLinks) || false,
      warranty: hasWarranty ? 'Herstellergarantie' : null,
      warrantyMonths: warrantyMonthsInt,
      warrantyYears: warrantyYearsInt,
      warrantyNote: hasSellerWarranty ? sellerWarrantyNote : null,
      warrantyDescription: hasSellerWarranty ? `Verkäufer-Garantie: ${sellerWarrantyMonthsInt || 0} Monate, ${sellerWarrantyYearsInt || 0} Jahre` : null,
      sellerId: session.user.id,
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
      })()
    }

    // Füge Auktionsfelder nur hinzu, wenn es eine aktive Auktion ist
    if (auctionEndDate) {
      watchData.auctionStart = auctionStartDate
      watchData.auctionEnd = auctionEndDate
      watchData.auctionDuration = auctionDurationInt
      watchData.autoRenew = (autoRenew === true || autoRenew === 'true') || false
    }

    const watch = await prisma.watch.create({
      data: watchData
    })
    
    console.log('Watch created successfully:', watch.id)

    // Erstelle Rechnung für Booster, falls ein kostenpflichtiger Booster gewählt wurde
    try {
      if (booster && booster !== 'none') {
        const boosterCode = typeof booster === 'string' ? booster : booster[0]
        
        // Hole Booster-Details
        const boosterPrice = await prisma.boosterPrice.findUnique({
          where: { code: boosterCode }
        })

        if (boosterPrice && boosterPrice.price > 0) {
          const vatRate = 0.081 // 8.1% MwSt
          const subtotal = boosterPrice.price
          const vatAmount = subtotal * vatRate
          // Schweizer Rappenrundung auf 0.05
          const totalBeforeRounding = subtotal + vatAmount
          const total = Math.ceil(totalBeforeRounding * 20) / 20

          // Generiere Rechnungsnummer
          const year = new Date().getFullYear()
          const lastInvoice = await prisma.invoice.findFirst({
            where: {
              invoiceNumber: {
                startsWith: `REV-${year}-`
              }
            },
            orderBy: {
              invoiceNumber: 'desc'
            }
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
              sellerId: session.user.id,
              saleId: null, // Kein Verkauf, nur Booster
              subtotal,
              vatRate,
              vatAmount,
              total,
              status: 'pending',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage Frist
              items: {
                create: [{
                  watchId: watch.id,
                  description: `Booster: ${boosterPrice.name}`,
                  quantity: 1,
                  price: boosterPrice.price,
                  total: boosterPrice.price
                }]
              }
            }
          })

          console.log(`[watches/create] Booster-Rechnung erstellt: ${invoiceNumber} für ${boosterPrice.name} (CHF ${total.toFixed(2)})`)
        }
      }
    } catch (invoiceError: any) {
      console.error('[watches/create] Fehler bei Booster-Rechnungserstellung:', invoiceError)
      // Fehler wird ignoriert, Watch war erfolgreich erstellt
    }

    return NextResponse.json({
      message: 'Uhr erfolgreich zum Verkauf angeboten',
      watch: {
        id: watch.id,
        title: watch.title,
        brand: watch.brand,
        model: watch.model,
        price: watch.price
      }
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
        code: errorCode
      },
      { status: 500 }
    )
  }
}
