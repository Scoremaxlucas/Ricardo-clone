'use client'

import { forwardRef } from 'react'

type Props = {
  label: string
  selected: boolean
  onClick: () => void
}

export const OptionCard = forwardRef<HTMLButtonElement, Props>(function OptionCard(
  { label, selected, onClick },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="min-h-[44px] w-full rounded-[14px] px-5 py-5 text-center text-[15px] font-semibold transition-all duration-150 ease-out hover:border-[#b2e8d8] hover:bg-[#f5fdfb]"
      style={{
        border: selected ? '2px solid #18a87c' : '1.5px solid #e8e8e8',
        background: selected ? '#e8f7f2' : 'white',
        color: selected ? '#107a5a' : '#0d2b1f',
      }}
    >
      {label}
    </button>
  )
})
