# Comprehensive Notification & Email Audit Report
## Helvenda Platform - Complete System Review

**Date:** 2025-01-27
**Scope:** All internal notifications and email notifications sent to users

---

## Executive Summary

This audit reviewed all notification types (in-app) and email notifications in the Helvenda platform. The review identified several issues that need to be addressed to ensure all notifications work correctly, respect user preferences, and provide accurate, up-to-date information.

---

## 1. INTERNAL NOTIFICATIONS (In-App)

### 1.1 Notification Types Found

| Type | Created In | Status | Issues |
|------|-----------|--------|--------|
| `BID` | `api/bids/route.ts` | ✅ Working | None |
| `QUESTION` | `api/questions/route.ts` | ✅ Working | None |
| `PURCHASE` | Multiple locations | ⚠️ Issues | See below |
| `PRICE_OFFER_RECEIVED` | `api/offers/route.ts` | ✅ Working | None |
| `PRICE_OFFER_UPDATED` | Not found | ❌ Missing | Should exist |
| `PRICE_OFFER_ACCEPTED` | `api/offers/[id]/route.ts` | ⚠️ Needs check | See below |
| `PRICE_OFFER_REJECTED` | Not found | ❌ Missing | Should exist |
| `NEW_INVOICE` | `lib/invoice.ts` | ✅ Working | None |
| `PAYMENT_REQUEST` | `lib/invoice-reminders.ts` | ✅ Working | None |
| `PAYMENT_REMINDER` | `lib/invoice-reminders.ts` | ✅ Working | None |
| `ACCOUNT_BLOCKED` | `lib/invoice-reminders.ts` | ✅ Working | None |
| `ACCOUNT_UNBLOCKED` | `lib/invoice-reminders.ts` | ✅ Working | None |
| `SEARCH_MATCH` | `lib/search-subscription-matcher.ts` | ✅ Working | None |
| `USER_REPORTED` | `api/users/[id]/report/route.ts` | ✅ Working | None |
| `WARNING` | `api/admin/users/[userId]/warn/route.ts` | ✅ Working | None |

### 1.2 Issues Found

#### Issue #1: Missing Price Offer Update Notification
**Location:** `api/offers/[id]/route.ts`
**Problem:** When a price offer is updated, no notification is created
**Impact:** Users won't know when their offer was updated
**Fix Required:** Add notification creation when offer is updated

#### Issue #2: Missing Price Offer Rejection Notification
**Location:** `api/offers/[id]/route.ts`
**Problem:** When a price offer is rejected, no notification is created
**Impact:** Buyers won't know their offer was rejected
**Fix Required:** Add notification creation when offer is rejected

#### Issue #3: Dispute Notification Type Inconsistency
**Location:** `api/purchases/[id]/dispute/route.ts`
**Problem:** Dispute notifications use `PURCHASE` type instead of dedicated `DISPUTE_OPENED` type
**Impact:** Harder to filter and display dispute notifications
**Fix Required:** Create dedicated `DISPUTE_OPENED`, `DISPUTE_RESOLVED`, `DISPUTE_ESCALATED` types

#### Issue #4: Missing Auction End Notifications
**Location:** `api/auctions/check-expired/route.ts`
**Problem:** No notification sent to buyers who lost the auction
**Impact:** Buyers don't know the auction ended and they didn't win
**Fix Required:** Add notification for losing bidders

---

## 2. EMAIL NOTIFICATIONS

### 2.1 Email Types Found

