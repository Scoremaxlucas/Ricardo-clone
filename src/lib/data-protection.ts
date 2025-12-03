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
export async function isArticleVisible(articleId: string): Promise<{
  visible: boolean
  reason?: string
  filters: {
    moderationStatus: boolean
    purchases: boolean
    auction: boolean
  }
}> {
  try {
    const article = await prisma.watch.findUnique({
      where: { id: articleId },
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

    if (!article) {
      return {
        visible: false,
        reason: 'Article not found',
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
      moderationStatus: article.moderationStatus !== 'rejected',
      
      // Purchase Filter: Zeige wenn keine Purchases ODER alle storniert
      purchases: article.purchases.length === 0 || 
                 article.purchases.every(p => p.status === 'cancelled'),
      
      // Auction Filter: Zeige wenn keine Auktion ODER noch nicht abgelaufen ODER Purchase vorhanden
      auction: !article.isAuction || 
               !article.auctionEnd || 
               article.auctionEnd > now ||
               article.purchases.some(p => p.status !== 'cancelled'),
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
export async function validateAllArticlesVisible(): Promise<{
  total: number
  visible: number
  hidden: number
  hiddenArticles: Array<{ id: string; reason: string }>
}> {
  try {
    const allArticles = await prisma.watch.findMany({
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
      allArticles.map(article => isArticleVisible(article.id))
    )

    const hiddenArticles = results
      .map((result, index) => ({
        id: allArticles[index].id,
        reason: result.reason || 'unknown',
      }))
      .filter((_, index) => !results[index].visible)

    return {
      total: allArticles.length,
      visible: results.filter(r => r.visible).length,
      hidden: hiddenArticles.length,
      hiddenArticles,
    }
  } catch (error: any) {
    throw new Error(`Error validating articles: ${error.message}`)
  }
}

// Backward compatibility aliases
export const isWatchVisible = isArticleVisible
export const validateAllWatchesVisible = validateAllArticlesVisible

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
    warnings.push('Purchase filter should allow articles with no purchases OR all cancelled purchases')
  }

  return {
    safe: warnings.length === 0,
    warnings,
  }
}

