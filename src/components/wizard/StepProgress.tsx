'use client'

import { AlertCircle, Check, CheckCircle, Lock } from 'lucide-react'
import { useState } from 'react'

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
  lockedSteps?: number[] // Step indices that are locked/readonly
}

export function StepProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  lockedSteps = [],
}: StepProgressProps) {
  return (
    <div className="mb-8">
      {/* Mobile: Compact progress */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-sm font-medium text-gray-700">
          Schritt {currentStep + 1} von {steps.length}
        </span>
        <span className="text-sm font-semibold text-primary-600">{steps[currentStep]?.title}</span>
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
            // Step is completed only if:
            // 1. It's in completedSteps array AND
            // 2. We've moved past this step (index < currentStep)
            const isCompleted = completedSteps.includes(index) && index < currentStep
            const isCurrent = index === currentStep
            const isLocked = lockedSteps.includes(index)
            const isClickable =
              !isLocked && (index < currentStep || (isCompleted && index <= currentStep))

            return (
              <div key={step.id} className="flex flex-1 items-center">
                {/* Step circle */}
                <button
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  title={isLocked ? 'Dieser Schritt ist gesperrt' : undefined}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all duration-300 ${
                    isLocked
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                      : isCompleted
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : isCurrent
                          ? 'border-primary-500 bg-white text-primary-600 ring-4 ring-primary-100'
                          : 'border-gray-300 bg-white text-gray-400'
                  } ${isClickable && !isLocked ? 'cursor-pointer hover:scale-110' : 'cursor-default'} `}
                >
                  {isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div className="ml-3 hidden flex-1 lg:block">
                  <p
                    className={`whitespace-nowrap text-sm font-medium ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    {step.shortTitle || step.title}
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
  disabledReason?: string
  isSavingDraft?: boolean
  lastSavedAt?: Date | null
  mode?: 'create' | 'edit'
  policyLevel?: 'FULL' | 'PUBLISHED_LIMITED' | 'LIMITED_APPEND_ONLY' | 'READ_ONLY'
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
  disabledReason,
  isSavingDraft,
  lastSavedAt,
  mode = 'create',
  policyLevel,
}: WizardFooterProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return ''
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (seconds < 10) return 'Gerade gespeichert'
    if (seconds < 60) return `Vor ${seconds}s gespeichert`
    if (minutes < 60) return `Vor ${minutes}min gespeichert`
    return `Vor ${Math.floor(minutes / 60)}h gespeichert`
  }

  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-8 border-t bg-white px-2 py-3 pb-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:-mx-8 sm:px-8 sm:py-4 sm:pb-4"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={onPrevious}
              className="whitespace-nowrap rounded-lg border-2 border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:px-3 sm:py-2 sm:text-sm md:px-4 md:py-2.5 md:text-base"
            >
              ← Zurück
            </button>
          )}
          {onSaveDraft && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Manual save button */}
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={isSavingDraft}
                className="whitespace-nowrap rounded-lg border-2 border-primary-300 px-2 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm md:px-4 md:py-2.5 md:text-base"
              >
                <span className="hidden sm:inline">Entwurf speichern</span>
                <span className="sm:hidden">Speichern</span>
              </button>

              {/* Autosave status */}
              {isSavingDraft ? (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                  <span className="hidden sm:inline">Wird gespeichert…</span>
                </span>
              ) : lastSavedAt ? (
                <span className="hidden items-center gap-1.5 text-xs text-gray-500 sm:flex">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{formatLastSaved(lastSavedAt)}</span>
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs text-gray-500 sm:block md:text-sm">
            {currentStep + 1} / {totalSteps}
          </span>

          {/* Weiter/Publish button with tooltip */}
          <div className="relative">
            <button
              type="button"
              onClick={isLastStep ? onPublish : onNext}
              disabled={!canProceed || isSubmitting}
              onMouseEnter={() => !canProceed && disabledReason && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold text-white transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm md:px-6 md:py-2.5 md:text-base ${
                canProceed && !isSubmitting
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg hover:-translate-y-0.5 hover:shadow-xl'
                  : 'cursor-not-allowed bg-gray-300'
              } `}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1 sm:gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{mode === 'edit' ? 'Wird gespeichert...' : 'Wird erstellt...'}</span>
                  <span className="sm:hidden">...</span>
                </span>
              ) : isLastStep ? (
                mode === 'edit' ? (
                  policyLevel === 'LIMITED_APPEND_ONLY' ? (
                    <>
                      <span className="hidden sm:inline">Ergänzung speichern</span>
                      <span className="sm:hidden">Speichern</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Änderungen speichern</span>
                      <span className="sm:hidden">Speichern</span>
                    </>
                  )
                ) : (
                  <>
                    <span className="hidden sm:inline">Artikel veröffentlichen</span>
                    <span className="sm:hidden">Veröffentlichen</span>
                  </>
                )
              ) : (
                <>Weiter →</>
              )}
            </button>

            {/* Disabled reason tooltip */}
            {showTooltip && !canProceed && disabledReason && (
              <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-400" />
                  <span>{disabledReason}</span>
                </div>
                <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-gray-900" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile disabled reason */}
      {!canProceed && disabledReason && (
        <div className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-red-600 sm:hidden">
          <AlertCircle className="h-4 w-4" />
          <span>{disabledReason}</span>
        </div>
      )}
    </div>
  )
}
