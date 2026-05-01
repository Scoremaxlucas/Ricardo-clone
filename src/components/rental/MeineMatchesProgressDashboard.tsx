import Link from 'next/link'

export type UserCompletionState =
  | 'NO_PROFILE'
  | 'INCOMPLETE_PROFILE'
  | 'NO_CREDIT_CHECK'
  | 'PENDING_CREDIT_CHECK'
  | 'NO_CERTIFICATE'
  | 'READY'

export type ProgressStep = {
  id: string
  label: string
  done: boolean
  pending?: boolean
  pendingLabel?: string
  ctaLabel: string
  ctaHref: string
}

type Props = {
  firstName: string
  steps: ProgressStep[]
}

function StepIcon({ kind }: { kind: 'done' | 'current' | 'pending' }) {
  if (kind === 'done') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#18a87c]">
        <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white">
          <path fill="currentColor" d="M6.2 12.8 2.4 9l1.4-1.4 2.4 2.4 6-6L13.6 5l-7.4 7.8Z" />
        </svg>
      </span>
    )
  }
  if (kind === 'current') {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0d2b1f]">
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    )
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#e0e0e0] bg-white" />
  )
}

export function MeineMatchesProgressDashboard({ firstName, steps }: Props) {
  const doneCount = steps.filter(s => s.done).length
  const pct = (doneCount / steps.length) * 100
  const currentIndex = steps.findIndex(s => !s.done)
  const current = currentIndex >= 0 ? steps[currentIndex] : null

  return (
    <section
      className="mx-auto mb-8 max-w-[640px] rounded-2xl border-[1.5px] border-[#e8f7f2] border-l-4 border-l-[#18a87c] bg-white px-6 py-7 shadow-sm sm:px-8"
      aria-label="Fortschritt"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold text-[#0d2b1f]">Hallo {firstName}. Hier ist dein Stand:</h2>
        <p className="text-xs text-[#8aa89e]">
          Schritt {Math.min(doneCount + 1, steps.length)} von {steps.length}
        </p>
      </div>

      <div className="mb-6">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8f7f2]">
          <div
            className="h-full rounded-full bg-[#18a87c] transition-[width] duration-[600ms] ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-[#f0f0f0]">
        {steps.map((step, i) => {
          const isDone = step.done
          const isCurrent = !isDone && i === currentIndex
          const iconKind = isDone ? 'done' : isCurrent ? 'current' : 'pending'
          return (
            <li key={step.id} className="flex items-center gap-3 py-2.5">
              <StepIcon kind={iconKind} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm ${
                    isDone ? 'text-[#8aa89e] line-through' : isCurrent ? 'font-bold text-[#0d2b1f]' : 'text-[#b0b0b0]'
                  }`}
                >
                  {step.label}
                </p>
                {step.pending && step.pendingLabel ?
                  <p className="mt-0.5 text-xs text-[#8aa89e]">{step.pendingLabel}</p>
                : null}
              </div>
              <div className="w-24 shrink-0 text-right">
                {isCurrent && step.pending ?
                  <span className="text-[10px] font-semibold text-[#8aa89e]">Wird geprueft</span>
                : isCurrent ?
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#18a87c]">Jetzt</span>
                : !isDone && i === currentIndex + 1 ?
                  <span className="text-[10px] text-[#b0b0b0]">als naechstes</span>
                : null}
              </div>
            </li>
          )
        })}
      </ul>

      {current ?
        <Link
          href={current.ctaHref}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#18a87c] text-[15px] font-bold text-white shadow-sm transition hover:opacity-95"
        >
          {current.ctaLabel}
        </Link>
      : null}
    </section>
  )
}
