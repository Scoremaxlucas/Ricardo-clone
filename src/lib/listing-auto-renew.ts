import { prisma } from '@/lib/prisma'

export interface ListingAutoRenewResult {
  renewed: number
  renewedSofortkauf: number
  boosterInvoices: number
  totalAuctions: number
  totalSofortkauf: number
  errors: string[]
}

/**
 * Verlängert abgelaufene Auktionen (autoRenew) und abgelaufene Sofortkauf-Artikel.
 * Wird von /api/watches/auto-renew und /api/cron/listing-auto-renew aufgerufen.
 */
export async function runListingAutoRenew(): Promise<ListingAutoRenewResult> {
  const now = new Date()
  const errors: string[] = []
  let renewedCount = 0
  let boosterInvoiceCount = 0
  let renewedSofortkaufCount = 0

  const expiredAuctions = await prisma.watch.findMany({
    where: {
      isAuction: true,
      autoRenew: true,
      auctionEnd: { lt: now },
      auctionDuration: { not: null },
      purchases: { none: {} },
      sales: { none: {} },
    },
    select: {
      id: true,
      auctionEnd: true,
      auctionDuration: true,
      boosters: true,
      sellerId: true,
    },
  })

  for (const auction of expiredAuctions) {
    try {
      if (!auction.auctionDuration) continue
      const newAuctionEnd = new Date(
        auction.auctionEnd!.getTime() +
          auction.auctionDuration! * 24 * 60 * 60 * 1000
      )
      await prisma.watch.update({
        where: { id: auction.id },
        data: { auctionEnd: newAuctionEnd },
      })
      renewedCount++

      if (auction.boosters) {
        let boosterCodes: string[] = []
        try {
          if (typeof auction.boosters === 'string') {
            try {
              boosterCodes = JSON.parse(auction.boosters)
            } catch {
              boosterCodes =
                auction.boosters !== 'none' && auction.boosters
                  ? [auction.boosters]
                  : []
            }
          } else if (Array.isArray(auction.boosters)) {
            boosterCodes = auction.boosters
          }
        } catch {
          boosterCodes = []
        }
        boosterCodes = boosterCodes.filter(c => c && c !== 'none')

        for (const code of boosterCodes) {
          const bp = await prisma.boosterPrice.findUnique({
            where: { code },
          })
          if (!bp || bp.price <= 0) continue
          const vatRate = 0.081
          const total = bp.price
          const subtotal = total / (1 + vatRate)
          const vatAmount = total - subtotal
          const roundedSubtotal = Math.floor(subtotal * 20) / 20
          const roundedVatAmount = Math.ceil(vatAmount * 20) / 20
          const roundedTotal = roundedSubtotal + roundedVatAmount
          const year = new Date().getFullYear()
          const last = await prisma.invoice.findFirst({
            where: { invoiceNumber: { startsWith: `REV-${year}-` } },
            orderBy: { invoiceNumber: 'desc' },
          })
          let invoiceNumber = `REV-${year}-001`
          if (last) {
            const n = parseInt(last.invoiceNumber.split('-')[2], 10)
            if (!isNaN(n) && n > 0) {
              invoiceNumber = `REV-${year}-${String(n + 1).padStart(3, '0')}`
            }
          }
          const inv = await prisma.invoice.create({
            data: {
              invoiceNumber,
              sellerId: auction.sellerId,
              saleId: null,
              subtotal: roundedSubtotal,
              vatRate,
              vatAmount: roundedVatAmount,
              total: roundedTotal,
              status: 'pending',
              dueDate: new Date(Date.now() + 14 * 86400 * 1000),
              items: {
                create: [
                  {
                    watchId: auction.id,
                    description: `Booster: ${bp.name} (Verlängerung)`,
                    quantity: 1,
                    price: roundedSubtotal,
                    total: roundedSubtotal,
                  },
                ],
              },
            },
          })
          boosterInvoiceCount++
          try {
            const { sendInvoiceNotificationAndEmail } = await import(
              '@/lib/invoice'
            )
            await sendInvoiceNotificationAndEmail(inv)
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e: any) {
      errors.push(`Auktion ${auction.id}: ${e?.message || 'Fehler'}`)
    }
  }

  const expiredSofortkauf = await prisma.watch.findMany({
    where: {
      isAuction: false,
      listingExpiresAt: { not: null, lt: now },
      listingDurationDays: { not: null },
      purchases: { none: {} },
      sales: { none: {} },
    },
    select: {
      id: true,
      listingExpiresAt: true,
      listingDurationDays: true,
    },
  })

  for (const w of expiredSofortkauf) {
    try {
      const expiresAt = w.listingExpiresAt!
      const days = w.listingDurationDays ?? 30
      const newExpiresAt = new Date(
        expiresAt.getTime() + days * 24 * 60 * 60 * 1000
      )
      await prisma.watch.update({
        where: { id: w.id },
        data: { listingExpiresAt: newExpiresAt },
      })
      renewedSofortkaufCount++
    } catch (e: any) {
      errors.push(`Sofortkauf ${w.id}: ${e?.message || 'Fehler'}`)
    }
  }

  return {
    renewed: renewedCount,
    renewedSofortkauf: renewedSofortkaufCount,
    boosterInvoices: boosterInvoiceCount,
    totalAuctions: expiredAuctions.length,
    totalSofortkauf: expiredSofortkauf.length,
    errors,
  }
}
