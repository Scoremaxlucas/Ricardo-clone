import type { SicEventKind } from '@prisma/client'

export const SIC_FUNNEL_DAY_OPTIONS = [7, 30, 90] as const
export type SicFunnelDays = (typeof SIC_FUNNEL_DAY_OPTIONS)[number]

export function parseSicFunnelDays(raw: string | null): SicFunnelDays {
  const n = Number(raw)
  return SIC_FUNNEL_DAY_OPTIONS.includes(n as SicFunnelDays) ? (n as SicFunnelDays) : 30
}

export type SicFunnelEventRow = {
  kind: SicEventKind
  certificateId: string | null
  createdAt: Date
}

export type SicFunnelStep = {
  id: string
  label: string
  unique: number
  /** Anteil der Vorstufe, 0–100. Null wenn die Vorstufe 0 ist. */
  fromPreviousPct: number | null
}

export type SicFunnelView = {
  days: SicFunnelDays
  since: string
  steps: SicFunnelStep[]
  extras: {
    rejectedCertificates: number
    renewals: number
    revoked: number
    landlordScans: number
  }
  timing: {
    medianHoursPaidToUpload: number | null
    medianHoursUploadToVerified: number | null
  }
}

const FUNNEL_KINDS = [
  'CERTIFICATE_CREATED',
  'FIRST_UPLOAD',
  'MODULE_VERIFIED',
  'PDF_DOWNLOADED',
  'VERIFY_SCANNED',
] as const satisfies readonly SicEventKind[]

const STEP_META: { id: string; kind: (typeof FUNNEL_KINDS)[number]; label: string }[] = [
  { id: 'paid', kind: 'CERTIFICATE_CREATED', label: 'Bezahlt' },
  { id: 'upload', kind: 'FIRST_UPLOAD', label: 'Nachweis hochgeladen' },
  { id: 'verified', kind: 'MODULE_VERIFIED', label: 'Angabe freigegeben' },
  { id: 'pdf', kind: 'PDF_DOWNLOADED', label: 'PDF geholt' },
  { id: 'scan', kind: 'VERIFY_SCANNED', label: 'Vermieter hat gescannt' },
]

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null
  return Math.round((part / whole) * 100)
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const raw = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  return Math.round(raw * 10) / 10
}

function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 3_600_000
}

/**
 * Kohorte: wer in dem Zeitraum bezahlt hat, und wie weit diese Zertifikate
 * gekommen sind (Uploads/Scans danach zählen mit, auch nach dem Fenster).
 */
export function aggregateSicFunnel(opts: {
  days: SicFunnelDays
  since: Date
  checkoutStarted: number
  checkoutPaid: number
  created: { certificateId: string; createdAt: Date }[]
  followUp: SicFunnelEventRow[]
}): SicFunnelView {
  const createdIds = new Set(opts.created.map(c => c.certificateId))
  const firstAt = new Map<string, Partial<Record<SicEventKind, Date>>>()

  for (const row of opts.created) {
    const slot = firstAt.get(row.certificateId) ?? {}
    if (!slot.CERTIFICATE_CREATED || row.createdAt < slot.CERTIFICATE_CREATED) {
      slot.CERTIFICATE_CREATED = row.createdAt
    }
    firstAt.set(row.certificateId, slot)
  }

  for (const row of opts.followUp) {
    if (!row.certificateId || !createdIds.has(row.certificateId)) continue
    const slot = firstAt.get(row.certificateId) ?? {}
    const prev = slot[row.kind]
    if (!prev || row.createdAt < prev) slot[row.kind] = row.createdAt
    firstAt.set(row.certificateId, slot)
  }

  const reached = (kind: SicEventKind) =>
    [...firstAt.values()].filter(slot => slot[kind] != null).length

  const checkoutSteps: SicFunnelStep[] = [
    {
      id: 'checkout',
      label: 'Checkout begonnen',
      unique: opts.checkoutStarted,
      fromPreviousPct: null,
    },
    {
      id: 'paid-email',
      label: 'Zahlung eingegangen',
      unique: opts.checkoutPaid,
      fromPreviousPct: pct(opts.checkoutPaid, opts.checkoutStarted),
    },
  ]

  const uniques = STEP_META.map(meta =>
    meta.kind === 'CERTIFICATE_CREATED' ? createdIds.size : reached(meta.kind)
  )
  const certSteps: SicFunnelStep[] = STEP_META.map((meta, i) => ({
    id: meta.id,
    label: meta.label,
    unique: uniques[i],
    fromPreviousPct: i === 0 ? pct(uniques[i], opts.checkoutPaid) : pct(uniques[i], uniques[i - 1]),
  }))

  const paidToUpload: number[] = []
  const uploadToVerified: number[] = []
  for (const slot of firstAt.values()) {
    const paidAt = slot.CERTIFICATE_CREATED
    const uploadAt = slot.FIRST_UPLOAD
    const verifiedAt = slot.MODULE_VERIFIED
    if (paidAt && uploadAt && uploadAt >= paidAt) {
      paidToUpload.push(hoursBetween(paidAt, uploadAt))
    }
    if (uploadAt && verifiedAt && verifiedAt >= uploadAt) {
      uploadToVerified.push(hoursBetween(uploadAt, verifiedAt))
    }
  }

  let rejectedCertificates = 0
  let renewals = 0
  let revoked = 0
  let landlordScans = 0
  const rejected = new Set<string>()
  const renewed = new Set<string>()
  const revokedSet = new Set<string>()
  for (const row of opts.followUp) {
    if (!row.certificateId || !createdIds.has(row.certificateId)) continue
    if (row.kind === 'MODULE_REJECTED') rejected.add(row.certificateId)
    if (row.kind === 'RENEWAL_PURCHASED') renewed.add(row.certificateId)
    if (row.kind === 'CERTIFICATE_REVOKED') revokedSet.add(row.certificateId)
    if (row.kind === 'VERIFY_SCANNED') landlordScans += 1
  }
  rejectedCertificates = rejected.size
  renewals = renewed.size
  revoked = revokedSet.size

  return {
    days: opts.days,
    since: opts.since.toISOString(),
    steps: [...checkoutSteps, ...certSteps],
    extras: { rejectedCertificates, renewals, revoked, landlordScans },
    timing: {
      medianHoursPaidToUpload: median(paidToUpload),
      medianHoursUploadToVerified: median(uploadToVerified),
    },
  }
}

export function formatSicFunnelHours(hours: number | null): string {
  if (hours == null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)} Min.`
  if (hours < 48) return `${hours.toLocaleString('de-CH')} Std.`
  return `${Math.round(hours / 24)} Tage`
}
