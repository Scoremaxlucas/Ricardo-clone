import nodemailer from 'nodemailer'
import { Resend } from 'resend'

// Resend Client initialisieren (falls API Key vorhanden)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Gibt die Basis-URL für E-Mail-Links zurück
 *
 * In Produktion wird immer https://helvenda.ch verwendet.
 * In Development wird localhost verwendet.
 *
 * @returns Die Basis-URL für E-Mail-Links
 */
export function getEmailBaseUrl(): string {
  // In Production: Immer helvenda.ch verwenden
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://helvenda.ch'
  }

  // In Development: localhost verwenden
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
}

// E-Mail-Transporter konfigurieren (für SMTP Fallback)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true für 465, false für andere Ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  console.log('\n📧 ===== E-MAIL-VERSAND START =====')
  console.log(`[sendEmail] Empfänger: ${to}`)
  console.log(`[sendEmail] Betreff: ${subject}`)
  console.log(`[sendEmail] Resend Client vorhanden: ${resend ? '✅ Ja' : '❌ Nein'}`)
  console.log(
    `[sendEmail] RESEND_API_KEY vorhanden: ${process.env.RESEND_API_KEY ? '✅ Ja' : '❌ Nein'}`
  )

  // Priorität 1: Resend (professionell, skalierbar)
  // Resend kann Millionen von E-Mails pro Tag versenden
  if (resend) {
    try {
      const fromEmail =
        process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'onboarding@resend.dev'

      console.log(`[sendEmail] Versende E-Mail via Resend:`)
      console.log(`  From: ${fromEmail}`)
      console.log(`  To: ${to}`)
      console.log(`  Subject: ${subject}`)
      console.log(`  HTML Length: ${html.length} Zeichen`)

      const result = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        // Explizit keine Verschlüsselung verwenden
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
        },
      })

      console.log(`[sendEmail] Resend Response erhalten:`)
      console.log(`  Data:`, result.data)
      console.log(`  Error:`, result.error)

      if (result.error) {
        console.error('❌ Resend Fehler:', result.error)
        console.error('   Status Code:', result.error.statusCode)
        console.error('   Name:', result.error.name)
        console.error('   Message:', result.error.message)
        console.error('   Full Error:', JSON.stringify(result.error, null, 2))
        // Return error instead of throwing, so we can log it properly
        return {
          success: false,
          error: result.error.message || `Resend Fehler: ${result.error.statusCode || 'Unknown'}`,
          method: 'resend',
          statusCode: result.error.statusCode,
        }
      }

      console.log('✅ E-Mail via Resend erfolgreich versendet!')
      console.log(`   Message ID: ${result.data?.id}`)
      console.log('📧 ===== E-MAIL-VERSAND ERFOLGREICH =====\n')
      return { success: true, messageId: result.data?.id, method: 'resend' }
    } catch (error: any) {
      console.error('❌ Resend Fehler:', error)
      console.error('   Error Message:', error.message)
      console.error('   Error Stack:', error.stack)
      console.log('📧 ===== E-MAIL-VERSAND FEHLGESCHLAGEN =====\n')
      // Fallback zu SMTP
    }
  } else {
    console.warn('⚠️ Resend Client nicht initialisiert. Prüfe RESEND_API_KEY in .env')
    console.log(
      `   RESEND_API_KEY Wert: ${process.env.RESEND_API_KEY ? 'Vorhanden (Länge: ' + process.env.RESEND_API_KEY.length + ')' : 'NICHT VORHANDEN'}`
    )
  }

  // Priorität 2: SMTP (wenn Resend nicht verfügbar oder fehlgeschlagen)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@helvenda.ch',
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Fallback zu Text ohne HTML
        html,
        // Explizit keine Verschlüsselung verwenden
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
        },
        // Deaktiviere automatische Signierung/Verschlüsselung
        disableFileAccess: false,
        disableUrlAccess: false,
      })

      console.log('✅ E-Mail via SMTP versendet:', info.messageId)
      return { success: true, messageId: info.messageId, method: 'smtp' }
    } catch (error: any) {
      console.error('SMTP Fehler:', error)
      return { success: false, error: error.message, method: 'smtp' }
    }
  }

  // Keine E-Mail-Konfiguration vorhanden
  console.warn('⚠️ Keine E-Mail-Konfiguration gefunden. E-Mail wird nicht versendet.')
  console.log('📧 E-Mail würde versendet werden:')
  console.log('An:', to)
  console.log('Betreff:', subject)
  console.log('Inhalt:', text || html)

  return {
    success: false,
    error:
      'Keine E-Mail-Konfiguration gefunden. Bitte RESEND_API_KEY oder SMTP_USER/SMTP_PASS konfigurieren.',
    method: 'none',
  }
}

