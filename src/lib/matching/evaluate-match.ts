import { petsAllowed } from './landlord-rules'
import type {
  EvaluateMatchResult,
  LandlordMatchingRules,
  MatchReasonLine,
  PropertyMatchingInput,
  SeekerMatchingInput,
} from './types'

function normCanton(c: string): string {
  return c.trim().toUpperCase()
}

function normZip(z: string): string {
  return z.trim()
}

/** PLZ-Liste aus Komma-String; leer = kein PLZ-Zwang */
export function parsePostalCodesList(raw: string | null): string[] {
  if (raw == null || !raw.trim()) return []
  return raw
    .split(/[,;\s]+/)
    .map(normZip)
    .filter(Boolean)
}

/**
 * Regelbasiertes Matching: harte Ausschlüsse + einfacher Score (0–100).
 * Pure function — keine I/O.
 */
export function evaluateMatch(
  seeker: SeekerMatchingInput,
  property: PropertyMatchingInput,
  rules: LandlordMatchingRules = {}
): EvaluateMatchResult {
  const reasons: MatchReasonLine[] = []

  if (property.status !== 'active') {
    reasons.push({
      kind: 'hard',
      code: 'PROPERTY_NOT_ACTIVE',
      detail: `Status ist ${property.status}, nicht active.`,
    })
    return { score: 0, hardFailed: true, reasons }
  }

  // —— Hart: Kanton ——
  if (seeker.cantonPreference) {
    const want = normCanton(seeker.cantonPreference)
    const got = normCanton(property.canton)
    if (want && got !== want) {
      reasons.push({
        kind: 'hard',
        code: 'CANTON_MISMATCH',
        detail: `Gesucht ${want}, Objekt ${got}.`,
      })
      return { score: 0, hardFailed: true, reasons }
    }
  }

  // —— Hart: PLZ-Liste ——
  const zips = parsePostalCodesList(seeker.postalCodesWanted)
  if (zips.length > 0) {
    const pz = normZip(property.zip)
    if (!zips.includes(pz)) {
      reasons.push({
        kind: 'hard',
        code: 'POSTAL_CODE_NOT_IN_LIST',
        detail: `Objekt-PLZ ${pz} nicht in [${zips.join(', ')}].`,
      })
      return { score: 0, hardFailed: true, reasons }
    }
  }

  // —— Hart: Budget ——
  const rent = property.rentPerMonth
  if (seeker.budgetMax != null && rent > seeker.budgetMax) {
    reasons.push({
      kind: 'hard',
      code: 'BUDGET_MAX_EXCEEDED',
      detail: `Miete ${rent} > budgetMax ${seeker.budgetMax}.`,
    })
    return { score: 0, hardFailed: true, reasons }
  }
  if (seeker.budgetMin != null && rent < seeker.budgetMin) {
    reasons.push({
      kind: 'hard',
      code: 'BUDGET_MIN_NOT_MET',
      detail: `Miete ${rent} < budgetMin ${seeker.budgetMin}.`,
    })
    return { score: 0, hardFailed: true, reasons }
  }

  // —— Hart: Zimmer ——
  const rooms = property.rooms
  if (seeker.minRooms != null && rooms + 1e-9 < seeker.minRooms) {
    reasons.push({
      kind: 'hard',
      code: 'ROOMS_BELOW_MIN',
      detail: `Objekt ${rooms} Zi. < minRooms ${seeker.minRooms}.`,
    })
    return { score: 0, hardFailed: true, reasons }
  }
  if (seeker.maxRooms != null && rooms - 1e-9 > seeker.maxRooms) {
    reasons.push({
      kind: 'hard',
      code: 'ROOMS_ABOVE_MAX',
      detail: `Objekt ${rooms} Zi. > maxRooms ${seeker.maxRooms}.`,
    })
    return { score: 0, hardFailed: true, reasons }
  }

  // —— Hart: Einzug (nur wenn Objekt-Datum und Suchfenster gesetzt) ——
  const avail = property.availableFrom
  if (avail) {
    const t = avail.getTime()
    if (seeker.moveInLatest != null && t > seeker.moveInLatest.getTime()) {
      reasons.push({
        kind: 'hard',
        code: 'MOVE_IN_TOO_LATE',
        detail: `Verfügbar ab ${avail.toISOString()} liegt nach moveInLatest.`,
      })
      return { score: 0, hardFailed: true, reasons }
    }
    if (seeker.moveInEarliest != null && t < seeker.moveInEarliest.getTime()) {
      reasons.push({
        kind: 'hard',
        code: 'MOVE_IN_TOO_EARLY',
        detail: `Verfügbar ab ${avail.toISOString()} liegt vor moveInEarliest.`,
      })
      return { score: 0, hardFailed: true, reasons }
    }
  }

  // —— Hart: Haustiere ——
  if (seeker.hasPets && !petsAllowed(rules)) {
    reasons.push({
      kind: 'hard',
      code: 'PETS_NOT_ALLOWED',
      detail: 'Vermieter-Regeln erlauben keine Haustiere.',
    })
    return { score: 0, hardFailed: true, reasons }
  }

  // —— Weich: Score ——
  let score = 55

  if (seeker.cantonPreference && normCanton(seeker.cantonPreference) === normCanton(property.canton)) {
    score += 15
    reasons.push({ kind: 'soft', code: 'CANTON_MATCH', detail: 'Kanton passt.' })
  }

  if (seeker.budgetMax != null && rent <= seeker.budgetMax) {
    const headroom = seeker.budgetMax - rent
    const bonus = Math.min(15, Math.floor(headroom / 200))
    score += bonus
    if (bonus > 0) {
      reasons.push({
        kind: 'soft',
        code: 'BUDGET_HEADROOM',
        detail: `Unter budgetMax, Puffer ca. CHF ${headroom}.`,
      })
    }
  }

  if (seeker.minRooms != null || seeker.maxRooms != null) {
    const min = seeker.minRooms ?? rooms
    const max = seeker.maxRooms ?? rooms
    const mid = (min + max) / 2
    const spread = Math.max(0.5, (max - min) / 2)
    const fit = 1 - Math.min(1, Math.abs(rooms - mid) / spread)
    const add = Math.round(10 * fit)
    score += add
    if (add > 0) {
      reasons.push({ kind: 'soft', code: 'ROOMS_FIT', detail: `Zimmerpassung ~${add}/10.` })
    }
  }

  if (seeker.hasPets && petsAllowed(rules)) {
    score += 5
    reasons.push({ kind: 'soft', code: 'PETS_ALLOWED', detail: 'Haustiere laut Regeln erlaubt.' })
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  return { score, hardFailed: false, reasons }
}
