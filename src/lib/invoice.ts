import { prisma } from './prisma'

// Pricing Settings (in-memory - später aus DB laden)
const DEFAULT_PRICING = {
  platformMarginRate: 0.1, // 10%
  vatRate: 0.081, // 8.1% MwSt
  minimumCommission: 0,
  maximumCommission: 220, // Maximum CHF 220.- für Plattform-Gebühr
  listingFee: 0,
  transactionFee: 0
}

// Hilfsfunktion zur Berechnung von Rechnungen
export async function calculateInvoiceForSale(purchaseId: string) {
  // Hole Purchase mit Watch, Boosters und Verkäufer
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      watch: {
        include: {
          seller: true
        }
      },
      buyer: true
    }
  })

  if (!purchase || !purchase.watch) {
    throw new Error('Purchase oder Watch nicht gefunden')
  }

  // Verkaufspreis aus Purchase (falls vorhanden, sonst vom Watch)
  const salePrice = purchase.price || purchase.watch.price
  
  if (!salePrice || salePrice <= 0) {
    throw new Error(`Ungültiger Verkaufspreis: ${salePrice} für Purchase ${purchaseId}`)
  }

  // Verwende Default Pricing (später können wir das aus DB laden)
  const pricing = DEFAULT_PRICING

  // Berechne Gebühren (NUR Plattform-Gebühr, KEINE Booster - die werden bei Angebotserstellung berechnet)
  const items: Array<{
    description: string
    quantity: number
    price: number
    total: number
  }> = []

  // 1. Plattform-Gebühr (10% vom Verkaufspreis, max. CHF 220.-)
  const calculatedFee = salePrice * pricing.platformMarginRate
  const platformFee = pricing.maximumCommission ? Math.min(calculatedFee, pricing.maximumCommission) : calculatedFee
  items.push({
    description: platformFee < calculatedFee 
      ? `Plattform-Gebühr (${(pricing.platformMarginRate * 100).toFixed(2)}%, gedeckelt auf CHF ${pricing.maximumCommission})`
      : `Plattform-Gebühr (${(pricing.platformMarginRate * 100).toFixed(2)}%)`,
    quantity: 1,
    price: platformFee,
    total: platformFee
  })
  console.log(`[invoice] Platform fee (${(pricing.platformMarginRate * 100).toFixed(2)}% of ${salePrice}, max ${pricing.maximumCommission}):`, platformFee)
  
  console.log(`[invoice] Total items (keine Booster in Verkaufsrechnung):`, items)

  // Subtotal (ohne MwSt.)
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)

  // MwSt-Betrag
  const vatAmount = subtotal * pricing.vatRate

  // Total (mit MwSt.) - Schweizer Rappenrundung auf 0.05
  const totalBeforeRounding = subtotal + vatAmount
  const total = Math.ceil(totalBeforeRounding * 20) / 20

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
      // Fallback: Suche nach der höchsten Nummer
      console.warn(`[invoice] Konnte Rechnungsnummer nicht aus ${lastInvoice.invoiceNumber} parsen, verwende Fallback`)
      invoiceNumber = `REV-${year}-${String(1).padStart(3, '0')}`
    }
  }

  // Erstelle Rechnung
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      sellerId: purchase.watch.sellerId,
      saleId: purchaseId,
      subtotal,
      vatRate: pricing.vatRate,
      vatAmount,
      total,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage Frist
      items: {
        create: items.map(item => ({
          watchId: purchase.watchId,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      }
    },
    include: {
      items: true,
      seller: true
    }
  })

  console.log(`[invoice] Rechnung erstellt: ${invoiceNumber} für Seller ${purchase.watch.sellerId}, Total: CHF ${total.toFixed(2)}`)

  return invoice
}

