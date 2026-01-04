/**
 * Email Module - Main Entry Point
 *
 * Centralized email system for Helvenda platform
 *
 * Usage:
 *   import { sendEmail, templates } from '@/lib/email'
 *   const { subject, html } = templates.auth.getEmailVerificationEmail(...)
 *   await sendEmail({ to, subject, html })
 */

// Core functionality
export { sendEmail, type SendEmailOptions, type SendEmailResult } from './sender'
export { getEmailBaseUrl, getFromEmail, resend, transporter } from './config'
export {
  getHelvendaEmailTemplate,
  getHelvendaEmailTemplateLegacy,
  type EmailTemplateOptions,
} from './base-template'

// Auth templates
export {
  getEmailVerificationEmail,
  getVerificationApprovalEmail,
} from './templates/auth/verification'

// Auction templates
export {
  getBidConfirmationEmail,
  getOutbidNotificationEmail,
  getAuctionEndWonEmail,
  getAuctionEndSellerEmail,
  getBidNotificationEmail,
} from './templates/auction'

// Purchase templates
export {
  getPurchaseConfirmationEmail,
  getPaymentRequestEmail,
  getContactDeadlineWarningEmail,
  getPaymentReminderEmail,
  getInvoiceNotificationEmail,
  getListingConfirmationEmail,
} from './templates/purchase'

// Notification templates
export {
  getSaleNotificationEmail,
  getReviewNotificationEmail,
  getShippingNotificationEmail,
  getPaymentReceivedEmail,
  getPriceOfferReceivedEmail,
  getPriceOfferAcceptedEmail,
  getAnswerNotificationEmail,
  getSearchMatchFoundEmail,
} from './templates/notifications'

// Dispute templates
export {
  getDisputeOpenedEmail,
  getDisputeEscalatedEmail,
  getDisputeResolvedEmail,
  getRefundRequiredEmail,
  getSellerWarningEmail,
} from './templates/dispute'

// Grouped exports for namespace-style imports
export const templates = {
  auth: {
    getEmailVerificationEmail: (userName: string, verificationUrl: string) =>
      import('./templates/auth/verification').then(m =>
        m.getEmailVerificationEmail(userName, verificationUrl)
      ),
    getVerificationApprovalEmail: (userName: string, userEmail: string) =>
      import('./templates/auth/verification').then(m =>
        m.getVerificationApprovalEmail(userName, userEmail)
      ),
  },
}
