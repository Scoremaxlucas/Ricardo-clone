import { DocumentVerificationStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type OpsPendingDocumentRow = {
  documentId: string
  verificationId: string
  createdAt: string
  kind: string
  fileKey: string
  mimeType: string | null
  uploaderEmail: string | null
  uploaderId: string
  subjectId: string
}

export async function loadOpsPendingMatchingDocuments(): Promise<OpsPendingDocumentRow[]> {
  const rows = await prisma.documentVerification.findMany({
    where: { status: DocumentVerificationStatus.pending },
    orderBy: { createdAt: 'asc' },
    include: {
      document: {
        select: {
          id: true,
          kind: true,
          fileKey: true,
          mimeType: true,
          subjectId: true,
          uploadedByUserId: true,
          uploadedBy: { select: { id: true, email: true } },
        },
      },
    },
  })

  return rows.map(r => ({
    documentId: r.document.id,
    verificationId: r.id,
    createdAt: r.createdAt.toISOString(),
    kind: r.document.kind,
    fileKey: r.document.fileKey,
    mimeType: r.document.mimeType,
    uploaderEmail: r.document.uploadedBy.email,
    uploaderId: r.document.uploadedBy.id,
    subjectId: r.document.subjectId,
  }))
}
