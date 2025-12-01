export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const { id } = params

  // Mock data
  const memberSince = 'September 2024'
  const itemsBought = 5
  const itemsSold = 12
  const positiveReviews = 8
  const neutralReviews = 1
  const negativeReviews = 0
  const totalReviews = positiveReviews + neutralReviews + negativeReviews

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6 rounded-lg bg-white p-8 shadow-md">
          <div className="mb-6 flex items-center space-x-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <span className="text-2xl font-bold text-primary-600">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Benutzer {id}</h1>
              <p className="text-gray-600">Mitglied seit {memberSince}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{itemsBought}</div>
              <div className="text-sm text-gray-600">Gekauft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{itemsSold}</div>
              <div className="text-sm text-gray-600">Verkauft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {totalReviews > 0
                  ? `${Math.round((positiveReviews / totalReviews) * 100)}%`
                  : '---'}
              </div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Bewertungen ({totalReviews})</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
              <span className="font-medium text-gray-900">Positiv</span>
              <span className="font-bold text-green-600">{positiveReviews}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="font-medium text-gray-900">Neutral</span>
              <span className="font-bold text-gray-600">{neutralReviews}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
              <span className="font-medium text-gray-900">Negativ</span>
              <span className="font-bold text-red-600">{negativeReviews}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
