'use client'

import { useSession } from 'next-auth/react'

export default function DebugPage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Debug Session</h1>
          
          <div className="space-y-4">
            <div>
              <strong>Status:</strong> {status}
            </div>
            
            <div>
              <strong>Session:</strong>
              <pre className="bg-gray-100 p-4 rounded mt-2 overflow-auto">
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

