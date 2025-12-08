import React from 'react'
import { SubcategoryFieldsProps } from './types'

interface BaseFormFieldsProps extends SubcategoryFieldsProps {
  title: string
  fields: Array<{
    name: string
    label: string
    type?: 'text' | 'number' | 'date' | 'select' | 'textarea'
    placeholder?: string
    required?: boolean
    options?: Array<{ value: string; label: string }>
  }>
}

export function BaseFormFields({
  title,
  fields,
  formData,
  onChange,
  disabled = false,
}: BaseFormFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {field.label} {field.required && '*'}
            </label>
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onChange}
                disabled={disabled}
                required={field.required}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  disabled ? 'cursor-not-allowed bg-gray-100' : ''
                }`}
              >
                <option value="">Bitte wählen</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onChange}
                disabled={disabled}
                required={field.required}
                rows={4}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  disabled ? 'cursor-not-allowed bg-gray-100' : ''
                }`}
                placeholder={field.placeholder}
              />
            ) : (
              <input
                type={field.type || 'text'}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={onChange}
                disabled={disabled}
                required={field.required}
                className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  disabled ? 'cursor-not-allowed bg-gray-100' : ''
                }`}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

