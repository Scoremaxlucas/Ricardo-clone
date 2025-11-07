import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API-Route für automatische Verlängerung abgelaufener Auktionen
 * Diese Route sollte von einem Cron-Job regelmäßig aufgerufen werden (z.B. stündlich)
 * 
 * Verlängert Auktionen, die:
 * - abgelaufen sind (auctionEnd < now)
 * - autoRenew = true haben
 * - noch kein Purchase oder Sale haben
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: API-Key oder Secret-Check für Sicherheit
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    // Finde alle abgelaufenen Auktionen mit autoRenew
    const expiredAuctions = await prisma.watch.findMany({
      where: {
        isAuction: true,
        autoRenew: true,
        auctionEnd: {
          lt: now
        },
        auctionDuration: {
          not: null
        },
        // Keine Purchases oder Sales vorhanden
        purchases: {
          none: {}
        },
        sales: {
          none: {}
        }
      },
      select: {
        id: true,
        auctionEnd: true,
        auctionDuration: true,
        boosters: true, // Booster-Informationen
        sellerId: true  // Verkäufer-ID für Rechnungserstellung
      }
    })

    console.log(`[auto-renew] Gefundene abgelaufene Auktionen mit autoRenew: ${expiredAuctions.length}`)

    let renewedCount = 0
    let boosterInvoiceCount = 0
    const errors: string[] = []

    // Verlängere jede Auktion um die ursprüngliche Dauer
    for (const auction of expiredAuctions) {
      try {
        if (!auction.auctionDuration) {
          continue
        }

        const newAuctionEnd = new Date(auction.auctionEnd!.getTime() + auction.auctionDuration * 24 * 60 * 60 * 1000)

        // Verlängere die Auktion
        await prisma.watch.update({
          where: { id: auction.id },
          data: {
            auctionEnd: newAuctionEnd
          }
        })

        renewedCount++
        console.log(`[auto-renew] Auktion ${auction.id} verlängert bis ${newAuctionEnd.toISOString()}`)

        // Prüfe, ob ein Booster vorhanden ist und erstelle Rechnung
        if (auction.boosters) {
          try {
            let boosterCodes: string[] = []
            
            // Parse boosters (kann JSON-String oder bereits Array sein)
            if (typeof auction.boosters === 'string') {
              try {
                boosterCodes = JSON.parse(auction.boosters)
              } catch (e) {
                // Falls Parsing fehlschlägt, versuche es als einzelnen Code
                boosterCodes = auction.boosters !== 'none' && auction.boosters ? [auction.boosters] : []
              }
            } else if (Array.isArray(auction.boosters)) {
              boosterCodes = auction.boosters
            }

            // Filtere 'none' heraus
            boosterCodes = boosterCodes.filter(code => code && code !== 'none')

            // Erstelle Rechnung für jeden Booster
            for (const boosterCode of boosterCodes) {
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
                  if (!isNaN(lastNumber) && lastNumber > 0) {
                    invoiceNumber = `REV-${year}-${String(lastNumber + 1).padStart(3, '0')}`
                  }
                }

                // Erstelle Rechnung für Booster (Verlängerung)
                const invoice = await prisma.invoice.create({
                  data: {
                    invoiceNumber,
                    sellerId: auction.sellerId,
                    saleId: null, // Kein Verkauf, nur Booster
                    subtotal,
                    vatRate,
                    vatAmount,
                    total,
                    status: 'pending',
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage Frist
                    items: {
                      create: [{
                        watchId: auction.id,
                        description: `Booster: ${boosterPrice.name} (Verlängerung)`,
                        quantity: 1,
                        price: boosterPrice.price,
                        total: boosterPrice.price
                      }]
                    }
                  }
                })

                boosterInvoiceCount++
                console.log(`[auto-renew] Booster-Rechnung erstellt: ${invoiceNumber} für ${boosterPrice.name} (CHF ${total.toFixed(2)}) - Auktion ${auction.id}`)
              }
            }
          } catch (boosterError: any) {
            const errorMsg = `Fehler bei Booster-Rechnungserstellung für Auktion ${auction.id}: ${boosterError.message}`
            console.error(`[auto-renew] ${errorMsg}`)
            errors.push(errorMsg)
            // Verlängerung war erfolgreich, daher keinen fatalen Fehler
          }
        }
      } catch (error: any) {
        const errorMsg = `Fehler bei Auktion ${auction.id}: ${error.message}`
        console.error(`[auto-renew] ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    return NextResponse.json({
      message: 'Auto-Renew abgeschlossen',
      renewed: renewedCount,
      boosterInvoices: boosterInvoiceCount,
      total: expiredAuctions.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('[auto-renew] Fehler:', error)
    return NextResponse.json(
      { 
        message: 'Fehler bei Auto-Renew',
        error: error.message 
      },
      { status: 500 }
    )
  }
}

// GET-Endpoint für manuelle Tests (optional, kann später entfernt werden)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Auto-Renew API',
    usage: 'POST mit Authorization Header: Bearer {CRON_SECRET}'
  })
}
