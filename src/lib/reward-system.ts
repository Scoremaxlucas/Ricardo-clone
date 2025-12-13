/**
 * Reward System
 * Feature 9: Gamification - Vergibt Belohnungen für Achievements
 */

import { prisma } from './prisma'

export type RewardType = 'discount' | 'free_booster' | 'premium_feature'

export interface RewardData {
  userId: string
  rewardType: RewardType
  rewardValue: {
    percent?: number
    boosterCode?: string
    feature?: string
  }
  expiresInDays?: number
}

/**
 * Erstellt eine Belohnung für einen User
 */
export async function createReward(data: RewardData): Promise<void> {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30))

    await prisma.reward.create({
      data: {
        userId: data.userId,
        rewardType: data.rewardType,
        rewardValue: JSON.stringify(data.rewardValue),
        expiresAt,
      },
    })
  } catch (error) {
    console.error('[RewardSystem] Error creating reward:', error)
  }
}

/**
 * Vergibt automatische Belohnungen basierend auf Badges
 */
export async function awardRewardsForBadge(userId: string, badgeType: string): Promise<void> {
  try {
    switch (badgeType) {
      case 'FIRST_PURCHASE':
        // 10% Rabatt auf nächsten Kauf
        await createReward({
          userId,
          rewardType: 'discount',
          rewardValue: { percent: 10 },
          expiresInDays: 30,
        })
        break

      case 'POWER_BUYER_10':
        // Kostenloser Booster
        await createReward({
          userId,
          rewardType: 'free_booster',
          rewardValue: { boosterCode: 'POWER_BUYER_BOOST' },
          expiresInDays: 60,
        })
        break

      case 'POWER_BUYER_50':
        // Premium Feature (z.B. kostenloser Booster pro Monat)
        await createReward({
          userId,
          rewardType: 'premium_feature',
          rewardValue: { feature: 'monthly_free_booster' },
          expiresInDays: 365,
        })
        break

      case 'STREAK_30':
        // 15% Rabatt
        await createReward({
          userId,
          rewardType: 'discount',
          rewardValue: { percent: 15 },
          expiresInDays: 14,
        })
        break
    }
  } catch (error) {
    console.error('[RewardSystem] Error awarding rewards:', error)
  }
}

/**
 * Holt aktive Belohnungen eines Users
 */
export async function getUserRewards(userId: string): Promise<
  Array<{
    id: string
    rewardType: RewardType
    rewardValue: any
    expiresAt: Date
    claimedAt: Date | null
    usedAt: Date | null
  }>
> {
  try {
    const rewards = await prisma.reward.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    })

    return rewards.map(reward => ({
      id: reward.id,
      rewardType: reward.rewardType as RewardType,
      rewardValue: JSON.parse(reward.rewardValue),
      expiresAt: reward.expiresAt,
      claimedAt: reward.claimedAt,
      usedAt: reward.usedAt,
    }))
  } catch (error) {
    console.error('[RewardSystem] Error fetching rewards:', error)
    return []
  }
}

/**
 * Markiert eine Belohnung als verwendet
 */
export async function useReward(rewardId: string): Promise<void> {
  try {
    await prisma.reward.update({
      where: { id: rewardId },
      data: {
        usedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('[RewardSystem] Error using reward:', error)
  }
}
