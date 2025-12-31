'use client'

import { PayoutSection } from '@/components/account/PayoutSection'
import { StripePayoutSection } from '@/components/account/StripePayoutSection'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Check, Info, Loader2, Mail, MapPin, Phone, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import * as z from 'zod'

// Validation schema - Address fields are optional (only required when shipping/payment protection/invoices are used)
const accountSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').trim(),
  phone: z.string().optional(),
  street: z.string().trim().optional(),
  streetNumber: z
    .string()
    .regex(
      /^[0-9]+[a-zA-Z]?(-[0-9]+[a-zA-Z]?)?(\s+[a-zA-Z])?$/,
      'Ungültige Hausnummer (z.B. 6a, 12B, 4-6)'
    )
    .optional()
    .or(z.literal(''))
    .refine(val => !val || val.trim().length > 0 || val === '', 'Hausnummer darf nicht leer sein'),
  postalCode: z
    .string()
    .regex(/^[0-9]{4}$/, 'Postleitzahl muss 4 Ziffern haben (z.B. 8000)')
    .optional()
    .or(z.literal(''))
    .refine(
      val => !val || val.trim().length > 0 || val === '',
      'Postleitzahl darf nicht leer sein'
    ),
  city: z.string().trim().optional(),
  country: z.string().optional(),
  addresszusatz: z.string().optional(),
  kanton: z.string().optional(),
})

type AccountFormData = z.infer<typeof accountSchema>

// Auto-save debounce delay in ms
const AUTO_SAVE_DELAY = 2000

