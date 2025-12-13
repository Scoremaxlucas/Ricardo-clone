import { getSearchMatchFoundEmail, sendEmail } from './email'
import { prisma } from './prisma'

interface WatchData {
  id: string
  title: string
  description?: string | null
  brand?: string | null
  model?: string | null
  material?: string | null
  movement?: string | null
  referenceNumber?: string | null
  price: number
  condition?: string | null
  year?: number | null
  categoryId?: string | null
  subcategoryId?: string | null
  categoryIds?: string[] // Alle Kategorie-IDs des Artikels
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
      const matchesSubscription = matchesSearchSubscription(watch, subscription)
      if (matchesSubscription) {
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
        // Silent fail - E-Mail-Fehler sollten nicht die Hauptfunktionalität blockieren
      }

      // In-App-Benachrichtigung erstellen
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'SEARCH_MATCH',
            title: 'Neuer Artikel gefunden',
            message: `Ein Artikel wurde gefunden, der zu Ihrem Suchabo passt: ${watch.title}`,
            link: watchUrl,
            watchId: watch.id,
            isRead: false,
          },
        })
      } catch (error) {
        // Silent fail - Benachrichtigungs-Fehler sollten nicht die Hauptfunktionalität blockieren
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
        // Silent fail - Counter-Update sollte nicht die Hauptfunktionalität blockieren
      }
    }

    return matches.length
  } catch (error) {
    // Silent fail - Fehler sollten nicht die Hauptfunktionalität blockieren
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
  // Sammle ALLE Textfelder des Artikels für die intelligente Suche
  // Dies umfasst: Titel, Beschreibung, Marke, Modell, Material, Movement, Referenznummer
  const watchText = [
    watch.title,
    watch.description, // WICHTIG: Beschreibung wird jetzt auch durchsucht
    watch.brand,
    watch.model,
    watch.material,
    watch.movement,
    watch.referenceNumber,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // Prüfe alle Kriterien - alle müssen passen (AND-Logik)
  // Aber: searchTerm ist flexibler - wenn andere Kriterien (Brand, Model, Kategorie) passen,
  // dann reicht es wenn mindestens ein Wort des searchTerm passt

  // 1. Freitext-Suche (searchTerm) - INTELLIGENTE Prüfung in ALLEN Textfeldern
  // Durchsucht: Titel, Beschreibung, Marke, Modell, Material, Movement, Referenznummer
  if (subscription.searchTerm) {
    const searchLower = subscription.searchTerm.toLowerCase().trim()
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)

    if (searchWords.length > 1) {
      // Mehrere Wörter: Intelligente Suche
      // Strategie 1: Prüfe ob alle Wörter im kombinierten Text vorkommen (beste Übereinstimmung)
      const allWordsMatch = searchWords.every(word => watchText.includes(word))

      if (allWordsMatch) {
        // Perfekte Übereinstimmung - alle Wörter gefunden
        // Weiter mit anderen Kriterien prüfen
      } else {
        // Strategie 2: Mindestens ein Wort muss passen
        const atLeastOneWordMatches = searchWords.some(word => watchText.includes(word))

        if (!atLeastOneWordMatches) {
          // Strategie 3: Prüfe ob Brand/Model/Material mit einem Wort übereinstimmt
          const brandMatchesAnyWord =
            watch.brand &&
            searchWords.some(word => {
              const watchBrandLower = watch.brand!.toLowerCase()
              return watchBrandLower.includes(word) || word.includes(watchBrandLower)
            })
          const modelMatchesAnyWord =
            watch.model &&
            searchWords.some(word => {
              const watchModelLower = watch.model!.toLowerCase()
              return watchModelLower.includes(word) || word.includes(watchModelLower)
            })
          const materialMatchesAnyWord =
            watch.material &&
            searchWords.some(word => {
              const watchMaterialLower = watch.material!.toLowerCase()
              return watchMaterialLower.includes(word) || word.includes(watchMaterialLower)
            })

          // Wenn weder Text noch Brand/Model/Material passt, schlage fehl
          if (!brandMatchesAnyWord && !modelMatchesAnyWord && !materialMatchesAnyWord) {
            return false
          }
        }
      }
    } else {
      // Einzelnes Wort: Teilstring-Matching in ALLEN Feldern
      const searchWord = searchWords[0]

      // Prüfe in allen Textfeldern
      const titleMatch = watch.title?.toLowerCase().includes(searchWord) || false
      const descriptionMatch = watch.description?.toLowerCase().includes(searchWord) || false
      const brandMatch = watch.brand?.toLowerCase().includes(searchWord) || false
      const modelMatch = watch.model?.toLowerCase().includes(searchWord) || false
      const materialMatch = watch.material?.toLowerCase().includes(searchWord) || false
      const movementMatch = watch.movement?.toLowerCase().includes(searchWord) || false
      const referenceMatch = watch.referenceNumber?.toLowerCase().includes(searchWord) || false

      // Mindestens ein Feld muss passen
      if (
        !titleMatch &&
        !descriptionMatch &&
        !brandMatch &&
        !modelMatch &&
        !materialMatch &&
        !movementMatch &&
        !referenceMatch
      ) {
        return false
      }
    }
  }

  // 2. Marke: Unterstützt Teilstring-Matching (z.B. "Yamaha" findet "Yamaha MT-07")
  if (subscription.brand) {
    if (!watch.brand) {
      return false
    }
    const subscriptionBrand = subscription.brand.toLowerCase().trim()
    const watchBrand = watch.brand.toLowerCase().trim()

    // Exakte Übereinstimmung ODER Teilstring-Matching
    if (
      watchBrand !== subscriptionBrand &&
      !watchBrand.includes(subscriptionBrand) &&
      !subscriptionBrand.includes(watchBrand)
    ) {
      return false
    }
  }

  // 3. Modell: Unterstützt Teilstring-Matching
  if (subscription.model) {
    if (!watch.model) {
      return false
    }
    const subscriptionModel = subscription.model.toLowerCase().trim()
    const watchModel = watch.model.toLowerCase().trim()

    // Exakte Übereinstimmung ODER Teilstring-Matching
    if (
      watchModel !== subscriptionModel &&
      !watchModel.includes(subscriptionModel) &&
      !subscriptionModel.includes(watchModel)
    ) {
      return false
    }
  }

  // 4. Kategorie: Muss exakt übereinstimmen
  // Unterstützt sowohl einzelne categoryId als auch categoryIds Array
  if (subscription.categoryId) {
    const watchCategoryIds = watch.categoryIds || (watch.categoryId ? [watch.categoryId] : [])
    if (watchCategoryIds.length === 0 || !watchCategoryIds.includes(subscription.categoryId)) {
      return false
    }
  }

  // 5. Unterkategorie: Muss exakt übereinstimmen
  if (subscription.subcategoryId && watch.subcategoryId) {
    if (watch.subcategoryId !== subscription.subcategoryId) {
      return false
    }
  }

  // 6. Preisbereich
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

  // 7. Zustand: Muss exakt übereinstimmen
  if (subscription.condition && watch.condition) {
    if (watch.condition !== subscription.condition) {
      return false
    }
  }

  // 8. Jahr
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

  // Alle Kriterien passen
  return true
}
