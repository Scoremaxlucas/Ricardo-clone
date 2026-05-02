export type SignupIntent = 'marketplace' | 'wohnen'

export function parseSignupIntent(value: unknown): SignupIntent {
  if (value === 'wohnen') return 'wohnen'
  return 'marketplace'
}
