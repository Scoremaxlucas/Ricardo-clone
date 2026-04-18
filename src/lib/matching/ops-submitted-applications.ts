import { MatchingApplicationStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type OpsSubmittedApplicationRow = {
  id: string
  status: MatchingApplicationStatus
  createdAt: string
  updatedAt: string
  propertyTitle: string
  propertyCity: string
  seekerEmail: string | null
  seekerUserId: string
}

/**
 * Eingereichte Bewerbungen für Ops-Triage (ohne Vermieter-Zugehörigkeit).
 */
export async function loadOpsSubmittedApplications(): Promise<OpsSubmittedApplicationRow[]> {
  const apps = await prisma.matchingApplication.findMany({
    where: {
      status: {
        in: [
          MatchingApplicationStatus.submitted,
          MatchingApplicationStatus.landlord_reviewing,
        ],
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: {
      property: { select: { title: true, city: true } },
      seekerProfile: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
    },
  })

  return apps.map(a => ({
    id: a.id,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    propertyTitle: a.property.title,
    propertyCity: a.property.city,
    seekerEmail: a.seekerProfile.user.email,
    seekerUserId: a.seekerProfile.user.id,
  }))
}

export async function getOpsMatchingApplicationDetail(applicationId: string) {
  return prisma.matchingApplication.findUnique({
    where: { id: applicationId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          zip: true,
          canton: true,
          landlordAccountId: true,
        },
      },
      seekerProfile: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              nickname: true,
              phone: true,
            },
          },
        },
      },
      housingMatch: { select: { id: true, score: true } },
      consentShares: { orderBy: { scope: 'asc' } },
    },
  })
}
