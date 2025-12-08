import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function TicketsGutscheineFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Ticket/Gutschein-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Art *</label>
          <select
            name="ticketType"
            value={formData.ticketType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="konzert">Konzert</option>
            <option value="sport">Sport</option>
            <option value="theater">Theater/Musical</option>
            <option value="gutschein">Gutschein</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Veranstaltung/Wert</label>
          <input
            type="text"
            name="eventName"
            value={formData.eventName || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Ed Sheeran Konzert / CHF 100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Datum (falls Ticket)</label>
          <input
            type="date"
            name="eventDate"
            value={formData.eventDate || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          />
        </div>
      </div>
    </div>
  )
}

