import { describe, expect, it } from 'vitest'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'

describe('formatRentalListingAddress', () => {
  it('omits null street and shows zip city', () => {
    expect(formatRentalListingAddress({ address: 'null', zip: '8038', city: 'Zürich' })).toBe('8038 Zürich')
  })

  it('joins street and locality', () => {
    expect(
      formatRentalListingAddress({ address: 'Seestrasse 12', zip: '8038', city: 'Zürich' })
    ).toBe('Seestrasse 12, 8038 Zürich')
  })

  it('returns em dash when empty', () => {
    expect(formatRentalListingAddress({ address: '', zip: '', city: '' })).toBe('—')
  })
})
