import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/force-delete-non-admin
 * 
 * FORCIERTE LÖSCHUNG: Löscht ALLE nicht-Admin-User sofort.
 * Keine Checks, keine Flags - einfach löschen.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Nicht autorisiert' }, { status: 401 })
    }

    const currentAdmin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, email: true },
    })

    if (!currentAdmin?.isAdmin) {
      return NextResponse.json({ message: 'Nur Administratoren' }, { status: 403 })
    }

    console.log(`[force-delete-non-admin] Starte forcierte Löschung durch ${currentAdmin.email}`)

    // Finde ALLE nicht-Admin-User
    const nonAdminUsers = await prisma.user.findMany({
      where: { isAdmin: false },
      select: { id: true, email: true },
    })

    console.log(`[force-delete-non-admin] Gefunden: ${nonAdminUsers.length} nicht-Admin-User`)

    if (nonAdminUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine nicht-Admin-User vorhanden.',
        deleted: 0,
      })
    }

    let deleted = 0
    const errors: string[] = []

    // Lösche jeden User einzeln
    for (const user of nonAdminUsers) {
      try {
        console.log(`[force-delete-non-admin] Lösche: ${user.email}...`)
        
        // Direktes Prisma Delete - sollte Cascade Delete nutzen
        await prisma.user.delete({ where: { id: user.id } })
        deleted++
        console.log(`[force-delete-non-admin] ✅ Gelöscht: ${user.email}`)
      } catch (error: any) {
        const errorMsg = error.message || String(error)
        console.error(`[force-delete-non-admin] ❌ Fehler bei ${user.email}:`, errorMsg)
        errors.push(`${user.email}: ${errorMsg}`)
      }
    }

    console.log(`[force-delete-non-admin] Fertig: ${deleted}/${nonAdminUsers.length} gelöscht`)

    return NextResponse.json({
      success: errors.length === 0,
      message: `✅ ${deleted} von ${nonAdminUsers.length} nicht-Admin-Usern gelöscht.`,
      deleted,
      total: nonAdminUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[force-delete-non-admin] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler: ' + error.message },
      { status: 500 }
    )
  }
}
