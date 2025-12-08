import React from 'react'
import { SubcategoryFieldsProps } from '../shared/types'

export function BuecherFields({ formData, onChange, disabled = false }: SubcategoryFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Buch-Details</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Autor *</label>
          <input
            type="text"
            name="author"
            value={formData.author || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Max Mustermann"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Titel *</label>
          <input
            type="text"
            name="title"
            value={formData.title || formData.model || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="Buchtitel"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Verlag</label>
          <input
            type="text"
            name="publisher"
            value={formData.publisher || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. Suhrkamp, Fischer"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Erscheinungsjahr</label>
          <input
            type="number"
            name="year"
            value={formData.year || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 2020"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">ISBN</label>
          <input
            type="text"
            name="isbn"
            value={formData.isbn || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 978-3-12345-678-9"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Sprache</label>
          <select
            name="language"
            value={formData.language || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="deutsch">Deutsch</option>
            <option value="englisch">Englisch</option>
            <option value="französisch">Französisch</option>
            <option value="italienisch">Italienisch</option>
            <option value="spanisch">Spanisch</option>
            <option value="andere">Andere</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Buchtyp</label>
          <select
            name="bookType"
            value={formData.bookType || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Bitte wählen</option>
            <option value="hardcover">Hardcover</option>
            <option value="paperback">Taschenbuch</option>
            <option value="ebook">E-Book</option>
            <option value="hoerbuch">Hörbuch</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Seitenzahl</label>
          <input
            type="number"
            name="pages"
            value={formData.pages || ''}
            onChange={onChange}
            disabled={disabled}
            className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
              disabled ? 'cursor-not-allowed bg-gray-100' : ''
            }`}
            placeholder="z.B. 320"
          />
        </div>
      </div>
    </div>
  )
}

