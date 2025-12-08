import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function ObjektiveFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Objektiv-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Marke *</label>
          <input
            type="text"
            name="brand"
            value={formData.brand || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Canon, Nikon, Sony, Sigma"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Modell *</label>
          <input
            type="text"
            name="model"
            value={formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. RF 24-70mm f/2.8L, FE 85mm f/1.4 GM"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Brennweite *</label>
          <input
            type="text"
            name="focalLength"
            value={formData.focalLength || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 24-70mm, 50mm, 70-200mm"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Max. Blende *</label>
          <input
            type="text"
            name="aperture"
            value={formData.aperture || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. f/1.4, f/2.8, f/4"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Anschluss / Mount</label>
          <input
            type="text"
            name="mount"
            value={formData.mount || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Canon RF, Sony E, Nikon Z"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Bildstabilisator</label>
          <select
            name="imageStabilization"
            value={formData.imageStabilization || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="ja">Ja (IS/VR/OSS)</option>
            <option value="nein">Nein</option>
          </select>
        </div>
      </div>
    </div>
  )
}

