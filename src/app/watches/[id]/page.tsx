'use client'

import { Globe, Heart, Lock, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
      const res = await fetch(`/api/articles/${params.id}`)
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
      const res = await fetch(`/api/articles/${params.id}/messages`)
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
      <div className="mx-auto max-w-7xl px-4">
        {/* Zurück-Button */}
        <button onClick={() => router.back()} className="mb-6 text-gray-600 hover:text-gray-900">
          ← Zurück zur Übersicht
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Hauptinhalt */}
          <div className="space-y-6 lg:col-span-2">
            {/* Bilder */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="relative mx-auto aspect-square w-full max-w-2xl">
                {isBase64Image(imageUrl) || imageUrl.includes('blob.vercel-storage.com') ? (
                  <img
                    src={imageUrl}
                    alt={watch.title}
                    className="h-full w-full rounded-lg object-contain"
                  />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={watch.title}
                    fill
                    className="rounded-lg object-contain"
                  />
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      {isBase64Image(img) || img.includes('blob.vercel-storage.com') ? (
                        <img
                          src={img}
                          alt={`${watch.title} ${idx + 2}`}
                          className="h-full w-full rounded object-cover"
                        />
                      ) : (
                        <Image
                          src={img}
                          alt={`${watch.title} ${idx + 2}`}
                          fill
                          className="rounded object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Beschreibung */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Beschreibung</h2>
              <p className="whitespace-pre-wrap text-gray-700">
                {watch.description || 'Keine Beschreibung verfügbar'}
              </p>
            </div>

            {/* Details */}
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Details</h2>
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
                    <span className="font-medium text-gray-600">Vollständigkeit:</span>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {watch.fullset && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                          ✓ Fullset
                        </span>
                      )}
                      {watch.allLinks && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
                          ✓ Alle Glieder
                        </span>
                      )}
                      {watch.box && (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800">
                          ✓ Box
                        </span>
                      )}
                      {watch.papers && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800">
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
                    <span className="font-medium text-gray-600">Garantie:</span>
                    <div className="mt-1">
                      <span className="font-medium">
                        {watch.warranty === 'manufacturer' && 'Herstellergarantie'}
                        {watch.warranty === 'seller' && 'Verkäufergarantie'}
                        {watch.warranty === 'none' && 'Keine Garantie'}
                        {watch.warrantyMonths && ` (${watch.warrantyMonths} Monate)`}
                        {watch.warrantyYears && ` (${watch.warrantyYears} Jahre)`}
                      </span>
                      {watch.warrantyNote && (
                        <p className="mt-1 text-sm text-gray-600">{watch.warrantyNote}</p>
                      )}
                      {watch.warrantyDescription && (
                        <p className="mt-2 rounded bg-gray-50 p-3 text-sm text-gray-700">
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
            <div className="sticky top-4 rounded-lg bg-white p-6 shadow-md">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">{watch.title}</h1>
              <p className="mb-6 text-gray-600">
                {watch.brand} {watch.model}
              </p>

              {watch.isAuction ? (
                <div className="mb-6">
                  <div className="mb-2 text-2xl font-bold text-primary-600">
                    CHF {watch.price.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600">Aktuelles Gebot</p>
                  {watch.buyNowPrice && (
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-2 text-xl font-semibold text-gray-900">
                        Sofortkauf: CHF {watch.buyNowPrice.toFixed(2)}
                      </div>
                      <button
                        onClick={handleBuyNow}
                        className="w-full rounded-md bg-green-600 py-2 text-white hover:bg-green-700"
                      >
                        Jetzt kaufen
                      </button>
                    </div>
                  )}
                  {watch.auctionEnd && (
                    <p className="mt-2 text-sm text-gray-600">
                      Auktion endet: {new Date(watch.auctionEnd).toLocaleDateString('de-CH')}
                    </p>
                  )}
                  <button className="mt-4 w-full rounded-md bg-primary-600 py-3 text-white hover:bg-primary-700">
                    Gebot abgeben
                  </button>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="mb-2 text-3xl font-bold text-primary-600">
                    CHF {watch.price.toFixed(2)}
                  </div>
                  <button
                    onClick={handleBuyNow}
                    className="w-full rounded-md bg-primary-600 py-3 text-white hover:bg-primary-700"
                  >
                    Jetzt kaufen
                  </button>
                </div>
              )}

              <button className="flex w-full items-center justify-center rounded-md border-2 border-gray-300 py-3 text-gray-700 hover:border-primary-500 hover:text-primary-600">
                <Heart className="mr-2 h-5 w-5" />
                Zu Favoriten hinzufügen
              </button>

              <div className="mt-6 border-t pt-6">
                <h3 className="mb-2 font-semibold text-gray-900">Verkäufer</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                    <span className="font-semibold text-primary-600">
                      {watch.seller.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <a
                      href={`/profile/${watch.seller.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {watch.seller.name}
                    </a>
                    <p className="text-sm text-gray-600">
                      Mitglied seit{' '}
                      {new Date(watch.createdAt).toLocaleDateString('de-CH', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nachrichten-Bereich */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Fragen & Antworten</h2>

          {/* Nachrichten-Liste */}
          {messages.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Noch keine Fragen oder Antworten vorhanden.
            </div>
          ) : (
            <div className="mb-6 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`rounded-lg p-4 ${
                    message.isPublic ? 'border-l-4 border-blue-500 bg-blue-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{message.sender.name}</span>
                      {message.isPublic && (
                        <span title="Öffentlich">
                          <Globe className="h-4 w-4 text-blue-600" />
                        </span>
                      )}
                      {!message.isPublic && (
                        <span title="Privat">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleDateString('de-CH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
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
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Stellen Sie eine Frage..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                required
              />

              {/* Nur Verkäufer kann öffentlich machen */}
              {isSeller && (
                <div className="mt-4 flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600"
                  />
                  <label
                    htmlFor="isPublic"
                    className="flex cursor-pointer items-center text-sm text-gray-700"
                  >
                    <Globe className="mr-1 h-4 w-4" />
                    Diese Antwort öffentlich anzeigen
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="mt-4 flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Wird gesendet...' : 'Frage senden'}
              </button>
            </form>
          )}

          {!session && (
            <div className="rounded-lg border border-t border-yellow-200 bg-yellow-50 p-4 pt-6 text-center">
              <p className="text-gray-700">
                Bitte{' '}
                <a href="/login" className="text-primary-600 hover:underline">
                  melden Sie sich an
                </a>
                , um Fragen zu stellen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
