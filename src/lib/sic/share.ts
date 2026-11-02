import { SIC_BRAND_NAME, sicVerifyUrl } from '@/lib/sic/config'

/** Kurztext zum Beilegen: Code + Prüf-URL, ohne Screenshot-QR. */
export function sicVerifyShareText(code: string): string {
  return `${SIC_BRAND_NAME} ${code}\n${sicVerifyUrl(code)}`
}

export function sicVerifyMailtoHref(code: string, _sealReady = true): string {
  // Mit oder ohne Siegel: es ist das Mieter-Zertifikat.
  const subject = `Mieter-Zertifikat ${code}`
  const body = `Mein Mieter-Zertifikat zur Prüfung:\n${sicVerifyUrl(code)}`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function sicVerifyWhatsAppHref(code: string): string {
  return `https://wa.me/?text=${encodeURIComponent(sicVerifyShareText(code))}`
}
