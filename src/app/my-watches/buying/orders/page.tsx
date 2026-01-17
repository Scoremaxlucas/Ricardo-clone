import { redirect } from 'next/navigation'

/**
 * Redirect old /my-watches/buying/orders to consolidated /my-watches/buying/purchased
 * This consolidates the purchase experience into one page (Ricardo-style)
 */
export default function OrdersRedirectPage() {
  redirect('/my-watches/buying/purchased')
}
