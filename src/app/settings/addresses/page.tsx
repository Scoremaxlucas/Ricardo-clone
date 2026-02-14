'use client'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  ArrowLeft,
  Home,
  Loader2,
  MapPin,
  Package,
  Plus,
  Receipt,
  Save,
  Trash2,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Address {
  street: string
  streetNumber: string
  postalCode: string
  city: string
  country: string
  addresszusatz?: string | null
  kanton?: string | null
}

const EMPTY_ADDRESS: Address = {
  street: '',
  streetNumber: '',
  postalCode: '',
  city: '',
  country: 'Schweiz',
  addresszusatz: '',
  kanton: '',
}

const ADDRESS_TYPES = [
  { type: 'MAIN', label: 'Hauptadresse', sublabel: 'Wohnadresse', icon: Home, color: 'primary', canDelete: false },
  { type: 'DELIVERY', label: 'Lieferadresse', sublabel: 'Für den Versand', icon: Package, color: 'blue', canDelete: true },
  { type: 'BILLING', label: 'Rechnungsadresse', sublabel: 'Für Rechnungen', icon: Receipt, color: 'amber', canDelete: true },
] as const

export default function AddressesPage() {
  const { t } = useLanguage()
  const { data: session, status } = useSession()
  const [addresses, setAddresses] = useState<Record<string, Address>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Address>(EMPTY_ADDRESS)

  useEffect(() => {
    if (status === 'authenticated') loadAddresses()
  }, [status])

  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/addresses')
      if (res.ok) {
        const data = await res.json()
        const mapped: Record<string, Address> = {}
        for (const addr of data.addresses || []) {
          mapped[addr.type] = addr
        }
        setAddresses(mapped)
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (type: string) => {
    setEditing(type)
    setEditForm(addresses[type] || { ...EMPTY_ADDRESS })
  }

  const cancelEditing = () => {
    setEditing(null)
    setEditForm(EMPTY_ADDRESS)
  }

  const saveAddress = async (type: string) => {
    if (!editForm.street.trim() || !editForm.postalCode.trim() || !editForm.city.trim()) {
      toast.error('Strasse, PLZ und Ort sind erforderlich.')
      return
    }

    if (!/^\d{4}$/.test(editForm.postalCode.trim())) {
      toast.error('PLZ muss 4 Ziffern lang sein.')
      return
    }

    setSaving(type)
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, address: editForm }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setAddresses(prev => ({ ...prev, [type]: editForm }))
      setEditing(null)
      toast.success('Adresse gespeichert.')
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Speichern.')
    } finally {
      setSaving(null)
    }
  }

  const deleteAddress = async (type: string) => {
    if (!confirm('Möchten Sie diese Adresse wirklich löschen?')) return

    setSaving(type)
    try {
      const res = await fetch('/api/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message)
      }

      setAddresses(prev => {
        const updated = { ...prev }
        delete updated[type]
        return updated
      })
      toast.success('Adresse gelöscht.')
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Löschen.')
    } finally {
      setSaving(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="rounded-lg border bg-white p-8 text-center shadow-md">
            <p className="text-gray-600">Bitte melden Sie sich an.</p>
            <Link href="/login" className="mt-4 inline-block text-primary-600 hover:underline">
              Zum Login
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-12">
        <Link
          href="/profile"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Profil
        </Link>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Meine Adressen</h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Verwalten Sie Ihre Haupt-, Liefer- und Rechnungsadressen.
          </p>
        </div>

        <div className="space-y-4">
          {ADDRESS_TYPES.map(({ type, label, sublabel, icon: Icon, color, canDelete }) => {
            const addr = addresses[type]
            const isEditing = editing === type
            const isSaving = saving === type

            return (
              <div key={type} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                {/* Header */}
                <div className={`flex items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-6`}>
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    color === 'primary' ? 'bg-primary-100' : color === 'blue' ? 'bg-blue-100' : 'bg-amber-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      color === 'primary' ? 'text-primary-600' : color === 'blue' ? 'text-blue-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
                    <p className="text-xs text-gray-500">{sublabel}</p>
                  </div>
                  {addr && !isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(type)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                      >
                        Bearbeiten
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => deleteAddress(type)}
                          disabled={isSaving}
                          title="Adresse löschen"
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="px-4 py-4 sm:px-6">
                  {isEditing ? (
                    /* Edit Form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="mb-1 block text-xs font-medium text-gray-700">Strasse *</label>
                          <input
                            value={editForm.street}
                            onChange={e => setEditForm(f => ({ ...f, street: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Bahnhofstrasse"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">Nr.</label>
                          <input
                            value={editForm.streetNumber}
                            onChange={e => setEditForm(f => ({ ...f, streetNumber: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="1"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Adresszusatz</label>
                        <input
                          value={editForm.addresszusatz || ''}
                          onChange={e => setEditForm(f => ({ ...f, addresszusatz: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="c/o, Wohnung, etc."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">PLZ *</label>
                          <input
                            value={editForm.postalCode}
                            onChange={e => setEditForm(f => ({ ...f, postalCode: e.target.value }))}
                            maxLength={4}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="8001"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1 block text-xs font-medium text-gray-700">Ort *</label>
                          <input
                            value={editForm.city}
                            onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Zürich"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={cancelEditing}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={() => saveAddress(type)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Speichern
                        </button>
                      </div>
                    </div>
                  ) : addr ? (
                    /* Display Address */
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <div className="text-sm text-gray-700">
                        <p>
                          {addr.street} {addr.streetNumber}
                          {addr.addresszusatz && <span className="text-gray-500">, {addr.addresszusatz}</span>}
                        </p>
                        <p>{addr.postalCode} {addr.city}</p>
                        <p className="text-gray-500">{addr.country || 'Schweiz'}</p>
                      </div>
                    </div>
                  ) : (
                    /* Empty State */
                    <button
                      onClick={() => startEditing(type)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-primary-300 hover:text-primary-600"
                    >
                      <Plus className="h-4 w-4" />
                      {label} hinzufügen
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
      <Footer />
    </div>
  )
}
