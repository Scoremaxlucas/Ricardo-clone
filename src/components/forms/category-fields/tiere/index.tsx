import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function TiereFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tier-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tierart *</label>
          <select
            name="animalType"
            value={formData.animalType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="hund">Hund</option>
            <option value="katze">Katze</option>
            <option value="vogel">Vogel</option>
            <option value="nager">Nager</option>
            <option value="pferd">Pferd</option>
            <option value="andere">Andere</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Rasse</label>
          <input
            type="text"
            name="breed"
            value={formData.breed || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Golden Retriever, Perserkatze"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Alter</label>
          <input
            type="text"
            name="age"
            value={formData.age || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2 Jahre, 6 Monate"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Geschlecht</label>
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="maennlich">Männlich</option>
            <option value="weiblich">Weiblich</option>
          </select>
        </div>
      </div>
    </div>
  )
}

