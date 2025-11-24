import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

/**
 * API-Route zur Überwachung der Kontaktfrist (7-Tage-Regel)
 * Sollte regelmäßig von einem Cron-Job aufgerufen werden (z.B. stündlich)
 * 
 * Prüft Purchases und:
 * - Sendet Warnung nach 5 Tagen ohne Kontakt
 * - Markiert als überschritten nach 7 Tagen ohne Kontakt
 * - Erstellt Benachrichtigungen für beide Parteien
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
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    console.log(`[check-contact-deadline] Prüfe Kontaktfristen zum Zeitpunkt ${now.toISOString()}`)

    // 1. Finde Purchases die in 5 Tagen ablaufen (Warnung senden)
    const purchasesNeedingWarning = await prisma.purchase.findMany({
      where: {
        contactDeadline: {
          lte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // In den nächsten 2 Tagen
          gte: now // Noch nicht abgelaufen
        },
        contactWarningSentAt: null, // Noch keine Warnung gesendet
        contactDeadlineMissed: false, // Noch nicht überschritten
        OR: [
          { sellerContactedAt: null }, // Verkäufer hat nicht kontaktiert
          { buyerContactedAt: null } // Käufer hat nicht kontaktiert
        ]
      },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                nickname: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true
          }
        }
      }
    })

    console.log(`[check-contact-deadline] Gefunden: ${purchasesNeedingWarning.length} Purchases benötigen Warnung`)

    let warningsSent = 0
    for (const purchase of purchasesNeedingWarning) {
      try {
        const daysUntilDeadline = Math.ceil((purchase.contactDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        
        // Warnung an Verkäufer (wenn nicht kontaktiert)
        if (!purchase.sellerContactedAt) {
          try {
            const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'
            const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || purchase.buyer.email || 'Käufer'
            
            await prisma.notification.create({
              data: {
                userId: purchase.watch.sellerId,
                type: 'PURCHASE',
                title: '⚠️ Kontaktfrist läuft ab',
                message: `Sie haben noch ${daysUntilDeadline} Tag(e) Zeit, um ${buyerName} für "${purchase.watch.title}" zu kontaktieren. Bitte nehmen Sie innerhalb von 7 Tagen Kontakt auf.`,
                link: `/my-watches/selling/sold`,
                watchId: purchase.watchId
              }
            })
            
            // E-Mail-Benachrichtigung
            try {
              const { getContactDeadlineWarningEmail } = await import('@/lib/email')
              const { subject, html, text } = getContactDeadlineWarningEmail(
                sellerName,
                buyerName,
                purchase.watch.title,
                daysUntilDeadline,
                'seller'
              )
              
              await sendEmail({
                to: purchase.watch.seller.email,
                subject,
                html,
                text
              })
            } catch (emailError) {
              console.error('[check-contact-deadline] Fehler beim Senden der Warnungs-E-Mail an Verkäufer:', emailError)
            }
          } catch (error) {
            console.error('[check-contact-deadline] Fehler beim Erstellen der Warnung für Verkäufer:', error)
          }
        }
        
        // Warnung an Käufer (wenn nicht kontaktiert)
        if (!purchase.buyerContactedAt) {
          try {
            const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || purchase.buyer.email || 'Käufer'
            const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'
            
            await prisma.notification.create({
              data: {
                userId: purchase.buyerId,
                type: 'PURCHASE',
                title: '⚠️ Kontaktfrist läuft ab',
                message: `Sie haben noch ${daysUntilDeadline} Tag(e) Zeit, um ${sellerName} für "${purchase.watch.title}" zu kontaktieren. Bitte nehmen Sie innerhalb von 7 Tagen Kontakt auf.`,
                link: `/my-watches/buying/purchased`,
                watchId: purchase.watchId
              }
            })
            
            // E-Mail-Benachrichtigung
            try {
              const { getContactDeadlineWarningEmail } = await import('@/lib/email')
              const { subject, html, text } = getContactDeadlineWarningEmail(
                buyerName,
                sellerName,
                purchase.watch.title,
                daysUntilDeadline,
                'buyer'
              )
              
              await sendEmail({
                to: purchase.buyer.email,
                subject,
                html,
                text
              })
            } catch (emailError) {
              console.error('[check-contact-deadline] Fehler beim Senden der Warnungs-E-Mail an Käufer:', emailError)
            }
          } catch (error) {
            console.error('[check-contact-deadline] Fehler beim Erstellen der Warnung für Käufer:', error)
          }
        }
        
        // Markiere Warnung als gesendet
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            contactWarningSentAt: now
          }
        })
        
        warningsSent++
      } catch (error) {
        console.error(`[check-contact-deadline] Fehler bei Purchase ${purchase.id}:`, error)
      }
    }

    // 2. Finde Purchases die die Frist überschritten haben (7 Tage)
    const purchasesMissedDeadline = await prisma.purchase.findMany({
      where: {
        contactDeadline: {
          lt: now // Abgelaufen
        },
        contactDeadlineMissed: false, // Noch nicht als überschritten markiert
        OR: [
          { sellerContactedAt: null }, // Verkäufer hat nicht kontaktiert
          { buyerContactedAt: null } // Käufer hat nicht kontaktiert
        ]
      },
      include: {
        watch: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                firstName: true,
                lastName: true,
                nickname: true
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            nickname: true
          }
        }
      }
    })

    console.log(`[check-contact-deadline] Gefunden: ${purchasesMissedDeadline.length} Purchases mit überschrittener Frist`)

    let deadlinesMissed = 0
    for (const purchase of purchasesMissedDeadline) {
      try {
        // Markiere als überschritten
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            contactDeadlineMissed: true
          }
        })
        
        // Erstelle Benachrichtigungen für beide Parteien
        const sellerName = purchase.watch.seller.nickname || purchase.watch.seller.firstName || purchase.watch.seller.name || 'Verkäufer'
        const buyerName = purchase.buyer.nickname || purchase.buyer.firstName || purchase.buyer.name || purchase.buyer.email || 'Käufer'
        
        // Benachrichtigung an Verkäufer (wenn nicht kontaktiert)
        if (!purchase.sellerContactedAt) {
          await prisma.notification.create({
            data: {
              userId: purchase.watch.sellerId,
              type: 'PURCHASE',
              title: '❌ Kontaktfrist überschritten',
              message: `Die 7-Tage-Kontaktfrist für "${purchase.watch.title}" wurde überschritten. Der Käufer kann den Kauf jetzt stornieren.`,
              link: `/my-watches/selling/sold`,
              watchId: purchase.watchId
            }
          })
        }
        
        // Benachrichtigung an Käufer (wenn nicht kontaktiert)
        if (!purchase.buyerContactedAt) {
          await prisma.notification.create({
            data: {
              userId: purchase.buyerId,
              type: 'PURCHASE',
              title: '❌ Kontaktfrist überschritten',
              message: `Die 7-Tage-Kontaktfrist für "${purchase.watch.title}" wurde überschritten. Sie können den Kauf jetzt stornieren.`,
              link: `/my-watches/buying/purchased`,
              watchId: purchase.watchId
            }
          })
        }
        
        deadlinesMissed++
      } catch (error) {
        console.error(`[check-contact-deadline] Fehler bei Purchase ${purchase.id}:`, error)
      }
    }

    return NextResponse.json({
      message: 'Kontaktfristen geprüft',
      warningsSent,
      deadlinesMissed,
      totalChecked: purchasesNeedingWarning.length + purchasesMissedDeadline.length
    })
  } catch (error: any) {
    console.error('[check-contact-deadline] Fehler:', error)
    return NextResponse.json(
      { message: 'Ein Fehler ist aufgetreten: ' + error.message },
      { status: 500 }
    )
  }
}







