import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/users/cleanup-simple
 * 
 * Löscht ALLE User außer dem aktuellen Admin.
 * Nutzt Prisma Cascade Delete für abhängige Daten.
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

    const body = await request.json()
    if (body.confirm !== true) {
      const count = await prisma.user.count({
        where: { id: { not: session.user.id } },
      })
      return NextResponse.json({
        message: `Bestätigung erforderlich. ${count} User werden gelöscht.`,
        warning: 'Setzen Sie confirm=true',
        usersToDelete: count,
      }, { status: 400 })
    }

    console.log(`[cleanup-simple] Admin ${currentAdmin.email} startet Cleanup`)

    // Hole alle User außer dem aktuellen Admin
    const usersToDelete = await prisma.user.findMany({
      where: { id: { not: session.user.id } },
      select: { id: true, email: true },
    })

    let deleted = 0
    const errors: string[] = []

    for (const user of usersToDelete) {
      try {
        // Prisma löscht automatisch alle abhängigen Daten (Cascade)
        await prisma.user.delete({ where: { id: user.id } })
        deleted++
        console.log(`[cleanup-simple] Gelöscht: ${user.email}`)
      } catch (error: any) {
        console.error(`[cleanup-simple] Fehler bei ${user.email}:`, error.message)
        errors.push(`${user.email}: ${error.message}`)
      }
    }

    console.log(`[cleanup-simple] Fertig: ${deleted}/${usersToDelete.length} gelöscht`)

    return NextResponse.json({
      success: true,
      message: `✅ ${deleted} von ${usersToDelete.length} Usern gelöscht. Sie (${currentAdmin.email}) bleiben erhalten.`,
      deleted,
      total: usersToDelete.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('[cleanup-simple] Fehler:', error)
    return NextResponse.json(
      { message: 'Fehler: ' + error.message },
      { status: 500 }
    )
  }
}
