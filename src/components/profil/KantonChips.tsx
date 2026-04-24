'use client'

import { SWISS_CANTONS } from '@/lib/swiss-cantons'

type Props = {
  selected: string[]
  onToggle: (code: string) => void
  max?: number
}

export function KantonChips({ selected, onToggle, max = 12 }: Props) {
  const set = new Set(selected.map(s => s.toUpperCase()))

  return (
    <div className="flex flex-wrap gap-2">
      {SWISS_CANTONS.map(c => {
        const on = set.has(c.code)
        const disabled = !on && selected.length >= max
        return (
          <button
            key={c.code}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(c.code)}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition ${
              on ?
                'bg-[#18a87c] text-white'
              : 'border border-[#e8e8e8] bg-white text-[#0d2b1f] hover:border-[#b2e8d8] hover:bg-[#f5fdfb] disabled:cursor-not-allowed disabled:opacity-40'
            }`}
          >
            {c.code}
          </button>
        )
      })}
    </div>
  )
}
