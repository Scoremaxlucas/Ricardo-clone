import nodemailer from 'nodemailer'

// E-Mail-Transporter konfigurieren
// In Produktion sollten diese Werte aus Umgebungsvariablen kommen
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
  try {
    // In Entwicklung: E-Mail nur loggen, nicht wirklich versenden
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('📧 E-Mail würde versendet werden:')
      console.log('An:', to)
      console.log('Betreff:', subject)
      console.log('Inhalt:', text || html)
      return { success: true, message: 'E-Mail geloggt (Development Mode)' }
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@ricardo-clone.ch',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Fallback zu Text ohne HTML
      html,
    })

    console.log('E-Mail versendet:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error('Fehler beim Versenden der E-Mail:', error)
    return { success: false, error: error.message }
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .message-box { background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ricardo Clone</h1>
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
          <p>Diese E-Mail wurde automatisch von Ricardo Clone gesendet.</p>
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
Diese E-Mail wurde automatisch von Ricardo Clone gesendet.
  `.trim()

  return { subject, html, text }
}

// Template für Verifizierungs-Bestätigung
export function getVerificationApprovalEmail(
  userName: string,
  userEmail: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
        .success-box { background-color: white; padding: 20px; border-left: 4px solid #10b981; margin: 15px 0; }
        .check-icon { font-size: 48px; color: #10b981; text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ricardo Clone</h1>
        </div>
        <div class="content">
          <p>Hallo ${userName},</p>
          <div class="success-box">
            <div class="check-icon">✓</div>
            <h2 style="text-align: center; color: #10b981; margin-top: 10px;">
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
            <li>Uhren zum Verkauf anbieten</li>
            <li>Bei Auktionen mitbieten</li>
            <li>Sofortkäufe tätigen</li>
          </ul>
          <p style="margin-top: 20px;">
            <a href="${profileUrl}" class="button">Zu Ihrem Profil</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von Ricardo Clone gesendet.</p>
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

• Uhren zum Verkauf anbieten
• Bei Auktionen mitbieten
• Sofortkäufe tätigen

Zu Ihrem Profil: ${profileUrl}

---
       Diese E-Mail wurde automatisch von Ricardo Clone gesendet.
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
         watchId: string
       ) {
         const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
               .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
               .content { background-color: #f9fafb; padding: 20px; margin-top: 20px; }
               .success-box { background-color: white; padding: 20px; border-left: 4px solid #10b981; margin: 15px 0; }
               .price-box { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
               .buyer-info { background-color: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
               .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
               .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
             </style>
           </head>
           <body>
             <div class="container">
               <div class="header">
                 <h1>Ricardo Clone</h1>
               </div>
               <div class="content">
                 <p>Hallo ${sellerName},</p>
                 <div class="success-box">
                   <h2 style="color: #10b981; margin-top: 0;">
                     🎉 Glückwunsch! Ihre Uhr wurde erfolgreich verkauft!
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
                 
                 <div style="margin: 20px 0;">
                   <p><strong>Verkaufte Uhr:</strong> ${watchTitle}</p>
                   <p><strong>Käufer:</strong> ${buyerName}</p>
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
                 <p>Diese E-Mail wurde automatisch von Ricardo Clone gesendet.</p>
                 <p>Sie erhalten diese E-Mail, weil eine Ihrer Uhren erfolgreich verkauft wurde.</p>
               </div>
             </div>
           </body>
           </html>
         `
       
         const text = `
       Hallo ${sellerName},
       
       🎉 Glückwunsch! Ihre Uhr wurde erfolgreich verkauft!
       
       Verkaufte Uhr: ${watchTitle}
       Käufer: ${buyerName}
       Verkaufspreis: CHF ${new Intl.NumberFormat('de-CH').format(finalPrice)}
       Art: ${purchaseType === 'buy-now' ? 'Sofortkauf' : 'Auktion'}
       
       Die Käuferinformationen (Name, Adresse, Kontaktdaten, Zahlungsmethoden) finden Sie in Ihrem Verkäufer-Bereich unter "Verkauft".
       
       Zu Ihren Verkäufen: ${salesUrl}
       
       ---
       Diese E-Mail wurde automatisch von Ricardo Clone gesendet.
       Sie erhalten diese E-Mail, weil eine Ihrer Uhren erfolgreich verkauft wurde.
         `.trim()
       
         return { subject, html, text }
       }

// Template für Bewertungs-Benachrichtigung
export function getReviewNotificationEmail(
  userName: string,
  rating: 'positive' | 'neutral' | 'negative',
  reviewerName: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
  const profileUrl = `${baseUrl}/my-watches/public-profile`

  const ratingLabels: Record<string, { label: string; color: string; emoji: string }> = {
    positive: { label: 'positive', color: '#10b981', emoji: '👍' },
    neutral: { label: 'neutrale', color: '#6b7280', emoji: '😐' },
    negative: { label: 'negative', color: '#ef4444', emoji: '👎' }
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
          <h1>Ricardo Clone</h1>
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
          <p>Diese E-Mail wurde automatisch von Ricardo Clone gesendet.</p>
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
Diese E-Mail wurde automatisch von Ricardo Clone gesendet.
Sie erhalten diese E-Mail, weil Sie eine neue Bewertung erhalten haben.
  `.trim()

  return { subject, html, text }
}

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
    text: emailContent.text
  })
}

