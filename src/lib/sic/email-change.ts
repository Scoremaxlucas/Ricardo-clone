import { prisma } from '@/lib/prisma'
import { sicPaths, sicUrl } from '@/lib/sic/config'
import { generateSicMagicToken } from '@/lib/sic/magic-link'
import { normalizeEmail } from '@/lib/sic/session'

/** Kurzlebige Bestätigung der neuen Adresse — gleiches Fenster wie der Anmeldelink. */
export const SIC_EMAIL_CHANGE_TTL_MINUTES = 30

export const SIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type SicEmailChangeRequestError = 'invalid' | 'same' | 'already_changed' | 'taken' | 'not_found'

export type SicEmailChangeConfirmError = 'invalid' | 'taken'

const REQUEST_MESSAGES: Record<SicEmailChangeRequestError, string> = {
  invalid: 'Bitte eine gültige E-Mail-Adresse angeben.',
  same: 'Das ist bereits deine aktuelle Adresse.',
  already_changed: 'Die E-Mail-Adresse wurde bereits einmal geändert.',
  taken: 'Diese Adresse ist bereits mit einem Zertifikat verknüpft.',
  not_found: 'Kein Zertifikat gefunden.',
}

const CONFIRM_MESSAGES: Record<SicEmailChangeConfirmError, string> = {
  invalid: 'Dieser Link ist ungültig oder abgelaufen.',
  taken: 'Diese Adresse ist bereits mit einem Zertifikat verknüpft.',
}

export function sicEmailChangeRequestMessage(code: SicEmailChangeRequestError): string {
  return REQUEST_MESSAGES[code]
}

export function sicEmailChangeConfirmMessage(code: SicEmailChangeConfirmError): string {
  return CONFIRM_MESSAGES[code]
}

export function canChangeSicEmail(emailChangedAt: Date | null | undefined): boolean {
  return !emailChangedAt
}

export function sicPendingEmailChangeStatus(
  row: {
    pendingEmail: string | null
    pendingEmailToken: string | null
    pendingEmailExpiresAt: Date | null
  } | null,
  now = new Date()
): 'valid' | 'invalid' {
  if (!row?.pendingEmail || !row.pendingEmailToken || !row.pendingEmailExpiresAt) return 'invalid'
  if (row.pendingEmailExpiresAt.getTime() <= now.getTime()) return 'invalid'
  return 'valid'
}

export function buildSicEmailChangeConfirmUrl(token: string): string {
  const url = new URL(sicUrl(sicPaths.emailConfirm))
  url.searchParams.set('token', token)
  return url.toString()
}

export function evaluateSicEmailChangeRequest(opts: {
  currentEmail: string
  newEmailRaw: string
  emailChangedAt: Date | null
  takenByOther: boolean
}): { ok: true; email: string } | { ok: false; code: SicEmailChangeRequestError } {
  const email = normalizeEmail(opts.newEmailRaw)
  if (!SIC_EMAIL_RE.test(email)) return { ok: false, code: 'invalid' }
  if (email === normalizeEmail(opts.currentEmail)) return { ok: false, code: 'same' }
  if (!canChangeSicEmail(opts.emailChangedAt)) return { ok: false, code: 'already_changed' }
  if (opts.takenByOther) return { ok: false, code: 'taken' }
  return { ok: true, email }
}

export function evaluateSicEmailChangeConfirm(opts: {
  pendingEmail: string | null
  pendingEmailExpiresAt: Date | null
  emailChangedAt: Date | null
  takenByOther: boolean
  now?: Date
}): { ok: true; email: string } | { ok: false; code: SicEmailChangeConfirmError } {
  const now = opts.now ?? new Date()
  if (!canChangeSicEmail(opts.emailChangedAt)) return { ok: false, code: 'invalid' }
  if (!opts.pendingEmail || !opts.pendingEmailExpiresAt) return { ok: false, code: 'invalid' }
  if (opts.pendingEmailExpiresAt.getTime() <= now.getTime()) return { ok: false, code: 'invalid' }
  if (opts.takenByOther) return { ok: false, code: 'taken' }
  return { ok: true, email: normalizeEmail(opts.pendingEmail) }
}

class EmailTakenError extends Error {
  readonly code = 'taken' as const
}

export async function requestSicEmailChange(opts: {
  currentEmail: string
  newEmailRaw: string
  now?: Date
}): Promise<
  | { ok: true; pendingEmail: string; confirmUrl: string }
  | { ok: false; code: SicEmailChangeRequestError }
