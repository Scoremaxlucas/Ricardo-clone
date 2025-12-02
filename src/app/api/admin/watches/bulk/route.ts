import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper: Admin-Check
async function checkAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })
  return user?.isAdmin === true
}

// POST: Bulk-Aktionen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const body = await request.json()
    const { action, watchIds } = body

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
          case 'activate':
            await prisma.watch.update({
              where: { id: watchId },
              data: { moderationStatus: 'approved' },
            })
            await prisma.moderationHistory.create({
              data: {
                watchId,
                adminId,
                action: 'activated',
                details: JSON.stringify({ bulk: true }),
              },
            })
            results.success++
            break

          case 'deactivate':
            await prisma.watch.update({
              where: { id: watchId },
              data: { moderationStatus: 'rejected' },
            })
            await prisma.moderationHistory.create({
              data: {
                watchId,
                adminId,
                action: 'deactivated',
                details: JSON.stringify({ bulk: true }),
              },
            })
            results.success++
            break

          case 'delete':
            await prisma.watch.delete({
              where: { id: watchId },
            })
            results.success++
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