| Email Type | Template Function | Sent From | Preference Check | Status |
|-----------|-------------------|-----------|------------------|--------|
| Email Verification | `getEmailVerificationEmail` | `api/auth/register/route.ts` | N/A | ✅ Working |
| Verification Approval | `getVerificationApprovalEmail` | `api/admin/verifications/[userId]/approve/route.ts` | N/A | ✅ Working |
| Bid Confirmation | `getBidConfirmationEmail` | `api/bids/route.ts` | ❌ Missing | ⚠️ Issue |
| Outbid Notification | `getOutbidNotificationEmail` | `api/bids/route.ts` | ✅ Checked | ✅ Working |
| Bid Notification (Seller) | `getBidNotificationEmail` | `api/bids/route.ts` | ✅ Checked | ✅ Working |
| Auction End Won | `getAuctionEndWonEmail` | Not found | ❌ Missing | ❌ Not sent |
| Auction End Lost | `getAuctionEndLostEmail` | Not found | ❌ Missing | ❌ Not sent |
| Auction End Seller | `getAuctionEndSellerEmail` | Not found | ❌ Missing | ❌ Not sent |
| Purchase Confirmation | `getPurchaseConfirmationEmail` | Multiple | ✅ Checked | ✅ Working |
| Sale Notification | `getSaleNotificationEmail` | Multiple | ✅ Checked | ✅ Working |
| Payment Request | `getPaymentRequestEmail` | `lib/invoice-reminders.ts` | N/A | ✅ Working |
| First Reminder | `getFirstReminderEmail` | `lib/invoice-reminders.ts` | N/A | ✅ Working |
| Second Reminder | `getSecondReminderEmail` | `lib/invoice-reminders.ts` | N/A | ✅ Working |
| Final Reminder | `getFinalReminderEmail` | `lib/invoice-reminders.ts` | N/A | ✅ Working |
| Contact Deadline Warning | `getContactDeadlineWarningEmail` | `api/purchases/check-contact-deadline/route.ts` | N/A | ✅ Working |
| Payment Reminder | `getPaymentReminderEmail` | `api/purchases/check-payment-deadline/route.ts` | N/A | ✅ Working |
| Invoice Notification | `getInvoiceNotificationEmail` | Not found | N/A | ❌ Not sent |
| Review Notification | `getReviewNotificationEmail` | `api/purchases/[id]/review/route.ts` | ❌ Missing | ⚠️ Issue |
| Shipping Notification | `getShippingNotificationEmail` | `api/purchases/[id]/shipping/route.ts` | ❌ Missing | ⚠️ Issue |
| Payment Received | `getPaymentReceivedEmail` | `api/purchases/[id]/confirm-payment/route.ts` | ❌ Missing | ⚠️ Issue |
| Price Offer Received | `getPriceOfferReceivedEmail` | `api/offers/route.ts` | ❌ Missing | ⚠️ Issue |
| Price Offer Accepted | `getPriceOfferAcceptedEmail` | `api/offers/[id]/route.ts` | ❌ Missing | ⚠️ Issue |
| Answer Notification | `getAnswerNotificationEmail` | `api/messages/route.ts` | ✅ Checked | ✅ Working |
| Search Match Found | `getSearchMatchFoundEmail` | `lib/search-subscription-matcher.ts` | ✅ Checked | ✅ Working |
| Dispute Opened | `getDisputeOpenedEmail` | `api/purchases/[id]/dispute/route.ts` | ❌ Missing | ⚠️ Issue |
| Dispute Escalated | `getDisputeEscalatedEmail` | Not found | ❌ Missing | ❌ Not sent |
| Dispute Resolved | `getDisputeResolvedEmail` | Not found | ❌ Missing | ❌ Not sent |
| Refund Required | `getRefundRequiredEmail` | Not found | ❌ Missing | ❌ Not sent |
| Seller Warning | `getSellerWarningEmail` | Not found | ❌ Missing | ❌ Not sent |

### 2.2 Critical Issues

#### Issue #5: Bid Confirmation Email Missing Preference Check
**Location:** `api/bids/route.ts:620-639`
**Problem:** Bid confirmation email is sent without checking `emailOnNewBid` preference
**Impact:** Users receive emails even if they disabled this notification
**Fix Required:** Add `shouldSendNotification(userId, 'emailOnNewBid')` check

#### Issue #6: Auction End Emails Not Sent
**Location:** `api/auctions/check-expired/route.ts`
**Problem:**
- No email sent to winning buyer (`getAuctionEndWonEmail`)
- No email sent to losing bidders (`getAuctionEndLostEmail`)
- No email sent to seller (`getAuctionEndSellerEmail`)
**Impact:** Users don't receive important auction end notifications
**Fix Required:** Add email sending logic for all three scenarios

#### Issue #7: Missing Preference Checks for Multiple Emails
**Locations:** Multiple
**Problem:** These emails don't check user preferences:
- Review Notification
- Shipping Notification
- Payment Received
- Price Offer Received
- Price Offer Accepted
- Dispute Opened
**Impact:** Users receive emails even when preferences are disabled
**Fix Required:** Add appropriate preference checks

#### Issue #8: Invoice Notification Email Never Sent
**Location:** `lib/invoice.ts`
**Problem:** `getInvoiceNotificationEmail` template exists but is never called
**Impact:** Sellers don't receive email when invoice is created
**Fix Required:** Add email sending in `calculateInvoiceForSale` function

#### Issue #9: Dispute Emails Missing
**Locations:** Multiple
**Problem:** These dispute-related emails are never sent:
- `getDisputeEscalatedEmail`
- `getDisputeResolvedEmail`
- `getRefundRequiredEmail`
- `getSellerWarningEmail`
**Impact:** Users don't receive important dispute updates
**Fix Required:** Add email sending in appropriate dispute handlers

---

## 3. URL/LINK ISSUES

### 3.1 Incorrect URLs Found

#### Issue #10: Inconsistent URL Patterns
**Problem:** Some emails use `/watches/{id}` while others use `/products/{id}`
**Locations:**
- `getBidConfirmationEmail` uses `/watches/{id}` (line 18 in auction/index.ts)
- `getOutbidNotificationEmail` uses `/watches/{id}` (line 49 in auction/index.ts)
- `getSearchMatchFoundEmail` uses `/products/{id}` (line 62 in search-subscription-matcher.ts)

**Impact:** Broken links in emails
**Fix Required:** Standardize to `/products/{id}` (current standard)

#### Issue #11: German URLs in English Context
**Problem:** Some URLs use German paths like `/meine-kaeufe`, `/meine-verkaeufe`
**Impact:** Inconsistent with potential multi-language support
**Fix Required:** Consider using English paths or language-aware routing

---

## 4. TEMPLATE ISSUES

### 4.1 Missing Parameters

