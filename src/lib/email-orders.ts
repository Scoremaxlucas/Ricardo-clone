/**
 * E-Mail-Funktionen für Orders (Ricardo-Style)
 * - Bestellbestätigung
 * - Zahlungserinnerungen
 * - Auto-Stornierung Benachrichtigung
 */

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getMainAddress } from '@/lib/address'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://www.helvenda.ch'

/**
 * Sendet Bestellbestätigung an Käufer
 * Enthält Zahlungsinformationen bei Direktzahlung
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      watch: {
        select: {
          id: true,
          title: true,
          brand: true,
          model: true,
          images: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          nickname: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          firstName: true,
          nickname: true,
          phone: true,
        },
      },
    },
  })

  if (!order) {
    throw new Error('Order nicht gefunden')
  }

  // Verkäufer-Adresse laden
  const sellerAddress = await getMainAddress(order.sellerId)

  const buyerName = order.buyer.nickname || order.buyer.firstName || order.buyer.name || 'Käufer'
  const sellerName = order.seller.nickname || order.seller.firstName || order.seller.name || 'Verkäufer'
  
  // Bild-URL parsen
  let imageUrl = ''
  try {
    const images = order.watch.images ? JSON.parse(order.watch.images) : []
    imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : ''
  } catch {
    imageUrl = ''
  }

  // Zahlungsinformationen basierend auf Methode
  let paymentInfo = ''
  if (order.paymentMethod === 'cash_on_pickup') {
    paymentInfo = `
      <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="color: #166534; margin: 0 0 8px 0;">💰 Bezahlung bei Abholung</h3>
        <p style="color: #15803d; margin: 0;">
          Die Bezahlung erfolgt bar bei der Übergabe. Bitte kontaktieren Sie den Verkäufer, um einen Termin zu vereinbaren.
        </p>
      </div>
    `
  } else if (order.paymentMethod === 'bank_transfer') {
    paymentInfo = `
      <div style="background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="color: #854d0e; margin: 0 0 12px 0;">🏦 Banküberweisung</h3>
        <p style="color: #a16207; margin: 0 0 12px 0;">
          Bitte überweisen Sie den Betrag von <strong>CHF ${order.totalAmount.toFixed(2)}</strong> an den Verkäufer.
        </p>
        <p style="color: #a16207; margin: 0 0 8px 0;">
          <strong>⚠️ Wichtig:</strong> Die Zahlung muss innerhalb von 14 Tagen erfolgen.
        </p>
        <p style="color: #a16207; margin: 0; font-size: 12px;">
          Zahlungsfrist: ${order.paymentDeadline ? new Date(order.paymentDeadline).toLocaleDateString('de-CH') : 'Nicht gesetzt'}
        </p>
      </div>
    `
  }

  // Kontaktinformationen des Verkäufers
  const sellerContact = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <h3 style="color: #334155; margin: 0 0 12px 0;">📞 Kontakt des Verkäufers</h3>
      <p style="margin: 4px 0;"><strong>Name:</strong> ${sellerName}</p>
      ${order.seller.email ? `<p style="margin: 4px 0;"><strong>E-Mail:</strong> ${order.seller.email}</p>` : ''}
      ${order.seller.phone ? `<p style="margin: 4px 0;"><strong>Telefon:</strong> ${order.seller.phone}</p>` : ''}
      ${sellerAddress ? `
        <p style="margin: 4px 0;"><strong>Adresse:</strong><br>
        ${sellerAddress.street} ${sellerAddress.streetNumber}<br>
        ${sellerAddress.postalCode} ${sellerAddress.city}
        </p>
      ` : ''}
    </div>
  `

  const subject = `Bestellbestätigung #${order.orderNumber} - ${order.watch.title}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0d9488; margin: 0;">🎉 Vielen Dank für Ihren Kauf!</h1>
      </div>

      <p>Hallo ${buyerName},</p>
      
      <p>Ihre Bestellung <strong>#${order.orderNumber}</strong> wurde erfolgreich aufgegeben.</p>

      <!-- Artikel-Details -->
      <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${imageUrl ? `
              <td style="width: 80px; vertical-align: top; padding-right: 16px;">
                <img src="${imageUrl}" alt="${order.watch.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
              </td>
            ` : ''}
            <td style="vertical-align: top;">
              <h3 style="margin: 0 0 4px 0; color: #111827;">${order.watch.title}</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${order.watch.brand} ${order.watch.model}</p>
            </td>
          </tr>
        </table>
      </div>

      <!-- Preisübersicht -->
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0;">Artikelpreis</td>
            <td style="text-align: right;">CHF ${order.itemPrice.toFixed(2)}</td>
          </tr>
          ${order.shippingCostChfFinal > 0 ? `
            <tr>
              <td style="padding: 4px 0;">Versand</td>
              <td style="text-align: right;">CHF ${order.shippingCostChfFinal.toFixed(2)}</td>
            </tr>
          ` : `
            <tr>
              <td style="padding: 4px 0;">Versand</td>
              <td style="text-align: right; color: #059669;">Gratis (Abholung)</td>
            </tr>
          `}
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 12px 0 4px 0; font-weight: bold; font-size: 18px;">Total</td>
            <td style="text-align: right; font-weight: bold; font-size: 18px; color: #0d9488;">CHF ${order.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Zahlungsinformationen -->
      ${paymentInfo}

      <!-- Verkäufer-Kontakt -->
      ${sellerContact}

      <!-- Kontaktfrist-Hinweis -->
      <div style="background-color: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="color: #1e40af; margin: 0;">
          <strong>📅 Bitte kontaktieren Sie den Verkäufer innerhalb von 7 Tagen</strong>, um die Übergabe/Lieferung zu koordinieren.
        </p>
      </div>

      <!-- Button -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="${BASE_URL}/my-watches/buying/orders" 
           style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Bestellung ansehen
        </a>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
        Bei Fragen können Sie uns jederzeit kontaktieren.<br>
        Ihr Helvenda-Team
      </p>
    </body>
    </html>
  `

  const text = `
Vielen Dank für Ihren Kauf!

Bestellung #${order.orderNumber}

Artikel: ${order.watch.title}
${order.watch.brand} ${order.watch.model}

Artikelpreis: CHF ${order.itemPrice.toFixed(2)}
Versand: ${order.shippingCostChfFinal > 0 ? `CHF ${order.shippingCostChfFinal.toFixed(2)}` : 'Gratis (Abholung)'}
Total: CHF ${order.totalAmount.toFixed(2)}

${order.paymentMethod === 'cash_on_pickup' ? 
  'Die Bezahlung erfolgt bar bei der Übergabe.' : 
  `Bitte überweisen Sie CHF ${order.totalAmount.toFixed(2)} an den Verkäufer.\nZahlungsfrist: ${order.paymentDeadline ? new Date(order.paymentDeadline).toLocaleDateString('de-CH') : 'Nicht gesetzt'}`
}

Verkäufer: ${sellerName}
E-Mail: ${order.seller.email}
${order.seller.phone ? `Telefon: ${order.seller.phone}` : ''}

Bitte kontaktieren Sie den Verkäufer innerhalb von 7 Tagen.

Bestellung ansehen: ${BASE_URL}/my-watches/buying/orders

Ihr Helvenda-Team
  `

  await sendEmail({
    to: order.buyer.email,
    subject,
    html,
    text,
  })

  console.log(`[email-orders] ✅ Bestellbestätigung gesendet an ${order.buyer.email} für Order ${order.orderNumber}`)
}

/**
 * Sendet Zahlungserinnerung an Käufer
 * Wird vom Cron-Job aufgerufen
 */
