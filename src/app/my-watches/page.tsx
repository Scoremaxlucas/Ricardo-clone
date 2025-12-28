import { redirect } from 'next/navigation'

/**
 * /my-watches redirects to /my-watches/selling (Meine Angebote)
 * 
 * This is the single source of truth for listing management:
 * - Aktiv (tab)
 * - Entwürfe (tab) 
 * - Archiv (tab)
 * - Verkauft (tab)
 * 
 * Other features are accessible via dedicated routes:
 * - /my-watches/selling/fees → Gebühren & Rechnungen
 * - /my-watches/selling/offers → Preisvorschläge
 */
export default function MyWatchesPage() {
  redirect('/my-watches/selling')
}
