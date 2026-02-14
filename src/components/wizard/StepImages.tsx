'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { EditPolicy } from '@/lib/edit-policy'
import { compressImage } from '@/lib/image-compression'
import { Loader2, Lock, Star, Upload, X } from 'lucide-react'
import React, { useRef, useState } from 'react'
import toast from 'react-hot-toast'

interface DraftImage {
  id: string
  url: string
  storageKey: string
  sortOrder: number
}

interface StepImagesProps {
  formData: {
    images: string[]
    newImages?: string[] // For append-only mode
  }
  titleImageIndex: number
  draftId: string | null
  aiDetectedImageIndex?: number
  onImagesChange: (images: string[]) => void
  onTitleImageChange: (index: number) => Promise<void>
  policy?: EditPolicy
  mode?: 'create' | 'edit'
}

export function StepImages({
  formData,
  titleImageIndex,
  draftId,
  aiDetectedImageIndex = 0,
  onImagesChange,
  onTitleImageChange,
  policy,
  mode = 'create',
}: StepImagesProps) {
  const { t } = useLanguage()
  const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set())
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isImagesLocked = policy?.uiLocks.images || false
  const isImagesAppendOnly = policy?.uiLocks.imagesAppendOnly || false

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // If no draftId exists yet (edit mode or create mode before autosave), use base64 images
    // These will be uploaded when the draft is created/saved
    if (!draftId) {
      const currentImageCount = formData.images.length
      const newImageUrls: string[] = []
      let processedCount = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const tempIndex = currentImageCount + i

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} ${t.wizard.images.notAnImage}`, { position: 'top-right', duration: 4000 })
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} ${t.wizard.images.fileTooBig}`, {
            position: 'top-right',
            duration: 4000,
          })
          continue
        }

        try {
          setUploadingIndexes(prev => new Set(prev).add(tempIndex))
          const compressedImage = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.75,
            maxSizeMB: 1.5,
          })
          newImageUrls.push(compressedImage)
          processedCount++
        } catch (error) {
          console.error('Error compressing image:', error)
          toast.error(`${t.wizard.images.processingError} ${file.name}`, {
            position: 'top-right',
            duration: 4000,
          })
        } finally {
          setUploadingIndexes(prev => {
            const next = new Set(prev)
            next.delete(tempIndex)
            return next
          })
        }
      }

      // Update images after all are processed
      if (newImageUrls.length > 0) {
        onImagesChange([...formData.images, ...newImageUrls])
        toast.success(
          `${newImageUrls.length} ${newImageUrls.length > 1 ? t.wizard.images.images : t.wizard.images.image} ${t.wizard.images.imagesAdded}`,
          {
            position: 'top-right',
            duration: 3000,
          }
        )

        // Set first image as title image if none set
        if (currentImageCount === 0) {
          await onTitleImageChange(0)
        }
      }

      // Reset input
      e.target.value = ''
      return
    }

    // Capture initial image count BEFORE uploads
    const initialImageCount = formData.images.length
    const initialImages = [...formData.images] // Snapshot of current images
    const newImageUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const tempIndex = initialImageCount + newImageUrls.length

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ${t.wizard.images.notAnImageSelect}`, {
          position: 'top-right',
          duration: 4000,
        })
        continue
      }

      // Check file size (max 10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} ${t.wizard.images.fileTooBig}`, {
          position: 'top-right',
          duration: 4000,
        })
        continue
      }

      try {
        setUploadingIndexes(prev => new Set(prev).add(tempIndex))

        // Compress image
        const compressedImage = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.75,
          maxSizeMB: 1.5,
        })

        // Show progress for multiple images
        if (files.length > 1) {
          toast.loading(`${t.wizard.images.image} ${newImageUrls.length + 1} von ${files.length} ${t.wizard.images.uploadProgress}`, {
            id: 'image-upload-progress',
            position: 'top-right',
          })
        }

        // Convert base64 data URL to File for upload
        // More reliable than using fetch() on data URLs
        const base64Data = compressedImage.split(',')[1]
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/jpeg' })
        const uploadFile = new File([blob], file.name, { type: 'image/jpeg' })

        // Upload immediately to server
        const uploadFormData = new FormData()
        uploadFormData.append('file', uploadFile)

        const uploadResponse = await fetch(`/api/drafts/${draftId}/images`, {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.message || t.wizard.images.uploadFailed)
        }

        const { image } = await uploadResponse.json()
        newImageUrls.push(image.url)

        // Update UI with ALL accumulated images (initial + all new so far)
        // This ensures correct order regardless of React batching
        const updatedImages = [...initialImages, ...newImageUrls]
        onImagesChange(updatedImages)

        // Set first image as title image if this is the first ever image
        if (initialImageCount === 0 && newImageUrls.length === 1) {
          await onTitleImageChange(0)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(
          `${t.wizard.images.uploadError} ${file.name}: ${error instanceof Error ? error.message : t.wizard.images.unknownError}`,
          {
            position: 'top-right',
            duration: 5000,
          }
        )
      } finally {
        setUploadingIndexes(prev => {
          const next = new Set(prev)
          next.delete(tempIndex)
          return next
        })
      }
    }

    if (files.length > 1) {
      toast.dismiss('image-upload-progress')
    }

    if (newImageUrls.length > 0) {
      toast.success(
        `${newImageUrls.length} ${newImageUrls.length > 1 ? t.wizard.images.images : t.wizard.images.image} ${t.wizard.images.imagesUploaded}`,
        {
          position: 'top-right',
          duration: 3000,
        }
      )
    }

    // Reset input
    e.target.value = ''
  }

  const removeImage = async (index: number) => {
    if (!draftId) {
      toast.error(t.wizard.images.waitForDraft, {
        position: 'top-right',
        duration: 3000,
      })
      return
    }

    const imageUrl = formData.images[index]

    try {
      // Find image ID from draft
      const response = await fetch(`/api/drafts/${draftId}`)
      if (response.ok) {
        const data = await response.json()
        const draft = data.draft
        const image = draft.draftImages?.find((img: DraftImage) => img.url === imageUrl)

        if (image) {
          // Delete from server
          const deleteResponse = await fetch(`/api/drafts/${draftId}/images/${image.id}`, {
            method: 'DELETE',
          })

          if (!deleteResponse.ok) {
            throw new Error(t.wizard.images.deleteFailed)
          }
        }
      }

      // Update UI
      const newImages = formData.images.filter((_, i) => i !== index)
      onImagesChange(newImages)

      // Adjust title image index if needed
      if (index === titleImageIndex) {
        await onTitleImageChange(0)
      } else if (index < titleImageIndex) {
        await onTitleImageChange(titleImageIndex - 1)
      }
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error(t.wizard.images.deleteError, {
        position: 'top-right',
        duration: 3000,
      })
    }
  }

  const setAsTitleImage = async (index: number) => {
    await onTitleImageChange(index)
    toast.success(t.wizard.images.titleImageChanged, {
      position: 'top-right',
      duration: 2000,
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          {t.wizard.images.title}
        </h2>
        <p className="text-xs text-gray-600 sm:text-sm md:text-base">
          {isImagesAppendOnly
            ? t.wizard.images.subtitleAppendOnly
            : t.wizard.images.subtitleNormal}
        </p>
      </div>

      {/* Append-only mode banner */}
      {isImagesAppendOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              {t.wizard.images.appendOnlyBanner}
            </p>
          </div>
        </div>
      )}

      {/* Upload area */}
      {!isImagesLocked && (
        <div
          className={`rounded-xl border-2 border-dashed p-4 transition-colors sm:p-6 md:p-8 ${
            isImagesAppendOnly
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <label
            className={`flex flex-col items-center gap-3 sm:gap-4 ${isImagesAppendOnly ? 'cursor-pointer' : 'cursor-pointer'}`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14 md:h-16 md:w-16 ${
                isImagesAppendOnly ? 'bg-gray-100' : 'bg-primary-100'
              }`}
            >
              <Upload
                className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${isImagesAppendOnly ? 'text-gray-500' : 'text-primary-600'}`}
              />
            </div>
            <div className="text-center">
              <span
                className={`text-base font-semibold sm:text-lg ${
                  isImagesAppendOnly ? 'text-gray-600' : 'text-gray-700'
                }`}
              >
                {isImagesAppendOnly
                  ? t.wizard.images.addAdditional
                  : formData.images.length > 0
                    ? t.wizard.images.addMore
                    : t.wizard.images.uploadImages}
              </span>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">{t.wizard.images.fileFormats}</p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={uploadingIndexes.size > 0 || isImagesLocked}
              className="hidden"
            />
            <span
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2 sm:text-base ${
                isImagesAppendOnly
                  ? 'bg-gray-400 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {uploadingIndexes.size > 0 ? t.wizard.images.uploading : t.wizard.images.selectFiles}
            </span>
          </label>
        </div>
      )}

      {/* Image preview grid */}
      {formData.images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {isImagesAppendOnly ? t.wizard.images.existingImages : t.wizard.images.uploadedImages} (
              {formData.images.length}/10)
            </h3>
            {formData.images.length > 0 && !isImagesAppendOnly && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="h-4 w-4 text-yellow-500" />
                {t.wizard.images.clickToSetTitle}
              </span>
            )}
            {isImagesAppendOnly && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <Lock className="h-4 w-4" />
                {t.wizard.images.existingCannotChange}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {formData.images.map((image, index) => {
              const isUploading = uploadingIndexes.has(index)

              return (
                <div
                  key={index}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                    index === titleImageIndex
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                  ) : (
                    <>
                      <img
                        src={image}
                        alt={`${t.wizard.images.imageAlt} ${index + 1}`}
                        className={`h-full w-full object-cover transition-transform ${
                          isImagesAppendOnly
                            ? 'cursor-default'
                            : 'cursor-pointer group-hover:scale-105'
                        }`}
                        onClick={() => !isImagesAppendOnly && setAsTitleImage(index)}
                      />

                      {/* Title image badge */}
                      {index === titleImageIndex && (
                        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary-600 px-2 py-1 text-xs font-medium text-white">
                          <Star className="h-3 w-3" />
                          {t.wizard.images.titleImage}
                        </div>
                      )}

                      {/* Remove button - hidden in append-only mode */}
                      {!isImagesAppendOnly && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            removeImage(index)
                          }}
                          disabled={!draftId}
                          aria-label={t.wizard.images.removeImage}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 disabled:opacity-50 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
