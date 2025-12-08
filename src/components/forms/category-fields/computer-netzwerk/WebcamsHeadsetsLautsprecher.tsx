import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function WebcamsHeadsetsLautsprecherFields({ subcategory, formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  const isWebcam = subcategory === 'Webcams'
  const isHeadset = subcategory === 'Headsets'
  const isLautsprecher = subcategory === 'Lautsprecher'

  const title = isWebcam ? 'Webcam-Details' : isHeadset ? 'Headset-Details' : 'Lautsprecher-Details'
  const modelPlaceholder = isWebcam
    ? 'z.B. Brio 4K, StreamCam'
    : isHeadset
      ? 'z.B. WH-1000XM5, QuietComfort 45'
      : 'z.B. Sonos One, HomePod'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
            placeholder="z.B. Logitech, Sony, Bose, Razer"
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
            placeholder={modelPlaceholder}
            required
          />
        </div>
        {isWebcam && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Auflösung</label>
            <select
              name="resolution"
              value={formData.resolution || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                disabled ? 'cursor-not-allowed bg-gray-100' : ''
              }`}
            >
              <option value="">Bitte wählen</option>
              <option value="720p">720p HD</option>
              <option value="1080p">1080p Full HD</option>
              <option value="4k">4K UHD</option>
            </select>
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Verbindung</label>
          <input
            type="text"
            name="connectivity"
            value={formData.connectivity || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. USB, Bluetooth, Kabellos"
          />
        </div>
      </div>
    </div>
  )
}

