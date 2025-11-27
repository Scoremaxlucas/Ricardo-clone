import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole die Uhr und prüfe Berechtigung
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        bids: true,
        purchases: { take: 1 },
        sales: { take: 1 }
      }
    })

    if (!watch) {
      return NextResponse.json(
        { message: 'Uhr nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob User der Verkäufer ist
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, dieses Angebot zu bearbeiten' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits Gebote vorhanden sind
    if (watch.bids.length > 0) {
      return NextResponse.json(
        { message: 'Das Angebot kann nicht mehr bearbeitet werden, da bereits Gebote abgegeben wurden' },
        { status: 400 }
      )
    }

    // Prüfe ob bereits ein aktiver Kauf oder Verkauf stattgefunden hat
    // RICARDO-STYLE: Stornierte Purchases zählen nicht - Artikel kann wieder bearbeitet werden
    const activePurchases = watch.purchases.filter(p => p.status !== 'cancelled')
    if (activePurchases.length > 0 || watch.sales.length > 0) {
      return NextResponse.json(
        { message: 'Das Angebot kann nicht mehr bearbeitet werden, da bereits ein Kauf stattgefunden hat' },
        { status: 400 }
      )
    }

    const data = await request.json()
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

    // Konvertiere Daten
    const yearInt = year ? parseInt(year) : null
    const priceFloat = parseFloat(price)
    
    // Validierung der Pflichtfelder
    if (!brand || !model || !condition || isNaN(priceFloat) || priceFloat <= 0) {
      console.error('[watches/edit] Validierung fehlgeschlagen:', { brand, model, condition, price: priceFloat })
      return NextResponse.json(
        { message: 'Bitte füllen Sie alle Pflichtfelder aus (Marke, Modell, Zustand, Preis)' },
        { status: 400 }
      )
    }
    const buyNowPriceFloat = buyNowPrice ? parseFloat(buyNowPrice) : null
    const caseDiameterFloat = caseDiameter ? parseFloat(caseDiameter) : null
    const lastRevisionDate = lastRevision ? new Date(lastRevision) : null
    const warrantyMonthsInt = warrantyMonths ? parseInt(warrantyMonths) : null
    const warrantyYearsInt = warrantyYears ? parseInt(warrantyYears) : null
    const sellerWarrantyMonthsInt = sellerWarrantyMonths ? parseInt(sellerWarrantyMonths) : null
    const sellerWarrantyYearsInt = sellerWarrantyYears ? parseInt(sellerWarrantyYears) : null

    // Parse Startzeitpunkt, falls vorhanden oder geändert
    let auctionStartDate = watch.auctionStart
    if (auctionStart !== undefined) {
      if (auctionStart) {
        auctionStartDate = new Date(auctionStart)
        // Validierung: Startzeitpunkt muss in der Zukunft liegen (wenn nicht bereits gestartet)
        const now = new Date()
        if (watch.auctionStart && new Date(watch.auctionStart) > now) {
          // Angebot hat noch nicht begonnen, Startzeit kann geändert werden
          if (auctionStartDate <= now) {
            return NextResponse.json(
              { message: 'Der Starttermin muss in der Zukunft liegen.' },
              { status: 400 }
            )
          }
        }
      } else {
        auctionStartDate = null
      }
    }
    
    // Berechne neues Auktionsende, falls auctionDuration geändert wurde
    let auctionEndDate = watch.auctionEnd
    if (watch.isAuction && auctionDuration) {
      const auctionDurationInt = parseInt(auctionDuration)
      if (auctionDurationInt >= 1 && auctionDurationInt <= 30) {
        // Verwende neuen oder bestehenden Startzeitpunkt, oder jetzt
        const actualStartDate = auctionStartDate || (watch.auctionStart || new Date())
        auctionEndDate = new Date(actualStartDate.getTime() + auctionDurationInt * 24 * 60 * 60 * 1000)
      }
    }

    // Update die Uhr
    console.log(`[watches/edit] Starte Watch-Update für Watch ${id}`)
    let updatedWatch
    try {
      updatedWatch = await prisma.watch.update({
      where: { id },
      data: {
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
        ...(auctionStartDate !== undefined ? { auctionStart: auctionStartDate } : {}),
        ...(auctionEndDate !== undefined ? { auctionEnd: auctionEndDate } : {}),
        ...(auctionDuration !== undefined && auctionDuration !== null && auctionDuration !== '' ? (() => {
          const parsed = parseInt(String(auctionDuration))
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 30) {
            return { auctionDuration: parsed }
          }
          return {}
        })() : {}),
        ...(autoRenew !== undefined ? { autoRenew: autoRenew === true || autoRenew === 'true' } : {}),
        images: (() => {
          try {
            // Prüfe ob images bereits ein JSON-String ist
            if (typeof images === 'string') {
              // Versuche zu parsen, falls es JSON ist
              try {
                JSON.parse(images)
                return images // Ist bereits JSON-String
              } catch {
                // Ist kein JSON, behalte als String
                return images
              }
            }
            // Falls es ein Array ist, konvertiere zu JSON-String
            return JSON.stringify(Array.isArray(images) ? images : [])
          } catch (err) {
            console.error('[watches/edit] Error processing images:', err)
            return watch.images || '[]'
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
        referenceNumber: referenceNumber || null,
        shippingMethod: shippingMethods && Array.isArray(shippingMethods) && shippingMethods.length > 0
          ? JSON.stringify(shippingMethods)
          : watch.shippingMethod,
        boosters: (() => {
          try {
            if (booster && booster !== 'none') {
              return JSON.stringify([booster])
            } else if (booster === 'none') {
              return null
            }
            // Falls booster nicht übergeben wurde, behalte den bestehenden
            return watch.boosters
          } catch (err) {
            console.error('Error stringifying boosters:', err)
            return watch.boosters
          }
        })()
      }
      })
      
      console.log(`[watches/edit] Watch erfolgreich aktualisiert: ${updatedWatch.id}`)
    } catch (watchUpdateError: any) {
      console.error('[watches/edit] Fehler beim Watch-Update:', watchUpdateError)
      console.error('[watches/edit] Watch-Update Error details:', {
        message: watchUpdateError.message,
        code: watchUpdateError.code,
        meta: watchUpdateError.meta
      })
      throw new Error(`Fehler beim Aktualisieren der Uhr: ${watchUpdateError.message}`)
    }

    // Prüfe ob Booster geändert wurde und erstelle ggf. Rechnung
    if (booster !== undefined && booster !== null && booster !== 'none' && typeof booster === 'string' && booster.trim() !== '') {
      try {
        console.log(`[watches/edit] Booster-Verarbeitung gestartet für Watch ${id}, booster=${booster}`)
        
        // Parse aktuellen Booster
        let currentBoosterCode: string | null = null
        if (watch.boosters) {
          try {
            const boosterArray = typeof watch.boosters === 'string' 
              ? JSON.parse(watch.boosters) 
              : watch.boosters
            if (Array.isArray(boosterArray) && boosterArray.length > 0) {
              currentBoosterCode = boosterArray[0]
            }
          } catch (e) {
            console.error('[watches/edit] Error parsing current boosters:', e)
          }
        }

        console.log(`[watches/edit] Aktueller Booster: ${currentBoosterCode}, Neuer Booster: ${booster}`)

        // Prüfe ob neuer Booster gewählt wurde (oder vorher keiner vorhanden war)
        if (booster !== currentBoosterCode) {
          // Hole Booster-Preise
          console.log(`[watches/edit] Suche Booster mit Code: ${booster}`)
          const newBoosterPrice = await prisma.boosterPrice.findUnique({
            where: { code: booster }
          })

          console.log(`[watches/edit] Booster gefunden:`, newBoosterPrice ? { code: newBoosterPrice.code, name: newBoosterPrice.name, price: newBoosterPrice.price } : 'nicht gefunden')

          // Validierung: Prüfe ob neuer Booster existiert
          if (!newBoosterPrice) {
            console.error(`[watches/edit] Booster mit Code '${booster}' nicht gefunden`)
            // Watch wurde bereits aktualisiert mit dem Booster-Code
            // Wir geben eine Warnung zurück, aber die Watch wurde aktualisiert
            return NextResponse.json({
              message: 'Angebot erfolgreich aktualisiert',
              warning: `Warnung: Booster-Code '${booster}' wurde nicht in der Datenbank gefunden. Bitte kontaktieren Sie den Support.`,
              watch: updatedWatch
            }, { status: 200 })
          }

          const currentBoosterPrice = currentBoosterCode 
            ? await prisma.boosterPrice.findUnique({
                where: { code: currentBoosterCode }
              })
            : null

          // Berechne Preis-Differenz (nur wenn neuer Booster teurer ist oder vorher keiner war)
          const newPrice = typeof newBoosterPrice.price === 'number' ? newBoosterPrice.price : 0
          const currentPrice = (currentBoosterPrice?.price && typeof currentBoosterPrice.price === 'number') ? currentBoosterPrice.price : 0
          const priceDifference = newPrice - currentPrice

          // Validierung: Preis-Differenz muss eine gültige Zahl sein
          if (isNaN(priceDifference)) {
            console.error(`[watches/edit] Ungültige Preis-Differenz: newPrice=${newPrice}, currentPrice=${currentPrice}`)
            throw new Error(`Ungültige Preis-Differenz berechnet. Bitte kontaktieren Sie den Support.`)
          }

          // Erstelle Rechnung nur wenn der neue Booster teurer ist oder vorher keiner vorhanden war
          if (priceDifference > 0) {
            // Preis ist bereits inkl. MwSt - berechne Netto und MwSt-Betrag
            const vatRate = 0.081 // 8.1% MwSt
            const total = priceDifference // Total ist der Preis inkl. MwSt
            const subtotal = total / (1 + vatRate) // Netto-Preis ohne MwSt
            const vatAmount = total - subtotal // MwSt-Betrag
            // Schweizer Rappenrundung auf 0.05
            const roundedSubtotal = Math.floor(subtotal * 20) / 20
            const roundedVatAmount = Math.ceil(vatAmount * 20) / 20
            const roundedTotal = roundedSubtotal + roundedVatAmount

            // Generiere Rechnungsnummer (z.B. REV-2024-001)
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
              if (!isNaN(lastNumber) && lastNumber > 0) {
                invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
              } else {
                // Fallback: Verwende einfach die nächste Nummer
                console.warn(`[watches/edit] Konnte Rechnungsnummer nicht aus ${lastInvoice.invoiceNumber} parsen, verwende Fallback`)
                invoiceNumber = `REV-${year}-${String(1).padStart(3, '0')}`
              }
            }

            // Erstelle Rechnung für Booster-Upgrade
            try {
              // Prüfe ob Rechnungsnummer bereits existiert (Race Condition Schutz)
              const existingInvoice = await prisma.invoice.findUnique({
                where: { invoiceNumber }
              })
              
              if (existingInvoice) {
                // Generiere neue Nummer
                const lastNumber = parseInt(invoiceNumber.split('-')[2])
                invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
                console.warn(`[watches/edit] Rechnungsnummer bereits vorhanden, verwende: ${invoiceNumber}`)
              }

              const invoice = await prisma.invoice.create({
                data: {
                  invoiceNumber,
                  sellerId: session.user.id,
                  saleId: null, // Kein Verkauf, nur Booster
                  subtotal: roundedSubtotal,
                  vatRate,
                  vatAmount: roundedVatAmount,
                  total: roundedTotal,
                  status: 'pending',
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist (wie Ricardo)
                  items: {
                    create: [{
                      watchId: watch.id,
                      description: currentBoosterCode 
                        ? `Booster-Upgrade: ${newBoosterPrice.name} (Differenz)`
                        : `Booster: ${newBoosterPrice.name}`,
                      quantity: 1,
                      price: roundedSubtotal,
                      total: roundedSubtotal
                    }]
                  }
                }
              })

              console.log(`[watches/edit] Booster-Rechnung erstellt: ${invoiceNumber} für ${newBoosterPrice.name} (Differenz: CHF ${roundedTotal.toFixed(2)} inkl. MwSt)`)

              // RICARDO-STYLE: Sende E-Mail-Benachrichtigung und erstelle Plattform-Benachrichtigung
              try {
                const { sendInvoiceNotificationAndEmail } = await import('@/lib/invoice')
                await sendInvoiceNotificationAndEmail(invoice)
              } catch (notificationError: any) {
                console.error('[watches/edit] Fehler bei Benachrichtigung:', notificationError)
                // Fehler sollte nicht die Rechnungserstellung verhindern
              }
            } catch (invoiceError: any) {
              console.error('[watches/edit] Fehler beim Erstellen der Rechnung:', invoiceError)
              console.error('[watches/edit] Invoice error code:', invoiceError.code)
              console.error('[watches/edit] Invoice error meta:', invoiceError.meta)
              
              // Prüfe ob es ein Duplikat-Fehler ist
              if (invoiceError.code === 'P2002' && invoiceError.meta?.target?.includes('invoiceNumber')) {
                // Rechnungsnummer existiert bereits - versuche es mit einer neuen Nummer
                console.warn(`[watches/edit] Rechnungsnummer ${invoiceNumber} existiert bereits, versuche mit neuer Nummer`)
                const lastNumber = parseInt(invoiceNumber.split('-')[2]) || 0
                const newInvoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
                
                try {
                  await prisma.invoice.create({
                    data: {
                      invoiceNumber: newInvoiceNumber,
                      sellerId: session.user.id,
                      saleId: null,
                      subtotal: roundedSubtotal,
                      vatRate,
                      vatAmount: roundedVatAmount,
                      total: roundedTotal,
                      status: 'pending',
                      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 Tage Frist (wie Ricardo)
                      items: {
                        create: [{
                          watchId: watch.id,
                          description: currentBoosterCode 
                            ? `Booster-Upgrade: ${newBoosterPrice.name} (Differenz)`
                            : `Booster: ${newBoosterPrice.name}`,
                          quantity: 1,
                          price: roundedSubtotal,
                          total: roundedSubtotal
                        }]
                      }
                    }
                  })
                  console.log(`[watches/edit] Booster-Rechnung erfolgreich mit neuer Nummer erstellt: ${newInvoiceNumber}`)

                  // RICARDO-STYLE: Sende E-Mail-Benachrichtigung und erstelle Plattform-Benachrichtigung
                  try {
                    const retryInvoice = await prisma.invoice.findUnique({
                      where: { invoiceNumber: newInvoiceNumber },
                      include: { items: true, seller: true }
                    })
                    if (retryInvoice) {
                      const { sendInvoiceNotificationAndEmail } = await import('@/lib/invoice')
                      await sendInvoiceNotificationAndEmail(retryInvoice)
                    }
                  } catch (notificationError: any) {
                    console.error('[watches/edit] Fehler bei Benachrichtigung:', notificationError)
                  }
                } catch (retryError: any) {
                  // Auch Retry fehlgeschlagen
                  throw new Error(`Fehler beim Erstellen der Rechnung (auch Retry fehlgeschlagen): ${retryError.message}`)
                }
              } else {
                // Anderer Fehler
                throw new Error(`Fehler beim Erstellen der Rechnung: ${invoiceError.message}`)
              }
            }
          } else {
            console.log(`[watches/edit] Keine Rechnung nötig: Preis-Differenz ist ${priceDifference.toFixed(2)} (nicht positiv)`)
          }
        } else {
          console.log(`[watches/edit] Booster nicht geändert: ${booster} === ${currentBoosterCode}`)
        }
      } catch (boosterError: any) {
        console.error('[watches/edit] Fehler bei Booster-Verarbeitung:', boosterError)
        // Re-throw damit der äußere catch-Block greift
        throw new Error(`Fehler bei Booster-Verarbeitung: ${boosterError.message}`)
      }
    }

    return NextResponse.json({
      message: 'Angebot erfolgreich aktualisiert',
      watch: updatedWatch
    })
  } catch (error: any) {
    console.error('[watches/edit] Error updating watch:', error)
    console.error('[watches/edit] Error stack:', error.stack)
    console.error('[watches/edit] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      {
        message: 'Fehler beim Aktualisieren des Angebots',
        error: error.message || 'Unbekannter Fehler',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
