/**
 * DATA PROTECTION - GOLDEN RULE
 * 
 * NIEMALS dürfen bestehende Artikel oder User durch Code-Änderungen verschwinden oder gelöscht werden.
 * Dies ist eine kritische Geschäftsregel und muss bei jeder Änderung beachtet werden.
 */

import { prisma } from './prisma'

/**
 * Prüft ob ein Artikel durch die aktuelle Filter-Logik sichtbar ist
 */
export async function isWatchVisible(watchId: string): Promise<{
  visible: boolean
  reason?: string
  filters: {
    moderationStatus: boolean
    purchases: boolean
    auction: boolean
  }
}> {
  try {
    const watch = await prisma.watch.findUnique({
      where: { id: watchId },
      select: {
        id: true,
        moderationStatus: true,
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
        auctionEnd: true,
        isAuction: true,
      },
    })

    if (!watch) {
      return {
        visible: false,
        reason: 'Watch not found',
        filters: {
          moderationStatus: false,
          purchases: false,
          auction: false,
        },
      }
    }

    const now = new Date()
    const filters = {
      // Moderation Status Filter: Zeige alle außer 'rejected'
      moderationStatus: watch.moderationStatus !== 'rejected',
      
      // Purchase Filter: Zeige wenn keine Purchases ODER alle storniert
      purchases: watch.purchases.length === 0 || 
                 watch.purchases.every(p => p.status === 'cancelled'),
      
      // Auction Filter: Zeige wenn keine Auktion ODER noch nicht abgelaufen ODER Purchase vorhanden
      auction: !watch.isAuction || 
               !watch.auctionEnd || 
               watch.auctionEnd > now ||
               watch.purchases.some(p => p.status !== 'cancelled'),
    }

    const visible = filters.moderationStatus && filters.purchases && filters.auction

    return {
      visible,
      reason: visible ? undefined : 
        !filters.moderationStatus ? 'moderationStatus is rejected' :
        !filters.purchases ? 'has active purchases' :
        !filters.auction ? 'auction expired without purchase' :
        'unknown reason',
      filters,
    }
  } catch (error: any) {
    return {
      visible: false,
      reason: `Error checking visibility: ${error.message}`,
      filters: {
        moderationStatus: false,
        purchases: false,
        auction: false,
      },
    }
  }
}

/**
 * Prüft ob alle bestehenden Artikel noch sichtbar sind
 * Sollte vor jedem Deployment aufgerufen werden
 */
export async function validateAllWatchesVisible(): Promise<{
  total: number
  visible: number
  hidden: number
  hiddenWatches: Array<{ id: string; reason: string }>
}> {
  try {
    const allWatches = await prisma.watch.findMany({
      select: {
        id: true,
        moderationStatus: true,
        purchases: {
          select: {
            id: true,
            status: true,
          },
        },
        auctionEnd: true,
        isAuction: true,
      },
    })

    const results = await Promise.all(
      allWatches.map(watch => isWatchVisible(watch.id))
    )

    const hiddenWatches = results
      .map((result, index) => ({
        id: allWatches[index].id,
        reason: result.reason || 'unknown',
      }))
      .filter((_, index) => !results[index].visible)

    return {
      total: allWatches.length,
      visible: results.filter(r => r.visible).length,
      hidden: hiddenWatches.length,
      hiddenWatches,
    }
  } catch (error: any) {
    throw new Error(`Error validating watches: ${error.message}`)
  }
}

/**
 * Sicherheitsprüfung: Verhindert dass Filter-Logik zu restriktiv wird
 */
export function validateFilterLogic(filterLogic: any): {
  safe: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // Prüfe ob moderationStatus Filter zu restriktiv ist
  if (filterLogic.moderationStatus) {
    // Warnung wenn nur explizite Werte erlaubt sind (könnte bestehende Artikel ausschließen)
    if (Array.isArray(filterLogic.moderationStatus) && filterLogic.moderationStatus.length < 4) {
      warnings.push('ModerationStatus filter might be too restrictive - ensure all non-rejected statuses are included')
    }
  }

  // Prüfe ob Purchase Filter zu restriktiv ist
  if (filterLogic.purchases) {
    warnings.push('Purchase filter should allow watches with no purchases OR all cancelled purchases')
  }

  return {
    safe: warnings.length === 0,
    warnings,
  }
}

