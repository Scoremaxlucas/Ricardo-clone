'use client'

import { wohnenToast } from '@/lib/wohnen-toast'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function MeineBewerbungenAlreadyToast() {
  const sp = useSearchParams()

  useEffect(() => {
    if (sp.get('already') === 'true') {
      wohnenToast.alreadyApplied()
    }
  }, [sp])

  return null
}
