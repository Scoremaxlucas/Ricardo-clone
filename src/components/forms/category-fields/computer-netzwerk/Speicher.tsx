import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function SpeicherFields({ subcategory, formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  const isNAS = subcategory === 'NAS-Systeme'
  const isSSDorHDD = subcategory === 'SSDs' || subcategory === 'Externe Festplatten'

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Speicher-Details</h3>
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
            placeholder="z.B. Synology, QNAP, Samsung, WD"
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
            placeholder="z.B. DS923+, 980 PRO, My Passport"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Kapazität *</label>
          <input
            type="text"
            name="storageCapacity"
            value={formData.storageCapacity || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 1TB, 4TB, 16TB"
            required
          />
        </div>
        {isNAS && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Anzahl Laufwerksschächte</label>
            <input
              type="text"
              name="driveBays"
              value={formData.driveBays || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                disabled ? 'cursor-not-allowed bg-gray-100' : ''
              }`}
              placeholder="z.B. 2-Bay, 4-Bay, 8-Bay"
            />
          </div>
        )}
        {isSSDorHDD && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Schnittstelle</label>
            <select
              name="interface"
              value={formData.interface || ''}
              onChange={onChange}
              disabled={disabled}
              className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                disabled ? 'cursor-not-allowed bg-gray-100' : ''
              }`}
            >
              <option value="">Bitte wählen</option>
              <option value="usb-c">USB-C</option>
              <option value="usb-3.0">USB 3.0</option>
              <option value="thunderbolt">Thunderbolt</option>
              <option value="nvme">NVMe</option>
              <option value="sata">SATA</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

