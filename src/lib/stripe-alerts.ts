import { prisma } from './prisma'
import { sendEmail, getEmailBaseUrl } from './email'

/**
 * Stripe Integration Alerts
 * Sends alerts to admins when issues are detected
 */

interface AlertThresholds {
  errorRate: number // Percentage (e.g., 10 = 10%)
  consecutiveFailures: number
  processingTimeMs: number // Milliseconds
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  errorRate: 10, // Alert if error rate > 10%
  consecutiveFailures: 5, // Alert after 5 consecutive failures
  processingTimeMs: 5000, // Alert if processing takes > 5 seconds
}

/**
 * Check if alerts should be sent based on recent metrics
 */
export async function checkAndSendAlerts(thresholds: AlertThresholds = DEFAULT_THRESHOLDS) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Get recent metrics
    const recentMetrics = await prisma.webhookMetric.findMany({
      where: {
        timestamp: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    if (recentMetrics.length === 0) {
      return { alertsSent: 0 }
    }

    const totalEvents = recentMetrics.length
    const failedEvents = recentMetrics.filter(m => !m.success).length
    const errorRate = (failedEvents / totalEvents) * 100
    const averageProcessingTime =
      recentMetrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / totalEvents

    const alerts: string[] = []

    // Check error rate
    if (errorRate > thresholds.errorRate) {
      alerts.push(
        `Hohe Fehlerrate: ${errorRate.toFixed(2)}% (${failedEvents}/${totalEvents} Events fehlgeschlagen)`
      )
    }

    // Check consecutive failures
    let consecutiveFailures = 0
    for (const metric of recentMetrics.slice(0, 10)) {
      if (!metric.success) {
        consecutiveFailures++
      } else {
        break
      }
    }
    if (consecutiveFailures >= thresholds.consecutiveFailures) {
      alerts.push(
        `${consecutiveFailures} aufeinanderfolgende Fehler in den letzten Events`
      )
    }

    // Check processing time
    if (averageProcessingTime > thresholds.processingTimeMs) {
      alerts.push(
        `Lange Verarbeitungszeit: Durchschnitt ${Math.round(averageProcessingTime)}ms (Schwellwert: ${thresholds.processingTimeMs}ms)`
      )
    }

    // Send alerts if any issues detected
    if (alerts.length > 0) {
      await sendAlertToAdmins(alerts, {
        errorRate,
        totalEvents,
        failedEvents,
        averageProcessingTime,
      })
      return { alertsSent: 1, alerts }
    }

    return { alertsSent: 0 }
  } catch (error) {
    console.error('[stripe-alerts] Error checking alerts:', error)
    return { alertsSent: 0, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send alert email to all admins
 */
async function sendAlertToAdmins(
  alerts: string[],
  metrics: {
    errorRate: number
    totalEvents: number
    failedEvents: number
    averageProcessingTime: number
  }
) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: {
        isAdmin: true,
        emailVerified: true,
      },
      select: {
        email: true,
        name: true,
      },
    })

    if (admins.length === 0) {
      console.warn('[stripe-alerts] No admin users found to send alerts to')
      return
    }

    const baseUrl = getEmailBaseUrl()
    const monitoringUrl = `${baseUrl}/admin/stripe/monitoring`

    const alertHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert-box { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .metrics { background-color: #f3f4f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>⚠️ Stripe Webhook Alert</h2>
    
    <div class="alert-box">
      <h3>Probleme erkannt:</h3>
      <ul>
        ${alerts.map(alert => `<li>${alert}</li>`).join('')}
      </ul>
    </div>

    <div class="metrics">
      <h3>Metriken (letzte Stunde):</h3>
      <p><strong>Gesamt Events:</strong> ${metrics.totalEvents}</p>
      <p><strong>Fehlgeschlagen:</strong> ${metrics.failedEvents}</p>
      <p><strong>Fehlerrate:</strong> ${metrics.errorRate.toFixed(2)}%</p>
      <p><strong>Durchschnittliche Verarbeitungszeit:</strong> ${Math.round(metrics.averageProcessingTime)}ms</p>
    </div>

    <p>
      <a href="${monitoringUrl}" class="button">Monitoring Dashboard öffnen</a>
    </p>

    <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
      Diese E-Mail wurde automatisch gesendet, da Probleme mit der Stripe-Webhook-Verarbeitung erkannt wurden.
    </p>
  </div>
</body>
</html>
    `.trim()

    const alertText = `
⚠️ Stripe Webhook Alert

Probleme erkannt:
${alerts.map(alert => `- ${alert}`).join('\n')}

Metriken (letzte Stunde):
- Gesamt Events: ${metrics.totalEvents}
- Fehlgeschlagen: ${metrics.failedEvents}
- Fehlerrate: ${metrics.errorRate.toFixed(2)}%
- Durchschnittliche Verarbeitungszeit: ${Math.round(metrics.averageProcessingTime)}ms

Monitoring Dashboard: ${monitoringUrl}
    `.trim()

    // Send to all admins
    for (const admin of admins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: '⚠️ Stripe Webhook Alert - Probleme erkannt',
          html: alertHtml,
          text: alertText,
        }).catch(error => {
          console.error(`[stripe-alerts] Failed to send alert to ${admin.email}:`, error)
        })
      }
    }

    console.log(`[stripe-alerts] Alert sent to ${admins.length} admin(s)`)
  } catch (error) {
    console.error('[stripe-alerts] Error sending alert emails:', error)
  }
}

/**
 * Check if we should send an alert (prevent spam)
 * Only send one alert per hour per issue type
 */
export async function shouldSendAlert(alertType: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Check if we've sent this alert type recently
    const recentAlert = await prisma.alertLog.findFirst({
      where: {
        alertType,
        sentAt: {
          gte: oneHourAgo,
        },
      },
    })

    return !recentAlert
  } catch (error) {
    // On error, allow alert (fail open)
    return true
  }
}

/**
 * Log that an alert was sent
 */
export async function logAlertSent(alertType: string, details?: string) {
  try {
    await prisma.alertLog.create({
      data: {
        alertType,
        details: details || null,
        sentAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[stripe-alerts] Failed to log alert:', error)
  }
}
