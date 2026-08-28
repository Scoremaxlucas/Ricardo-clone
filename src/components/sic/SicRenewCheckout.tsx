'use client'

import { sicPaths } from '@/lib/sic/config'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export function SicRenewCheckout() {
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function run() {
      try {
        const res = await fetch('/api/sic/checkout', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ renewal: true, moduleIds: [] }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.url) {
          setError(data?.message || 'Verlängerung konnte nicht gestartet werden.')
          return
        }
        window.location.href = data.url as string
      } catch {
        setError('Netzwerkfehler. Bitte erneut versuchen.')
      }
    }
    void run()
  }, [])

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-sic-navy">Verlängerung nicht gestartet</h1>
        <p className="mt-3 text-slate-600">{error}</p>
        <Link
          href={sicPaths.certificateWorkspace}
          className="mt-6 rounded-xl bg-sic-action px-5 py-3 text-sm font-semibold text-white hover:bg-sic-action-deep"
        >
          Zu Mein Zertifikat
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-5 py-20 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-sic-navy" />
      <h1 className="mt-4 text-2xl font-bold text-sic-navy">Weiter zur Zahlung</h1>
      <p className="mt-3 text-slate-600">Verlängerung wird vorbereitet …</p>
    </div>
  )
}
