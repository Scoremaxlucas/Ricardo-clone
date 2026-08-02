import { randomInt } from 'crypto'

/** Zeichen ohne verwechselbare (0/O, 1/I) für gut lesbare Codes. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_BODY_LENGTH = 8

/** Format: SIC-YYYY-XXXXXXXX */
export const SIC_CODE_PREFIX = 'SIC'
const SIC_CODE_RE = /^SIC-(\d{4})-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/

export function generateSicCertificateCode(year = new Date().getFullYear()): string {
  const body = Array.from({ length: CODE_BODY_LENGTH }, () => CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)]).join('')
  return `${SIC_CODE_PREFIX}-${year}-${body}`
}

export function normalizeSicCertificateCode(raw: string | null | undefined): string {
  return (raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export function isValidSicCertificateCode(raw: string | null | undefined): boolean {
  return SIC_CODE_RE.test(normalizeSicCertificateCode(raw))
}
