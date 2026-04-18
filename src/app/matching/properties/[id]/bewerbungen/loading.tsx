import { Skeleton } from '@/components/ui/Skeleton'

function AppCardSkeleton() {
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <Skeleton height={48} width={48} borderRadius={9999} />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton height={20} width="40%" />
          <Skeleton height={14} width="55%" />
          <Skeleton height={14} width="100%" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton height={40} width={160} borderRadius={12} />
        <Skeleton height={40} width={120} borderRadius={12} />
      </div>
    </li>
  )
}

export default function BewerbungenLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:px-6">
      <Skeleton height={16} width={200} />
      <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Skeleton className="h-14 w-14 shrink-0 rounded-lg" height={56} width={56} />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton height={20} width="70%" />
          <Skeleton height={16} width="90%" />
          <Skeleton height={16} width="35%" />
        </div>
      </div>
      <Skeleton height={32} width={280} className="mt-8" />
      <div className="mt-4 flex gap-2 border-b border-slate-200 pb-2">
        <Skeleton height={36} width={72} />
        <Skeleton height={36} width={56} />
        <Skeleton height={36} width={120} />
      </div>
      <ul className="mt-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AppCardSkeleton key={i} />
        ))}
      </ul>
    </main>
  )
}
