import { ExternalLandlordDetailClient } from '@/components/admin/ExternalLandlordDetailClient'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import {
  decryptExternalLandlordContactValue,
  externalLandlordDisplayName,
} from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Vermieter-CRM (${id.slice(0, 8)}…)`,
    robots: { index: false, follow: false },
  }
}

export default async function AdminExternalLandlordDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/landlords'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  const { id } = await params
  const row = await prisma.externalLandlord.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      permissions: {
        orderBy: { grantedAt: 'desc' },
        include: {
          rentalListing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
      },
      listings: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })
  if (!row) notFound()

  const contactNormalizedValues = Array.from(
    new Set(
      row.contacts
        .map(contact => contact.normalizedValue?.trim() || null)
        .filter((value): value is string => Boolean(value))
    )
  )
  const emailValues = Array.from(
    new Set([row.normalizedPrimaryEmail, ...contactNormalizedValues].filter((value): value is string => Boolean(value && value.includes('@'))))
  )
  const phoneValues = Array.from(
    new Set([row.normalizedPrimaryPhone, ...contactNormalizedValues].filter((value): value is string => Boolean(value && !value.includes('@'))))
  )
  const currentMatchKeys = new Set([...emailValues, ...phoneValues])

  const potentialDuplicates =
    emailValues.length || phoneValues.length ?
      await prisma.externalLandlord.findMany({
        where: {
          id: { not: id },
          OR: [
            ...(emailValues.length ? [{ normalizedPrimaryEmail: { in: emailValues } }] : []),
            ...(phoneValues.length ? [{ normalizedPrimaryPhone: { in: phoneValues } }] : []),
            ...(emailValues.length || phoneValues.length ?
              [{ contacts: { some: { normalizedValue: { in: [...emailValues, ...phoneValues] } } } }]
            : []),
          ],
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          displayName: true,
          normalizedPrimaryEmail: true,
          normalizedPrimaryPhone: true,
          contacts: { select: { normalizedValue: true } },
          _count: { select: { listings: true, contacts: true, permissions: true, attachments: true } },
        },
      })
    : []

  const display = externalLandlordDisplayName(
    row.displayName,
    row.normalizedPrimaryEmail,
    row.normalizedPrimaryPhone
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-2">
        <Link href="/admin/landlords" className="text-sm font-medium text-teal-800 hover:underline">
          ← Zurück zur Vermieter-Datenbank
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{display}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Zentrale CRM-Akte für externe Vermieter: Kontakte, Nutzungsrechte, Korrespondenz und verknüpfte Inserate.
      </p>

      <div className="mt-8">
        <ExternalLandlordDetailClient
          landlordId={row.id}
          displayName={display}
          kind={row.kind}
          normalizedPrimaryEmail={row.normalizedPrimaryEmail}
          normalizedPrimaryPhone={row.normalizedPrimaryPhone}
          internalNotes={row.internalNotes}
          contacts={row.contacts.map(contact => ({
            id: contact.id,
            kind: contact.kind,
            label: contact.label,
            value: decryptExternalLandlordContactValue(contact.valueEncrypted),
            normalizedValue: contact.normalizedValue,
            isPrimary: contact.isPrimary,
            note: contact.note,
            createdAt: contact.createdAt.toISOString(),
          }))}
          permissions={row.permissions.map(permission => ({
            id: permission.id,
            kind: permission.kind,
            source: permission.source,
            grantedAt: permission.grantedAt.toISOString(),
            summary: permission.summary,
            rentalListingId: permission.rentalListingId,
            rentalListingTitle: permission.rentalListing?.title ?? null,
          }))}
          attachments={row.attachments.map(attachment => ({
            id: attachment.id,
            label: attachment.label,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            fileUrl: attachment.fileUrl,
            note: attachment.note,
            source: attachment.source,
            createdAt: attachment.createdAt.toISOString(),
            rentalListingId: attachment.rentalListingId,
            permissionId: attachment.permissionId,
          }))}
          linkedListings={row.listings.map(listing => ({
            id: listing.id,
            title: listing.title,
            address: `${listing.address}, ${listing.city}`.trim(),
            status: listing.status,
            createdAt: listing.createdAt.toISOString(),
          }))}
          potentialDuplicates={potentialDuplicates.map(duplicate => ({
            id: duplicate.id,
            label: externalLandlordDisplayName(
              duplicate.displayName,
              duplicate.normalizedPrimaryEmail,
              duplicate.normalizedPrimaryPhone
            ),
            secondary:
              [duplicate.normalizedPrimaryEmail, duplicate.normalizedPrimaryPhone].filter(Boolean).join(' · ') || null,
            listingsCount: duplicate._count.listings,
            contactsCount: duplicate._count.contacts,
            permissionsCount: duplicate._count.permissions,
            attachmentsCount: duplicate._count.attachments,
            sharedMatches: Array.from(
              new Set(
                [
                  duplicate.normalizedPrimaryEmail,
                  duplicate.normalizedPrimaryPhone,
                  ...duplicate.contacts.map(contact => contact.normalizedValue),
                ]
                  .map(value => value?.trim() || null)
                  .filter((value): value is string => Boolean(value && currentMatchKeys.has(value)))
              )
            ),
          }))}
        />
      </div>
    </div>
  )
}
