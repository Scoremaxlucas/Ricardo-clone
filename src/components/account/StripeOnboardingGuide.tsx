'use client'

import { AlertCircle, CheckCircle, CreditCard, FileText, Shield, Smartphone } from 'lucide-react'

interface StripeOnboardingGuideProps {
  onContinue: () => void
  isLoading?: boolean
}

/**
 * Onboarding-Guide für Stripe Connect
 * Zeigt dem Verkäufer, was für die Einrichtung benötigt wird
 * Helvenda-Wording (keine Stripe-Erwähnung)
 */
export function StripeOnboardingGuide({ onContinue, isLoading }: StripeOnboardingGuideProps) {
  return (
    <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-6">
      <div className="mb-4 flex items-start gap-3">
        <Shield className="mt-0.5 h-6 w-6 flex-shrink-0 text-primary-600" />
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-primary-900">
            Auszahlung einrichten
          </h3>
          <p className="mb-4 text-sm text-primary-700">
            Um Verkaufserlöse über den Helvenda Zahlungsschutz zu erhalten, benötigen wir einige
            Angaben von Ihnen. Der Prozess dauert ca. <strong>5 Minuten</strong>.
          </p>

          {/* Checkliste was benötigt wird */}
          <div className="mb-4 space-y-3">
            <h4 className="text-sm font-semibold text-primary-800">
              Was Sie bereithalten sollten:
            </h4>

            <div className="flex items-start gap-3 rounded-md bg-white p-3">
              <CreditCard className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-primary-900">Schweizer Bankverbindung</p>
                <p className="text-xs text-primary-600">IBAN Ihrer Schweizer Bank (z.B. CH...)</p>
              </div>
              <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
            </div>

            <div className="flex items-start gap-3 rounded-md bg-white p-3">
              <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-primary-900">Ausweisdokument</p>
                <p className="text-xs text-primary-600">
                  ID-Karte oder Reisepass für die Identitätsprüfung
                </p>
              </div>
              <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
            </div>

            <div className="flex items-start gap-3 rounded-md bg-white p-3">
              <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-primary-900">Kontaktdaten</p>
                <p className="text-xs text-primary-600">
                  E-Mail-Adresse und Telefonnummer für Benachrichtigungen
                </p>
              </div>
              <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
            </div>
          </div>

          {/* Hinweis-Box */}
          <div className="mb-4 rounded-md border border-primary-300 bg-white p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
              <div className="text-xs text-primary-700">
                <p className="mb-1">
                  <strong>Wichtig:</strong> Die Daten werden verschlüsselt übertragen und
                  ausschliesslich für die Auszahlung Ihrer Verkaufserlöse verwendet.
                </p>
                <p>
                  Bereits vorhandene Daten aus Ihrem Helvenda-Profil werden automatisch
                  übernommen, um den Prozess zu beschleunigen.
                </p>
              </div>
            </div>
          </div>

          {/* Was passiert nach der Einrichtung */}
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
            <h4 className="mb-2 text-sm font-semibold text-green-800">
              Nach der Einrichtung:
            </h4>
            <ul className="space-y-1 text-xs text-green-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                Verkaufserlöse werden automatisch auf Ihr Konto überwiesen
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                Auszahlung erfolgt nach Erhalt-Bestätigung durch den Käufer
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                Sie erhalten eine Benachrichtigung für jede Auszahlung
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={onContinue}
            disabled={isLoading}
            className="w-full rounded-md bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Wird gestartet...
              </span>
            ) : (
              'Jetzt einrichten (ca. 5 Min.)'
            )}
          </button>

          <p className="mt-3 text-center text-xs text-primary-600">
            Sie können die Einrichtung jederzeit unterbrechen und später fortsetzen.
          </p>
        </div>
      </div>
    </div>
  )
}
