'use client'

import { forwardRef } from 'react'

type Props = {
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}

export const StepperInput = forwardRef<HTMLButtonElement, Props>(function StepperInput(
  { label, value, min, max, onChange },
  ref
) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] font-medium text-[#0d2b1f]">{label}</p>
      <div className="flex items-center gap-4">
        <button
          ref={ref}
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full border-[1.5px] border-[#e8e8e8] text-[20px] font-light text-[#0d2b1f] transition hover:border-[#18a87c] hover:text-[#18a87c] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Weniger"
        >
          −
        </button>
        <span className="min-w-[32px] text-center text-2xl font-bold tabular-nums text-[#0d2b1f]">{value}</span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-full border-[1.5px] border-[#e8e8e8] text-[20px] font-light text-[#0d2b1f] transition hover:border-[#18a87c] hover:text-[#18a87c] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Mehr"
        >
          +
        </button>
      </div>
    </div>
  )
})
