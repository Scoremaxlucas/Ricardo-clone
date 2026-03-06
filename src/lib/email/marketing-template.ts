/**
 * Marketing Email Template with Product Cards
 *
 * Generates Ricardo-style marketing emails with product previews.
 * Uses table-based layout for email client compatibility.
 */

import { getEmailBaseUrl } from './config'
import { getMarketingUnsubscribeUrl } from './marketing-unsubscribe'
import { sanitizeEmailUrl } from './url-safety'

export interface ProductCard {
  id: string
  title: string
  price: number
  imageUrl: string | null
  brand: string
  articleNumber?: number | null
}

/**
 * Build the product cards HTML (2-column table layout, email-client safe)
 */
function buildProductCardsHtml(products: ProductCard[], baseUrl: string): string {
  if (products.length === 0) return ''

  const rows: string[] = []

  for (let i = 0; i < products.length; i += 2) {
    const left = products[i]
    const right = products[i + 1]

    const productLink = (p: ProductCard) =>
      `${baseUrl}/products/${p.articleNumber || p.id}`

    const cardHtml = (p: ProductCard) => `
      <td width="50%" style="padding: 4px; vertical-align: top;">
        <a href="${productLink(p)}" style="text-decoration: none; color: inherit; display: block;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; background: #ffffff;">
            <tr>
              <td style="padding: 0; text-align: center; background: #f9fafb; height: 100px;">
                ${
                  p.imageUrl
                    ? `<img src="${p.imageUrl}" alt="${p.title}" width="100%" style="display: block; max-height: 100px; object-fit: cover; border-radius: 6px 6px 0 0;" />`
                    : `<div style="height: 100px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px;">Kein Bild</div>`
                }
              </td>
            </tr>
            <tr>
              <td style="padding: 8px;">
                <p style="margin: 0 0 2px 0; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">${p.brand}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #1f2937; line-height: 1.2; max-height: 30px; overflow: hidden;">${p.title}</p>
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f766e;">CHF ${p.price.toFixed(0)}</p>
              </td>
            </tr>
          </table>
        </a>
      </td>`

    rows.push(`
      <tr>
        ${cardHtml(left)}
        ${right ? cardHtml(right) : '<td width="50%" style="padding: 8px;"></td>'}
      </tr>`)
  }

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0 8px 0;">
      <tr>
        <td>
          <p style="font-size: 15px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0; text-align: center;">
            Aktuelle Angebote auf Helvenda.ch
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${rows.join('')}
          </table>
        </td>
      </tr>
    </table>`
}

/**
 * Build a complete marketing email with product previews
 */
export function buildMarketingEmailWithProducts(
  subject: string,
  introText: string,
  products: ProductCard[],
  recipientEmail?: string,
  customButtonText?: string,
  customButtonUrl?: string,
): string {
  const baseUrl = getEmailBaseUrl()

  const productCardsHtml = buildProductCardsHtml(products, baseUrl)

  const introHtml = introText
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #0f766e; text-decoration: underline;">$1</a>')
    .replace(/\n/g, '<br>')

  const btnText = customButtonText || 'Alle Angebote entdecken'
  const btnUrl = sanitizeEmailUrl(customButtonUrl, `${baseUrl}/search`)
  const ctaButton = `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${btnUrl}" style="display: inline-block; background-color: #0f766e; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 16px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
        ${btnText}
      </a>
    </div>`

  let unsubscribeHtml = ''
  if (recipientEmail) {
    try {
      const url = getMarketingUnsubscribeUrl(recipientEmail)
      unsubscribeHtml = `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Sie möchten keine Marketing-E-Mails mehr erhalten?
            <a href="${url}" style="color: #9ca3af; text-decoration: underline; font-size: 12px;">Abmelden</a>
          </p>
        </div>`
    } catch {
      // Silently fail
    }
  }

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
    }
    a { color: #0f766e; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .product-cell { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="background-color: #f3f4f6; padding: 0; margin: 0;">
  <div style="background-color: #f3f4f6; padding: 40px 20px;">
    <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
      <!-- Header -->
      <tr>
        <td style="background-color: #ffffff; padding: 40px 30px 30px 30px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <td style="padding-right: 10px; vertical-align: middle;">
                <div style="width: 40px; height: 40px; background-color: #0f766e; border-radius: 8px; text-align: center; line-height: 40px;">
                  <span style="color: #ffffff; font-size: 20px; font-weight: 700;">H</span>
                </div>
              </td>
              <td style="vertical-align: middle;">
                <span style="color: #111827; font-size: 24px; font-weight: 700;">Helvenda</span>
                <span style="color: #6b7280; font-size: 14px;">.ch</span>
              </td>
            </tr>
          </table>
          <p style="font-size: 14px; color: #6b7280; margin-top: 8px;">Schweizer Online-Marktplatz</p>
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 16px; text-align: center;">${subject}</h2>

          <div style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 8px; text-align: left;">
            ${introHtml}
          </div>

          ${productCardsHtml}

          ${ctaButton}

          <p style="margin-top: 30px; font-size: 14px; color: #9ca3af; line-height: 1.6; text-align: center;">
            Falls Sie Fragen haben, kontaktieren Sie uns unter
            <a href="mailto:support@helvenda.ch" style="color: #0f766e; text-decoration: none;">support@helvenda.ch</a>.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">
            Diese E-Mail wurde von <a href="${baseUrl}" style="color: #0f766e; text-decoration: none;">Helvenda.ch</a> gesendet.
          </p>
          <p style="font-size: 12px; color: #9ca3af;">
            Helvenda - Ihr vertrauensvoller Marktplatz für Artikel in der Schweiz.
          </p>
          ${unsubscribeHtml}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`.trim()
}
