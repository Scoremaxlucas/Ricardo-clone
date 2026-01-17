'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function MigratePage() {
  const { data: session, status } = useSession()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/run-migration', {
        method: 'POST',
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setResult({ error: e.message })
    }
    setLoading(false)
  }

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Migration ausführen</h1>
        <p className="text-red-500">Du musst eingeloggt sein, um diese Seite zu sehen.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
      <p className="mb-4 text-gray-600">
        Diese Seite fügt fehlende Spalten zur Orders-Tabelle hinzu (paymentMethod, contactDeadline, etc.)
      </p>

      <p className="mb-4 text-sm text-gray-500">
        Eingeloggt als: {session.user?.email}
      </p>

      <button
        onClick={runMigration}
        disabled={loading}
        className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? 'Migration läuft...' : 'Migration ausführen'}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-bold mb-2">Ergebnis:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
