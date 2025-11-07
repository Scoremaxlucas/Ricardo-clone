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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">U</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Benutzer {id}</h1>
              <p className="text-gray-600">Mitglied seit {memberSince}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
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
                {totalReviews > 0 ? `${Math.round((positiveReviews / totalReviews) * 100)}%` : '---'}
              </div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bewertungen ({totalReviews})
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">Positiv</span>
              <span className="font-bold text-green-600">{positiveReviews}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Neutral</span>
              <span className="font-bold text-gray-600">{neutralReviews}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="font-medium text-gray-900">Negativ</span>
              <span className="font-bold text-red-600">{negativeReviews}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
