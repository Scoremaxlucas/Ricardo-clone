import { checkRateLimit } from '@/lib/rate-limit'

export async function checkRentalListingImportRateLimit(userId: string) {
  return checkRateLimit({
    identifier: `rental:import-listing:${userId}`,
    limit: 20,
    window: 3600,
  })
}
