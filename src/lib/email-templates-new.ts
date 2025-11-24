// Neue E-Mail-Templates - werden in email.ts integriert

// Template für Überboten-Benachrichtigung (für Käufer)
export function getOutbidNotificationEmail(
  buyerName: string,
  articleTitle: string,
  currentHighestBid: number,
  watchId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
  const purchaseUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `🎉 Glückwunsch! Sie haben gewonnen - ${articleTitle}`
  
  const html = getHelvendaEmailTemplate(
    `Glückwunsch! Sie haben gewonnen`,
    `Hallo ${buyerName},`,
    `
      <p>Herzlichen Glückwunsch! Sie haben die Auktion gewonnen:</p>
      
      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
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
🎉 Glückwunsch! Sie haben gewonnen - ${articleTitle}

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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
  const saleUrl = `${baseUrl}/my-watches/selling/sold`
  const subject = `Auktion beendet - ${articleTitle} wurde verkauft`
  
  const html = getHelvendaEmailTemplate(
    `Ihr Artikel wurde verkauft`,
    `Hallo ${sellerName},`,
    `
      <p>Ihre Auktion ist beendet und der Artikel wurde verkauft:</p>
      
      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
  const saleUrl = `${baseUrl}/my-watches/selling/sold`
  const subject = `Zahlung erhalten - ${articleTitle}`
  
  const html = getHelvendaEmailTemplate(
    `Zahlung erhalten`,
    `Hallo ${sellerName},`,
    `
      <p>Sie haben eine Zahlung erhalten:</p>
      
      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
  const purchaseUrl = `${baseUrl}/my-watches/buying/purchased`
  const subject = `Preisvorschlag akzeptiert - ${articleTitle}`
  
  const html = getHelvendaEmailTemplate(
    `Ihr Preisvorschlag wurde akzeptiert`,
    `Hallo ${buyerName},`,
    `
      <p>Gute Nachrichten! Ihr Preisvorschlag wurde akzeptiert:</p>
      
      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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
export function getReviewRequestSellerEmail(
  sellerName: string,
  articleTitle: string,
  buyerName: string,
  purchaseId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002'
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





