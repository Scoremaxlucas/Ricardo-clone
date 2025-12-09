import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImagesToBlob, isBlobUrl, deleteImageFromBlob } from '@/lib/blob-storage'

/**
 * Bearbeitung von Artikeln
 *
 * Regeln:
 * 1. Wenn bereits ein aktiver Kauf stattgefunden hat → Keine Bearbeitung möglich
 * 2. Wenn Gebote vorhanden sind → Nur Beschreibung, Bilder, Video können ergänzt werden
 * 3. Wenn keine Gebote → Vollständige Bearbeitung möglich
 * 4. Stornierte Purchases zählen nicht - Artikel kann wieder bearbeitet werden
 */

// WICHTIG: Erhöhe Body-Size-Limit für große Bild-Uploads
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 Sekunden für große Uploads

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    // Lade Watch mit allen relevanten Daten
    const watch = await prisma.watch.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { createdAt: 'desc' },
        },
        purchases: {
          where: {
            status: { not: 'cancelled' },
          },
        },
        sales: true,
      },
    })

    if (!watch) {
      return NextResponse.json({ message: 'Artikel nicht gefunden' }, { status: 404 })
    }

    // Prüfe Berechtigung
    if (watch.sellerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Sie sind nicht berechtigt, dieses Angebot zu bearbeiten' },
        { status: 403 }
      )
    }

    // Prüfe ob bereits ein aktiver Kauf stattgefunden hat
    if (watch.purchases.length > 0 || watch.sales.length > 0) {
      return NextResponse.json(
        {
          message:
            'Das Angebot kann nicht mehr bearbeitet werden, da bereits ein Kauf stattgefunden hat',
        },
        { status: 400 }
      )
    }

    const hasBids = watch.bids.length > 0
    const data = await request.json()

    // Bei vorhandenen Geboten nur erlaubte Felder
    if (hasBids) {
      const allowedFields = ['description', 'images', 'video']
      const attemptedChanges = Object.keys(data).filter(
        key =>
          !allowedFields.includes(key) &&
          key !== 'booster' && // Booster kann immer geändert werden
          data[key] !== undefined &&
          data[key] !== null
      )

      if (attemptedChanges.length > 0) {
        return NextResponse.json(
          {
            message:
              'Bei vorhandenen Geboten können nur Beschreibung, Bilder und Video ergänzt werden. Preis, Auktionsdauer und andere Felder sind gesperrt.',
            blockedFields: attemptedChanges,
          },
          { status: 400 }
        )
      }
    }

    // Bereite Update-Daten vor
    const updateData: any = {}

    if (hasBids) {
      // NUR Beschreibung, Bilder, Video
      if (data.description !== undefined) {
        updateData.description = data.description || ''
      }

      if (data.images !== undefined) {
        // Kombiniere alte und neue Bilder
        const oldImages = watch.images ? JSON.parse(watch.images) : []
        const newImages = Array.isArray(data.images) ? data.images : []
        // Entferne Duplikate
        const combinedImages = Array.from(new Set([...oldImages, ...newImages]))
        updateData.images = JSON.stringify(combinedImages)
      }

      if (data.video !== undefined) {
        updateData.video = data.video || null
      }
    } else {
      // VOLLSTÄNDIGE BEARBEITUNG

      // Grunddaten
      if (data.title !== undefined) updateData.title = data.title || ''
      if (data.description !== undefined) updateData.description = data.description || ''
      if (data.brand !== undefined) updateData.brand = data.brand || ''
      if (data.model !== undefined) updateData.model = data.model || ''
      if (data.referenceNumber !== undefined)
        updateData.referenceNumber = data.referenceNumber || null
      if (data.year !== undefined) updateData.year = data.year ? parseInt(data.year) : null
      if (data.condition !== undefined) updateData.condition = data.condition || ''
      if (data.material !== undefined) updateData.material = data.material || null
      if (data.movement !== undefined) updateData.movement = data.movement || null
      if (data.caseDiameter !== undefined)
        updateData.caseDiameter = data.caseDiameter ? parseFloat(data.caseDiameter) : null

      // Preis
      // WICHTIG: Artikelpreise werden NICHT gerundet - exakter Betrag wird gespeichert (z.B. CHF 1.80)
      // Nur Rechnungsbeträge (Kommission, MwSt) werden auf 5 Rappen gerundet
      if (data.price !== undefined) {
        const priceFloat = parseFloat(data.price)
        if (isNaN(priceFloat) || priceFloat <= 0) {
          return NextResponse.json(
            { message: 'Preis muss eine positive Zahl sein' },
            { status: 400 }
          )
        }
        updateData.price = priceFloat
      }

      if (data.buyNowPrice !== undefined) {
        // WICHTIG: Artikelpreise werden NICHT gerundet - exakter Betrag wird gespeichert
        updateData.buyNowPrice = data.buyNowPrice ? parseFloat(data.buyNowPrice) : null
      }

      // Auktion
      if (data.isAuction !== undefined)
        updateData.isAuction = data.isAuction === true || data.isAuction === 'true'

      if (data.auctionDuration !== undefined && data.auctionDuration) {
        const duration = parseInt(data.auctionDuration)
        if (duration >= 1 && duration <= 30) {
          updateData.auctionDuration = duration

          // Berechne neues Auktionsende
          const startDate = data.auctionStart
            ? new Date(data.auctionStart)
            : watch.auctionStart || new Date()
          updateData.auctionEnd = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000)

          if (data.auctionStart !== undefined) {
            updateData.auctionStart = data.auctionStart ? new Date(data.auctionStart) : null
          }
        }
      }

      if (data.autoRenew !== undefined)
        updateData.autoRenew = data.autoRenew === true || data.autoRenew === 'true'

      // Bilder & Video
      if (data.images !== undefined) {
        const imagesArray = Array.isArray(data.images) ? data.images : []
        // Validierung: Maximal 10 Bilder
        if (imagesArray.length > 10) {
          return NextResponse.json({ message: 'Maximal 10 Bilder erlaubt' }, { status: 400 })
        }
        updateData.images = JSON.stringify(imagesArray)
      }

      if (data.video !== undefined) {
        updateData.video = data.video || null
      }

      // Versandmethoden Validierung
      if (data.shippingMethods !== undefined) {
        if (!Array.isArray(data.shippingMethods) || data.shippingMethods.length === 0) {
          return NextResponse.json(
            { message: 'Bitte wählen Sie mindestens eine Versandmethode aus' },
            { status: 400 }
          )
        }
      }

      // Uhren & Schmuck-spezifisch
      if (data.lastRevision !== undefined) {
        updateData.lastRevision = data.lastRevision ? new Date(data.lastRevision) : null
      }
      if (data.accuracy !== undefined) updateData.accuracy = data.accuracy || null

      // Lieferumfang
      if (data.fullset !== undefined)
        updateData.fullset = data.fullset === true || data.fullset === 'true'
      if (data.onlyBox !== undefined)
        updateData.box = data.onlyBox === true || data.onlyBox === 'true'
      if (data.onlyPapers !== undefined)
        updateData.papers = data.onlyPapers === true || data.onlyPapers === 'true'
      if (data.onlyAllLinks !== undefined) {
        updateData.box = data.onlyAllLinks === true || data.onlyAllLinks === 'true'
        updateData.papers = data.onlyAllLinks === true || data.onlyAllLinks === 'true'
      }
      updateData.allLinks = false // Wird nicht mehr verwendet

      // Garantie
      if (data.hasWarranty !== undefined) {
        updateData.warranty =
          data.hasWarranty === true || data.hasWarranty === 'true' ? 'Herstellergarantie' : null
      }
      if (data.warrantyMonths !== undefined) {
        updateData.warrantyMonths = data.warrantyMonths ? parseInt(data.warrantyMonths) : null
      }
      if (data.warrantyYears !== undefined) {
        updateData.warrantyYears = data.warrantyYears ? parseInt(data.warrantyYears) : null
      }

      if (data.hasSellerWarranty !== undefined) {
        if (data.hasSellerWarranty === true || data.hasSellerWarranty === 'true') {
          updateData.warrantyNote = data.sellerWarrantyNote || null
          const months = data.sellerWarrantyMonths ? parseInt(data.sellerWarrantyMonths) : 0
          const years = data.sellerWarrantyYears ? parseInt(data.sellerWarrantyYears) : 0
          updateData.warrantyDescription = `Verkäufer-Garantie: ${months} Monate, ${years} Jahre`
        } else {
          updateData.warrantyNote = null
          updateData.warrantyDescription = null
        }
      }

      // Versand
      if (data.shippingMethods !== undefined) {
        updateData.shippingMethod =
          Array.isArray(data.shippingMethods) && data.shippingMethods.length > 0
            ? JSON.stringify(data.shippingMethods)
            : null
      }
    }

    // Booster kann immer geändert werden
    if (data.booster !== undefined) {
      if (data.booster && data.booster !== 'none') {
        updateData.boosters = JSON.stringify([data.booster])
      } else {
        updateData.boosters = null
      }
    }

    // Kategorie-Update (nur wenn keine Gebote und Kategorie geändert wurde)
    if (!hasBids && data.category) {
      // Prüfe ob Kategorie geändert wurde
      const currentCategories = await prisma.watchCategory.findMany({
        where: { watchId: id },
        include: { category: true },
      })

      const currentCategorySlug = currentCategories[0]?.category?.slug

      if (currentCategorySlug !== data.category) {
        // Entferne alte Kategorien
        await prisma.watchCategory.deleteMany({
          where: { watchId: id },
        })

        // Füge neue Kategorie hinzu
        const category = await prisma.category.findUnique({
          where: { slug: data.category },
        })

        if (category) {
          await prisma.watchCategory.create({
            data: {
              watchId: id,
              categoryId: category.id,
            },
          })
        }
      }
    }

    // Erfasse alle Änderungen für Historie
    const changes: Record<string, { old: any; new: any }> = {}

    // Vergleiche alte und neue Werte
    Object.keys(updateData).forEach(key => {
      const oldValue = (watch as any)[key]
      const newValue = updateData[key]

      // Ignoriere updatedAt und andere automatische Felder
      if (key === 'updatedAt') return

      // Normalisiere Werte für Vergleich (besonders für JSON-Strings)
      const normalizeValue = (val: any) => {
        if (val === null || val === undefined) return null
        if (typeof val === 'string') {
          // Versuche JSON zu parsen falls es ein JSON-String ist
          try {
            const parsed = JSON.parse(val)
            return JSON.stringify(parsed) // Normalisiere JSON
          } catch {
            return val.trim() // Trimme normale Strings
          }
        }
        if (typeof val === 'object') {
          return JSON.stringify(val)
        }
        return val
      }

      const normalizedOld = normalizeValue(oldValue)
      const normalizedNew = normalizeValue(newValue)

      // Vergleiche nur wenn sich der Wert geändert hat
      if (normalizedOld !== normalizedNew) {
        changes[key] = {
          old: oldValue,
          new: newValue,
        }
      }
    })

    // Update durchführen
    const updatedWatch = await prisma.watch.update({
      where: { id },
      data: updateData,
    })

    // Erstelle Historie-Eintrag für Bearbeitung (wenn Änderungen vorhanden)
    if (Object.keys(changes).length > 0) {
      try {
        // Finde einen Admin-User für die Historie (falls vorhanden, sonst System)
        const adminUser = await prisma.user.findFirst({
          where: { isAdmin: true },
          select: { id: true },
        })

        // Erstelle Historie-Eintrag mit allen Änderungen
        await prisma.moderationHistory.create({
          data: {
            watchId: id,
            adminId: adminUser?.id || session.user.id, // Verwende Admin oder Verkäufer-ID
            action: 'edited',
            details: JSON.stringify({
              editedBy: 'seller', // Markiere als Verkäufer-Bearbeitung
              sellerId: session.user.id,
              changes: changes,
              hasBids: hasBids,
              timestamp: new Date().toISOString(),
            }),
          },
        })
      } catch (historyError: any) {
        // Fehler bei Historie sollte nicht die Bearbeitung verhindern
        console.error('[watches/edit] Fehler beim Erstellen der Historie:', historyError)
      }
    }

    // Booster-Rechnung erstellen (falls Upgrade)
    if (data.booster !== undefined && data.booster && data.booster !== 'none') {
      try {
        const currentBoosters = watch.boosters ? JSON.parse(watch.boosters) : []
        const currentBooster = currentBoosters.length > 0 ? currentBoosters[0] : null

        if (data.booster !== currentBooster) {
          const newBooster = await prisma.boosterPrice.findUnique({
            where: { code: data.booster },
          })

          if (newBooster) {
            const currentBoosterPrice = currentBooster
              ? await prisma.boosterPrice.findUnique({ where: { code: currentBooster } })
              : null

            const newPrice = newBooster.price
            const currentPrice = currentBoosterPrice?.price || 0
            const priceDifference = newPrice - currentPrice

            // Erstelle Rechnung nur wenn Upgrade
            if (priceDifference > 0) {
              const vatRate = 0.081
              const total = priceDifference
              const subtotal = total / (1 + vatRate)
              const vatAmount = total - subtotal
              const roundedSubtotal = Math.floor(subtotal * 20) / 20
              const roundedVatAmount = Math.ceil(vatAmount * 20) / 20
              const roundedTotal = roundedSubtotal + roundedVatAmount

              // Generiere Rechnungsnummer
              const year = new Date().getFullYear()
              const lastInvoice = await prisma.invoice.findFirst({
                where: { invoiceNumber: { startsWith: `REV-${year}-` } },
                orderBy: { invoiceNumber: 'desc' },
              })

              let invoiceNumber = `REV-${year}-001`
              if (lastInvoice) {
                const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]) || 0
                invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
              }

              const invoice = await prisma.invoice.create({
                data: {
                  invoiceNumber,
                  sellerId: session.user.id,
                  saleId: null,
                  subtotal: roundedSubtotal,
                  vatRate,
                  vatAmount: roundedVatAmount,
                  total: roundedTotal,
                  status: 'pending',
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                  items: {
                    create: [
                      {
                        watchId: id,
                        description: currentBooster
                          ? `Booster-Upgrade: ${newBooster.name} (Differenz)`
                          : `Booster: ${newBooster.name}`,
                        quantity: 1,
                        price: roundedSubtotal,
                        total: roundedSubtotal,
                      },
                    ],
                  },
                },
              })

              // Sende Benachrichtigung
              try {
                const { sendInvoiceNotificationAndEmail } = await import('@/lib/invoice')
                await sendInvoiceNotificationAndEmail(invoice)
              } catch (notificationError) {
                console.error('[watches/edit] Fehler bei Benachrichtigung:', notificationError)
              }
            }
          }
        }
      } catch (boosterError) {
        console.error('[watches/edit] Fehler bei Booster-Verarbeitung:', boosterError)
        // Fehler sollte nicht die Bearbeitung verhindern
      }
    }

    return NextResponse.json({
      message: 'Angebot erfolgreich aktualisiert',
      watch: updatedWatch,
    })
  } catch (error: any) {
    console.error('[watches/edit] Error:', error)
    return NextResponse.json(
      {
        message: 'Fehler beim Aktualisieren des Angebots',
        error: error.message || 'Unbekannter Fehler',
      },
      { status: 500 }
    )
  }
}
