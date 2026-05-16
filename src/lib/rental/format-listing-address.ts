/** Street / locality parts that must not appear in UI or emails. */
function sanitizeAddressPart(part: string | null | undefined): string {
  if (part == null) return ''
  const t = String(part).trim()
  if (!t) return ''
  const low = t.toLowerCase()
  if (low === 'null' || low === 'undefined') return ''
  return t
}

/**
 * Formats rental listing address for display (omits empty street, never shows literal "null").
 */
export function formatRentalListingAddress(parts: {
  address?: string | null
  zip?: string | null
  city?: string | null
}): string {
  const street = sanitizeAddressPart(parts.address)
  const zip = sanitizeAddressPart(parts.zip)
  const city = sanitizeAddressPart(parts.city)
  const locality = [zip, city].filter(Boolean).join(' ')
  if (street && locality) return `${street}, ${locality}`
  if (locality) return locality
  if (street) return street
  return '—'
}
