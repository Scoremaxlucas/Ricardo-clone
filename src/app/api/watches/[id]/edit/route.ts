import { authOptions } from '@/lib/auth'
import { deleteImageFromBlob, uploadImagesToBlob } from '@/lib/blob-storage'
import { canEditField, getEditPolicy, type ListingState } from '@/lib/edit-policy'
import { prisma } from '@/lib/prisma'
import { canSell } from '@/lib/verification'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Bearbeitung von Artikeln mit Ricardo-like EditPolicy Enforcement
 *
 * Regeln werden durch EditPolicy bestimmt:
 * - READ_ONLY: Keine Bearbeitung möglich
 * - LIMITED_APPEND_ONLY: Nur Beschreibungs-Ergänzung und neue Bilder
 * - PUBLISHED_LIMITED: Eingeschränkte Bearbeitung (Kategorie/Verkaufsart gesperrt)
 * - FULL: Vollständige Bearbeitung (Draft)
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
        categories: {
          include: {
            category: true,
          },
        },
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

    // Prüfe Verifizierung: Use single source of truth - canSell helper
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verified: true,
        verificationStatus: true,
        isBlocked: true,
      },
    })

    if (!seller || !canSell(seller)) {
      return NextResponse.json(
        {
          message:
            'Sie müssen sich zuerst verifizieren, um Artikel bearbeiten zu können. Bitte besuchen Sie die Verifizierungsseite.',
          requiresVerification: true,
          errorCode: 'VERIFICATION_REQUIRED',
        },
        { status: 403 }
      )
    }

    // Compute EditPolicy
    const isPublished = watch.moderationStatus === 'approved'
    const isDraft = !isPublished || watch.moderationStatus === 'pending' || !watch.moderationStatus
    const listingState: ListingState = {
      isPublished,
      isDraft,
      isAuction: watch.isAuction || false,
      isFixedPrice: !watch.isAuction,
      bidsCount: watch.bids.length,
      hasActivePurchase: watch.purchases.length > 0,
      hasActiveSale: watch.sales.length > 0,
      purchaseStatus: watch.purchases[0]?.status || undefined,
      moderationStatus: watch.moderationStatus || undefined,
    }

    const policy = getEditPolicy(listingState)

    // READ_ONLY: Reject all updates
    if (policy.level === 'READ_ONLY') {
      return NextResponse.json(
        {
          message: policy.reason,
          policyLevel: policy.level,
        },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Enforce policy: Check attempted changes against allowedFields
    // For LIMITED_APPEND_ONLY, only allow descriptionAddendum and newImages
    // For other modes, check against allowedFields
    const attemptedChanges = Object.keys(data).filter(
      key => data[key] !== undefined && data[key] !== null && key !== 'booster'
    )

    const blockedFields: string[] = []
    for (const field of attemptedChanges) {
      // Map UI field names to policy field names for append-only mode
      let fieldToCheck = field
      if (policy.level === 'LIMITED_APPEND_ONLY') {
        // In append-only mode, block 'description' and 'images', only allow 'descriptionAddendum' and 'newImages'
        if (field === 'description' || field === 'images') {
          blockedFields.push(field)
          continue
        }
        // Map 'descriptionAddendum' -> 'descriptionAddendum', 'newImages' -> 'newImages'
        fieldToCheck = field
      } else {
        // For other modes, use field name as-is
        fieldToCheck = field
      }

      if (!canEditField(policy, fieldToCheck)) {
        blockedFields.push(field)
      }
    }

    if (blockedFields.length > 0) {
      return NextResponse.json(
        {
          message: policy.reason || 'Diese Felder können nicht mehr geändert werden.',
          blockedFields,
          policyLevel: policy.level,
        },
        { status: 400 }
      )
    }

    // Bereite Update-Daten vor
    const updateData: any = {}

    // LIMITED_APPEND_ONLY: Handle append-only mode
    if (policy.level === 'LIMITED_APPEND_ONLY') {
      // Append-only description: Add addendum with separator
      if (data.descriptionAddendum !== undefined && data.descriptionAddendum.trim()) {
        const existingDescription = watch.description || ''
        const now = new Date()
        const timestamp = now.toLocaleString('de-CH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
        const addendum = `\n\n---\nErgänzung (${timestamp}): ${data.descriptionAddendum.trim()}`
        updateData.description = existingDescription + addendum
      }

      // Append-only images: Only add new images, never delete/reorder
      if (
        data.newImages !== undefined &&
        Array.isArray(data.newImages) &&
        data.newImages.length > 0
      ) {
        const oldImages = watch.images ? JSON.parse(watch.images) : []
        const newImages = data.newImages.filter(
          (img: string) => typeof img === 'string' && img.startsWith('data:image/')
        )

        if (newImages.length > 0) {
          try {
            const basePath = `watches/${id}`
            const uploadedUrls = await uploadImagesToBlob(newImages, basePath)
            // Append new images to existing ones (never delete)
            const combinedImages = [...oldImages, ...uploadedUrls]
            updateData.images = JSON.stringify(combinedImages)
          } catch (error) {
            console.error('[Watch Edit] Error uploading append-only images:', error)
            // Don't update images on error
          }
        }
      }

      // No other fields allowed in append-only mode
    } else if (policy.level === 'PUBLISHED_LIMITED' || policy.level === 'FULL') {
      // PUBLISHED_LIMITED or FULL: Normal editing (with policy restrictions already enforced)
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

        // KRITISCH: Upload neue Bilder zu Blob Storage
        try {
          const { id } = await params
          const watchId = id

          // Hole aktuelles Watch für alte Bilder
          const watch = await prisma.watch.findUnique({
            where: { id: watchId },
            select: { images: true },
          })

          // Trenne Base64-Bilder (neu) von URLs (bereits hochgeladen)
          const base64Images = imagesArray.filter(
            (img: string) => typeof img === 'string' && img.startsWith('data:image/')
          )
          const existingUrls = imagesArray.filter(
            (img: string) =>
              typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))
          )

          // Upload neue Base64-Bilder zu Blob Storage
          let blobUrls: string[] = existingUrls
          if (base64Images.length > 0) {
            const basePath = `watches/${watchId}`
            const uploadedUrls = await uploadImagesToBlob(base64Images, basePath)
            blobUrls = [...existingUrls, ...uploadedUrls]
          }

          updateData.images = JSON.stringify(blobUrls)

          // Lösche alte Bilder aus Blob Storage die nicht mehr verwendet werden
          if (watch?.images) {
            try {
              const oldImages = JSON.parse(watch.images as string)
              const imagesToDelete = oldImages.filter(
                (oldImg: string) =>
                  typeof oldImg === 'string' &&
                  oldImg.startsWith('https://') &&
                  !blobUrls.includes(oldImg)
              )

              for (const oldImg of imagesToDelete) {
                await deleteImageFromBlob(oldImg)
              }
            } catch (error) {
              // Nicht kritisch wenn Parsing fehlschlägt
              console.warn('[Watch Edit] Could not parse old images for cleanup:', error)
            }
          }
        } catch (error) {
          console.error('[Watch Edit] Error uploading images to Blob Storage:', error)
          // Fallback: Verwende Original-Images
          updateData.images = JSON.stringify(imagesArray)
        }
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

    // Booster: Only editable if policy allows
    if (data.booster !== undefined && canEditField(policy, 'boosters')) {
      if (data.booster && data.booster !== 'none') {
        updateData.boosters = JSON.stringify([data.booster])
      } else {
        updateData.boosters = null
      }
    } else if (data.booster !== undefined && !canEditField(policy, 'boosters')) {
      // Booster change attempted but blocked by policy
      console.warn(`[watches/edit] Booster change blocked by policy for watch ${id}`)
    }

    // Kategorie-Update (only if policy allows)
    if (canEditField(policy, 'category') && data.category) {
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
    } else if (data.category && !canEditField(policy, 'category')) {
      // Category change attempted but blocked by policy
      console.warn(`[watches/edit] Category change blocked by policy for watch ${id}`)
    }

    // Only proceed if there are updates to apply
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        message: 'Keine Änderungen vorgenommen',
        watch: watch,
      })
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
              policyLevel: policy.level,
              bidsCount: listingState.bidsCount,
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

    // Update searchText for full-text search (async, non-blocking)
    try {
      const { updateWatchSearchText } = await import('@/lib/search/update-search-text')
      const resolvedParams = await params
      // Run in background without awaiting
      updateWatchSearchText(resolvedParams.id).catch((err: any) => {
        console.warn('[Watch Edit] Could not update searchText:', err.message)
      })
    } catch (searchTextError: any) {
      console.warn('[Watch Edit] Could not import search module:', searchTextError.message)
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
