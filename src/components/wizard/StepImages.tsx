'use client'

import { Sparkles, Upload, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { compressImage } from '@/lib/image-compression'

interface StepImagesProps {
  formData: {
    images: string[]
  }
  titleImageIndex: number
  onImagesChange: (images: string[]) => void
  onTitleImageChange: (index: number) => void
}

export function StepImages({
  formData,
  titleImageIndex,
  onImagesChange,
  onTitleImageChange,
}: StepImagesProps) {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: string[] = []
    let processedCount = 0

    const currentImageCount = formData.images.length

    for (const file of files) {
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
        // Compress image
        const compressedImage = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.75,
          maxSizeMB: 1.5,
        })

        // Check final size
        const base64SizeMB = (compressedImage.length * 0.75) / (1024 * 1024)
        if (base64SizeMB > 1.5) {
          console.warn(`Bild ${file.name} ist nach Komprimierung noch ${base64SizeMB.toFixed(2)}MB groß`)
          toast(`Bild ${file.name} ist sehr groß (${base64SizeMB.toFixed(2)}MB). Bitte verwenden Sie ein kleineres Bild.`, {
            position: 'top-right',
            duration: 5000,
          })
        }

        newImages.push(compressedImage)
        processedCount++

        // Show progress for multiple images
        if (files.length > 1) {
          toast.loading(`Bild ${processedCount} von ${files.length} wird verarbeitet...`, {
            id: 'image-upload-progress',
            position: 'top-right',
          })
        }
      } catch (error) {
        console.error('Error processing image:', error)
        toast.error(`Fehler beim Verarbeiten von ${file.name}`, {
          position: 'top-right',
        })
      }
    }

    if (files.length > 1) {
      toast.dismiss('image-upload-progress')
    }

    if (newImages.length > 0) {
      const updatedImages = [...formData.images, ...newImages]
      onImagesChange(updatedImages)

      // Set first image as title image if none set
      if (currentImageCount === 0) {
        onTitleImageChange(0)
        toast.success(`${newImages.length} Bild${newImages.length > 1 ? 'er' : ''} hinzugefügt. Das erste Bild ist das Titelbild.`, {
          position: 'top-right',
          duration: 3000,
        })
      } else {
        toast.success(`${newImages.length} Bild${newImages.length > 1 ? 'er' : ''} hinzugefügt.`, {
          position: 'top-right',
          duration: 3000,
        })
      }
    }

    // Reset input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    onImagesChange(newImages)

    // Adjust title image index if needed
    if (index === titleImageIndex) {
      onTitleImageChange(0)
    } else if (index < titleImageIndex) {
      onTitleImageChange(titleImageIndex - 1)
    }
  }

  const setAsTitleImage = (index: number) => {
    onTitleImageChange(index)
    toast.success('Titelbild geändert', {
      position: 'top-right',
      duration: 2000,
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Bilder hochladen</h2>
        <p className="text-gray-600">
          Fügen Sie bis zu 10 Bilder hinzu. Das erste Bild wird als Titelbild verwendet.
        </p>
      </div>

      {/* Upload area */}
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-primary-400 hover:bg-primary-50">
        <label className="flex cursor-pointer flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Upload className="h-8 w-8 text-primary-600" />
          </div>
          <div className="text-center">
            <span className="text-lg font-semibold text-gray-700">
              Bilder hochladen
            </span>
            <p className="mt-1 text-sm text-gray-500">
              JPG, PNG, max. 10MB pro Bild
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <span className="rounded-full bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700">
            Dateien auswählen
          </span>
        </label>
      </div>

      {/* Image preview grid */}
      {formData.images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Hochgeladene Bilder ({formData.images.length}/10)
            </h3>
            {formData.images.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Star className="h-4 w-4 text-yellow-500" />
                Klicken Sie auf ein Bild, um es als Titelbild zu setzen
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {formData.images.map((image, index) => (
              <div
                key={index}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                  index === titleImageIndex
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image}
                  alt={`Bild ${index + 1}`}
                  className="h-full w-full cursor-pointer object-cover transition-transform group-hover:scale-105"
                  onClick={() => setAsTitleImage(index)}
                />

                {/* Title image badge */}
                {index === titleImageIndex && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary-600 px-2 py-1 text-xs font-medium text-white">
                    <Star className="h-3 w-3" />
                    Titelbild
                  </div>
                )}

                {/* AI badge if first image */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-green-600/90 px-2 py-1 text-xs font-medium text-white">
                    <Sparkles className="h-3 w-3" />
                    KI
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      {formData.images.length === 0 && (
        <div className="rounded-lg bg-yellow-50 p-4 text-center text-sm text-yellow-800">
          <strong>Tipp:</strong> Mindestens ein Bild ist erforderlich, um fortzufahren.
        </div>
      )}
    </div>
  )
}

