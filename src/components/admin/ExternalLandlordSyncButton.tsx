'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

export function ExternalLandlordSyncButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  const runSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/external-landlords/sync', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error((data as { message?: string }).message || 'CRM-Sync fehlgeschlagen')
        return
      }
      toast.success(`${(data as { processed?: number }).processed ?? 0} Inserate synchronisiert`)
      router.refresh()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void runSync()}
      disabled={syncing || pendingCount <= 0}
      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      {pendingCount > 0 ? `Bestehende Inserate synchronisieren (${pendingCount})` : 'CRM ist synchronisiert'}
    </button>
  )
}
