/**
 * Base Email Template
 *
 * Wiederverwendbares HTML-Template für alle Helvenda E-Mails
 */

import { getEmailBaseUrl } from './config'

export interface EmailTemplateOptions {
  title: string
  greeting: string
  content: string
  buttonText?: string
  buttonUrl?: string
}

/**
 * Generiert das Basis-HTML für eine Helvenda E-Mail
 */
export function getHelvendaEmailTemplate({
  title,
  greeting,
  content,
  buttonText,
  buttonUrl,
}: EmailTemplateOptions): string {
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
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);
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
    @media only screen and (max-width: 600px) {
      .header, .content { padding: 30px 20px; }
      .title { font-size: 22px; }
      .description { font-size: 15px; }
      .button { padding: 14px 32px; font-size: 15px; }
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
              <path d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="logo-text">
            <span style="color: #111827; font-size: 24px; font-weight: 700;">Helvenda</span>
            <span style="color: #6b7280; font-size: 14px;">.ch</span>
          </div>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-top: 8px;">Schweizer Online-Marktplatz</p>
      </div>

      <div class="content">
        <p class="greeting">${greeting}</p>
        <h2 class="title">${title}</h2>
        <div class="description">${content}</div>
        ${
          buttonText && buttonUrl
            ? `
        <div class="button-container">
          <a href="${buttonUrl}" class="button" style="color: #ffffff !important;">${buttonText}</a>
        </div>
        `
            : ''
        }
        <p class="support-text">
          Falls Sie Fragen haben, kontaktieren Sie uns bitte unter 
          <a href="mailto:support@helvenda.ch" class="support-link">support@helvenda.ch</a>.
        </p>
      </div>

      <div class="footer">
        <p class="footer-text">
          Diese E-Mail wurde automatisch von <a href="${baseUrl}" class="footer-link">Helvenda.ch</a> gesendet.
        </p>
        <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
          Helvenda - Ihr vertrauensvoller Marktplatz für Artikel in der Schweiz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Legacy-Wrapper für Kompatibilität mit altem Code
 */
export function getHelvendaEmailTemplateLegacy(
  title: string,
  greeting: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string
): string {
  return getHelvendaEmailTemplate({ title, greeting, content, buttonText, buttonUrl })
}