> {
  const now = opts.now ?? new Date()
  const currentEmail = normalizeEmail(opts.currentEmail)

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: currentEmail },
    select: {
      id: true,
      email: true,
      emailChangedAt: true,
    },
  })
  if (!cert) return { ok: false, code: 'not_found' }

  const nextEmail = normalizeEmail(opts.newEmailRaw)
  const taken =
    SIC_EMAIL_RE.test(nextEmail) && nextEmail !== cert.email ?
      await prisma.sicCertificate.findFirst({
        where: {
          id: { not: cert.id },
          OR: [
            { email: nextEmail },
            { pendingEmail: nextEmail, pendingEmailExpiresAt: { gt: now } },
          ],
        },
        select: { id: true },
      })
    : null

  const evaluated = evaluateSicEmailChangeRequest({
    currentEmail: cert.email,
    newEmailRaw: opts.newEmailRaw,
    emailChangedAt: cert.emailChangedAt,
    takenByOther: !!taken,
  })
  if (!evaluated.ok) return evaluated

  const token = generateSicMagicToken()
  const expiresAt = new Date(now.getTime() + SIC_EMAIL_CHANGE_TTL_MINUTES * 60_000)

  await prisma.sicCertificate.update({
    where: { id: cert.id },
    data: {
      pendingEmail: evaluated.email,
      pendingEmailToken: token,
      pendingEmailExpiresAt: expiresAt,
    },
  })

  return {
    ok: true,
    pendingEmail: evaluated.email,
    confirmUrl: buildSicEmailChangeConfirmUrl(token),
  }
}

export async function peekSicEmailChange(tokenRaw: string): Promise<'valid' | 'invalid'> {
  const token = (tokenRaw ?? '').trim()
  if (!token) return 'invalid'
  const row = await prisma.sicCertificate.findUnique({
    where: { pendingEmailToken: token },
    select: {
      pendingEmail: true,
      pendingEmailToken: true,
      pendingEmailExpiresAt: true,
      emailChangedAt: true,
    },
  })
  if (row?.emailChangedAt) return 'invalid'
  return sicPendingEmailChangeStatus(row)
}

export async function confirmSicEmailChange(
  tokenRaw: string,
  now = new Date()
): Promise<{ ok: true; email: string } | { ok: false; code: SicEmailChangeConfirmError }> {
  const token = (tokenRaw ?? '').trim()
  if (!token) return { ok: false, code: 'invalid' }

  const cert = await prisma.sicCertificate.findUnique({
    where: { pendingEmailToken: token },
    select: {
      id: true,
      email: true,
      pendingEmail: true,
      pendingEmailExpiresAt: true,
      emailChangedAt: true,
    },
  })
  if (!cert) return { ok: false, code: 'invalid' }

  const clash = cert.pendingEmail
    ? await prisma.sicCertificate.findFirst({
        where: { email: normalizeEmail(cert.pendingEmail), id: { not: cert.id } },
        select: { id: true },
      })
    : null

  const evaluated = evaluateSicEmailChangeConfirm({
    pendingEmail: cert.pendingEmail,
    pendingEmailExpiresAt: cert.pendingEmailExpiresAt,
    emailChangedAt: cert.emailChangedAt,
    takenByOther: !!clash,
    now,
  })
  if (!evaluated.ok) return evaluated

  const oldEmail = cert.email
  try {
    await prisma.$transaction(async tx => {
      const stillTaken = await tx.sicCertificate.findFirst({
        where: { email: evaluated.email, id: { not: cert.id } },
        select: { id: true },
      })
      if (stillTaken) throw new EmailTakenError()

      const updated = await tx.sicCertificate.updateMany({
        where: {
          id: cert.id,
          pendingEmailToken: token,
          emailChangedAt: null,
        },
        data: {
          email: evaluated.email,
          emailChangedAt: now,
          pendingEmail: null,
          pendingEmailToken: null,
          pendingEmailExpiresAt: null,
        },
      })
      if (updated.count !== 1) throw new Error('email-change-race')

      await tx.sicPayment.updateMany({
        where: { certificateId: cert.id },
        data: { email: evaluated.email },
      })
      await tx.sicMagicLink.updateMany({
        where: { email: oldEmail, consumedAt: null },
        data: { consumedAt: now },
      })
    })
  } catch (err) {
    if (err instanceof EmailTakenError) return { ok: false, code: 'taken' }
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
    if (code === 'P2002') return { ok: false, code: 'taken' }
    return { ok: false, code: 'invalid' }
  }

  return { ok: true, email: evaluated.email }
}
