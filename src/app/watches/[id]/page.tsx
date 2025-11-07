'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Send, Globe, Lock, Calendar, MapPin, Package, Clock, Tag, Heart } from 'lucide-react'
import Image from 'next/image'

interface Watch {
  id: string
  title: string
  description: string
  brand: string
  model: string
  year: number | null
  condition: string
  price: number
  buyNowPrice: number | null
  isAuction: boolean
  auctionEnd: string | null
  images: string
  createdAt: string
  seller: {
    id: string
    name: string
    email: string
  }
  fullset: boolean
  allLinks: boolean
  box: boolean
  papers: boolean
  warranty: string | null
  warrantyMonths: number | null
  warrantyYears: number | null
  warrantyNote: string | null
  warrantyDescription: string | null
  lastRevision: string | null
  accuracy: string | null
  shippingMethod: string | null
  bids: any[]
}

interface Message {
  id: string
  content: string
  createdAt: string
  isPublic: boolean
  sender: {
    id: string
    name: string
    image: string | null
  }
  receiver: {
    id: string
    name: string
    image: string | null
  }
}

export default function WatchDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [watch, setWatch] = useState<Watch | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [sending, setSending] = useState(false)


  const isBase64Image = (src: string) => {
    return src && (src.startsWith('data:image/') || src.length > 1000)
  }

  useEffect(() => {
    fetchWatch()
    fetchMessages()
  }, [params.id])

  const fetchWatch = async () => {
    try {
      const res = await fetch(`/api/watches/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setWatch(data.watch)
      }
    } catch (error) {
      console.error('Error fetching watch:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/watches/${params.id}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleBuyNow = () => {
    if (!session) {
      router.push('/login')
      return
    }
    if (!watch) return
    router.push(`/checkout?watchId=${watch.id}`)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !newMessage.trim() || !watch) return

    setSending(true)
    try {
      const isSeller = session.user?.id === watch.seller.id
      const receiverId = isSeller ? 'interessent-id' : watch.seller.id

      const res = await fetch(`/api/watches/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          receiverId: receiverId,
          isPublic: isSeller ? isPublic : false,
        }),
      })

      if (res.ok) {
        setNewMessage('')
        setIsPublic(false)
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  if (!watch) {
    return <div className="flex min-h-screen items-center justify-center">Uhr nicht gefunden</div>
  }

  const isSeller = session?.user?.id === watch.seller.id
  const images = watch.images ? watch.images.split(',') : []
  const imageUrl = images[0] || '/placeholder-watch.jpg'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Zurück-Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          ← Zurück zur Übersicht
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hauptinhalt */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bilder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="relative aspect-square w-full max-w-2xl mx-auto">
                {isBase64Image(imageUrl) ? (
                  <img
                    src={imageUrl}
                    alt={watch.title}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={watch.title}
                    fill
                    className="object-contain rounded-lg"
                  />
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      {isBase64Image(img) ? (
                        <img
                          src={img}
                          alt={`${watch.title} ${idx + 2}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Image
                          src={img}
                          alt={`${watch.title} ${idx + 2}`}
                          fill
                          className="object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Beschreibung */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Beschreibung</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{watch.description || 'Keine Beschreibung verfügbar'}</p>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Marke:</span>
                  <span className="ml-2 font-medium">{watch.brand}</span>
                </div>
                <div>
                  <span className="text-gray-600">Modell:</span>
                  <span className="ml-2 font-medium">{watch.model}</span>
                </div>
                {watch.year && (
                  <div>
                    <span className="text-gray-600">Jahrgang:</span>
                    <span className="ml-2 font-medium">{watch.year}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Zustand:</span>
                  <span className="ml-2 font-medium">{watch.condition}</span>
                </div>
                {/* Vollständigkeit */}
                {(watch.fullset || watch.allLinks || watch.box || watch.papers) && (
                  <div className="col-span-2">
                    <span className="text-gray-600 font-medium">Vollständigkeit:</span>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {watch.fullset && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          ✓ Fullset
                        </span>
                      )}
                      {watch.allLinks && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          ✓ Alle Glieder
                        </span>
                      )}
                      {watch.box && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          ✓ Box
                        </span>
                      )}
                      {watch.papers && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          ✓ Papiere
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {watch.lastRevision && (
                  <div>
                    <span className="text-gray-600">Letzte Revision:</span>
                    <span className="ml-2 font-medium">
                      {new Date(watch.lastRevision).toLocaleDateString('de-CH')}
                    </span>
                  </div>
                )}
                {watch.accuracy && (
                  <div>
                    <span className="text-gray-600">Ganggenauigkeit:</span>
                    <span className="ml-2 font-medium">{watch.accuracy}</span>
                  </div>
                )}
                {watch.warranty && (
                  <div className="col-span-2">
                    <span className="text-gray-600 font-medium">Garantie:</span>
                    <div className="mt-1">
                      <span className="font-medium">
                        {watch.warranty === 'manufacturer' && 'Herstellergarantie'}
                        {watch.warranty === 'seller' && 'Verkäufergarantie'}
                        {watch.warranty === 'none' && 'Keine Garantie'}
                        {watch.warrantyMonths && ` (${watch.warrantyMonths} Monate)`}
                        {watch.warrantyYears && ` (${watch.warrantyYears} Jahre)`}
                      </span>
                      {watch.warrantyNote && (
                        <p className="text-sm text-gray-600 mt-1">{watch.warrantyNote}</p>
                      )}
                      {watch.warrantyDescription && (
                        <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded">
                          {watch.warrantyDescription}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preis & Aktionen */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{watch.title}</h1>
              <p className="text-gray-600 mb-6">{watch.brand} {watch.model}</p>

              {watch.isAuction ? (
                <div className="mb-6">
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    CHF {watch.price.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600">Aktuelles Gebot</p>
                  {watch.buyNowPrice && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-xl font-semibold text-gray-900 mb-2">
                        Sofortkauf: CHF {watch.buyNowPrice.toFixed(2)}
                      </div>
                      <button 
                        onClick={handleBuyNow}
                        className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                      >
                        Jetzt kaufen
                      </button>
                    </div>
                  )}
                  {watch.auctionEnd && (
                    <p className="text-sm text-gray-600 mt-2">
                      Auktion endet: {new Date(watch.auctionEnd).toLocaleDateString('de-CH')}
                    </p>
                  )}
                  <button className="w-full mt-4 bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700">
                    Gebot abgeben
                  </button>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    CHF {watch.price.toFixed(2)}
                  </div>
                  <button 
                    onClick={handleBuyNow}
                    className="w-full bg-primary-600 text-white py-3 rounded-md hover:bg-primary-700"
                  >
                    Jetzt kaufen
                  </button>
                </div>
              )}

              <button className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-md hover:border-primary-500 hover:text-primary-600 flex items-center justify-center">
                <Heart className="h-5 w-5 mr-2" />
                Zu Favoriten hinzufügen
              </button>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Verkäufer</h3>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {watch.seller.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <a href={`/profile/${watch.seller.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {watch.seller.name}
                    </a>
                    <p className="text-sm text-gray-600">
                      Mitglied seit {new Date(watch.createdAt).toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nachrichten-Bereich */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Fragen & Antworten
          </h2>

          {/* Nachrichten-Liste */}
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine Fragen oder Antworten vorhanden.
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.isPublic ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">
                        {message.sender.name}
                      </span>
                      {message.isPublic && (
                        <Globe className="h-4 w-4 text-blue-600" title="Öffentlich" />
                      )}
                      {!message.isPublic && (
                        <Lock className="h-4 w-4 text-gray-400" title="Privat" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Nachricht senden (nur für eingeloggte Nutzer) */}
          {session && (
            <form onSubmit={handleSendMessage} className="border-t pt-6">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Stellen Sie eine Frage..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                required
              />
              
              {/* Nur Verkäufer kann öffentlich machen */}
              {isSeller && (
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 flex items-center cursor-pointer">
                    <Globe className="h-4 w-4 mr-1" />
                    Diese Antwort öffentlich anzeigen
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="mt-4 bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Wird gesendet...' : 'Frage senden'}
              </button>
            </form>
          )}

          {!session && (
            <div className="border-t pt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-gray-700">
                Bitte <a href="/login" className="text-primary-600 hover:underline">melden Sie sich an</a>, um Fragen zu stellen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
