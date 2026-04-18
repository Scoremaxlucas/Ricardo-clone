'use client'

import { useState } from 'react'

type Props = { text: string; collapseAt?: number }

export function ListingExpandableDescription({ text, collapseAt = 300 }: Props) {
  const [open, setOpen] = useState(false)
  const needsToggle = text.length > collapseAt
  const shown = open || !needsToggle ? text : `${text.slice(0, collapseAt).trim()}…`

  return (
    <div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base">{shown}</p>
      {needsToggle ? (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="mt-2 text-sm font-semibold text-teal-800 underline-offset-2 hover:underline"
        >
          {open ? 'Weniger anzeigen' : 'Mehr anzeigen'}
        </button>
      ) : null}
    </div>
  )
}
