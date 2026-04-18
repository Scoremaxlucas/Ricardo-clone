import { Skeleton } from '@/components/ui/Skeleton'

export default function WohnungDetailLoading() {
  return (
    <main className="pb-24 lg:pb-8">
      <div className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto lg:hidden">
            <Skeleton className="h-52 w-[85vw] max-w-md shrink-0 snap-center rounded-xl" height={208} width={340} />
            <Skeleton className="h-52 w-[85vw] max-w-md shrink-0 snap-center rounded-xl" height={208} width={340} />
          </div>
          <div className="hidden gap-3 py-4 lg:flex">
            <Skeleton className="aspect-[4/3] w-[60%] shrink-0 rounded-2xl" height={320} />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="aspect-[4/3] flex-1 rounded-xl" height={140} />
              <Skeleton className="aspect-[4/3] flex-1 rounded-xl" height={140} />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Skeleton height={16} width={140} />
        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,36%)]">
          <div className="space-y-6">
            <Skeleton height={36} width="90%" />
            <Skeleton height={18} width="70%" />
            <div className="flex flex-wrap gap-2">
              <Skeleton height={28} width={90} borderRadius={9999} />
              <Skeleton height={28} width={110} borderRadius={9999} />
              <Skeleton height={28} width={120} borderRadius={9999} />
            </div>
            <Skeleton height={120} width="100%" />
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
              <Skeleton height={28} width="60%" className="mx-auto" />
              <Skeleton height={44} width="100%" className="mt-6" borderRadius={12} />
              <Skeleton height={44} width="100%" className="mt-3" borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
