import type { TenantProfile } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const prisma = vi.hoisted(() => ({
  rentalListing: { findFirst: vi.fn() },
  tenantProfile: { findUnique: vi.fn() },
  rentalApplication: {
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: { findUnique: vi.fn() },
  helvendaCertificate: { findFirst: vi.fn() },
  wohnenEmailOutbox: { create: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({
  prisma,
}))

vi.mock('@/lib/rental/emails', () => ({
  sendRentalLandlordNewApplicationEmail: vi.fn(),
  sendRentalApplicantSuccessEmail: vi.fn(),
}))

import { createQualifiedRentalApplication } from '@/lib/rental/createQualifiedRentalApplication'
import { prisma as prismaClient } from '@/lib/prisma'
import { sendRentalApplicantSuccessEmail, sendRentalLandlordNewApplicationEmail } from '@/lib/rental/emails'

const p = prismaClient as unknown as typeof prisma

function qualifiedProfile(): TenantProfile {
  return {
    id: 'tp_test',
    userId: 'applicant_user',
    isComplete: true,
    contactPhone: '+41 79 000 00 00',
    creditCheckStatus: 'APPROVED',
    creditCheckExpiresAt: new Date('2030-06-01'),
    monthlyIncomeCategory: 'ABOVE_90000',
    firstName: 'Test',
    lastName: 'Mieter',
    employmentStatus: 'EMPLOYED',
    employer: null,
    referenceName: null,
    referencePhone: null,
    applicationEmail: null,
    creditCheckResult: {},
  } as unknown as TenantProfile
}

const baseListing = {
  id: 'listing_1',
  userId: 'landlord_user',
  title: '2.5 Zi.',
  address: 'Musterstrasse 1',
  zip: '8000',
  city: 'Zürich',
  rooms: 2.5,
  rentPerMonth: 1500,
  utilitiesPerMonth: 200,
  requiresCreditCheck: true,
  status: 'active' as const,
  landlordNotifyEmail: 'landlord-notify@example.com',
  landlordContact: null,
  user: {
    id: 'landlord_user',
    email: 'landlord-account@example.com',
    firstName: 'L',
    name: 'Vermieter',
  },
}

describe('createQualifiedRentalApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    p.rentalListing.findFirst.mockResolvedValue(baseListing as never)
    p.tenantProfile.findUnique.mockResolvedValue(qualifiedProfile() as never)
    p.rentalApplication.findFirst.mockResolvedValue(null)
    p.rentalApplication.deleteMany.mockResolvedValue({ count: 1 } as never)
    p.rentalApplication.create.mockResolvedValue({ id: 'app_new' } as never)
    p.user.findUnique.mockResolvedValue({
      email: 'applicant@example.com',
      phone: '+41 78 000 00 01',
      firstName: 'A',
      name: 'Applicant',
      nickname: null,
    } as never)
    p.helvendaCertificate.findFirst.mockResolvedValue(null)
    p.wohnenEmailOutbox.create.mockResolvedValue({ id: 'obx1' } as never)
    vi.mocked(sendRentalLandlordNewApplicationEmail).mockResolvedValue(undefined)
    vi.mocked(sendRentalApplicantSuccessEmail).mockResolvedValue(undefined)
  })

  it('enqueues outbox when applicant confirmation mail fails', async () => {
    vi.mocked(sendRentalApplicantSuccessEmail).mockRejectedValueOnce(new Error('smtp down'))

    const result = await createQualifiedRentalApplication({
      userId: 'applicant_user',
      rentalListingId: 'listing_1',
      message: null,
    })

    expect(result).toEqual({ ok: true, applicationId: 'app_new' })
    expect(p.wohnenEmailOutbox.create).toHaveBeenCalled()
    const createArg = p.wohnenEmailOutbox.create.mock.calls[0]?.[0] as { data?: { kind?: string } }
    expect(createArg?.data?.kind).toBe('TENANT_APPLICATION_CONFIRM')
  })

  it('returns ok when landlord mail and applicant mail succeed', async () => {
    const result = await createQualifiedRentalApplication({
      userId: 'applicant_user',
      rentalListingId: 'listing_1',
      message: null,
    })
    expect(result).toEqual({ ok: true, applicationId: 'app_new' })
    expect(sendRentalLandlordNewApplicationEmail).toHaveBeenCalledTimes(1)
    expect(sendRentalApplicantSuccessEmail).toHaveBeenCalledTimes(1)
    expect(p.rentalApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ landlordLeadEmail: 'landlord-notify@example.com' }),
      })
    )
  })

  it('rolls back and returns LANDLORD_EMAIL_FAILED when landlord mail throws', async () => {
    vi.mocked(sendRentalLandlordNewApplicationEmail).mockRejectedValueOnce(new Error('smtp down'))
    p.rentalApplication.delete.mockResolvedValue(undefined as never)

    const result = await createQualifiedRentalApplication({
      userId: 'applicant_user',
      rentalListingId: 'listing_1',
      message: 'Hallo',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('LANDLORD_EMAIL_FAILED')
      expect(result.status).toBe(503)
    }
    expect(p.rentalApplication.delete).toHaveBeenCalled()
    expect(sendRentalApplicantSuccessEmail).not.toHaveBeenCalled()
  })

  it('marks application rejected when delete repeatedly fails', async () => {
    vi.mocked(sendRentalLandlordNewApplicationEmail).mockRejectedValueOnce(new Error('smtp down'))
    p.rentalApplication.delete.mockRejectedValue(new Error('db'))
    p.rentalApplication.deleteMany.mockResolvedValue({ count: 0 } as never)
    p.rentalApplication.findUnique.mockResolvedValue({ id: 'app_new' } as never)
    p.rentalApplication.update.mockResolvedValue({} as never)

    const result = await createQualifiedRentalApplication({
      userId: 'applicant_user',
      rentalListingId: 'listing_1',
      message: null,
    })

    expect(result.ok).toBe(false)
    expect(p.rentalApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'app_new' },
        data: expect.objectContaining({
          status: 'rejected',
        }),
      }),
    )
  })
})
