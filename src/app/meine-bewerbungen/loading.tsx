import { Skeleton } from '@/components/ui/Skeleton'

function RowSkeleton() {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
      <div className="flex min-w-0 gap-3">
        <Skeleton className="h-20 w-24 shrink-0 rounded-lg" height={80} width={96} />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton height={20} width="75%" />
          <Skeleton height={14} width="90%" />
          <Skeleton height={14} width="50%" />
        </div>
      </div>
    </article>
  )
}

export default function MeineBewerbungenLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <Skeleton height={28} width={280} />
      <Skeleton height={16} width="90%" className="mt-2 max-w-lg" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
