'use client'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuthWohnenSurface } from '@/contexts/AuthSurfaceContext'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  authCardShellClass,
  authCheckboxClass,
  authInputClass,
  authLabelClass,
  authLinkAccentClass,
  authMutedTextClass,
  authTitleClass,
} from '@/lib/auth-surface-classes'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { cn } from '@/lib/utils'
import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RegisterPage() {
  const isWohnenSurface = useAuthWohnenSurface()
  const { t } = useLanguage()
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
  const [signupIntent, setSignupIntent] = useState<'marketplace' | 'wohnen'>('marketplace')
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const params = new URL(window.location.href).searchParams
      if (params.get('intent') === 'wohnen') {
        setSignupIntent('wohnen')
        return
      }
      const wohnenHost = new URL(WOHNEN_SITE_ORIGIN).hostname
      if (window.location.hostname === wohnenHost) {
        setSignupIntent('wohnen')
        return
      }
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (document.cookie.split(';').some(c => c.trim().startsWith('helvenda-wohnen-preview='))) {
          setSignupIntent('wohnen')
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

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
      setError(t.register.passwordsDontMatch)
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError(t.register.passwordTooShort)
      setIsLoading(false)
      return
    }

    // Prüfe auf mindestens eine Zahl
    if (!/\d/.test(formData.password)) {
      setError(t.register.passwordNoNumber)
      setIsLoading(false)
      return
    }

    // Prüfe auf mindestens ein Sonderzeichen
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError(t.register.passwordNoSpecialChar)
      setIsLoading(false)
      return
    }

    if (formData.nickname.length < 6) {
      setError(t.register.nicknameTooShort)
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
          language: (localStorage.getItem('language') || 'de').toLowerCase(),
          signupIntent,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Email verification enabled - redirect to verification notice page
        const noticeQs =
          `email=${encodeURIComponent(formData.email.trim())}` +
          (signupIntent === 'wohnen' ? '&intent=wohnen' : '')
        router.push(`/verify-email-notice?${noticeQs}`)
      } else {
        const data = await response.json()
        // Show detailed error including errorCode if available
        const errorMessage = data.message || t.register.error
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
      setError(t.register.error)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClassName = authInputClass(isWohnenSurface)

  return (
    <div className="w-full max-w-md md:max-w-xl">
      <div className={authCardShellClass(isWohnenSurface)}>
        {/* Header - Kompakter */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="md" />
          </div>
          <h1 className={authTitleClass(isWohnenSurface)}>{t.register.title}</h1>
          <p className={`mt-2 ${authMutedTextClass(isWohnenSurface)}`}>{t.register.subtitle}</p>
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
                <label htmlFor="firstName" className={authLabelClass(isWohnenSurface)}>
                  {t.register.firstName}
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
                <label htmlFor="lastName" className={authLabelClass(isWohnenSurface)}>
                  {t.register.lastName}
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
              <label htmlFor="nickname" className={authLabelClass(isWohnenSurface)}>
                {t.register.username}
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
              <p className={cn('mt-1 text-xs', isWohnenSurface ? 'text-[#8aa89e]' : 'text-gray-500')}>
                {t.register.usernameDesc}
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={authLabelClass(isWohnenSurface)}>
                {t.register.email}
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
              <label htmlFor="password" className={authLabelClass(isWohnenSurface)}>
                {t.register.password}
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
                  className={
                    isWohnenSurface
                      ? 'absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-[#107a5a]'
                      : 'absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600'
                  }
                  aria-label={showPassword ? t.register.hidePassword : t.register.showPassword}
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
                      {t.register.passwordRequirement1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {passwordValidation.hasNumber ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span className={passwordValidation.hasNumber ? 'text-green-700' : 'text-gray-500'}>
                      {t.register.passwordRequirement2}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {passwordValidation.hasSpecialChar ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <span className={passwordValidation.hasSpecialChar ? 'text-green-700' : 'text-gray-500'}>
                      {t.register.passwordRequirement3}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className={authLabelClass(isWohnenSurface)}>
                {t.register.confirmPassword}
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
                  className={
                    isWohnenSurface
                      ? 'absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-[#107a5a]'
                      : 'absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600'
                  }
                  aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{t.register.passwordsDontMatch}</p>
              )}
            </div>
          </div>

          {/* Checkboxes - Kompakter */}
          <div
            className={cn(
              'space-y-3 rounded-lg p-4',
              isWohnenSurface ? 'bg-[#f0faf5] ring-1 ring-[#d4eee4]/60' : 'bg-gray-50'
            )}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                id="age"
                name="age"
                type="checkbox"
                required
                disabled={isLoading}
                className={cn('mt-0.5', authCheckboxClass(isWohnenSurface))}
              />
              <span className={isWohnenSurface ? 'text-sm text-[#2d4a3d]' : 'text-sm text-gray-700'}>
                {t.register.ageCheck}
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                disabled={isLoading}
                className={cn('mt-0.5', authCheckboxClass(isWohnenSurface))}
              />
              <span className={isWohnenSurface ? 'text-sm text-[#2d4a3d]' : 'text-sm text-gray-700'}>
                {t.register.termsCheck}{' '}
                <Link
                  href="/terms"
                  className={cn('font-medium underline', isWohnenSurface ? 'text-[#107a5a]' : 'text-primary-600')}
                >
                  {t.register.terms}
                </Link>{' '}
                {t.register.and}{' '}
                <Link
                  href="/privacy"
                  className={cn('font-medium underline', isWohnenSurface ? 'text-[#107a5a]' : 'text-primary-600')}
                >
                  {t.register.privacy}
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
            {isLoading ? t.register.submitting : t.register.submit}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className={cn('w-full border-t', isWohnenSurface ? 'border-[#d4eee4]' : 'border-gray-200')} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={cn('bg-white px-3', isWohnenSurface ? 'text-[#8aa89e]' : 'text-gray-400')}>oder</span>
          </div>
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          disabled={isLoading}
          className={cn(
            'mt-4 flex w-full items-center justify-center gap-3 rounded-lg border bg-white px-4 py-3 text-sm font-medium shadow-sm transition-all disabled:opacity-50',
            isWohnenSurface
              ? 'border-[#cfe8dc] text-[#2d4a3d] hover:bg-[#f5fdfb]'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          )}
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Mit Google registrieren
        </button>

        {/* Footer */}
        <p className={cn('mt-6 text-center text-sm', authMutedTextClass(isWohnenSurface))}>
          {t.register.alreadyHaveAccount}{' '}
          <Link href="/login" className={authLinkAccentClass(isWohnenSurface)}>
            {t.register.login}
          </Link>
        </p>
      </div>
    </div>
  )
}
