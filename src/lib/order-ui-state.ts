/**
 * Order UI State Helper
 * Provides clean, state-driven UI configuration for purchase cards
 */

import { MyPurchaseItem } from './my-purchases'
import { PurchaseStateInfo } from './purchase-state-machine'

export interface OrderUIState {
  statusLabel: string
  statusTone: 'neutral' | 'warn' | 'success' | 'danger'
  primaryAction: {
    label: string
    onClick: () => void
    icon?: string
    variant?: 'primary' | 'danger'
  } | null
  secondaryActions: Array<{
    label: string
    onClick: () => void
    icon?: string
  }>
  deadlineText: string | null
  showDetails: boolean
}

/**
 * Get UI state for an order card
 * Ensures only one primary action and no contradictory actions
 */
export function getOrderUIState(
  purchase: MyPurchaseItem,
  stateInfo: PurchaseStateInfo,
  handlers: {
    onContactSeller: () => void
    onPay: () => void
    onConfirmReceipt: () => void
    onViewDispute: () => void
    onCancel?: () => void
    onShowDetails: () => void
  },
  isExpanded: boolean,
  isProcessingPayment: boolean
): OrderUIState {
  const secondaryActions: OrderUIState['secondaryActions'] = []
  let primaryAction: OrderUIState['primaryAction'] = null
  let deadlineText: string | null = null

  // Build deadline text
  if (stateInfo.deadline?.date) {
    const days = stateInfo.deadline.daysRemaining
    if (stateInfo.deadline.isOverdue) {
      deadlineText = `Frist überschritten`
    } else if (days !== null && days > 0) {
      if (stateInfo.state === 'CONTACT_PENDING') {
        deadlineText = `Bitte innerhalb von ${days} Tag${days !== 1 ? 'en' : ''} kontaktieren`
      } else if (stateInfo.state === 'PAYMENT_PENDING') {
        deadlineText = `Zahlung innerhalb von ${days} Tag${days !== 1 ? 'en' : ''}`
      } else {
        deadlineText = `${days} Tag${days !== 1 ? 'e' : ''} verbleibend`
      }
    } else {
      if (stateInfo.state === 'CONTACT_PENDING') {
        deadlineText = `Bitte heute kontaktieren`
      } else if (stateInfo.state === 'PAYMENT_PENDING') {
        deadlineText = `Zahlung heute fällig`
      }
    }
  }

  // Determine status tone
  let statusTone: OrderUIState['statusTone'] = 'neutral'
  if (stateInfo.state === 'COMPLETED') {
    statusTone = 'success'
  } else if (stateInfo.state === 'DISPUTE_OPEN' || stateInfo.deadline?.isOverdue) {
    statusTone = 'danger'
  } else if (
    stateInfo.state === 'CONTACT_PENDING' ||
    stateInfo.state === 'PAYMENT_PENDING' ||
    stateInfo.state === 'RECEIPT_PENDING'
  ) {
    statusTone = 'warn'
  }

  // Check if this is a protected purchase where Stripe payment should be primary
  const hasProtection = purchase.paymentProtectionEnabled
  const sellerHasStripe =
    purchase.watch.seller?.stripeConnectedAccountId &&
    purchase.watch.seller?.stripeOnboardingComplete
  const canPayViaStripe = hasProtection && sellerHasStripe

  // Primary action based on state (only one!)
  if (stateInfo.nextAction) {
    switch (stateInfo.nextAction.action) {
      case 'contact_seller':
        // For protected purchases with Stripe, show "Sicher bezahlen" as primary even in CONTACT_PENDING
        // The buyer can pay immediately via Stripe without needing to contact seller first
        if (canPayViaStripe) {
          primaryAction = {
            label: isProcessingPayment ? 'Wird vorbereitet...' : 'Sicher bezahlen',
            onClick: handlers.onPay,
            icon: 'Shield',
            variant: 'primary',
          }
        } else {
          primaryAction = {
            label: 'Verkäufer kontaktieren',
            onClick: handlers.onContactSeller,
            icon: 'MessageSquare',
            variant: 'primary',
          }
        }
        break

      case 'pay':
        primaryAction = {
          label: isProcessingPayment
            ? 'Wird vorbereitet...'
            : canPayViaStripe
              ? 'Sicher bezahlen'
              : 'Jetzt bezahlen',
          onClick: handlers.onPay,
          icon: canPayViaStripe ? 'Shield' : 'CreditCard',
          variant: 'primary',
        }
        break

      case 'confirm_receipt':
        // Only show if item is shipped (has tracking or shippedAt)
        if (purchase.trackingNumber || purchase.shippedAt || purchase.paymentConfirmed) {
          primaryAction = {
            label: 'Erhalt bestätigen',
            onClick: handlers.onConfirmReceipt,
            icon: 'PackageCheck',
            variant: 'primary',
          }
        }
        break

      case 'view_dispute':
        primaryAction = {
          label: 'Problem ansehen',
          onClick: handlers.onViewDispute,
          icon: 'AlertCircle',
          variant: 'danger',
        }
        break
    }
  }

  // Secondary actions (only when primary action exists and state allows)
  // Never show contradictory actions
  if (stateInfo.state === 'CONTACT_PENDING') {
    // For protected purchases, "Sicher bezahlen" is primary, so contact seller is secondary
    if (canPayViaStripe) {
      secondaryActions.push({
        label: 'Verkäufer kontaktieren',
        onClick: handlers.onContactSeller,
        icon: 'MessageSquare',
      })
    }
    // For unprotected purchases, contact seller is primary, no secondary actions
  } else if (stateInfo.state === 'PAYMENT_PENDING') {
    // Payment is primary, contact seller is secondary
    secondaryActions.push({
      label: 'Verkäufer kontaktieren',
      onClick: handlers.onContactSeller,
      icon: 'MessageSquare',
    })
  } else if (stateInfo.state === 'RECEIPT_PENDING') {
    // Confirm receipt is primary, contact seller is secondary
    secondaryActions.push({
      label: 'Verkäufer kontaktieren',
      onClick: handlers.onContactSeller,
      icon: 'MessageSquare',
    })
  } else if (stateInfo.state === 'PAYMENT_CONFIRMED' || stateInfo.state === 'SHIPPED') {
    // Waiting for seller, contact is secondary
    secondaryActions.push({
      label: 'Verkäufer kontaktieren',
      onClick: handlers.onContactSeller,
      icon: 'MessageSquare',
    })
  } else if (stateInfo.state === 'COMPLETED') {
    // Completed - no actions needed
  } else if (stateInfo.state === 'DISPUTE_OPEN') {
    // Dispute is primary, contact seller is secondary
    secondaryActions.push({
      label: 'Verkäufer kontaktieren',
      onClick: handlers.onContactSeller,
      icon: 'MessageSquare',
    })
  }

  // Cancel option (only in expanded view and only if allowed)
  if (
    isExpanded &&
    handlers.onCancel &&
    purchase.status === 'pending' &&
    purchase.contactDeadlineMissed &&
    !purchase.sellerContactedAt
  ) {
    secondaryActions.push({
      label: 'Kauf stornieren',
      onClick: handlers.onCancel,
      icon: 'AlertCircle',
    })
  }

  return {
    statusLabel: stateInfo.label,
    statusTone,
    primaryAction,
    secondaryActions,
    deadlineText,
    showDetails: isExpanded,
  }
}
