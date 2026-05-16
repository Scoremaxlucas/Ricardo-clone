import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

export const LANDLORD_LEAD_TOKEN_TTL_DAYS = 45
/** Nach dieser Frist ohne Vermieter-Antwort informiert Helvenda den Mieter transparent. */
export const LANDLORD_NO_RESPONSE_NOTIFY_DAYS = 5

export function generateLandlordLeadTokenValue(): string {
  return randomBytes(32).toString('base64url')
}

export function landlordLeadRespondUrl(token: string): string {
  const base = WOHNEN_SITE_ORIGIN.replace(/\/$/, '')
  return `${base}/lead/${encodeURIComponent(token)}`
}

export function landlordLeadTokenExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + LANDLORD_LEAD_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}

/** Stellt sicher, dass ein gültiger Magic-Link für die Vermieter-Antwort existiert. */
export async function ensureLandlordLeadToken(applicationId: string): Promise<string> {
  const app = await prisma.rentalApplication.findUnique({
    where: { id: applicationId },
    select: { landlordLeadToken: true, landlordLeadTokenExpiresAt: true },
  })
  if (!app) throw new Error('Bewerbung nicht gefunden')

  const now = Date.now()
  if (
    app.landlordLeadToken &&
    app.landlordLeadTokenExpiresAt &&
    app.landlordLeadTokenExpiresAt.getTime() > now
  ) {
    return app.landlordLeadToken
  }

  const token = generateLandlordLeadTokenValue()
  const expiresAt = landlordLeadTokenExpiresAt()
  await prisma.rentalApplication.update({
    where: { id: applicationId },
    data: { landlordLeadToken: token, landlordLeadTokenExpiresAt: expiresAt },
  })
  return token
}

export async function findApplicationByLandlordLeadToken(token: string) {
  const t = token.trim()
  if (!t || t.length < 16) return null
  const app = await prisma.rentalApplication.findFirst({
    where: { landlordLeadToken: t },
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
      tenantProfile: {
        select: {
          firstName: true,
          lastName: true,
          employmentStatus: true,
          employer: true,
          jobTitle: true,
          employedSince: true,
          monthlyIncomeCategory: true,
          householdTotalPersons: true,
          householdChildrenCount: true,
          creditCheckResult: true,
          contactPhone: true,
          applicationEmail: true,
        },
      },
      applicant: { select: { email: true, phone: true } },
    },
  })
  if (!app) return null
  if (!app.landlordLeadTokenExpiresAt || app.landlordLeadTokenExpiresAt.getTime() < Date.now()) {
    return { expired: true as const, application: app }
  }
  return { expired: false as const, application: app }
}
