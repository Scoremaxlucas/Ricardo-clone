'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Validierung
    if (!email || !password) {
      setError('Bitte füllen Sie alle Felder aus.')
      return
    }

    const emailValue = email.trim()
    const passwordValue = password

    console.log('=== LOGIN START ===')
    console.log('Email:', emailValue)
    console.log('Password length:', passwordValue.length)

    setIsLoading(true)
    setError('')

    try {
      console.log('Calling signIn...')
      const result = await signIn('credentials', {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      })

      console.log('=== SIGNIN RESULT ===')
      console.log('Result:', JSON.stringify(result, null, 2))
      console.log('Result.ok:', result?.ok)
      console.log('Result.error:', result?.error)
      console.log('Result.url:', result?.url)
      console.log('Result.status:', result?.status)

      if (result?.error) {
        console.error('❌ Login error:', result.error)
        setError(`Fehler: ${result.error}. Bitte überprüfen Sie E-Mail und Passwort.`)
        setIsLoading(false)
        return
      } 
      
      if (result?.ok === true) {
        console.log('✅ Login successful!')
        // Felder erst jetzt leeren (nach erfolgreichem Login)
        setEmail('')
        setPassword('')
        // Kurz warten, damit Session aktualisiert wird
        console.log('Redirecting to home...')
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      } else {
        console.error('❌ Unexpected login result')
        console.error('Full result:', result)
        setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('❌ Login exception:', error)
      console.error('Error stack:', error.stack)
      setError(`Fehler: ${error.message || 'Unbekannter Fehler'}`)
      setIsLoading(false)
    } finally {
      console.log('=== LOGIN END ===')
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow-xl rounded-lg px-8 py-10 space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">W</span>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Bei Ihrem Konto anmelden
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Oder{' '}
                <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                  erstellen Sie ein neues Konto
                </Link>
              </p>
            </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="ihre@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Passwort
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ihr Passwort"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Angemeldet bleiben
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Passwort vergessen?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">⏳</span>
                  Wird angemeldet...
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </div>


        </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
