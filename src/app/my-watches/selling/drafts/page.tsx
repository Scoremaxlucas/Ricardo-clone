'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Plus, Trash2, Edit, Clock, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface Draft {
  id: string
  formData: any
  images: string[]
  selectedCategory: string | null
  selectedSubcategory: string | null
  selectedBooster: string | null
  paymentProtectionEnabled: boolean
  currentStep: number
  titleImageIndex: number
  createdAt: string
  updatedAt: string
}

export default function DraftsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Warte bis Session geladen ist
    if (status === 'loading') {
      return
    }

    // Wenn nicht authentifiziert, leite um
    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    // Load drafts
    const loadDrafts = async () => {
      try {
        const response = await fetch('/api/drafts')
        if (response.ok) {
          const data = await response.json()
          setDrafts(data.drafts || [])
        }
      } catch (error) {
        console.error('Error loading drafts:', error)
        toast.error('Fehler beim Laden der Entwürfe')
      } finally {
        setLoading(false)
      }
    }

    loadDrafts()
  }, [status, session, router])

  const handleDelete = async (draftId: string) => {
    if (!confirm('Möchten Sie diesen Entwurf wirklich löschen?')) return

    try {
      const response = await fetch(`/api/drafts?id=${draftId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId))
        toast.success('Entwurf gelöscht')
      } else {
        toast.error('Fehler beim Löschen des Entwurfs')
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
      toast.error('Fehler beim Löschen des Entwurfs')
    }
  }

  const handleContinue = (draft: Draft) => {
    // Save draft ID to localStorage for restoration
    localStorage.setItem('helvenda_restore_draft_id', draft.id)
    router.push(`/sell?step=${draft.currentStep}`)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Heute'
    if (days === 1) return 'Gestern'
    if (days < 7) return `Vor ${days} Tagen`
    return date.toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (status === 'loading' || loading) {
    return <div className="flex min-h-screen items-center justify-center">Lädt...</div>
  }

  // Wenn nicht authentifiziert, zeige Loading (Redirect wird in useEffect behandelt)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Weiterleitung zur Anmeldung...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="mr-3 h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Entwürfe</h1>
              <p className="mt-1 text-gray-600">Noch nicht veröffentlichte Anzeigen</p>
            </div>
          </div>
          <Link
            href="/sell"
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Neue Anzeige
          </Link>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow-md">
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Keine Entwürfe</h3>
              <p className="mb-6 text-gray-600">Sie haben noch keine gespeicherten Entwürfe.</p>
              <Link
                href="/sell"
                className="inline-flex items-center rounded-md bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Neue Anzeige erstellen
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => {
              const titleImage = draft.images?.[draft.titleImageIndex] || draft.images?.[0]
              const title = draft.formData?.title || 'Ohne Titel'
              const price = draft.formData?.price ? `CHF ${parseFloat(draft.formData.price).toLocaleString('de-CH')}` : 'Kein Preis'

              return (
                <div
                  key={draft.id}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Image */}
                  {titleImage ? (
                    <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                      <img
                        src={titleImage}
                        alt={title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gray-100">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900">
                      {title}
                    </h3>
                    <p className="mb-2 text-sm font-medium text-primary-600">{price}</p>

                    {/* Metadata */}
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      {draft.selectedCategory && (
                        <span className="rounded-full bg-gray-100 px-2 py-1">
                          {draft.selectedCategory}
                        </span>
                      )}
                      {draft.images?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {draft.images.length}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(draft.updatedAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(draft.id)}
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleContinue(draft)}
                          className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                        >
                          <Edit className="h-3 w-3" />
                          Fortsetzen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
