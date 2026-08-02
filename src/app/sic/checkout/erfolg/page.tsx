import { SicCheckoutSuccess } from '@/components/sic/SicCheckoutSuccess'

export const dynamic = 'force-dynamic'

export default async function SicCheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  return <SicCheckoutSuccess sessionId={session_id ?? ''} />
}
