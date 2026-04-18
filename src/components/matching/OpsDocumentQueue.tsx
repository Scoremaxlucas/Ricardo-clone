'use client'

import { opsReviewMatchingDocumentAction } from '@/lib/matching/ops-document-review-action'
import type { OpsPendingDocumentRow } from '@/lib/matching/ops-pending-documents'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'

export function OpsDocumentQueue({ rows }: { rows: OpsPendingDocumentRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notesByDoc, setNotesByDoc] = useState<Record<string, string>>({})

  const review = (documentId: string, decision: 'approved' | 'rejected') => {
    startTransition(() => {
      void (async () => {
        const res = await opsReviewMatchingDocumentAction({
          documentId,
          decision,
          notes: notesByDoc[documentId] || null,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(decision === 'approved' ? 'Freigegeben.' : 'Abgelehnt.')
        router.refresh()
      })()
    })
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Keine ausstehenden Dokumente.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Datum</th>
            <th className="px-4 py-3">Typ / Datei</th>
            <th className="px-4 py-3">Uploader</th>
            <th className="px-4 py-3">Notiz</th>
            <th className="px-4 py-3">Aktion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(r => (
            <tr key={r.documentId}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {new Date(r.createdAt).toLocaleString('de-CH')}
              </td>
              <td className="px-4 py-3 text-slate-800">
                {r.kind}
                {r.mimeType ? <span className="block text-xs text-slate-500">{r.mimeType}</span> : null}
                <a
                  href={r.fileKey}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-teal-800 underline-offset-2 hover:underline"
                >
                  Datei öffnen
                </a>
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">{r.uploaderEmail || r.uploaderId}</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  placeholder="optional"
                  value={notesByDoc[r.documentId] ?? ''}
                  onChange={e =>
                    setNotesByDoc(m => ({
                      ...m,
                      [r.documentId]: e.target.value,
                    }))
                  }
                  className="w-full min-w-[140px] rounded border border-slate-300 px-2 py-1 text-xs"
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => review(r.documentId, 'approved')}
                    className="rounded-md bg-teal-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => review(r.documentId, 'rejected')}
                    className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Ablehnen
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
