import { getSicModule, SIC_MODULES, type SicModuleId } from '@/lib/sic/modules'

const DAY_MS = 24 * 60 * 60 * 1000

/** Selbst beschaffbar (Betreibungsauszug, Ausweis): Erinnerung am nächsten Tag. */
export const SIC_UPLOAD_NUDGE_SELF_DAYS = 1
/** Unterschrift Dritter (Arbeitgeber, Vermieter): ~3 Tage Zeit lassen. */
export const SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS = 3
/** Danach höchstens wöchentlich erneut. */
export const SIC_UPLOAD_NUDGE_REPEAT_DAYS = 7

export function sicUploadNudgeDelayDays(moduleKind: SicModuleId): number {
  return getSicModule(moduleKind).selfObtainable
    ? SIC_UPLOAD_NUDGE_SELF_DAYS
    : SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS
}

/** Zwei Prisma-Fenster: Selbstbeschaffung vs. Drittunterschrift. */
export function sicUploadNudgeWindows(now: Date): {
  moduleKinds: SicModuleId[]
  paidBefore: Date
}[] {
  return [
    {
      moduleKinds: SIC_MODULES.filter(m => m.selfObtainable).map(m => m.id),
      paidBefore: new Date(now.getTime() - SIC_UPLOAD_NUDGE_SELF_DAYS * DAY_MS),
    },
    {
      moduleKinds: SIC_MODULES.filter(m => !m.selfObtainable).map(m => m.id),
      paidBefore: new Date(now.getTime() - SIC_UPLOAD_NUDGE_THIRD_PARTY_DAYS * DAY_MS),
    },
  ]
}

export function sicUploadNudgeRepeatAfter(now: Date): Date {
  return new Date(now.getTime() - SIC_UPLOAD_NUDGE_REPEAT_DAYS * DAY_MS)
}
