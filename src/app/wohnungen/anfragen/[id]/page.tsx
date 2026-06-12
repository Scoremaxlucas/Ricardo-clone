import { redirect } from 'next/navigation'

/** Legacy-Route — Bewerbungsstatus liegt unter /meine-bewerbungen */
export default function LegacyRentalApplicationDetailPage() {
  redirect('/meine-bewerbungen')
}
