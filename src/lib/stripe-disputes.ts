/**
 * Stripe Dispute Integration
 *
 * Handles payment holds and refunds for the dispute system.
 * Since we don't have true escrow, we use Stripe's refund capabilities
 * to process refunds when disputes are resolved in favor of buyers.
 */

import Stripe from 'stripe'

// Initialize Stripe (only if API key is available)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-11-20.acacia' })
  : null

export interface StripeRefundResult {
  success: boolean
  refundId?: string
  status?: string
  amount?: number
  error?: string
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!stripe
}

/**
 * Process a refund for a dispute resolution
 *
 * @param paymentIntentId - The Stripe PaymentIntent ID from the original purchase
 * @param amount - Optional amount to refund (in CHF). If not provided, full refund.
 * @param reason - Reason for the refund
 * @returns RefundResult with success status and refund details
 */
export async function processDisputeRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<StripeRefundResult> {
  if (!stripe) {
    console.warn('[stripe-disputes] Stripe is not configured. Simulating refund.')
    return {
      success: true,
      refundId: `sim_refund_${Date.now()}`,
      status: 'simulated',
      amount: amount || 0,
    }
  }

  try {
    // Create refund
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        dispute_reason: reason || 'Dispute resolved',
        refund_type: 'dispute_resolution',
      },
    }

    // If partial refund, specify amount in cents
    if (amount) {
      refundParams.amount = Math.round(amount * 100) // Convert CHF to cents
    }

    const refund = await stripe.refunds.create(refundParams)

    console.log(`[stripe-disputes] Refund created: ${refund.id}, status: ${refund.status}`)

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100, // Convert cents to CHF
    }
  } catch (error: any) {
    console.error('[stripe-disputes] Error processing refund:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'charge_already_refunded') {
        return {
          success: false,
          error: 'Diese Zahlung wurde bereits erstattet.',
        }
      }
      if (error.code === 'charge_disputed') {
        return {
          success: false,
          error: 'Diese Zahlung ist bereits in einem Stripe-Dispute.',
        }
      }
    }

    return {
      success: false,
      error: error.message || 'Unbekannter Fehler bei der Rückerstattung',
    }
  }
}

/**
 * Get refund status
 */
export async function getRefundStatus(refundId: string): Promise<{
  status: string
  amount: number
  created: Date
} | null> {
  if (!stripe) {
    return null
  }

  try {
    const refund = await stripe.refunds.retrieve(refundId)
    return {
      status: refund.status || 'unknown',
      amount: refund.amount / 100,
      created: new Date(refund.created * 1000),
    }
  } catch (error) {
    console.error('[stripe-disputes] Error getting refund status:', error)
    return null
  }
}

/**
 * Check if a PaymentIntent can be refunded
 */
export async function canRefund(paymentIntentId: string): Promise<{
  canRefund: boolean
  reason?: string
  availableAmount?: number
}> {
  if (!stripe) {
    return { canRefund: true, reason: 'Stripe not configured - simulation mode' }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges.data.refunds'],
    })

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return {
        canRefund: false,
        reason: 'Zahlung war nicht erfolgreich',
      }
    }

    // Get the charge
    const charge = paymentIntent.latest_charge
    if (!charge || typeof charge === 'string') {
      return {
        canRefund: false,
        reason: 'Keine Charge-Informationen verfügbar',
      }
    }

    // Check if already fully refunded
    if (charge.refunded) {
      return {
        canRefund: false,
        reason: 'Zahlung wurde bereits vollständig erstattet',
      }
    }

    // Calculate available refund amount
    const totalRefunded = charge.amount_refunded || 0
    const availableAmount = (charge.amount - totalRefunded) / 100

    if (availableAmount <= 0) {
      return {
        canRefund: false,
        reason: 'Kein Betrag mehr zur Erstattung verfügbar',
      }
    }

    return {
      canRefund: true,
      availableAmount,
    }
  } catch (error: any) {
    console.error('[stripe-disputes] Error checking refund eligibility:', error)
    return {
      canRefund: false,
      reason: error.message || 'Fehler bei der Prüfung',
    }
  }
}

/**
 * Create a Stripe dispute evidence submission
 * Used when a customer opens a dispute directly with their bank (chargeback)
 */
export async function submitDisputeEvidence(
  disputeId: string,
  evidence: {
    productDescription?: string
    customerName?: string
    customerEmail?: string
    shippingDate?: Date
    shippingCarrier?: string
    shippingTrackingNumber?: string
    customerCommunication?: string
    uncategorizedText?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!stripe) {
    return { success: true } // Simulate success
  }

  try {
    await stripe.disputes.update(disputeId, {
      evidence: {
        product_description: evidence.productDescription,
        customer_name: evidence.customerName,
        customer_email_address: evidence.customerEmail,
        shipping_date: evidence.shippingDate
          ? Math.floor(evidence.shippingDate.getTime() / 1000).toString()
          : undefined,
        shipping_carrier: evidence.shippingCarrier,
        shipping_tracking_number: evidence.shippingTrackingNumber,
        customer_communication: evidence.customerCommunication,
        uncategorized_text: evidence.uncategorizedText,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('[stripe-disputes] Error submitting dispute evidence:', error)
    return {
      success: false,
      error: error.message || 'Fehler beim Einreichen der Beweise',
    }
  }
}

/**
 * Handle Stripe dispute webhook events
 * Call this from your webhook handler when receiving dispute events
 */
export async function handleDisputeWebhook(
  event: Stripe.Event
): Promise<{ handled: boolean; action?: string }> {
  switch (event.type) {
    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      console.log(`[stripe-disputes] New dispute created: ${dispute.id}`)
      // You might want to create an internal dispute record or notify admins
      return { handled: true, action: 'dispute_created' }
    }

    case 'charge.dispute.updated': {
      const dispute = event.data.object as Stripe.Dispute
      console.log(`[stripe-disputes] Dispute updated: ${dispute.id}, status: ${dispute.status}`)
      return { handled: true, action: 'dispute_updated' }
    }

    case 'charge.dispute.closed': {
      const dispute = event.data.object as Stripe.Dispute
      console.log(`[stripe-disputes] Dispute closed: ${dispute.id}, status: ${dispute.status}`)
      // Update internal records based on outcome
      return { handled: true, action: `dispute_closed_${dispute.status}` }
    }

    default:
      return { handled: false }
  }
}
