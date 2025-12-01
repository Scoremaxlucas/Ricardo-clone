'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 sm:px-6 lg:px-8">
      {/* Abstract background patterns */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gradient-to-br from-gray-800 to-transparent opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gradient-to-tr from-gray-800 to-transparent opacity-20 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center">
          {/* Logo/Icon */}
          <div className="mx-auto mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
          </div>

          {/* Email Icon */}
          <div className="mx-auto mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl"></div>
              <div className="relative rounded-full border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <Mail className="h-12 w-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-3xl font-bold text-white">Check your email</h1>

          {/* Description */}
          <p className="mb-8 text-lg text-gray-300">
            We just sent a verification link to{' '}
            <span className="font-medium text-white">{email || 'your email address'}</span>.
          </p>

          {/* Instructions */}
          <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm">
            <p className="mb-2 text-sm text-gray-300">
              <strong className="text-white">Next steps:</strong>
            </p>
            <ol className="list-inside list-decimal space-y-2 text-sm text-gray-400">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the "Confirm Account" button in the email</li>
              <li>Return here to log in</li>
            </ol>
          </div>

          {/* CTA Button */}
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-black transition-colors duration-200 hover:bg-gray-100"
          >
            Go to login →
          </Link>

          {/* Support */}
          <p className="mt-8 text-sm text-gray-500">
            If you have any issue confirming your account, please{' '}
            <a href="mailto:support@helvenda.ch" className="text-white hover:underline">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
