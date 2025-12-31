import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Öffentliche Status-API
 * Zeigt den aktuellen Systemstatus und eventuelle Ausfälle
 */
export async function GET() {
  try {
    // Aktive Ausfälle (noch nicht beendet)
    const activeOutages = await prisma.systemOutage.findMany({
      where: { endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        startedAt: true,
        severity: true,
        affectedServices: true,
        isPlanned: true,
      },
    })

    // Letzte beendete Ausfälle (letzte 7 Tage)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentOutages = await prisma.systemOutage.findMany({
      where: {
        endedAt: { not: null },
        startedAt: { gte: sevenDaysAgo },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        severity: true,
        affectedServices: true,
        isPlanned: true,
        extensionApplied: true,
        extensionMinutes: true,
        auctionsExtended: true,
      },
    })

    // Status bestimmen
    let status: 'operational' | 'degraded' | 'major_outage' | 'maintenance' = 'operational'
    let statusMessage = 'Alle Systeme funktionieren normal'

    if (activeOutages.length > 0) {
      const mostSevere = activeOutages.reduce((prev, curr) => {
        const severityOrder = { critical: 3, major: 2, minor: 1 }
        const prevSeverity = severityOrder[prev.severity as keyof typeof severityOrder] || 0
        const currSeverity = severityOrder[curr.severity as keyof typeof severityOrder] || 0
        return currSeverity > prevSeverity ? curr : prev
      })

      if (mostSevere.isPlanned) {
        status = 'maintenance'
        statusMessage = 'Geplante Wartungsarbeiten'
      } else if (mostSevere.severity === 'critical') {
        status = 'major_outage'
        statusMessage = 'Kritischer Systemausfall'
      } else if (mostSevere.severity === 'major') {
        status = 'major_outage'
        statusMessage = 'Systemausfall'
      } else {
        status = 'degraded'
        statusMessage = 'Eingeschränkter Betrieb'
      }
    }

    // Dienste und deren Status
    const services: Array<{
      name: string
      slug: string
      status: 'operational' | 'degraded' | 'major_outage'
    }> = [
      { name: 'Website', slug: 'website', status: 'operational' },
      { name: 'Suche', slug: 'search', status: 'operational' },
      { name: 'Auktionen & Gebote', slug: 'bidding', status: 'operational' },
      { name: 'Zahlungen', slug: 'payments', status: 'operational' },
      { name: 'Benachrichtigungen', slug: 'notifications', status: 'operational' },
      { name: 'Bilder & Uploads', slug: 'uploads', status: 'operational' },
    ]

    // Betroffene Dienste markieren
    for (const outage of activeOutages) {
      for (const affectedService of outage.affectedServices) {
        const service = services.find((s) => s.slug === affectedService)
        if (service) {
          service.status = outage.severity === 'critical' ? 'major_outage' : 'degraded'
        }
      }
    }

    return NextResponse.json({
      status,
      statusMessage,
      lastUpdated: new Date().toISOString(),
      activeOutages,
      recentOutages,
      services,
    })
  } catch (error) {
    console.error('Fehler beim Laden des Status:', error)
    // Bei Fehlern trotzdem eine Antwort liefern
    return NextResponse.json({
      status: 'unknown',
      statusMessage: 'Status konnte nicht ermittelt werden',
      lastUpdated: new Date().toISOString(),
      activeOutages: [],
      recentOutages: [],
      services: [],
    })
  }
}
