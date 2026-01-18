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

        // Email verification enabled - redirect to verification notice page
        router.push(`/verify-email-notice?email=${encodeURIComponent(formData.email.trim())}`)
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

  // Einheitlicher Input Style - Gleiches Design wie Login
  const inputClassName = "block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <div className="w-full max-w-md md:max-w-xl">
      <div className="rounded-2xl bg-white px-6 py-6 shadow-xl ring-1 ring-gray-100 md:px-8 md:py-8">
        {/* Header - Kompakter */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Konto erstellen</h1>
          <p className="mt-2 text-sm text-gray-500">
            Starten Sie kostenlos auf Helvenda
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="animate-shake rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Vorname + Nachname in 2-column grid on desktop */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Vorname
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
                  className={inputClassName}
                  placeholder="Max"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Nachname
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
                  className={inputClassName}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="mb-1.5 block text-sm font-medium text-gray-700">
                Benutzername
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
                className={inputClassName}
                placeholder="maxmustermann"
              />
              <p className="mt-1 text-xs text-gray-500">
                Öffentlich sichtbar · Mind. 6 Zeichen
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="email"
                className={inputClassName}
                placeholder="max@beispiel.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="relative">
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
                  className={`${inputClassName} pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {/* Password validation feedback - Kompakter */}
              {formData.password && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    {passwordValidation.minLength ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span className={passwordValidation.minLength ? 'text-green-700' : 'text-gray-500'}>
                      6+ Zeichen
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {passwordValidation.hasNumber ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span className={passwordValidation.hasNumber ? 'text-green-700' : 'text-gray-500'}>
                      1 Zahl
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {passwordValidation.hasSpecialChar ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span className={passwordValidation.hasSpecialChar ? 'text-green-700' : 'text-gray-500'}>
                      1 Sonderzeichen
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Passwort bestätigen
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className={`${inputClassName} pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwörter stimmen nicht überein</p>
              )}
            </div>
          </div>

          {/* Checkboxes - Kompakter */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                id="age"
                name="age"
                type="checkbox"
                required
                disabled={isLoading}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Ich bin mindestens <strong>18 Jahre</strong> alt
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                disabled={isLoading}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Ich akzeptiere die{' '}
                <Link href="/terms" className="font-medium text-primary-600 hover:underline">
                  AGB
                </Link>{' '}
                und{' '}
                <Link href="/privacy" className="font-medium text-primary-600 hover:underline">
                  Datenschutzerklärung
                </Link>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            className="w-full py-3"
          >
            {isLoading ? 'Konto wird erstellt...' : 'Konto erstellen'}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Bereits ein Konto?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  )
}
