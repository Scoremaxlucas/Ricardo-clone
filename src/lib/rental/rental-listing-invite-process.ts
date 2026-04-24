import { prisma } from '@/lib/prisma'
import type { AdminIngestOrchestratorResult } from '@/lib/rental/listing-ingest-orchestrator'
import { runAdminListingIngest } from '@/lib/rental/listing-ingest-orchestrator'
import { createRentalListingFromIngestOrchestrator } from '@/lib/rental/rental-listing-auto-create'
import { assertUrlSafeForServerFetch } from '@/lib/rental/listing-url-import-server'
import type { RentalListingInviteStatus } from '@prisma/client'

export type InviteDraftPayload = {
  sourceUrl: string
  orchestrator: AdminIngestOrchestratorResult
  inviteEmail: string
}

export async function processRentalListingInviteUrl(params: {
  inviteId: string
  rawUrl: string
}): Promise<{ status: RentalListingInviteStatus; listingId?: string; error?: string }> {
  const invite = await prisma.rentalListingInvite.findUnique({ where: { id: params.inviteId } })
  if (!invite) throw new Error('invite_not_found')
  if (invite.status !== 'SENT') return { status: invite.status, error: 'already_handled' }
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.rentalListingInvite.update({
      where: { id: invite.id },
      data: { status: 'NEEDS_ADMIN', lastError: 'Einladung abgelaufen' },
    })
    return { status: 'NEEDS_ADMIN', error: 'expired' }
  }

  let safeUrl: string
  try {
    safeUrl = (await assertUrlSafeForServerFetch(params.rawUrl)).toString()
  } catch {
    await prisma.rentalListingInvite.update({
      where: { id: invite.id },
      data: {
        status: 'NEEDS_ADMIN',
        sourceUrl: params.rawUrl.trim().slice(0, 2000),
        urlSubmittedAt: new Date(),
        lastError: 'URL ungültig oder nicht erlaubt (SSR-Sicherheitsprüfung).',
        draftPayload: { sourceUrl: params.rawUrl.trim(), inviteEmail: invite.email } as object,
      },
    })
    return { status: 'NEEDS_ADMIN', error: 'invalid_url' }
  }

  await prisma.rentalListingInvite.update({
    where: { id: invite.id },
    data: {
      status: 'URL_SUBMITTED',
      sourceUrl: safeUrl,
      urlSubmittedAt: new Date(),
    },
  })

  const orchestrator = await runAdminListingIngest(invite.createdByUserId, { mode: 'url', url: safeUrl })
  const draft: InviteDraftPayload = {
    sourceUrl: safeUrl,
    orchestrator,
    inviteEmail: invite.email,
  }

  const created = await createRentalListingFromIngestOrchestrator({
    adminUserId: invite.createdByUserId,
    ingest: orchestrator,
    sourceUrl: safeUrl,
    contactPrefixLine: `E-Mail-Einladung: ${invite.email.trim()}`,
  })
  if (!created.ok) {
    await prisma.rentalListingInvite.update({
      where: { id: invite.id },
      data: {
        status: 'NEEDS_ADMIN',
        draftPayload: draft as object,
        lastError: created.reason,
      },
    })
    return { status: 'NEEDS_ADMIN', error: created.reason }
  }

  await prisma.rentalListingInvite.update({
    where: { id: invite.id },
    data: {
      status: 'LISTING_CREATED',
      rentalListingId: created.listingId,
      draftPayload: draft as object,
      lastError: null,
    },
  })

  return { status: 'LISTING_CREATED', listingId: created.listingId }
}
