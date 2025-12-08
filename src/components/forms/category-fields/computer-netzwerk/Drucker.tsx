import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function DruckerFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Drucker-Details</h3>
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
            placeholder="z.B. HP, Canon, Epson, Brother"
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
            placeholder="z.B. OfficeJet Pro 9015, PIXMA TS3750"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Drucktyp</label>
          <select
            name="printType"
            value={formData.printType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="tintenstrahldrucker">Tintenstrahldrucker</option>
            <option value="laserdrucker">Laserdrucker</option>
            <option value="farblaserdrucker">Farblaserdrucker</option>
            <option value="sw-laserdrucker">S/W Laserdrucker</option>
            <option value="3d-drucker">3D-Drucker</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Funktionen</label>
          <input
            type="text"
            name="printerFeatures"
            value={formData.printerFeatures || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Drucken, Scannen, Kopieren, Faxen"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Konnektivität</label>
          <input
            type="text"
            name="connectivity"
            value={formData.connectivity || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. WLAN, USB, Ethernet"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Druckgeschwindigkeit (Seiten/Min)
          </label>
          <input
            type="text"
            name="printSpeed"
            value={formData.printSpeed || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 15 S/W, 10 Farbe"
          />
        </div>
      </div>
    </div>
  )
}

