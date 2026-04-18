import { Skeleton } from '@/components/ui/Skeleton'

export default function ProfilLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Skeleton height={32} width={240} />
      <Skeleton height={16} width="80%" className="mt-2" />
      <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton height={16} width={120} />
            <Skeleton height={16} width="45%" />
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton height={22} width={200} />
        <Skeleton height={100} width="100%" className="mt-4" borderRadius={12} />
        <Skeleton height={44} width="100%" className="mt-4" borderRadius={12} />
      </div>
    </main>
  )
}
