'use client'

import { Check, ChevronRight } from 'lucide-react'

export interface WizardStepInfo {
  id: string
  title: string
  shortTitle?: string
}

interface StepProgressProps {
  steps: WizardStepInfo[]
  currentStep: number
  completedSteps: number[]
  onStepClick?: (stepIndex: number) => void
}

export function StepProgress({ steps, currentStep, completedSteps, onStepClick }: StepProgressProps) {
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
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index)
            const isCurrent = index === currentStep
            const isClickable = isCompleted || index <= currentStep

            return (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={`
                    relative flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300
                    ${isCompleted
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : isCurrent
                        ? 'border-primary-500 bg-white text-primary-600 ring-4 ring-primary-100'
                        : 'border-gray-300 bg-white text-gray-400'
                    }
                    ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div className="ml-3 hidden flex-1 lg:block">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="mx-2 h-0.5 flex-1 bg-gray-200 lg:mx-4">
                    <div
                      className={`h-full bg-primary-500 transition-all duration-500 ${
                        isCompleted ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface WizardFooterProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onPublish: () => void
  onSaveDraft?: () => void
  isLastStep: boolean
  canProceed: boolean
  isSubmitting?: boolean
}

export function WizardFooter({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onPublish,
  onSaveDraft,
  isLastStep,
  canProceed,
  isSubmitting,
}: WizardFooterProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t bg-white px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:-mx-8 sm:px-8">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={onPrevious}
              className="whitespace-nowrap rounded-lg border-2 border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:px-4 sm:py-2.5 sm:text-base"
            >
              ← Zurück
            </button>
          ) : null}
          {onSaveDraft ? (
            <button
              type="button"
              onClick={onSaveDraft}
              className="whitespace-nowrap rounded-lg border-2 border-primary-300 px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 sm:px-4 sm:py-2.5 sm:text-base"
            >
              Entwurf speichern
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:block">
            {currentStep + 1} / {totalSteps}
          </span>
          <button
            type="button"
            onClick={isLastStep ? onPublish : onNext}
            disabled={!canProceed || isSubmitting}
            className={`
              rounded-full px-6 py-2.5 font-bold text-white transition-all duration-300
              ${canProceed && !isSubmitting
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg hover:-translate-y-0.5 hover:shadow-xl'
                : 'cursor-not-allowed bg-gray-300'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Wird erstellt...
              </span>
            ) : isLastStep ? (
              'Artikel veröffentlichen'
            ) : (
              <>Weiter →</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

