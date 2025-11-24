import { prisma } from './prisma'
import { sendEmail, getSearchMatchFoundEmail } from './email'

interface WatchData {
  id: string
  title: string
  brand?: string | null
  model?: string | null
  price: number
  condition?: string | null
  year?: number | null
  categoryId?: string | null
  subcategoryId?: string | null
}

/**
 * Prüft ob ein neu erstellter Artikel zu aktiven Suchabos passt
 * und sendet Benachrichtigungen an die entsprechenden User
 */
export async function checkSearchSubscriptions(watch: WatchData) {
  try {
    // Hole alle aktiven Suchabos
    const subscriptions = await prisma.searchSubscription.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const matches: Array<{ subscriptionId: string; userId: string }> = []

    for (const subscription of subscriptions) {
      if (matchesSearchSubscription(watch, subscription)) {
        matches.push({
          subscriptionId: subscription.id,
          userId: subscription.userId,
        })
      }
    }

    // Für jeden Match: Benachrichtigung senden und Counter aktualisieren
    for (const match of matches) {
      const subscription = subscriptions.find(s => s.id === match.subscriptionId)
      if (!subscription) continue

      const user = subscription.user
      const watchUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/products/${watch.id}`

      // E-Mail senden
      try {
        const { subject, html, text } = getSearchMatchFoundEmail(
          user.name || 'Lieber Nutzer',
          watch.title,
          watch.price,
          watchUrl,
          subscription
        )
        
        await sendEmail({
          to: user.email,
          subject,
          html,
          text,
        })
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error)
      }

      // In-App-Benachrichtigung erstellen
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'search_match',
            title: 'Neuer Artikel gefunden',
            message: `Ein Artikel wurde gefunden, der zu Ihrem Suchabo passt: ${watch.title}`,
            watchId: watch.id,
            isRead: false,
          },
        })
      } catch (error) {
        console.error(`Error creating notification for user ${user.id}:`, error)
      }

      // Counter aktualisieren
      try {
        await prisma.searchSubscription.update({
          where: { id: match.subscriptionId },
          data: {
            matchesFound: {
              increment: 1,
            },
            lastMatchAt: new Date(),
          },
        })
      } catch (error) {
        console.error(`Error updating subscription ${match.subscriptionId}:`, error)
      }
    }

    return matches.length
  } catch (error) {
    console.error('Error checking search subscriptions:', error)
    return 0
  }
}

/**
 * Prüft ob ein Artikel zu einem Suchabo passt
 */
function matchesSearchSubscription(
  watch: WatchData,
  subscription: {
    searchTerm?: string | null
    brand?: string | null
    model?: string | null
    categoryId?: string | null
    subcategoryId?: string | null
    minPrice?: number | null
    maxPrice?: number | null
    condition?: string | null
    yearFrom?: number | null
    yearTo?: number | null
  }
): boolean {
  // Freitext-Suche im Titel, Brand, Model
  if (subscription.searchTerm) {
    const searchLower = subscription.searchTerm.toLowerCase()
    const titleMatch = watch.title.toLowerCase().includes(searchLower)
    const brandMatch = watch.brand?.toLowerCase().includes(searchLower) || false
    const modelMatch = watch.model?.toLowerCase().includes(searchLower) || false
    
    if (!titleMatch && !brandMatch && !modelMatch) {
      return false
    }
  }

  // Marke
  if (subscription.brand && watch.brand) {
    if (watch.brand.toLowerCase() !== subscription.brand.toLowerCase()) {
      return false
    }
  }

  // Modell
  if (subscription.model && watch.model) {
    if (watch.model.toLowerCase() !== subscription.model.toLowerCase()) {
      return false
    }
  }

  // Kategorie
  if (subscription.categoryId && watch.categoryId) {
    if (watch.categoryId !== subscription.categoryId) {
      return false
    }
  }

  // Unterkategorie
  if (subscription.subcategoryId && watch.subcategoryId) {
    if (watch.subcategoryId !== subscription.subcategoryId) {
      return false
    }
  }

  // Preisbereich
  if (subscription.minPrice !== null && subscription.minPrice !== undefined) {
    if (watch.price < subscription.minPrice) {
      return false
    }
  }
  if (subscription.maxPrice !== null && subscription.maxPrice !== undefined) {
    if (watch.price > subscription.maxPrice) {
      return false
    }
  }

  // Zustand
  if (subscription.condition && watch.condition) {
    if (watch.condition !== subscription.condition) {
      return false
    }
  }

  // Jahr
  if (subscription.yearFrom !== null && subscription.yearFrom !== undefined && watch.year) {
    if (watch.year < subscription.yearFrom) {
      return false
    }
  }
  if (subscription.yearTo !== null && subscription.yearTo !== undefined && watch.year) {
    if (watch.year > subscription.yearTo) {
      return false
    }
  }

  return true
}





