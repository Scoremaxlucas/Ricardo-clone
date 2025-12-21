/**
 * Purchase State Machine
 * Defines clear states and next actions for purchase management (Ricardo-like)
 */

export type PurchaseState =
  | 'CONTACT_PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'SHIPPED'
  | 'RECEIPT_PENDING'
  | 'RECEIPT_CONFIRMED'
  | 'COMPLETED'
  | 'DISPUTE_OPEN'
  | 'CANCELLED'

export interface PurchaseStateInfo {
  state: PurchaseState
  label: string
  description: string
  nextAction: {
    label: string
    type: 'primary' | 'secondary' | 'danger'
    action: string
  } | null
  deadline?: {
    label: string
    date: Date | null
    isOverdue: boolean
    daysRemaining: number | null
  }
}

/**
 * Compute purchase state from purchase data
 */
export function computePurchaseState(purchase: {
  status: string
  contactDeadline: string | null
  sellerContactedAt: string | null
  buyerContactedAt: string | null
  contactDeadlineMissed: boolean
  paymentDeadline: string | null
  paymentConfirmed: boolean
  paymentDeadlineMissed: boolean
  paid: boolean
  itemReceived: boolean
  trackingNumber: string | null
  shippedAt: string | null
  disputeOpenedAt: string | null
  disputeStatus: string | null
}): PurchaseState {
  // Cancelled takes precedence
  if (purchase.status === 'cancelled') {
    return 'CANCELLED'
  }

  // Dispute takes precedence over other states
  if (purchase.disputeOpenedAt && purchase.disputeStatus !== 'resolved') {
    return 'DISPUTE_OPEN'
  }

  // Completed
  if (purchase.status === 'completed' || (purchase.itemReceived && purchase.paymentConfirmed)) {
    return 'COMPLETED'
  }

  // Receipt confirmed but not completed
  if (purchase.itemReceived) {
    return 'RECEIPT_CONFIRMED'
  }

  // Receipt pending (shipped but not received)
  if (purchase.trackingNumber || purchase.shippedAt) {
    return 'RECEIPT_PENDING'
  }

  // Shipped (payment confirmed but not yet tracked)
  if (purchase.paymentConfirmed || purchase.paid) {
    return 'SHIPPED'
  }

  // Payment confirmed
  if (purchase.paymentConfirmed) {
    return 'PAYMENT_CONFIRMED'
  }

  // Payment pending (contact made, waiting for payment)
  if (purchase.sellerContactedAt || purchase.buyerContactedAt) {
    return 'PAYMENT_PENDING'
  }

  // Contact pending (no contact yet)
  return 'CONTACT_PENDING'
}

/**
 * Get state info with labels and next action
 */
export function getPurchaseStateInfo(
  purchase: {
    status: string
    contactDeadline: string | null
    sellerContactedAt: string | null
    buyerContactedAt: string | null
    contactDeadlineMissed: boolean
    paymentDeadline: string | null
    paymentConfirmed: boolean
    paymentDeadlineMissed: boolean
    paid: boolean
    itemReceived: boolean
    trackingNumber: string | null
    shippedAt: string | null
    disputeOpenedAt: string | null
    disputeStatus: string | null
  },
  purchaseId: string
): PurchaseStateInfo {
  const state = computePurchaseState(purchase)
  const now = new Date()

  switch (state) {
    case 'CONTACT_PENDING': {
      const contactDeadline = purchase.contactDeadline ? new Date(purchase.contactDeadline) : null
      const daysRemaining = contactDeadline
        ? Math.ceil((contactDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const isOverdue =
        purchase.contactDeadlineMissed || (contactDeadline ? contactDeadline < now : false)

      return {
        state,
        label: 'Kontakt ausstehend',
        description: 'Warten auf Kontaktaufnahme durch Verkäufer',
        nextAction: {
          label: 'Verkäufer kontaktieren',
          type: 'primary',
          action: 'contact_seller',
        },
        deadline: {
          label: 'Kontakt innerhalb 7 Tagen',
          date: contactDeadline,
          isOverdue,
          daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null,
        },
      }
    }

    case 'PAYMENT_PENDING': {
      const paymentDeadline = purchase.paymentDeadline ? new Date(purchase.paymentDeadline) : null
      const daysRemaining = paymentDeadline
        ? Math.ceil((paymentDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null
      const isOverdue =
        purchase.paymentDeadlineMissed || (paymentDeadline ? paymentDeadline < now : false)

      return {
        state,
        label: 'Zahlung ausstehend',
        description: 'Bitte überweisen Sie den Betrag an den Verkäufer',
        nextAction: {
          label: 'Jetzt bezahlen',
          type: 'primary',
          action: 'pay',
        },
        deadline: {
          label: 'Zahlung innerhalb 14 Tagen',
          date: paymentDeadline,
          isOverdue,
          daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null,
        },
      }
    }

    case 'PAYMENT_CONFIRMED': {
      return {
        state,
        label: 'Zahlung bestätigt',
        description: 'Zahlung wurde bestätigt. Der Verkäufer wird die Ware versenden.',
        nextAction: null,
      }
    }

    case 'SHIPPED': {
      return {
        state,
        label: 'Versandt',
        description: 'Die Ware wurde versendet',
        nextAction: null,
      }
    }

    case 'RECEIPT_PENDING': {
      return {
        state,
        label: 'Erhalt ausstehend',
        description: 'Bitte bestätigen Sie den Erhalt der Ware',
        nextAction: {
          label: 'Erhalt bestätigen',
          type: 'primary',
          action: 'confirm_receipt',
        },
      }
    }

    case 'RECEIPT_CONFIRMED': {
      return {
        state,
        label: 'Erhalt bestätigt',
        description: 'Sie haben den Erhalt bestätigt',
        nextAction: null,
      }
    }

    case 'COMPLETED': {
      return {
        state,
        label: 'Abgeschlossen',
        description: 'Der Kauf wurde erfolgreich abgeschlossen',
        nextAction: null,
      }
    }

    case 'DISPUTE_OPEN': {
      return {
        state,
        label: 'Problem gemeldet',
        description: 'Ein Problem wurde gemeldet und wird bearbeitet',
        nextAction: {
          label: 'Problem ansehen',
          type: 'secondary',
          action: 'view_dispute',
        },
      }
    }

    case 'CANCELLED': {
      return {
        state,
        label: 'Storniert',
        description: 'Dieser Kauf wurde storniert',
        nextAction: null,
      }
    }

    default: {
      return {
        state: 'CONTACT_PENDING',
        label: 'Ausstehend',
        description: 'Status wird ermittelt...',
        nextAction: null,
      }
    }
  }
}
