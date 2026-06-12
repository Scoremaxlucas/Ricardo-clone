import { prisma } from '@/lib/prisma'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { randomBytes } from 'crypto'

/** Nach dieser Frist ohne Vermieter-Rückmeldung informiert Helvenda den Mieter transparent (Cron). */
export const LANDLORD_NO_RESPONSE_NOTIFY_DAYS = 5

/** Gültigkeit des Magic-Links für externe Vermieter ohne Konto. */
export const LANDLORD_LEAD_TOKEN_TTL_DAYS = 90

export function generateLandlordLeadToken(): string {
  return randomBytes(32).toString('base64url')
}

export function landlordLeadTokenExpiresAt(from = new Date()): Date {
  const d = new Date(from)
  d.setDate(d.getDate() + LANDLORD_LEAD_TOKEN_TTL_DAYS)
  return d
}

export function buildLandlordLeadUrl(token: string): string {
  const base = WOHNEN_SITE_ORIGIN.replace(/\/$/, '')
  return `${base}/vermieter/bewerbung/${encodeURIComponent(token)}`
}

export function isLandlordLeadTokenValid(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false
  return expiresAt.getTime() > Date.now()
}

/**
 * Stellt sicher, dass die Bewerbung einen gültigen Magic-Link-Token hat (rotiert bei Ablauf).
 */
export async function ensureLandlordLeadToken(applicationId: string): Promise<{ token: string; url: string }> {
  const app = await prisma.rentalApplication.findUnique({
    where: { id: applicationId },
    select: { landlordLeadToken: true, landlordLeadTokenExpiresAt: true },
  })
  if (!app) throw new Error('Bewerbung nicht gefunden')

  if (
    app.landlordLeadToken?.trim() &&
    isLandlordLeadTokenValid(app.landlordLeadTokenExpiresAt)
  ) {
    return { token: app.landlordLeadToken, url: buildLandlordLeadUrl(app.landlordLeadToken) }
  }

  const token = generateLandlordLeadToken()
  const expiresAt = landlordLeadTokenExpiresAt()
  await prisma.rentalApplication.update({
    where: { id: applicationId },
    data: { landlordLeadToken: token, landlordLeadTokenExpiresAt: expiresAt },
  })
  return { token, url: buildLandlordLeadUrl(token) }
}

export async function findApplicationByLandlordLeadToken(token: string) {
  const trimmed = token.trim()
  if (!trimmed) return null

  const app = await prisma.rentalApplication.findFirst({
    where: { landlordLeadToken: trimmed },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          zip: true,
          city: true,
          rentPerMonth: true,
          requiresCreditCheck: true,
        },
      },
      tenantProfile: true,
      applicant: { select: { email: true, phone: true, firstName: true, name: true, nickname: true } },
    },
  })

  if (!app || !isLandlordLeadTokenValid(app.landlordLeadTokenExpiresAt)) return null
  return app
}
