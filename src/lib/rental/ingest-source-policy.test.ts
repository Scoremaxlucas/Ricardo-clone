import { describe, expect, it } from 'vitest'
import {
  getForbiddenRentalImportSource,
  rentalImportSourceBlockedFetchMessage,
  rentalImportSourcePolicyMessage,
} from '@/lib/rental/ingest-source-policy'

describe('getForbiddenRentalImportSource', () => {
  it('blocks homegate', () => {
    expect(getForbiddenRentalImportSource('https://www.homegate.ch/rent/4002086198')?.label).toBe('Homegate')
  })
  it('blocks immoscout24', () => {
    expect(getForbiddenRentalImportSource('https://www.immoscout24.ch/mieten/x')?.label).toBe('ImmoScout24')
  })
  it('allows tutti', () => {
    expect(getForbiddenRentalImportSource('https://www.tutti.ch/de/li/123')).toBeNull()
  })
  it('returns null for invalid url', () => {
    expect(getForbiddenRentalImportSource('not-a-url')).toBeNull()
  })
})

describe('rentalImportSourceBlockedFetchMessage', () => {
  it('names the platform and points to manual entry', () => {
    const msg = rentalImportSourceBlockedFetchMessage('Homegate')
    expect(msg).toMatch(/Homegate/)
    expect(msg).toMatch(/manuell/i)
  })
})

describe('rentalImportSourcePolicyMessage', () => {
  it('explains blocked source', () => {
    expect(rentalImportSourcePolicyMessage('https://www.homegate.ch/x')).toMatch(/Homegate/)
  })
  it('returns null for allowed source', () => {
    expect(rentalImportSourcePolicyMessage('https://www.tutti.ch/x')).toBeNull()
  })
})
