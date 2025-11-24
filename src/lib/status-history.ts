import { prisma } from './prisma'

export interface StatusHistoryEntry {
  status: string
  timestamp: Date
  changedBy: string
  reason?: string
}

/**
 * Fügt einen Eintrag zur Status-Historie hinzu
 */
export async function addStatusHistory(
  purchaseId: string,
  status: string,
  changedBy: string,
  reason?: string
): Promise<void> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { statusHistory: true }
  })

  if (!purchase) {
    throw new Error('Purchase nicht gefunden')
  }

  // Parse bestehende Historie
  let history: StatusHistoryEntry[] = []
  try {
    if (purchase.statusHistory) {
      history = JSON.parse(purchase.statusHistory)
    }
  } catch (error) {
    console.error('[status-history] Fehler beim Parsen der Historie:', error)
    history = []
  }

  // Füge neuen Eintrag hinzu
  const newEntry: StatusHistoryEntry = {
    status,
    timestamp: new Date(),
    changedBy,
    reason
  }

  history.push(newEntry)

  // Speichere aktualisierte Historie
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      statusHistory: JSON.stringify(history)
    }
  })
}

/**
 * Ruft die Status-Historie ab
 */
export async function getStatusHistory(purchaseId: string): Promise<StatusHistoryEntry[]> {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { statusHistory: true }
  })

  if (!purchase || !purchase.statusHistory) {
    return []
  }

  try {
    const history = JSON.parse(purchase.statusHistory) as StatusHistoryEntry[]
    return history.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }))
  } catch (error) {
    console.error('[status-history] Fehler beim Parsen der Historie:', error)
    return []
  }
}







