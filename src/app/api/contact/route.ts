import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL || 'support@helvenda.ch'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, email, subject, message } = body

    // Validierung
    if (!category || !email || !subject || !message) {
      return NextResponse.json(
        { message: 'Bitte füllen Sie alle Felder aus' },
        { status: 400 }
      )
    }

    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    // Kategorie-Labels
    const categoryLabels: Record<string, string> = {
      technical: 'Technisches Problem',
      account: 'Account-Frage',
      payment: 'Zahlungsproblem',
      safety: 'Sicherheitsproblem',
      general: 'Allgemeine Frage',
      feedback: 'Feedback & Vorschläge',
      other: 'Sonstiges',
    }

    const categoryLabel = categoryLabels[category] || category

    // Kontaktanfrage in Datenbank speichern
    let contactRequest = null
    try {
      console.log('[contact] Versuche Kontaktanfrage in Datenbank zu speichern...')
      contactRequest = await prisma.contactRequest.create({
        data: {
          category,
          email,
          subject,
          message,
          status: 'pending',
        },
      })
      console.log(`[contact] ✅ Kontaktanfrage gespeichert: ID=${contactRequest.id}, Kategorie=${categoryLabel}`)
    } catch (dbError: any) {
      console.error('[contact] ❌ Fehler beim Speichern in Datenbank:', dbError)
      console.error('[contact] Error name:', dbError.name)
      console.error('[contact] Error code:', dbError.code)
      console.error('[contact] Error message:', dbError.message)
      // Weiter mit E-Mail-Versand, auch wenn DB-Speicherung fehlschlägt
    }

    // E-Mail an Support senden
    const emailSubject = `[Helvenda Support] ${categoryLabel}: ${subject}`
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background: #f3f4f6;
            border-left: 4px solid #0f766e;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .label {
            font-weight: 600;
            color: #374151;
            margin-top: 15px;
            display: block;
          }
          .value {
            color: #6b7280;
            margin-top: 5px;
          }
          .message-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Neue Support-Anfrage</h1>
        </div>
        <div class="content">
          <div class="info-box">
            <strong>Kategorie:</strong> ${categoryLabel}<br>
            <strong>Von:</strong> ${email}
          </div>

          <div class="label">Betreff:</div>
          <div class="value">${subject}</div>

          <div class="label">Nachricht:</div>
          <div class="message-box">${message.replace(/\n/g, '<br>')}</div>

          <div class="footer">
            <p>Diese E-Mail wurde über das Kontaktformular von Helvenda.ch gesendet.</p>
            <p>Antworten Sie direkt auf diese E-Mail, um dem Nutzer zu antworten.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailText = `
Neue Support-Anfrage von Helvenda.ch

Kategorie: ${categoryLabel}
Von: ${email}

Betreff: ${subject}

Nachricht:
${message}

---
Diese E-Mail wurde über das Kontaktformular von Helvenda.ch gesendet.
Antworten Sie direkt auf diese E-Mail, um dem Nutzer zu antworten.
    `.trim()

    // E-Mail an Support senden
    await sendEmail({
      to: CONTACT_EMAIL,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })

    // Bestätigungs-E-Mail an Nutzer senden
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .success-box {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Vielen Dank für Ihre Nachricht</h1>
        </div>
        <div class="content">
          <div class="success-box">
            <strong>✓ Ihre Nachricht wurde erfolgreich gesendet</strong>
          </div>

          <p>Hallo,</p>
          <p>vielen Dank für Ihre Kontaktaufnahme mit Helvenda.ch. Wir haben Ihre Nachricht erhalten und werden uns in Kürze bei Ihnen melden.</p>

          <p><strong>Ihre Anfrage:</strong></p>
          <p>Kategorie: ${categoryLabel}</p>
          <p>Betreff: ${subject}</p>

          <p>Unser Support-Team bearbeitet Ihre Anfrage normalerweise innerhalb von 24-48 Stunden.</p>

          <p>Falls Sie dringend Hilfe benötigen, können Sie auch unseren AI-Assistant Emma nutzen, der auf allen Seiten verfügbar ist.</p>

          <div class="footer">
            <p>Mit freundlichen Grüssen,<br>Das Helvenda Support-Team</p>
            <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const confirmationText = `
Vielen Dank für Ihre Nachricht

Hallo,

vielen Dank für Ihre Kontaktaufnahme mit Helvenda.ch. Wir haben Ihre Nachricht erhalten und werden uns in Kürze bei Ihnen melden.

Ihre Anfrage:
Kategorie: ${categoryLabel}
Betreff: ${subject}

Unser Support-Team bearbeitet Ihre Anfrage normalerweise innerhalb von 24-48 Stunden.

Falls Sie dringend Hilfe benötigen, können Sie auch unseren AI-Assistant Emma nutzen, der auf allen Seiten verfügbar ist.

Mit freundlichen Grüssen,
Das Helvenda Support-Team

---
Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.
    `.trim()

    // Bestätigungs-E-Mail an Nutzer
    await sendEmail({
      to: email,
      subject: 'Vielen Dank für Ihre Nachricht - Helvenda Support',
      html: confirmationHtml,
      text: confirmationText,
    })

    console.log(`[contact] Support-Anfrage erhalten von ${email}, Kategorie: ${categoryLabel}`)

    return NextResponse.json({
      message: 'Ihre Nachricht wurde erfolgreich gesendet',
      success: true,
    })
  } catch (error: any) {
    console.error('[contact] Fehler beim Senden der Kontaktnachricht:', error)
    return NextResponse.json(
      { message: 'Fehler beim Senden der Nachricht: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}

