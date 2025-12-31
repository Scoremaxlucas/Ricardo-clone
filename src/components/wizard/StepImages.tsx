'use client'

import { EditPolicy } from '@/lib/edit-policy'
import { compressImage } from '@/lib/image-compression'
import { Bot, Loader2, Lock, Star, Upload, X } from 'lucide-react'
import React, { useState, useRef } from 'react'
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
          toast.error(`${file.name} ist kein Bild.`, { position: 'top-right', duration: 4000 })
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} ist zu groß. Maximale Größe: 10MB`, {
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
          toast.error(`Fehler beim Verarbeiten von ${file.name}`, {
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
          `${newImageUrls.length} Bild${newImageUrls.length > 1 ? 'er' : ''} hinzugefügt.`,
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

    const currentImageCount = formData.images.length
    const newImageUrls: string[] = []
    let processedCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const tempIndex = currentImageCount + i

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist kein Bild. Bitte wählen Sie nur Bilddateien aus.`, {
          position: 'top-right',
          duration: 4000,
        })
        continue
      }

      // Check file size (max 10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß. Maximale Größe: 10MB`, {
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
          toast.loading(`Bild ${processedCount + 1} von ${files.length} wird hochgeladen...`, {
            id: 'image-upload-progress',
            position: 'top-right',
          })
        }

        // Convert base64 to File for upload
        const base64Response = await fetch(compressedImage)
        const blob = await base64Response.blob()
        const uploadFile = new File([blob], file.name, { type: file.type })

        // Upload immediately to server
        const uploadFormData = new FormData()
        uploadFormData.append('file', uploadFile)

        const uploadResponse = await fetch(`/api/drafts/${draftId}/images`, {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorData.message || 'Upload fehlgeschlagen')
        }

        const { image } = await uploadResponse.json()
        newImageUrls.push(image.url)

        processedCount++

        // Update UI immediately
        const updatedImages = [...formData.images, image.url]
        onImagesChange(updatedImages)

        // Set first image as title image if none set
        if (currentImageCount === 0 && processedCount === 1) {
          await onTitleImageChange(0)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(
          `Fehler beim Hochladen von ${file.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
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
        `${newImageUrls.length} Bild${newImageUrls.length > 1 ? 'er' : ''} erfolgreich hochgeladen.`,
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
      toast.error('Bitte warten Sie, bis der Entwurf geladen ist', {
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
            throw new Error('Löschen fehlgeschlagen')
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
      toast.error('Fehler beim Löschen des Bildes', {
        position: 'top-right',
        duration: 3000,
      })
    }
  }

  const setAsTitleImage = async (index: number) => {
    await onTitleImageChange(index)
    toast.success('Titelbild geändert', {
      position: 'top-right',
      duration: 2000,
    })
  }

  // Check if the first image likely came from AI detection
  const hasAIDetectedImage = formData.images.length > 0

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 md:mb-2 md:text-2xl">
          Bilder hochladen
        </h2>
        <p className="text-sm text-gray-600 md:text-base">
          {isImagesAppendOnly
            ? 'Sie können nur zusätzliche Bilder hinzufügen. Bestehende Bilder können nicht gelöscht oder geändert werden.'
            : 'Fügen Sie bis zu 10 Bilder hinzu. Das erste Bild wird als Titelbild verwendet.'}
        </p>
      </div>

      {/* Append-only mode banner */}
      {isImagesAppendOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              Bei vorhandenen Geboten können nur neue Bilder hinzugefügt werden. Bestehende Bilder
              können nicht gelöscht oder neu angeordnet werden.
            </p>
          </div>
        </div>
      )}

      {/* AI-detected image notice */}
      {hasAIDetectedImage && formData.images.length === 1 && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Bot className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-800">Bild von KI-Erkennung übernommen</p>
            <p className="text-sm text-green-700">
              Das Bild aus der Kategorie-Erkennung wurde automatisch als erstes Listing-Bild
              gesetzt.
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
                  ? 'Zusätzliche Bilder hinzufügen'
                  : formData.images.length > 0
                    ? 'Weitere Bilder hinzufügen'
                    : 'Bilder hochladen'}
              </span>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">JPG, PNG, max. 10MB pro Bild</p>
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
              {uploadingIndexes.size > 0 ? 'Wird hochgeladen...' : 'Dateien auswählen'}
            </span>
          </label>
        </div>
      )}

      {/* Image preview grid */}
      {formData.images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {isImagesAppendOnly ? 'Bestehende Bilder' : 'Hochgeladene Bilder'} (
              {formData.images.length}/10)
            </h3>
            {formData.images.length > 0 && !isImagesAppendOnly && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="h-4 w-4 text-yellow-500" />
                Klicken Sie auf ein Bild, um es als Titelbild zu setzen
              </span>
            )}
            {isImagesAppendOnly && (
              <span className="flex items-center gap-1 text-sm text-amber-600">
                <Lock className="h-4 w-4" />
                Bestehende Bilder können nicht geändert werden
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
                        alt={`Bild ${index + 1}`}
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
                          Titelbild
                        </div>
                      )}

                      {/* AI badge if first image (from AI detection) */}
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-1 text-xs font-medium text-white">
                          <Bot className="h-3 w-3" />
                          Von KI
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
