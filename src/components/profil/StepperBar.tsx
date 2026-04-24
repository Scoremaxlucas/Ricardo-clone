'use client'

type Props = {
  current: number
  total: number
  onBack: () => void
  disableBack?: boolean
}

export function StepperBar({ current, total, onBack, disableBack }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center gap-3 border-b border-[#f0f0f0] bg-white px-4 sm:px-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <button
        type="button"
        onClick={onBack}
        disabled={disableBack}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#0d2b1f] transition hover:bg-[#f5fdfb] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Zurück"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <div className="h-[3px] w-full overflow-hidden rounded-sm bg-[#f0f0f0]">
          <div
            className="h-full rounded-sm bg-[#18a87c] transition-[width] duration-[400ms] ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="shrink-0 text-[13px] font-medium tabular-nums text-[#8aa89e]">
        Schritt {current} / {total}
      </p>
    </header>
  )
}
