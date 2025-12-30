import { redirect } from 'next/navigation'

// Redirect to the integrated sold tab in /selling
// The sold functionality is now part of the main seller dashboard with a drawer
export default function SoldRedirectPage() {
  redirect('/my-watches/selling?tab=sold')
}
