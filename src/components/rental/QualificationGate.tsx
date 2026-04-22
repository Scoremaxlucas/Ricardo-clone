import type { QualificationIssue } from '@/lib/rental/qualifyTenant'
import Link from 'next/link'

type GateListing = {
  id: string
  title: string
  rentPerMonth: number
  firstPhotoUrl: string | null
}

type Props = {
  issues: QualificationIssue[]
  listing: GateListing
}

export function QualificationGate({ issues, listing }: Props) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mb-4 text-4xl" aria-hidden>
          📋
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Fast geschafft</h1>
        <p className="text-gray-500">
          Bevor du dich auf diese Wohnung bewerben kannst, musst du folgende Punkte erledigen:
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
        {listing.firstPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.firstPhotoUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <div>
          <div className="text-sm font-semibold">{listing.title}</div>
          <div className="font-bold text-teal-700">CHF {listing.rentPerMonth}.— / Monat</div>
        </div>
      </div>

      <div className="mb-8 space-y-3">
        {issues.map((issue, i) => (
          <div
            key={`${issue.code}-${i}`}
            className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
              <span className="text-sm font-bold text-orange-600">{i + 1}</span>
            </div>
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-gray-800">{issue.message}</p>
              <Link href={issue.actionUrl} className="text-sm font-semibold text-teal-600 hover:underline">
                {issue.action} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {issues.some(i => i.code === 'INCOME_TOO_LOW') ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Hinweis zur Einkommensregel:</strong> Vermieter in der Schweiz verlangen standardmässig ein
          Nettoeinkommen von mindestens dem Dreifachen der Monatsmiete. Falls dein tatsächliches Einkommen höher ist als
          in deinem Profil angegeben, kannst du es jetzt aktualisieren.
        </div>
      ) : null}

      <div className="text-center">
        <Link href={`/wohnungen/${listing.id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Zurück zur Wohnung
        </Link>
      </div>
    </div>
  )
}