// Template für Antwort-Benachrichtigung
export function getAnswerNotificationEmail(
  buyerName: string,
  sellerName: string,
  watchTitle: string,
  answerContent: string,
  watchId: string,
  isPublic: boolean
) {
  const baseUrl = getEmailBaseUrl()
  const watchUrl = `${baseUrl}/products/${watchId}`

  const subject = `Antwort auf Ihre Frage zu ${watchTitle}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .message-box { background-color: white; padding: 15px; border-left: 4px solid #0f766e; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0f766e; color: #ffffff !important; text-decoration: none; border-radius: 16px; margin-top: 20px; font-weight: 600; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Helvenda.ch</h1>
        </div>
        <div class="content">
          <p>Hallo ${buyerName},</p>
          <p>${sellerName} hat auf Ihre Frage zu <strong>${watchTitle}</strong> geantwortet:</p>
          <div class="message-box">
            <p>${answerContent.replace(/\n/g, '<br>')}</p>
            ${isPublic ? '<p style="font-size: 12px; color: #666; margin-top: 10px;"><em>Diese Antwort wurde öffentlich gemacht.</em></p>' : '<p style="font-size: 12px; color: #666; margin-top: 10px;"><em>Diese Antwort ist privat.</em></p>'}
          </div>
          <p>
            <a href="${watchUrl}" class="button">Antwort ansehen</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
          <p>Sie erhalten diese E-Mail, weil Sie eine Frage zu diesem Angebot gestellt haben.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${buyerName},

${sellerName} hat auf Ihre Frage zu "${watchTitle}" geantwortet:

${answerContent}

${isPublic ? 'Diese Antwort wurde öffentlich gemacht.' : 'Diese Antwort ist privat.'}

Antwort ansehen: ${watchUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Suchabo-Match-Benachrichtigung
export function getSearchMatchFoundEmail(
  userName: string,
  articleTitle: string,
  articlePrice: number,
  articleUrl: string,
  subscription: {
    searchTerm?: string | null
    brand?: string | null
    model?: string | null
    minPrice?: number | null
    maxPrice?: number | null
  }
) {
  const baseUrl = getEmailBaseUrl()
  const subscriptionsUrl = `${baseUrl}/my-watches/buying/search-subscriptions`

  // Erstelle Beschreibung der Suchkriterien
  const criteria: string[] = []
  if (subscription.searchTerm) criteria.push(`Suchbegriff: "${subscription.searchTerm}"`)
  if (subscription.brand) criteria.push(`Marke: ${subscription.brand}`)
  if (subscription.model) criteria.push(`Modell: ${subscription.model}`)
  if (subscription.minPrice || subscription.maxPrice) {
    const priceRange = []
    if (subscription.minPrice) priceRange.push(`ab CHF ${subscription.minPrice.toFixed(2)}`)
    if (subscription.maxPrice) priceRange.push(`bis CHF ${subscription.maxPrice.toFixed(2)}`)
    criteria.push(`Preis: ${priceRange.join(' ')}`)
  }
  const criteriaText = criteria.length > 0 ? criteria.join(', ') : 'Ihre Suchkriterien'

  const subject = `Neuer Artikel gefunden: ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Neuer Artikel gefunden`,
    `Hallo ${userName},`,
    `
      <p>Wir haben einen Artikel gefunden, der zu Ihrem Suchabo passt:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; color: #134e4a; font-weight: 600; margin-bottom: 8px;">
          ${articleTitle}
        </p>
        <p style="margin: 0; font-size: 18px; color: #0f766e; font-weight: bold;">
          CHF ${new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(articlePrice)}
        </p>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
        <strong>Ihr Suchabo:</strong> ${criteriaText}
      </p>

      <p>Schauen Sie sich den Artikel jetzt an und nutzen Sie Ihre Chance!</p>
    `,
    'Artikel ansehen',
    articleUrl
  )

  const text = `
Neuer Artikel gefunden: ${articleTitle}

Hallo ${userName},

Wir haben einen Artikel gefunden, der zu Ihrem Suchabo passt:

Artikel: ${articleTitle}
Preis: CHF ${articlePrice.toFixed(2)}
Ihr Suchabo: ${criteriaText}

Artikel ansehen: ${articleUrl}

Suchabos verwalten: ${subscriptionsUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Sie erhalten diese E-Mail, weil Sie ein aktives Suchabo haben.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)
export function getPaymentRequestEmail(
  userName: string,
  invoiceNumber: string,
  total: number,
  dueDate: Date,
  invoiceId: string
) {
  const subject = `Zahlungsaufforderung - Rechnung ${invoiceNumber}`
  const formattedDate = new Date(dueDate).toLocaleDateString('de-CH')
  const formattedTotal = total.toFixed(2)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .amount { font-size: 24px; font-weight: bold; color: #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Zahlungsaufforderung</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="info">
        <strong>Ihre Rechnung ist fällig</strong>
      </div>

      <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
      <p><strong>Fälligkeitsdatum:</strong> ${formattedDate}</p>
      <p class="amount">Betrag: CHF ${formattedTotal}</p>

      <p>Bitte begleichen Sie diese Rechnung innerhalb der nächsten Tage.</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}" class="button">
          Rechnung ansehen und bezahlen →
        </a>
      </p>

      <p><strong>Verfügbare Zahlungsmethoden:</strong></p>
      <ul>
        <li>Banküberweisung (mit QR-Code)</li>
        <li>TWINT</li>
        <li>Kreditkarte</li>
      </ul>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
Zahlungsaufforderung - Rechnung ${invoiceNumber}

Hallo ${userName},

Ihre Rechnung ist fällig.

Rechnungsnummer: ${invoiceNumber}
Fälligkeitsdatum: ${formattedDate}
Betrag: CHF ${formattedTotal}

Bitte begleichen Sie diese Rechnung innerhalb der nächsten Tage.

Rechnung ansehen: ${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für erste Erinnerung (Tag 30)
export function getFirstReminderEmail(
  userName: string,
  invoiceNumber: string,
  total: number,
  dueDate: Date,
  invoiceId: string
) {
  const subject = `Erinnerung: Zahlung ausstehend - Rechnung ${invoiceNumber}`
  const formattedDate = new Date(dueDate).toLocaleDateString('de-CH')
  const formattedTotal = total.toFixed(2)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .amount { font-size: 24px; font-weight: bold; color: #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[!] Zahlungserinnerung</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>Erinnerung:</strong> Ihre Rechnung ${invoiceNumber} ist noch offen.
      </div>

      <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
      <p><strong>Fälligkeitsdatum:</strong> ${formattedDate}</p>
      <p class="amount">Betrag: CHF ${formattedTotal}</p>

      <p>Bitte begleichen Sie diese Rechnung umgehend.</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}" class="button">
          Jetzt bezahlen →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
Erinnerung: Zahlung ausstehend - Rechnung ${invoiceNumber}

Hallo ${userName},

Erinnerung: Ihre Rechnung ${invoiceNumber} ist noch offen.

Rechnungsnummer: ${invoiceNumber}
Fälligkeitsdatum: ${formattedDate}
Betrag: CHF ${formattedTotal}

Bitte begleichen Sie diese Rechnung umgehend.

Jetzt bezahlen: ${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

export function getCancelRequestEmail(
  buyerName: string,
  sellerName: string,
  articleTitle: string,
  reason: string,
  description: string
) {
  const subject = `⚠️ Stornierungsantrag für "${articleTitle}"`

  const reasonLabels: Record<string, string> = {
    buyer_not_responding: 'Käufer antwortet nicht',
    payment_not_confirmed: 'Zahlung nicht bestätigt',
    item_damaged_before_shipping: 'Artikel beschädigt vor Versand',
    other: 'Sonstiges',
  }

  const reasonLabel = reasonLabels[reason] || reason

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .info-box { background: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Stornierungsantrag gestellt</h1>
    </div>
    <div class="content">
      <p>Hallo ${buyerName},</p>

      <div class="warning">
        <strong>Wichtige Information:</strong> Der Verkäufer ${sellerName} hat einen Stornierungsantrag für den folgenden Artikel gestellt:
      </div>

      <div class="info-box">
        <p><strong>Artikel:</strong> ${articleTitle}</p>
        <p><strong>Grund:</strong> ${reasonLabel}</p>
        <p><strong>Beschreibung:</strong></p>
        <p style="white-space: pre-wrap; margin-left: 20px;">${description}</p>
      </div>

      <p><strong>Was bedeutet das?</strong></p>
      <p>Ein Stornierungsantrag ist eine <strong>Anfrage</strong> des Verkäufers. Ein Admin wird den Antrag prüfen und entscheiden, ob die Stornierung genehmigt wird.</p>

      <p>Sie werden über die Entscheidung informiert, sobald der Admin den Antrag bearbeitet hat.</p>

      <p>Falls Sie Fragen haben, können Sie sich gerne an unseren Support wenden.</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
Stornierungsantrag für "${articleTitle}"

Hallo ${buyerName},

Der Verkäufer ${sellerName} hat einen Stornierungsantrag für den folgenden Artikel gestellt:

Artikel: ${articleTitle}
Grund: ${reasonLabel}
Beschreibung: ${description}

Was bedeutet das?
Ein Stornierungsantrag ist eine Anfrage des Verkäufers. Ein Admin wird den Antrag prüfen und entscheiden, ob die Stornierung genehmigt wird.

Sie werden über die Entscheidung informiert, sobald der Admin den Antrag bearbeitet hat.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)
export function getSecondReminderEmail(
  userName: string,
  invoiceNumber: string,
  total: number,
  lateFeeAmount: number,
  dueDate: Date,
  invoiceId: string
) {
  const subject = `WICHTIG: Zweite Zahlungserinnerung + Mahnspesen - Rechnung ${invoiceNumber}`
  const formattedDate = new Date(dueDate).toLocaleDateString('de-CH')
  const formattedTotal = total.toFixed(2)
  const formattedLateFee = lateFeeAmount.toFixed(2)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
    .late-fee { background: #fef3c7; padding: 10px; margin: 15px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[!] Zweite Zahlungserinnerung</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>WICHTIG:</strong> Ihre Rechnung ${invoiceNumber} ist überfällig.
      </div>

      <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
      <p><strong>Fälligkeitsdatum:</strong> ${formattedDate}</p>

      <div class="late-fee">
        <p><strong>Mahnspesen hinzugefügt:</strong> CHF ${formattedLateFee}</p>
      </div>

      <p class="amount">Gesamtbetrag: CHF ${formattedTotal}</p>

      <p><strong>Hinweis:</strong> Bei weiterer Nichtzahlung wird Ihr Konto nach 58 Tagen gesperrt.</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}" class="button">
          Jetzt bezahlen →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
WICHTIG: Zweite Zahlungserinnerung + Mahnspesen - Rechnung ${invoiceNumber}

Hallo ${userName},

WICHTIG: Ihre Rechnung ${invoiceNumber} ist überfällig.

Rechnungsnummer: ${invoiceNumber}
Fälligkeitsdatum: ${formattedDate}

Mahnspesen hinzugefügt: CHF ${formattedLateFee}
Gesamtbetrag: CHF ${formattedTotal}

Hinweis: Bei weiterer Nichtzahlung wird Ihr Konto nach 58 Tagen gesperrt.

Jetzt bezahlen: ${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)
export function getFinalReminderEmail(
  userName: string,
  invoiceNumber: string,
  total: number,
  lateFeeAmount: number,
  dueDate: Date,
  invoiceId: string
) {
  const subject = `KRITISCH: Letzte Erinnerung - Konto wird gesperrt - Rechnung ${invoiceNumber}`
  const formattedDate = new Date(dueDate).toLocaleDateString('de-CH')
  const formattedTotal = total.toFixed(2)
  const formattedLateFee = lateFeeAmount.toFixed(2)

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #991b1b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .critical { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
    .late-fee { background: #fef3c7; padding: 10px; margin: 15px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚫 Letzte Erinnerung</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="critical">
        <strong>KRITISCH:</strong> Ihr Konto wird aufgrund nicht bezahlter Gebühren gesperrt.
      </div>

      <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
      <p><strong>Fälligkeitsdatum:</strong> ${formattedDate}</p>

      <div class="late-fee">
        <p><strong>Mahnspesen:</strong> CHF ${formattedLateFee}</p>
      </div>

      <p class="amount">Gesamtbetrag: CHF ${formattedTotal}</p>

      <p><strong>[!] WICHTIG:</strong> Dies ist Ihre letzte Möglichkeit zur Zahlung. Nach dieser Erinnerung wird Ihr Konto automatisch gesperrt.</p>

      <p>Nach der Sperre können Sie nicht mehr:</p>
      <ul>
        <li>Artikel verkaufen</li>
        <li>Artikel kaufen</li>
        <li>Gebote abgeben</li>
        <li>Preisvorschläge machen</li>
      </ul>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}" class="button">
          JETZT BEZAHLEN →
        </a>
      </p>

      <p style="color: #dc2626; font-weight: bold;">
        Nach Zahlung wird Ihr Konto automatisch entsperrt.
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
KRITISCH: Letzte Erinnerung - Konto wird gesperrt - Rechnung ${invoiceNumber}

Hallo ${userName},

KRITISCH: Ihr Konto wird aufgrund nicht bezahlter Gebühren gesperrt.

Rechnungsnummer: ${invoiceNumber}
Fälligkeitsdatum: ${formattedDate}

Mahnspesen: CHF ${formattedLateFee}
Gesamtbetrag: CHF ${formattedTotal}

WICHTIG: Dies ist Ihre letzte Möglichkeit zur Zahlung. Nach dieser Erinnerung wird Ihr Konto automatisch gesperrt.

Nach der Sperre können Sie nicht mehr:
- Artikel verkaufen
- Artikel kaufen
- Gebote abgeben
- Preisvorschläge machen

JETZT BEZAHLEN: ${getEmailBaseUrl()}/my-watches/selling/fees?invoice=${invoiceId}

Nach Zahlung wird Ihr Konto automatisch entsperrt.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Verifizierungs-Bestätigung
// Template für E-Mail-Bestätigung bei Registrierung
// Template für E-Mail-Verifizierung (Helvenda-Style: Professionelles Design mit Button)
export function getEmailVerificationEmail(userName: string, verificationUrl: string) {
  const subject = 'E-Mail-Adresse bestätigen - Helvenda'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f3f4f6;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 40px 30px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo-section {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .logo-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .logo-text {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .logo-text-main {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }
    .logo-text-domain {
      font-size: 14px;
      color: #6b7280;
      line-height: 1;
      font-weight: 400;
    }
    .header-subtitle {
      font-size: 14px;
      color: #6b7280;
      font-weight: 400;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .description {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 40px;
      line-height: 1.6;
    }
    .button-container {
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.5);
      background-color: #0d9488;
      color: #ffffff !important;
    }
    .info-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 16px 20px;
      margin: 30px 0;
      text-align: left;
      border-radius: 4px;
    }
    .info-text {
      font-size: 14px;
      color: #134e4a;
      line-height: 1.6;
      font-weight: 500;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .footer-link {
      color: #0f766e;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .support-text {
      margin-top: 30px;
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .support-link {
      color: #0f766e;
      text-decoration: none;
    }
    .support-link:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 22px;
      }
      .description {
        font-size: 15px;
      }
      .button {
        padding: 14px 32px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#0f766e"/>
              <path
                d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28"
                stroke="white"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-text-main" style="color: #111827; font-size: 24px; font-weight: 700;">Helvenda</span>
            <span class="logo-text-domain" style="color: #6b7280; font-size: 14px;">.ch</span>
          </div>
        </div>
        <p class="header-subtitle" style="font-size: 14px; color: #6b7280; font-weight: 400; margin-top: 8px;">Schweizer Online-Marktplatz</p>
      </div>

      <div class="content">
        <p class="greeting">Hallo ${userName},</p>

        <h2 class="title">E-Mail-Adresse bestätigen</h2>

        <p class="description">
          Willkommen bei Helvenda! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren und loszulegen.
        </p>

        <div class="button-container">
          <a href="${verificationUrl}" class="button" style="color: #ffffff !important; background-color: #0f766e; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600; font-size: 16px; display: inline-block;">E-Mail-Adresse bestätigen</a>
        </div>

        <div class="info-box">
          <p class="info-text">
            <strong>Wichtig:</strong> Dieser Link ist 24 Stunden gültig. Falls Sie sich nicht bei Helvenda registriert haben, können Sie diese E-Mail ignorieren.
          </p>
        </div>

        <p class="support-text">
          Falls Sie Probleme bei der Bestätigung haben, kontaktieren Sie uns bitte unter <a href="mailto:support@helvenda.ch" class="support-link">support@helvenda.ch</a>.
        </p>
      </div>

      <div class="footer">
        <p class="footer-text">
          Diese E-Mail wurde automatisch von <a href="https://helvenda.ch" class="footer-link">Helvenda.ch</a> gesendet.
        </p>
        <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
          Helvenda - Ihr vertrauensvoller Marktplatz für den Kauf und Verkauf von Artikeln in der Schweiz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
E-Mail-Adresse bestätigen - Helvenda

Hallo ${userName},

Willkommen bei Helvenda!

Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren und loszulegen.

E-Mail-Adresse bestätigen: ${verificationUrl}

Wichtig: Dieser Link ist 24 Stunden gültig. Falls Sie sich nicht bei Helvenda registriert haben, können Sie diese E-Mail ignorieren.

Falls Sie Probleme bei der Bestätigung haben, kontaktieren Sie uns bitte unter support@helvenda.ch.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Helvenda - Ihr vertrauensvoller Marktplatz für den Kauf und Verkauf von Artikeln in der Schweiz.
  `.trim()

  return { subject, html, text }
}

export function getVerificationApprovalEmail(userName: string, userEmail: string) {
  const baseUrl = getEmailBaseUrl()
  const profileUrl = `${baseUrl}/profile`

  const subject = `Ihr Konto wurde erfolgreich verifiziert`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .success-box { background-color: white; padding: 20px; border-left: 4px solid #0f766e; margin: 15px 0; }
        .check-icon { font-size: 48px; color: #0f766e; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0f766e; color: #ffffff !important; text-decoration: none; border-radius: 16px; margin-top: 20px; font-weight: 600; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Helvenda.ch</h1>
        </div>
        <div class="content">
          <p>Hallo ${userName},</p>
          <div class="success-box">
            <div class="check-icon">✓</div>
            <h2 style="text-align: center; color: #0f766e; margin-top: 10px;">
              Ihre Verifizierung wurde erfolgreich bestätigt!
            </h2>
            <p style="text-align: center; margin-top: 15px;">
              Ihr Konto wurde von unserem Team geprüft und freigegeben.
            </p>
          </div>
          <p>
            Sie können nun alle Funktionen unserer Plattform nutzen:
          </p>
          <ul style="margin-left: 20px; margin-top: 10px;">
            <li>Artikel zum Verkauf anbieten</li>
            <li>Bei Auktionen mitbieten</li>
            <li>Sofortkäufe tätigen</li>
          </ul>
          <p style="margin-top: 20px;">
            <a href="${profileUrl}" class="button">Zu Ihrem Profil</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
          <p>Sie erhalten diese E-Mail, weil Ihr Konto erfolgreich verifiziert wurde.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${userName},

Ihre Verifizierung wurde erfolgreich bestätigt!

Ihr Konto wurde von unserem Team geprüft und freigegeben. Sie können nun alle Funktionen unserer Plattform nutzen:

• Artikel zum Verkauf anbieten
• Bei Auktionen mitbieten
• Sofortkäufe tätigen

Zu Ihrem Profil: ${profileUrl}

---
       Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
       Sie erhalten diese E-Mail, weil Ihr Konto erfolgreich verifiziert wurde.
         `.trim()

  return { subject, html, text }
}

// Template für Verkaufsbenachrichtigung
export function getSaleNotificationEmail(
  sellerName: string,
  buyerName: string,
  watchTitle: string,
  finalPrice: number,
  purchaseType: 'auction' | 'buy-now',
  watchId: string,
  imageUrl?: string, // Produktbild (optional)
  buyerRating?: number, // Käufer-Bewertung (optional)
  buyerReviewCount?: number // Anzahl Bewertungen (optional)
) {
  const baseUrl = getEmailBaseUrl()
  const salesUrl = `${baseUrl}/my-watches/selling/sold`

  const subject = `Ihre Uhr wurde verkauft: ${watchTitle}`

  const html = `
           <!DOCTYPE html>
           <html>
           <head>
             <meta charset="utf-8">
             <style>
               body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
               .container { max-width: 600px; margin: 0 auto; padding: 20px; }
               .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
               .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
               .success-box { background-color: white; padding: 20px; border-left: 4px solid #0f766e; margin: 15px 0; }
               .price-box { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
               .buyer-info { background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
               .button { display: inline-block; padding: 12px 24px; background-color: #0f766e; color: #ffffff !important; text-decoration: none; border-radius: 16px; margin-top: 20px; font-weight: 600; }
               .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
             </style>
           </head>
           <body>
             <div class="container">
               <div class="header">
                 <h1>Helvenda.ch</h1>
               </div>
               <div class="content">
                 <p>Hallo ${sellerName},</p>
                 <div class="success-box">
                   <h2 style="color: #0f766e; margin-top: 0;">
                     ✓ Glückwunsch! Ihr Artikel wurde erfolgreich verkauft!
                   </h2>
                 </div>

                 <div class="price-box">
                   <div style="font-size: 12px; color: #059669; margin-bottom: 5px;">Verkaufspreis</div>
                   <div style="font-size: 32px; font-weight: bold; color: #047857;">
                     CHF ${new Intl.NumberFormat('de-CH').format(finalPrice)}
                   </div>
                   <div style="font-size: 12px; color: #059669; margin-top: 5px;">
                     ${purchaseType === 'buy-now' ? 'Sofortkauf' : 'Auktion'}
                   </div>
                 </div>

                 <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                   <table style="width: 100%; border-collapse: collapse;">
                     <tr>
                       ${
                         imageUrl
                           ? `<td style="width: 100px; padding-right: 15px; vertical-align: top;">
                         <img src="${imageUrl}" alt="${watchTitle}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
                       </td>`
                           : ''
                       }
                       <td style="vertical-align: top;">
                         <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${watchTitle}</p>
                         <p style="margin: 0; font-size: 14px; color: #6b7280;">Käufer: <strong>${buyerName}</strong>${buyerRating ? ` <span style="color: #f59e0b;">⭐ ${buyerRating.toFixed(1)}</span> <span style="color: #9ca3af; font-size: 12px;">(${buyerReviewCount || 0})</span>` : ''}</p>
                       </td>
                     </tr>
                   </table>
                 </div>

                 <div class="buyer-info">
                   <p style="margin-top: 0;"><strong>Nächste Schritte:</strong></p>
                   <p>Die Käuferinformationen (Name, Adresse, Kontaktdaten, Zahlungsmethoden) finden Sie in Ihrem Verkäufer-Bereich unter "Verkauft".</p>
                 </div>

                 <p style="margin-top: 20px;">
                   <a href="${salesUrl}" class="button">Zu Ihren Verkäufen</a>
                 </p>
               </div>
               <div class="footer">
                 <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
                 <p>Sie erhalten diese E-Mail, weil einer Ihrer Artikel erfolgreich verkauft wurde.</p>
               </div>
             </div>
           </body>
           </html>
         `

  const text = `
       Hallo ${sellerName},

       ✓ Glückwunsch! Ihr Artikel wurde erfolgreich verkauft!

       Verkaufte Uhr: ${watchTitle}
       Käufer: ${buyerName}
       Verkaufspreis: CHF ${new Intl.NumberFormat('de-CH').format(finalPrice)}
       Art: ${purchaseType === 'buy-now' ? 'Sofortkauf' : 'Auktion'}

       Die Käuferinformationen (Name, Adresse, Kontaktdaten, Zahlungsmethoden) finden Sie in Ihrem Verkäufer-Bereich unter "Verkauft".

       Zu Ihren Verkäufen: ${salesUrl}

       ---
       Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
       Sie erhalten diese E-Mail, weil einer Ihrer Artikel erfolgreich verkauft wurde.
         `.trim()

  return { subject, html, text }
}

// Template für Bewertungs-Benachrichtigung
export function getReviewNotificationEmail(
  userName: string,
  rating: 'positive' | 'neutral' | 'negative',
  reviewerName: string
) {
  const baseUrl = getEmailBaseUrl()
  const profileUrl = `${baseUrl}/my-watches/public-profile`

  const ratingLabels: Record<string, { label: string; color: string; emoji: string }> = {
    positive: { label: 'positive', color: '#0f766e', emoji: '[+]' },
    neutral: { label: 'neutrale', color: '#6b7280', emoji: '[=]' },
    negative: { label: 'negative', color: '#ef4444', emoji: '[-]' },
  }

  const ratingInfo = ratingLabels[rating] || ratingLabels.neutral

  const subject = `Sie haben eine neue ${ratingInfo.label} Bewertung erhalten`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${ratingInfo.color}; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .review-box { background-color: white; padding: 20px; border-left: 4px solid ${ratingInfo.color}; margin: 15px 0; text-align: center; }
        .rating-icon { font-size: 48px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: ${ratingInfo.color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Helvenda.ch</h1>
        </div>
        <div class="content">
          <p>Hallo ${userName},</p>
          <div class="review-box">
            <div class="rating-icon">${ratingInfo.emoji}</div>
            <h2 style="color: ${ratingInfo.color}; margin-top: 10px;">
              Neue ${ratingInfo.label} Bewertung erhalten!
            </h2>
            <p style="margin-top: 15px;">
              <strong>${reviewerName}</strong> hat Ihnen eine <strong>${ratingInfo.label}</strong> Bewertung gegeben.
            </p>
          </div>
          <p>
            Bewertungen helfen anderen Nutzern, sich ein Bild von Ihrer Zuverlässigkeit zu machen.
            Sie können alle Ihre Bewertungen in Ihrem Profil einsehen.
          </p>
          <p style="margin-top: 20px;">
            <a href="${profileUrl}" class="button">Bewertungen ansehen</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
          <p>Sie erhalten diese E-Mail, weil Sie eine neue Bewertung erhalten haben.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${userName},

Sie haben eine neue ${ratingInfo.label} Bewertung erhalten!

${reviewerName} hat Ihnen eine ${ratingInfo.label} Bewertung gegeben ${ratingInfo.emoji}

Bewertungen helfen anderen Nutzern, sich ein Bild von Ihrer Zuverlässigkeit zu machen.
Sie können alle Ihre Bewertungen in Ihrem Profil einsehen.

Bewertungen ansehen: ${profileUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Sie erhalten diese E-Mail, weil Sie eine neue Bewertung erhalten haben.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// Template für Kaufbestätigung an Käufer
export function getPurchaseConfirmationEmail(
  buyerName: string,
  sellerName: string,
  watchTitle: string,
  finalPrice: number,
  shippingCost: number,
  purchaseType: 'auction' | 'buy-now',
  purchaseId: string,
  watchId: string,
  paymentInfo?: any | null, // Zahlungsinformationen (optional)
  imageUrl?: string, // Produktbild (optional)
  sellerRating?: number, // Verkäufer-Bewertung (optional)
  sellerReviewCount?: number // Anzahl Bewertungen (optional)
) {
  const baseUrl = getEmailBaseUrl()
  const purchaseUrl = `${baseUrl}/my-watches/buying/purchased`
  const totalPrice = finalPrice + shippingCost

  const subject = `Kaufbestätigung: ${watchTitle}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .success-box { background-color: white; padding: 20px; border-left: 4px solid #0f766e; margin: 15px 0; }
        .price-box { background-color: #f0fdfa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .info-box { background-color: #fff7ed; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .button { display: inline-block; padding: 14px 28px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; font-size: 16px; }
        .button-secondary { display: inline-block; padding: 12px 24px; background-color: #64748b; color: white; text-decoration: none; border-radius: 8px; margin-top: 10px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .deadline { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Helvenda.ch</h1>
        </div>
        <div class="content">
          <p>Hallo ${buyerName},</p>
          <div class="success-box">
            <h2 style="color: #0f766e; margin-top: 0;">
              ✓ Kauf erfolgreich abgeschlossen!
            </h2>
            <p>Ihr Kauf wurde erfolgreich abgeschlossen. Sie finden alle Details und Kontaktdaten des Verkäufers unten.</p>
          </div>

          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                ${
                  imageUrl
                    ? `<td style="width: 120px; padding-right: 15px; vertical-align: top;">
                  <img src="${imageUrl}" alt="${watchTitle}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
                </td>`
                    : ''
                }
                <td style="vertical-align: top;">
                  <div style="font-size: 12px; color: #0f766e; margin-bottom: 5px;">${purchaseType === 'buy-now' ? 'Sofortkauf' : 'Auktion'}</div>
                  <div style="font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">
                    ${watchTitle}
                  </div>
                  <div style="font-size: 20px; font-weight: bold; color: #0f766e;">
                    CHF ${new Intl.NumberFormat('de-CH').format(finalPrice)}
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Verkäufer:</strong> ${sellerName}${sellerRating ? ` <span style="color: #f59e0b;">⭐ ${sellerRating.toFixed(1)}</span> <span style="color: #9ca3af; font-size: 12px;">(${sellerReviewCount || 0} Bewertungen)</span>` : ''}</p>
            <p><strong>Kaufpreis:</strong> CHF ${new Intl.NumberFormat('de-CH').format(finalPrice)}</p>
            ${shippingCost > 0 ? `<p><strong>Versandkosten:</strong> CHF ${new Intl.NumberFormat('de-CH').format(shippingCost)}</p>` : ''}
            <p style="font-size: 18px; font-weight: bold; margin-top: 10px; color: #0f766e;">
              <strong>Total:</strong> CHF ${new Intl.NumberFormat('de-CH').format(totalPrice)}
            </p>
          </div>

          ${
            paymentInfo
              ? `
          <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; border: 2px solid #0f766e; margin: 20px 0;">
            <h3 style="color: #0f766e; margin-top: 0;">💳 Zahlungsinformationen</h3>
            <p style="margin-bottom: 15px;"><strong>Empfänger:</strong> ${paymentInfo.accountHolder}</p>
            <p style="margin-bottom: 15px;"><strong>IBAN:</strong> ${paymentInfo.iban.replace(/(.{4})/g, '$1 ').trim()}</p>
            <p style="margin-bottom: 15px;"><strong>BIC:</strong> ${paymentInfo.bic}</p>
            <p style="margin-bottom: 15px;"><strong>Betrag:</strong> CHF ${new Intl.NumberFormat('de-CH').format(paymentInfo.amount)}</p>
            <p style="margin-bottom: 15px;"><strong>Referenz:</strong> ${paymentInfo.reference}</p>
            ${paymentInfo.qrCodeDataUrl ? `<p style="text-align: center; margin-top: 15px;"><img src="${paymentInfo.qrCodeDataUrl}" alt="QR-Code" style="max-width: 200px; border: 1px solid #ddd; border-radius: 8px;" /></p>` : ''}
            ${paymentInfo.twintPhone ? `<p style="margin-top: 15px;"><strong>TWINT:</strong> ${paymentInfo.twintPhone}</p>` : ''}
            <p style="margin-top: 15px; font-size: 12px; color: #666;">Bitte überweisen Sie den Betrag innerhalb von 14 Tagen nach Kontaktaufnahme. Verwenden Sie die Referenz bei der Überweisung.</p>
          </div>
          `
              : `
          <div class="info-box">
            <p style="margin-top: 0;"><strong>[!] Wichtig:</strong></p>
            <p>Sie müssen innerhalb von <span class="deadline">7 Tagen</span> nach dem Kauf mit dem Verkäufer Kontakt aufnehmen, um die Zahlungsmodalitäten oder einen Abholtermin zu vereinbaren.</p>
          </div>
          `
          }

          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin-top: 0;"><strong>Nächste Schritte:</strong></p>
            <ol style="margin-left: 20px; margin-top: 10px;">
              ${
                paymentInfo
                  ? `
              <li>Überweisen Sie den Betrag innerhalb von 14 Tagen nach Kontaktaufnahme auf das oben angegebene Konto</li>
              <li>Verwenden Sie die Referenz bei der Überweisung</li>
              <li>Alternativ können Sie den QR-Code mit Ihrer Banking-App scannen</li>
              `
                  : `
              <li>Klicken Sie auf "Jetzt Artikel bezahlen" um die Kontaktdaten des Verkäufers zu sehen</li>
              <li>Nehmen Sie Kontakt mit dem Verkäufer auf (E-Mail oder Telefon)</li>
              <li>Vereinbaren Sie die Zahlung oder einen Abholtermin</li>
              `
              }
              <li>Bestätigen Sie den Erhalt des Artikels nach Lieferung</li>
            </ol>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${purchaseUrl}" class="button">Jetzt Artikel bezahlen</a>
          </p>
          <p style="text-align: center;">
            <a href="${purchaseUrl}" class="button-secondary">Zu meinen Käufen</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
          <p>Sie erhalten diese E-Mail, weil Sie erfolgreich ein Produkt gekauft haben.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${buyerName},

✓ Kauf erfolgreich abgeschlossen!

Gekauftes Produkt: ${watchTitle}
Verkäufer: ${sellerName}
Kaufpreis: CHF ${new Intl.NumberFormat('de-CH').format(finalPrice)}
${shippingCost > 0 ? `Versandkosten: CHF ${new Intl.NumberFormat('de-CH').format(shippingCost)}\n` : ''}Total: CHF ${new Intl.NumberFormat('de-CH').format(totalPrice)}
Art: ${purchaseType === 'buy-now' ? 'Sofortkauf' : 'Auktion'}

${
  paymentInfo
    ? `
[!] ZAHLUNGSINFORMATIONEN:
Empfänger: ${paymentInfo.accountHolder}
IBAN: ${paymentInfo.iban.replace(/(.{4})/g, '$1 ').trim()}
BIC: ${paymentInfo.bic}
Betrag: CHF ${new Intl.NumberFormat('de-CH').format(paymentInfo.amount)}
Referenz: ${paymentInfo.reference}

Bitte überweisen Sie den Betrag innerhalb von 14 Tagen nach Kontaktaufnahme auf das oben angegebene Konto.
Verwenden Sie die Referenz bei der Überweisung, damit die Zahlung zugeordnet werden kann.
Alternativ können Sie den QR-Code mit Ihrer Banking-App scannen.
`
    : `
[!] WICHTIG:
Sie müssen innerhalb von 7 Tagen nach dem Kauf mit dem Verkäufer Kontakt aufnehmen, um die Zahlungsmodalitäten oder einen Abholtermin zu vereinbaren.

Nächste Schritte:
1. Gehen Sie zu "Mein Kaufen" > "Gekauft" um die Kontaktdaten des Verkäufers zu sehen
2. Nehmen Sie Kontakt mit dem Verkäufer auf (E-Mail oder Telefon)
3. Vereinbaren Sie die Zahlung oder einen Abholtermin
4. Bestätigen Sie den Erhalt des Artikels nach Lieferung
`
}

Jetzt Artikel bezahlen: ${purchaseUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Sie erhalten diese E-Mail, weil Sie erfolgreich ein Produkt gekauft haben.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// Template für Rechnungs-Benachrichtigung
export function getInvoiceNotificationEmail(
  userName: string,
  invoiceNumber: string,
  invoiceTotal: number,
  invoiceItems: Array<{ description: string; quantity: number; price: number; total: number }>,
  dueDate: Date,
  invoiceId: string
) {
  const baseUrl = getEmailBaseUrl()
  const invoicesUrl = `${baseUrl}/my-watches/selling/fees`

  const subject = `Neue Rechnung: ${invoiceNumber}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .invoice-box { background-color: white; padding: 20px; border-left: 4px solid #0f766e; margin: 15px 0; }
        .total-box { background-color: #f0fdfa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items-table th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        .items-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .warning-box { background-color: #fff7ed; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .button { display: inline-block; padding: 14px 28px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold; font-size: 16px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .deadline { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Helvenda.ch</h1>
        </div>
        <div class="content">
          <p>Hallo ${userName},</p>
          <div class="invoice-box">
            <h2 style="color: #0f766e; margin-top: 0;">
              [Rechnung] Neue Rechnung erstellt
            </h2>
            <p>Eine neue Rechnung wurde für Sie erstellt. Sie können die Rechnung in Ihrem Gebühren-Bereich einsehen und herunterladen.</p>
          </div>

          <div class="total-box">
            <div style="font-size: 12px; color: #0f766e; margin-bottom: 5px;">Rechnungsnummer</div>
            <div style="font-size: 20px; font-weight: bold; color: #047857; margin: 10px 0;">
              ${invoiceNumber}
            </div>
            <div style="font-size: 24px; font-weight: bold; margin-top: 15px; color: #0f766e;">
              CHF ${new Intl.NumberFormat('de-CH').format(invoiceTotal)}
            </div>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Rechnungsposten:</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Beschreibung</th>
                  <th style="text-align: right;">Menge</th>
                  <th style="text-align: right;">Preis</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceItems
                  .map(
                    item => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: right;">${item.quantity}</td>
                    <td style="text-align: right;">CHF ${new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.price)}</td>
                    <td style="text-align: right; font-weight: bold;">CHF ${new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.total)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <div class="warning-box">
            <p style="margin-top: 0;"><strong>[!] Fälligkeitsdatum:</strong></p>
            <p>Diese Rechnung ist fällig bis zum <span class="deadline">${new Date(dueDate).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>.</p>
            <p style="margin-top: 10px;">Bitte stellen Sie sicher, dass die Zahlung bis zu diesem Datum eingegangen ist.</p>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin-top: 0;"><strong>Hinweis:</strong></p>
            <p>Diese Rechnung enthält keine Rechnung im Anhang. Sie können die Rechnung jederzeit in Ihrem Gebühren-Bereich einsehen und als PDF herunterladen.</p>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${invoicesUrl}" class="button">Zu meinen Rechnungen</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
          <p>Sie erhalten diese E-Mail, weil eine neue Rechnung für Sie erstellt wurde.</p>
          <p>Sie können Ihre E-Mail-Benachrichtigungen in Ihren Kontoeinstellungen verwalten.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${userName},

[Rechnung] Neue Rechnung erstellt

Eine neue Rechnung wurde für Sie erstellt. Sie können die Rechnung in Ihrem Gebühren-Bereich einsehen und herunterladen.

Rechnungsnummer: ${invoiceNumber}
Total: CHF ${new Intl.NumberFormat('de-CH').format(invoiceTotal)}
Fälligkeitsdatum: ${new Date(dueDate).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}

Rechnungsposten:
${invoiceItems.map(item => `- ${item.description}: ${item.quantity}x CHF ${item.price.toFixed(2)} = CHF ${item.total.toFixed(2)}`).join('\n')}

[!] WICHTIG:
Diese Rechnung ist fällig bis zum ${new Date(dueDate).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}.
Bitte stellen Sie sicher, dass die Zahlung bis zu diesem Datum eingegangen ist.

Hinweis: Diese Rechnung enthält keine Rechnung im Anhang. Sie können die Rechnung jederzeit in Ihrem Gebühren-Bereich einsehen und als PDF herunterladen.

Zu meinen Rechnungen: ${invoicesUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Sie erhalten diese E-Mail, weil eine neue Rechnung für Sie erstellt wurde.
Sie können Ihre E-Mail-Benachrichtigungen in Ihren Kontoeinstellungen verwalten.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// Funktion zum Versenden einer Bewertungs-Benachrichtigung
export async function sendReviewNotificationEmail(
  userEmail: string,
  userName: string,
  rating: 'positive' | 'neutral' | 'negative',
  reviewerName: string
) {
  const emailContent = getReviewNotificationEmail(userName, rating, reviewerName)
  return await sendEmail({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  })
}

// Funktion zum Versenden einer Rechnungs-Benachrichtigung
export async function sendInvoiceNotificationEmail(
  userEmail: string,
  userName: string,
  invoiceNumber: string,
  invoiceTotal: number,
  invoiceItems: Array<{ description: string; quantity: number; price: number; total: number }>,
  dueDate: Date,
  invoiceId: string
) {
  const emailContent = getInvoiceNotificationEmail(
    userName,
    invoiceNumber,
    invoiceTotal,
    invoiceItems,
    dueDate,
    invoiceId
  )
  return await sendEmail({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  })
}

// Template für Kontaktfrist-Warnung (5 Tage vor Ablauf)
export function getContactDeadlineWarningEmail(
  userName: string,
  otherPartyName: string,
  productTitle: string,
  daysRemaining: number,
  role: 'seller' | 'buyer'
) {
  const subject = `[!] Kontaktfrist läuft ab - ${productTitle}`

  const roleText =
    role === 'seller'
      ? 'Als Verkäufer müssen Sie den Käufer innerhalb von 7 Tagen kontaktieren'
      : 'Als Käufer müssen Sie den Verkäufer innerhalb von 7 Tagen kontaktieren'

  const actionText =
    role === 'seller'
      ? 'Bitte kontaktieren Sie den Käufer umgehend, um Zahlungs- und Liefermodalitäten zu klären.'
      : 'Bitte kontaktieren Sie den Verkäufer umgehend, um Zahlungsdetails zu erhalten.'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[!] Kontaktfrist läuft ab</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>Wichtig:</strong> Die Kontaktfrist für den Kauf von "${productTitle}" läuft in ${daysRemaining} Tag(en) ab.
      </div>

      <p>${roleText}.</p>

      <p>${actionText}</p>

      <p><strong>Andere Partei:</strong> ${otherPartyName}</p>

      <p><strong>Artikel:</strong> ${productTitle}</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}${role === 'seller' ? '/my-watches/selling/sold' : '/my-watches/buying/purchased'}" class="button">
          Jetzt kontaktieren →
        </a>
      </p>

      <p style="color: #dc2626; font-weight: bold;">
        [!] Wenn Sie die Frist nicht einhalten, kann die andere Partei den Kauf stornieren.
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
      <p>Sie erhalten diese E-Mail, weil die Kontaktfrist für einen Ihrer Käufe/Verkäufe abläuft.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
[!] Kontaktfrist läuft ab - ${productTitle}

Hallo ${userName},

WICHTIG: Die Kontaktfrist für den Kauf von "${productTitle}" läuft in ${daysRemaining} Tag(en) ab.

${roleText}.

${actionText}

Andere Partei: ${otherPartyName}
Artikel: ${productTitle}

Jetzt kontaktieren: ${getEmailBaseUrl()}${role === 'seller' ? '/my-watches/selling/sold' : '/my-watches/buying/purchased'}

[!] Wenn Sie die Frist nicht einhalten, kann die andere Partei den Kauf stornieren.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Sie erhalten diese E-Mail, weil die Kontaktfrist für einen Ihrer Käufe/Verkäufe abläuft.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// Template für Zahlungserinnerung
export function getPaymentReminderEmail(
  buyerName: string,
  sellerName: string,
  productTitle: string,
  daysRemaining: number,
  purchaseId: string
) {
  const subject = `[!] Zahlungserinnerung - ${productTitle}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[!] Zahlungserinnerung</h1>
    </div>
    <div class="content">
      <p>Hallo ${buyerName},</p>

      <div class="warning">
        <strong>Wichtig:</strong> Sie haben noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} Zeit, um für "${productTitle}" zu zahlen.
      </div>

      <p>Bitte überweisen Sie den Betrag innerhalb der nächsten ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} auf das Konto des Verkäufers.</p>

      <p><strong>Verkäufer:</strong> ${sellerName}</p>
      <p><strong>Artikel:</strong> ${productTitle}</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/buying/purchased" class="button">
          Zahlungsinformationen ansehen →
        </a>
      </p>

      <p style="color: #dc2626; font-weight: bold;">
        [!] Wenn Sie nicht innerhalb von 14 Tagen zahlen, kann der Verkäufer den Kauf stornieren.
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
      <p>Sie erhalten diese E-Mail, weil die Zahlungsfrist für einen Ihrer Käufe abläuft.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
[!] Zahlungserinnerung - ${productTitle}

Hallo ${buyerName},

WICHTIG: Sie haben noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} Zeit, um für "${productTitle}" zu zahlen.

Bitte überweisen Sie den Betrag innerhalb der nächsten ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''} auf das Konto des Verkäufers.

Verkäufer: ${sellerName}
Artikel: ${productTitle}

Zahlungsinformationen ansehen: ${getEmailBaseUrl()}/my-watches/buying/purchased

[!] Wenn Sie nicht innerhalb von 14 Tagen zahlen, kann der Verkäufer den Kauf stornieren.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Sie erhalten diese E-Mail, weil die Zahlungsfrist für einen Ihrer Käufe abläuft.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// Template für Dispute-Eröffnung
export function getDisputeOpenedEmail(
  userName: string,
  openerName: string,
  productTitle: string,
  reason: string,
  description: string,
  role: 'buyer' | 'seller'
) {
  const subject = `[!] Dispute eröffnet - ${productTitle}`

  const roleText =
    role === 'seller'
      ? 'Der Käufer hat einen Dispute eröffnet'
      : 'Der Verkäufer hat einen Dispute eröffnet'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>[!] Dispute eröffnet</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>Wichtig:</strong> ${roleText} für "${productTitle}".
      </div>

      <p><strong>Grund:</strong> ${reason}</p>
      <p><strong>Beschreibung:</strong> ${description}</p>

      <p>Ein Admin wird sich in Kürze um diesen Dispute kümmern und eine Lösung finden.</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/${role === 'seller' ? 'selling/sold' : 'buying/purchased'}" class="button">
          Details ansehen →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
[!] Dispute eröffnet - ${productTitle}

Hallo ${userName},

WICHTIG: ${roleText} für "${productTitle}".

Grund: ${reason}
Beschreibung: ${description}

Ein Admin wird sich in Kürze um diesen Dispute kümmern und eine Lösung finden.

Details ansehen: ${getEmailBaseUrl()}/my-watches/${role === 'seller' ? 'selling/sold' : 'buying/purchased'}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === RICARDO-STYLE: Verbesserte Dispute-Email mit Antwortfrist ===
export function getDisputeOpenedEmailRicardoStyle(
  userName: string,
  openerName: string,
  productTitle: string,
  reason: string,
  description: string,
  role: 'buyer' | 'seller',
  responseDeadline: Date | null,
  purchaseId: string
) {
  const isSeller = role === 'seller'
  const subject = isSeller
    ? `🚨 DRINGEND: Dispute eröffnet - Stellungnahme erforderlich`
    : `⚠️ Dispute eröffnet - ${productTitle}`

  const roleText = isSeller
    ? 'Der Käufer hat einen Dispute eröffnet'
    : 'Der Verkäufer hat einen Dispute eröffnet'

  const reasonLabels: Record<string, string> = {
    item_not_received: 'Artikel nicht erhalten',
    item_damaged: 'Artikel beschädigt',
    item_wrong: 'Falscher Artikel geliefert',
    item_not_as_described: 'Artikel entspricht nicht der Beschreibung',
    payment_not_confirmed: 'Zahlung nicht bestätigt',
    payment_not_received: 'Zahlung nicht erhalten',
    seller_not_responding: 'Verkäufer antwortet nicht',
    buyer_not_responding: 'Käufer antwortet nicht',
    buyer_not_paying: 'Käufer zahlt nicht',
    other: 'Sonstiges',
  }
  const reasonLabel = reasonLabels[reason] || reason

  const deadlineDate = responseDeadline
    ? responseDeadline.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null

  const urgentBox =
    isSeller && deadlineDate
      ? `
      <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="color: #b45309; margin: 0 0 10px 0;">⏰ Ihre Stellungnahme ist erforderlich</h3>
        <p style="margin: 0; color: #92400e;">
          <strong>Frist:</strong> ${deadlineDate}<br/>
          Bitte nehmen Sie bis zu diesem Datum Stellung. Ohne Ihre Antwort wird der Fall automatisch eskaliert
          und möglicherweise zugunsten des Käufers entschieden.
        </p>
      </div>
    `
      : ''

  const actionLink = isSeller
    ? `${getEmailBaseUrl()}/disputes/${purchaseId}`
    : `${getEmailBaseUrl()}/my-watches/buying/purchased`

  const actionText = isSeller ? 'Jetzt Stellung nehmen' : 'Details ansehen'

  const consequencesBox = isSeller
    ? `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>⚠️ Mögliche Konsequenzen bei Nichtreaktion:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #991b1b;">
          <li>Automatische Eskalation des Falls</li>
          <li>Entscheidung möglicherweise zugunsten des Käufers</li>
          <li>Verwarnung auf Ihrem Konto</li>
          <li>Bei wiederholtem Verhalten: Einschränkungen oder Sperrung</li>
        </ul>
      </div>
    `
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isSeller ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 8px; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isSeller ? '🚨 Dringend: Stellungnahme erforderlich' : '⚠️ Dispute eröffnet'}</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>Wichtig:</strong> ${roleText} für den Artikel "<strong>${productTitle}</strong>".
      </div>

      ${urgentBox}

      <div class="info-box">
        <p style="margin: 0;"><strong>Grund des Disputes:</strong> ${reasonLabel}</p>
        <p style="margin: 10px 0 0 0;"><strong>Beschreibung:</strong></p>
        <p style="margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 4px;">${description}</p>
      </div>

      ${consequencesBox}

      <p style="margin-top: 20px;">
        ${
          isSeller
            ? 'Bitte klicken Sie auf den Button unten, um zur Dispute-Seite zu gelangen und Ihre Stellungnahme abzugeben.'
            : 'Ein Helvenda-Mitarbeiter wird sich um Ihren Fall kümmern und Sie über das Ergebnis informieren.'
        }
      </p>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${actionLink}" class="button">
          ${actionText} →
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Bei Fragen können Sie uns jederzeit über das Kontaktformular erreichen.
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
      <p style="color: #9ca3af;">Dispute-ID: ${purchaseId}</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
${isSeller ? '🚨 DRINGEND: Dispute eröffnet - Stellungnahme erforderlich' : '⚠️ Dispute eröffnet'} - ${productTitle}

Hallo ${userName},

WICHTIG: ${roleText} für "${productTitle}".

${
  isSeller && deadlineDate
    ? `⏰ IHRE STELLUNGNAHME IST ERFORDERLICH
Frist: ${deadlineDate}
Bitte nehmen Sie bis zu diesem Datum Stellung. Ohne Ihre Antwort wird der Fall automatisch eskaliert.

`
    : ''
}Grund des Disputes: ${reasonLabel}
Beschreibung: ${description}

${
  isSeller
    ? `⚠️ Mögliche Konsequenzen bei Nichtreaktion:
- Automatische Eskalation des Falls
- Entscheidung möglicherweise zugunsten des Käufers
- Verwarnung auf Ihrem Konto
- Bei wiederholtem Verhalten: Einschränkungen oder Sperrung

`
    : ''
}${actionText}: ${actionLink}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
Dispute-ID: ${purchaseId}
  `.trim()

  return { subject, html, text }
}

// === RICARDO-STYLE: Email für Rückerstattungs-Anforderung ===
export function getRefundRequiredEmail(
  sellerName: string,
  buyerName: string,
  productTitle: string,
  refundAmount: number,
  refundDeadline: Date,
  purchaseId: string,
  adminNote?: string
) {
  const deadlineDate = refundDeadline.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const subject = `🔔 Rückerstattung erforderlich - CHF ${refundAmount.toFixed(2)}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .amount-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .amount { font-size: 28px; font-weight: bold; color: #b45309; }
    .deadline-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Rückerstattung erforderlich</h1>
    </div>
    <div class="content">
      <p>Hallo ${sellerName},</p>

      <p>Nach Prüfung des Disputes für "<strong>${productTitle}</strong>" wurde entschieden, dass eine Rückerstattung an ${buyerName} erforderlich ist.</p>

      <div class="amount-box">
        <p style="margin: 0; color: #92400e;">Zu erstattender Betrag:</p>
        <p class="amount">CHF ${refundAmount.toFixed(2)}</p>
      </div>

      <div class="deadline-box">
        <strong>⏰ Frist für Rückerstattung: ${deadlineDate}</strong>
        <p style="margin: 10px 0 0 0;">
          Bitte erstatten Sie den Betrag bis zu diesem Datum. Bei Nichteinhaltung der Frist
          können Maßnahmen gegen Ihr Konto ergriffen werden.
        </p>
      </div>

      ${
        adminNote
          ? `
      <div style="background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 8px;">
        <strong>Hinweis vom Admin:</strong>
        <p style="margin: 5px 0 0 0;">${adminNote}</p>
      </div>
      `
          : ''
      }

      <h3>So können Sie die Rückerstattung vornehmen:</h3>
      <ol>
        <li>Überweisen Sie den Betrag an den Käufer</li>
        <li>Bestätigen Sie die Rückerstattung in Ihrem Helvenda-Konto</li>
        <li>Laden Sie ggf. einen Beleg hoch</li>
      </ol>

      <p style="text-align: center; margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/disputes/${purchaseId}" class="button">
          Rückerstattung verwalten →
        </a>
      </p>

      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>⚠️ Bei Nichteinhaltung:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Verwarnung auf Ihrem Verkäuferkonto</li>
          <li>Mögliche Einschränkung Ihrer Verkaufsaktivitäten</li>
          <li>Bei wiederholtem Verstoß: Kontosperrung</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
💰 Rückerstattung erforderlich - CHF ${refundAmount.toFixed(2)}

Hallo ${sellerName},

Nach Prüfung des Disputes für "${productTitle}" wurde entschieden, dass eine Rückerstattung an ${buyerName} erforderlich ist.

Zu erstattender Betrag: CHF ${refundAmount.toFixed(2)}

⏰ FRIST: ${deadlineDate}
Bitte erstatten Sie den Betrag bis zu diesem Datum.

${adminNote ? `Hinweis vom Admin: ${adminNote}\n` : ''}
So können Sie die Rückerstattung vornehmen:
1. Überweisen Sie den Betrag an den Käufer
2. Bestätigen Sie die Rückerstattung in Ihrem Helvenda-Konto
3. Laden Sie ggf. einen Beleg hoch

Rückerstattung verwalten: ${getEmailBaseUrl()}/disputes/${purchaseId}

⚠️ Bei Nichteinhaltung:
- Verwarnung auf Ihrem Verkäuferkonto
- Mögliche Einschränkung Ihrer Verkaufsaktivitäten
- Bei wiederholtem Verstoß: Kontosperrung

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === RICARDO-STYLE: Email für Eskalation ===
export function getDisputeEscalatedEmail(
  userName: string,
  productTitle: string,
  escalationReason: string,
  purchaseId: string,
  role: 'buyer' | 'seller'
) {
  const isSeller = role === 'seller'
  const subject = isSeller
    ? `🚨 Dispute eskaliert - Dringende Aktion erforderlich`
    : `ℹ️ Dispute eskaliert - ${productTitle}`

  const escalationReasonLabels: Record<string, string> = {
    no_seller_response: 'Keine Stellungnahme des Verkäufers',
    deadline_missed: 'Frist überschritten',
    repeated_issues: 'Wiederholte Probleme',
    fraud_suspicion: 'Betrugsverdacht',
  }
  const reasonLabel = escalationReasonLabels[escalationReason] || escalationReason

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7c2d12; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Dispute Eskaliert</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="warning">
        <strong>Der Dispute für "${productTitle}" wurde eskaliert.</strong>
        <p style="margin: 10px 0 0 0;"><strong>Grund:</strong> ${reasonLabel}</p>
      </div>

      ${
        isSeller
          ? `
      <p>
        Da keine rechtzeitige Stellungnahme erfolgte, wird der Fall nun mit höherer Priorität bearbeitet.
        <strong>Eine Entscheidung zugunsten des Käufers ist wahrscheinlich.</strong>
      </p>

      <p>Sie können immer noch eine Stellungnahme abgeben, aber die Zeit ist begrenzt.</p>
      `
          : `
      <p>
        Ihr Fall wird nun mit höherer Priorität bearbeitet. Ein Helvenda-Mitarbeiter wird sich
        umgehend um Ihren Fall kümmern und eine Entscheidung treffen.
      </p>
      `
      }

      <p style="text-align: center; margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/disputes/${purchaseId}" class="button">
          Dispute ansehen →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
🚨 Dispute Eskaliert - ${productTitle}

Hallo ${userName},

Der Dispute für "${productTitle}" wurde eskaliert.
Grund: ${reasonLabel}

${
  isSeller
    ? 'Da keine rechtzeitige Stellungnahme erfolgte, wird der Fall nun mit höherer Priorität bearbeitet. Eine Entscheidung zugunsten des Käufers ist wahrscheinlich.'
    : 'Ihr Fall wird nun mit höherer Priorität bearbeitet. Ein Helvenda-Mitarbeiter wird sich umgehend um Ihren Fall kümmern.'
}

Dispute ansehen: ${getEmailBaseUrl()}/disputes/${purchaseId}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === RICARDO-STYLE: Email für Verkäufer-Warnung ===
export function getSellerWarningEmail(
  sellerName: string,
  warningCount: number,
  reason: string,
  productTitle: string,
  purchaseId: string
) {
  const subject = `⚠️ Warnung #${warningCount} auf Ihrem Verkäuferkonto`
  const maxWarnings = 3

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning-count { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .count { font-size: 48px; font-weight: bold; color: #dc2626; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Verwarnung</h1>
    </div>
    <div class="content">
      <p>Hallo ${sellerName},</p>

      <p>Aufgrund des folgenden Vorfalls wurde eine Warnung auf Ihrem Verkäuferkonto vermerkt:</p>

      <div style="background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 8px;">
        <p style="margin: 0;"><strong>Artikel:</strong> ${productTitle}</p>
        <p style="margin: 10px 0 0 0;"><strong>Grund:</strong> ${reason}</p>
      </div>

      <div class="warning-count">
        <p style="margin: 0; color: #991b1b;">Warnungen auf Ihrem Konto:</p>
        <p class="count">${warningCount} / ${maxWarnings}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #991b1b;">
          Bei ${maxWarnings} Warnungen wird Ihr Konto eingeschränkt oder gesperrt.
        </p>
      </div>

      <h3>Was das für Sie bedeutet:</h3>
      <ul>
        <li>Diese Warnung bleibt 12 Monate auf Ihrem Konto</li>
        <li>Weitere Verstöße führen zu zusätzlichen Warnungen</li>
        <li>Bei ${maxWarnings} Warnungen: Verkaufseinschränkungen oder Kontosperrung</li>
      </ul>

      <p>Wir empfehlen Ihnen, unsere Verkäuferrichtlinien erneut zu lesen und bei zukünftigen Transaktionen sorgfältiger vorzugehen.</p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
⚠️ Verwarnung #${warningCount} auf Ihrem Verkäuferkonto

Hallo ${sellerName},

Aufgrund des folgenden Vorfalls wurde eine Warnung auf Ihrem Verkäuferkonto vermerkt:

Artikel: ${productTitle}
Grund: ${reason}

Warnungen auf Ihrem Konto: ${warningCount} / ${maxWarnings}
Bei ${maxWarnings} Warnungen wird Ihr Konto eingeschränkt oder gesperrt.

Was das für Sie bedeutet:
- Diese Warnung bleibt 12 Monate auf Ihrem Konto
- Weitere Verstöße führen zu zusätzlichen Warnungen
- Bei ${maxWarnings} Warnungen: Verkaufseinschränkungen oder Kontosperrung

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// Template für Dispute-Lösung
export function getDisputeResolvedEmail(
  userName: string,
  otherPartyName: string,
  productTitle: string,
  resolution: string,
  role: 'buyer' | 'seller',
  perspective: 'initiator' | 'loser' = 'initiator',
  articleRelisted: boolean = false
) {
  const isSuccess = perspective === 'initiator'
  const subject = isSuccess
    ? `✅ Dispute erfolgreich gelöst - ${productTitle}`
    : `⚠️ Dispute gelöst - ${productTitle}`

  const headerBg = isSuccess ? '#0f766e' : '#f59e0b'
  const boxColor = isSuccess ? '#f0fdfa' : '#fef3c7'
  const boxBorder = isSuccess ? '#0f766e' : '#f59e0b'

  // Zusätzliche Information über Wiederaktivierung des Artikels
  const relistInfo = articleRelisted
    ? `
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>ℹ️ Wichtige Information:</strong> Der Artikel "${productTitle}" steht automatisch wieder als aktiver Artikel zum Verkauf.
      </div>
  `
    : ''

  const relistInfoText = articleRelisted
    ? `
Wichtige Information: Der Artikel "${productTitle}" steht automatisch wieder als aktiver Artikel zum Verkauf.
`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${headerBg}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: ${boxColor}; border-left: 4px solid ${boxBorder}; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: ${headerBg}; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isSuccess ? '✅ Dispute erfolgreich gelöst' : '⚠️ Dispute gelöst'}</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="info-box">
        <strong>${isSuccess ? 'Gut zu wissen:' : 'Wichtige Information:'}</strong> Der Dispute für "${productTitle}" wurde gelöst.
      </div>

      <p><strong>${isSuccess ? 'Lösung:' : 'Entscheidung:'}</strong> ${resolution}</p>

      ${relistInfo}

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches/${role === 'seller' ? 'selling/sold' : 'buying/purchased'}" class="button">
          Details ansehen →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
${isSuccess ? '✅ Dispute erfolgreich gelöst' : '⚠️ Dispute gelöst'} - ${productTitle}

Hallo ${userName},

Der Dispute für "${productTitle}" wurde gelöst.

${isSuccess ? 'Lösung:' : 'Entscheidung:'} ${resolution}

${relistInfoText}
Details ansehen: ${getEmailBaseUrl()}/my-watches/${role === 'seller' ? 'selling/sold' : 'buying/purchased'}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

/**
 * E-Mail-Template für abgelehnte Disputes
 */
export function getDisputeRejectedEmail(
  userName: string,
  productTitle: string,
  rejectionReason: string
) {
  const subject = `❌ Dispute abgelehnt - ${productTitle}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #dc2626; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Dispute abgelehnt</h1>
    </div>
    <div class="content">
      <p>Hallo ${userName},</p>

      <div class="info-box">
        <strong>Leider:</strong> Ihr Dispute für "${productTitle}" wurde abgelehnt.
      </div>

      <p><strong>Ablehnungsgrund:</strong> ${rejectionReason}</p>

      <p>Falls Sie Fragen haben, können Sie sich gerne an unseren Support wenden.</p>

      <p style="margin-top: 30px;">
        <a href="${getEmailBaseUrl()}/my-watches" class="button">
          Zu meinen Angeboten →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
❌ Dispute abgelehnt - ${productTitle}

Hallo ${userName},

Ihr Dispute für "${productTitle}" wurde abgelehnt.

Ablehnungsgrund: ${rejectionReason}

Falls Sie Fragen haben, können Sie sich gerne an unseren Support wenden.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für erste Zahlungsaufforderung (Tag 14)

// Template für erste Erinnerung (Tag 30)

// Template für zweite Erinnerung mit Mahnspesen (Tag 44)

// Template für letzte Erinnerung mit Konto-Sperre (Tag 58)

// ============================================================================
// NEUE E-MAIL-TEMPLATES FÜR FEHLENDE BENACHRICHTIGUNGEN
// ============================================================================

// Hilfsfunktion für Helvenda E-Mail-Template (gemeinsames Design)
export function getHelvendaEmailTemplate(
  title: string,
  greeting: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string
): string {
  const baseUrl = getEmailBaseUrl()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      background-color: #f3f4f6;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 40px 30px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo-section {
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
    }
    .logo-icon svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .logo-text {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }
    .logo-text-main {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      line-height: 1;
    }
    .logo-text-domain {
      font-size: 14px;
      color: #6b7280;
      line-height: 1;
      font-weight: 400;
    }
    .header-subtitle {
      font-size: 14px;
      color: #6b7280;
      font-weight: 400;
      margin-top: 8px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .description {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 40px;
      line-height: 1.6;
      text-align: left;
    }
    .button-container {
      margin: 40px 0;
    }
    .button {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.5);
      background-color: #0d9488;
      color: #ffffff !important;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .footer-link {
      color: #0f766e;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .support-text {
      margin-top: 30px;
      font-size: 14px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .support-link {
      color: #0f766e;
      text-decoration: none;
    }
    .support-link:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .title {
        font-size: 22px;
      }
      .description {
        font-size: 15px;
      }
      .button {
        padding: 14px 32px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#0f766e"/>
              <path
                d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28"
                stroke="white"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-text-main" style="color: #111827; font-size: 24px; font-weight: 700;">Helvenda</span>
            <span class="logo-text-domain" style="color: #6b7280; font-size: 14px;">.ch</span>
          </div>
        </div>
        <p class="header-subtitle" style="font-size: 14px; color: #6b7280; font-weight: 400; margin-top: 8px;">Schweizer Online-Marktplatz</p>
      </div>

      <div class="content">
        <p class="greeting">${greeting}</p>

        <h2 class="title">${title}</h2>

        <div class="description">
          ${content}
        </div>

        ${
          buttonText && buttonUrl
            ? `
        <div class="button-container">
          <a href="${buttonUrl}" class="button" style="color: #ffffff !important; background-color: #0f766e; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600; font-size: 16px; display: inline-block;">${buttonText}</a>
        </div>
        `
            : ''
        }

        <p class="support-text">
          Falls Sie Fragen haben, kontaktieren Sie uns bitte unter <a href="mailto:support@helvenda.ch" class="support-link">support@helvenda.ch</a>.
        </p>
      </div>

      <div class="footer">
        <p class="footer-text">
          Diese E-Mail wurde automatisch von <a href="${baseUrl}" class="footer-link">Helvenda.ch</a> gesendet.
        </p>
        <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
          Helvenda - Ihr vertrauensvoller Marktplatz für den Kauf und Verkauf von Artikeln in der Schweiz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

// Template für Gebotsbestätigung (für Käufer nach Gebot)
export function getBidConfirmationEmail(
  buyerName: string,
  articleTitle: string,
  bidAmount: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Gebotsbestätigung - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Gebotsbestätigung`,
    `Hallo ${buyerName},`,
    `
      <p>Ihr Gebot wurde erfolgreich abgegeben!</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Ihr Gebot:</strong> CHF ${bidAmount.toFixed(2)}
        </p>
      </div>

      <p>Sie werden per E-Mail benachrichtigt, wenn Sie überboten werden oder wenn die Auktion endet.</p>
    `,
    'Artikel ansehen',
    articleUrl
  )

  const text = `
Gebotsbestätigung - ${articleTitle}

Hallo ${buyerName},

Ihr Gebot wurde erfolgreich abgegeben!

Artikel: ${articleTitle}
Ihr Gebot: CHF ${bidAmount.toFixed(2)}

Sie werden per E-Mail benachrichtigt, wenn Sie überboten werden oder wenn die Auktion endet.

Artikel ansehen: ${articleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Neue E-Mail-Templates - werden in email.ts integriert

// Template für Überboten-Benachrichtigung (für Käufer)
export function getOutbidNotificationEmail(
  buyerName: string,
  articleTitle: string,
  currentHighestBid: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Sie wurden überboten - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Sie wurden überboten`,
    `Hallo ${buyerName},`,
    `
      <p>Ein anderes Mitglied hat ein höheres Gebot auf den Artikel abgegeben:</p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Aktuelles Höchstgebot:</strong> CHF ${currentHighestBid.toFixed(2)}
        </p>
      </div>

      <p>Sie können jetzt ein neues, höheres Gebot abgeben, um Ihre Chance zu erhöhen, diesen Artikel zu gewinnen.</p>
    `,
    'Jetzt höher bieten',
    articleUrl
  )

  const text = `
Sie wurden überboten - ${articleTitle}

Hallo ${buyerName},

Ein anderes Mitglied hat ein höheres Gebot auf den Artikel abgegeben:

Artikel: ${articleTitle}
Aktuelles Höchstgebot: CHF ${currentHighestBid.toFixed(2)}

Sie können jetzt ein neues, höheres Gebot abgeben, um Ihre Chance zu erhöhen, diesen Artikel zu gewinnen.

Jetzt höher bieten: ${articleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Gebotsbenachrichtigung (für Verkäufer)
export function getBidNotificationEmail(
  sellerName: string,
  articleTitle: string,
  bidAmount: number,
  bidderName: string,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Neues Gebot auf ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Neues Gebot erhalten`,
    `Hallo ${sellerName},`,
    `
      <p>Es wurde ein neues Gebot auf Ihren Artikel abgegeben:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Gebot:</strong> CHF ${bidAmount.toFixed(2)}<br>
          <strong>Bieter:</strong> ${bidderName}
        </p>
      </div>

      <p>Sie werden weiterhin über neue Gebote informiert.</p>
    `,
    'Artikel ansehen',
    articleUrl
  )

  const text = `
Neues Gebot auf ${articleTitle}

Hallo ${sellerName},

Es wurde ein neues Gebot auf Ihren Artikel abgegeben:

Artikel: ${articleTitle}
Gebot: CHF ${bidAmount.toFixed(2)}
Bieter: ${bidderName}

Sie werden weiterhin über neue Gebote informiert.

Artikel ansehen: ${articleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Auktionsende-Benachrichtigung (für Käufer - gewonnen)
export function getAuctionEndWonEmail(
  buyerName: string,
  articleTitle: string,
  winningBid: number,
  watchId: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const purchaseUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `✓ Glückwunsch! Sie haben gewonnen - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Glückwunsch! Sie haben gewonnen`,
    `Hallo ${buyerName},`,
    `
      <p>Herzlichen Glückwunsch! Sie haben die Auktion gewonnen:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Ihr Gewinngebot:</strong> CHF ${winningBid.toFixed(2)}
        </p>
      </div>

      <p>Bitte kontaktieren Sie den Verkäufer innerhalb von 7 Tagen und begleichen Sie die Zahlung innerhalb von 14 Tagen nach Kontaktaufnahme.</p>
    `,
    'Kauf ansehen',
    purchaseUrl
  )

  const text = `
✓ Glückwunsch! Sie haben gewonnen - ${articleTitle}

Hallo ${buyerName},

Herzlichen Glückwunsch! Sie haben die Auktion gewonnen:

Artikel: ${articleTitle}
Ihr Gewinngebot: CHF ${winningBid.toFixed(2)}

Bitte kontaktieren Sie den Verkäufer innerhalb von 7 Tagen und begleichen Sie die Zahlung innerhalb von 14 Tagen nach Kontaktaufnahme.

Kauf ansehen: ${purchaseUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Auktionsende-Benachrichtigung (für Käufer - nicht gewonnen)
export function getAuctionEndLostEmail(
  buyerName: string,
  articleTitle: string,
  winningBid: number,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const subject = `Auktion beendet - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Auktion beendet`,
    `Hallo ${buyerName},`,
    `
      <p>Die Auktion für den folgenden Artikel ist beendet:</p>

      <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #374151; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Höchstgebot:</strong> CHF ${winningBid.toFixed(2)}
        </p>
      </div>

      <p>Leider haben Sie diese Auktion nicht gewonnen. Schauen Sie sich gerne unsere anderen Angebote an!</p>
    `,
    'Weitere Angebote ansehen',
    `${baseUrl}/search`
  )

  const text = `
Auktion beendet - ${articleTitle}

Hallo ${buyerName},

Die Auktion für den folgenden Artikel ist beendet:

Artikel: ${articleTitle}
Höchstgebot: CHF ${winningBid.toFixed(2)}

Leider haben Sie diese Auktion nicht gewonnen. Schauen Sie sich gerne unsere anderen Angebote an!

Weitere Angebote ansehen: ${baseUrl}/search

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Auktionsende-Benachrichtigung (für Verkäufer)
export function getAuctionEndSellerEmail(
  sellerName: string,
  articleTitle: string,
  winningBid: number,
  buyerName: string,
  watchId: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const saleUrl = `${baseUrl}/my-watches/selling/sold`
  const subject = `Auktion beendet - ${articleTitle} wurde verkauft`

  const html = getHelvendaEmailTemplate(
    `Ihr Artikel wurde verkauft`,
    `Hallo ${sellerName},`,
    `
      <p>Ihre Auktion ist beendet und der Artikel wurde verkauft:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Verkaufspreis:</strong> CHF ${winningBid.toFixed(2)}<br>
          <strong>Käufer:</strong> ${buyerName}
        </p>
      </div>

      <p>Bitte kontaktieren Sie den Käufer innerhalb von 7 Tagen. Der Käufer hat 14 Tage Zeit, die Zahlung zu begleichen.</p>
    `,
    'Verkauf ansehen',
    saleUrl
  )

  const text = `
Auktion beendet - ${articleTitle} wurde verkauft

Hallo ${sellerName},

Ihre Auktion ist beendet und der Artikel wurde verkauft:

Artikel: ${articleTitle}
Verkaufspreis: CHF ${winningBid.toFixed(2)}
Käufer: ${buyerName}

Bitte kontaktieren Sie den Käufer innerhalb von 7 Tagen. Der Käufer hat 14 Tage Zeit, die Zahlung zu begleichen.

Verkauf ansehen: ${saleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Zahlungseingangsbestätigung (für Verkäufer)
export function getPaymentReceivedEmail(
  sellerName: string,
  articleTitle: string,
  paymentAmount: number,
  buyerName: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const saleUrl = `${baseUrl}/my-watches/selling/sold`
  const subject = `Zahlung erhalten - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Zahlung erhalten`,
    `Hallo ${sellerName},`,
    `
      <p>Sie haben eine Zahlung erhalten:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Betrag:</strong> CHF ${paymentAmount.toFixed(2)}<br>
          <strong>Käufer:</strong> ${buyerName}
        </p>
      </div>

      <p>Bitte versenden Sie den Artikel nun an den Käufer.</p>
    `,
    'Verkauf ansehen',
    saleUrl
  )

  const text = `
Zahlung erhalten - ${articleTitle}

Hallo ${sellerName},

Sie haben eine Zahlung erhalten:

Artikel: ${articleTitle}
Betrag: CHF ${paymentAmount.toFixed(2)}
Käufer: ${buyerName}

Bitte versenden Sie den Artikel nun an den Käufer.

Verkauf ansehen: ${saleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Versandbenachrichtigung (für Käufer)
export function getShippingNotificationEmail(
  buyerName: string,
  articleTitle: string,
  trackingNumber: string | null,
  trackingProvider: string | null,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const purchaseUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `Versandbenachrichtigung - ${articleTitle}`

  const trackingInfo = trackingNumber
    ? `<p><strong>Tracking-Nummer:</strong> ${trackingNumber}${trackingProvider ? ` (${trackingProvider})` : ''}</p>`
    : '<p>Der Artikel wurde versendet. Sie erhalten keine Tracking-Informationen.</p>'

  const html = getHelvendaEmailTemplate(
    `Ihr Artikel wurde versendet`,
    `Hallo ${buyerName},`,
    `
      <p>Gute Nachrichten! Ihr Artikel wurde versendet:</p>

      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          ${trackingInfo}
        </p>
      </div>

      <p>Sie können den Versandstatus jederzeit in Ihrem Konto verfolgen.</p>
    `,
    'Kauf ansehen',
    purchaseUrl
  )

  const text = `
Versandbenachrichtigung - ${articleTitle}

Hallo ${buyerName},

Gute Nachrichten! Ihr Artikel wurde versendet:

Artikel: ${articleTitle}
${trackingNumber ? `Tracking-Nummer: ${trackingNumber}${trackingProvider ? ` (${trackingProvider})` : ''}` : 'Keine Tracking-Informationen verfügbar'}

Sie können den Versandstatus jederzeit in Ihrem Konto verfolgen.

Kauf ansehen: ${purchaseUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Versandaufforderung (für Verkäufer)
export function getShippingReminderEmail(
  sellerName: string,
  articleTitle: string,
  buyerName: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const saleUrl = `${baseUrl}/my-watches/selling/sold`
  const subject = `Versanderinnerung - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Versanderinnerung`,
    `Hallo ${sellerName},`,
    `
      <p>Bitte versenden Sie den folgenden Artikel:</p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Käufer:</strong> ${buyerName}
        </p>
      </div>

      <p>Der Käufer hat bereits gezahlt. Bitte versenden Sie den Artikel so schnell wie möglich.</p>
    `,
    'Verkauf ansehen',
    saleUrl
  )

  const text = `
Versanderinnerung - ${articleTitle}

Hallo ${sellerName},

Bitte versenden Sie den folgenden Artikel:

Artikel: ${articleTitle}
Käufer: ${buyerName}

Der Käufer hat bereits gezahlt. Bitte versenden Sie den Artikel so schnell wie möglich.

Verkauf ansehen: ${saleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Preisvorschlag erhalten (für Verkäufer)
export function getPriceOfferReceivedEmail(
  sellerName: string,
  articleTitle: string,
  offerAmount: number,
  buyerName: string,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const offersUrl = `${baseUrl}/my-watches/selling/offers`
  const subject = `Preisvorschlag erhalten - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Preisvorschlag erhalten`,
    `Hallo ${sellerName},`,
    `
      <p>Sie haben einen Preisvorschlag erhalten:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Vorschlag:</strong> CHF ${offerAmount.toFixed(2)}<br>
          <strong>Von:</strong> ${buyerName}
        </p>
      </div>

      <p>Sie können den Preisvorschlag annehmen oder ablehnen.</p>
    `,
    'Preisvorschläge ansehen',
    offersUrl
  )

  const text = `
Preisvorschlag erhalten - ${articleTitle}

Hallo ${sellerName},

Sie haben einen Preisvorschlag erhalten:

Artikel: ${articleTitle}
Vorschlag: CHF ${offerAmount.toFixed(2)}
Von: ${buyerName}

Sie können den Preisvorschlag annehmen oder ablehnen.

Preisvorschläge ansehen: ${offersUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Preisvorschlag akzeptiert (für Käufer)
export function getPriceOfferAcceptedEmail(
  buyerName: string,
  articleTitle: string,
  offerAmount: number,
  watchId: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const purchaseUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `Preisvorschlag akzeptiert - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Ihr Preisvorschlag wurde akzeptiert`,
    `Hallo ${buyerName},`,
    `
      <p>Gute Nachrichten! Ihr Preisvorschlag wurde akzeptiert:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Vereinbarter Preis:</strong> CHF ${offerAmount.toFixed(2)}
        </p>
      </div>

      <p>Bitte kontaktieren Sie den Verkäufer innerhalb von 7 Tagen und begleichen Sie die Zahlung innerhalb von 14 Tagen nach Kontaktaufnahme.</p>
    `,
    'Kauf ansehen',
    purchaseUrl
  )

  const text = `
Preisvorschlag akzeptiert - ${articleTitle}

Hallo ${buyerName},

Gute Nachrichten! Ihr Preisvorschlag wurde akzeptiert:

Artikel: ${articleTitle}
Vereinbarter Preis: CHF ${offerAmount.toFixed(2)}

Bitte kontaktieren Sie den Verkäufer innerhalb von 7 Tagen und begleichen Sie die Zahlung innerhalb von 14 Tagen nach Kontaktaufnahme.

Kauf ansehen: ${purchaseUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Angebotsbestätigung (für Verkäufer)
export function getListingConfirmationEmail(
  sellerName: string,
  articleTitle: string,
  articleNumber: string,
  watchId: string
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const subject = `Angebot erfolgreich erstellt - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Ihr Angebot wurde erstellt`,
    `Hallo ${sellerName},`,
    `
      <p>Ihr Angebot wurde erfolgreich erstellt:</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Artikelnummer:</strong> ${articleNumber}
        </p>
      </div>

      <p>Ihr Angebot ist jetzt auf Helvenda sichtbar. Sie werden per E-Mail benachrichtigt, wenn Gebote eingehen oder wenn jemand kauft.</p>
    `,
    'Angebot ansehen',
    articleUrl
  )

  const text = `
Angebot erfolgreich erstellt - ${articleTitle}

Hallo ${sellerName},

Ihr Angebot wurde erfolgreich erstellt:

Artikel: ${articleTitle}
Artikelnummer: ${articleNumber}

Ihr Angebot ist jetzt auf Helvenda sichtbar. Sie werden per E-Mail benachrichtigt, wenn Gebote eingehen oder wenn jemand kauft.

Angebot ansehen: ${articleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Bewertungsaufforderung (für Käufer)
export function getReviewRequestBuyerEmail(
  buyerName: string,
  articleTitle: string,
  sellerName: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const reviewUrl = `${baseUrl}/my-watches/buying/purchased?review=${purchaseId}`
  const subject = `Bewerten Sie Ihren Kauf - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Bewerten Sie Ihren Kauf`,
    `Hallo ${buyerName},`,
    `
      <p>Wie war Ihre Erfahrung mit dem Kauf?</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Verkäufer:</strong> ${sellerName}
        </p>
      </div>

      <p>Ihre Bewertung hilft anderen Käufern und Verkäufern auf Helvenda.</p>
    `,
    'Jetzt bewerten',
    reviewUrl
  )

  const text = `
Bewerten Sie Ihren Kauf - ${articleTitle}

Hallo ${buyerName},

Wie war Ihre Erfahrung mit dem Kauf?

Artikel: ${articleTitle}
Verkäufer: ${sellerName}

Ihre Bewertung hilft anderen Käufern und Verkäufern auf Helvenda.

Jetzt bewerten: ${reviewUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Bewertungsaufforderung (für Verkäufer)
export function getProductDeletedEmail(
  sellerName: string,
  productTitle: string,
  productId: string,
  adminName: string
) {
  const subject = `⚠️ Ihr Artikel "${productTitle}" wurde gelöscht`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .info-box { background: #fff; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; background: #0f766e; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 16px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Artikel gelöscht</h1>
    </div>
    <div class="content">
      <p>Hallo ${sellerName},</p>

      <div class="warning">
        <strong>Wichtige Information:</strong> Ihr Artikel wurde von einem Administrator gelöscht.
      </div>

      <div class="info-box">
        <p><strong>Artikel:</strong> ${productTitle}</p>
        <p><strong>Gelöscht von:</strong> ${adminName}</p>
        <p><strong>Datum:</strong> ${new Date().toLocaleDateString('de-CH', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</p>
      </div>

      <p><strong>Was bedeutet das?</strong></p>
      <p>Ihr Artikel wurde aufgrund von Verstößen gegen unsere Richtlinien oder aus anderen Gründen von einem Administrator entfernt. Der Artikel ist nicht mehr auf der Plattform sichtbar und kann nicht wiederhergestellt werden.</p>

      <p>Falls Sie Fragen zu dieser Entscheidung haben oder weitere Informationen benötigen, können Sie sich gerne an unseren Support wenden.</p>

      <a href="${getEmailBaseUrl()}/my-watches/selling" class="button">
        Zu meinen Artikeln
      </a>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von Helvenda.ch gesendet.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
Artikel gelöscht

Hallo ${sellerName},

Ihr Artikel wurde von einem Administrator gelöscht.

Artikel: ${productTitle}
Gelöscht von: ${adminName}
Datum: ${new Date().toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}

Was bedeutet das?
Ihr Artikel wurde aufgrund von Verstößen gegen unsere Richtlinien oder aus anderen Gründen von einem Administrator entfernt. Der Artikel ist nicht mehr auf der Plattform sichtbar und kann nicht wiederhergestellt werden.

Falls Sie Fragen zu dieser Entscheidung haben oder weitere Informationen benötigen, können Sie sich gerne an unseren Support wenden.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// =====================================================
// === NEUE E-MAIL TEMPLATES (Ricardo-Parität) ===
// =====================================================

// === PASSWORT ZURÜCKSETZEN ===
export function getPasswordResetEmail(userName: string, resetUrl: string) {
  const subject = '🔐 Passwort zurücksetzen - Helvenda'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .email-wrapper { background-color: #f3f4f6; padding: 40px 20px; }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #ffffff;
      padding: 40px 30px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo-section { margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .logo-icon { width: 40px; height: 40px; }
    .content { padding: 40px 30px; text-align: center; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; font-weight: 500; }
    .title { font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 16px; }
    .description { font-size: 16px; color: #6b7280; margin-bottom: 30px; line-height: 1.6; }
    .button-container { margin: 40px 0; }
    .button {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin: 30px 0;
      text-align: left;
      border-radius: 4px;
    }
    .warning-text { font-size: 14px; color: #92400e; line-height: 1.6; }
    .security-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 16px 20px;
      margin: 20px 0;
      text-align: left;
      border-radius: 4px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text { font-size: 14px; color: #6b7280; margin-bottom: 12px; }
    .footer-link { color: #0f766e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-section">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#0f766e"/>
              <path d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <span style="color: #111827; font-size: 24px; font-weight: 700;">Helvenda</span>
            <span style="color: #6b7280; font-size: 14px;">.ch</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 8px;">Schweizer Online-Marktplatz</p>
      </div>

      <div class="content">
        <p class="greeting">Hallo ${userName},</p>

        <h2 class="title">🔐 Passwort zurücksetzen</h2>

        <p class="description">
          Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den Button unten, um ein neues Passwort zu erstellen.
        </p>

        <div class="button-container">
          <a href="${resetUrl}" class="button" style="color: #ffffff !important; background-color: #0f766e; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600;">Passwort zurücksetzen</a>
        </div>

        <div class="warning-box">
          <p class="warning-text">
            <strong>⏰ Wichtig:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig. Danach müssen Sie einen neuen Link anfordern.
          </p>
        </div>

        <div class="security-box">
          <p style="font-size: 14px; color: #134e4a;">
            <strong>🔒 Sicherheitshinweis:</strong><br>
            Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail. Ihr Passwort bleibt unverändert.<br><br>
            Wenn Sie vermuten, dass jemand unbefugt auf Ihr Konto zugreifen möchte, kontaktieren Sie uns bitte umgehend.
          </p>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text">
          Diese E-Mail wurde automatisch von <a href="https://helvenda.ch" class="footer-link">Helvenda.ch</a> gesendet.
        </p>
        <p style="font-size: 12px; color: #9ca3af;">
          Helvenda - Ihr vertrauensvoller Marktplatz für den Kauf und Verkauf von Artikeln in der Schweiz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
Passwort zurücksetzen - Helvenda

Hallo ${userName},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Klicken Sie auf den folgenden Link, um ein neues Passwort zu erstellen:
${resetUrl}

WICHTIG: Dieser Link ist nur 1 Stunde gültig.

SICHERHEITSHINWEIS:
Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.
Ihr Passwort bleibt unverändert.

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === PASSWORT GEÄNDERT BESTÄTIGUNG ===
export function getPasswordChangedEmail(userName: string, ipAddress?: string, device?: string) {
  const baseUrl = getEmailBaseUrl()
  const subject = '✅ Passwort erfolgreich geändert - Helvenda'

  const changeInfo = `
    <div style="background-color: #f3f4f6; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #374151;">
        <strong>📅 Zeitpunkt:</strong> ${new Date().toLocaleString('de-CH', { dateStyle: 'full', timeStyle: 'short' })}<br>
        ${ipAddress ? `<strong>🌐 IP-Adresse:</strong> ${ipAddress}<br>` : ''}
        ${device ? `<strong>📱 Gerät:</strong> ${device}` : ''}
      </p>
    </div>
  `

  const html = getHelvendaEmailTemplate(
    '✅ Passwort erfolgreich geändert',
    `Hallo ${userName},`,
    `
      <p>Ihr Passwort wurde erfolgreich geändert.</p>

      ${changeInfo}

      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          <strong>⚠️ Das waren nicht Sie?</strong><br>
          Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie uns bitte <strong>sofort</strong> unter
          <a href="mailto:support@helvenda.ch" style="color: #dc2626;">support@helvenda.ch</a>
        </p>
      </div>
    `,
    'Zum Konto',
    `${baseUrl}/profile`
  )

  const text = `
Passwort erfolgreich geändert - Helvenda

Hallo ${userName},

Ihr Passwort wurde erfolgreich geändert.

Zeitpunkt: ${new Date().toLocaleString('de-CH', { dateStyle: 'full', timeStyle: 'short' })}
${ipAddress ? `IP-Adresse: ${ipAddress}` : ''}
${device ? `Gerät: ${device}` : ''}

⚠️ Das waren nicht Sie?
Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie uns bitte SOFORT unter support@helvenda.ch

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === LOGIN VON NEUEM GERÄT ===
export function getNewDeviceLoginEmail(
  userName: string,
  ipAddress: string,
  device: string,
  location?: string,
  loginTime?: Date
) {
  const baseUrl = getEmailBaseUrl()
  const time = loginTime || new Date()
  const subject = '🔔 Neue Anmeldung erkannt - Helvenda'

  const html = getHelvendaEmailTemplate(
    '🔔 Neue Anmeldung von einem neuen Gerät',
    `Hallo ${userName},`,
    `
      <p>Wir haben eine Anmeldung bei Ihrem Helvenda-Konto von einem neuen Gerät erkannt.</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a;">
          <strong>📅 Zeitpunkt:</strong> ${time.toLocaleString('de-CH', { dateStyle: 'full', timeStyle: 'short' })}<br>
          <strong>🌐 IP-Adresse:</strong> ${ipAddress}<br>
          <strong>📱 Gerät:</strong> ${device}
          ${location ? `<br><strong>📍 Ungefährer Standort:</strong> ${location}` : ''}
        </p>
      </div>

      <p style="color: #059669; font-weight: 500;">✅ Wenn Sie diese Anmeldung durchgeführt haben, können Sie diese E-Mail ignorieren.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          <strong>⚠️ Nicht erkannt?</strong><br>
          Falls Sie diese Anmeldung nicht durchgeführt haben:
          <ol style="margin: 10px 0 0 0; padding-left: 20px;">
            <li>Ändern Sie sofort Ihr Passwort</li>
            <li>Überprüfen Sie Ihre letzten Kontobewegungen</li>
            <li>Kontaktieren Sie uns unter support@helvenda.ch</li>
          </ol>
        </p>
      </div>
    `,
    'Passwort ändern',
    `${baseUrl}/profile/security`
  )

  const text = `
Neue Anmeldung erkannt - Helvenda

Hallo ${userName},

Wir haben eine Anmeldung bei Ihrem Helvenda-Konto von einem neuen Gerät erkannt.

Zeitpunkt: ${time.toLocaleString('de-CH', { dateStyle: 'full', timeStyle: 'short' })}
IP-Adresse: ${ipAddress}
Gerät: ${device}
${location ? `Ungefährer Standort: ${location}` : ''}

✅ Wenn Sie diese Anmeldung durchgeführt haben, können Sie diese E-Mail ignorieren.

⚠️ Nicht erkannt?
Falls Sie diese Anmeldung nicht durchgeführt haben:
1. Ändern Sie sofort Ihr Passwort
2. Überprüfen Sie Ihre letzten Kontobewegungen
3. Kontaktieren Sie uns unter support@helvenda.ch

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === AUKTION ENDET BALD (24h / 1h) ===
export function getAuctionEndingSoonEmail(
  userName: string,
  articleTitle: string,
  currentBid: number,
  endTime: Date,
  watchId: string,
  imageUrl?: string,
  hoursRemaining?: number
) {
  const baseUrl = getEmailBaseUrl()
  const articleUrl = `${baseUrl}/products/${watchId}`
  const timeLeft = hoursRemaining || 24
  const urgencyLevel = timeLeft <= 1 ? 'critical' : 'warning'

  const subject =
    timeLeft <= 1
      ? `⏰ LETZTE STUNDE! Auktion endet bald - ${articleTitle}`
      : `⏰ Auktion endet in ${timeLeft} Stunden - ${articleTitle}`

  const urgencyColor = urgencyLevel === 'critical' ? '#dc2626' : '#f59e0b'
  const urgencyBg = urgencyLevel === 'critical' ? '#fef2f2' : '#fef3c7'

  const imageHtml = imageUrl
    ? `
    <div style="text-align: center; margin: 20px 0;">
      <img src="${imageUrl}" alt="${articleTitle}" style="max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
    </div>
  `
    : ''

  const html = getHelvendaEmailTemplate(
    timeLeft <= 1 ? '⏰ Letzte Chance!' : '⏰ Auktion endet bald',
    `Hallo ${userName},`,
    `
      <div style="background-color: ${urgencyBg}; border: 2px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: ${urgencyColor};">
          ${timeLeft <= 1 ? '⏰ NOCH WENIGER ALS 1 STUNDE!' : `⏰ Noch ${timeLeft} Stunden`}
        </p>
      </div>

      ${imageHtml}

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Aktuelles Gebot:</strong> CHF ${currentBid.toFixed(2)}<br>
          <strong>Endet:</strong> ${endTime.toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      <p>Verpassen Sie nicht Ihre Chance! Bieten Sie jetzt, um den Artikel zu gewinnen.</p>
    `,
    'Jetzt bieten',
    articleUrl
  )

  const text = `
${timeLeft <= 1 ? '⏰ LETZTE STUNDE!' : '⏰ Auktion endet bald'} - ${articleTitle}

Hallo ${userName},

${timeLeft <= 1 ? 'NOCH WENIGER ALS 1 STUNDE!' : `Noch ${timeLeft} Stunden`}

Artikel: ${articleTitle}
Aktuelles Gebot: CHF ${currentBid.toFixed(2)}
Endet: ${endTime.toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' })}

Verpassen Sie nicht Ihre Chance! Bieten Sie jetzt, um den Artikel zu gewinnen.

Jetzt bieten: ${articleUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === KÄUFER HAT ARTIKEL ERHALTEN ===
export function getItemReceivedConfirmationEmail(
  sellerName: string,
  buyerName: string,
  articleTitle: string,
  purchaseId: string,
  saleAmount: number,
  imageUrl?: string
) {
  const baseUrl = getEmailBaseUrl()
  const saleUrl = `${baseUrl}/my-watches/selling/sold`
  const subject = `✅ Artikel erhalten - ${articleTitle}`

  const imageHtml = imageUrl
    ? `
    <div style="text-align: center; margin: 20px 0;">
      <img src="${imageUrl}" alt="${articleTitle}" style="max-width: 150px; max-height: 150px; border-radius: 8px;" />
    </div>
  `
    : ''

  const html = getHelvendaEmailTemplate(
    '✅ Käufer hat den Artikel erhalten',
    `Hallo ${sellerName},`,
    `
      <p>Gute Nachrichten! <strong>${buyerName}</strong> hat bestätigt, dass der Artikel angekommen ist.</p>

      ${imageHtml}

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Käufer:</strong> ${buyerName}<br>
          <strong>Verkaufsbetrag:</strong> CHF ${saleAmount.toFixed(2)}
        </p>
      </div>

      <div style="background-color: #ecfdf5; border: 1px solid #059669; padding: 16px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 16px; color: #059669; font-weight: 600;">
          🎉 Transaktion erfolgreich abgeschlossen!
        </p>
      </div>

      <p>Falls noch nicht geschehen, bitten wir Sie, den Käufer zu bewerten. Bewertungen helfen der Community!</p>
    `,
    'Käufer bewerten',
    `${saleUrl}?review=${purchaseId}`
  )

  const text = `
✅ Käufer hat den Artikel erhalten - ${articleTitle}

Hallo ${sellerName},

Gute Nachrichten! ${buyerName} hat bestätigt, dass der Artikel angekommen ist.

Artikel: ${articleTitle}
Käufer: ${buyerName}
Verkaufsbetrag: CHF ${saleAmount.toFixed(2)}

🎉 Transaktion erfolgreich abgeschlossen!

Falls noch nicht geschehen, bitten wir Sie, den Käufer zu bewerten.

Käufer bewerten: ${saleUrl}?review=${purchaseId}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

// === WILLKOMMENS-E-MAIL (nach Verifizierung) ===
export function getWelcomeEmail(userName: string) {
  const baseUrl = getEmailBaseUrl()
  const subject = '🎉 Willkommen bei Helvenda!'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    }
    .email-wrapper { background-color: #f3f4f6; padding: 40px 20px; }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%);
      padding: 50px 30px;
      text-align: center;
      color: white;
    }
    .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
    .header p { font-size: 18px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .welcome-text { font-size: 16px; color: #6b7280; margin-bottom: 30px; line-height: 1.8; }
    .features { margin: 30px 0; }
    .feature {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      background-color: #0f766e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      margin-right: 16px;
      flex-shrink: 0;
    }
    .feature-text h3 { font-size: 16px; color: #1f2937; margin-bottom: 4px; }
    .feature-text p { font-size: 14px; color: #6b7280; }
    .button-container { text-align: center; margin: 40px 0; }
    .button {
      display: inline-block;
      background-color: #0f766e;
      color: #ffffff !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 16px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text { font-size: 14px; color: #6b7280; }
    .footer-link { color: #0f766e; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>🎉 Willkommen!</h1>
        <p>Ihr Konto ist jetzt aktiviert</p>
      </div>

      <div class="content">
        <p class="greeting">Hallo ${userName},</p>

        <p class="welcome-text">
          Herzlich willkommen bei <strong>Helvenda</strong> - Ihrem Schweizer Online-Marktplatz!
          Ihr Konto wurde erfolgreich verifiziert und Sie können nun alle Funktionen nutzen.
        </p>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">🛒</div>
            <div class="feature-text">
              <h3>Kaufen</h3>
              <p>Entdecken Sie tausende Artikel von verifizierten Verkäufern in der Schweiz.</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">💰</div>
            <div class="feature-text">
              <h3>Verkaufen</h3>
              <p>Inserieren Sie Ihre Artikel kostenlos und erreichen Sie Käufer in der ganzen Schweiz.</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">⚡</div>
            <div class="feature-text">
              <h3>Auktionen</h3>
              <p>Nehmen Sie an spannenden Auktionen teil oder erstellen Sie Ihre eigenen.</p>
            </div>
          </div>

          <div class="feature">
            <div class="feature-icon">🔒</div>
            <div class="feature-text">
              <h3>Sicher handeln</h3>
              <p>Profitieren Sie von unserem Bewertungssystem und sicherem Zahlungsverkehr.</p>
            </div>
          </div>
        </div>

        <div class="button-container">
          <a href="${baseUrl}/search" class="button" style="color: #ffffff !important;">Jetzt entdecken</a>
        </div>
      </div>

      <div class="footer">
        <p class="footer-text">
          Fragen? Kontaktieren Sie uns unter <a href="mailto:support@helvenda.ch" class="footer-link">support@helvenda.ch</a>
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">
          © ${new Date().getFullYear()} Helvenda.ch - Schweizer Online-Marktplatz
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
🎉 Willkommen bei Helvenda!

Hallo ${userName},

Herzlich willkommen bei Helvenda - Ihrem Schweizer Online-Marktplatz!
Ihr Konto wurde erfolgreich verifiziert und Sie können nun alle Funktionen nutzen.

Was Sie bei Helvenda tun können:

🛒 KAUFEN
Entdecken Sie tausende Artikel von verifizierten Verkäufern in der Schweiz.

💰 VERKAUFEN
Inserieren Sie Ihre Artikel kostenlos und erreichen Sie Käufer in der ganzen Schweiz.

⚡ AUKTIONEN
Nehmen Sie an spannenden Auktionen teil oder erstellen Sie Ihre eigenen.

🔒 SICHER HANDELN
Profitieren Sie von unserem Bewertungssystem und sicherem Zahlungsverkehr.

Jetzt entdecken: ${baseUrl}/search

---
Fragen? Kontaktieren Sie uns unter support@helvenda.ch
© ${new Date().getFullYear()} Helvenda.ch - Schweizer Online-Marktplatz
  `.trim()

  return { subject, html, text }
}

// === ARTIKEL MIT BILD UND VERKÄUFER-BEWERTUNG (Wiederverwendbare Komponente) ===
export function getProductCardHtml(
  articleTitle: string,
  price: number,
  imageUrl?: string,
  sellerName?: string,
  sellerRating?: number,
  sellerReviewCount?: number
) {
  const stars = sellerRating
    ? '⭐'.repeat(Math.round(sellerRating)) + '☆'.repeat(5 - Math.round(sellerRating))
    : ''

  const imageHtml = imageUrl
    ? `
    <td style="width: 120px; padding-right: 16px; vertical-align: top;">
      <img src="${imageUrl}" alt="${articleTitle}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;" />
    </td>
  `
    : ''

  const sellerHtml = sellerName
    ? `
    <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">
      Verkäufer: <strong>${sellerName}</strong>
      ${sellerRating ? `<br><span style="color: #f59e0b;">${stars}</span> <span style="color: #9ca3af;">(${sellerReviewCount || 0} Bewertungen)</span>` : ''}
    </p>
  `
    : ''

  return `
    <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
      <tr>
        ${imageHtml}
        <td style="padding: 16px; vertical-align: top;">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${articleTitle}</p>
          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #0f766e;">CHF ${price.toFixed(2)}</p>
          ${sellerHtml}
        </td>
      </tr>
    </table>
  `
}

// === TRANSAKTIONS-ZUSAMMENFASSUNG (Wiederverwendbare Komponente) ===
export function getTransactionSummaryHtml(
  items: Array<{ label: string; value: string; bold?: boolean }>,
  total?: { label: string; value: string }
) {
  const itemsHtml = items
    .map(
      item => `
    <tr>
      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${item.label}</td>
      <td style="padding: 8px 0; text-align: right; color: ${item.bold ? '#1f2937' : '#6b7280'}; font-size: 14px; ${item.bold ? 'font-weight: 600;' : ''}">${item.value}</td>
    </tr>
  `
    )
    .join('')

  const totalHtml = total
    ? `
    <tr style="border-top: 2px solid #0f766e;">
      <td style="padding: 12px 0 0 0; font-weight: 700; color: #1f2937; font-size: 16px;">${total.label}</td>
      <td style="padding: 12px 0 0 0; text-align: right; font-weight: 700; color: #0f766e; font-size: 18px;">${total.value}</td>
    </tr>
  `
    : ''

  return `
    <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <tbody style="display: block; padding: 16px;">
        ${itemsHtml}
        ${totalHtml}
      </tbody>
    </table>
  `
}

// === ADMIN: E-MAIL MANUELL VERIFIZIERT ===
export function getManualEmailVerificationEmail(userName: string, adminName: string) {
  const baseUrl = getEmailBaseUrl()
  const subject = '✅ Ihr Konto wurde verifiziert - Helvenda'

  const html = getHelvendaEmailTemplate(
    '✅ Konto manuell verifiziert',
    `Hallo ${userName},`,
    `
      <p>Gute Nachrichten! Ihr Helvenda-Konto wurde von unserem Team manuell verifiziert.</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 500;">
          <strong>Status:</strong> ✅ Verifiziert<br>
          <strong>Verifiziert durch:</strong> ${adminName}<br>
          <strong>Datum:</strong> ${new Date().toLocaleDateString('de-CH', { dateStyle: 'full' })}
        </p>
      </div>

      <p>Sie können nun alle Funktionen von Helvenda nutzen:</p>
      <ul style="color: #6b7280; margin: 16px 0; padding-left: 20px;">
        <li>Artikel kaufen und verkaufen</li>
        <li>An Auktionen teilnehmen</li>
        <li>Nachrichten senden und empfangen</li>
        <li>Bewertungen abgeben</li>
      </ul>
    `,
    'Jetzt loslegen',
    `${baseUrl}/search`
  )

  const text = `
✅ Ihr Konto wurde verifiziert - Helvenda

Hallo ${userName},

Gute Nachrichten! Ihr Helvenda-Konto wurde von unserem Team manuell verifiziert.

Status: ✅ Verifiziert
Verifiziert durch: ${adminName}
Datum: ${new Date().toLocaleDateString('de-CH', { dateStyle: 'full' })}

Sie können nun alle Funktionen von Helvenda nutzen:
- Artikel kaufen und verkaufen
- An Auktionen teilnehmen
- Nachrichten senden und empfangen
- Bewertungen abgeben

Jetzt loslegen: ${baseUrl}/search

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

export function getReviewRequestSellerEmail(
  sellerName: string,
  articleTitle: string,
  buyerName: string,
  purchaseId: string
) {
  const baseUrl = getEmailBaseUrl()
  const reviewUrl = `${baseUrl}/my-watches/selling/sold?review=${purchaseId}`
  const subject = `Bewerten Sie Ihren Verkauf - ${articleTitle}`

  const html = getHelvendaEmailTemplate(
    `Bewerten Sie Ihren Verkauf`,
    `Hallo ${sellerName},`,
    `
      <p>Wie war Ihre Erfahrung mit dem Verkauf?</p>

      <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #134e4a; font-weight: 500;">
          <strong>Artikel:</strong> ${articleTitle}<br>
          <strong>Käufer:</strong> ${buyerName}
        </p>
      </div>

      <p>Ihre Bewertung hilft anderen Käufern und Verkäufern auf Helvenda.</p>
    `,
    'Jetzt bewerten',
    reviewUrl
  )

  const text = `
Bewerten Sie Ihren Verkauf - ${articleTitle}

Hallo ${sellerName},

Wie war Ihre Erfahrung mit dem Verkauf?

Artikel: ${articleTitle}
Käufer: ${buyerName}

Ihre Bewertung hilft anderen Käufern und Verkäufern auf Helvenda.

Jetzt bewerten: ${reviewUrl}

---
Diese E-Mail wurde automatisch von Helvenda.ch gesendet.
  `.trim()

  return { subject, html, text }
}

interface InvoiceReminderOptions {
  userName: string
  invoiceNumber: string
  amount: number
  dueDate: Date
  itemDescription: string
  reminderLevel: number // 0 = payment request, 1 = first reminder, 2 = second reminder, 3 = final reminder
}

export function getInvoiceReminderEmail(options: InvoiceReminderOptions) {
  const { userName, invoiceNumber, amount, dueDate, itemDescription, reminderLevel } = options
  const baseUrl = getEmailBaseUrl()
  const paymentUrl = `${baseUrl}/my-watches/selling/fees`

  const formattedAmount = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
  }).format(amount)

  const formattedDueDate = new Date(dueDate).toLocaleDateString('de-CH')

  // Different content based on reminder level
  let title: string
  let urgency: string
  let consequences: string
  let bgColor: string
  let borderColor: string
  let textColor: string

  switch (reminderLevel) {
    case 0: // Payment request
      title = 'Zahlungsaufforderung'
      urgency = 'Ihre Rechnung ist fällig'
      consequences =
        'Bitte begleichen Sie den offenen Betrag bis zum Fälligkeitsdatum, um Mahngebühren zu vermeiden.'
      bgColor = '#f0fdfa'
      borderColor = '#0d9488'
      textColor = '#134e4a'
      break
    case 1: // First reminder
      title = '1. Mahnung'
      urgency = 'Ihre Zahlung ist überfällig'
      consequences =
        'Wir bitten Sie, den offenen Betrag umgehend zu begleichen. Bei weiterer Verzögerung werden Mahngebühren erhoben.'
      bgColor = '#fef3c7'
      borderColor = '#f59e0b'
      textColor = '#92400e'
      break
    case 2: // Second reminder
      title = '2. Mahnung'
      urgency = 'Dringende Zahlungsaufforderung'
      consequences =
        'Ihr Konto wird gesperrt, wenn die Zahlung nicht innerhalb von 14 Tagen eingeht. Mahngebühren von CHF 10.00 wurden hinzugefügt.'
      bgColor = '#fed7aa'
      borderColor = '#ea580c'
      textColor = '#9a3412'
      break
    case 3: // Final reminder
      title = 'Letzte Mahnung'
      urgency = 'Letzte Zahlungserinnerung vor Kontosperrung'
      consequences =
        'Dies ist unsere letzte Mahnung. Ohne Zahlung innerhalb von 7 Tagen wird Ihr Konto dauerhaft gesperrt und der Fall an ein Inkassobüro übergeben.'
      bgColor = '#fee2e2'
      borderColor = '#dc2626'
      textColor = '#991b1b'
      break
    default:
      title = 'Zahlungserinnerung'
      urgency = 'Offene Rechnung'
      consequences = 'Bitte begleichen Sie den offenen Betrag.'
      bgColor = '#f3f4f6'
      borderColor = '#6b7280'
      textColor = '#374151'
  }

  const html = getHelvendaEmailTemplate(
    title,
    `Hallo ${userName},`,
    `
      <p>${urgency}</p>

      <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: ${textColor}; font-weight: 500;">
          <strong>Rechnungsnummer:</strong> ${invoiceNumber}<br>
          <strong>Artikel:</strong> ${itemDescription}<br>
          <strong>Betrag:</strong> ${formattedAmount}<br>
          <strong>Fälligkeitsdatum:</strong> ${formattedDueDate}
        </p>
      </div>

      <p>${consequences}</p>

      <p>Bei Fragen oder Zahlungsschwierigkeiten kontaktieren Sie uns bitte unter <a href="mailto:support@helvenda.ch">support@helvenda.ch</a>.</p>
    `,
    'Jetzt bezahlen',
    paymentUrl
  )

  return html
}
