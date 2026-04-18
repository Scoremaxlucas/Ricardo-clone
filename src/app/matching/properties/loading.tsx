import { Skeleton } from '@/components/ui/Skeleton'

function ListingRowSkeleton() {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
      <Skeleton className="h-20 w-20 shrink-0 rounded-xl" height={80} width={80} />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton height={22} width="65%" />
        <Skeleton height={16} width="90%" />
        <Skeleton height={16} width="40%" />
      </div>
    </li>
  )
}

export default function MatchingPropertiesLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:px-6">
      <Skeleton height={20} width={100} />
      <Skeleton height={36} width="55%" className="mt-2" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Skeleton height={14} width={80} />
            <Skeleton height={32} width={60} className="mt-2" />
            <Skeleton height={14} width="70%" className="mt-2" />
          </div>
        ))}
      </div>
      <ul className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListingRowSkeleton key={i} />
        ))}
      </ul>
    </main>
  )
}
