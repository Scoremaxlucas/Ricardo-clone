import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { RentalApplicationDetailClient } from './RentalApplicationDetailClient'

export default function RentalApplicationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      }
    >
      <RentalApplicationDetailClient />
    </Suspense>
  )
}
