import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { WohnungenPageClient } from './WohnungenPageClient'

export default function WohnungenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <div className="flex justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          </div>
        </div>
      }
    >
      <WohnungenPageClient />
    </Suspense>
  )
}
