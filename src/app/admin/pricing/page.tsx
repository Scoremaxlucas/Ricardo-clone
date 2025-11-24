'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DollarSign, Save, ArrowLeft, Edit, Trash2, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PricingSettings {
  platformMarginRate: number // Prozent (0.1 = 10%)
  vatRate: number // MwSt-Satz (0.081 = 8.1%)
  minimumCommission: number // Minimale Kommission in CHF
  maximumCommission: number // Maximale Kommission (Kostendach) in CHF
  listingFee: number // Listing-Gebühr pro Angebot in CHF
  transactionFee: number // Transaktionsgebühr zusätzlich zur Marge in CHF
}

interface BoosterPrice {
  id: string
  code: string
  name: string
  description: string | null
  price: number
  isActive: boolean
}

type Tab = 'fees' | 'boosters'

export default function AdminPricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('fees')
  const [saving, setSaving] = useState(false)
  const [editingBooster, setEditingBooster] = useState<BoosterPrice | null>(null)
  const [boosters, setBoosters] = useState<BoosterPrice[]>([])
  const [settings, setSettings] = useState<PricingSettings>({
    platformMarginRate: 0.05, // Start with 5%, user can change to 10%
    vatRate: 0.081, // 8.1%
    minimumCommission: 0,
    maximumCommission: 220, // Kostendach CHF 220.-
    listingFee: 0,
    transactionFee: 0
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      if (status === 'unauthenticated') {
        setLoading(false)
        router.push('/login')
      }
      return
    }

    // Prüfe Admin-Status nur aus Session
    const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1

    if (isAdminInSession) {
      loadPricing()
      loadBoosters()
      return
    }

    // Falls nicht in Session, prüfe in DB
    fetch('/api/user/admin-status')
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          loadPricing()
          loadBoosters()
        } else {
          setLoading(false)
          router.push('/')
        }
      })
      .catch((error) => {
        console.error('Error checking admin status:', error)
        setLoading(false)
        router.push('/')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status])

  const loadPricing = async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        console.error('Error loading pricing settings')
      }
    } catch (error) {
      console.error('Error loading pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBoosters = async () => {
    try {
      const res = await fetch('/api/admin/boosters')
      console.log('LoadBoosters response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Boosters loaded in admin:', data)
        setBoosters(data)
      } else {
        const errorData = await res.json()
        console.error('Boosters API error:', errorData)
      }
    } catch (error) {
      console.error('Error loading boosters:', error)
    }
  }

  const handleSaveFees = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        alert('Pricing-Einstellungen erfolgreich gespeichert!')
      } else {
        const data = await res.json()
        alert('Fehler beim Speichern: ' + (data.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error saving pricing:', error)
      alert('Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBooster = async () => {
    if (!editingBooster) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/boosters/${editingBooster.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBooster)
      })

      if (res.ok) {
        alert('Booster erfolgreich aktualisiert!')
        setEditingBooster(null)
        loadBoosters()
      } else {
        const data = await res.json()
        alert('Fehler: ' + (data.message || 'Unbekannter Fehler'))
      }
    } catch (error) {
      console.error('Error saving booster:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof PricingSettings, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setSettings(prev => ({ ...prev, [field]: numValue }))
    }
  }

  const handleBoosterChange = (field: keyof BoosterPrice, value: any) => {
    if (!editingBooster) return
    setEditingBooster({ ...editingBooster, [field]: value })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lädt...</p>
        </div>
      </div>
    )
  }

  // Prüfe Admin-Status nur aus Session
  const isAdminInSession = session?.user?.isAdmin === true || session?.user?.isAdmin === 1
  
  if (!session || !isAdminInSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sie haben keine Berechtigung für diese Seite.</p>
          <Link href="/" className="mt-4 text-primary-600 hover:text-primary-700">
            Zurück zur Hauptseite
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pricing-Verwaltung</h1>
              <p className="mt-2 text-gray-600">Plattform-Gebühren und Booster-Preise konfigurieren</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Hauptseite
              </Link>
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('fees')}
              className={`${
                activeTab === 'fees'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <DollarSign className="inline h-4 w-4 mr-2" />
              Gebühren
            </button>
            <button
              onClick={() => setActiveTab('boosters')}
              className={`${
                activeTab === 'boosters'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              <Sparkles className="inline h-4 w-4 mr-2" />
              Booster
            </button>
          </nav>
        </div>

        {/* Gebühren Tab */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              {/* Plattform-Marge (10%) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plattform-Gebühr (in Prozent)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.platformMarginRate}
                    onChange={(e) => handleChange('platformMarginRate', e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                  <span className="text-gray-600">
                    = {(settings.platformMarginRate * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Von jedem Verkauf (z.B. 0.1 = 10%)
                </p>
              </div>

              {/* MwSt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mehrwertsteuer (MwSt)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={settings.vatRate}
                    onChange={(e) => handleChange('vatRate', e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                  <span className="text-gray-600">
                    = {(settings.vatRate * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Schweizer MwSt-Satz (Standard: 8.1%)
                </p>
              </div>

              {/* Maximale Kommission (Kostendach) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximale Kommission / Kostendach (CHF)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.maximumCommission}
                  onChange={(e) => handleChange('maximumCommission', e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximale Kommission (z.B. CHF 220.-). Wenn 10% Marge diesen Betrag übersteigt, wird er auf diesen Wert gedeckelt.
                </p>
              </div>

              {/* Beispiel-Berechnung */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Beispiel-Berechnung (CHF 1'000 Verkauf)</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verkaufspreis:</span>
                    <span className="font-medium">CHF 1'000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plattform-Gebühr ({(settings.platformMarginRate * 100).toFixed(2)}%):</span>
                    <span className="font-medium">CHF {(1000 * settings.platformMarginRate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zwischensumme:</span>
                    <span className="font-medium">CHF {(1000 * settings.platformMarginRate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">MwSt ({(settings.vatRate * 100).toFixed(2)}%):</span>
                    <span className="font-medium">CHF {(1000 * settings.platformMarginRate * settings.vatRate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">Total zu zahlen:</span>
                    <span className="font-semibold text-primary-600">
                      CHF {((1000 * settings.platformMarginRate) * (1 + settings.vatRate)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Speichern-Button */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={handleSaveFees}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Speichern
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booster Tab */}
        {activeTab === 'boosters' && (
          <div className="bg-white rounded-lg shadow">
            {!editingBooster ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Booster-Preise</h2>
                </div>
                {boosters.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Keine Booster gefunden. Bitte seeden Sie die Booster.</p>
                    <button
                      onClick={loadBoosters}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      Erneut laden
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {boosters.map((booster) => (
                      <div key={booster.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{booster.name}</h3>
                              {!booster.isActive && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Inaktiv</span>
                              )}
                            </div>
                            {booster.description && (
                              <p className="text-sm text-gray-600 mb-2">{booster.description}</p>
                            )}
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{booster.code}</code>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-base font-bold text-primary-600">CHF {booster.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingBooster(booster)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Booster bearbeiten</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingBooster.name}
                      onChange={(e) => handleBoosterChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code
                    </label>
                    <input
                      type="text"
                      value={editingBooster.code}
                      onChange={(e) => handleBoosterChange('code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschreibung
                    </label>
                    <textarea
                      value={editingBooster.description || ''}
                      onChange={(e) => handleBoosterChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preis (CHF)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingBooster.price}
                      onChange={(e) => handleBoosterChange('price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingBooster.isActive}
                      onChange={(e) => handleBoosterChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Aktiv
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveBooster}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Speichern...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Speichern
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingBooster(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
