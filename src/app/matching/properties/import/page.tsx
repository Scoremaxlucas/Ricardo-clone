import { redirect } from 'next/navigation'

/** Import-URL für Footer; Matching-MVP-Import liegt unter `/matching/match-objekte/import`. */
export default function RentalListingImportRedirectPage() {
  redirect('/matching/match-objekte/import')
}
