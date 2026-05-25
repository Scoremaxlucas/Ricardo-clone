const FORBIDDEN_RENTAL_IMPORT_SOURCES = [
  { suffix: 'homegate.ch', label: 'Homegate' },
  { suffix: 'immoscout24.ch', label: 'ImmoScout24' },
] as const

export type ForbiddenRentalImportSource = {
  host: string
  label: string
}

function matchesHostSuffix(host: string, suffix: string): boolean {
  return host === suffix || host.endsWith(`.${suffix}`)
}

export function getForbiddenRentalImportSource(rawUrl: string): ForbiddenRentalImportSource | null {
  try {
    const url = new URL(rawUrl.trim())
    const host = url.hostname.toLowerCase()
    const match = FORBIDDEN_RENTAL_IMPORT_SOURCES.find(source => matchesHostSuffix(host, source.suffix))
    if (!match) return null
    return { host, label: match.label }
  } catch {
    return null
  }
}

export function rentalImportSourcePolicyMessage(rawUrl: string): string | null {
  const blocked = getForbiddenRentalImportSource(rawUrl)
  if (!blocked) return null
  return `${blocked.label} ist für Wohnen Helvenda keine erlaubte Importquelle. Verwende nur direkte Vermieter-Unterlagen, Tutti oder öffentliche Behördenquellen.`
}
