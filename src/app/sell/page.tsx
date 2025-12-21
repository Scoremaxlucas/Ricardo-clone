'use client'

import { ProfileCompletionGate } from '@/components/account/ProfileCompletionGate'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import {
  StepCategorySelection,
  StepDetails,
  StepImages,
  StepPrice,
  StepProgress,
  StepReviewPublish,
  StepShippingPayment,
  WizardFooter,
} from '@/components/wizard'
import { useLanguage } from '@/contexts/LanguageContext'
import { clearDraft, clearOtherUserDrafts, loadDraft, saveDraft } from '@/lib/draft-storage'
import { canSell, getVerificationStatus } from '@/lib/verification'
import { AlertCircle, CheckCircle, Loader2, Shield, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

// Lazy load AIDetection to avoid bundling TensorFlow.js on every page
const AIDetection = dynamic(
  () => import('@/components/forms/AIDetection').then(mod => ({ default: mod.AIDetection })),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center text-gray-500">Lade KI-Erkennung...</div>,
  }
)

// Define wizard steps
const WIZARD_STEPS = [
  { id: 'category', title: 'Kategorie', shortTitle: 'Kategorie' },
  { id: 'images', title: 'Bilder', shortTitle: 'Bilder' },
  { id: 'details', title: 'Details', shortTitle: 'Details' },
  { id: 'price', title: 'Preis', shortTitle: 'Preis' },
  { id: 'shipping', title: 'Versand & Zahlung', shortTitle: 'Versand' },
  { id: 'review', title: 'Überprüfung', shortTitle: 'Fertig' },
]

function SellPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const formRef = useRef<HTMLFormElement>(null)
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wizardContainerRef = useRef<HTMLDivElement>(null)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)

  // State
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  const [verificationInProgress, setVerificationInProgress] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(true)

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [showDraftRestored, setShowDraftRestored] = useState(false)
  const [touchedSteps, setTouchedSteps] = useState<Set<number>>(new Set()) // Track which steps user has interacted with
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null) // Current draft ID for image operations

  // Form state
  const [titleImageIndex, setTitleImageIndex] = useState<number>(0)
  const [selectedBooster, setSelectedBooster] = useState<string>('none')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [detectedProductName, setDetectedProductName] = useState<string>('')
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0)
  const [showAIDetection, setShowAIDetection] = useState<boolean>(true)
  const [paymentProtectionEnabled, setPaymentProtectionEnabled] = useState(false)

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
    auctionEnd: '',
    auctionStart: '',
    auctionDuration: '',
    autoRenew: false,
    shippingMethods: ['pickup'] as string[], // Default: preselect Abholung
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
    images: [] as string[],
  })

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleShippingMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => {
      const currentMethods = [...prev.shippingMethods]
      if (checked) {
        if (!currentMethods.includes(method)) {
          currentMethods.push(method)
        }
      } else {
        const index = currentMethods.indexOf(method)
        if (index > -1) {
          currentMethods.splice(index, 1)
        }
      }
      return { ...prev, shippingMethods: currentMethods }
    })
  }

  const setExclusiveSupply = (option: 'fullset' | 'onlyBox' | 'onlyPapers' | 'onlyAllLinks') => {
    setFormData(prev => ({
      ...prev,
      fullset: option === 'fullset',
      onlyBox: option === 'onlyBox',
      onlyPapers: option === 'onlyPapers',
      onlyAllLinks: option === 'onlyAllLinks',
    }))
  }

  // Validation functions
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Category
        return !!selectedCategory
      case 1: // Images
        return formData.images.length > 0
      case 2: // Details
        return !!formData.title?.trim() && !!formData.description?.trim() && !!formData.condition
      case 3: // Price
        const price = parseFloat(formData.price)
        if (!price || price <= 0) return false
        if (
          formData.isAuction &&
          (!formData.auctionDuration || parseInt(formData.auctionDuration) < 1)
        )
          return false
        if (formData.buyNowPrice) {
          const buyNow = parseFloat(formData.buyNowPrice)
          if (buyNow > 0 && buyNow <= price) return false
        }
        return true
      case 4: // Shipping
        return formData.shippingMethods.length > 0
      case 5: // Review
        return true
      default:
        return false
    }
  }

  // Get disabled reason for current step
  const getDisabledReason = (step: number): string | undefined => {
    switch (step) {
      case 0:
        if (!selectedCategory) return 'Bitte wählen Sie eine Kategorie aus'
        return undefined
      case 1:
        if (formData.images.length === 0) return 'Bitte laden Sie mindestens ein Bild hoch'
        return undefined
      case 2:
        if (!formData.title?.trim()) return 'Bitte geben Sie einen Titel ein'
        if (!formData.description?.trim()) return 'Bitte geben Sie eine Beschreibung ein'
        if (!formData.condition) return 'Bitte wählen Sie den Zustand aus'
        return undefined
      case 3:
        const price = parseFloat(formData.price)
        if (!price || price <= 0) return 'Bitte geben Sie einen gültigen Preis ein'
        if (formData.isAuction && !formData.auctionDuration)
          return 'Bitte wählen Sie die Auktionsdauer'
        if (formData.buyNowPrice) {
          const buyNow = parseFloat(formData.buyNowPrice)
          if (buyNow > 0 && buyNow <= price) return 'Sofortkaufpreis muss höher als Startpreis sein'
        }
        return undefined
      case 4:
        if (formData.shippingMethods.length === 0)
          return 'Bitte wählen Sie mindestens eine Lieferart'
        return undefined
      case 5:
        return undefined
      default:
        return undefined
    }
  }

  const computeMaxAllowedStep = (): number => {
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      if (!validateStep(i)) return i
    }
    return WIZARD_STEPS.length - 1
  }

  // Get completed steps - only mark as completed if we've actually moved past this step
  const getCompletedSteps = (): number[] => {
    const completed: number[] = []
    for (let i = 0; i < currentStep; i++) {
      if (validateStep(i)) completed.push(i)
    }
    return completed
  }

  // Navigation
  const goToStep = useCallback(
    (step: number, skipValidation: boolean = false) => {
      const clampedStep = Math.max(0, Math.min(WIZARD_STEPS.length - 1, step))

      // Always allow backward navigation
      if (clampedStep < currentStep) {
        setCurrentStep(clampedStep)
        router.push(`/sell?step=${clampedStep}`, { scroll: false })
        return
      }

      // Forward navigation: validate current step
      if (!skipValidation && clampedStep > currentStep) {
        if (!validateStep(currentStep)) {
          toast.error('Bitte füllen Sie alle erforderlichen Felder aus', {
            position: 'top-right',
            duration: 3000,
          })
          return
        }
      }

      // Check max allowed step
      const maxAllowed = computeMaxAllowedStep()
      if (clampedStep > maxAllowed) {
        setCurrentStep(maxAllowed)
        router.push(`/sell?step=${maxAllowed}`, { scroll: false })
        return
      }

      setCurrentStep(clampedStep)
      router.push(`/sell?step=${clampedStep}`, { scroll: false })
    },
    [currentStep, router, selectedCategory, formData]
  )

  const nextStep = () => {
    // Mark current step as touched when user tries to proceed
    setTouchedSteps(prev => new Set(prev).add(currentStep))

    if (validateStep(currentStep)) {
      goToStep(currentStep + 1)
    } else {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus', {
        position: 'top-right',
        duration: 3000,
      })
    }
  }

  const prevStep = () => {
    goToStep(currentStep - 1, true)
  }

  // Draft save state for visual feedback
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Draft save/restore - Server-seitig via new API
  const saveDraftData = useCallback(async () => {
    if (!session?.user) return // Only save if logged in

    setIsSavingDraft(true)
    try {
      const userId = (session?.user as { id?: string })?.id
      const saved = await saveDraft(
        {
          formData: {
            ...formData,
            images: [], // Exclude images from formData (stored separately)
          },
          imageMetadata: {
            count: formData.images.length,
            titleImageIndex,
          },
          selectedCategory,
          selectedSubcategory,
          selectedBooster,
          paymentProtectionEnabled,
          currentStep,
        },
        userId
      )

      if (saved) {
        setLastSavedAt(new Date())
      }
    } catch (error) {
      console.error('[Draft] Error saving draft:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }, [
    session?.user,
    formData,
    selectedCategory,
    selectedSubcategory,
    selectedBooster,
    paymentProtectionEnabled,
    currentStep,
    titleImageIndex,
  ])

  // Scroll to top and focus heading when step changes
  useEffect(() => {
    const scrollToStepTop = () => {
      // Try scrolling wizard container first
      if (wizardContainerRef.current) {
        wizardContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Fallback to window scroll
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    // Focus heading after scroll (check global ref set by StepReviewPublish)
    const focusHeading = () => {
      requestAnimationFrame(() => {
        const headingRef = (window as any).stepHeadingRef
        if (headingRef) {
          headingRef.focus()
        }
      })
    }

    scrollToStepTop()
    focusHeading()
  }, [currentStep])

  // Restore draft on mount - Try server first, fallback to localStorage
  useEffect(() => {
    const restoreDraft = async () => {
      // Check URL query parameter first (for "Entwurf fortsetzen" link)
      const urlDraftId = searchParams.get('draft')
      if (urlDraftId) {
        try {
          const response = await fetch(`/api/drafts/${urlDraftId}`)
          if (response.ok) {
            const data = await response.json()
            const draft = data.draft
            setFormData(prev => ({
              ...prev,
              ...draft.formData,
              images: draft.draftImages?.map((img: any) => img.url) || draft.images || [],
            }))
            setSelectedCategory(draft.selectedCategory || '')
            setSelectedSubcategory(draft.selectedSubcategory || '')
            setSelectedBooster(draft.selectedBooster || 'none')
            setPaymentProtectionEnabled(draft.paymentProtectionEnabled || false)
            setCurrentStep(draft.currentStep || 0)
            if (draft.coverImageId && draft.draftImages) {
              const coverIndex = draft.draftImages.findIndex(
                (img: any) => img.id === draft.coverImageId
              )
              setTitleImageIndex(coverIndex >= 0 ? coverIndex : draft.titleImageIndex || 0)
            } else {
              setTitleImageIndex(draft.titleImageIndex || 0)
            }
            setCurrentDraftId(draft.id)
            setShowDraftRestored(true)
            setLastSavedAt(new Date(draft.updatedAt))
            router.push(`/sell?step=${draft.currentStep}`)
            return
          }
        } catch (error) {
          console.error('[Draft] Error loading draft from URL:', error)
        }
      }

      // Check if we should restore a specific draft (from drafts page)
      const restoreDraftId = localStorage.getItem('helvenda_restore_draft_id')
      if (restoreDraftId) {
        localStorage.removeItem('helvenda_restore_draft_id')
        try {
          const response = await fetch(`/api/drafts/${restoreDraftId}`)
          if (response.ok) {
            const data = await response.json()
            const draft = data.draft
            setFormData(prev => ({
              ...prev,
              ...draft.formData,
              // Use draftImages URLs if available, otherwise fallback to images array
              images: draft.draftImages?.map((img: any) => img.url) || draft.images || [],
            }))
            setSelectedCategory(draft.selectedCategory || '')
            setSelectedSubcategory(draft.selectedSubcategory || '')
            setSelectedBooster(draft.selectedBooster || 'none')
            setPaymentProtectionEnabled(draft.paymentProtectionEnabled || false)
            setCurrentStep(draft.currentStep || 0)
            // Set titleImageIndex based on coverImageId if available
            if (draft.coverImageId && draft.draftImages) {
              const coverIndex = draft.draftImages.findIndex(
                (img: any) => img.id === draft.coverImageId
              )
              setTitleImageIndex(coverIndex >= 0 ? coverIndex : draft.titleImageIndex || 0)
            } else {
              setTitleImageIndex(draft.titleImageIndex || 0)
            }
            setCurrentDraftId(draft.id) // Set draft ID for image operations
            setShowDraftRestored(true)
            setLastSavedAt(new Date(draft.updatedAt))
            router.push(`/sell?step=${draft.currentStep}`)
            return
          }
        } catch (error) {
          console.error('[Draft] Error loading specific draft:', error)
        }
      }

      if (!session?.user) {
        // Not logged in - cannot restore draft (must be logged in to sell)
        return
      }

      // Clear drafts from other users on mount
      const userId = (session.user as { id?: string })?.id
      if (userId) {
        clearOtherUserDrafts(userId)
      }

      // Try DB-backed API first (new endpoint)
      try {
        const response = await fetch('/api/sell/drafts/current')
        if (response.ok) {
          const data = await response.json()
          if (data.draft) {
            const draft = data.draft
            setFormData(prev => ({
              ...prev,
              ...draft.formData,
              // Use draftImages URLs if available, otherwise fallback to images array
              images: draft.draftImages?.map((img: any) => img.url) || draft.images || [],
            }))
            setSelectedCategory(draft.selectedCategory || '')
            setSelectedSubcategory(draft.selectedSubcategory || '')
            setSelectedBooster(draft.selectedBooster || 'none')
            setPaymentProtectionEnabled(draft.paymentProtectionEnabled || false)
            setCurrentStep(draft.currentStep || 0)
            // Set titleImageIndex based on coverImageId if available
            if (latestDraft.coverImageId && latestDraft.draftImages) {
              const coverIndex = latestDraft.draftImages.findIndex(
                (img: any) => img.id === latestDraft.coverImageId
              )
              setTitleImageIndex(coverIndex >= 0 ? coverIndex : latestDraft.titleImageIndex || 0)
            } else {
              setTitleImageIndex(latestDraft.titleImageIndex || 0)
            }
            setCurrentDraftId(latestDraft.id) // Set draft ID for image operations
            setShowDraftRestored(true)
            setLastSavedAt(new Date(latestDraft.updatedAt))
          } else {
            // Fallback to localStorage (userId-scoped)
            const userId = (session.user as { id?: string })?.id
            const draft = loadDraft(userId)
            if (draft) {
              setFormData(prev => ({ ...prev, ...draft.formData, images: [] }))
              setSelectedCategory(draft.selectedCategory || '')
              setSelectedSubcategory(draft.selectedSubcategory || '')
              setSelectedBooster(draft.selectedBooster || 'none')
              setPaymentProtectionEnabled(draft.paymentProtectionEnabled || false)
              setCurrentStep(draft.currentStep || 0)
              setTitleImageIndex(draft.imageMetadata?.titleImageIndex || 0)
              setShowDraftRestored(true)
              if (draft.imageMetadata?.count > 0) {
                toast('Bilder müssen erneut hochgeladen werden', {
                  icon: 'ℹ️',
                  position: 'top-right',
                  duration: 5000,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error('[Draft] Error loading from DB API:', error)
        // Fallback to localStorage (userId-scoped)
        const userId = (session.user as { id?: string })?.id
        if (userId) {
          loadDraft(userId).then(draft => {
            if (draft) {
              setFormData(prev => ({ ...prev, ...draft.formData, images: [] }))
              setSelectedCategory(draft.selectedCategory || '')
              setSelectedSubcategory(draft.selectedSubcategory || '')
              setSelectedBooster(draft.selectedBooster || 'none')
              setPaymentProtectionEnabled(draft.paymentProtectionEnabled || false)
              setCurrentStep(draft.currentStep || 0)
              setTitleImageIndex(draft.imageMetadata?.titleImageIndex || 0)
              setShowDraftRestored(true)
            }
          })
        }
      }
    }

    restoreDraft()
  }, [session?.user])

  // Auto-save on changes (debounced) - Server-seitig
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedCategory || formData.title || formData.description) {
        saveDraftData()
      }
    }, 2000) // Increased debounce for server requests
    return () => clearTimeout(timer)
  }, [formData, selectedCategory, selectedSubcategory, currentStep, saveDraftData])

  // URL navigation
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      const requestedStep = parseInt(stepParam, 10)
      if (!isNaN(requestedStep) && requestedStep !== currentStep) {
        goToStep(requestedStep, false)
      }
    }
  }, [searchParams])

  // Clear drafts from other users when user changes
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userId = (session.user as { id?: string })?.id
      if (userId) {
        clearOtherUserDrafts(userId)
      }
    } else if (status === 'unauthenticated') {
      // Clear all drafts when logged out
      clearOtherUserDrafts(null)
    }
  }, [status, session?.user])

  // Load verification status
  useEffect(() => {
    setVerificationInProgress(false)
  }, [])

  useEffect(() => {
    const loadVerificationStatus = async () => {
      if (!session?.user) {
        setIsCheckingVerification(false)
        return
      }
      try {
        const userId = (session.user as { id?: string }).id
        if (!userId) {
          setIsCheckingVerification(false)
          return
        }
        const response = await fetch(`/api/user/${userId}`)
        if (response.ok) {
          const userData = await response.json()
          // Use single source of truth: canSell helper
          const userCanSell = canSell({
            verified: userData.verified,
            verificationStatus: userData.verificationStatus,
            isBlocked: userData.isBlocked,
          })
          const vStatus = getVerificationStatus({
            verified: userData.verified,
            verificationStatus: userData.verificationStatus,
          })
          setIsVerified(userCanSell)
          setVerificationStatus(vStatus)
          setVerificationInProgress(vStatus === 'pending')
        }
      } catch (error) {
        console.error('Error loading verification status:', error)
      } finally {
        setIsCheckingVerification(false)
      }
    }
    loadVerificationStatus()
  }, [(session?.user as { id?: string })?.id])

  // Category detection handler
  const handleCategoryDetected = async (
    category: string,
    subcategory: string,
    productName: string,
    imageUrl: string | null,
    confidence: number
  ) => {
    console.log('[sell/page] Kategorie erkannt:', {
      category,
      subcategory,
      productName,
      confidence,
    })

    setSelectedCategory(category)
    setSelectedSubcategory(subcategory || '')
    setDetectedProductName(productName || '')
    setDetectedConfidence(confidence)

    // Add image if provided
    if (imageUrl) {
      const currentImages = [...formData.images]
      if (!currentImages.includes(imageUrl)) {
        currentImages.push(imageUrl)
        setFormData(prev => ({ ...prev, images: currentImages }))
        if (currentImages.length === 1) {
          setTitleImageIndex(0)
        }
      }
    }

    // Fetch price suggestion
    try {
      const priceResponse = await fetch('/api/ai/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory,
          brand: formData.brand,
          model: formData.model,
          condition: formData.condition,
          year: formData.year,
        }),
      })
      if (priceResponse.ok) {
        const priceData = await priceResponse.json()
        if (priceData.suggestedPrice) {
          setFormData(prev => ({
            ...prev,
            price: priceData.suggestedPrice.toString(),
          }))
        }
      }
    } catch (error) {
      console.error('Fehler bei Preisvorschlag:', error)
    }

    setShowAIDetection(false)
  }

  // Generate title with AI
  const handleGenerateTitle = async () => {
    if (formData.images.length === 0) return

    try {
      setIsGeneratingTitle(true)
      const response = await fetch('/api/ai/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: formData.images[0],
          category: selectedCategory,
          subcategory: selectedSubcategory,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.title) {
          // Typing effect
          const fullText = data.title
          let currentIndex = 0

          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current)
          }

          setFormData(prev => ({ ...prev, title: '' }))

          typingIntervalRef.current = setInterval(() => {
            if (currentIndex < fullText.length) {
              setFormData(prev => ({
                ...prev,
                title: fullText.substring(0, currentIndex + 1),
              }))
              currentIndex++
            } else {
              if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current)
                typingIntervalRef.current = null
              }
            }
          }, 20)
        }
      }
    } catch (error) {
      console.error('Fehler bei Titel-Generierung:', error)
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  // Generate description with AI
  const handleGenerateDescription = async () => {
    if (formData.images.length === 0) return

    try {
      setIsGeneratingDescription(true)
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: formData.images[0],
          category: selectedCategory,
          subcategory: selectedSubcategory,
          title: formData.title,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.description) {
          setFormData(prev => ({ ...prev, description: data.description }))
        }
      }
    } catch (error) {
      console.error('Fehler bei Beschreibung-Generierung:', error)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  // Profile completion gate state
  const [profileGateOpen, setProfileGateOpen] = useState(false)
  const [profileGateContext, setProfileGateContext] = useState<
    'SELL_PUBLISH' | 'SELL_ENABLE_SHIPPING' | 'PAYMENT_PROTECTION'
  >('SELL_PUBLISH')
  const [profileGateMissingFields, setProfileGateMissingFields] = useState<any[]>([])

  // Check profile completeness before publish
  const checkProfileBeforePublish = async (): Promise<boolean> => {
    try {
      const hasShipping =
        formData.shippingMethods &&
        formData.shippingMethods.length > 0 &&
        !formData.shippingMethods.includes('pickup')
      const isPickupOnly =
        formData.shippingMethods &&
        formData.shippingMethods.length === 1 &&
        formData.shippingMethods[0] === 'pickup'

      // Check payout profile if payment protection is enabled
      if (paymentProtectionEnabled) {
        try {
          const payoutRes = await fetch('/api/payout/profile')
          if (payoutRes.ok) {
            const payoutData = await payoutRes.json()
            if (!payoutData.hasProfile || payoutData.status !== 'ACTIVE') {
              // Block publish - show payout requirement
              setError(
                'Für den Zahlungsschutz benötigen Sie eine hinterlegte Bankverbindung. Bitte hinterlegen Sie diese in Ihren Kontoeinstellungen.'
              )
              toast.error('Bankverbindung erforderlich für Zahlungsschutz', {
                duration: 5000,
              })
              return false
            }
            if (payoutData.status === 'CHANGE_REQUESTED') {
              // Allow publish but warn about delayed payouts
              toast(
                'Hinweis: Ihre Bankverbindung wird derzeit geprüft. Auszahlungen können verzögert sein.',
                {
                  duration: 5000,
                  icon: '⚠️',
                }
              )
            }
          }
        } catch (error) {
          console.error('Error checking payout profile:', error)
          // Fail open - allow publish but log error
        }
      }

      // Determine context based on listing options
      let context: 'SELL_PUBLISH' | 'SELL_ENABLE_SHIPPING' | 'PAYMENT_PROTECTION' = 'SELL_PUBLISH'
      if (paymentProtectionEnabled) {
        context = 'PAYMENT_PROTECTION'
      } else if (hasShipping) {
        context = 'SELL_ENABLE_SHIPPING'
      }

      const res = await fetch('/api/profile/check-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          options: {
            hasShippingEnabled: hasShipping,
            hasPaymentProtection: paymentProtectionEnabled,
            isPickupOnly,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (!data.isComplete) {
          setProfileGateContext(context)
          setProfileGateMissingFields(data.missingFields)
          setProfileGateOpen(true)
          return false
        }
        return true
      }
      return true // Allow publish if check fails (fail open)
    } catch (error) {
      console.error('Error checking profile:', error)
      return true // Allow publish if check fails (fail open)
    }
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check profile completeness before publishing
    const canPublish = await checkProfileBeforePublish()
    if (!canPublish) {
      return // Gate modal is already shown
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    // Final validation
    for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        toast.error(`Bitte vervollständigen Sie Schritt ${i + 1}: ${WIZARD_STEPS[i].title}`, {
          position: 'top-right',
          duration: 4000,
        })
        setCurrentStep(i)
        setIsLoading(false)
        return
      }
    }

    try {
      // Clean description
      let cleanDescription = ''
      if (formData.description && typeof formData.description === 'string') {
        if (
          !formData.description.startsWith('data:image/') &&
          formData.description.length < 10000
        ) {
          cleanDescription = formData.description.trim()
        }
      }

      // Clean images
      let cleanImages = formData.images.filter(
        img =>
          typeof img === 'string' &&
          (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://'))
      )
      cleanImages = Array.from(new Set(cleanImages))

      const cleanPayload = {
        brand: formData.brand || '',
        model: formData.model || '',
        referenceNumber: formData.referenceNumber || '',
        year: formData.year || '',
        condition: formData.condition || '',
        material: formData.material || '',
        movement: formData.movement || '',
        caseDiameter: formData.caseDiameter || '',
        price: formData.price || '',
        buyNowPrice: formData.buyNowPrice || '',
        isAuction: formData.isAuction || false,
        auctionEnd: formData.auctionEnd || '',
        auctionStart: formData.auctionStart || '',
        auctionDuration: formData.auctionDuration || '',
        autoRenew: formData.autoRenew || false,
        shippingMethods: formData.shippingMethods || [],
        lastRevision: formData.lastRevision || '',
        accuracy: formData.accuracy || '',
        fullset: formData.fullset || false,
        onlyBox: formData.onlyBox || false,
        onlyPapers: formData.onlyPapers || false,
        onlyAllLinks: formData.onlyAllLinks || false,
        hasWarranty: formData.hasWarranty || false,
        warrantyMonths: formData.warrantyMonths || '',
        warrantyYears: formData.warrantyYears || '',
        hasSellerWarranty: formData.hasSellerWarranty || false,
        sellerWarrantyMonths: formData.sellerWarrantyMonths || '',
        sellerWarrantyYears: formData.sellerWarrantyYears || '',
        sellerWarrantyNote: formData.sellerWarrantyNote || '',
        title: formData.title || '',
        description: cleanDescription,
        images: cleanImages,
        titleImage: titleImageIndex,
        booster: selectedBooster !== 'none' ? selectedBooster : undefined,
        category: selectedCategory || '',
        subcategory: selectedSubcategory || '',
        paymentProtectionEnabled,
      }

      const response = await fetch('/api/watches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload),
      })

      if (response.ok) {
        // Clear draft on success (both server and localStorage)
        const userId = (session?.user as { id?: string })?.id
        await clearDraft(userId, currentDraftId || null)
        toast.success('Artikel erfolgreich veröffentlicht!', {
          position: 'top-right',
          duration: 3000,
        })
        setIsLoading(false)
        router.push('/my-watches')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || 'Ein Fehler ist aufgetreten', {
          position: 'top-right',
          duration: 5000,
        })
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error('Error submitting form:', err)
      toast.error(`Ein Fehler ist aufgetreten: ${err?.message || 'Unbekannter Fehler'}`, {
        position: 'top-right',
        duration: 5000,
      })
      setIsLoading(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Not logged in
  if (!session) {
    const currentUrl =
      typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/sell'
    router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`)
    return null
  }

  // Checking verification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <p className="text-gray-600">{t.selling.loading}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Not verified - block access to selling
  // Use single source of truth: canSell logic
  const userCanSell = isVerified === true
  if (!userCanSell && isCheckingVerification === false) {
    const returnUrl = encodeURIComponent('/sell')
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <AlertCircle className="mx-auto mb-6 h-16 w-16 text-yellow-500" />
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Verifizierung erforderlich zum Verkaufen
            </h2>
            <p className="mb-6 text-gray-600">
              {verificationInProgress
                ? 'Die Verifizierung ist im Gange. Sie erhalten eine Benachrichtigung, sobald die Verifizierung abgeschlossen ist.'
                : 'Um Artikel auf Helvenda verkaufen zu können, müssen Sie sich zuerst als Verkäufer verifizieren. Dies schützt sowohl Käufer als auch Verkäufer.'}
            </p>
            <Link
              href={`/verification?return_url=${returnUrl}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Shield className="h-5 w-5" />
              {verificationInProgress ? 'Verifizierung ansehen' : 'Jetzt verifizieren'}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Main wizard UI
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Draft restored banner */}
      {showDraftRestored && (
        <div className="fixed right-4 top-20 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 shadow-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-800">Entwurf wiederhergestellt</span>
          <button
            onClick={async () => {
              const userId = (session?.user as { id?: string })?.id
              await clearDraft(userId, currentDraftId || null)
              setShowDraftRestored(false)
            }}
            className="ml-2 text-xs text-green-600 underline hover:text-green-800"
          >
            Verwerfen
          </button>
          <button
            onClick={() => setShowDraftRestored(false)}
            className="ml-1 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Wizard container with min-height to prevent global footer interference */}
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
          <h1 className="text-3xl font-bold text-gray-900">Artikel zum Verkauf anbieten</h1>
          <p className="mt-2 text-gray-600">
            Wählen Sie zunächst die Kategorie und füllen Sie dann alle relevanten Felder aus.
          </p>
        </div>

        {/* Progress indicator */}
        <StepProgress
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          completedSteps={getCompletedSteps()}
          onStepClick={step => goToStep(step, false)}
        />

        {/* Form - prevent default submission, only submit via explicit button click */}
        {/* Added pb-24 for sticky footer and chat bubble spacing */}
        <form
          ref={formRef}
          onSubmit={e => e.preventDefault()}
          className="rounded-2xl bg-white p-4 pb-28 shadow-lg sm:p-6 sm:pb-28 md:p-8"
        >
          {/* Step 0: Category */}
          {currentStep === 0 && (
            <StepCategorySelection
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              detectedProductName={detectedProductName}
              detectedConfidence={detectedConfidence}
              showAIDetection={showAIDetection}
              formData={formData}
              titleImageIndex={titleImageIndex}
              onCategoryDetected={handleCategoryDetected}
              onCategoryChange={(cat, sub) => {
                setSelectedCategory(cat)
                setSelectedSubcategory(sub)
              }}
              onResetCategory={() => {
                setSelectedCategory('')
                setSelectedSubcategory('')
                setDetectedProductName('')
                setDetectedConfidence(0)
                setShowAIDetection(true)
              }}
              setShowAIDetection={setShowAIDetection}
              setFormData={setFormData}
              setTitleImageIndex={setTitleImageIndex}
            />
          )}

          {/* Step 1: Images */}
          {currentStep === 1 && (
            <StepImages
              formData={formData}
              titleImageIndex={titleImageIndex}
              draftId={currentDraftId}
              onImagesChange={images => setFormData(prev => ({ ...prev, images }))}
              onTitleImageChange={async index => {
                setTitleImageIndex(index)
                // Update cover image in DB if draftId exists
                if (currentDraftId && formData.images[index]) {
                  try {
                    // Find image ID from URL
                    const response = await fetch(`/api/drafts/${currentDraftId}`)
                    if (response.ok) {
                      const data = await response.json()
                      const draft = data.draft
                      const imageUrl = formData.images[index]
                      const image = draft.draftImages?.find((img: any) => img.url === imageUrl)
                      if (image) {
                        await fetch(`/api/drafts/${currentDraftId}/cover`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ coverImageId: image.id }),
                        })
                      }
                    }
                  } catch (error) {
                    console.error('[Draft] Error updating cover image:', error)
                  }
                }
              }}
            />
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <StepDetails
              formData={formData}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              isGeneratingTitle={isGeneratingTitle}
              isGeneratingDescription={isGeneratingDescription}
              onInputChange={handleInputChange}
              onFormDataChange={data => setFormData(prev => ({ ...prev, ...data }))}
              onGenerateTitle={handleGenerateTitle}
              onGenerateDescription={handleGenerateDescription}
              setExclusiveSupply={setExclusiveSupply}
            />
          )}

          {/* Step 3: Price */}
          {currentStep === 3 && (
            <StepPrice
              formData={formData}
              onInputChange={handleInputChange}
              onFormDataChange={data => setFormData(prev => ({ ...prev, ...data }))}
            />
          )}

          {/* Step 4: Shipping & Payment */}
          {currentStep === 4 && (
            <StepShippingPayment
              formData={formData}
              paymentProtectionEnabled={paymentProtectionEnabled}
              onShippingMethodChange={(method, checked) => {
                setTouchedSteps(prev => new Set(prev).add(4))
                handleShippingMethodChange(method, checked)
              }}
              onPaymentProtectionChange={setPaymentProtectionEnabled}
              hasInteracted={touchedSteps.has(4)}
              showValidation={touchedSteps.has(4) && !validateStep(4)}
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
              onBoosterChange={setSelectedBooster}
              isSubmitting={isLoading}
            />
          )}

          {/* Wizard footer */}
          <WizardFooter
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            onPrevious={prevStep}
            onNext={nextStep}
            onPublish={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            onSaveDraft={saveDraftData}
            isSavingDraft={isSavingDraft}
            lastSavedAt={lastSavedAt}
            isLastStep={currentStep === WIZARD_STEPS.length - 1}
            canProceed={validateStep(currentStep)}
            isSubmitting={isLoading}
            disabledReason={getDisabledReason(currentStep)}
          />
        </form>
      </div>

      {/* Profile Completion Gate */}
      <ProfileCompletionGate
        context={profileGateContext}
        missingFields={profileGateMissingFields}
        isOpen={profileGateOpen}
        onClose={() => setProfileGateOpen(false)}
        blocking={true}
      />

      <Footer />
    </div>
  )
}

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <SellPageContent />
    </Suspense>
  )
}
