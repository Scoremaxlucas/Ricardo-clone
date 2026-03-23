import { prisma } from '@/lib/prisma'

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'it'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (!value) return 'de'
  const lowered = value.toLowerCase()
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lowered)
    ? (lowered as AppLanguage)
    : 'de'
}

export async function ensurePreferredLanguageColumn(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_preferences' AND column_name = 'preferredLanguage'
        ) THEN
          ALTER TABLE "user_preferences" ADD COLUMN "preferredLanguage" TEXT NOT NULL DEFAULT 'de';
        END IF;
      END $$;
    `)
  } catch {
    // Non-fatal: if this fails, we gracefully fall back to default language.
  }
}

export async function getUserPreferredLanguage(userId?: string | null): Promise<AppLanguage> {
  if (!userId) return 'de'
  await ensurePreferredLanguageColumn()
  try {
    const rows = await prisma.$queryRaw<{ preferredLanguage: string | null }[]>`
      SELECT "preferredLanguage"
      FROM "user_preferences"
      WHERE "userId" = ${userId}
      LIMIT 1
    `
    return normalizeLanguage(rows[0]?.preferredLanguage)
  } catch {
    return 'de'
  }
}

export async function getPreferredLanguageByEmail(email?: string | null): Promise<AppLanguage> {
  if (!email) return 'de'
  await ensurePreferredLanguageColumn()
  try {
    const rows = await prisma.$queryRaw<{ preferredLanguage: string | null }[]>`
      SELECT up."preferredLanguage"
      FROM "users" u
      LEFT JOIN "user_preferences" up ON up."userId" = u."id"
      WHERE LOWER(u."email") = LOWER(${email})
      LIMIT 1
    `
    return normalizeLanguage(rows[0]?.preferredLanguage)
  } catch {
    return 'de'
  }
}

export async function setUserPreferredLanguage(userId: string, language: AppLanguage): Promise<void> {
  await ensurePreferredLanguageColumn()
  await prisma.userPreferences.upsert({
    where: { userId },
    update: { updatedAt: new Date() },
    create: { userId },
  })
  await prisma.$executeRaw`
    UPDATE "user_preferences"
    SET "preferredLanguage" = ${language}, "updatedAt" = ${new Date()}
    WHERE "userId" = ${userId}
  `
}