export async function sendPaymentReminderEmail(orderId: string, reminderNumber: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      watch: {
        select: { title: true, brand: true, model: true },
      },
      buyer: {
        select: { email: true, name: true, firstName: true, nickname: true },
      },
      seller: {
        select: { name: true, firstName: true, nickname: true },
      },
    },
  })

  if (!order) {
    throw new Error('Order nicht gefunden')
  }

  const buyerName = order.buyer.nickname || order.buyer.firstName || order.buyer.name || 'Käufer'
  const sellerName = order.seller.nickname || order.seller.firstName || order.seller.name || 'Verkäufer'
  const daysRemaining = order.paymentDeadline 
    ? Math.ceil((new Date(order.paymentDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const urgencyColor = daysRemaining <= 3 ? '#dc2626' : daysRemaining <= 7 ? '#f59e0b' : '#3b82f6'
  const urgencyText = daysRemaining <= 3 ? 'DRINGEND' : daysRemaining <= 7 ? 'Erinnerung' : 'Freundliche Erinnerung'

  const subject = `${urgencyText}: Zahlung für Bestellung #${order.orderNumber} ausstehend`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: ${urgencyColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">${urgencyText}: Zahlung ausstehend</h2>
      </div>

      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hallo ${buyerName},</p>
        
        <p>Für Ihre Bestellung <strong>#${order.orderNumber}</strong> steht noch die Zahlung aus.</p>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Artikel:</strong> ${order.watch.title}</p>
          <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${order.totalAmount.toFixed(2)}</p>
          <p style="margin: 8px 0 0 0; color: ${urgencyColor};"><strong>Zahlungsfrist:</strong> ${order.paymentDeadline ? new Date(order.paymentDeadline).toLocaleDateString('de-CH') : 'Nicht gesetzt'} (${daysRemaining > 0 ? `noch ${daysRemaining} Tag${daysRemaining !== 1 ? 'e' : ''}` : 'ABGELAUFEN'})</p>
        </div>

        ${daysRemaining <= 3 ? `
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #dc2626; margin: 0;">
              <strong>⚠️ Achtung:</strong> Ohne Zahlung wird die Bestellung automatisch storniert und der Artikel wieder freigegeben.
            </p>
          </div>
        ` : ''}

        <p>Bitte überweisen Sie den Betrag an ${sellerName} oder kontaktieren Sie den Verkäufer, falls es Probleme gibt.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/my-watches/buying/orders/${order.id}" 
             style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Bestellung ansehen
          </a>
        </div>
      </div>

      <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
        Diese E-Mail wurde automatisch versendet. Wenn Sie bereits bezahlt haben, ignorieren Sie diese Nachricht bitte.
      </p>
    </body>
    </html>
  `

  const text = `
${urgencyText}: Zahlung ausstehend

Hallo ${buyerName},

Für Ihre Bestellung #${order.orderNumber} steht noch die Zahlung aus.

Artikel: ${order.watch.title}
Betrag: CHF ${order.totalAmount.toFixed(2)}
Zahlungsfrist: ${order.paymentDeadline ? new Date(order.paymentDeadline).toLocaleDateString('de-CH') : 'Nicht gesetzt'}

${daysRemaining <= 3 ? 'ACHTUNG: Ohne Zahlung wird die Bestellung automatisch storniert!' : ''}

Bitte überweisen Sie den Betrag an den Verkäufer.

Bestellung ansehen: ${BASE_URL}/my-watches/buying/orders/${order.id}

Ihr Helvenda-Team
  `

  await sendEmail({
    to: order.buyer.email,
    subject,
    html,
    text,
  })

  // Update reminder count
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentReminderSentAt: new Date(),
      paymentReminderCount: { increment: 1 },
    },
  })

  console.log(`[email-orders] ✅ Zahlungserinnerung #${reminderNumber} gesendet an ${order.buyer.email} für Order ${order.orderNumber}`)
}

/**
 * Sendet Benachrichtigung über automatische Stornierung
 */
export async function sendAutoCancellationEmail(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      watch: {
        select: { title: true, brand: true, model: true },
      },
      buyer: {
        select: { email: true, name: true, firstName: true, nickname: true },
      },
      seller: {
        select: { email: true, name: true, firstName: true, nickname: true },
      },
    },
  })

  if (!order) {
    throw new Error('Order nicht gefunden')
  }

  const buyerName = order.buyer.nickname || order.buyer.firstName || order.buyer.name || 'Käufer'
  const sellerName = order.seller.nickname || order.seller.firstName || order.seller.name || 'Verkäufer'

  // E-Mail an Käufer
  const buyerSubject = `Bestellung #${order.orderNumber} wurde storniert`
  const buyerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #dc2626; color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">Bestellung storniert</h2>
      </div>

      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hallo ${buyerName},</p>
        
        <p>Ihre Bestellung <strong>#${order.orderNumber}</strong> wurde automatisch storniert.</p>

        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Grund:</strong> ${reason}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Artikel:</strong> ${order.watch.title}</p>
          <p style="margin: 8px 0 0 0;"><strong>Betrag:</strong> CHF ${order.totalAmount.toFixed(2)}</p>
        </div>

        <p>Der Artikel wurde wieder für andere Käufer freigegeben. Falls Sie noch Interesse haben, können Sie den Artikel erneut kaufen.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/products/${order.watchId}" 
             style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Artikel erneut ansehen
          </a>
        </div>
      </div>
    </body>
    </html>
  `

  // E-Mail an Verkäufer
  const sellerSubject = `Bestellung #${order.orderNumber} - Käufer hat nicht bezahlt`
  const sellerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f59e0b; color: white; padding: 16px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">Bestellung storniert - Keine Zahlung</h2>
      </div>

      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hallo ${sellerName},</p>
        
        <p>Die Bestellung <strong>#${order.orderNumber}</strong> wurde automatisch storniert, da der Käufer nicht innerhalb der Zahlungsfrist bezahlt hat.</p>

        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Artikel:</strong> ${order.watch.title}</p>
          <p style="margin: 8px 0 0 0;"><strong>Käufer:</strong> ${buyerName}</p>
        </div>

        <p>Ihr Artikel wurde automatisch wieder für andere Käufer freigegeben.</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${BASE_URL}/my-watches/selling/active" 
             style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Meine Angebote ansehen
          </a>
        </div>
      </div>
    </body>
    </html>
  `

  // Beide E-Mails senden
  await Promise.all([
    sendEmail({ to: order.buyer.email, subject: buyerSubject, html: buyerHtml, text: buyerSubject }),
    sendEmail({ to: order.seller.email, subject: sellerSubject, html: sellerHtml, text: sellerSubject }),
  ])

  console.log(`[email-orders] ✅ Stornierungsbenachrichtigungen gesendet für Order ${order.orderNumber}`)
}
