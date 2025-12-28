import { redirect } from 'next/navigation'

/**
 * /my-watches/selling/drafts redirects to /my-watches/selling?tab=drafts
 * 
 * Drafts are now managed in the unified "Meine Angebote" view with tabs.
 */
export default function DraftsPage() {
  redirect('/my-watches/selling?tab=drafts')
}
