export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Loading Skeleton */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-300"></div>
                  </div>
                  <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
                <div className="flex flex-col md:flex-row">
                  <div className="h-48 w-full animate-pulse bg-gray-200 md:w-48"></div>
                  <div className="flex-1 p-6">
                    <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200"></div>
                    <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-300"></div>
                    <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-6 w-24 animate-pulse rounded bg-gray-300"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

