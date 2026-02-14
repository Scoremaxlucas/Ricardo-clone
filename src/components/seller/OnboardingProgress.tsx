'use client'

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  Circle,
  CreditCard,
  Loader2,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'

export interface OnboardingStatus {
  emailVerified: boolean
  identitySubmitted: boolean // verified === true (submitted docs)
  identityApproved: boolean // verificationStatus === 'approved'
  identityRejected: boolean // verificationStatus === 'rejected'
  payoutSetup: boolean // stripeOnboardingComplete or payoutsEnabled
  profileComplete: boolean // has name, address, etc.
}

interface Step {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending' | 'error'
  href?: string
  actionLabel?: string
}

export function OnboardingProgress({ status }: { status: OnboardingStatus }) {
  // Determine steps
  const steps: Step[] = [
    {
      id: 'email',
      label: 'E-Mail verifiziert',
      description: 'Bestätigen Sie Ihre E-Mail-Adresse.',
      icon: <Mail className="h-5 w-5" />,
      status: status.emailVerified ? 'completed' : 'current',
    },
    {
      id: 'identity',
      label: 'Identität verifizieren',
      description: status.identityRejected
        ? 'Ihre Verifizierung wurde abgelehnt. Bitte erneut einreichen.'
        : status.identityApproved
          ? 'Ihre Identität wurde bestätigt.'
          : status.identitySubmitted
            ? 'Verifizierung wird geprüft. Bitte warten.'
            : 'Persönliche Daten und Ausweis hochladen.',
      icon: <ShieldCheck className="h-5 w-5" />,
      status: status.identityApproved
        ? 'completed'
        : status.identityRejected
          ? 'error'
          : status.identitySubmitted
            ? 'current'
            : !status.emailVerified
              ? 'pending'
              : 'current',
      href: !status.identityApproved ? '/verification' : undefined,
      actionLabel: status.identityRejected
        ? 'Erneut einreichen'
        : status.identitySubmitted
          ? undefined
          : 'Jetzt verifizieren',
    },
    {
      id: 'payout',
      label: 'Auszahlung einrichten',
      description: status.payoutSetup
        ? 'Auszahlung ist bereit.'
        : 'Stripe Connect für sichere Auszahlungen.',
      icon: <CreditCard className="h-5 w-5" />,
      status: status.payoutSetup
        ? 'completed'
        : status.identityApproved
          ? 'current'
          : 'pending',
      href: !status.payoutSetup && status.identityApproved ? '/my-watches/account' : undefined,
      actionLabel: !status.payoutSetup && status.identityApproved ? 'Einrichten' : undefined,
    },
    {
      id: 'ready',
      label: 'Bereit zum Verkaufen',
      description: 'Erstellen Sie Ihr erstes Angebot.',
      icon: <BadgeCheck className="h-5 w-5" />,
      status: status.identityApproved ? 'completed' : 'pending',
      href: status.identityApproved ? '/sell' : undefined,
      actionLabel: status.identityApproved ? 'Artikel anbieten' : undefined,
    },
  ]

  const completedCount = steps.filter(s => s.status === 'completed').length
  const totalSteps = steps.length
  const allComplete = completedCount === totalSteps
  const progress = (completedCount / totalSteps) * 100

  // Don't show if everything is complete
  if (allComplete) return null

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <UserCheck className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Verkäufer-Einrichtung</h3>
              <p className="text-sm text-gray-500">
                {completedCount} von {totalSteps} Schritten abgeschlossen
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-primary-600">
            {Math.round(progress)}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-4 px-5 py-4 transition-colors ${
              step.status === 'current' || step.status === 'error'
                ? 'bg-white'
                : step.status === 'completed'
                  ? 'bg-gray-50/50'
                  : 'bg-gray-50/30'
            }`}
          >
            {/* Step indicator */}
            <div className="flex-shrink-0">
              {step.status === 'completed' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ) : step.status === 'error' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <span className="text-red-600">{step.icon}</span>
                </div>
              ) : step.status === 'current' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-300 bg-primary-50">
                  {status.identitySubmitted && step.id === 'identity' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                  ) : (
                    <span className="text-primary-600">{step.icon}</span>
                  )}
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Circle className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium ${
                  step.status === 'completed'
                    ? 'text-green-700'
                    : step.status === 'error'
                      ? 'text-red-700'
                      : step.status === 'current'
                        ? 'text-gray-900'
                        : 'text-gray-400'
                }`}
              >
                {step.label}
                {step.status === 'completed' && (
                  <span className="ml-2 text-xs text-green-500">✓</span>
                )}
              </p>
              <p
                className={`text-xs ${
                  step.status === 'error'
                    ? 'text-red-500'
                    : step.status === 'pending'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                {step.description}
              </p>
            </div>

            {/* Action */}
            {step.actionLabel && step.href && (
              <Link
                href={step.href}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  step.status === 'error'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {step.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {/* Pending badge for submitted identity */}
            {step.id === 'identity' && status.identitySubmitted && !status.identityApproved && !status.identityRejected && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                In Prüfung
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
