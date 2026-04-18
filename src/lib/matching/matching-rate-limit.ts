import { checkRateLimit } from '@/lib/rate-limit'

/** Fenster in Sekunden; Limits konservativ für Missbrauchsschutz. */
export const MATCHING_RATE_WINDOWS = {
  hour: 3600,
  fifteenMin: 900,
} as const

export async function checkMatchingPropertiesGetRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `matching:api:properties:get:${userId}`,
    limit: 180,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}

export async function checkMatchingImportPostUserRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `matching:api:import:post:user:${userId}`,
    limit: 40,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}

export async function checkMatchingImportPostIpRateLimit(ip: string) {
  return checkRateLimit({
    identifier: `matching:api:import:post:ip:${ip}`,
    limit: 120,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}

export async function checkMatchingApplicationCreateRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `matching:action:application:create:${userId}`,
    limit: 25,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}

export async function checkMatchingApplicationMutateRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `matching:action:application:mutate:${userId}`,
    limit: 80,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}

export async function checkMatchingImportUploadRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `matching:action:import:upload:${userId}`,
    limit: 20,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}

export async function checkMatchingPropertyCreateRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `matching:action:property:create:${userId}`,
    limit: 40,
    window: MATCHING_RATE_WINDOWS.hour,
  })
}
