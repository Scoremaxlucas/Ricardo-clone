import { SicAdminReview } from '@/components/sic/SicAdminReview'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'SIC Prüfung', robots: { index: false, follow: false } }

export default function SicAdminPage() {
  return <SicAdminReview />
}
