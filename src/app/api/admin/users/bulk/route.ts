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

// POST: Bulk-Aktionen für Benutzer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
    }

    const body = await request.json()
    const { action, userIds, reason } = body

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ message: 'Ungültige Parameter' }, { status: 400 })
    }

    const adminId = session!.user!.id

    // Hole Admin-Informationen
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
      },
    })

    if (!adminUser) {
      return NextResponse.json({ message: 'Admin nicht gefunden' }, { status: 404 })
    }

    const adminName =
      adminUser.name ||
      `${adminUser.firstName} ${adminUser.lastName}` ||
      adminUser.nickname ||
      adminUser.email

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Verhindere, dass sich ein Admin selbst blockiert oder Admin-Rechte entzieht
    if (action === 'block' || action === 'revokeAdmin') {
      if (userIds.includes(adminId)) {
        return NextResponse.json(
          { message: 'Sie können diese Aktion nicht auf sich selbst anwenden' },
          { status: 400 }
        )
      }
    }

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'block':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isBlocked: true,
                blockedAt: new Date(),
                blockedBy: adminId,
              },
            })

            // Erstelle Activity-Eintrag
            try {
              if (prisma.userActivity) {
                await prisma.userActivity.create({
                  data: {
                    userId: userId,
                    action: 'user_blocked',
                    details: JSON.stringify({
                      blockedBy: adminId,
                      blockedByEmail: adminUser.email,
                      blockedByName: adminName,
                      blockedAt: new Date().toISOString(),
                      bulk: true,
                    }),
                  },
                })
              }
            } catch (activityError) {
              console.warn('Could not create activity entry:', activityError)
            }

            results.success++
            break

          case 'unblock':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isBlocked: false,
                blockedAt: null,
                blockedBy: null,
              },
            })

            // Erstelle Activity-Eintrag
            try {
              if (prisma.userActivity) {
                await prisma.userActivity.create({
                  data: {
                    userId: userId,
                    action: 'user_unblocked',
                    details: JSON.stringify({
                      unblockedBy: adminId,
                      unblockedByEmail: adminUser.email,
                      unblockedByName: adminName,
                      unblockedAt: new Date().toISOString(),
                      bulk: true,
                    }),
                  },
                })
              }
            } catch (activityError) {
              console.warn('Could not create activity entry:', activityError)
            }

            results.success++
            break

          case 'warn':
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                nickname: true,
                warningCount: true,
              },
            })

            if (user) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  warningCount: (user.warningCount || 0) + 1,
                  lastWarnedAt: new Date(),
                },
              })

              const userName =
                user.name || `${user.firstName} ${user.lastName}` || user.nickname || user.email

              const reasonLabel =
                reason === 'inappropriate_content'
                  ? 'Unangemessener Inhalt'
                  : reason === 'spam'
                    ? 'Spam'
                    : reason === 'fraud'
                      ? 'Betrug'
                      : reason === 'harassment'
                        ? 'Belästigung'
                        : reason === 'terms_violation'
                          ? 'Verstoß gegen Nutzungsbedingungen'
                          : reason === 'fake_account'
                            ? 'Fake-Account'
                            : reason === 'other'
                              ? 'Sonstiges'
                              : reason || 'Unbekannt'

              // Erstelle Benachrichtigung
              try {
                await prisma.notification.create({
                  data: {
                    userId: user.id,
                    type: 'WARNING',
                    title: 'Sie haben eine Verwarnung erhalten',
                    message: `Grund: ${reasonLabel}`,
                    link: null,
                  },
                })
              } catch (notificationError) {
                console.warn('Could not create notification:', notificationError)
              }

              results.success++
            } else {
              results.failed++
              results.errors.push(`${userId}: Benutzer nicht gefunden`)
            }
            break

          case 'grantAdmin':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isAdmin: true,
              },
            })

            // Erstelle Activity-Eintrag
            try {
              if (prisma.userActivity) {
                await prisma.userActivity.create({
                  data: {
                    userId: userId,
                    action: 'admin_rights_granted',
                    details: JSON.stringify({
                      changedBy: adminId,
                      changedByEmail: adminUser.email,
                      changedByName: adminName,
                      changedAt: new Date().toISOString(),
                      bulk: true,
                    }),
                  },
                })
              }
            } catch (activityError) {
              console.warn('Could not create activity entry:', activityError)
            }

            results.success++
            break

          case 'revokeAdmin':
            // Verhindere, dass sich ein Admin selbst entfernt
            if (userId === adminId) {
              results.failed++
              results.errors.push(`${userId}: Sie können sich nicht selbst die Admin-Rechte entziehen`)
              break
            }

            await prisma.user.update({
              where: { id: userId },
              data: {
                isAdmin: false,
              },
            })

            // Erstelle Activity-Eintrag
            try {
              if (prisma.userActivity) {
                await prisma.userActivity.create({
                  data: {
                    userId: userId,
                    action: 'admin_rights_removed',
                    details: JSON.stringify({
                      changedBy: adminId,
                      changedByEmail: adminUser.email,
                      changedByName: adminName,
                      changedAt: new Date().toISOString(),
                      bulk: true,
                    }),
                  },
                })
              }
            } catch (activityError) {
              console.warn('Could not create activity entry:', activityError)
            }

            results.success++
            break

          default:
            results.failed++
            results.errors.push(`Unbekannte Aktion: ${action}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${userId}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: `${results.success} Benutzer erfolgreich bearbeitet${results.failed > 0 ? `, ${results.failed} Fehler` : ''}`,
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
