import { prisma } from '@/lib/prisma'
import { sicLog } from '@/lib/sic/log'
import type { SicEventKind, SicModuleKind } from '@prisma/client'
import { createHash } from 'crypto'

/**
 * Funnel-Ereignisse als Datensätze — Logzeilen lassen sich nicht abfragen.
 * Aus diesen fünf Punkten fallen die Zahlen, die zählen: wie viele fertig
 * werden, wie lange es wirklich dauert, und wie oft ein Vermieter scannt.
 *
 * Schreibfehler dürfen keinen Nutzerpfad brechen: alles best effort.
 */
export async function recordSicEvent(input: {
  kind: SicEventKind
  certificateId?: string | null
  email?: string | null
  moduleKind?: SicModuleKind | null
  meta?: Record<string, unknown>
}): Promise<void> {
  sicLog(`sic.event.${input.kind.toLowerCase()}`, {
    certificateId: input.certificateId ?? null,
    moduleKind: input.moduleKind ?? null,
    ...(input.meta ?? {}),
  })
  try {
    await prisma.sicEvent.create({
      data: {
        kind: input.kind,
        certificateId: input.certificateId ?? null,
        email: input.email ?? null,
        moduleKind: input.moduleKind ?? null,
        meta: input.meta ? (input.meta as object) : undefined,
      },
    })
  } catch (err) {
    console.error('[sic/events] write failed', err)
  }
}

/** Nur einmal pro Zertifikat — für «erster Upload», «erster Download». */
export async function recordSicEventOnce(input: {
  kind: SicEventKind
  certificateId: string
  email?: string | null
  moduleKind?: SicModuleKind | null
  meta?: Record<string, unknown>
}): Promise<void> {
  try {
    const existing = await prisma.sicEvent.findFirst({
      where: { kind: input.kind, certificateId: input.certificateId },
      select: { id: true },
    })
    if (existing) return
  } catch (err) {
    console.error('[sic/events] once lookup failed', err)
    return
  }
  await recordSicEvent(input)
}

function dayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/**
 * Der IPv4-Raum ist klein genug, dass ein reiner Hash rückrechenbar wäre.
 * Deshalb mit Serverschlüssel und Tagesdatum salzen: der Wert taugt zum
 * Entdoppeln innerhalb eines Tages und ist danach kein Personenbezug mehr.
 */
function hashIp(ip: string, day: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.CRON_SECRET ?? 'sic-dev'
  return createHash('sha256').update(`${secret}:${day}:${ip}`).digest('hex').slice(0, 32)
}

/**
 * Zählt einen Scan der Prüfseite, entdoppelt pro Zertifikat, Tag und IP.
 * Aufrufe des Inhabers selbst zählen nicht — sonst misst die Zahl nur, wie oft
 * jemand sein eigenes Zertifikat anschaut.
 */
export async function recordSicVerifyScan(opts: {
  certificateId: string
  ip: string
  byHolder: boolean
}): Promise<{ counted: boolean }> {
  if (opts.byHolder) return { counted: false }
  const day = dayKey()
  const key = { certificateId: opts.certificateId, dayKey: day, ipHash: hashIp(opts.ip, day) }
  try {
    await prisma.sicVerifyScan.create({ data: key })
  } catch {
    // Unique-Verletzung: heute von dieser IP schon gezählt.
    return { counted: false }
  }
  try {
    await prisma.sicCertificate.update({
      where: { id: opts.certificateId },
      data: { verificationCount: { increment: 1 }, lastVerifiedAt: new Date() },
    })
  } catch (err) {
    console.error('[sic/events] scan counter failed', err)
  }
  await recordSicEvent({
    kind: 'VERIFY_SCANNED',
    certificateId: opts.certificateId,
  })
  return { counted: true }
}
