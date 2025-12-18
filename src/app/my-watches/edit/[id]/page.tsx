'use client'

/**
 * NEW Edit Page using Wizard Components with EditPolicy
 *
 * This replaces the old edit page with a wizard-based approach that:
 * - Uses the same wizard components as the sell flow
 * - Enforces EditPolicy restrictions in UI
 * - Handles append-only mode for auctions with bids
 * - Shows policy banners and locked field indicators
 */

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  PolicyBanner,
  StepCategorySelection,
  StepDetails,
  StepImages,
  StepPrice,
  StepProgress,
  StepReviewPublish,
  StepShippingPayment,
  WizardFooter,
} from '@/components/wizard'
import { EditPolicy } from '@/lib/edit-policy'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

const WIZARD_STEPS = [
  { id: 'category', title: 'Kategorie', shortTitle: 'Kategorie' },
  { id: 'images', title: 'Bilder', shortTitle: 'Bilder' },
  { id: 'details', title: 'Details', shortTitle: 'Details' },
  { id: 'price', title: 'Preis', shortTitle: 'Preis' },
  { id: 'shipping', title: 'Versand & Zahlung', shortTitle: 'Versand' },
  { id: 'review', title: 'Überprüfung', shortTitle: 'Fertig' },
]

export default function EditWatchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const watchId = params.id as string
  const wizardContainerRef = useRef<HTMLDivElement>(null)

  const [loadingData, setLoadingData] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Policy and listing state
  const [policy, setPolicy] = useState<EditPolicy | null>(null)
  const [listingState, setListingState] = useState<any>(null)

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set())

  // Form state (same structure as sell wizard)
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0)
  const [selectedBooster, setSelectedBooster] = useState<string>('none')
  const [currentBooster, setCurrentBooster] = useState<string>('none')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [paymentProtectionEnabled, setPaymentProtectionEnabled] = useState(false)
  const [boosters, setBoosters] = useState<any[]>([])

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    referenceNumber: '',
    year: '',
    condition: '',
    material: '',
    movement: '',
    caseDiameter: '',
    price: '',
    buyNowPrice: '',
    isAuction: false,
    auctionStart: '',
    auctionEnd: '',
    auctionDuration: '',
    autoRenew: false,
    lastRevision: '',
    accuracy: '',
    fullset: false,
    onlyBox: false,
    onlyPapers: false,
    onlyAllLinks: false,
    hasWarranty: false,
    warrantyMonths: '',
    warrantyYears: '',
    hasSellerWarranty: false,
    sellerWarrantyMonths: '',
    sellerWarrantyYears: '',
    sellerWarrantyNote: '',
    title: '',
    description: '',
    descriptionAddendum: '', // For append-only mode
    images: [] as string[],
    newImages: [] as string[], // For append-only mode
    shippingMethods: [] as string[],
  })

  // Load watch data and policy
  useEffect(() => {
    const loadWatchAndPolicy = async () => {
      if (!watchId || !session?.user) return

      try {
        setLoadingData(true)
        setError('')

        // Load watch data
        const watchRes = await fetch(`/api/watches/${watchId}`)
        if (!watchRes.ok) {
          throw new Error('Artikel nicht gefunden')
        }
        const watchData = await watchRes.json()
        const watch = watchData.watch

        // Load edit policy
        const policyRes = await fetch(`/api/watches/${watchId}/edit-status`)
        if (!policyRes.ok) {
          throw new Error('Fehler beim Laden der Bearbeitungsrechte')
        }
        const policyData = await policyRes.json()
        setPolicy(policyData.policy)
        setListingState(policyData.listingState)

        // READ_ONLY: Redirect or show message
        if (policyData.policy.level === 'READ_ONLY') {
          toast.error(policyData.policy.reason, { duration: 5000 })
          router.push('/my-watches')
          return
        }

        // Parse images
        const images = Array.isArray(watch.images)
          ? watch.images
          : watch.images
            ? JSON.parse(watch.images)
            : []

        // Parse shipping methods
        const shippingMethods = watch.shippingMethod ? JSON.parse(watch.shippingMethod) : []

        // Parse category
        if (watch.categories && Array.isArray(watch.categories) && watch.categories.length > 0) {
          const primaryCategory = watch.categories[0]
          setSelectedCategory(primaryCategory.slug || '')
        }

        // Parse booster
        let currentBoosterCode = 'none'
        if (watch.boosters) {
          try {
            const boosterArray =
              typeof watch.boosters === 'string' ? JSON.parse(watch.boosters) : watch.boosters
            if (Array.isArray(boosterArray) && boosterArray.length > 0) {
              currentBoosterCode = boosterArray[0]
            }
          } catch (e) {
            console.error('Error parsing boosters:', e)
          }
        }
        setCurrentBooster(currentBoosterCode)
        setSelectedBooster(currentBoosterCode)

        // Calculate auction duration
        let auctionDuration = ''
        if (watch.auctionStart && watch.auctionEnd) {
          const start = new Date(watch.auctionStart)
          const end = new Date(watch.auctionEnd)
          const diffMs = end.getTime() - start.getTime()
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          if (diffDays > 0) {
            auctionDuration = diffDays.toString()
          }
        }

        // Set form data
        setFormData({
          brand: watch.brand || '',
          model: watch.model || '',
          referenceNumber: watch.referenceNumber || '',
          year: watch.year ? watch.year.toString() : '',
          condition: watch.condition || '',
          material: watch.material || '',
          movement: watch.movement || '',
          caseDiameter: watch.caseDiameter ? watch.caseDiameter.toString() : '',
          price: watch.price ? watch.price.toString() : '',
          buyNowPrice: watch.buyNowPrice ? watch.buyNowPrice.toString() : '',
          isAuction: watch.isAuction || false,
          auctionStart: watch.auctionStart
            ? new Date(watch.auctionStart).toISOString().slice(0, 16)
            : '',
          auctionEnd: watch.auctionEnd ? new Date(watch.auctionEnd).toISOString().slice(0, 16) : '',
          auctionDuration: auctionDuration,
          autoRenew: watch.autoRenew || false,
          lastRevision: watch.lastRevision
            ? new Date(watch.lastRevision).toISOString().slice(0, 10)
            : '',
          accuracy: watch.accuracy || '',
          fullset: watch.fullset || false,
          onlyBox: watch.box || false,
          onlyPapers: watch.papers || false,
          onlyAllLinks: (watch.box && watch.papers) || false,
          hasWarranty: !!watch.warranty,
          warrantyMonths: watch.warrantyMonths ? watch.warrantyMonths.toString() : '',
          warrantyYears: watch.warrantyYears ? watch.warrantyYears.toString() : '',
          hasSellerWarranty: !!watch.warrantyNote,
          sellerWarrantyMonths: watch.warrantyDescription?.match(/(\d+)\s*Monat/i)?.[1] || '',
          sellerWarrantyYears: watch.warrantyDescription?.match(/(\d+)\s*Jahr/i)?.[1] || '',
          sellerWarrantyNote: watch.warrantyNote || '',
          title: watch.title || '',
          description: watch.description || '',
          descriptionAddendum: '',
          images: images,
          newImages: [],
          shippingMethods: shippingMethods,
        })

        setTitleImageIndex(0)
        setPaymentProtectionEnabled(watch.paymentProtectionEnabled || false)
      } catch (err: any) {
        console.error('Error loading watch:', err)
        setError('Fehler beim Laden: ' + (err.message || 'Unbekannter Fehler'))
        toast.error('Fehler beim Laden des Artikels')
      } finally {
        setLoadingData(false)
      }
    }

    loadWatchAndPolicy()
  }, [watchId, session?.user, router])

  // Load boosters
  useEffect(() => {
    const loadBoosters = async () => {
      try {
        const res = await fetch('/api/boosters')
        if (res.ok) {
          const data = await res.json()
          setBoosters(data.boosters || [])
        }
      } catch (error) {
        console.error('Error loading boosters:', error)
      }
    }
    loadBoosters()
  }, [])

  // Navigation
  const goToStep = useCallback(
    (step: number, skipValidation: boolean = false) => {
      if (!policy) return

      const clampedStep = Math.max(0, Math.min(WIZARD_STEPS.length - 1, step))

      // Skip locked steps
      if (policy.lockedSteps.includes(clampedStep) && clampedStep > currentStep) {
        toast.error('Dieser Schritt ist gesperrt')
        return
      }

      // Always allow backward navigation
      if (clampedStep < currentStep) {
        setCurrentStep(clampedStep)
        if (wizardContainerRef.current) {
          wizardContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        return
      }

      setCurrentStep(clampedStep)
      if (wizardContainerRef.current) {
        wizardContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [currentStep, policy]
  )

  const nextStep = () => {
    setTouchedSteps(prev => new Set(prev).add(currentStep))
    goToStep(currentStep + 1)
  }

  const prevStep = () => {
    goToStep(currentStep - 1, true)
  }

  // Validation (simplified - can be enhanced)
  const validateStep = (step: number): boolean => {
    if (!policy) return false

    // Skip validation for locked steps
    if (policy.lockedSteps.includes(step)) return true

    switch (step) {
      case 0: // Category
        return !!selectedCategory
      case 1: // Images
        return formData.images.length > 0
      case 2: // Details
        if (policy.level === 'LIMITED_APPEND_ONLY') {
          return !!formData.descriptionAddendum?.trim()
        }
        return !!formData.title && !!formData.description && !!formData.condition
      case 3: // Price
        return !!formData.price && parseFloat(formData.price) > 0
      case 4: // Shipping
        return formData.shippingMethods.length > 0
      case 5: // Review
        return true
      default:
        return true
    }
  }

  const getDisabledReason = (step: number): string | undefined => {
    if (!validateStep(step)) {
      switch (step) {
        case 0:
          return 'Bitte wählen Sie eine Kategorie'
        case 1:
          return 'Bitte laden Sie mindestens ein Bild hoch'
        case 2:
          return policy?.level === 'LIMITED_APPEND_ONLY'
            ? 'Bitte geben Sie eine Ergänzung ein'
            : 'Bitte füllen Sie alle erforderlichen Felder aus'
        case 3:
          return 'Bitte geben Sie einen gültigen Preis ein'
        case 4:
          return 'Bitte wählen Sie mindestens eine Versandmethode'
        default:
          return undefined
      }
    }
    return undefined
  }

  const getCompletedSteps = (): number[] => {
    const completed: number[] = []
    for (let i = 0; i < currentStep; i++) {
      if (validateStep(i)) completed.push(i)
    }
    return completed
  }

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target

    // Check policy locks
    if (policy) {
      const fieldName = name === 'descriptionAddendum' ? 'descriptionAddendum' : name
      if (!policy.allowedFields.includes('*') && !policy.allowedFields.includes(fieldName)) {
        toast.error('Dieses Feld kann nicht mehr geändert werden')
        return
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Handle submission
  const handleSubmit = async () => {
    if (!policy || policy.level === 'READ_ONLY') {
      toast.error('Dieses Angebot kann nicht mehr bearbeitet werden')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Prepare payload based on policy level
      let payload: any = {}

      if (policy.level === 'LIMITED_APPEND_ONLY') {
        // Append-only mode: only send addendum and new images
        payload = {
          descriptionAddendum: formData.descriptionAddendum,
          newImages: formData.newImages || [],
          booster: selectedBooster !== 'none' ? selectedBooster : undefined,
        }
      } else {
        // Normal edit mode
        payload = {
          ...formData,
          booster: selectedBooster !== 'none' ? selectedBooster : undefined,
          category: selectedCategory,
          subcategory: selectedSubcategory,
        }
      }

      const response = await fetch(`/api/watches/${watchId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success('Angebot erfolgreich aktualisiert!', {
          position: 'top-right',
          duration: 3000,
        })
        router.push('/my-watches')
        router.refresh()
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.message || errorData.error || 'Ein Fehler ist aufgetreten'
        setError(errorMessage)
        toast.error(errorMessage, {
          position: 'top-right',
          duration: 5000,
        })
      }
    } catch (err: any) {
      console.error('Error updating watch:', err)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      toast.error('Fehler beim Aktualisieren', {
        position: 'top-right',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (status === 'loading' || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">Lädt...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!session) {
    router.push(`/login?callbackUrl=${encodeURIComponent(`/my-watches/edit/${watchId}`)}`)
    return null
  }

  if (error && !policy) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!policy) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div
        ref={wizardContainerRef}
        className="mx-auto min-h-[calc(100vh-200px)] max-w-4xl px-4 py-4 md:py-8"
      >
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/my-watches"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Zurück zu Mein Verkaufen
          </Link>
        </div>

        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Angebot bearbeiten</h1>
          <p className="mt-2 text-gray-600">
            Bearbeiten Sie Ihr Angebot. Einige Angaben können nach Veröffentlichung nicht mehr
            geändert werden.
          </p>
        </div>

        {/* Progress indicator */}
        <StepProgress
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          completedSteps={getCompletedSteps()}
          lockedSteps={policy.lockedSteps}
          onStepClick={step => goToStep(step, false)}
        />

        {/* Form */}
        <form
          onSubmit={e => e.preventDefault()}
          className="rounded-2xl bg-white p-4 pb-28 shadow-lg sm:p-6 sm:pb-28 md:p-8"
        >
          {/* Policy Banner */}
          {policy.level !== 'FULL' && <PolicyBanner policy={policy} />}

          {/* Step 0: Category */}
          {currentStep === 0 && (
            <StepCategorySelection
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              detectedProductName=""
              detectedConfidence={0}
              showAIDetection={false}
              formData={formData}
              titleImageIndex={titleImageIndex}
              onCategoryDetected={async () => {}}
              onCategoryChange={(cat, sub) => {
                if (!policy?.uiLocks.category) {
                  setSelectedCategory(cat)
                  setSelectedSubcategory(sub)
                }
              }}
              onResetCategory={() => {
                if (!policy?.uiLocks.category) {
                  setSelectedCategory('')
                  setSelectedSubcategory('')
                }
              }}
              setShowAIDetection={() => {}}
              setFormData={setFormData}
              setTitleImageIndex={setTitleImageIndex}
              policy={policy}
              mode="edit"
            />
          )}

          {/* Step 1: Images */}
          {currentStep === 1 && (
            <StepImages
              formData={{
                ...formData,
                // In append-only mode, combine existing + new images for display
                images:
                  policy?.level === 'LIMITED_APPEND_ONLY'
                    ? [...formData.images, ...(formData.newImages || [])]
                    : formData.images,
              }}
              titleImageIndex={titleImageIndex}
              draftId={null} // Not using drafts in edit mode
              onImagesChange={images => {
                if (policy?.level === 'LIMITED_APPEND_ONLY') {
                  // In append-only mode, track new images separately
                  // Filter out existing images, only keep new ones
                  const existingImages = formData.images || []
                  const newOnes = images.filter(img => !existingImages.includes(img))
                  setFormData(prev => ({ ...prev, newImages: newOnes }))
                } else {
                  setFormData(prev => ({ ...prev, images }))
                }
              }}
              onTitleImageChange={async index => {
                if (!policy?.uiLocks.imagesAppendOnly) {
                  setTitleImageIndex(index)
                }
              }}
              policy={policy}
              mode="edit"
            />
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <StepDetails
              formData={formData}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              isGeneratingTitle={false}
              isGeneratingDescription={false}
              onInputChange={handleInputChange}
              onFormDataChange={data => setFormData(prev => ({ ...prev, ...data }))}
              onGenerateTitle={async () => {}}
              onGenerateDescription={async () => {}}
              setExclusiveSupply={option => {
                setFormData(prev => ({
                  ...prev,
                  fullset: option === 'fullset',
                  onlyBox: option === 'onlyBox',
                  onlyPapers: option === 'onlyPapers',
                  onlyAllLinks: option === 'onlyAllLinks',
                }))
              }}
              policy={policy}
              mode="edit"
            />
          )}

          {/* Step 3: Price */}
          {currentStep === 3 && (
            <StepPrice
              formData={formData}
              onInputChange={handleInputChange}
              onFormDataChange={data => setFormData(prev => ({ ...prev, ...data }))}
              policy={policy}
              mode="edit"
            />
          )}

          {/* Step 4: Shipping & Payment */}
          {currentStep === 4 && (
            <StepShippingPayment
              formData={formData}
              paymentProtectionEnabled={paymentProtectionEnabled}
              onShippingMethodChange={(method, checked) => {
                setTouchedSteps(prev => new Set(prev).add(4))
                setFormData(prev => ({
                  ...prev,
                  shippingMethods: checked
                    ? [...prev.shippingMethods, method]
                    : prev.shippingMethods.filter(m => m !== method),
                }))
              }}
              onPaymentProtectionChange={setPaymentProtectionEnabled}
              hasInteracted={touchedSteps.has(4)}
              showValidation={touchedSteps.has(4) && !validateStep(4)}
              policy={policy}
              mode="edit"
            />
          )}

          {/* Step 5: Review & Publish */}
          {currentStep === 5 && (
            <StepReviewPublish
              formData={formData}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              selectedBooster={selectedBooster}
              paymentProtectionEnabled={paymentProtectionEnabled}
              titleImageIndex={titleImageIndex}
              onGoToStep={step => goToStep(step, true)}
              onBoosterChange={boosterId => {
                if (!policy?.uiLocks.boosters) {
                  setSelectedBooster(boosterId)
                }
              }}
              isSubmitting={isLoading}
              policy={policy}
              mode="edit"
            />
          )}

          {/* Wizard footer */}
          <WizardFooter
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            onPrevious={prevStep}
            onNext={nextStep}
            onPublish={handleSubmit}
            isLastStep={currentStep === WIZARD_STEPS.length - 1}
            canProceed={validateStep(currentStep) && policy.level !== 'READ_ONLY'}
            isSubmitting={isLoading}
            disabledReason={getDisabledReason(currentStep)}
            mode="edit"
            policyLevel={policy.level}
          />
        </form>
      </div>

      <Footer />
    </div>
  )
}
