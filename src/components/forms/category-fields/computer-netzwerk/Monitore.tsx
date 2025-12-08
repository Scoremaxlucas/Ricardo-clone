import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function MonitoreFields({ subcategory, formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  const isGaming = subcategory === 'Gaming-Monitore'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {isGaming ? 'Gaming-Monitor-Details' : 'Monitor-Details'}
      </h3>
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
            placeholder="z.B. Samsung, LG, Dell, BenQ"
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
            placeholder="z.B. Odyssey G7, UltraSharp U2723DE"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Bildschirmgröße *</label>
          <input
            type="text"
            name="screenSize"
            value={formData.screenSize || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 27 Zoll, 32"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Auflösung *</label>
          <select
            name="resolution"
            value={formData.resolution || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="1920x1080">Full HD (1920x1080)</option>
            <option value="2560x1440">QHD (2560x1440)</option>
            <option value="3840x2160">4K UHD (3840x2160)</option>
            <option value="5120x2880">5K (5120x2880)</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Bildwiederholrate</label>
          <input
            type="text"
            name="refreshRate"
            value={formData.refreshRate || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 60Hz, 144Hz, 240Hz"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Panel-Typ</label>
          <select
            name="panelType"
            value={formData.panelType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="ips">IPS</option>
            <option value="va">VA</option>
            <option value="tn">TN</option>
            <option value="oled">OLED</option>
          </select>
        </div>
      </div>
    </div>
  )
}

