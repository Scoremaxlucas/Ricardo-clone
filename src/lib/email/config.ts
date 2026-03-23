/**
 * Email Configuration
 *
 * Zentrale Konfiguration für E-Mail-Versand
 */

import nodemailer from 'nodemailer'
import { Resend } from 'resend'

// Resend Client initialisieren (falls API Key vorhanden)
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// E-Mail-Transporter konfigurieren (für SMTP Fallback)
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

/**
 * Gibt die Basis-URL für E-Mail-Links zurück
 *
 * In Produktion wird immer https://helvenda.ch verwendet.
 * In Development wird localhost verwendet.
 */
export function getEmailBaseUrl(): string {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://helvenda.ch'
  }
  const candidate = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'
  try {
    const parsed = new URL(candidate)
    const host = parsed.hostname.toLowerCase()
    // In non-production we allow localhost for local testing.
    if (host === 'localhost' || host === '127.0.0.1') {
      return candidate
    }
    // Any non-local invalid host falls back to canonical domain for safety.
    if (host === 'helvenda.ch' || host === 'www.helvenda.ch' || host.endsWith('.helvenda.ch')) {
      return candidate
    }
    return 'https://helvenda.ch'
  } catch {
    return 'https://helvenda.ch'
  }
}

// Absender-E-Mail
export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || 'onboarding@resend.dev'
}
