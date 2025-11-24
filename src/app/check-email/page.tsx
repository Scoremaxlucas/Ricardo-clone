'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gray-800 to-transparent rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-gray-800 to-transparent rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center">
          {/* Logo/Icon */}
          <div className="mx-auto mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
          </div>

          {/* Email Icon */}
          <div className="mx-auto mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-6">
                <Mail className="w-12 h-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Check your email
          </h1>

          {/* Description */}
          <p className="text-gray-300 text-lg mb-8">
            We just sent a verification link to{' '}
            <span className="text-white font-medium">{email || 'your email address'}</span>.
          </p>

          {/* Instructions */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8 text-left">
            <p className="text-gray-300 text-sm mb-2">
              <strong className="text-white">Next steps:</strong>
            </p>
            <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the "Confirm Account" button in the email</li>
              <li>Return here to log in</li>
            </ol>
          </div>

          {/* CTA Button */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
          >
            Go to login →
          </Link>

          {/* Support */}
          <p className="mt-8 text-sm text-gray-500">
            If you have any issue confirming your account, please{' '}
            <a 
              href="mailto:support@helvenda.ch" 
              className="text-white hover:underline"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}





