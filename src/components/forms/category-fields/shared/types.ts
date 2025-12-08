export interface CategoryFieldsProps {
  category: string
  subcategory?: string
  formData: any
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  disabled?: boolean
}

export interface SubcategoryFieldsProps {
  subcategory?: string
  formData: any
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  disabled?: boolean
}

