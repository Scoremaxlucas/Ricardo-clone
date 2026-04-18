import { Skeleton } from '@/components/ui/Skeleton'

function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Skeleton className="h-[200px] w-full rounded-none" borderRadius={0} />
      <div className="space-y-3 p-4">
        <Skeleton className="h-[22px] w-3/4" />
        <Skeleton className="h-4 w-[55%]" />
        <Skeleton className="h-6 w-[45%]" />
      </div>
    </div>
  )
}

export default function WohnungenLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 space-y-2 border-b border-slate-100 pb-6">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </main>
  )
}