#### Issue #12: getSaleNotificationEmail Signature Mismatch
**Location:** `lib/email/templates/notifications/index.ts:11-17`
**Problem:** Template function signature doesn't match usage:
- Template expects: `(sellerName, buyerName, watchTitle, price, watchId)`
- Usage in `api/bids/route.ts:316` passes: `(sellerName, buyerName, watchTitle, price, 'buy-now', watchId, imageUrl, buyerRating, buyerReviewCount)`
- Usage in `api/auctions/check-expired/route.ts:172` passes: `(sellerName, buyerName, watchTitle, price, 'auction', watchId, imageUrl, buyerRating, buyerReviewCount)`

**Impact:** Extra parameters ignored, missing features
**Fix Required:** Update template signature to match usage

#### Issue #13: getPurchaseConfirmationEmail Signature Mismatch
**Location:** `lib/email/templates/purchase/index.ts:11-16`
**Problem:** Template function signature doesn't match usage:
- Template expects: `(buyerName, watchTitle, price, sellerName, purchaseId)`
- Usage passes: `(buyerName, sellerName, watchTitle, price, shippingCost, type, purchaseId, watchId, paymentInfo, imageUrl, sellerRating, sellerReviewCount)`

**Impact:** Missing important information in emails
**Fix Required:** Update template signature to match usage

---

## 5. NOTIFICATION PREFERENCES

### 5.1 Preference Types Defined

From `lib/notification-preferences.ts`:
- `emailOnNewMessage` ✅
- `emailOnNewBid` ✅
- `emailOnNewOffer` ✅
- `emailOnSaleCompleted` ✅
- `emailOnOutbid` ✅
- `emailOnAuctionEnding` ✅
- `emailOnPurchase` ✅
- `emailOnShipping` ✅
- `emailOnSearchMatch` ✅
- `emailOnFavoritePriceChange` ✅
- `emailMarketing` ✅

### 5.2 Missing Preference Checks

| Email Type | Should Check | Currently Checks | Status |
|-----------|--------------|------------------|--------|
| Bid Confirmation | `emailOnNewBid` | ❌ No | ⚠️ Missing |
| Review Notification | `emailOnReview` | ❌ No | ⚠️ Missing (preference doesn't exist) |
| Shipping Notification | `emailOnShipping` | ❌ No | ⚠️ Missing |
| Payment Received | `emailOnPayment` | ❌ No | ⚠️ Missing (preference doesn't exist) |
| Price Offer Received | `emailOnNewOffer` | ❌ No | ⚠️ Missing |
| Price Offer Accepted | `emailOnNewOffer` | ❌ No | ⚠️ Missing |
| Dispute Opened | `emailOnDispute` | ❌ No | ⚠️ Missing (preference doesn't exist) |

---

## 6. PRIORITY FIXES

### High Priority (Critical Functionality)

1. **Fix getSaleNotificationEmail signature** - Currently broken
2. **Fix getPurchaseConfirmationEmail signature** - Currently broken
3. **Add auction end emails** - Missing critical notifications
4. **Add preference check for bid confirmation** - Respects user settings
5. **Standardize URL patterns** - Fix broken links

### Medium Priority (User Experience)

6. **Add missing price offer notifications** - Better UX
7. **Add preference checks for all emails** - Respect user preferences
8. **Add dispute email notifications** - Important updates
9. **Add invoice notification email** - Currently never sent
10. **Create dedicated dispute notification types** - Better organization

### Low Priority (Nice to Have)

11. **Add missing preference types** - emailOnReview, emailOnPayment, emailOnDispute
12. **Standardize URL language** - Multi-language support
13. **Add auction end lost notifications** - For losing bidders

---

## 7. RECOMMENDATIONS

1. **Create a notification/email registry** - Centralized list of all notifications and emails
2. **Add integration tests** - Test all notification and email flows
3. **Add email preview system** - Allow admins to preview all email templates
4. **Document notification preferences** - Clear documentation of what each preference controls
5. **Add notification analytics** - Track which notifications are most/least effective

---

## 8. FILES TO REVIEW/MODIFY

### High Priority Files
- `src/lib/email/templates/notifications/index.ts` - Fix getSaleNotificationEmail
- `src/lib/email/templates/purchase/index.ts` - Fix getPurchaseConfirmationEmail
- `src/app/api/bids/route.ts` - Add preference check, fix URLs
- `src/app/api/auctions/check-expired/route.ts` - Add auction end emails
- `src/lib/invoice.ts` - Add invoice notification email

### Medium Priority Files
- `src/app/api/offers/[id]/route.ts` - Add missing notifications
- `src/app/api/purchases/[id]/dispute/route.ts` - Add dispute emails
- `src/lib/notification-preferences.ts` - Add missing preference types
- `src/lib/email/templates/auction/index.ts` - Fix URLs

---

## Conclusion

The notification and email system is functional but has several gaps and inconsistencies. The most critical issues are:
1. Template signature mismatches causing missing data
2. Missing auction end notifications
3. Missing preference checks
4. Inconsistent URL patterns

Addressing these issues will significantly improve the user experience and ensure all notifications work as expected.
