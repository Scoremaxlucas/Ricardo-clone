import type { WohnenCommissionStatus, WohnenTenantBonusStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  calculateLandlordCommissionChf,
  WOHNEN_LANDLORD_COMMISSION_PERCENT,
  WOHNEN_TENANT_MOVEIN_BONUS_CHF,
  WOHNEN_TENANT_MOVEIN_BONUS_HOLD_DAYS,
} from '@/lib/wohnen/pricing'

/** Schweizer MwSt (Normalsatz) — für Rechnungsstellung an Vermieter. */
export const WOHNEN_COMMISSION_VAT_RATE = 0.081

export function calculateCommissionWithVat(netRentPerMonthChf: number): {
  commissionAmountChf: number
  vatAmountChf: number
  commissionTotalChf: number
} {
  const commissionAmountChf = calculateLandlordCommissionChf(netRentPerMonthChf)
  const vatAmountChf = Math.round(commissionAmountChf * WOHNEN_COMMISSION_VAT_RATE)
  const commissionTotalChf = commissionAmountChf + vatAmountChf
  return { commissionAmountChf, vatAmountChf, commissionTotalChf }
}

export type CreatePlacementResult =
  | { ok: true; placementId: string }
  | { ok: false; status: number; message: string }

/**
 * Erfasst eine erfolgreiche Vermittlung (Admin) — berechnet Provision und markiert Bonus als eligible.
 */
export async function createWohnenPlacementFromApplication(params: {
  applicationId: string
  recordedByUserId: string
  moveInDate?: Date | string | null
  netRentPerMonth?: number | null
  adminNotes?: string | null
}): Promise<CreatePlacementResult> {
  const app = await prisma.rentalApplication.findUnique({
    where: { id: params.applicationId },
    include: {
      listing: { select: { id: true, rentPerMonth: true, status: true } },
      placement: { select: { id: true } },
    },
  })

  if (!app?.listing) {
    return { ok: false, status: 404, message: 'Bewerbung nicht gefunden' }
  }
  if (app.placement) {
    return { ok: false, status: 409, message: 'Für diese Bewerbung existiert bereits eine Vermittlung' }
  }

  const netRent =
    params.netRentPerMonth != null && Number.isFinite(params.netRentPerMonth) && params.netRentPerMonth > 0
      ? Math.round(params.netRentPerMonth)
      : app.listing.rentPerMonth

  const { commissionAmountChf, vatAmountChf, commissionTotalChf } = calculateCommissionWithVat(netRent)

  let moveInDate: Date | null = null
  if (params.moveInDate != null) {
    const d = new Date(params.moveInDate)
    if (!Number.isNaN(d.getTime())) moveInDate = d
  }

  const now = new Date()
  const bonusEligibleAt =
    moveInDate != null
      ? new Date(moveInDate.getTime() + WOHNEN_TENANT_MOVEIN_BONUS_HOLD_DAYS * 24 * 60 * 60 * 1000)
      : null

  const placement = await prisma.wohnenRentalPlacement.create({
    data: {
      rentalApplicationId: app.id,
      rentalListingId: app.listing.id,
      applicantUserId: app.applicantUserId,
      netRentPerMonth: netRent,
      commissionPercent: WOHNEN_LANDLORD_COMMISSION_PERCENT,
      commissionAmountChf,
      vatRate: WOHNEN_COMMISSION_VAT_RATE,
      vatAmountChf,
      commissionTotalChf,
      commissionStatus: 'pending',
      moveInDate,
      confirmedAt: now,
      tenantBonusAmountChf: WOHNEN_TENANT_MOVEIN_BONUS_CHF,
      tenantBonusStatus: 'eligible',
      tenantBonusEligibleAt: bonusEligibleAt,
      adminNotes: params.adminNotes?.trim() || null,
      recordedByUserId: params.recordedByUserId,
    },
  })

  return { ok: true, placementId: placement.id }
}

export async function updateWohnenPlacementStatus(params: {
  placementId: string
  commissionStatus?: WohnenCommissionStatus
  tenantBonusStatus?: WohnenTenantBonusStatus
  adminNotes?: string | null
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const existing = await prisma.wohnenRentalPlacement.findUnique({ where: { id: params.placementId } })
  if (!existing) return { ok: false, status: 404, message: 'Vermittlung nicht gefunden' }

  const now = new Date()
  const data: {
    commissionStatus?: WohnenCommissionStatus
    tenantBonusStatus?: WohnenTenantBonusStatus
    adminNotes?: string | null
    commissionInvoicedAt?: Date
    commissionPaidAt?: Date
    tenantBonusPaidAt?: Date
  } = {}

  if (params.commissionStatus) {
    data.commissionStatus = params.commissionStatus
    if (params.commissionStatus === 'invoiced' && !existing.commissionInvoicedAt) {
      data.commissionInvoicedAt = now
    }
    if (params.commissionStatus === 'paid' && !existing.commissionPaidAt) {
      data.commissionPaidAt = now
    }
  }

  if (params.tenantBonusStatus) {
    data.tenantBonusStatus = params.tenantBonusStatus
    if (params.tenantBonusStatus === 'paid' && !existing.tenantBonusPaidAt) {
      data.tenantBonusPaidAt = now
    }
  }

  if (params.adminNotes !== undefined) {
    data.adminNotes = params.adminNotes?.trim() || null
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, status: 400, message: 'Keine Änderungen' }
  }

  await prisma.wohnenRentalPlacement.update({ where: { id: params.placementId }, data })
  return { ok: true }
}
