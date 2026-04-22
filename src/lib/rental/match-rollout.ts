type RolloutDecision = {
  enabled: boolean
  reason: 'enabled' | 'global_disabled' | 'admin_only' | 'percentage_blocked' | 'missing_user'
}

function envBool(v: string | undefined, fallback: boolean): boolean {
  if (v == null) return fallback
  const n = v.trim().toLowerCase()
  if (n === '1' || n === 'true' || n === 'yes' || n === 'on') return true
  if (n === '0' || n === 'false' || n === 'no' || n === 'off') return false
  return fallback
}

function envPercent(v: string | undefined, fallback: number): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(100, Math.floor(n)))
}

function stablePercentBucket(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 100
}

export function decideRentalMatchRollout(input: {
  userId: string | null
  isAdmin: boolean
}): RolloutDecision {
  const globallyEnabled = envBool(process.env.RENTAL_MATCH_ROLLOUT_ENABLED, true)
  if (!globallyEnabled) return { enabled: false, reason: 'global_disabled' }

  if (input.isAdmin) return { enabled: true, reason: 'enabled' }

  const adminOnly = envBool(process.env.RENTAL_MATCH_ROLLOUT_ADMIN_ONLY, false)
  if (adminOnly) return { enabled: false, reason: 'admin_only' }

  if (!input.userId) return { enabled: false, reason: 'missing_user' }

  const percent = envPercent(process.env.RENTAL_MATCH_ROLLOUT_PERCENT, 100)
  const bucket = stablePercentBucket(input.userId)
  if (bucket >= percent) return { enabled: false, reason: 'percentage_blocked' }

  return { enabled: true, reason: 'enabled' }
}
