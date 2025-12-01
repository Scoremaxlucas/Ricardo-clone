'use client'

import { useSession } from 'next-auth/react'

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Debug Session</h1>

          <div className="space-y-4">
            <div>
              <strong>Status:</strong> {status}
            </div>

            <div>
              <strong>Session:</strong>
              <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div>
              <strong>User ID:</strong> {session?.user?.id || 'Nicht verfügbar'}
            </div>

            <div>
              <strong>Email:</strong> {session?.user?.email || 'Nicht verfügbar'}
            </div>

            <div>
              <strong>Name:</strong> {session?.user?.name || 'Nicht verfügbar'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
