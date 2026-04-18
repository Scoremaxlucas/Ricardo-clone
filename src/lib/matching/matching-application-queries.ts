import { HousingMatchStatus, MatchingDocumentSubject } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { grantedScopesFromRows } from './consent-scopes'
import { ensureLandlordAccountForUser } from './landlord-account'
import { ensureSeekerProfileForUser } from './seeker-account'
import {
  buildLandlordStagedSeekerView,
  type LandlordStagedSeekerView,
  type LandlordViewSeekerSource,
} from './matching-landlord-view'

function decimalToNumber(v: { toNumber(): number } | null | undefined): number | null {
  if (v == null) return null
  return v.toNumber()
}

export async function listSeekerMatchesForUser(userId: string) {
  const seekerProfileId = await ensureSeekerProfileForUser(userId)

  const matches = await prisma.housingMatch.findMany({
    where: {
      seekerProfileId,
      hardFailed: false,
      status: HousingMatchStatus.active,
    },
    orderBy: { score: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          zip: true,
          canton: true,
          rentPerMonth: true,
          rooms: true,
        },
      },
    },
  })

  const mids = matches.map(m => m.id)
  const apps = mids.length
    ? await prisma.matchingApplication.findMany({
        where: { housingMatchId: { in: mids } },
        select: { id: true, housingMatchId: true, status: true },
      })
    : []
  const appByMatch = new Map<string, { id: string; status: (typeof apps)[0]['status'] }>()
  for (const a of apps) {
    if (a.housingMatchId) appByMatch.set(a.housingMatchId, { id: a.id, status: a.status })
  }

  return matches.map(m => ({
    matchId: m.id,
    score: m.score,
    hardFailed: m.hardFailed,
    property: {
      ...m.property,
      rooms: decimalToNumber(m.property.rooms),
    },
    application: appByMatch.get(m.id) ?? null,
  }))
}

export async function listSeekerApplicationsForUser(userId: string) {
  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  return prisma.matchingApplication.findMany({
    where: { seekerProfileId },
    orderBy: { updatedAt: 'desc' },
    include: {
      property: {
        select: { id: true, title: true, city: true, zip: true, canton: true, rentPerMonth: true },
      },
    },
  })
}

export async function getSeekerApplicationDetail(userId: string, applicationId: string) {
  const seekerProfileId = await ensureSeekerProfileForUser(userId)
  return prisma.matchingApplication.findFirst({
    where: { id: applicationId, seekerProfileId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          zip: true,
          canton: true,
          rentPerMonth: true,
          rooms: true,
        },
      },
      consentShares: true,
      housingMatch: {
        select: { id: true, score: true, hardFailed: true, status: true },
      },
    },
  })
}

export async function listLandlordApplicationsForUser(userId: string) {
  const landlordAccountId = await ensureLandlordAccountForUser(userId)
  return prisma.matchingApplication.findMany({
    where: { property: { landlordAccountId } },
    orderBy: { updatedAt: 'desc' },
    include: {
      property: { select: { id: true, title: true, city: true, zip: true } },
    },
  })
}

export async function getLandlordApplicationDetail(userId: string, applicationId: string) {
  const landlordAccountId = await ensureLandlordAccountForUser(userId)

  const app = await prisma.matchingApplication.findFirst({
    where: {
      id: applicationId,
      property: { landlordAccountId },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          description: true,
          addressLine: true,
          city: true,
          zip: true,
          canton: true,
          rooms: true,
          rentPerMonth: true,
        },
      },
      consentShares: true,
      housingMatch: {
        include: {
          reasons: { take: 12, orderBy: { createdAt: 'asc' } },
        },
      },
      seekerProfile: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              nickname: true,
              phone: true,
            },
          },
          searchProfile: true,
          household: true,
          employment: true,
          financial: true,
          housingHistory: { take: 15, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  })

  if (!app) return null

  const docs = await prisma.matchingDocument.findMany({
    where: {
      subjectType: MatchingDocumentSubject.seeker_profile,
      subjectId: app.seekerProfileId,
    },
    select: { kind: true, status: true, fileKey: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const sp = app.seekerProfile.searchProfile
  const hh = app.seekerProfile.household
  const em = app.seekerProfile.employment
  const fi = app.seekerProfile.financial
  const hist = app.seekerProfile.housingHistory

  const src: LandlordViewSeekerSource = {
    user: app.seekerProfile.user,
    searchProfile: sp
      ? {
          cantonPreference: sp.cantonPreference,
          postalCodesWanted: sp.postalCodesWanted,
          budgetMin: sp.budgetMin,
          budgetMax: sp.budgetMax,
          minRooms: decimalToNumber(sp.minRooms),
          maxRooms: decimalToNumber(sp.maxRooms),
          moveInEarliest: sp.moveInEarliest?.toISOString() ?? null,
          moveInLatest: sp.moveInLatest?.toISOString() ?? null,
        }
      : null,
    household: hh
      ? {
          adults: hh.adults,
          children: hh.children,
          petsDescription: hh.petsDescription,
        }
      : null,
    employment: em
      ? { employmentStatus: em.employmentStatus, employerName: em.employerName }
      : null,
    financial: fi ? { monthlyNetIncomeBand: fi.monthlyNetIncomeBand } : null,
    housingHistory: hist.map(h => ({
      fromDate: h.fromDate?.toISOString() ?? null,
      toDate: h.toDate?.toISOString() ?? null,
      label: h.label,
    })),
    documents: docs.map(d => ({ kind: d.kind, status: d.status, fileKey: d.fileKey })),
  }

  const granted = grantedScopesFromRows(app.consentShares)
  const staged: LandlordStagedSeekerView = buildLandlordStagedSeekerView(granted, src)

  return {
    application: {
      id: app.id,
      status: app.status,
      message: app.message,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    },
    property: {
      ...app.property,
      rooms: decimalToNumber(app.property.rooms),
    },
    match: app.housingMatch
      ? {
          score: app.housingMatch.score,
          reasons: app.housingMatch.reasons.map(r => ({ code: r.code, detail: r.detail })),
        }
      : null,
    consentShares: app.consentShares.map(c => ({
      scope: c.scope,
      grantedAt: c.grantedAt?.toISOString() ?? null,
      revokedAt: c.revokedAt?.toISOString() ?? null,
    })),
    stagedSeeker: staged,
  }
}
