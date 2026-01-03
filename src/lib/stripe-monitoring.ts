import { prisma } from './prisma'

/**
 * Stripe Integration Monitoring
 * Tracks webhook performance, errors, and health metrics
 */

interface WebhookMetrics {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  averageProcessingTime: number
  lastEventAt: Date | null
  lastErrorAt: Date | null
  errorRate: number
}

/**
 * Record webhook processing metrics
 */
export async function recordWebhookMetric(
  eventId: string,
  eventType: string,
  success: boolean,
  processingTimeMs: number,
  error?: string
) {
  try {
    await prisma.webhookMetric.create({
      data: {
        eventId,
        eventType,
        success,
        processingTimeMs,
        error: error || null,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    // Don't fail webhook processing if metrics recording fails
    console.error('[stripe-monitoring] Failed to record metric:', error)
  }
}

/**
 * Get webhook metrics for the last N hours
 */
export async function getWebhookMetrics(hours: number = 24): Promise<WebhookMetrics> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const metrics = await prisma.webhookMetric.findMany({
    where: {
      timestamp: {
        gte: since,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  })

  const totalEvents = metrics.length
  const successfulEvents = metrics.filter(m => m.success).length
  const failedEvents = totalEvents - successfulEvents
  const averageProcessingTime =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / metrics.length
      : 0
  const lastEventAt = metrics[0]?.timestamp || null
  const lastErrorAt =
    metrics.find(m => !m.success)?.timestamp || null
  const errorRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0

  return {
    totalEvents,
    successfulEvents,
    failedEvents,
    averageProcessingTime: Math.round(averageProcessingTime),
    lastEventAt,
    lastErrorAt,
    errorRate: Math.round(errorRate * 100) / 100,
  }
}

/**
 * Clean up old metrics (older than 30 days)
 */
export async function cleanupOldMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  try {
    const result = await prisma.webhookMetric.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo,
        },
      },
    })

    return { deleted: result.count }
  } catch (error) {
    console.error('[stripe-monitoring] Failed to cleanup metrics:', error)
    return { deleted: 0 }
  }
}
