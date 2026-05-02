'use client'

type Props = {
  current: number
  total: number
  onBack: () => void
  disableBack?: boolean
  /** Kurzer Schrittname, z. B. «Einkommen» — erscheint neben der Schrittzahl auf grösseren Screens. */
  stepTitle?: string
}

export function StepperBar({ current, total, onBack, disableBack, stepTitle }: Props) {
  const pct =
    total > 1 ? Math.min(100, Math.round(((current - 1) / (total - 1)) * 100)) : current >= total ? 100 : 0

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#e8ece9] bg-white/98 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgba(13,43,31,0.06)] backdrop-blur-sm">
      <div className="flex flex-col gap-2.5 px-[max(1rem,env(safe-area-inset-left,0px))] pb-2.5 pt-2 sm:px-6">
        <div className="flex h-10 items-center gap-2 sm:h-11 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={disableBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#0d2b1f] transition hover:bg-[#f0faf7] disabled:cursor-not-allowed disabled:opacity-40"
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

          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#18a87c] shadow-sm ring-1 ring-[#18a87c]/30" aria-hidden>
              <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 12 L12 28 M12 20 L28 20 M28 12 L28 28"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="truncate text-[13px] font-bold tracking-tight text-[#0f766e] sm:text-sm">
              Helvenda Wohnungen
            </span>
          </div>

          <div className="max-w-[min(100%,11rem)] shrink-0 text-right sm:max-w-none">
            {stepTitle ?
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[#18a87c] sm:text-[11px]">
                {stepTitle}
              </p>
            : null}
            <p className="text-[12px] font-bold tabular-nums text-[#3d5c52] sm:text-[13px]">
              Schritt {current} von {total}
            </p>
          </div>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e4eeea]" aria-hidden>
          <div
            className="h-full rounded-full bg-[#18a87c] transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </header>
  )
}
