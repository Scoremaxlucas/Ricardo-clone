'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

type Props = {
  listingId: string
}

export function RentalQualificationBadge({ listingId }: Props) {
  const { status } = useSession()
  const [qualified, setQualified] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') {
      setQualified(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/rental-applications/qualify?listingId=${encodeURIComponent(listingId)}`, {
          credentials: 'same-origin',
        })
        const data = (await res.json().catch(() => ({}))) as { qualified?: boolean }
        if (!cancelled) setQualified(data.qualified === true)
      } catch {
        if (!cancelled) setQualified(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [listingId, status])

  if (!qualified) return null
  return (
    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
      ✓ Du erfüllst die Anforderungen
    </span>
  )
}
