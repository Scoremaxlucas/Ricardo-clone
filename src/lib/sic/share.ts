import { SIC_BRAND_NAME, sicVerifyUrl } from '@/lib/sic/config'

/** Kurztext zum Beilegen: Code + Prüf-URL, ohne Screenshot-QR. */
export function sicVerifyShareText(code: string): string {
  return `${SIC_BRAND_NAME} ${code}\n${sicVerifyUrl(code)}`
}

export function sicVerifyMailtoHref(code: string): string {
  const subject = `Mieter-Zertifikat ${code}`
  const body = `Zur Prüfung:\n${sicVerifyUrl(code)}`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function sicVerifyWhatsAppHref(code: string): string {
  return `https://wa.me/?text=${encodeURIComponent(sicVerifyShareText(code))}`
}
