import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
}

export function WohnenEmptyState({ icon: Icon, title, description, actionHref, actionLabel }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <div className="rounded-full bg-teal-50 p-4 text-[#18a87c]">
        <Icon className="h-12 w-12" aria-hidden />
      </div>
      <p className="mt-5 text-lg font-bold text-slate-900">{title}</p>
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
      {actionHref && actionLabel ?
        <Link
          href={actionHref}
          className="mt-8 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#18a87c] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:w-auto"
        >
          {actionLabel}
        </Link>
      : null}
    </div>
  )
}
