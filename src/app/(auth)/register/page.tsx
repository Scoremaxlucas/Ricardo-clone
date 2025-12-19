'use client'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Password validation state
  const passwordValidation = {
    minLength: formData.password.length >= 6,
    hasNumber: /\d/.test(formData.password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password),
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      setIsLoading(false)
      return
    }

    // Prüfe auf mindestens eine Zahl
    if (!/\d/.test(formData.password)) {
      setError('Passwort muss mindestens eine Zahl enthalten')
      setIsLoading(false)
      return
    }

    // Prüfe auf mindestens ein Sonderzeichen
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Passwort muss mindestens ein Sonderzeichen enthalten')
      setIsLoading(false)
      return
    }

    if (formData.nickname.length < 6) {
      setError('Nickname muss mindestens 6 Zeichen lang sein')
      setIsLoading(false)
      return
    }

    try {
      // Trim all fields before sending to backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          nickname: formData.nickname.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Email verification disabled - redirect to login page
        router.push(`/login?registered=true&email=${encodeURIComponent(formData.email.trim())}`)
      } else {
        const data = await response.json()
        // Show detailed error including errorCode if available
        const errorMessage = data.message || 'Ein Fehler ist aufgetreten'
        const errorDetails = data.errorCode
          ? `${errorMessage} (Fehlercode: ${data.errorCode})`
          : errorMessage
        console.error('[register] Registration failed:', {
          status: response.status,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
          errorMeta: data.errorMeta,
          response: data,
        })
        setError(errorDetails)
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md md:max-w-xl">
      <div className="space-y-6 rounded-xl bg-white px-6 py-8 shadow-lg ring-1 ring-gray-100 md:px-10 md:py-10">
        <div className="text-center">
          <div className="mb-4 flex justify-center md:mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Neues Konto erstellen
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 md:mt-3">
            Oder{' '}
            <Link
              href="/login"
              className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
            >
              melden Sie sich mit Ihrem bestehenden Konto an
            </Link>
          </p>
        </div>

        <form className="mt-6 space-y-5 md:mt-8 md:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Vorname + Nachname in 2-column grid on desktop */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-gray-700">
                  Vorname *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="given-name"
                  className="relative mt-1 block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Max"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-gray-700">
                  Nachname *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="family-name"
                  className="relative mt-1 block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-gray-700">
                Nickname *
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                required
                minLength={6}
                value={formData.nickname}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="username"
                className="relative mt-1 block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                placeholder="maxmustermann"
              />
              <p className="mt-1 text-xs text-gray-500">
                Dieser Name wird öffentlich angezeigt (mindestens 6 Zeichen)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                E-Mail-Adresse *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
                className="relative mt-1 block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                placeholder="max@beispiel.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort *
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Passwort eingeben"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {/* Password validation feedback */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {passwordValidation.minLength ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span
                      className={passwordValidation.minLength ? 'text-green-700' : 'text-gray-500'}
                    >
                      mind. 6 Zeichen
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordValidation.hasNumber ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span
                      className={passwordValidation.hasNumber ? 'text-green-700' : 'text-gray-500'}
                    >
                      mind. 1 Zahl
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordValidation.hasSpecialChar ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span
                      className={
                        passwordValidation.hasSpecialChar ? 'text-green-700' : 'text-gray-500'
                      }
                    >
                      mind. 1 Sonderzeichen
                    </span>
                  </div>
                </div>
              )}
              {!formData.password && (
                <p className="mt-1 text-xs text-gray-500">
                  Mindestens 6 Zeichen, eine Zahl und ein Sonderzeichen erforderlich
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Passwort bestätigen *
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="relative block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 placeholder-gray-400 transition-colors focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                  placeholder="Passwort wiederholen"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword &&
                formData.confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">Passwörter stimmen nicht überein</p>
                )}
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              Ich akzeptiere die{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                Allgemeinen Geschäftsbedingungen
              </Link>{' '}
              und die{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                Datenschutzerklärung
              </Link>
            </label>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary-teal"
              disabled={isLoading}
              loading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Konto wird erstellt...' : 'Konto erstellen'}
            </Button>
            {/* Login link below button */}
            <p className="mt-3 text-center text-sm text-gray-600">
              Schon ein Konto?{' '}
              <Link
                href="/login"
                className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
              >
                Anmelden
              </Link>
            </p>
            {/* Reassurance line */}
            <p className="mt-2 text-center text-xs text-gray-500">
              Kostenlos. Wir senden dir eine Bestätigungs-E-Mail.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
