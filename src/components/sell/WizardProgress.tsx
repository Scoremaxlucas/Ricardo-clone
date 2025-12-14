'use client'

import { Check } from 'lucide-react'

export interface WizardStep {
  id: string
  title: string
  isComplete: boolean
  isActive: boolean
}

interface WizardProgressProps {
  steps: WizardStep[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
}

export function WizardProgress({ steps, currentStep, onStepClick }: WizardProgressProps) {
  return (
    <div className="mb-8">
      {/* Mobile: Compact progress */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-sm font-medium text-gray-700">
          Schritt {currentStep + 1} von {steps.length}
        </span>
        <span className="text-sm font-semibold text-primary-600">
          {steps[currentStep]?.title}
        </span>
      </div>
      
      {/* Mobile: Progress bar */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 sm:hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              {/* Step circle */}
              <button
                onClick={() => onStepClick?.(index)}
                disabled={!step.isComplete && index > currentStep}
                className={`
                  relative flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300
                  ${step.isComplete
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : step.isActive
                      ? 'border-primary-500 bg-white text-primary-600'
                      : 'border-gray-300 bg-white text-gray-400'
                  }
                  ${(step.isComplete || index <= currentStep) && onStepClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                `}
              >
                {step.isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              {/* Step label */}
              <div className="ml-3 hidden flex-1 lg:block">
                <p className={`text-sm font-medium ${step.isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                  {step.title}
                </p>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="mx-2 h-0.5 w-8 bg-gray-200 lg:mx-4 lg:flex-1">
                  <div
                    className={`h-full bg-primary-500 transition-all duration-500 ${
                      step.isComplete ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSaveDraft,
  isLastStep,
  canProceed,
  isSubmitting,
}: {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSaveDraft?: () => void
  isLastStep: boolean
  canProceed: boolean
  isSubmitting?: boolean
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex items-center justify-between border-t bg-white px-6 py-4 shadow-lg">
      <div className="flex items-center gap-3">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={onPrevious}
            className="rounded-lg border-2 border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            Zurück
          </button>
        )}
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="hidden rounded-lg border-2 border-primary-300 px-4 py-2 font-medium text-primary-600 transition-colors hover:bg-primary-50 sm:block"
          >
            Entwurf speichern
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-gray-500 sm:block">
          {currentStep + 1} / {totalSteps}
        </span>
        <button
          type={isLastStep ? 'submit' : 'button'}
          onClick={isLastStep ? undefined : onNext}
          disabled={!canProceed || isSubmitting}
          className={`
            rounded-[50px] px-6 py-2 font-bold text-white transition-all duration-300
            ${canProceed && !isSubmitting
              ? 'hover:-translate-y-0.5 hover:shadow-lg'
              : 'cursor-not-allowed bg-gray-300'
            }
          `}
          style={canProceed && !isSubmitting ? {
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            boxShadow: '0px 4px 20px rgba(249, 115, 22, 0.3)',
          } : undefined}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Wird erstellt...
            </span>
          ) : isLastStep ? (
            'Artikel einstellen'
          ) : (
            'Weiter'
          )}
        </button>
      </div>
    </div>
  )
}
