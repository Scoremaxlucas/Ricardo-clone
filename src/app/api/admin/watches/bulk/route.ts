import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

// Helper: Admin-Check
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true
}

// RICARDO-STYLE Bulk Actions:
// - 'block': Sperre Artikel (Soft Delete - Daten bleiben erhalten)
// - 'remove': Entferne Artikel (Soft Delete - Daten bleiben erhalten)
// - KEIN 'approve': Genehmigen entfernt - hatte keinen praktischen Nutzen (Artikel sind bereits sichtbar wenn pending)
// - KEIN 'delete': Hard Delete nur über einzelne API mit Prüfung
// - KEIN 'activate'/'deactivate': Artikel haben Lebenszyklus, kein Toggle

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const body = await request.json()
    const { action, watchIds, reason } = body

    if (!action || !Array.isArray(watchIds) || watchIds.length === 0) {
      return NextResponse.json({ message: 'Ungültige Parameter' }, { status: 400 })
    }

    const adminId = session!.user!.id
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const watchId of watchIds) {
      try {
        switch (action) {
          // Genehmigen entfernt: Hatte keinen praktischen Nutzen
          // Artikel sind bereits sichtbar wenn pending, daher keine separate "Genehmigung" nötig
          case 'approve':
            results.failed++
            results.errors.push(
              `${watchId}: Genehmigen-Funktion wurde entfernt (kein praktischer Nutzen).`
            )
            break

          // Sperren (RICARDO-STYLE: Soft Delete)
          case 'block':
            await prisma.watch.update({
              where: { id: watchId },
              data: { moderationStatus: 'blocked' },
            })
            await prisma.moderationHistory.create({
              data: {
                watchId,
                adminId,
                action: 'blocked',
                details: JSON.stringify({
                  bulk: true,
                  reason: reason || 'Bulk-Sperrung durch Admin',
                }),
              },
            })
            results.success++
            break

          // Entfernen (RICARDO-STYLE: Soft Delete)
          case 'remove':
            await prisma.watch.update({
              where: { id: watchId },
              data: { moderationStatus: 'removed' },
            })
            await prisma.moderationHistory.create({
              data: {
                watchId,
                adminId,
                action: 'removed',
                details: JSON.stringify({
                  bulk: true,
                  reason: reason || 'Bulk-Entfernung durch Admin',
                }),
              },
            })
            results.success++
            break

          // LEGACY: Entfernt - activate/approve hatten keinen praktischen Nutzen
          case 'activate':
            console.warn('[DEPRECATED] activate action removed - no practical use')
            results.failed++
            results.errors.push(
              `${watchId}: activate-Funktion wurde entfernt (kein praktischer Nutzen).`
            )
            break

          case 'deactivate':
            console.warn('[DEPRECATED] Using deactivate action - should use remove instead')
            await prisma.watch.update({
              where: { id: watchId },
              data: { moderationStatus: 'removed' },
            })
            results.success++
            break

          case 'delete':
            // RICARDO: Kein Bulk-Delete mehr - nur einzelne Artikel über /api/watches/[id]
            results.failed++
            results.errors.push(
              `${watchId}: Bulk-Löschen nicht erlaubt. Bitte einzeln über Admin-Panel entfernen.`
            )
            break

          default:
            results.failed++
            results.errors.push(`Unbekannte Aktion: ${action}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${watchId}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: `${results.success} Angebote erfolgreich bearbeitet`,
      results,
    })
  } catch (error: any) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { message: 'Fehler bei Bulk-Aktion: ' + error.message },
      { status: 500 }
    )
  }
}
