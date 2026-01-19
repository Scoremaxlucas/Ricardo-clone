import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/delete-last-non-admin
 *
 * FINALE LÖSCHUNG: Löscht den letzten nicht-Admin-User.
 * Wird nach erfolgreicher Ausführung deaktiviert.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const currentAdmin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true, id: true },
    })

    if (!currentAdmin?.isAdmin) {
      return NextResponse.json({ message: 'Nur Administratoren' }, { status: 403 })
    }

    // Prüfe ob bereits nur Admin-User vorhanden sind
    const nonAdminCount = await prisma.user.count({ where: { isAdmin: false } })

    if (nonAdminCount === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ Cleanup bereits abgeschlossen. Nur noch Admin-User vorhanden. Keine weiteren Löschungen möglich.',
        deleted: 0,
        cleanupComplete: true,
        disabled: true,
      })
    }

    // Finde alle nicht-Admin-User
    const nonAdminUsers = await prisma.user.findMany({
      where: { isAdmin: false },
      select: { id: true, email: true, name: true },
    })

    console.log(`[delete-last-non-admin] Lösche ${nonAdminUsers.length} nicht-Admin-User...`)

    let deleted = 0
    const errors: string[] = []

    for (const user of nonAdminUsers) {
      try {
        // Lösche User mit Prisma (Cascade Delete)
        await prisma.user.delete({ where: { id: user.id } })
        deleted++
        console.log(`[delete-last-non-admin] ✅ Gelöscht: ${user.email}`)
      } catch (error: any) {
        console.error(`[delete-last-non-admin] ❌ Fehler bei ${user.email}:`, error.message)
        errors.push(`${user.email}: ${error.message}`)
      }
    }

    // Prüfe ob alle nicht-Admin-User gelöscht wurden
    const remainingNonAdmin = await prisma.user.count({ where: { isAdmin: false } })
    const cleanupComplete = remainingNonAdmin === 0

    let message = `✅ ${deleted} nicht-Admin-User gelöscht.`
    if (cleanupComplete) {
      message += ` 🎉 Cleanup abgeschlossen! Nur noch Admin-User vorhanden. Keine weiteren Löschungen mehr möglich.`
    }

    return NextResponse.json({
      success: errors.length === 0,
      message,
      deleted,
      total: nonAdminUsers.length,
      cleanupComplete,
      disabled: cleanupComplete, // Endpoint wird nach Cleanup deaktiviert
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[delete-last-non-admin] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler: ' + error.message },
      { status: 500 }
    )
  }
}