export default function AccountPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    getValues,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      street: '',
      streetNumber: '',
      postalCode: '',
      city: '',
      country: 'Schweiz',
      addresszusatz: '',
      kanton: '',
    },
  })

  // Watch all form values for auto-save
  const watchedValues = watch()

  // Auto-save function
  const saveData = useCallback(
    async (data: AccountFormData) => {
      // Prevent saving if data hasn't changed
      const currentDataStr = JSON.stringify(data)
      if (currentDataStr === lastSavedDataRef.current) {
        return
      }

      setSaveStatus('saving')
      setIsSaving(true)

      try {
        const res = await fetch('/api/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone || null,
            street: data.street || null,
            streetNumber: data.streetNumber || null,
            postalCode: data.postalCode || null,
            city: data.city || null,
            country: 'Schweiz',
            addresszusatz: data.addresszusatz || null,
            kanton: null,
          }),
        })

        if (res.ok) {
          lastSavedDataRef.current = currentDataStr
          setLastSaved(new Date())
          setSaveStatus('saved')
          reset(data, { keepValues: true })
          if (update) {
            await update()
          }
          // Reset status after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000)
        } else {
          const responseData = await res.json()
          setSaveStatus('error')
          toast.error(responseData.message || 'Fehler beim Speichern')
        }
      } catch (error) {
        console.error('Error saving profile:', error)
        setSaveStatus('error')
        toast.error('Fehler beim Speichern')
      } finally {
        setIsSaving(false)
      }
    },
    [reset, update]
  )

  // Auto-save effect - triggers after AUTO_SAVE_DELAY ms of inactivity
  useEffect(() => {
    // Skip if loading or no changes
    if (isLoading || !isDirty) {
      return
    }

    // Skip if there are validation errors
    if (Object.keys(errors).length > 0) {
      return
    }

    // Clear previous timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      const currentData = getValues()
      saveData(currentData)
    }, AUTO_SAVE_DELAY)

    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [watchedValues, isDirty, isLoading, errors, getValues, saveData])

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (status === 'unauthenticated' || !session) {
      const currentPath = window.location.pathname
      router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`)
      return
    }

    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      loadUserData()
    }
  }, [status, session, router])

  const loadUserData = async () => {
    try {
      const userId = (session?.user as { id?: string })?.id
      if (!userId) return
      const res = await fetch(`/api/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        const formData = {
          name: data.name || session?.user?.name || '',
          phone: data.phone || '',
          street: data.street || '',
          streetNumber: data.streetNumber || '',
          postalCode: data.postalCode || '',
          city: data.city || '',
          country: 'Schweiz',
          addresszusatz: data.addresszusatz || '',
          kanton: '',
        }
        reset(formData)
        // Store initial data to prevent unnecessary saves
        lastSavedDataRef.current = JSON.stringify(formData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      toast.error('Fehler beim Laden der Benutzerdaten')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Weiterleitung zur Anmeldung...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-12">
      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/my-watches"
          className="mb-6 inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zu Mein Verkaufen
        </Link>

        <h1 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">Benutzerkonto</h1>

        <div className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm md:p-8">
            {/* Name */}
            <div className="mb-6">
              <label
                htmlFor="name"
                className="mb-2 flex items-center text-sm font-medium text-gray-700"
              >
                <User className="mr-2 h-4 w-4" />
                Name
                <span className="ml-1 text-xs font-normal text-gray-500">
                  (bei Rechnungen erforderlich)
                </span>
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                style={{ minHeight: '44px' }}
                {...(errors.name && { 'aria-invalid': true, 'aria-describedby': 'name-error' })}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email - Non-editable */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="mb-2 flex items-center text-sm font-medium text-gray-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                E-Mail (nicht änderbar)
              </label>
              <input
                type="email"
                id="email"
                value={session.user?.email || ''}
                disabled
                className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                aria-label="E-Mail-Adresse (nicht änderbar)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Kontaktieren Sie den{' '}
                <Link href="/hilfe" className="text-primary-600 underline hover:text-primary-700">
                  Support
                </Link>
                , falls Sie die E-Mail ändern möchten.
              </p>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label
                htmlFor="phone"
                className="mb-2 flex items-center text-sm font-medium text-gray-700"
              >
                <Phone className="mr-2 h-4 w-4" />
                Telefonnummer (optional)
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                inputMode="tel"
                className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                  errors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                placeholder="+41 79 123 45 67"
                style={{ minHeight: '44px' }}
                {...(errors.phone && {
                  'aria-invalid': true,
                  'aria-describedby': 'phone-error',
                })}
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Address Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4 flex items-start justify-between">
                <h3 className="flex items-center text-lg font-semibold text-gray-900">
                  <MapPin className="mr-2 h-5 w-5" />
                  Adresse
                </h3>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Diese Angaben werden nur benötigt, wenn Sie Versand/Zahlungsschutz nutzen oder
                Rechnungen erhalten.
              </p>

              <div className="space-y-4">
                {/* Street and Street Number */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="street"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Strasse
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        (bei Versand/Zahlungsschutz/Rechnungen)
                      </span>
                    </label>
                    <input
                      {...register('street')}
                      type="text"
                      id="street"
                      className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.street
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                      placeholder="Musterstrasse"
                      style={{ minHeight: '44px' }}
                      {...(errors.street && {
                        'aria-invalid': true,
                        'aria-describedby': 'street-error',
                      })}
                    />
                    {errors.street && (
                      <p id="street-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.street.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="streetNumber"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Hausnummer
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        (bei Versand/Zahlungsschutz/Rechnungen)
                      </span>
                    </label>
                    <input
                      {...register('streetNumber')}
                      type="text"
                      id="streetNumber"
                      className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.streetNumber
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                      placeholder="12a"
                      style={{ minHeight: '44px' }}
                      {...(errors.streetNumber && {
                        'aria-invalid': true,
                        'aria-describedby': 'streetNumber-error',
                      })}
                    />
                    {errors.streetNumber && (
                      <p id="streetNumber-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.streetNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Addresszusatz (optional) */}
                <div>
                  <label
                    htmlFor="addresszusatz"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Adresszusatz (optional)
                  </label>
                  <input
                    {...register('addresszusatz')}
                    type="text"
                    id="addresszusatz"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="c/o, Appartment, etc."
                    style={{ minHeight: '44px' }}
                  />
                </div>

                {/* Postal Code and City */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Postleitzahl (PLZ)
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        (bei Versand/Zahlungsschutz/Rechnungen)
                      </span>
                    </label>
                    <input
                      {...register('postalCode')}
                      type="text"
                      id="postalCode"
                      inputMode="numeric"
                      maxLength={4}
                      className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.postalCode
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                      placeholder="8000"
                      {...(errors.postalCode && {
                        'aria-invalid': true,
                        'aria-describedby': 'postalCode-error',
                      })}
                    />
                    {errors.postalCode && (
                      <p id="postalCode-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="city" className="mb-2 block text-sm font-medium text-gray-700">
                      Ort
                      <span className="ml-1 text-xs font-normal text-gray-500">
                        (bei Versand/Zahlungsschutz/Rechnungen)
                      </span>
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      id="city"
                      className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.city
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                      placeholder="Zürich"
                      style={{ minHeight: '44px' }}
                      {...(errors.city && {
                        'aria-invalid': true,
                        'aria-describedby': 'city-error',
                      })}
                    />
                    {errors.city && (
                      <p id="city-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country - Fixed to Switzerland, not editable */}
                <div>
                  <label htmlFor="country" className="mb-2 block text-sm font-medium text-gray-700">
                    Land
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      (bei Versand/Zahlungsschutz/Rechnungen)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    value="Schweiz"
                    disabled
                    className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
                    readOnly
                  />
                  <input type="hidden" {...register('country')} value="Schweiz" />
                </div>

                {/* Privacy Info */}
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
                    <p className="text-xs text-gray-600">
                      Ihre Adresse wird nicht öffentlich angezeigt und nur bei Kauf/Versand
                      relevant.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bankverbindung für Verkäufer-Verifizierung */}
            <PayoutSection userId={(session?.user as { id?: string })?.id || ''} />

            {/* Auszahlungen (Zahlungsschutz) - Stripe Connect */}
            <StripePayoutSection />
          </div>
        </div>

        {/* Auto-save Status Indicator - Fixed at bottom */}
        {(saveStatus === 'saving' || saveStatus === 'saved') && (
          <div className="fixed bottom-4 right-4 z-50">
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg transition-all ${
                saveStatus === 'saving' ? 'bg-gray-800 text-white' : 'bg-green-600 text-white'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Gespeichert
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
