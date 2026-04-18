'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function MeineBewerbungenAlreadyToast() {
  const sp = useSearchParams()

  useEffect(() => {
    if (sp.get('already') === 'true') {
      toast('Du hast dich bereits auf diese Wohnung beworben.', { duration: 5000 })
    }
  }, [sp])

  return null
}
