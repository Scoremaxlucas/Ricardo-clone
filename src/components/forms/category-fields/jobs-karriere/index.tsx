import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function JobsKarriereFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Job-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Stellenbezeichnung *</label>
          <input
            type="text"
            name="jobTitle"
            value={formData.jobTitle || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Software Engineer"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Arbeitszeit</label>
          <select
            name="workTime"
            value={formData.workTime || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="vollzeit">Vollzeit</option>
            <option value="teilzeit">Teilzeit</option>
            <option value="pensum">Pensum</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Branche</label>
          <input
            type="text"
            name="industry"
            value={formData.industry || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. IT, Finanz, Handel"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Standort</label>
          <input
            type="text"
            name="location"
            value={formData.location || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Zürich, Bern"
          />
        </div>
      </div>
    </div>
  )
}

