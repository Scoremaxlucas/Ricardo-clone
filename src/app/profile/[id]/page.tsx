import { redirect } from 'next/navigation'

// Redirect old /profile/[id] URLs to the real /users/[id] public profile page
export default function PublicProfileRedirect({ params }: { params: { id: string } }) {
  redirect(`/users/${params.id}`)
}
